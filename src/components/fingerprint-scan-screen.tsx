"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "@/hooks/useTranslation"
import { Heart, Activity, Droplet, Wind } from "lucide-react"
import { FingerprintSocketService, VitalsResult, BloodPressureResult, ArrhythmiaResult } from "@/services/fingerprintSocketService"
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
  const frameProcessingLoopRef = useRef<NodeJS.Timeout | null>(null)

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
  const [fingerDetected, setFingerDetected] = useState(false)

  // Vitals state
  const [vitals, setVitals] = useState<VitalsResult | null>(null)
  const [bloodPressure, setBloodPressure] = useState<BloodPressureResult | null>(null)
  const [, setArrhythmia] = useState<ArrhythmiaResult | null>(null)
  const [waitingForBloodPressure, setWaitingForBloodPressure] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
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
    fingerDetectedRef.current = false
    setFingerDetected(false)
    setWaitingForBloodPressure(false)
    if (clearResults) {
      setVitals(null)
      setBloodPressure(null)
      setArrhythmia(null)
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
    setError(null)
    setScanComplete(false)
  }

  const stopMeasurement = (options?: { showError?: string; complete?: boolean; preserveResults?: boolean }) => {
    const { showError, complete, preserveResults } = options || {}

    measurementActiveRef.current = false

    if (frameProcessingLoopRef.current) {
      clearTimeout(frameProcessingLoopRef.current);
      frameProcessingLoopRef.current = null;
    }

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
    const componentId = componentIdRef.current;
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[${componentId}] 🎬 Component mounted - initializing camera and auth`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    isMountedRef.current = true;
    isCleaningUpRef.current = false;

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

        // Check if video element is available with retries
        let videoElement = videoRef.current
        if (!videoElement) {
          console.log(`[${componentId}] ⏳ Video element not ready, waiting...`)
          await new Promise(resolve => setTimeout(resolve, 200))
          videoElement = videoRef.current
        }

        if (!videoElement) {
          throw new Error('Video element not available after waiting. DOM may not be ready.')
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
        await getAuthToken().finally(() => {
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

        // Initialize frame capture service with retry logic
        frameCaptureRef.current = new FrameCaptureService()

        try {
          await frameCaptureRef.current.initialize(videoRef.current, {
            width: 640,
            height: 480,
            fps: 15
          })
          console.log(`[${componentId}] ✅ Camera initialized successfully`)
          setCameraReady(true)
        } catch (cameraError) {
          console.warn(`[${componentId}] ⚠️ First camera init attempt failed, retrying...`, cameraError)

          // Wait a bit and retry once
          await new Promise(resolve => setTimeout(resolve, 500))

          if (!isMountedRef.current) {
            console.log(`[${componentId}] ⚠️ Component unmounted during camera retry`)
            return
          }

          // Retry camera initialization
          await frameCaptureRef.current.initialize(videoRef.current, {
            width: 640,
            height: 480,
            fps: 15
          })
          console.log(`[${componentId}] ✅ Camera initialized successfully on retry`)
          setCameraReady(true)
        }

        // Mark as successfully initialized (camera + auth only)
        hasInitializedRef.current = true
        console.log(`[${componentId}] ✅ Ready to start scan (waiting for user to click Start button)`)

      } catch (err) {
        console.error(`[${componentId}] ❌ Initialization error:`, err)
        isInitializingRef.current = false
        hasInitializedRef.current = false

        if (err instanceof Error) {
          const errorMessage = err.message.toLowerCase()

          // Check for specific error types
          if (errorMessage.includes('authentication') || errorMessage.includes('login') || errorMessage.includes('token')) {
            setError(t('fingerprintScan.errors.authenticationFailed'))
          } else if (
            errorMessage.includes('permission') ||
            errorMessage.includes('notallowederror') ||
            errorMessage.includes('access denied')
          ) {
            // Camera permission denied - legitimate error
            setError(t('fingerprintScan.errors.cameraFailed'))
          } else if (
            errorMessage.includes('notfounderror') ||
            errorMessage.includes('no camera') ||
            errorMessage.includes('camera not found')
          ) {
            // No camera device found
            setError(t('fingerprintScan.errors.cameraFailed'))
          } else if (errorMessage.includes('video element')) {
            // DOM/React rendering issue - show generic message
            setError('Camera initialization failed. Please try again.')
          } else {
            // Generic error - show the actual message for debugging
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
  }, [t]) // Run once on once on mount

  // STEP 2: Start scanning when user clicks the Start button
  const startScan = async () => {
    if (!cameraReady || !authReady || scanStarted) {
      return;
    }

    const componentId = componentIdRef.current;
    console.log(`[${componentId}] 🚀 User clicked Start - replicating example logic`);

    setScanStarted(true);
    resetMeasurementState({ clearResults: true, clearCompletion: true });

    try {
      const accessToken = await getAuthToken();
      const socketService = await fingerprintSocketManager.getOrCreateSocket(componentId);
      socketServiceRef.current = socketService;

      const SAMPLE_TIME_SECONDS = 100;

      // Connect socket
      if (!socketService.isConnected()) {
        console.log(`[${componentId}] 🔄 Socket not connected, connecting now...`);
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Socket connection timeout')), 10000);
          socketService.onConnect(() => {
            clearTimeout(timeout);
            resolve();
          });
          socketService.connect(
            {
              bpCalibrated: false,
              checkArrhythmias: true,
              checkStroke: false,
              client: 'health-kiosk',
              engageCarolChat: false,
              longMeasurement: true,
              party: userId,
              sampleTime: SAMPLE_TIME_SECONDS,
              storeResult: false,
              suspectedHypertensive: false,
              suspectedHypotensive: false,
              user_age: userAge,
              user_sex: userGender,
            },
            accessToken,
            // onVitals
            (vitalsData) => {
              latestVitalsRef.current = vitalsData;
              setVitals(vitalsData);
              const params = vitalsData.calculation_parameters;
              const serverFingerDetected = params.finger_detected;

              if (serverFingerDetected && !measurementActiveRef.current) {
                beginMeasurement();
              }
              setFingerDetected(serverFingerDetected);

              if (params.stable_readings) {
                console.log('🎉 STABLE READINGS RECEIVED! Stopping frame stream, but keeping socket open for BP result.');
                if (frameProcessingLoopRef.current) {
                  clearTimeout(frameProcessingLoopRef.current);
                  frameProcessingLoopRef.current = null;
                }
                setWaitingForBloodPressure(true);
                setScanProgress(100);
              }
            },
            // onBloodPressure
            (bpData) => {
              console.log('🩺 BLOOD PRESSURE RESULT RECEIVED');
              setBloodPressure(bpData);
              setWaitingForBloodPressure(false);
              setScanComplete(true);
              // Now we can disconnect
              socketService.disconnect();
            },
            // onArrhythmia
            (arrhythmiaData) => {
              setArrhythmia(arrhythmiaData);
            },
            // onStableReadings (This is a separate event that might not be used, the flag in 'onVitals' is more reliable)
            () => {},
            // onTimeout
            () => {
              console.log('⏱️ SERVER TIMEOUT');
              if (frameProcessingLoopRef.current) {
                clearTimeout(frameProcessingLoopRef.current);
                frameProcessingLoopRef.current = null;
              }
              stopMeasurement({
                showError: t('fingerprintScan.errors.timeout'),
              });
            },
            // onError
            (errorMsg) => {
              console.log('❌ SCAN ERROR:', errorMsg);
              if (frameProcessingLoopRef.current) {
                clearTimeout(frameProcessingLoopRef.current);
                frameProcessingLoopRef.current = null;
              }
              stopMeasurement({ showError: errorMsg });
              reject(new Error(errorMsg));
            }
          );
        });
      }

      // Start frame capture
      if (!frameCaptureRef.current) throw new Error('Camera not initialized');
      
      console.log('📹 Starting frame capture loop...');
      setIsScanning(true);

      const FPS = 15; // Target FPS
      const processVideo = () => {
        const timeStamp = Date.now();

        if (!socketService.isConnected()) {
            if (frameProcessingLoopRef.current) {
                clearTimeout(frameProcessingLoopRef.current);
                frameProcessingLoopRef.current = null;
            }
            return;
        }

        if (!frameCaptureRef.current) {
            return;
        }
        const base64Image = frameCaptureRef.current.captureFrame();
        if (!base64Image) {
            frameProcessingLoopRef.current = setTimeout(processVideo, 1000 / FPS);
            return;
        }

        const timeLapseSeconds = (Date.now() - (measurementStartTimeRef.current || Date.now())) / 1000;

        if (measurementActiveRef.current) {
            const progress = Math.min(99, (timeLapseSeconds / SAMPLE_TIME_SECONDS) * 100);
            setScanProgress(progress);
        }

        socketService.sendFrame({
            frameNumber: socketFrameNumberRef.current++,
            imageData: base64Image,
            remoteVitals: false,
            stop: false,
            timeLapse: timeLapseSeconds,
            userEmail,
        });

        // The "Time Delta" logic
        const processingTime = Date.now() - timeStamp;
        const delay = Math.max(0, (1000 / FPS) - processingTime);
        frameProcessingLoopRef.current = setTimeout(processVideo, delay);
      };

      // Start the loop
      processVideo();

    } catch (err) {
      console.error(`[${componentId}] ❌ Start scan error:`, err);
      setScanStarted(false);
      setError(err instanceof Error ? err.message : 'Failed to start scan');
    }
  };

  // Handle Next button click - save data then navigate to results page
  const handleNext = async () => {
    // Prevent double-clicking
    if (isSaving) return

    // If we have vitals and BP data, save them before proceeding to results
    if (vitals && bloodPressure) {
      setIsSaving(true)

      try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('💾 SAVING fingerprint scan results to backend...')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        const result = await saveFingerprintScan(userId, vitals, bloodPressure)

        if (result.success) {
          console.log('✅ Save successful, navigating to results page')
          setIsSaving(false)
          onNext()
        } else {
          console.error('❌ Save failed:', result.message)
          setError(result.message)
          setIsSaving(false)
        }
      } catch (error) {
        console.error('❌ Save error:', error)
        setError(error instanceof Error ? error.message : 'Failed to save results')
        setIsSaving(false)
      }
    } else {
      // No data to save, just proceed
      console.warn('⚠️ No vitals or BP data to save, proceeding anyway')
      onNext()
    }
  }

  return (
    <div className="h-full flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center pb-4 sm:pb-6 lg:pb-6 max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#407EFF] mb-2">
            {t('fingerprintScan.title')}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
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

        {/* LAYOUT - All content stacked, video centered */}
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Video Section */}
          <div className="space-y-4">
            {/* Video Card - Centered */}
            <div 
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
            >
              <div className="relative aspect-video bg-black max-h-[350px] md:max-h-[500px]">
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
                    <div className="text-center text-white px-4">
                      <div className="mx-auto mb-4 lg:mb-6 h-16 w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24 animate-spin rounded-full border-4 lg:border-[6px] border-white/30 border-t-white" />
                      <p className="text-lg lg:text-2xl xl:text-3xl font-semibold">{t('fingerprintScan.initializingCamera') || 'Initializing camera...'}</p>
                      <p className="mt-2 text-sm lg:text-base xl:text-lg opacity-80">{t('fingerprintScan.allowCameraAccess') || 'Please allow camera access'}</p>
                    </div>
                  </div>
                )}

            {/* Start Scan Button - Overlay (Both Mobile & Desktop) */}
            {cameraReady && authReady && !scanStarted && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center px-4 max-w-md">
                  <p className="text-white text-lg font-semibold mb-6">
                    {t('fingerprintScan.placeFingerAndStart') || 'Place your finger on camera and click start'}
                  </p>
                  <button
                    onClick={startScan}
                    className="px-8 py-3 bg-gradient-to-r from-[#407EFF] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#407EFF] text-white text-base md:text-lg font-medium rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    {t('fingerprintScan.startButton') || 'Start Scan'}
                  </button>
                </div>
              </div>
            )}

                {/* Finger Detection Badge - Only show when scan has started */}
                {scanStarted && (
                  <div className="absolute left-4 lg:left-6 top-4 lg:top-6">
                    {fingerDetected ? (
                      <div className="flex items-center gap-2 lg:gap-3 rounded-full bg-white/90 px-4 lg:px-6 py-2 lg:py-3 shadow-lg">
                        <div className="h-2 w-2 lg:h-3 lg:w-3 rounded-full bg-green-500" />
                        <span className="text-sm lg:text-base xl:text-lg font-semibold text-green-700">✓ {t('fingerprintScan.fingerDetected')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 lg:gap-3 rounded-full bg-white/90 px-4 lg:px-6 py-2 lg:py-3 shadow-lg">
                        <div className="h-2 w-2 lg:h-3 lg:w-3 rounded-full bg-[#407EFF]" />
                        <span className="text-sm lg:text-base xl:text-lg font-semibold text-[#407EFF]">{t('fingerprintScan.placeFinger')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Bar - Full Width at Bottom - Shows once measurement starts */}
                {isScanning && (
                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">{t('fingerprintScan.scanProgress')}</span>
                        <span className="text-lg font-bold text-[#407EFF]">{Math.round(scanProgress)}%</span>
                      </div>
                      <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            fingerDetected ? 'bg-[#407EFF]' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min(100, scanProgress)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{t('fingerprintScan.startTime')}</span>
                        <span>{t('fingerprintScan.endTime')}</span>
                      </div>
                      {!fingerDetected && scanProgress > 0 && (
                        <p className="text-xs text-yellow-600 font-medium text-center">
                          ⚠️ {t('fingerprintScan.fingerNotDetectedContinuing') || 'Finger not detected - place finger back on camera'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Waiting for Blood Pressure - Full Screen Overlay */}
                {waitingForBloodPressure && !scanComplete && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#407EFF]/90">
                    <div className="text-center text-white px-4">
                      <div className="mx-auto mb-4 lg:mb-6 h-16 w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24 animate-spin rounded-full border-4 lg:border-[6px] border-white/30 border-t-white" />
                      <p className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-3">{t('fingerprintScan.calculatingBloodPressure') || 'Calculating Blood Pressure'}</p>
                      <p className="text-base lg:text-lg xl:text-xl opacity-90">
                        {t('fingerprintScan.pleaseWait') || 'Please wait while we analyze your results...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Scan Complete */}
                {scanComplete && !waitingForBloodPressure && !isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/90">
                    <div className="text-center text-white px-4">
                      <div className="mb-4 lg:mb-6 text-6xl lg:text-7xl xl:text-8xl">✓</div>
                      <p className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-3">{t('fingerprintScan.scanComplete') || 'Scan Complete!'}</p>
                      <p className="text-base lg:text-lg xl:text-xl opacity-90">
                        {t('fingerprintScan.reviewAndContinue') || 'Click Next to review your detailed results'}
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-2 text-sm lg:text-base opacity-80">
                        <span>👇</span>
                        <span>{t('fingerprintScan.clickNextBelow') || 'Click "Next" button below to continue'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Saving Results Overlay */}
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/95 z-50">
                    <div className="text-center px-4">
                      <div className="mx-auto mb-4 lg:mb-6 h-16 w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24 animate-spin rounded-full border-4 lg:border-[6px] border-[#407EFF]/30 border-t-[#407EFF]" />
                      <p className="text-lg lg:text-2xl xl:text-3xl font-semibold text-[#407EFF]">
                        {t('fingerprintScan.savingResults') || 'Saving results...'}
                      </p>
                      <p className="mt-2 text-sm lg:text-base xl:text-lg text-gray-600">
                        {t('fingerprintScan.pleaseWait') || 'Please wait...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/90">
                    <div className="text-center text-white px-4 py-6 max-w-md">
                      <div className="mb-3 text-3xl md:text-4xl">⚠️</div>
                      <p className="text-sm md:text-base font-semibold mb-4 px-2">{error}</p>
                      <button
                        onClick={async () => {
                          console.log('🔄 Retry clicked - resetting scan on same page')
                          
                          // Clear error and reset all states
                          setError(null)
                          setCameraReady(false)
                          setAuthReady(false)
                          setScanStarted(false)
                          resetMeasurementState({ clearResults: true, clearCompletion: true })
                          
                          // Cleanup existing resources
                          frameCaptureRef.current?.cleanup()
                          frameCaptureRef.current = null
                          
                          if (socketServiceRef.current) {
                            socketServiceRef.current.sendStopSignal()
                            fingerprintSocketManager.scheduleCleanup(100)
                            socketServiceRef.current = null
                          }
                          
                          // Reset initialization flags
                          hasInitializedRef.current = false
                          isInitializingRef.current = false
                          
                          // Wait a moment for cleanup
                          await new Promise(resolve => setTimeout(resolve, 200))
                          
                          // Re-initialize camera and auth (same as mount logic)
                          try {
                            isInitializingRef.current = true
                            
                            // Clear socket manager's cleanup timer
                            fingerprintSocketManager.clearCleanupTimer()
                            
                            // Get auth token
                            console.log('🔐 Getting authentication token...')
                            await getAuthToken()
                            console.log('✅ Access token obtained')
                            setAuthReady(true)
                            
                            // Initialize camera
                            if (!videoRef.current) {
                              throw new Error('Video element not available')
                            }
                            
                            console.log('📹 Initializing camera...')
                            frameCaptureRef.current = new FrameCaptureService()
                            await frameCaptureRef.current.initialize(videoRef.current, {
                              width: 640,
                              height: 480,
                              fps: 30
                            })
                            
                            console.log('✅ Camera initialized - ready to scan')
                            setCameraReady(true)
                            hasInitializedRef.current = true
                            
                          } catch (err) {
                            console.error('❌ Retry initialization error:', err)
                            if (err instanceof Error) {
                              setError(err.message)
                            } else {
                              setError('Failed to initialize')
                            }
                          } finally {
                            isInitializingRef.current = false
                          }
                        }}
                        className="px-6 py-2 bg-white hover:bg-gray-100 text-red-600 text-sm md:text-base font-medium rounded-xl transition-all shadow-lg hover:shadow-xl"
                      >
                        {t('buttons.retry') || 'Retry'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Status & Vitals Section - Below video */}
          <div className="space-y-4">
            {/* Status Card - Hidden (for debugging only) */}
            {/* <div 
              className="bg-white rounded-2xl p-4"
              style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <p className="text-lg md:text-xl font-bold text-[#407EFF]">
                    {scanComplete ? '✓ Completed' : fingerDetected ? 'Scanning...' : 'Waiting...'}
                  </p>
                </div>
                {vitals && (
                  <div className="text-right">
                    <p className="text-xs text-gray-600 mb-1">Confidence</p>
                    <p className="text-lg md:text-xl font-bold text-[#407EFF]">
                      {vitals.vitals_results.confidence.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>

              {vitals && (
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span>Server FPS: {vitals.calculation_parameters.fps.toFixed(1)}</span>
                  <span>Frames: {frameNumber}</span>
                </div>
              )}
            </div> */}

            {/* Vitals Grid - Horizontal on larger screens */}
            {vitals && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Heart Rate */}
                <div 
                  className="bg-white rounded-2xl p-3"
                  style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Heart className="h-4 w-4 text-[#407EFF]" />
                    <p className="text-xs text-gray-600">{t('vitals.heartRate')}</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{vitals.vitals_results.heart_rate}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('userProfile.vitals.bpm')}</p>
                </div>

                {/* HRV */}
                <div 
                  className="bg-white rounded-2xl p-3"
                  style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Activity className="h-4 w-4 text-[#407EFF]" />
                    <p className="text-xs text-gray-600">{t('vitals.hrv')}</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{vitals.vitals_results.hrv_rate}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('userProfile.vitals.ms')}</p>
                </div>

                {/* SpO2 */}
                <div 
                  className="bg-white rounded-2xl p-3"
                  style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Droplet className="h-4 w-4 text-[#407EFF]" />
                    <p className="text-xs text-gray-600">{t('vitals.spo2')}</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{vitals.vitals_results.spo2_rate}%</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('fingerprintScan.oxygen')}</p>
                </div>

                {/* Breathing Rate */}
                <div 
                  className="bg-white rounded-2xl p-3"
                  style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Wind className="h-4 w-4 text-[#407EFF]" />
                    <p className="text-xs text-gray-600">{t('vitals.respRate')}</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{vitals.vitals_results.resp_rate}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('userProfile.vitals.bpm')}</p>
                </div>
              </div>
            )}

            {/* Blood Pressure - Only show if we have the result and not waiting */}
            {!waitingForBloodPressure && bloodPressure ? (
              <div 
                className="bg-white rounded-2xl p-4"
                style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5">{t('vitals.bloodPressure')}</p>
                    <p className="text-2xl md:text-3xl font-bold text-[#407EFF]">
                      {bloodPressure.bp_calibrated
                        ? `${Math.round(bloodPressure.calibrated_systolic_blood_pressure || 0)}/${Math.round(bloodPressure.calibrated_diastolic_blood_pressure || 0)}`
                        : `${Math.round(bloodPressure.systolic_blood_pressure)}/${Math.round(bloodPressure.diastolic_blood_pressure)}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{t('userProfile.vitals.mmHg')}</p>
                  </div>
                  {bloodPressure.bp_calibrated && (
                    <div className="bg-green-500 rounded-full px-2.5 py-1">
                      <span className="text-xs font-semibold text-white">{t('fingerprintScan.calibrated')}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

      </div>

      {/* Sticky Footer - Consistent with other pages */}
      <div className="flex-shrink-0 pt-4 px-4 sm:px-6 pb-6">
        <div className="flex justify-between gap-4 max-w-5xl mx-auto">
          <button 
            onClick={onBack} 
            disabled={isScanning && !scanComplete}
            className="group relative flex items-center justify-center px-4 md:px-6 py-2 md:py-3 
                     text-sm md:text-base font-medium text-gray-700 bg-white border-2 border-gray-300
                     rounded-xl shadow-lg
                     transition-all duration-300 ease-out
                     hover:bg-gray-50 hover:shadow-xl
                     focus:outline-none focus:ring-4 focus:ring-gray-300/30
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            {t('buttons.back')}
          </button>
          <button
            onClick={handleNext}
            disabled={!scanComplete || waitingForBloodPressure || isSaving}
            className="group relative flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3
                     text-sm md:text-base font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                     rounded-xl shadow-lg
                     transition-all duration-300 ease-out
                     hover:shadow-xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                     focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                     active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span>{isSaving ? (t('fingerprintScan.savingResults') || 'Saving...') : t('buttons.next')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
