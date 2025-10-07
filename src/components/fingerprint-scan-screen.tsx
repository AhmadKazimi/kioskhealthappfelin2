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

  // Initialization guards
  const isInitializingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [frameNumber, setFrameNumber] = useState(0)
  const [fingerDetected, setFingerDetected] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)

  // Vitals state
  const [vitals, setVitals] = useState<VitalsResult | null>(null)
  const [bloodPressure, setBloodPressure] = useState<BloodPressureResult | null>(null)
  const [scanComplete, setScanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Flag to track if we're waiting for final results before sending stop
  const waitingForFinalResultsRef = useRef(false)

  // Initialize and start scan
  useEffect(() => {
    const initializeScan = async () => {
      // LOCAL guard: Component-specific check
      if (isInitializingRef.current || hasInitializedRef.current) {
        console.log('⏭️ Component already initializing or initialized, skipping...')
        return
      }

      // Set initialization flag
      isInitializingRef.current = true
      console.log('🚀 Starting fingerprint scan initialization...')

      try {
        // Cleanup any existing connections first
        console.log('🧹 Cleaning up existing connections...')
        frameCaptureRef.current?.cleanup()
        socketServiceRef.current?.disconnect()
        frameCaptureRef.current = null
        socketServiceRef.current = null

        // Wait for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100))

        // Check if video element is available
        if (!videoRef.current) {
          throw new Error('Video element not available. DOM may not be ready.')
        }

        // Step 1: Login to get access token (uses cached token if available)
        console.log('🔐 Getting authentication token...')
        const accessToken = await getAuthToken()
        console.log('✅ Access token obtained')

        // Step 2: Initialize socket connection
        socketServiceRef.current = new FingerprintSocketService()

        // Step 3: Wait for socket to connect before starting frame capture
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Socket connection timeout after 10 seconds'));
          }, 10000);

          socketServiceRef.current!.connect(
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

              // If we're waiting for final results, NOW send stop signal
              if (waitingForFinalResultsRef.current) {
                console.log('✅ All results received, sending stop signal...')

                // Send stop signal to server (server will disconnect)
                socketServiceRef.current?.sendStopSignal()

                // Complete the scan
                setScanComplete(true)

                // Save to backend
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

              // STOP frame capture (no more frames needed)
              console.log('🛑 Stopping frame capture...')
              frameCaptureRef.current?.stopCapture()

              // Set flag to wait for blood pressure result
              waitingForFinalResultsRef.current = true
              console.log('⏳ Waiting for blood_pressure_result before sending stop...')

              // Update UI state
              setIsScanning(false)

              // Timeout fallback: if blood pressure doesn't arrive in 5 seconds, send stop anyway
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

              // Reset waiting flag
              waitingForFinalResultsRef.current = false

              // STOP frame capture immediately
              console.log('🛑 Stopping frame capture...')
              frameCaptureRef.current?.stopCapture()

              // Send stop signal to server (server will disconnect)
              console.log('📤 Sending stop signal to server...')
              socketServiceRef.current?.sendStopSignal()

              console.log('✅ Frame sending stopped')

              // Update UI state
              setError(t('fingerprintScan.errors.timeout'))
              setIsScanning(false)
              clearTimeout(timeout)
              reject(new Error('Scan timeout'))
            },
            // onError
            (errorMsg) => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('❌ SCAN ERROR:', errorMsg)
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

              // Reset waiting flag
              waitingForFinalResultsRef.current = false

              // STOP frame capture immediately
              console.log('🛑 Stopping frame capture...')
              frameCaptureRef.current?.stopCapture()

              // Send stop signal to server (server will disconnect)
              console.log('📤 Sending stop signal to server...')
              socketServiceRef.current?.sendStopSignal()

              console.log('✅ Frame sending stopped')

              // Update UI state
              setError(errorMsg)
              setIsScanning(false)
              clearTimeout(timeout)
              reject(new Error(errorMsg))
            }
          )

          // Wait for socket to actually connect
          socketServiceRef.current!.onConnect(() => {
            console.log('Socket connected successfully')
            clearTimeout(timeout)
            resolve()
          })
        })

        console.log('Socket connected, initializing camera...')

        // Verify video element is still available
        if (!videoRef.current) {
          throw new Error('Video element lost during socket connection')
        }

        // NOW initialize frame capture
        frameCaptureRef.current = new FrameCaptureService()
        await frameCaptureRef.current.initialize(videoRef.current, {
          width: 640,
          height: 480,
          fps: 6
        })

        // Camera is now active
        setCameraActive(true)
        console.log('📹 Camera is now active and displaying')

        // Start frame capture
        let currentFrame = 0
        frameCaptureRef.current.startCapture((base64Image) => {
          if (!socketServiceRef.current) return

          const timeLapse = socketServiceRef.current.getTimeLapse()

          // Log first frame for verification
          if (currentFrame === 0) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎬 SENDING FIRST FRAME');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Frame metadata structure (matches API spec):');
            console.log({
              frameNumber: currentFrame,
              imageDataLength: base64Image.length,
              remoteVitals: false,
              stop: false,
              timeLapse: timeLapse,
              userEmail: userEmail
            });
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          }

          socketServiceRef.current.sendFrame({
            frameNumber: currentFrame,
            imageData: base64Image,
            remoteVitals: false,
            stop: false,
            timeLapse: timeLapse,
            userEmail: userEmail
          })

          setFrameNumber(currentFrame)
          setScanProgress((timeLapse / 30) * 100) // 30 second scan
          currentFrame++
        }, 6)

        setIsScanning(true)

        // Mark as successfully initialized
        hasInitializedRef.current = true
        console.log('✅ Fingerprint scan initialized successfully')

      } catch (err) {
        console.error('❌ Fingerprint scan initialization error:', err)

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
      console.log('🧹 Component unmounting, cleaning up...')
      frameCaptureRef.current?.cleanup()
      socketServiceRef.current?.disconnect()

      // Reset states
      setCameraActive(false)
      setIsScanning(false)

      // Reset flags to allow re-initialization on next mount
      isInitializingRef.current = false
      hasInitializedRef.current = false

      // Clear auth token on unmount (optional - remove if you want to keep token cached)
      // clearAuthToken()
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
            {isScanning && !scanComplete && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-700">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Diagnostic Info Display */}
        {vitals && isScanning && !scanComplete && (
          <div className="max-w-2xl mx-auto mb-4">
            <Card className="p-4 bg-blue-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">FPS</p>
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
