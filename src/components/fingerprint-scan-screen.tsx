"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "@/hooks/useTranslation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, Activity, Droplet, Wind } from "lucide-react"
import { FingerprintSocketService, VitalsResult, BloodPressureResult } from "@/services/fingerprintSocketService"
import { FrameCaptureService } from "@/services/frameCapture"
import { saveFingerprintScan } from "@/services/saveFingerprintScan"
import { getAuthToken, clearAuthToken } from "@/services/fingerprintAuthService"
import { fingerprintSocketManager } from "@/services/fingerprintSocketManager"

interface FingerprintScanScreenProps {
  userId: string
  userEmail: string
  userAge: number
  userGender: 'male' | 'female'
  onBack: () => void
  onNext: () => void
}

export const FingerprintScanScreen = ({
  userId,
  userEmail,
  userAge,
  userGender,
  onBack,
  onNext
}: FingerprintScanScreenProps) => {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const videoRef = useRef<HTMLVideoElement>(null)
  const socketServiceRef = useRef<FingerprintSocketService | null>(null)
  const frameCaptureRef = useRef<FrameCaptureService | null>(null)

  const measurementStartTimeRef = useRef<number | null>(null)
  const measurementStartedRef = useRef(false)
  const socketFrameNumberRef = useRef(0)
  const lastDetectionFrameSentRef = useRef(0)
  const fingerDetectedRef = useRef(false)
  const frameBatchRef = useRef<Array<{
    base64Image: string
    captureTimestamp: number
    timeLapseSeconds: number
  }>>([])

  // Unique ID for this component instance
  const componentIdRef = useRef(`fingerprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  
  // Initialization guards
  const isInitializingRef = useRef(false)
  const hasInitializedRef = useRef(false)
  const isMountedRef = useRef(true)

  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [frameNumber, setFrameNumber] = useState(0)
  const [fingerDetected, setFingerDetected] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [clientFps, setClientFps] = useState(0) // Track actual client-side FPS

  // Vitals state
  const [vitals, setVitals] = useState<VitalsResult | null>(null)
  const [bloodPressure, setBloodPressure] = useState<BloodPressureResult | null>(null)
  const [scanComplete, setScanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Flag to track if we're waiting for final results before sending stop
  const waitingForFinalResultsRef = useRef(false)
  const pendingConnectPromiseRef = useRef<{ cancel: () => void } | null>(null)
  const pendingAuthRef = useRef<{ cancel: () => void } | null>(null)
  const isCleaningUpRef = useRef(false)

  // Initialize and start scan
  useEffect(() => {
    const componentId = componentIdRef.current
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`[${componentId}] 🎬 Component mounted`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    isMountedRef.current = true
    isCleaningUpRef.current = false

    const initializeScan = async () => {
      // STRICT guard: Multiple checks to prevent duplicate initialization
      if (isCleaningUpRef.current) {
        console.log(`[${componentId}] ⏭️ Cleanup in progress, skipping...`)
        return
      }

      if (isInitializingRef.current || hasInitializedRef.current) {
        console.log(`[${componentId}] ⏭️ Already initializing or initialized, skipping...`)
        return
      }

      // Check if socket manager already has an active connection
      if (fingerprintSocketManager.isConnected()) {
        console.log(`[${componentId}] ⚠️ Socket already connected by another instance, skipping...`)
        return
      }

      // Set initialization flag
      isInitializingRef.current = true
      console.log(`[${componentId}] 🚀 Starting initialization...`)

      try {
        // Clear the socket manager's cleanup timer if any
        fingerprintSocketManager.clearCleanupTimer()
        
        // Cleanup any existing local resources first
        console.log(`[${componentId}] 🧹 Cleaning up local resources...`)
        pendingConnectPromiseRef.current?.cancel()
        pendingConnectPromiseRef.current = null
        pendingAuthRef.current?.cancel()
        pendingAuthRef.current = null

        frameCaptureRef.current?.cleanup()
        frameCaptureRef.current = null

        // Wait for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100))

        // Check if video element is available
        if (!videoRef.current) {
          throw new Error('Video element not available. DOM may not be ready.')
        }

        // Check if still mounted
        if (!isMountedRef.current) {
          console.log(`[${componentId}] ⚠️ Component unmounted during initialization`)
          return
        }
        
        // Step 1: Login to get access token (uses cached token if available)
        console.log(`[${componentId}] 🔐 Getting authentication token...`)
        let cancelled = false
        pendingAuthRef.current = {
          cancel: () => {
            cancelled = true
          }
        }
        const accessToken = await getAuthToken().finally(() => {
          pendingAuthRef.current = null
        })
        if (cancelled || !isMountedRef.current) {
          console.log(`[${componentId}] ⚠️ Auth cancelled or unmounted; aborting`)
          return
        }
        console.log(`[${componentId}] ✅ Access token obtained`)

        // Step 2: Get or create socket connection from singleton manager
        socketServiceRef.current = await fingerprintSocketManager.getOrCreateSocket(componentId)
        console.log(`[${componentId}] 📡 Got socket service from manager`)

        // Step 3: Connect socket if not already connected
        if (!socketServiceRef.current.isConnected()) {
          console.log(`[${componentId}] 🔄 Socket not connected, connecting now...`)
          
          await new Promise<void>((resolve, reject) => {
            const startTimestamp = Date.now()
            const timeout = setTimeout(() => {
              reject(new Error('Socket connection timeout after 10 seconds'))
            }, 10000)

            let cancelled = false
            pendingConnectPromiseRef.current = {
              cancel: () => {
                cancelled = true
                clearTimeout(timeout)
                reject(new Error('Socket connection cancelled'))
              }
            }

            // CRITICAL: Set the onConnect callback BEFORE calling connect()
            // to avoid race condition where socket connects before callback is registered
            socketServiceRef.current!.onConnect(() => {
              if (cancelled || !isMountedRef.current) {
                console.log(`[${componentId}] ⚠️ Connect callback after cancel/unmount`)
                return
              }
              console.log(`[${componentId}] ✅ Socket connected successfully`)
              clearTimeout(timeout)
              pendingConnectPromiseRef.current = null
              resolve()
            })

            // NOW call connect() - callback is already registered
            socketServiceRef.current!.connect(
            {
              bpCalibrated: false,
              checkArrhythmias: false,
              checkStroke: false,
              client: 'health-kiosk',
              engageCarolChat: false,
              longMeasurement: false,
              party: userId,
              sampleTime: 30,
              storeResult: false, // We handle storage ourselves
              suspectedHypertensive: false,
              suspectedHypotensive: false,
              user_age: userAge,
              user_sex: userGender
            },
            accessToken,
            // onVitals
            (vitalsData) => {
              setVitals(vitalsData)
              setFingerDetected(vitalsData.calculation_parameters.finger_detected)
            },
            // onBloodPressure
            (bpData) => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('🩺 Blood pressure result received')
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

              setBloodPressure(bpData)

              if (waitingForFinalResultsRef.current) {
                console.log('✅ All results received, sending stop signal...')
                socketServiceRef.current?.sendStopSignal()
                setScanComplete(true)

                setTimeout(async () => {
                  if (vitals && bpData) {
                    console.log('💾 Saving scan results to backend...')
                    const result = await saveFingerprintScan(userId, vitals, bpData)
                    if (!result.success) {
                      setError(result.message)
                    } else {
                      console.log('✅ Scan results saved successfully')
                    }
                  }
                }, 100)
              }
            },
            // onStableReadings
            async () => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('🎉 STABLE READINGS ACHIEVED!')
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

              console.log('🛑 Stopping frame capture...')
              frameCaptureRef.current?.stopCapture()

              waitingForFinalResultsRef.current = true
              console.log('⏳ Waiting for blood_pressure_result before sending stop...')

              setIsScanning(false)

              setTimeout(() => {
                if (waitingForFinalResultsRef.current) {
                  console.log('⚠️ Timeout waiting for blood pressure, sending stop signal anyway...')
                  waitingForFinalResultsRef.current = false
                  socketServiceRef.current?.sendStopSignal()
                  setScanComplete(true)
                }
              }, 5000)
            },
            // onTimeout
            () => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('⏱️ SCAN TIMEOUT - Measurement incomplete')
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

              waitingForFinalResultsRef.current = false

              console.log('🛑 Stopping frame capture...')
              frameCaptureRef.current?.stopCapture()

              console.log('📤 Sending stop signal to server...')
              socketServiceRef.current?.sendStopSignal()

              console.log('✅ Frame sending stopped')

              setError(t('fingerprintScan.errors.timeout'))
              setIsScanning(false)
              clearTimeout(timeout)
              pendingConnectPromiseRef.current = null
              reject(new Error('Scan timeout'))
            },
            // onError
            (errorMsg) => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('❌ SCAN ERROR:', errorMsg)
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

              waitingForFinalResultsRef.current = false

              console.log('🛑 Stopping frame capture...')
              frameCaptureRef.current?.stopCapture()

              console.log('📤 Sending stop signal to server...')
              socketServiceRef.current?.sendStopSignal()

              console.log('✅ Frame sending stopped')

              setError(errorMsg)
              setIsScanning(false)
              clearTimeout(timeout)
              pendingConnectPromiseRef.current = null
              reject(new Error(errorMsg))
            }
          )
          })
        } else {
          console.log(`[${componentId}] ✅ Socket already connected, reusing existing connection`)
        }

        // Check if still mounted
        if (!isMountedRef.current) {
          console.log(`[${componentId}] ⚠️ Component unmounted before camera init`)
          return
        }

        console.log(`[${componentId}] 📹 Initializing camera...`)

        // Verify video element is still available
        if (!videoRef.current) {
          throw new Error('Video element lost during socket connection')
        }

        // NOW initialize frame capture
        frameCaptureRef.current = new FrameCaptureService()
        await frameCaptureRef.current.initialize(videoRef.current, {
          width: 640,
          height: 480,
          fps: 30  // 30 FPS = ~33ms between frames (well above 6 FPS minimum)
        })

        // Camera is now active
        setCameraActive(true)
        console.log(`[${componentId}] 📹 Camera is now active and displaying`)

        // CRITICAL: Verify socket is CONNECTED before starting frame capture
        if (!socketServiceRef.current?.isConnected()) {
          throw new Error('Socket not connected - cannot start frame capture')
        }

        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        console.log(`[${componentId}] ✅ Socket verified connected - ready to start frames`)
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

        // Wait a moment to ensure everything is stable
        await new Promise(resolve => setTimeout(resolve, 100))

        // Final check before starting
        if (!isMountedRef.current || isCleaningUpRef.current) {
          console.log(`[${componentId}] ⚠️ Component unmounted or cleaning up before frame capture start`)
          return
        }

        // Start frame capture immediately but only send frames once finger is detected
        const FPS = 30 // 30 FPS for camera capture
        const SAMPLE_TIME_SECONDS = 30

        let detectionFrameCounter = 0

        const updateFingerState = (value: boolean) => {
          if (fingerDetectedRef.current !== value) {
            fingerDetectedRef.current = value
            setFingerDetected(value)
          }
        }

        // Reset measurement state
        updateFingerState(false)
        setScanProgress(0)
        setFrameNumber(0)
        socketFrameNumberRef.current = 0
        measurementStartTimeRef.current = null
        measurementStartedRef.current = false
        frameBatchRef.current = []

        const detectFinger = (base64Image: string): boolean => {
          try {
            // Simple heuristic based on payload size
            const length = base64Image.length
            return length > 10000
          } catch (error) {
            console.error(`[${componentId}] Finger detection error:`, error)
            return false
          }
        }

        frameCaptureRef.current.startCapture((base64Image, captureTimestamp) => {
          if (!socketServiceRef.current || !isMountedRef.current || isCleaningUpRef.current) {
            console.log(`[${componentId}] ⚠️ Skipping frame - component unmounted or socket disconnected`)
            return 0
          }

          if (!socketServiceRef.current.isConnected()) {
            console.log(`[${componentId}] ⚠️ Skipping frame - socket not connected`)
            return 0
          }

          detectionFrameCounter += 1

          if (!fingerDetectedRef.current) {
            const detected = detectFinger(base64Image)
            if (!detected) {
              if (detectionFrameCounter % 10 === 0) {
                console.log(`[${componentId}] ⏳ Awaiting finger placement... (frame ${detectionFrameCounter}, size ${base64Image.length})`)
              }

              setScanProgress(0)
              setFrameNumber(0)
              updateFingerState(false)
              // Return processing time to keep capture cadence consistent
              return Date.now() - captureTimestamp
            }

            updateFingerState(true)
            measurementStartTimeRef.current = Date.now()
            measurementStartedRef.current = true
            socketFrameNumberRef.current = 0

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log(`[${componentId}] 👆 Finger detected locally - beginning frame transmission`)
            console.log(`   Detection after ${detectionFrameCounter} frames (size ${base64Image.length})`)
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          }

          const measurementStart = measurementStartTimeRef.current ?? Date.now()
          const timeLapseSeconds = (Date.now() - measurementStart) / 1000
          if (!measurementStartedRef.current || measurementStartTimeRef.current === null) {
            measurementStartTimeRef.current = Date.now()
            measurementStartedRef.current = true
            socketFrameNumberRef.current = 0
            lastDetectionFrameSentRef.current = base64Image.length
            frameBatchRef.current = []
          }

          frameBatchRef.current.push({
            base64Image,
            captureTimestamp,
            timeLapseSeconds
          })

          if (frameBatchRef.current.length < 6) {
            const processingTime = Date.now() - captureTimestamp
            const idealInterval = 1000 / FPS
            const actualInterval = Math.max(idealInterval, processingTime)
            const actualClientFPS = Math.max(1, Math.round(1000 / actualInterval))
            setClientFps(actualClientFPS)
            return processingTime
          }

          if (frameBatchRef.current.length === 6) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log(`[${componentId}] 🎬 Sending first batch of 6 frames to socket`)
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          }

          const batch = frameBatchRef.current.splice(0, 6)

          batch.forEach((frame, index) => {
            const frameNumberToSend = socketFrameNumberRef.current

            if (frameNumberToSend === 0) {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log(`[${componentId}] 🎬 Sending first batched frame to socket`)
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            }

            socketServiceRef.current!.sendFrame({
              frameNumber: frameNumberToSend,
              imageData: frame.base64Image,
              remoteVitals: false,
              stop: false,
              timeLapse: frame.timeLapseSeconds,
              userEmail
            })

            socketFrameNumberRef.current += 1

            if (index === batch.length - 1) {
              setFrameNumber(socketFrameNumberRef.current)
              setScanProgress(Math.min(100, (frame.timeLapseSeconds / SAMPLE_TIME_SECONDS) * 100))

              const processingTime = Date.now() - frame.captureTimestamp
              const idealInterval = 1000 / FPS
              const actualInterval = Math.max(idealInterval, processingTime)
              const actualClientFPS = Math.max(1, Math.round(1000 / actualInterval))
              setClientFps(actualClientFPS)

              console.log('FPS', actualClientFPS)
              console.log('time_delta', processingTime)
            }
          })

          if (frameBatchRef.current.length === 0) {
            const idealInterval = 1000 / FPS
            const lastFrame = batch[batch.length - 1]
            const processingTime = Date.now() - lastFrame.captureTimestamp
            return Math.max(0, idealInterval - processingTime)
          }

          return 0
        }, FPS) // 30 FPS target

        setIsScanning(true)

        // Mark as successfully initialized
        hasInitializedRef.current = true
        console.log(`[${componentId}] ✅ Fingerprint scan initialized successfully`)

      } catch (err) {
        console.error(`[${componentId}] ❌ Fingerprint scan initialization error:`, err)

        // Reset initialization flags on error so user can retry
        isInitializingRef.current = false
        hasInitializedRef.current = false

        if (err instanceof Error) {
          if (err.message.includes('Authentication') || err.message.includes('Login') || err.message.includes('cancelled')) {
            setError(t('fingerprintScan.errors.authenticationFailed'))
          } else if (err.message.includes('Socket connection timeout') || err.message.includes('Connection error')) {
            setError(t('fingerprintScan.errors.connectionFailed'))
          } else if (err.message.includes('camera') || err.message.includes('Camera')) {
            setError(t('fingerprintScan.errors.cameraFailed'))
          } else {
            setError(err.message)
          }
        } else {
          setError('Failed to initialize scan')
        }
      } finally {
        // Always reset initializing flag
        isInitializingRef.current = false
      }
    }

    initializeScan()

    // Cleanup on unmount
    return () => {
      const componentId = componentIdRef.current
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`[${componentId}] 🧹 Component unmounting - AGGRESSIVE CLEANUP`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      
      // Set cleanup flag FIRST to stop any ongoing frame capture
      isCleaningUpRef.current = true
      isMountedRef.current = false
      
      // IMMEDIATELY stop frame capture before anything else
      if (frameCaptureRef.current) {
        console.log(`[${componentId}] 🛑 Stopping frame capture IMMEDIATELY`)
        frameCaptureRef.current.stopCapture()
      }
      
      // Cancel pending operations
      pendingConnectPromiseRef.current?.cancel()
      pendingConnectPromiseRef.current = null
      pendingAuthRef.current?.cancel()
      pendingAuthRef.current = null

      // Now clean up camera
      frameCaptureRef.current?.cleanup()
      frameCaptureRef.current = null
      
      // Schedule socket cleanup with a delay (allows quick remounts to reuse the connection)
      if (socketServiceRef.current) {
        console.log(`[${componentId}] 📡 Scheduling socket cleanup (500ms delay)...`)
        fingerprintSocketManager.scheduleCleanup(500)
        socketServiceRef.current = null
      }

      // Reset states
      setCameraActive(false)
      setIsScanning(false)

      // Reset flags
      isInitializingRef.current = false
      hasInitializedRef.current = false
      
      console.log(`[${componentId}] ✅ Cleanup complete`)
    }
  }, [userId, userAge, userGender])  // Removed 't' from dependencies

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
              autoPlay
              playsInline
              muted
            />

            {/* Camera Initializing Overlay */}
            {!cameraActive && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg">{t('fingerprintScan.initializingCamera') || 'Initializing camera...'}</p>
                </div>
              </div>
            )}

            {/* Finger Detection Overlay */}
            {isScanning && cameraActive && (
              <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded">
                {fingerDetected ? (
                  <span className="text-green-400">✓ {t('fingerprintScan.fingerDetected')}</span>
                ) : (
                  <span className="text-yellow-400">{t('fingerprintScan.placeFinger')}</span>
                )}
              </div>
            )}

            {/* Scan Complete Overlay */}
            {scanComplete && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-600/90">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">✓</div>
                  <p className="text-2xl font-bold">{t('fingerprintScan.scanComplete') || 'Scan Complete!'}</p>
                  <p className="text-sm mt-2">{t('fingerprintScan.processingResults') || 'Processing results...'}</p>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {isScanning && fingerDetected && !scanComplete && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-700">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Client FPS Display (before vitals arrive) */}
        {isScanning && fingerDetected && !vitals && !scanComplete && (
          <div className="max-w-2xl mx-auto mb-4">
            <Card className="p-4 bg-blue-50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Client FPS (Sending)</p>
                  <p className="font-bold text-lg text-green-600">{clientFps.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Frame #</p>
                  <p className="font-bold text-lg">{frameNumber}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Diagnostic Info Display */}
        {vitals && isScanning && !scanComplete && (
          <div className="max-w-2xl mx-auto mb-4">
            <Card className="p-4 bg-blue-50">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Client FPS</p>
                  <p className="font-bold text-lg text-green-600">{clientFps.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Server FPS</p>
                  <p className="font-bold text-lg">{vitals.calculation_parameters.fps.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Confidence</p>
                  <p className="font-bold text-lg">{vitals.vitals_results.confidence.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Frame #</p>
                  <p className="font-bold text-lg">{vitals.calculation_parameters.frame_number || frameNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-bold text-lg">
                    {vitals.calculation_parameters.stable_readings ? '✓ Stable' : '⏳ Processing'}
                  </p>
                </div>
              </div>

              {/* Warnings */}
              {(vitals.calculation_parameters.face_moved ||
                vitals.calculation_parameters.motion_detected_count ||
                vitals.calculation_parameters.illumination_changed_count) && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Warnings:</p>
                  {vitals.calculation_parameters.face_moved && (
                    <p className="text-xs text-orange-600">⚠️ Movement detected</p>
                  )}
                  {vitals.calculation_parameters.motion_detected_count && (
                    <p className="text-xs text-orange-600">⚠️ Motion count: {vitals.calculation_parameters.motion_detected_count}</p>
                  )}
                  {vitals.calculation_parameters.illumination_changed_count && (
                    <p className="text-xs text-orange-600">⚠️ Light changes: {vitals.calculation_parameters.illumination_changed_count}</p>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

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
