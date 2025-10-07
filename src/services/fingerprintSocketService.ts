import { io, Socket } from 'socket.io-client';

// TypeScript Interfaces
export interface SocketConnectionParams {
  bpCalibrated: boolean;
  checkArrhythmias: boolean;
  checkStroke: boolean;
  client: string;
  diastolicAdj?: number;
  longMeasurement: boolean;
  party: string;
  sampleTime: number;
  storeResult: boolean;
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
    confidence: number;  // Confidence level (moved from calculation_parameters)
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

// Service Implementation
export class FingerprintSocketService {
  private socket: Socket | null = null;
  private startTime: number = 0;
  private connectCallback: (() => void) | null = null;

  onConnect(callback: () => void): void {
    this.connectCallback = callback;
  }

  connect(
    params: SocketConnectionParams,
    accessToken: string,
    onVitals: (vitals: VitalsResult) => void,
    onBloodPressure: (bp: BloodPressureResult) => void,
    onStableReadings: () => void,
    onTimeout: () => void,
    onError: (error: string) => void
  ): void {
    // WebSocket URL for frame processing
    const SOCKET_URL = 'https://vitals.miavitals.com/api/v1/process_frame';

    // Full request configuration
    const socketConfig = {
      transports: ['websocket'], // Use websocket transport
      forceNew: true,
      withCredentials: true,
      auth: {
        Authorization: `Bearer ${accessToken}`
      },
      query: {
        ...params,
        EIO: '5' // Engine.IO v5 (Socket.IO v5+ protocol)
      }
    };

    // Log complete connection details
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 SOCKET CONNECTION ATTEMPT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', SOCKET_URL);
    console.log('Full Access Token:', accessToken);
    console.log('Connection Config:', JSON.stringify(socketConfig, null, 2));
    console.log('Query Parameters:', socketConfig.query);
    console.log('Auth:', socketConfig.auth);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.socket = io(SOCKET_URL, socketConfig);

    this.startTime = Date.now();

    // Event listeners
    this.socket.on('connect', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ SOCKET CONNECTED SUCCESSFULLY');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Socket ID:', this.socket?.id);
      console.log('Connected:', this.socket?.connected);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      if (this.connectCallback) {
        this.connectCallback();
      }
    });

    this.socket.on('result', (data: VitalsResult) => {
      // Log EVERY response with frame number for tracking
      const frameNum = data.calculation_parameters.frame_number || 'unknown';
      const isStable = data.calculation_parameters.stable_readings;
      const isTimeout = data.calculation_parameters.timeout;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 RESPONSE FOR FRAME #${frameNum} ${isStable ? '✅ STABLE' : ''} ${isTimeout ? '⏱️ TIMEOUT' : ''}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

      // Pass vitals to callback
      onVitals(data);

      // CHECK FOR COMPLETION FLAGS IN THE RESULT
      if (isStable) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ STABLE READINGS ACHIEVED - SCAN COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        onStableReadings();
      }

      if (isTimeout) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⏱️ MEASUREMENT TIMEOUT - INCOMPLETE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        onTimeout();
      }
    });

    this.socket.on('blood_pressure_result', (data: BloodPressureResult) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🩺 BLOOD PRESSURE RESULT RECEIVED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Raw Data:', JSON.stringify(data, null, 2));
      console.log('Systolic:', data.systolic_blood_pressure);
      console.log('Diastolic:', data.diastolic_blood_pressure);
      console.log('Calibrated:', data.bp_calibrated);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      onBloodPressure(data);
    });

    this.socket.on('stable_readings', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✓ STABLE READINGS ACHIEVED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      onStableReadings();
    });

    this.socket.on('timeout', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⏱️ SCAN TIMEOUT');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
      onError(`Socket error: ${error}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔌 SOCKET DISCONNECTED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Reason:', reason);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

  sendFrame(frameData: FrameData): void {
    if (!this.socket || !this.socket.connected) {
      // Don't log error - this is expected during connection phase
      return;
    }

    // Log EVERY frame sent (brief format) for response tracking
    console.log(`📤 SENT Frame #${frameData.frameNumber} | Time: ${frameData.timeLapse.toFixed(1)}s | Email: ${frameData.userEmail}`);

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
      console.log('  ✓ Base64 has no data URI prefix:', !frameData.imageData.includes('data:image'));
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

    this.socket.emit('message', frameData);
  }

  sendStopSignal(): void {
    if (this.socket && this.socket.connected) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🛑 SENDING STOP SIGNAL TO SERVER');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const stopMessage = {
        frameNumber: 0,
        imageData: '',
        remoteVitals: false,
        stop: true,  // ← This tells server to stop measurement and disconnect
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
      this.socket.emit('message', stopMessage);
      console.log('✅ Stop signal sent to server');
      console.log('⏳ Waiting for server to disconnect socket...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }

  disconnect(): void {
    // Manual disconnect (for cleanup/unmount only)
    if (this.socket) {
      console.log('🔌 Manually disconnecting socket (cleanup)');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getTimeLapse(): number {
    return (Date.now() - this.startTime) / 1000;
  }
}
