# Fingerprint Scanning Feature - Complete Implementation Plan

## Overview

This document provides a comprehensive implementation plan for adding fingerprint scanning capabilities to the Health Kiosk Application. The feature integrates SocketIO-based real-time video streaming for vitals measurement while preserving the existing face scan functionality.

### Feature Flow

```
Home Screen
    ↓
Scan Type Selection (NEW)
    ├─→ Face Scan (Existing ShenAI SDK flow - unchanged)
    │       ↓
    │   Face Scan Instructions
    │       ↓
    │   Face Scan Scanner
    │       ↓
    │   Face Scan Results
    │
    └─→ Fingerprint Scan (NEW SocketIO integration)
            ↓
        Fingerprint Instructions
            ↓
        Fingerprint Scanner
            ↓
        Vitals Results Display
            ↓
        [Both paths merge here]
            ↓
        Symptoms Selection
            ↓
        Health Questionnaire
            ↓
        Health Summary
```

---

## Part 1: Frontend Implementation

### Prerequisites
- Node.js >=18.0.0
- npm >=8.0.0
- Next.js 15 with React 19
- Existing project setup completed

### Dependencies to Install
```bash
npm install socket.io-client@^4.7.0
```

---

### Frontend Todo List

#### ✅ Step 1: Setup & Create Feature Branch
**Tasks**:
- [ ] Create new Git branch: `fingerprint_scan`
- [ ] Install `socket.io-client` dependency
- [ ] Verify project builds successfully

**Commands**:
```bash
git checkout -b fingerprint_scan
npm install socket.io-client@^4.7.0
npm run dev
```

**Connection Point**: None (setup only)

---

#### ✅ Step 2: Create SocketIO Service

**File**: `src/services/fingerprintSocketService.ts`

**Tasks**:
- [ ] Create service file
- [ ] Define TypeScript interfaces for SocketIO data
- [ ] Implement connection management
- [ ] Implement frame sending logic
- [ ] Implement event listeners for vitals results

**Code Hint**:
```typescript
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

  connect(
    params: SocketConnectionParams,
    onVitals: (vitals: VitalsResult) => void,
    onBloodPressure: (bp: BloodPressureResult) => void,
    onStableReadings: () => void,
    onTimeout: () => void,
    onError: (error: string) => void
  ): void {
    const SOCKET_URL = 'wss://vitals.miavitals.com/v1/process_frame';

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true,
      withCredentials: true,
      auth: {
        Authorization: `Bearer ${params.client}` // Use actual JWT if available
      },
      query: params
    });

    this.startTime = Date.now();

    // Event listeners
    this.socket.on('connect', () => {
      console.log('SocketIO connected');
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
      console.error('Socket not connected');
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
```

**Connection Point**: This service will be called by the Fingerprint Scanner Component (Step 7) and will receive data that gets sent to the backend via the Save Service (Step 4).

---

#### ✅ Step 3: Create Frame Capture Service

**File**: `src/services/frameCapture.ts`

**Tasks**:
- [ ] Create service file
- [ ] Implement camera initialization
- [ ] Implement frame capture at 6 FPS
- [ ] Implement base64 encoding
- [ ] Implement cleanup logic

**Code Hint**:
```typescript
export interface FrameCaptureOptions {
  width: number;
  height: number;
  fps: number;
}

export class FrameCaptureService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private captureInterval: NodeJS.Timeout | null = null;

  async initialize(
    videoElement: HTMLVideoElement,
    options: FrameCaptureOptions = { width: 640, height: 480, fps: 6 }
  ): Promise<void> {
    this.videoElement = videoElement;

    // Get camera stream
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: options.width },
          height: { ideal: options.height },
          facingMode: 'user'
        },
        audio: false
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      // Setup canvas for frame capture
      this.canvas = document.createElement('canvas');
      this.canvas.width = options.width;
      this.canvas.height = options.height;
      this.context = this.canvas.getContext('2d');

    } catch (error) {
      throw new Error(`Failed to access camera: ${error}`);
    }
  }

  startCapture(
    onFrame: (base64Image: string) => void,
    fps: number = 6
  ): void {
    if (!this.videoElement || !this.canvas || !this.context) {
      throw new Error('Frame capture not initialized');
    }

    const interval = 1000 / fps; // milliseconds between frames

    this.captureInterval = setInterval(() => {
      if (!this.videoElement || !this.canvas || !this.context) return;

      // Draw current video frame to canvas
      this.context.drawImage(
        this.videoElement,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      // Convert canvas to base64
      const base64Image = this.canvas.toDataURL('image/jpeg', 0.8);

      // Remove data URL prefix to get pure base64
      const base64Data = base64Image.split(',')[1];

      onFrame(base64Data);
    }, interval);
  }

  stopCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  cleanup(): void {
    this.stopCapture();

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.canvas = null;
    this.context = null;
  }
}
```

**Connection Point**: This service is used by the Fingerprint Scanner Component (Step 7) to capture and encode video frames.

---

#### ✅ Step 4: Create Backend Save Service

**File**: `src/services/saveFingerprintScan.ts`

**Tasks**:
- [ ] Create service file
- [ ] Map SocketIO vitals to backend DTO format
- [ ] Implement API call to save scan result
- [ ] Handle success/error responses

