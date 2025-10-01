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
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

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
        // Initialize socket connection FIRST
        socketServiceRef.current = new FingerprintSocketService()

        // Wait for socket to connect before starting frame capture
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Socket connection timeout after 10 seconds'));
          }, 10000);

          // Get access token from environment
          const accessToken = process.env.NEXT_PUBLIC_VITALS_ACCESS_TOKEN || '';

          if (!accessToken) {
            reject(new Error('Missing NEXT_PUBLIC_VITALS_ACCESS_TOKEN environment variable'));
            return;
          }

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
              clearTimeout(timeout)
              reject(new Error('Scan timeout'))
            },
            // onError
            (errorMsg) => {
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

        // NOW initialize frame capture
        frameCaptureRef.current = new FrameCaptureService()
        await frameCaptureRef.current.initialize(videoRef.current!, {
          width: 640,
          height: 480,
          fps: 6
        })

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
        console.error('Fingerprint scan initialization error:', err)
        if (err instanceof Error) {
          if (err.message.includes('Socket connection timeout') || err.message.includes('Connection error')) {
            setError(t('fingerprintScan.errors.connectionFailed'))
          } else if (err.message.includes('camera') || err.message.includes('Camera')) {
            setError(t('fingerprintScan.errors.cameraFailed'))
          } else {
            setError(err.message)
          }
        } else {
          setError('Failed to initialize scan')
        }
      }
    }

    initializeScan()

    // Cleanup
    return () => {
      frameCaptureRef.current?.cleanup()
      socketServiceRef.current?.disconnect()
    }
  }, [userId, userAge, userGender, t])

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
