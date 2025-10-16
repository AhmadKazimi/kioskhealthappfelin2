import { io, Socket } from 'socket.io-client';

// TypeScript Interfaces
export interface SocketConnectionParams {
  bpCalibrated: boolean;
  checkArrhythmias: boolean;
  checkStroke: boolean;
  client: string;
  engageCarolChat: boolean;
  diastolicAdj?: number;
  longMeasurement: boolean;
  party: string;
  sampleTime: number;
  storeResult: boolean;
  suspectedHypertensive: boolean;
  suspectedHypotensive: boolean;
  systolicAdj?: number;
  user_age: number;
  user_sex: 'female' | 'male';
}

export interface FrameData {
  frameNumber: number;
  imageData: string; // base64 encoded
  remoteVitals: boolean;
  stop: boolean;
  timeLapse: number; // seconds since start
  userEmail: string;
}

export interface VitalsResult {
  calculation_parameters: {
    // Core fields
    face_detected: boolean;
    finger_detected: boolean;
    fps: number;
    stable_readings: boolean;
    timeout: boolean;

    // Additional diagnostic fields (optional for backward compatibility)
    all_frames_processed?: boolean;
    bb_colour?: number[];
    bb_points?: number[];
    client_timelapse?: number;
    face_moved?: boolean;
    face_rect?: number[];
    fps_frame_processing?: number;
    frames_needed?: number;
    frame_number?: number;
    illumination_changed_count?: number;
    min_rr_intervals_reached?: boolean;
    motion_detected_count?: number;
    N?: number;
    server_timelapse?: number;
  };

  request_parameters?: {
    check_arrhythmias: boolean;
    check_stroke: boolean;
    long_measurement: boolean;
    required_rr_length: number;
    sample_time: number;
  };

  vitals_results: {
    // Core vitals
    heart_rate: number;
    hrv_rate: number;
    resp_rate: number;
    spo2_rate: number;
    perfusion_index: number;
    mean_rr: number;

    // Additional fields from API spec
    confidence: number; // Confidence level (moved from calculation_parameters)
    raw_rr_intervals?: number[];
    resp_rate_motion?: number;
    rr_intervals?: number[];
  };
}

export interface BloodPressureResult {
  bp_calibrated: boolean;
  systolic_blood_pressure: number;
  diastolic_blood_pressure: number;
  calibrated_systolic_blood_pressure?: number;
  calibrated_diastolic_blood_pressure?: number;
  systolic_adj?: number;
  diastolic_adj?: number;
}

export interface ArrhythmiaDetection {
  api_name: string;
  arrhythmia_name: string;
  confidence: number;
  detected: boolean;
  error_msg: string;
  prediction: string;
  request_id: string;
  success: boolean;
}

export interface ArrhythmiaResult {
  atrial_fibrillation: ArrhythmiaDetection;
  atrial_flutter: ArrhythmiaDetection;
  apnea: ArrhythmiaDetection;
  congestive_heart_failure: ArrhythmiaDetection;
  heart_block: ArrhythmiaDetection;
  premature_ventricular_contraction: ArrhythmiaDetection;
  sinus_tachycardia: ArrhythmiaDetection;
  supraventricular_tachycardia: ArrhythmiaDetection;
  ventricular_tachycardia: ArrhythmiaDetection;
}

// Service Implementation
export class FingerprintSocketService {
  private socket: Socket | null = null;
  private startTime: number = 0;
  private connectCallback: (() => void) | null = null;
  private measurementTimer: ReturnType<typeof setTimeout> | null = null;
  private stopRequested = false;
  private timeoutCallback: (() => void) | null = null;
  
  // Frame buffering to ensure at least 6 frames sent before processing responses
  private framesSent: number = 0;
  private responsesQueue: Array<{type: string, data: unknown}> = [];
  private isProcessingResponses: boolean = false;
  private MIN_FRAMES_BEFORE_RESPONSE = 6; // Minimum frames to send before processing responses
  
