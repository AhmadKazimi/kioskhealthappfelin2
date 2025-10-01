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
    face_detected: boolean;
    finger_detected: boolean;
    fps: number;
    stable_readings: boolean;
    timeout: boolean;
    confidence: number;
  };
  vitals_results: {
    heart_rate: number;
    hrv_rate: number;
    resp_rate: number;
    spo2_rate: number;
    perfusion_index: number;
    mean_rr: number;
  };
}

export interface BloodPressureResult {
  bp_calibrated: boolean;
  systolic_blood_pressure: number;
  diastolic_blood_pressure: number;
  calibrated_systolic_blood_pressure?: number;
  calibrated_diastolic_blood_pressure?: number;
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
    onVitals: (vitals: VitalsResult) => void,
    onBloodPressure: (bp: BloodPressureResult) => void,
    onStableReadings: () => void,
    onTimeout: () => void,
    onError: (error: string) => void
  ): void {
    const SOCKET_URL = 'https://amal.miavitals.com/process_frame';

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true,
      withCredentials: true,
      auth: {
        Authorization: `Bearer ${params.client}` // Use actual JWT if available
      },
      query: params as any
    });

    this.startTime = Date.now();

    // Event listeners
    this.socket.on('connect', () => {
      console.log('SocketIO connected successfully');
      if (this.connectCallback) {
        this.connectCallback();
      }
    });

    this.socket.on('result', (data: VitalsResult) => {
      onVitals(data);
    });

    this.socket.on('blood_pressure_result', (data: BloodPressureResult) => {
      onBloodPressure(data);
    });

    this.socket.on('stable_readings', () => {
      onStableReadings();
    });

    this.socket.on('timeout', () => {
      onTimeout();
    });

    this.socket.on('connect_error', (error) => {
      onError(`Connection error: ${error.message}`);
    });

    this.socket.on('error', (error) => {
      onError(`Socket error: ${error}`);
    });
  }

  sendFrame(frameData: FrameData): void {
    if (!this.socket || !this.socket.connected) {
      // Don't log error - this is expected during connection phase
      return;
    }

    this.socket.emit('message', frameData);
  }

  disconnect(): void {
    if (this.socket) {
      // Send stop signal
      this.socket.emit('message', {
        frameNumber: 0,
        imageData: '',
        remoteVitals: false,
        stop: true,
        timeLapse: (Date.now() - this.startTime) / 1000,
        userEmail: ''
      });

      this.socket.disconnect();
      this.socket = null;
    }
  }

  getTimeLapse(): number {
    return (Date.now() - this.startTime) / 1000;
  }
}