**Code Hint**:
```typescript
import { VitalsResult, BloodPressureResult } from './fingerprintSocketService';

// Backend DTO Interface (matches backend structure)
interface ScanResultDto {
  ClientId: string;
  HeartRate10s: number;
  HrvSdnnMs: number;
  BreathingRate: number;
  SystolicBloodPressureMmhg: number;
  DiastolicBloodPressureMmhg: number;
  SpO2: number;                    // NEW
  PerfusionIndex: number;          // NEW
  MeanRR: number;                  // NEW
  ScanType: 'Face' | 'Fingerprint'; // NEW
  ScanDate: string; // ISO format
}

/**
 * Data Mapping Table:
 *
 * SocketIO Field               → Backend Field
 * --------------------------------|---------------------------------
 * heart_rate                   → HeartRate10s
 * hrv_rate                     → HrvSdnnMs
 * resp_rate                    → BreathingRate
 * systolic_blood_pressure      → SystolicBloodPressureMmhg
 * diastolic_blood_pressure     → DiastolicBloodPressureMmhg
 * spo2_rate                    → SpO2 (NEW)
 * perfusion_index              → PerfusionIndex (NEW)
 * mean_rr                      → MeanRR (NEW)
 * 'Fingerprint' (hardcoded)    → ScanType (NEW)
 */

export async function saveFingerprintScan(
  clientId: string,
  vitals: VitalsResult,
  bloodPressure: BloodPressureResult
): Promise<{ success: boolean; message: string }> {

  // Map SocketIO data to backend DTO
  const scanResultDto: ScanResultDto = {
    ClientId: clientId,

    // Vitals mapping
    HeartRate10s: vitals.vitals_results.heart_rate,
    HrvSdnnMs: vitals.vitals_results.hrv_rate,
    BreathingRate: vitals.vitals_results.resp_rate,

    // Blood pressure mapping (use calibrated if available)
    SystolicBloodPressureMmhg: bloodPressure.bp_calibrated
      ? bloodPressure.calibrated_systolic_blood_pressure!
      : bloodPressure.systolic_blood_pressure,
    DiastolicBloodPressureMmhg: bloodPressure.bp_calibrated
      ? bloodPressure.calibrated_diastolic_blood_pressure!
      : bloodPressure.diastolic_blood_pressure,

    // New fingerprint-specific fields
    SpO2: vitals.vitals_results.spo2_rate,
    PerfusionIndex: vitals.vitals_results.perfusion_index,
    MeanRR: vitals.vitals_results.mean_rr,

    // Scan type identifier
    ScanType: 'Fingerprint',

    // Timestamp
    ScanDate: new Date().toISOString()
  };

  try {
    // Get backend URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-url.com/api';

    const response = await fetch(`${apiUrl}/ScanResult/AddScanResult`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // If using ngrok for dev
      },
      body: JSON.stringify(scanResultDto)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return {
      success: true,
      message: 'Scan result saved successfully'
    };

  } catch (error) {
    console.error('Failed to save fingerprint scan:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

**Connection Point**:
- **FROM Frontend**: Called by Fingerprint Scanner Component (Step 7) when scan completes
- **TO Backend**: Sends data to `/api/ScanResult/AddScanResult` endpoint (Backend Step 5)

---

#### ✅ Step 5: Create Scan Type Selection Component

**File**: `src/components/scan-type-selection.tsx`

**Tasks**:
- [ ] Create component file
- [ ] Design two-card selection UI (Face Scan | Fingerprint Scan)
- [ ] Implement click handlers
- [ ] Add translations support
- [ ] Style with Tailwind CSS

**Code Hint**:
```typescript
"use client"

import { useTranslation } from "@/hooks/useTranslation"
import { Card } from "@/components/ui/card"
import { Camera, Fingerprint } from "lucide-react"

interface ScanTypeSelectionProps {
  onSelectScanType: (type: 'face' | 'fingerprint') => void
}