  // Store callbacks for later processing
  private onVitalsCallback: ((vitals: VitalsResult) => void) | null = null;
  private onBloodPressureCallback: ((bp: BloodPressureResult) => void) | null = null;
  private onArrhythmiaCallback: ((arrhythmia: ArrhythmiaResult) => void) | null = null;
  private onStableReadingsCallback: (() => void) | null = null;
  private onTimeoutCallback: (() => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  private clearMeasurementTimer(): void {
    if (this.measurementTimer) {
      clearTimeout(this.measurementTimer);
      this.measurementTimer = null;
    }
  }

  private processQueuedResponses(): void {
    if (this.isProcessingResponses || this.responsesQueue.length === 0) {
      return;
    }
    
    this.isProcessingResponses = true;
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔄 PROCESSING ${this.responsesQueue.length} QUEUED RESPONSES (after ${this.framesSent} frames sent)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    // Process all queued responses
    while (this.responsesQueue.length > 0) {
      const response = this.responsesQueue.shift();
      if (response) {
        // Trigger the actual callback based on response type
        if (response.type === 'vitals' && this.onVitalsCallback) {
          this.onVitalsCallback(response.data);
        } else if (response.type === 'blood_pressure' && this.onBloodPressureCallback) {
          this.onBloodPressureCallback(response.data);
        } else if (response.type === 'arrhythmia' && this.onArrhythmiaCallback) {
          this.onArrhythmiaCallback(response.data);
        } else if (response.type === 'stable_readings' && this.onStableReadingsCallback) {
          this.onStableReadingsCallback();
        } else if (response.type === 'timeout' && this.onTimeoutCallback) {
          this.onTimeoutCallback();
        }
      }
    }
    
    this.isProcessingResponses = false;
  }

  private scheduleMeasurementTimer(sampleTimeSeconds: number): void {
    this.clearMeasurementTimer();
    const safetyBufferSeconds = 5;
    const timeoutSeconds = Math.max(sampleTimeSeconds, 1) + safetyBufferSeconds;

    this.measurementTimer = setTimeout(() => {
      if (!this.stopRequested) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⏳ AUTO STOP TRIGGERED (no stable readings within expected window)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.sendStopSignal();
        if (this.timeoutCallback) {
          console.log('⏳ Invoking timeout callback due to auto stop');
          this.timeoutCallback();
        }
      }
    }, timeoutSeconds * 1000);
  }

