"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "@/hooks/useTranslation"
import { Heart, Activity, Droplet, Wind } from "lucide-react"
import { FingerprintSocketService, VitalsResult, BloodPressureResult } from "@/services/fingerprintSocketService"
import { FrameCaptureService } from "@/services/frameCapture"
import { saveFingerprintScan } from "@/services/saveFingerprintScan"
import { getAuthToken } from "@/services/fingerprintAuthService"
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
  const measurementActiveRef = useRef(false)
  const socketFrameNumberRef = useRef(0)
  const fingerDetectedRef = useRef(false)
  const lastServerFingerStateRef = useRef<boolean>(false)

  // Unique ID for this component instance
  const componentIdRef = useRef(`fingerprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  
  // Initialization guards
  const isInitializingRef = useRef(false)
  const hasInitializedRef = useRef(false)
  const isMountedRef = useRef(true)

  const [cameraReady, setCameraReady] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [scanStarted, setScanStarted] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [frameNumber, setFrameNumber] = useState(0)
  const [fingerDetected, setFingerDetected] = useState(false)
  const [clientFps, setClientFps] = useState(0)

  // Vitals state
  const [vitals, setVitals] = useState<VitalsResult | null>(null)
  const [bloodPressure, setBloodPressure] = useState<BloodPressureResult | null>(null)
  const [scanComplete, setScanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const latestVitalsRef = useRef<VitalsResult | null>(null)

  const resetMeasurementState = (options?: { clearResults?: boolean; clearCompletion?: boolean }) => {
    const { clearResults = true, clearCompletion = true } = options || {}
    measurementStartTimeRef.current = null
    measurementActiveRef.current = false
    socketFrameNumberRef.current = 0
    waitingForFinalResultsRef.current = false
    lastServerFingerStateRef.current = false
    setIsScanning(false)
    setScanProgress(0)
    setFrameNumber(0)
    fingerDetectedRef.current = false
    setFingerDetected(false)
    if (clearResults) {
      setVitals(null)
      setBloodPressure(null)
      latestVitalsRef.current = null
    }
    if (clearCompletion) {
      setScanComplete(false)
    }
  }

  const beginMeasurement = () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎬 Beginning measurement (finger detected by server)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    measurementStartTimeRef.current = Date.now()
    measurementActiveRef.current = true
    socketFrameNumberRef.current = 0
    waitingForFinalResultsRef.current = false
    setIsScanning(true)
    setScanProgress(0)
    setFrameNumber(0)
    setError(null)
    setScanComplete(false)
  }

  const handleFingerLost = () => {
    if (!measurementActiveRef.current) {
      return
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🛑 Finger lost - resetting measurement state')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    stopMeasurement({ preserveResults: true })
    resetMeasurementState({ clearResults: false, clearCompletion: false })
  }

  const stopMeasurement = (options?: { showError?: string; complete?: boolean; preserveResults?: boolean }) => {
    const { showError, complete, preserveResults } = options || {}

    measurementActiveRef.current = false
    frameCaptureRef.current?.stopCapture()

    if (!preserveResults) {
      socketServiceRef.current?.sendStopSignal()
    }

    if (showError) {
      setError(showError)
    }

    if (complete) {
      setScanComplete(true)
    }

    setIsScanning(false)
    if (!complete) {
      setScanProgress((prev) => (prev > 0 ? prev : 0))
    } else {
      setScanProgress(100)
    }
  }

  // Flag to track if we're waiting for final results before sending stop
  const waitingForFinalResultsRef = useRef(false)
  const pendingConnectPromiseRef = useRef<{ cancel: () => void } | null>(null)
  const pendingAuthRef = useRef<{ cancel: () => void } | null>(null)
  const isCleaningUpRef = useRef(false)

  // STEP 1: Initialize camera and auth on mount (but don't start scanning)
  useEffect(() => {
    const componentId = componentIdRef.current
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`[${componentId}] 🎬 Component mounted - initializing camera and auth`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    isMountedRef.current = true
    isCleaningUpRef.current = false

    const initializeCameraAndAuth = async () => {
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
        
        // PHASE 1: Get authentication token
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
        setAuthReady(true)

        // PHASE 2: Initialize camera (but DON'T connect socket yet!)
        console.log(`[${componentId}] 📹 Initializing camera...`)

        // Verify video element is still available
        if (!videoRef.current) {
          throw new Error('Video element lost during auth')
        }

        // Initialize frame capture service
        frameCaptureRef.current = new FrameCaptureService()
        await frameCaptureRef.current.initialize(videoRef.current, {
          width: 640,
          height: 480,
          fps: 30
        })

        console.log(`[${componentId}] ✅ Camera initialized successfully`)
        setCameraReady(true)

        // Mark as successfully initialized (camera + auth only)
        hasInitializedRef.current = true
        console.log(`[${componentId}] ✅ Ready to start scan (waiting for user to click Start button)`)

      } catch (err) {
        console.error(`[${componentId}] ❌ Initialization error:`, err)
        isInitializingRef.current = false
        hasInitializedRef.current = false

        if (err instanceof Error) {
          if (err.message.includes('Authentication') || err.message.includes('Login')) {
            setError(t('fingerprintScan.errors.authenticationFailed'))
          } else if (err.message.includes('camera') || err.message.includes('Camera')) {
            setError(t('fingerprintScan.errors.cameraFailed'))
          } else {
            setError(err.message)
          }
        } else {
          setError('Failed to initialize')
        }
      } finally {
        isInitializingRef.current = false
      }
    }

    initializeCameraAndAuth()

    // Cleanup on unmount
    return () => {
      const componentId = componentIdRef.current
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`[${componentId}] 🧹 Component unmounting - cleanup`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      
      isCleaningUpRef.current = true
      isMountedRef.current = false
      
      // Cancel pending operations
      pendingConnectPromiseRef.current?.cancel()
      pendingAuthRef.current?.cancel()

      // Cleanup camera
      frameCaptureRef.current?.cleanup()
      frameCaptureRef.current = null
      
      // Cleanup socket if connected
      if (socketServiceRef.current) {
        fingerprintSocketManager.scheduleCleanup(500)
        socketServiceRef.current = null
      }

      isInitializingRef.current = false
      hasInitializedRef.current = false
    }
  }, []) // Run once on mount

  // STEP 2: Start scanning when user clicks the Start button
  const startScan = async () => {
    if (!cameraReady || !authReady || scanStarted) {
      console.log('Cannot start scan:', { cameraReady, authReady, scanStarted })
      return
    }

    const componentId = componentIdRef.current
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`[${componentId}] 🚀 User clicked Start - connecting socket and starting scan`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    setScanStarted(true)

    try {
      // Get auth token
      const accessToken = await getAuthToken()

      // Get socket service
      socketServiceRef.current = await fingerprintSocketManager.getOrCreateSocket(componentId)
      console.log(`[${componentId}] 📡 Got socket service from manager`)

      // Connect socket
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
              latestVitalsRef.current = vitalsData
              setVitals(vitalsData)
              
              // Use server's finger detection to control measurement
              const serverFingerDetected = vitalsData.calculation_parameters.finger_detected
              
              // Finger just detected by server - start measurement
              if (serverFingerDetected && !lastServerFingerStateRef.current) {
                console.log('✅ Server detected finger - starting measurement')
                fingerDetectedRef.current = true
                setFingerDetected(true)
                lastServerFingerStateRef.current = true
                
                // Start measurement if not already active
                if (!measurementActiveRef.current) {
                  beginMeasurement()
                }
              }
              
              // Finger lost according to server - stop measurement
              if (!serverFingerDetected && lastServerFingerStateRef.current) {
                console.log('❌ Server reports finger lost')
                fingerDetectedRef.current = false
                setFingerDetected(false)
                lastServerFingerStateRef.current = false
                handleFingerLost()
              }
            },
            // onBloodPressure
            (bpData) => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('🩺 Blood pressure result received')
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

              setBloodPressure(bpData)

              if (waitingForFinalResultsRef.current) {
                waitingForFinalResultsRef.current = false
                stopMeasurement({ complete: true, preserveResults: true })

                const vitalsToSave = latestVitalsRef.current
                if (vitalsToSave) {
                  console.log('💾 Saving scan results to backend...')
                  saveFingerprintScan(userId, vitalsToSave, bpData).then((result) => {
                    if (!result.success) {
                      setError(result.message)
                    } else {
                      console.log('✅ Scan results saved successfully')
                    }
                  })
                }
              }
            },
            // onStableReadings
            async () => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('🎉 STABLE READINGS ACHIEVED!')
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

              waitingForFinalResultsRef.current = true
              stopMeasurement({ preserveResults: true })
              setScanProgress(100)

              setTimeout(() => {
                if (waitingForFinalResultsRef.current) {
                  console.log('⚠️ Timeout waiting for blood pressure, sending stop signal anyway...')
                  waitingForFinalResultsRef.current = false
                  stopMeasurement({ complete: true })
                }
              }, 5000)
            },
            // onTimeout
            () => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('⏱️ SCAN TIMEOUT - Measurement incomplete')
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

              waitingForFinalResultsRef.current = false
              stopMeasurement({ showError: t('fingerprintScan.errors.timeout') })
              socketServiceRef.current?.sendStopSignal()
              reject(new Error('Scan timeout'))
            },
            // onError
            (errorMsg) => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('❌ SCAN ERROR:', errorMsg)
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

              waitingForFinalResultsRef.current = false
              stopMeasurement({ showError: errorMsg })
              socketServiceRef.current?.sendStopSignal()
              reject(new Error(errorMsg))
            }
          )
          })
        } else {
          console.log(`[${componentId}] ✅ Socket already connected, reusing existing connection`)
        }

        // Check if still mounted
        if (!isMountedRef.current) {
          console.log(`[${componentId}] ⚠️ Component unmounted before starting frame capture`)
          return
        }

        // Verify camera is ready
        if (!frameCaptureRef.current) {
          throw new Error('Camera not initialized')
        }

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

        // Start frame capture and send all frames to server
        // Server will detect finger and send finger_detected in response
        const FPS = 30 // 30 FPS for camera capture
        const SAMPLE_TIME_SECONDS = 30

        resetMeasurementState({ clearResults: false, clearCompletion: false })

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📹 Starting frame capture - waiting for server finger detection')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        frameCaptureRef.current.startCapture((base64Image, captureTimestamp) => {
          if (!socketServiceRef.current || !isMountedRef.current || isCleaningUpRef.current) {
            return 0
          }

          if (!socketServiceRef.current.isConnected()) {
            return 0
          }

          // Always send frames to server - server will detect finger
          const frameNumberToSend = socketFrameNumberRef.current
          const startTime = Date.now()

          // Calculate time lapse from measurement start (or from now if not started)
          const measurementStart = measurementActiveRef.current 
            ? (measurementStartTimeRef.current ?? Date.now())
            : Date.now()
          const timeLapseSeconds = (Date.now() - measurementStart) / 1000

          if (frameNumberToSend === 0) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log(`[${componentId}] 🎬 Sending first frame - server will detect finger`)
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          }

          // Send frame immediately - server will analyze and return finger_detected
          socketServiceRef.current!.sendFrame({
            frameNumber: frameNumberToSend,
            imageData: base64Image,
            remoteVitals: false,
            stop: false,
            timeLapse: timeLapseSeconds,
            userEmail
          })

          socketFrameNumberRef.current += 1

          // Update UI state - only show progress if measurement is active
          const framesSent = socketFrameNumberRef.current
          setFrameNumber(framesSent)
          
          if (measurementActiveRef.current) {
            const progressRatio = Math.min(1, timeLapseSeconds / SAMPLE_TIME_SECONDS)
            setScanProgress(progressRatio * 100)
          }

          // Calculate actual FPS based on processing time
          const processingTime = Date.now() - startTime
          const idealInterval = 1000 / FPS
          const actualInterval = Math.max(idealInterval, processingTime)
          const actualClientFPS = Math.max(1, Math.round(1000 / actualInterval))
          setClientFps(actualClientFPS)

          // Log every 30th frame for debugging
          if (frameNumberToSend % 30 === 0) {
            const status = fingerDetectedRef.current ? '✅ Finger detected' : '⏳ Waiting for finger'
            console.log(`[${componentId}] 📊 Frame #${frameNumberToSend} | ${status} | Processing: ${processingTime.toFixed(1)}ms | Client FPS: ${actualClientFPS}`)
          }

          // Return processing time to adjust next frame delay
          return processingTime
        }, FPS)

        setIsScanning(true)
        console.log(`[${componentId}] ✅ Scan started successfully - sending frames to server`)

      } catch (err) {
        console.error(`[${componentId}] ❌ Start scan error:`, err)
        setScanStarted(false)

        if (err instanceof Error) {
          if (err.message.includes('Socket connection timeout') || err.message.includes('Connection error')) {
            setError(t('fingerprintScan.errors.connectionFailed'))
          } else {
            setError(err.message)
          }
        } else {
          setError('Failed to start scan')
        }
      }
    }

  return (
    <div className="h-full flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6 sm:p-8 lg:p-10">
        {/* Header */}
        <div className="text-center pb-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#407EFF] mb-2">
            {t('fingerprintScan.title')}
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            {!cameraReady || !authReady 
              ? (t('fingerprintScan.preparing') || 'Preparing...') 
              : !scanStarted 
                ? (t('fingerprintScan.clickToStart') || 'Click "Start Scan" when ready')
                : fingerDetected 
                  ? (t('fingerprintScan.keepStill') || 'Keep your finger still') 
                  : (t('fingerprintScan.instruction') || 'Place your finger on the camera')
            }
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Video Section */}
          <div className="space-y-4">
            {/* Video Card */}
            <div 
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
            >
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Camera Initializing */}
                {!cameraReady && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#407EFF]/90">
                    <div className="text-center text-white">
                      <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                      <p className="text-lg font-semibold">{t('fingerprintScan.initializingCamera') || 'Initializing camera...'}</p>
                      <p className="mt-2 text-sm opacity-80">Please allow camera access</p>
                    </div>
                  </div>
                )}

                {/* Start Scan Button - Show when ready but not started */}
                {cameraReady && authReady && !scanStarted && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center">
                      <p className="text-white text-xl font-semibold mb-6">
                        {t('fingerprintScan.readyToScan') || 'Ready to start scan'}
                      </p>
                      <button
                        onClick={startScan}
                        className="px-8 py-4 bg-[#407EFF] hover:bg-[#3066CC] text-white text-lg font-bold rounded-2xl transition-colors shadow-lg"
                      >
                        {t('fingerprintScan.startButton') || 'Start Scan'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Finger Detection Badge - Only show when scan has started */}
                {scanStarted && (
                  <div className="absolute left-4 top-4">
                    {fingerDetected ? (
                      <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm font-semibold text-green-700">✓ {t('fingerprintScan.fingerDetected')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg">
                        <div className="h-2 w-2 rounded-full bg-[#407EFF]" />
                        <span className="text-sm font-semibold text-[#407EFF]">{t('fingerprintScan.placeFinger')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Indicator */}
                {isScanning && fingerDetected && (
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-white/90 rounded-full px-4 py-2 shadow-lg">
                      <span className="text-sm font-bold text-[#407EFF]">{Math.round(scanProgress)}%</span>
                    </div>
                  </div>
                )}

                {/* Scan Complete */}
                {scanComplete && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/90">
                    <div className="text-center text-white">
                      <div className="mb-4 text-6xl">✓</div>
                      <p className="text-2xl font-bold">{t('fingerprintScan.scanComplete') || 'Scan Complete!'}</p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/90">
                    <div className="text-center text-white p-6">
                      <div className="mb-4 text-4xl">⚠️</div>
                      <p className="text-lg font-semibold">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar (Mobile) */}
            {(isScanning || scanComplete) && fingerDetected && (
              <div 
                className="lg:hidden bg-white rounded-2xl p-4"
                style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Scan Progress</span>
                    <span className="text-xl font-bold text-[#407EFF]">{Math.round(scanProgress)}%</span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-[#407EFF] transition-all duration-500"
                      style={{ width: `${Math.min(100, scanProgress)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0s</span>
                    <span>30s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vitals Section */}
          <div className="space-y-4">
            {/* Status Card */}
            <div 
              className="bg-white rounded-2xl p-6"
              style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="text-xl font-bold text-[#407EFF]">
                    {scanComplete ? '✓ Completed' : fingerDetected ? 'Scanning...' : 'Waiting...'}
                  </p>
                </div>
                {vitals && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-[#407EFF]">
                      {vitals.vitals_results.confidence.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>

              {vitals && (
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span>Server FPS: {vitals.calculation_parameters.fps.toFixed(1)}</span>
                  <span>Frames: {frameNumber}</span>
                </div>
              )}
            </div>

            {/* Vitals Grid */}
            {vitals && (
              <div className="grid grid-cols-2 gap-4">
                {/* Heart Rate */}
                <div 
                  className="bg-white rounded-2xl p-4"
                  style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-5 w-5 text-[#407EFF]" />
                    <p className="text-xs text-gray-600">{t('vitals.heartRate')}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{vitals.vitals_results.heart_rate}</p>
                  <p className="text-xs text-gray-500">BPM</p>
                </div>

                {/* HRV */}
                <div 
                  className="bg-white rounded-2xl p-4"
                  style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-[#407EFF]" />
                    <p className="text-xs text-gray-600">{t('vitals.hrv')}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{vitals.vitals_results.hrv_rate}</p>
                  <p className="text-xs text-gray-500">ms</p>
                </div>

                {/* SpO2 */}
                <div 
                  className="bg-white rounded-2xl p-4"
                  style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Droplet className="h-5 w-5 text-[#407EFF]" />
                    <p className="text-xs text-gray-600">{t('vitals.spo2')}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{vitals.vitals_results.spo2_rate}%</p>
                  <p className="text-xs text-gray-500">Oxygen</p>
                </div>

                {/* Breathing Rate */}
                <div 
                  className="bg-white rounded-2xl p-4"
                  style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="h-5 w-5 text-[#407EFF]" />
                    <p className="text-xs text-gray-600">{t('vitals.respRate')}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{vitals.vitals_results.resp_rate}</p>
                  <p className="text-xs text-gray-500">BPM</p>
                </div>
              </div>
            )}

            {/* Blood Pressure */}
            {bloodPressure && (
              <div 
                className="bg-white rounded-2xl p-6"
                style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{t('vitals.bloodPressure')}</p>
                    <p className="text-3xl font-bold text-[#407EFF]">
                      {bloodPressure.bp_calibrated
                        ? `${bloodPressure.calibrated_systolic_blood_pressure}/${bloodPressure.calibrated_diastolic_blood_pressure}`
                        : `${bloodPressure.systolic_blood_pressure}/${bloodPressure.diastolic_blood_pressure}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">mmHg</p>
                  </div>
                  {bloodPressure.bp_calibrated && (
                    <div className="bg-green-500 rounded-full px-3 py-1">
                      <span className="text-xs font-semibold text-white">Calibrated</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="flex-shrink-0 pt-4 px-6 sm:px-8 lg:px-10 pb-8">
        <div className="flex justify-between gap-4">
          <button 
            onClick={onBack} 
            disabled={isScanning && !scanComplete}
            className="px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('buttons.back')}
          </button>
          <button
            onClick={onNext}
            disabled={!scanComplete}
            className="px-6 py-3 rounded-2xl bg-[#407EFF] text-white font-semibold hover:bg-[#3366CC] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {t('buttons.next')}
          </button>
        </div>
      </div>
    </div>
  )
}