export const ScanTypeSelection = ({ onSelectScanType }: ScanTypeSelectionProps) => {
  const { t, isArabic } = useTranslation()

  return (
    <div className="h-full flex flex-col items-center justify-center p-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <h1 className="text-3xl font-bold mb-8 text-center">
        {t('scanType.title')}
      </h1>
      <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl">
        {t('scanType.subtitle')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Face Scan Card */}
        <Card
          className="p-8 cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 hover:border-blue-500"
          onClick={() => onSelectScanType('face')}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold">{t('scanType.faceScan')}</h2>
            <p className="text-gray-600">{t('scanType.faceScanDesc')}</p>
          </div>
        </Card>

        {/* Fingerprint Scan Card */}
        <Card
          className="p-8 cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 hover:border-green-500"
          onClick={() => onSelectScanType('fingerprint')}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Fingerprint className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold">{t('scanType.fingerprintScan')}</h2>
            <p className="text-gray-600">{t('scanType.fingerprintScanDesc')}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
```

**Connection Point**: This component is integrated into the Home Screen flow (Step 8) and determines which scanner path to take.

---

#### ✅ Step 6: Create Fingerprint Instructions Component

**File**: `src/components/New pages/beforeFingerprintScanning.tsx`

**Tasks**:
- [ ] Create component file
- [ ] Design 4 instruction cards
- [ ] Add animations (similar to face scan instructions)
- [ ] Implement Back/Start buttons (sticky pattern)
- [ ] Add translations support

**Code Hint**:
```typescript
"use client"

import { useTranslation } from "@/hooks/useTranslation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Hand, Camera, Timer, CheckCircle } from "lucide-react"

interface BeforeFingerprintScanningProps {
  onBack: () => void
  onStart: () => void
}

export const BeforeFingerprintScanning = ({
  onBack,
  onStart
}: BeforeFingerprintScanningProps) => {
  const { t, isArabic } = useTranslation()

  const instructions = [
    {
      icon: <Hand className="w-12 h-12 text-blue-600" />,
      title: t('fingerprintScan.instructions.step1.title'),
      description: t('fingerprintScan.instructions.step1.desc')
    },
    {
      icon: <Camera className="w-12 h-12 text-green-600" />,
      title: t('fingerprintScan.instructions.step2.title'),
      description: t('fingerprintScan.instructions.step2.desc')
    },
    {
      icon: <Timer className="w-12 h-12 text-orange-600" />,
      title: t('fingerprintScan.instructions.step3.title'),
      description: t('fingerprintScan.instructions.step3.desc')
    },
    {
      icon: <CheckCircle className="w-12 h-12 text-purple-600" />,
      title: t('fingerprintScan.instructions.step4.title'),
      description: t('fingerprintScan.instructions.step4.desc')
    }
  ]

  return (
    <div className="h-full flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">
          {t('fingerprintScan.instructions.title')}
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          {t('fingerprintScan.instructions.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {instructions.map((instruction, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  {instruction.icon}
                </div>
                <h3 className="text-xl font-semibold">{instruction.title}</h3>
                <p className="text-gray-600">{instruction.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Sticky Button Area */}
      <div className="flex-shrink-0 pt-4 px-8 pb-8">
        <div className="flex justify-between max-w-4xl mx-auto">
          <Button onClick={onBack} variant="outline" size="lg">
            {t('buttons.back')}
          </Button>
          <Button onClick={onStart} size="lg" className="bg-green-600 hover:bg-green-700">
            {t('buttons.startScan')}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Connection Point**: This component is shown before the Fingerprint Scanner (Step 7) when user selects fingerprint scan type.

---

#### ✅ Step 7: Create Fingerprint Scanner Component

**File**: `src/components/fingerprint-scan-screen.tsx`

**Tasks**:
- [ ] Create component file
- [ ] Integrate FrameCaptureService (Step 3)
- [ ] Integrate FingerprintSocketService (Step 2)
- [ ] Display real-time vitals as they arrive
- [ ] Show scan progress (30 second countdown)
- [ ] Display finger detection feedback
- [ ] Call saveFingerprintScan (Step 4) on completion
- [ ] Implement Back/Next buttons (sticky pattern)

**Code Hint**:
```typescript
"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "@/hooks/useTranslation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, Activity, Droplet, Wind } from "lucide-react"
import { FingerprintSocketService, VitalsResult, BloodPressureResult } from "@/services/fingerprintSocketService"
import { FrameCaptureService } from "@/services/frameCapture"
import { saveFingerprintScan } from "@/services/saveFingerprintScan"

interface FingerprintScanScreenProps {
  userId: string
  userAge: number
  userGender: 'male' | 'female'
  onBack: () => void
  onNext: () => void
}

export const FingerprintScanScreen = ({
  userId,
  userAge,
  userGender,
  onBack,
  onNext
}: FingerprintScanScreenProps) => {
  const { t, isArabic } = useTranslation()

  const videoRef = useRef<HTMLVideoElement>(null)
  const socketServiceRef = useRef<FingerprintSocketService | null>(null)
  const frameCaptureRef = useRef<FrameCaptureService | null>(null)

  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [frameNumber, setFrameNumber] = useState(0)
  const [fingerDetected, setFingerDetected] = useState(false)

  // Vitals state
  const [vitals, setVitals] = useState<VitalsResult | null>(null)
  const [bloodPressure, setBloodPressure] = useState<BloodPressureResult | null>(null)
  const [scanComplete, setScanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize and start scan
  useEffect(() => {
    if (!videoRef.current) return

    const initializeScan = async () => {
      try {
        // Initialize frame capture
        frameCaptureRef.current = new FrameCaptureService()
        await frameCaptureRef.current.initialize(videoRef.current!, {
          width: 640,
          height: 480,
          fps: 6
        })

        // Initialize socket connection
        socketServiceRef.current = new FingerprintSocketService()
        socketServiceRef.current.connect(
          {
            bpCalibrated: false,
            checkArrhythmias: false,
            checkStroke: false,
            client: 'health-kiosk',
            longMeasurement: false,
            party: userId,
            sampleTime: 30,
            storeResult: false, // We handle storage ourselves
            user_age: userAge,
            user_sex: userGender
          },
          // onVitals
          (vitalsData) => {
            setVitals(vitalsData)
            setFingerDetected(vitalsData.calculation_parameters.finger_detected)
          },
          // onBloodPressure
          (bpData) => {
            setBloodPressure(bpData)
          },
          // onStableReadings
          async () => {
            setIsScanning(false)
            setScanComplete(true)

            // Save to backend
            if (vitals && bloodPressure) {
              const result = await saveFingerprintScan(userId, vitals, bloodPressure)
              if (!result.success) {
                setError(result.message)
              }
            }
          },
          // onTimeout
          () => {
            setError(t('fingerprintScan.errors.timeout'))
            setIsScanning(false)
          },
          // onError
          (errorMsg) => {
            setError(errorMsg)
            setIsScanning(false)
          }
        )

        // Start frame capture
        let currentFrame = 0
        frameCaptureRef.current.startCapture((base64Image) => {
          if (!socketServiceRef.current) return

          const timeLapse = socketServiceRef.current.getTimeLapse()

          socketServiceRef.current.sendFrame({
            frameNumber: currentFrame,
            imageData: base64Image,
            remoteVitals: false,
            stop: false,
            timeLapse: timeLapse,
            userEmail: userId
          })

          setFrameNumber(currentFrame)
          setScanProgress((timeLapse / 30) * 100) // 30 second scan
          currentFrame++
        }, 6)

        setIsScanning(true)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize scan')
      }
    }

    initializeScan()

    // Cleanup
    return () => {
      frameCaptureRef.current?.cleanup()
      socketServiceRef.current?.disconnect()
    }
  }, [userId, userAge, userGender])

  return (
    <div className="h-full flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">
          {t('fingerprintScan.title')}
        </h1>

        {/* Video Preview */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Finger Detection Overlay */}
            {isScanning && (
              <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded">
                {fingerDetected ? (
                  <span className="text-green-400">✓ {t('fingerprintScan.fingerDetected')}</span>
                ) : (
                  <span className="text-yellow-400">{t('fingerprintScan.placeFinger')}</span>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {isScanning && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-700">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Real-time Vitals Display */}
        {vitals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Heart className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">{t('vitals.heartRate')}</p>
                  <p className="text-xl font-bold">{vitals.vitals_results.heart_rate}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Activity className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">{t('vitals.hrv')}</p>
                  <p className="text-xl font-bold">{vitals.vitals_results.hrv_rate}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Droplet className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">{t('vitals.spo2')}</p>
                  <p className="text-xl font-bold">{vitals.vitals_results.spo2_rate}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Wind className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">{t('vitals.respRate')}</p>
                  <p className="text-xl font-bold">{vitals.vitals_results.resp_rate}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {bloodPressure && (
          <div className="max-w-2xl mx-auto mt-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">{t('vitals.bloodPressure')}</h3>
              <p className="text-3xl font-bold">
                {bloodPressure.bp_calibrated
                  ? `${bloodPressure.calibrated_systolic_blood_pressure}/${bloodPressure.calibrated_diastolic_blood_pressure}`
                  : `${bloodPressure.systolic_blood_pressure}/${bloodPressure.diastolic_blood_pressure}`
                }
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* Sticky Button Area */}
      <div className="flex-shrink-0 pt-4 px-8 pb-8">
        <div className="flex justify-between max-w-4xl mx-auto">
          <Button onClick={onBack} variant="outline" size="lg" disabled={isScanning}>
            {t('buttons.back')}
          </Button>
          <Button
            onClick={onNext}
            size="lg"
            disabled={!scanComplete}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {t('buttons.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Connection Point**:
- **Calls**: FrameCaptureService (Step 3), FingerprintSocketService (Step 2), saveFingerprintScan (Step 4)
- **Data Flow**: SocketIO vitals → Backend API via save service

---

#### ✅ Step 8: Update Home Screen Flow

**File**: `src/app/(app)/home/page.tsx` (or main home component)

**Tasks**:
- [ ] Import new components (ScanTypeSelection, BeforeFingerprintScanning, FingerprintScanScreen)
- [ ] Add scan type state management
- [ ] Implement flow branching logic
- [ ] Update step navigation to handle both paths

**Code Hint**:
```typescript
"use client"

import { useState } from "react"
import { ScanTypeSelection } from "@/components/scan-type-selection"
import { BeforeFingerprintScanning } from "@/components/New pages/beforeFingerprintScanning"
import { FingerprintScanScreen } from "@/components/fingerprint-scan-screen"
import { BeforeScanning } from "@/components/New pages/beforeScanning" // Existing face scan instructions
import { FaceScanScreen } from "@/components/face-scan-screen" // Existing face scan
// ... other imports

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [scanType, setScanType] = useState<'face' | 'fingerprint' | null>(null)
  const [userData, setUserData] = useState({ userId: '', age: 25, gender: 'male' as const })

  const handleScanTypeSelect = (type: 'face' | 'fingerprint') => {
    setScanType(type)
    setCurrentStep(currentStep + 1)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeScreen onNext={() => setCurrentStep(1)} />

      case 1:
        return <UserInfoScreen onNext={(data) => {
          setUserData(data)
          setCurrentStep(2)
        }} />

      case 2:
        // NEW: Scan type selection
        return <ScanTypeSelection onSelectScanType={handleScanTypeSelect} />

      case 3:
        // Branch based on scan type
        if (scanType === 'face') {
          return <BeforeScanning onStart={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />
        } else {
          return <BeforeFingerprintScanning onStart={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />
        }

      case 4:
        // Scanner screen (face or fingerprint)
        if (scanType === 'face') {
          return <FaceScanScreen
            onNext={() => setCurrentStep(5)}
            onPrev={() => setCurrentStep(3)}
          />
        } else {
          return <FingerprintScanScreen
            userId={userData.userId}
            userAge={userData.age}
            userGender={userData.gender}
            onNext={() => setCurrentStep(5)}
            onBack={() => setCurrentStep(3)}
          />
        }

      case 5:
        // Paths merge here - continue normal flow
        return <SymptomsScreen onNext={() => setCurrentStep(6)} />

      case 6:
        return <QuestionnaireScreen onNext={() => setCurrentStep(7)} />

      case 7:
        return <HealthSummaryScreen />

      default:
        return <WelcomeScreen onNext={() => setCurrentStep(1)} />
    }
  }

  return (
    <div className="h-screen">
      {renderStep()}
    </div>
  )
}
```

**Connection Point**: This is the main integration point that connects all components together in the user flow.

---

#### ✅ Step 9: Add Translations

**Files**:
- `public/locales/en/common.json`
- `public/locales/ar/common.json`

**Tasks**:
- [ ] Add English translations
- [ ] Add Arabic translations
- [ ] Test translation switching

**Code Hint** (English):
```json
{
  "scanType": {
    "title": "Choose Scan Type",
    "subtitle": "Select how you would like to measure your vitals",
    "faceScan": "Face Scan",
    "faceScanDesc": "Scan your face using AI technology",
    "fingerprintScan": "Fingerprint Scan",
    "fingerprintScanDesc": "Place your finger on the camera"
  },
  "fingerprintScan": {
    "title": "Fingerprint Scan",
    "placeFinger": "Place your finger over the camera",
    "fingerDetected": "Finger detected",
    "instructions": {
      "title": "Fingerprint Scan Instructions",
      "subtitle": "Follow these steps for accurate results",
      "step1": {
        "title": "Clean Your Finger",
        "desc": "Make sure your finger is clean and dry"
      },
      "step2": {
        "title": "Cover Camera",
        "desc": "Place your finger completely over the rear camera"
      },
      "step3": {
        "title": "Hold Still",
        "desc": "Keep your finger steady for 30 seconds"
      },
      "step4": {
        "title": "Stay Relaxed",
        "desc": "Breathe normally and stay calm during the scan"
      }
    },
    "errors": {
      "timeout": "Scan timed out. Please try again.",
      "noFinger": "No finger detected. Please cover the camera completely."
    }
  },
  "vitals": {
    "heartRate": "Heart Rate",
    "hrv": "HRV",
    "spo2": "SpO2",
    "respRate": "Breathing Rate",
    "bloodPressure": "Blood Pressure"
  }
}
```

**Code Hint** (Arabic):
```json
{
  "scanType": {
    "title": "اختر نوع المسح",
    "subtitle": "حدد كيف تريد قياس المؤشرات الحيوية",
    "faceScan": "مسح الوجه",
    "faceScanDesc": "امسح وجهك باستخدام تقنية الذكاء الاصطناعي",
    "fingerprintScan": "مسح بصمة الإصبع",
    "fingerprintScanDesc": "ضع إصبعك على الكاميرا"
  },
  "fingerprintScan": {
    "title": "مسح بصمة الإصبع",
    "placeFinger": "ضع إصبعك على الكاميرا",
    "fingerDetected": "تم اكتشاف الإصبع",
    "instructions": {
      "title": "تعليمات مسح بصمة الإصبع",
      "subtitle": "اتبع هذه الخطوات للحصول على نتائج دقيقة",
      "step1": {
        "title": "نظف إصبعك",
        "desc": "تأكد من أن إصبعك نظيف وجاف"
      },
      "step2": {
        "title": "غطي الكاميرا",
        "desc": "ضع إصبعك بالكامل على الكاميرا الخلفية"
      },
      "step3": {
        "title": "ابق ثابتاً",
        "desc": "حافظ على ثبات إصبعك لمدة 30 ثانية"
      },
      "step4": {
        "title": "ابق مسترخياً",
        "desc": "تنفس بشكل طبيعي وابق هادئاً أثناء المسح"
      }
    },
    "errors": {
      "timeout": "انتهى وقت المسح. حاول مرة أخرى.",
      "noFinger": "لم يتم اكتشاف الإصبع. يرجى تغطية الكاميرا بالكامل."
    }
  },
  "vitals": {
    "heartRate": "معدل ضربات القلب",
    "hrv": "تباين معدل ضربات القلب",
    "spo2": "تشبع الأكسجين",
    "respRate": "معدل التنفس",
    "bloodPressure": "ضغط الدم"
  }
}
```

---

#### ✅ Step 10: Update Admin Panel (Optional Enhancement)

**File**: `src/components/admin-panel.tsx`

**Tasks**:
- [ ] Add "Scan Type" column to client results table
- [ ] Display fingerprint-specific vitals (SpO2, Perfusion Index, Mean RR)
- [ ] Add filter for scan type

**Code Hint**:
```typescript
// In admin panel table columns
<TableHead>{t('admin.scanType')}</TableHead>

// In table body
<TableCell>{client.scanType}</TableCell>

// Display fingerprint-specific vitals
{client.scanType === 'Fingerprint' && (
  <>
    <TableCell>{client.spO2}%</TableCell>
    <TableCell>{client.perfusionIndex}</TableCell>
    <TableCell>{client.meanRR} ms</TableCell>
  </>
)}
```

**Connection Point**:
- **FROM Backend**: Fetches data from `/api/Client/GetClientsReport` which now includes new fields (Backend Step 7)

---

#### ✅ Step 11: Testing

**Tasks**:
- [ ] Test scan type selection UI
- [ ] Test fingerprint instructions screen
- [ ] Test camera access and frame capture
- [ ] Test SocketIO connection to `wss://vitals.miavitals.com/v1/process_frame`
- [ ] Verify real-time vitals display
- [ ] Test data saving to backend
- [ ] Verify flow continues correctly after fingerprint scan
- [ ] Test error scenarios (camera denied, connection failure, timeout)
- [ ] Test both English and Arabic languages
- [ ] Test on different screen sizes
- [ ] Verify admin panel shows fingerprint scan results

**Testing Checklist**:
```
□ Can select Face Scan (existing flow works)
□ Can select Fingerprint Scan
□ Instructions screen displays correctly
□ Camera permissions requested and granted
□ Video preview shows finger feed
□ Finger detection feedback works
□ Vitals update in real-time
□ Blood pressure displays after calculation
□ Scan completes after 30 seconds
□ Data saves to backend successfully
□ Flow continues to Symptoms screen
□ Admin panel shows fingerprint results
□ All translations work correctly
□ RTL layout works for Arabic
```

---

#### ✅ Step 12: Deployment

**Tasks**:
- [ ] Merge `fingerprint_scan` branch to main
- [ ] Build production version
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Deploy to production

**Commands**:
```bash
# Merge to main
git checkout main
git merge fingerprint_scan

# Build
npm run build

# Deploy (Azure example)
# ... your deployment commands
```

---

## Part 2: Backend Implementation

### Prerequisites
- .NET 9.0 SDK
- Azure SQL Database
- ABP Framework 9.0
- Entity Framework Core 9.0

### Backend Todo List

#### ✅ Step 1: Database Schema Update

**Tasks**:
- [ ] Review current `ScanResults` table schema
- [ ] Identify new columns needed
- [ ] Plan SQL migration script

**New Columns Required**:
```sql
ALTER TABLE ScanResults
ADD SpO2 INT NULL,
    PerfusionIndex DECIMAL(5,2) NULL,
    MeanRR INT NULL,
    ScanType NVARCHAR(20) NOT NULL DEFAULT 'Face';
```

**Connection Point**: These columns will store data sent from frontend `saveFingerprintScan` service (Frontend Step 4).

---

#### ✅ Step 2: Update ScanResult Entity

**File**: `src/KioskHealthApp.Domain/Entities/ScanResult.cs` (adjust path to your project)

**Tasks**:
- [ ] Add new properties to entity class
- [ ] Add XML documentation comments
- [ ] Update constructor if needed

**Code Hint**:
```csharp
using System;
using Volo.Abp.Domain.Entities;

namespace KioskHealthApp.Domain.Entities
{
    /// <summary>
    /// Represents a health scan result from either face or fingerprint scanning
    /// </summary>
    public class ScanResult : Entity<Guid>
    {
        // Existing properties
        public Guid ClientId { get; set; }
        public int HeartRate10s { get; set; }
        public int HrvSdnnMs { get; set; }
        public int BreathingRate { get; set; }
        public int SystolicBloodPressureMmhg { get; set; }
        public int DiastolicBloodPressureMmhg { get; set; }
        public DateTime ScanDate { get; set; }

        // NEW: Fingerprint-specific vitals

        /// <summary>
        /// Blood oxygen saturation level (SpO2) in percentage
        /// Only available from fingerprint scans
        /// </summary>
        public int? SpO2 { get; set; }

        /// <summary>
        /// Perfusion Index - ratio of pulsatile blood flow to static blood
        /// Only available from fingerprint scans
        /// </summary>
        public decimal? PerfusionIndex { get; set; }

        /// <summary>
        /// Mean RR interval in milliseconds
        /// Only available from fingerprint scans
        /// </summary>
        public int? MeanRR { get; set; }

        /// <summary>
        /// Type of scan performed: "Face" or "Fingerprint"
        /// </summary>
        public string ScanType { get; set; } = "Face"; // Default to Face for backwards compatibility

        // Navigation property
        public virtual Client Client { get; set; }
    }
}
```

**Connection Point**: Entity matches the DTO structure sent from frontend (Frontend Step 4).

---

#### ✅ Step 3: Update ScanResultDto

**File**: `src/KioskHealthApp.Application.Contracts/Dtos/ScanResultDto.cs`

**Tasks**:
- [ ] Add new properties to DTO
- [ ] Update validation attributes if needed
- [ ] Add XML documentation

**Code Hint**:
```csharp
using System;
using System.ComponentModel.DataAnnotations;

namespace KioskHealthApp.Application.Contracts.Dtos
{
    /// <summary>
    /// Data Transfer Object for scan results
    /// </summary>
    public class ScanResultDto
    {
        [Required]
        public Guid ClientId { get; set; }

        [Required]
        [Range(30, 200)]
        public int HeartRate10s { get; set; }

        [Required]
        [Range(10, 200)]
        public int HrvSdnnMs { get; set; }

        [Required]
        [Range(8, 40)]
        public int BreathingRate { get; set; }

        [Required]
        [Range(70, 200)]
        public int SystolicBloodPressureMmhg { get; set; }

        [Required]
        [Range(40, 130)]
        public int DiastolicBloodPressureMmhg { get; set; }

        [Required]
        public DateTime ScanDate { get; set; }

        // NEW: Fingerprint-specific fields

        [Range(70, 100)]
        public int? SpO2 { get; set; }

        [Range(0, 20)]
        public decimal? PerfusionIndex { get; set; }

        [Range(300, 2000)]
        public int? MeanRR { get; set; }

        [Required]
        [StringLength(20)]
        public string ScanType { get; set; } = "Face";
    }
}
```

**Connection Point**: This DTO is what the frontend sends via POST request (Frontend Step 4).

---

#### ✅ Step 4: Update AutoMapper Configuration

**File**: `src/KioskHealthApp.Application/AutoMapperProfile.cs`

**Tasks**:
- [ ] Update mapping profile to include new fields
- [ ] Ensure bidirectional mapping works

**Code Hint**:
```csharp
using AutoMapper;
using KioskHealthApp.Domain.Entities;
using KioskHealthApp.Application.Contracts.Dtos;

namespace KioskHealthApp.Application
{
    public class KioskHealthAppAutoMapperProfile : Profile
    {
        public KioskHealthAppAutoMapperProfile()
        {
            // ScanResult mappings
            CreateMap<ScanResult, ScanResultDto>();
            CreateMap<ScanResultDto, ScanResult>()
                .ForMember(dest => dest.SpO2, opt => opt.MapFrom(src => src.SpO2))
                .ForMember(dest => dest.PerfusionIndex, opt => opt.MapFrom(src => src.PerfusionIndex))
                .ForMember(dest => dest.MeanRR, opt => opt.MapFrom(src => src.MeanRR))
                .ForMember(dest => dest.ScanType, opt => opt.MapFrom(src => src.ScanType));

            // ... other mappings
        }
    }
}
```

**Connection Point**: AutoMapper will automatically map frontend DTO to entity when saving (Step 5).

---

#### ✅ Step 5: Verify AddScanResult Endpoint

**File**: `src/KioskHealthApp.HttpApi/Controllers/ScanResultController.cs`

**Tasks**:
- [ ] Review existing endpoint
- [ ] Ensure it accepts new DTO properties
- [ ] Test endpoint manually

**Code Review**:
```csharp
[HttpPost]
[Route("AddScanResult")]
public async Task<IActionResult> AddScanResult([FromBody] ScanResultDto dto)
{
    try
    {
        // AutoMapper will now map the new fields automatically
        var scanResult = ObjectMapper.Map<ScanResultDto, ScanResult>(dto);

        await _scanResultRepository.InsertAsync(scanResult);
        await CurrentUnitOfWork.SaveChangesAsync();

        return Ok(new { success = true, message = "Scan result saved successfully" });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to save scan result");
        return StatusCode(500, new { success = false, message = ex.Message });
    }
}
```

**Connection Point**:
- **FROM Frontend**: Receives POST request from `saveFingerprintScan` service (Frontend Step 4)
- **TO Database**: Saves data to `ScanResults` table

---

#### ✅ Step 6: Update GetClientLatestScanResult Endpoint

**File**: `src/KioskHealthApp.HttpApi/Controllers/ScanResultController.cs`

**Tasks**:
- [ ] Ensure endpoint returns new fields
- [ ] Update response DTO if needed
- [ ] Test endpoint

**Code Hint**:
```csharp
[HttpGet]
[Route("GetClientLatestScanResult")]
public async Task<IActionResult> GetClientLatestScanResult([FromQuery] Guid clientId)
{
    var latestScan = await _scanResultRepository
        .Where(x => x.ClientId == clientId)
        .OrderByDescending(x => x.ScanDate)
        .FirstOrDefaultAsync();

    if (latestScan == null)
    {
        return NotFound();
    }

    // AutoMapper will include new fields
    var dto = ObjectMapper.Map<ScanResult, ScanResultDto>(latestScan);

    return Ok(dto);
}
```

**Connection Point**:
- **TO Frontend**: Sends scan results including new fields to health summary page and admin panel

---

#### ✅ Step 7: Update GetClientsReport Endpoint

**File**: `src/KioskHealthApp.HttpApi/Controllers/ClientController.cs`

**Tasks**:
- [ ] Include new scan result fields in report
- [ ] Update report DTO if needed
- [ ] Add scan type filter option

**Code Hint**:
```csharp
[HttpPost]
[Route("GetClientsReport")]
public async Task<IActionResult> GetClientsReport([FromBody] ClientReportRequestDto request)
{
    var query = _clientRepository
        .Include(c => c.ScanResults)
        .AsQueryable();

    // Apply filters
    if (!string.IsNullOrEmpty(request.ClientName))
    {
        query = query.Where(c => c.Name.Contains(request.ClientName));
    }

    // NEW: Filter by scan type
    if (!string.IsNullOrEmpty(request.ScanType))
    {
        query = query.Where(c => c.ScanResults.Any(sr => sr.ScanType == request.ScanType));
    }

    var clients = await query
        .Skip((request.Page - 1) * request.PageSize)
        .Take(request.PageSize)
        .Select(c => new ClientReportDto
        {
            ClientId = c.Id,
            Name = c.Name,
            // ... existing fields

            // Include latest scan with all fields
            LatestScan = c.ScanResults
                .OrderByDescending(sr => sr.ScanDate)
                .Select(sr => new ScanResultDto
                {
                    HeartRate10s = sr.HeartRate10s,
                    HrvSdnnMs = sr.HrvSdnnMs,
                    BreathingRate = sr.BreathingRate,
                    SystolicBloodPressureMmhg = sr.SystolicBloodPressureMmhg,
                    DiastolicBloodPressureMmhg = sr.DiastolicBloodPressureMmhg,
                    SpO2 = sr.SpO2,
                    PerfusionIndex = sr.PerfusionIndex,
                    MeanRR = sr.MeanRR,
                    ScanType = sr.ScanType,
                    ScanDate = sr.ScanDate
                })
                .FirstOrDefault()
        })
        .ToListAsync();

    return Ok(new { data = clients, totalCount = await query.CountAsync() });
}
```

**Connection Point**:
- **TO Frontend**: Admin panel fetches this data to display client reports (Frontend Step 10)

---

#### ✅ Step 8: Create EF Core Migration

**Tasks**:
- [ ] Create new migration for schema changes
- [ ] Review migration script
- [ ] Ensure no data loss

**Commands**:
```bash
# Navigate to DbMigrator project
cd src/KioskHealthApp.DbMigrator

# Create migration
dotnet ef migrations add Add_FingerprintScan_Fields --project ../KioskHealthApp.EntityFrameworkCore

# Review migration file in Migrations folder
```

**Migration File Preview**:
```csharp
public partial class Add_FingerprintScan_Fields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "SpO2",
            table: "ScanResults",
            type: "int",
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "PerfusionIndex",
            table: "ScanResults",
            type: "decimal(5,2)",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "MeanRR",
            table: "ScanResults",
            type: "int",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ScanType",
            table: "ScanResults",
            type: "nvarchar(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "Face");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "SpO2", table: "ScanResults");
        migrationBuilder.DropColumn(name: "PerfusionIndex", table: "ScanResults");
        migrationBuilder.DropColumn(name: "MeanRR", table: "ScanResults");
        migrationBuilder.DropColumn(name: "ScanType", table: "ScanResults");
    }
}
```

---

#### ✅ Step 9: Run Migration

**Tasks**:
- [ ] Backup production database
- [ ] Run migration on development database first
- [ ] Verify schema changes
- [ ] Run migration on staging
- [ ] Run migration on production

**Commands**:
```bash
# Development
dotnet ef database update --project ../KioskHealthApp.EntityFrameworkCore

# Or using DbMigrator
dotnet run --project src/KioskHealthApp.DbMigrator
```

**Verification SQL**:
```sql
-- Verify new columns exist
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ScanResults'
AND COLUMN_NAME IN ('SpO2', 'PerfusionIndex', 'MeanRR', 'ScanType');
```

---

#### ✅ Step 10: Update API Documentation

**File**: `docs/API_DOCUMENTATION.md` (or your docs location)

**Tasks**:
- [ ] Document new ScanResultDto properties
- [ ] Update API examples
- [ ] Document scan type filter

**Documentation Example**:
```markdown
### POST /api/ScanResult/AddScanResult

#### Request Body (ScanResultDto)
```json
{
  "clientId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "heartRate10s": 72,
  "hrvSdnnMs": 45,
  "breathingRate": 16,
  "systolicBloodPressureMmhg": 120,
  "diastolicBloodPressureMmhg": 80,
  "spO2": 98,               // NEW (optional)
  "perfusionIndex": 3.5,    // NEW (optional)
  "meanRR": 850,            // NEW (optional)
  "scanType": "Fingerprint", // NEW (required: "Face" or "Fingerprint")
  "scanDate": "2024-01-15T10:30:00Z"
}
```

#### Response
```json
{
  "success": true,
  "message": "Scan result saved successfully"
}
```
```

---

#### ✅ Step 11: Backend Testing

**Tasks**:
- [ ] Unit test ScanResult entity validation
- [ ] Integration test AddScanResult endpoint with new fields
- [ ] Test GetClientLatestScanResult returns new fields
- [ ] Test GetClientsReport includes fingerprint data
- [ ] Test AutoMapper mappings
- [ ] Test database constraints
- [ ] Verify backwards compatibility (existing face scans still work)

**Test Cases**:
```csharp
[Fact]
public async Task AddScanResult_WithFingerprintData_ShouldSaveSuccessfully()
{
    // Arrange
    var dto = new ScanResultDto
    {
        ClientId = Guid.NewGuid(),
        HeartRate10s = 72,
        HrvSdnnMs = 45,
        BreathingRate = 16,
        SystolicBloodPressureMmhg = 120,
        DiastolicBloodPressureMmhg = 80,
        SpO2 = 98,
        PerfusionIndex = 3.5m,
        MeanRR = 850,
        ScanType = "Fingerprint",
        ScanDate = DateTime.UtcNow
    };

    // Act
    var result = await _scanResultService.AddScanResultAsync(dto);

    // Assert
    Assert.True(result.Success);

    var saved = await _scanResultRepository.FirstOrDefaultAsync();
    Assert.Equal(98, saved.SpO2);
    Assert.Equal(3.5m, saved.PerfusionIndex);
    Assert.Equal(850, saved.MeanRR);
    Assert.Equal("Fingerprint", saved.ScanType);
}

[Fact]
public async Task AddScanResult_FaceScan_ShouldNotRequireFingerprintFields()
{
    // Arrange
    var dto = new ScanResultDto
    {
        ClientId = Guid.NewGuid(),
        HeartRate10s = 75,
        HrvSdnnMs = 50,
        BreathingRate = 14,
        SystolicBloodPressureMmhg = 118,
        DiastolicBloodPressureMmhg = 78,
        ScanType = "Face",
        ScanDate = DateTime.UtcNow
        // No SpO2, PerfusionIndex, MeanRR
    };

    // Act
    var result = await _scanResultService.AddScanResultAsync(dto);

    // Assert
    Assert.True(result.Success);
}
```

---

#### ✅ Step 12: Deploy to Production

**Tasks**:
- [ ] Merge feature branch to main
- [ ] Create release build
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Verify frontend can save fingerprint scans

**Deployment Checklist**:
```
□ Database migration completed successfully
□ New columns exist in production database
□ API endpoints return new fields
□ No breaking changes for existing face scans
□ Frontend successfully saves fingerprint data
□ Admin panel displays fingerprint results
□ API documentation updated
□ Monitoring alerts configured
```

---

## Data Mapping Reference

### SocketIO Response → Backend DTO Mapping

| SocketIO Field (vitals_results)    | Type    | Backend DTO Field           | Type      | Notes                          |
|------------------------------------|---------|-----------------------------|-----------|--------------------------------|
| `heart_rate`                       | int     | `HeartRate10s`              | int       | Heart rate in BPM              |
| `hrv_rate`                         | int     | `HrvSdnnMs`                 | int       | HRV (RMSSD method) in ms       |
| `resp_rate`                        | int     | `BreathingRate`             | int       | Respiration rate in breaths/min|
| `systolic_blood_pressure` (BP msg) | float   | `SystolicBloodPressureMmhg` | int       | Use calibrated if available    |
| `diastolic_blood_pressure` (BP msg)| float   | `DiastolicBloodPressureMmhg`| int       | Use calibrated if available    |
| `spo2_rate`                        | int     | `SpO2`                      | int?      | **NEW** - Oxygen saturation %  |
| `perfusion_index`                  | float   | `PerfusionIndex`            | decimal?  | **NEW** - Perfusion ratio      |
| `mean_rr`                          | int     | `MeanRR`                    | int?      | **NEW** - Mean RR interval (ms)|
| (hardcoded)                        | -       | `ScanType`                  | string    | **NEW** - Set to "Fingerprint" |
| (client-generated)                 | -       | `ScanDate`                  | DateTime  | Current timestamp              |

---

## Frontend ↔ Backend Connection Points

### 1. Scan Data Save Flow
```
Fingerprint Scanner (Frontend Step 7)
    ↓
    Receives SocketIO vitals data
    ↓
saveFingerprintScan Service (Frontend Step 4)
    ↓
    Maps SocketIO → Backend DTO
    ↓
POST /api/ScanResult/AddScanResult (Backend Step 5)
    ↓
    AutoMapper maps DTO → Entity (Backend Step 4)
    ↓
    Entity saved to database (Backend Step 9)
```

### 2. Admin Panel Data Retrieval Flow
```
Admin Panel Component (Frontend Step 10)
    ↓
    Fetches client reports
    ↓
POST /api/Client/GetClientsReport (Backend Step 7)
    ↓
    Queries database with new fields
    ↓
    Returns DTOs with fingerprint data
    ↓
Admin Panel displays scan results
```

### 3. Health Summary Retrieval Flow
```
Health Summary Page (Frontend)
    ↓
GET /api/ScanResult/GetClientLatestScanResult?clientId={id} (Backend Step 6)
    ↓
    Queries latest scan from database
    ↓
    Returns DTO with all vitals including fingerprint-specific
    ↓
Health Summary displays results
```

---

## Timeline Estimate

### Frontend Implementation: **3-5 days**
- Day 1: Steps 1-4 (Setup, services)
- Day 2: Steps 5-7 (UI components)
- Day 3: Step 8 (Integration)
- Day 4: Steps 9-11 (Translations, testing)
- Day 5: Step 12 (Deployment)

### Backend Implementation: **2-3 days**
- Day 1: Steps 1-5 (Database, entities, DTOs, endpoints)
- Day 2: Steps 6-9 (Additional endpoints, migrations)
- Day 3: Steps 10-12 (Documentation, testing, deployment)

### Total Estimated Time: **5-8 days**

---

## Success Criteria

### Functional Requirements
- ✅ User can choose between Face Scan and Fingerprint Scan
- ✅ Face Scan functionality remains unchanged
- ✅ Fingerprint Scan connects to SocketIO API successfully
- ✅ Real-time vitals display during fingerprint scan
- ✅ Scan completes after 30 seconds with stable readings
- ✅ Fingerprint data saves to backend database
- ✅ Admin panel displays fingerprint scan results
- ✅ Both scan types continue to same Symptoms → Questionnaire → Summary flow

### Technical Requirements
- ✅ No breaking changes to existing face scan
- ✅ Database migration completes without data loss
- ✅ All new fields properly mapped and validated
- ✅ Error handling for camera access, connection failures, timeouts
- ✅ Multi-language support (English/Arabic)
- ✅ Responsive design maintained
- ✅ Backwards compatibility with existing scans

### Quality Requirements
- ✅ Code follows project conventions
- ✅ TypeScript types properly defined
- ✅ API documentation updated
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ No console errors in production

---

## Troubleshooting Guide

### Issue: SocketIO Connection Fails
**Symptoms**: Scanner screen shows connection error
**Solutions**:
1. Verify URL: `wss://vitals.miavitals.com/v1/process_frame`
2. Check bearer token authentication
3. Verify CORS settings
4. Check network connectivity
5. Review browser console for WebSocket errors

### Issue: Camera Access Denied
**Symptoms**: Video preview black screen
**Solutions**:
1. Check browser permissions
2. Ensure HTTPS (required for camera access)
3. Test on different browser
4. Verify camera not in use by another app

### Issue: Vitals Not Displaying
**Symptoms**: Scan runs but no vitals shown
**Solutions**:
1. Check SocketIO `result` event listener
2. Verify finger detection (needs finger, not face)
3. Check frame rate (must be >= 6 FPS)
4. Review frame resolution (640x480 minimum)

### Issue: Data Not Saving to Backend
**Symptoms**: Scan completes but not in database
**Solutions**:
1. Check API endpoint URL in environment variables
2. Verify DTO structure matches backend
3. Review backend logs for errors
4. Check database migration ran successfully
5. Verify ClientId exists in database

### Issue: Admin Panel Not Showing New Fields
**Symptoms**: Fingerprint scans missing SpO2, etc.
**Solutions**:
1. Verify backend endpoint returns new fields
2. Check AutoMapper configuration
3. Refresh admin panel cache
4. Review network response in browser DevTools

---

## Additional Resources

### API Documentation
- **SocketIO API**: `/VideoStreamingAPI.md`
- **Backend API**: `/kiosk-backend.md`

### Related Files
- **Existing Face Scan**: `src/components/face-scan-screen.tsx`
- **Admin Panel**: `src/components/admin-panel.tsx`
- **Hooks**: `src/hooks/useShenaiSdk.ts`
- **Collections**: `src/collections/Clients.ts`

### External Dependencies
- **SocketIO Client**: https://socket.io/docs/v4/client-api/
- **MediaDevices API**: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices
- **ABP Framework**: https://docs.abp.io/

---

## Notes for AI Implementation

### Code Generation Guidelines
1. **Use Existing Patterns**: Follow patterns from `face-scan-screen.tsx` and `admin-panel.tsx`
2. **TypeScript First**: Always define interfaces before implementation
3. **Error Handling**: Wrap async operations in try-catch
4. **Cleanup**: Always cleanup resources (camera, sockets) in useEffect return
5. **Translation Keys**: Add all new UI text to translation files
6. **Sticky Button Pattern**: Use established flex layout pattern for all multi-step screens

### Testing Approach
1. Test each service independently first
2. Test components in isolation with mock data
3. Test integration with real SocketIO API
4. Test backend endpoints with Postman/Swagger
5. End-to-end test full flow

### Deployment Strategy
1. Deploy backend first (with migration)
2. Verify backend endpoints work
3. Deploy frontend
4. Monitor for errors in production logs

---

**Document Version**: 1.0
**Last Updated**: 2024-01-15
**Status**: Ready for Implementation