  private attachEventHandlers(
    onVitals: (vitals: VitalsResult) => void,
    onBloodPressure: (bp: BloodPressureResult) => void,
    onArrhythmia: (arrhythmia: ArrhythmiaResult) => void,
    onStableReadings: () => void,
    onTimeout: () => void,
    onError: (error: string) => void
  ): void {
    if (!this.socket) return;

    // Store callbacks for later use
    this.onVitalsCallback = onVitals;
    this.onBloodPressureCallback = onBloodPressure;
    this.onArrhythmiaCallback = onArrhythmia;
    this.onStableReadingsCallback = onStableReadings;
    this.onTimeoutCallback = onTimeout;
    this.onErrorCallback = onError;

    const handleVitalsResult = (data: VitalsResult) => {
      if (!data || !data.calculation_parameters || !data.vitals_results) {
        console.log('⚠️ Ignoring malformed vitals payload:', data);
        return;
      }

      // Log EVERY response with frame number for tracking
      const frameNum = data.calculation_parameters.frame_number || 'unknown';
      const isStable = data.calculation_parameters.stable_readings;
      const isTimeout = data.calculation_parameters.timeout;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 RESPONSE FOR FRAME #${frameNum} ${isStable ? '✅ STABLE' : ''} ${isTimeout ? '⏱️ TIMEOUT' : ''}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Check if we should buffer or process immediately
      if (this.framesSent < this.MIN_FRAMES_BEFORE_RESPONSE) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔄 QUEUING VITALS RESPONSE - Frame #${frameNum}`);
        console.log(`   Only ${this.framesSent} frames sent, need ${this.MIN_FRAMES_BEFORE_RESPONSE}`);
        console.log(`   Queue size: ${this.responsesQueue.length + 1}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.responsesQueue.push({ type: 'vitals', data });
        return;
      }

      // Calculation Parameters (compact format for every frame)
      console.log('📐 Calculation:');
      console.log(`  Frame: ${frameNum} | FPS: ${data.calculation_parameters.fps.toFixed(1)} | Finger: ${data.calculation_parameters.finger_detected ? '✓' : '✗'}`);
      console.log(`  Stable: ${isStable} | Timeout: ${isTimeout} | Server Time: ${data.calculation_parameters.server_timelapse?.toFixed(1)}s`);

      // Vitals Results (compact)
      console.log('💓 Vitals:');
      console.log(`  HR: ${data.vitals_results.heart_rate} BPM | HRV: ${data.vitals_results.hrv_rate} ms | SpO2: ${data.vitals_results.spo2_rate}% | Conf: ${data.vitals_results.confidence.toFixed(0)}%`);

      // Warnings (if any)
      const warnings = [];
      if (data.calculation_parameters.face_moved) warnings.push('Face Moved');
      if (data.calculation_parameters.motion_detected_count) warnings.push(`Motion: ${data.calculation_parameters.motion_detected_count}`);
      if (data.calculation_parameters.illumination_changed_count) warnings.push(`Illumination: ${data.calculation_parameters.illumination_changed_count}`);

      if (warnings.length > 0) {
        console.log('⚠️ Warnings:', warnings.join(', '));
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Process any queued responses first
      this.processQueuedResponses();
      
      // Then pass current vitals to callback
      onVitals(data);

      // CHECK FOR COMPLETION FLAGS IN THE RESULT
      if (isStable) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ STABLE READINGS ACHIEVED - SCAN COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.clearMeasurementTimer();
        onStableReadings();
      }

      if (isTimeout) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⏱️ MEASUREMENT TIMEOUT - INCOMPLETE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.clearMeasurementTimer();
        onTimeout();
      }
    };

    this.socket.on('result', handleVitalsResult);

    // Some environments send everything back on "message" with a subject field.
    this.socket.on('message', (payload: unknown) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📩 MESSAGE EVENT RECEIVED FROM SERVER');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (!payload) {
        return;
      }

      // Format 1: { subject: "result", data: {...} }
      if (payload.subject === 'result' && payload.data) {
        handleVitalsResult(payload.data as VitalsResult);
        return;
      }

      // Format 2: VitalsResult payload sent directly on "message"
      if (payload.calculation_parameters && payload.vitals_results) {
        handleVitalsResult(payload as VitalsResult);
        return;
      }

      // Format 3: blood pressure / arrhythmia / stable / timeout forwarded on "message"
      if (payload.subject === 'blood_pressure_result' && payload.data) {
        if (this.framesSent < this.MIN_FRAMES_BEFORE_RESPONSE) {
          console.log(`🔄 QUEUING BLOOD PRESSURE RESPONSE (only ${this.framesSent} frames sent)`);
          this.responsesQueue.push({ type: 'blood_pressure', data: payload.data });
        } else {
          this.processQueuedResponses();
          onBloodPressure(payload.data as BloodPressureResult);
        }
        return;
      }

      if (payload.subject === 'arrhythmia_result' && payload.data) {
        if (this.framesSent < this.MIN_FRAMES_BEFORE_RESPONSE) {
          console.log(`🔄 QUEUING ARRHYTHMIA RESPONSE (only ${this.framesSent} frames sent)`);
          this.responsesQueue.push({ type: 'arrhythmia', data: payload.data });
        } else {
          this.processQueuedResponses();
          onArrhythmia(payload.data as ArrhythmiaResult);
        }
        return;
      }

      if (payload.subject === 'stable_readings') {
        this.clearMeasurementTimer();
        if (this.framesSent < this.MIN_FRAMES_BEFORE_RESPONSE) {
          console.log(`🔄 QUEUING STABLE READINGS (only ${this.framesSent} frames sent)`);
          this.responsesQueue.push({ type: 'stable_readings', data: null });
        } else {
          this.processQueuedResponses();
          onStableReadings();
        }
        console.log('📨 MESSAGE PAYLOAD INDICATED STABLE READINGS');
        return;
      }

      if (payload.subject === 'timeout') {
        this.clearMeasurementTimer();
        if (this.framesSent < this.MIN_FRAMES_BEFORE_RESPONSE) {
          console.log(`🔄 QUEUING TIMEOUT (only ${this.framesSent} frames sent)`);
          this.responsesQueue.push({ type: 'timeout', data: null });
        } else {
          this.processQueuedResponses();
          onTimeout();
        }
        console.log('📨 MESSAGE PAYLOAD INDICATED TIMEOUT');
        return;
      }

      console.log('📨 MESSAGE PAYLOAD DID NOT MATCH EXPECTED STRUCTURE');
    });

    this.socket.on('blood_pressure_result', (data: BloodPressureResult) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🩺 BLOOD PRESSURE RESULT RECEIVED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (this.framesSent < this.MIN_FRAMES_BEFORE_RESPONSE) {
        console.log(`🔄 QUEUING BLOOD PRESSURE (only ${this.framesSent} frames sent, need ${this.MIN_FRAMES_BEFORE_RESPONSE})`);
        this.responsesQueue.push({ type: 'blood_pressure', data });
        return;
      }

      console.log('Raw Data:', JSON.stringify(data, null, 2));
      console.log('Systolic:', data.systolic_blood_pressure);
      console.log('Diastolic:', data.diastolic_blood_pressure);
      console.log('Calibrated:', data.bp_calibrated);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      this.processQueuedResponses();
      onBloodPressure(data);
    });

    this.socket.on('arrhythmia_result', (data: ArrhythmiaResult) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❤️ ARRHYTHMIA RESULT RECEIVED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (this.framesSent < this.MIN_FRAMES_BEFORE_RESPONSE) {
        console.log(`🔄 QUEUING ARRHYTHMIA (only ${this.framesSent} frames sent, need ${this.MIN_FRAMES_BEFORE_RESPONSE})`);
        this.responsesQueue.push({ type: 'arrhythmia', data });
        return;
      }

      console.log('Raw Data:', JSON.stringify(data, null, 2));

      // Log detected arrhythmias
      const detected = Object.entries(data)
        .filter(([, value]) => value.detected)
        .map(([, value]) => `${value.arrhythmia_name} (${(value.confidence * 100).toFixed(1)}%)`);

      if (detected.length > 0) {
        console.log('⚠️ Detected Arrhythmias:', detected.join(', '));
      } else {
        console.log('✅ No arrhythmias detected');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      this.processQueuedResponses();
      onArrhythmia(data);
    });

    this.socket.on('stable_readings', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✓ STABLE READINGS ACHIEVED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      this.clearMeasurementTimer();
      
      if (this.framesSent < this.MIN_FRAMES_BEFORE_RESPONSE) {
        console.log(`🔄 QUEUING STABLE READINGS (only ${this.framesSent} frames sent, need ${this.MIN_FRAMES_BEFORE_RESPONSE})`);
        this.responsesQueue.push({ type: 'stable_readings', data: null });
        return;
      }
      
      this.processQueuedResponses();
      onStableReadings();
    });

    this.socket.on('timeout', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⏱️ SCAN TIMEOUT');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      this.clearMeasurementTimer();
      
      if (this.framesSent < this.MIN_FRAMES_BEFORE_RESPONSE) {
        console.log(`🔄 QUEUING TIMEOUT (only ${this.framesSent} frames sent, need ${this.MIN_FRAMES_BEFORE_RESPONSE})`);
        this.responsesQueue.push({ type: 'timeout', data: null });
        return;
      }
      
      this.processQueuedResponses();
      onTimeout();
    });

    this.socket.on('connect_error', (error) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ CONNECTION ERROR');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error Message:', error.message);

      console.error('Full Error Object:', JSON.stringify(error, null, 2));
      console.error('Error Stack:', error.stack);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      onError(`Connection error: ${error.message}`);
    });

    this.socket.on('error', (error) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ SOCKET ERROR');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error:', error);
      console.error('Error Type:', typeof error);
      console.error('Error JSON:', JSON.stringify(error, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.clearMeasurementTimer();
      onError(`Socket error: ${error}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔌 SOCKET DISCONNECTED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Reason:', reason);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.clearMeasurementTimer();
      this.stopRequested = true;
    });

    // Debug: Log all events (catch-all for any event we might miss)
    this.socket.onAny((eventName, ...args) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📡 SOCKET EVENT RECEIVED:', eventName);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Event Name:', eventName);
      console.log('Arguments Count:', args.length);
      args.forEach((arg, index) => {
        console.log(`Argument ${index}:`, JSON.stringify(arg, null, 2));
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  }

  onConnect(callback: () => void): void {
    console.log('📞 onConnect callback registered');
    this.connectCallback = callback;
    
    // If socket is already connected, call the callback immediately
    if (this.socket && this.socket.connected) {
      console.log('⚡ Socket already connected - calling callback immediately');
      callback();
    }
  }

  connect(
    params: SocketConnectionParams,
    accessToken: string,
    onVitals: (vitals: VitalsResult) => void,
    onBloodPressure: (bp: BloodPressureResult) => void,
    onArrhythmia: (arrhythmia: ArrhythmiaResult) => void,
    onStableReadings: () => void,
    onTimeout: () => void,
    onError: (error: string) => void
  ): void {
    // Clean up any existing socket
    if (this.socket) {
      console.log('🧹 Cleaning up existing socket');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // WebSocket URL for frame processing
    const SOCKET_URL = 'wss://vitals.miavitals.com/api/v1/process_frame';

    // Full request configuration - forceNew: true creates fresh socket per measurement
    const socketConfig = {
      transports: ['websocket'],
      forceNew: true,  // ← Create NEW socket for each measurement (matches working implementation)
      withCredentials: true,
      auth: {
        Authorization: `Bearer ${accessToken}`
      },
      query: {
        ...params,
        access_token: accessToken
      }
    };

    // Create NEW socket connection for this measurement
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 CREATING NEW SOCKET FOR MEASUREMENT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', SOCKET_URL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.socket = io(SOCKET_URL, socketConfig);
    this.stopRequested = false;
    this.clearMeasurementTimer();
    this.timeoutCallback = onTimeout;

    this.startTime = Date.now();
    
    // Reset frame buffering state for new measurement
    this.framesSent = 0;
    this.responsesQueue = [];
    this.isProcessingResponses = false;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 FRAME BUFFERING ENABLED');
    console.log(`   Will queue responses until ${this.MIN_FRAMES_BEFORE_RESPONSE} frames are sent`);
    console.log(`   This ensures accurate measurements by sending frames rapidly first`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Handle connect event separately (not in attachEventHandlers since it needs params)
    this.socket.on('connect', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ SOCKET CONNECTED SUCCESSFULLY');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Socket ID:', this.socket?.id);
      console.log('Connected:', this.socket?.connected);
      console.log('Has connectCallback?', !!this.connectCallback);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (this.connectCallback) {
        console.log('🔔 Calling connectCallback to resolve promise');
        this.connectCallback();
      } else {
        console.warn('⚠️ No connectCallback registered!');
      }

      this.scheduleMeasurementTimer(params.sampleTime || 30);
    });

    // Attach all other event handlers
    this.attachEventHandlers(onVitals, onBloodPressure, onArrhythmia, onStableReadings, onTimeout, onError);
    
    // IMPORTANT: Check if socket is already connected (can happen with fast connections)
    // Use setTimeout(0) to check on next tick after all event handlers are registered
    setTimeout(() => {
      if (this.socket && this.socket.connected) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚡ Socket already connected on next tick');
        console.log('Has callback?', !!this.connectCallback);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        if (this.connectCallback) {
          console.log('🔔 Manually triggering connect callback');
          this.connectCallback();
          this.scheduleMeasurementTimer(params.sampleTime || 30);
        }
      } else {
        console.log('⏳ Socket not yet connected, waiting for connect event...');
      }
    }, 0); // Check on next tick
  }

  sendFrame(frameData: FrameData): void {
    if (this.stopRequested) {
      return;
    }

    if (!this.socket || !this.socket.connected) {
      // Don't log error - this is expected during connection phase
      return;
    }

    // Increment frame counter BEFORE sending to ensure buffering check is correct
    this.framesSent++;

    // Log EVERY frame sent with buffering status
    const bufferingStatus = this.framesSent <= this.MIN_FRAMES_BEFORE_RESPONSE 
      ? `🔄 BUFFERING (${this.framesSent}/${this.MIN_FRAMES_BEFORE_RESPONSE})` 
      : '✅ PROCESSING';
    console.log(`📤 SENDING Frame #${frameData.frameNumber} | Time: ${frameData.timeLapse.toFixed(1)}s | ${bufferingStatus} | Queued: ${this.responsesQueue.length}`);

    // Detailed log every 30th frame
    if (frameData.frameNumber % 30 === 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 DETAILED FRAME DATA');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Frame Data Structure (as per API spec):');
      console.log('  frameNumber [int]:', frameData.frameNumber);
      console.log('  imageData [base64 str]:', frameData.imageData.substring(0, 50) + '... (' + frameData.imageData.length + ' chars)');
      console.log('  remoteVitals [bool]:', frameData.remoteVitals);
      console.log('  stop [bool]:', frameData.stop);
      console.log('  timeLapse [float]:', frameData.timeLapse.toFixed(3), 'seconds');
      console.log('  userEmail [str]:', frameData.userEmail);
      console.log('\nValidation:');
      console.log('  ✓ Base64 HAS data URI prefix:', frameData.imageData.startsWith('data:image'));
      console.log('  ✓ All required fields present:', !!(
        typeof frameData.frameNumber === 'number' &&
        typeof frameData.imageData === 'string' &&
        typeof frameData.remoteVitals === 'boolean' &&
        typeof frameData.stop === 'boolean' &&
        typeof frameData.timeLapse === 'number' &&
        typeof frameData.userEmail === 'string'
      ));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // Emit the frame AFTER incrementing counter
    this.socket.emit('message', frameData, (ack: unknown) => {
      if (ack !== undefined) {
        console.log('📨 ACK FROM SERVER FOR FRAME', frameData.frameNumber, ':', JSON.stringify(ack));
      }
    });

    // Check if we've reached the minimum frames threshold
    if (this.framesSent === this.MIN_FRAMES_BEFORE_RESPONSE) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ REACHED ${this.MIN_FRAMES_BEFORE_RESPONSE} FRAMES - RESPONSES WILL NOW BE PROCESSED`);
      console.log(`📊 Queued responses to process: ${this.responsesQueue.length}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      // Process any responses that were queued while we were buffering
      setTimeout(() => this.processQueuedResponses(), 0);
    }
  }

  sendStopSignal(): void {
    if (this.socket && this.socket.connected) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🛑 SENDING STOP SIGNAL TO SERVER');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      this.stopRequested = true;
      this.clearMeasurementTimer();

      const stopMessage = {
        frameNumber: 0,
        imageData: '',
        remoteVitals: false,
        stop: true, // ← This tells server to stop measurement and disconnect
        timeLapse: (Date.now() - this.startTime) / 1000,
        userEmail: ''
      };

      console.log('Stop message structure (as per API spec):');
      console.log('  frameNumber [int]:', stopMessage.frameNumber);
      console.log('  imageData [base64 str]:', stopMessage.imageData || '(empty)');
      console.log('  remoteVitals [bool]:', stopMessage.remoteVitals);
      console.log('  stop [bool]:', stopMessage.stop, '← SERVER WILL STOP & DISCONNECT');
      console.log('  timeLapse [float]:', stopMessage.timeLapse.toFixed(3), 'seconds');
      console.log('  userEmail [str]:', stopMessage.userEmail || '(empty)');

      // Send stop signal - server will disconnect us
      this.socket.emit('message', stopMessage, (ack: unknown) => {
        if (ack !== undefined) {
          console.log('📨 ACK FROM SERVER FOR STOP SIGNAL:', JSON.stringify(ack));
        }
      });
      console.log('✅ Stop signal sent to server');
      console.log('⏳ Waiting for server to disconnect socket...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }

  disconnect(): void {
    // Disconnect and clean up socket
    if (this.socket) {
      console.log('🔌 Disconnecting socket (measurement complete)');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.clearMeasurementTimer();
    this.stopRequested = true;
    
    // Clear frame buffering state
    this.framesSent = 0;
    this.responsesQueue = [];
    this.isProcessingResponses = false;
    this.onVitalsCallback = null;
    this.onBloodPressureCallback = null;
    this.onArrhythmiaCallback = null;
    this.onStableReadingsCallback = null;
    this.onTimeoutCallback = null;
    this.onErrorCallback = null;
  }

  getTimeLapse(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}
