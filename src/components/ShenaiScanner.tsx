/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface ShenaiScannerProps {
    onScanComplete?: () => void;
    onSdkReady?: () => void;
    isVisible?: boolean;
}

const ShenaiScanner = ({ onScanComplete, onSdkReady, isVisible = true }: ShenaiScannerProps) => {
    const { t } = useTranslation();
    // Memoize apiUrl to prevent dependency changes
    const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL, []);
    const [isLoading, setIsLoading] = useState(false);

    // Use refs for callbacks to avoid dependency changes
    const onScanCompleteRef = useRef(onScanComplete);
    const onSdkReadyRef = useRef(onSdkReady);

    // Update refs when callbacks change
    useEffect(() => {
        onScanCompleteRef.current = onScanComplete;
    }, [onScanComplete]);

    useEffect(() => {
        onSdkReadyRef.current = onSdkReady;
    }, [onSdkReady]);

    const setLoading = (loading: boolean) => {
        setIsLoading(loading);
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        let isMounted = true;
        let heartbeats: Array<{ duration_ms: number }> = [];
        let shenaiSDK: any = null;

        // expose loading setter
        (window as any).setReactLoading = setLoading;

        // guard against multiple inits - if SDK already initialized, just use existing instance
        if ((window as any).shenaiInitialized) {
            console.log('SDK already initialized, using existing instance');
            // SDK is already initialized, just call onSdkReady immediately
            onSdkReadyRef.current?.();
            return () => {};
        }
        (window as any).shenaiInitialized = true;

        const saveScanResults = async (results: any) => {
            (window as any).setReactLoading?.(true);

            // Extract heartbeat intervals from results (already populated from getMeasurementResults)
            const heartBeatsArray = results.heartbeats.map((x: any) => x.duration_ms);

            // Debug logging for heartbeat intervals
            console.log('💓 Total heartbeats:', results.heartbeats.length);
            console.log('💓 Heart rate intervals array length:', heartBeatsArray.length);
            console.log('💓 Sample intervals (first 5):', heartBeatsArray.slice(0, 5));

            try {
                const scanResultPayload = {
                    clientId: document.cookie.split('; ').find(r => r.startsWith('userId='))?.split('=')[1],
                    realtimeHeartRate: results.heartRate,
                    hrvSdnn: results.cardiacStress,
                    cardiacStress: results.cardiacStress,
                    healthRisks: results.healthRisks,
                    breathingRate: results.breathingRate,
                    hrvSdnnMs: results.hrvSdnnMs,
                    hrvLnrmssdMs: results.hrvLnrmssdMs,
                    systolicBloodPressureMmhg: results.systolicBloodPressureMmhg,
                    diastolicBloodPressureMmhg: results.diastolicBloodPressureMmhg,
                    cardiacWorkload: results.cardiacWorkload,
                    parasympatheticActivity: results.parasympatheticActivity,
                    age: results.age,
                    bmi: results.bmi,
                    weight: results.weight,
                    height: results.height,
                    averageSignalQuality: results.averageSignalQuality,
                    heartRateIntervals: heartBeatsArray
                };

                console.log('📤 Sending to ScanResult API:', scanResultPayload);

                const response = await fetch(String(apiUrl) + '/ScanResult/AddScanResult', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(scanResultPayload)
                });
                await response.json();

                // Prepare Arrhythmia request payload
                const arrhythmiaPayload = {
                    clientId: document.cookie.split('; ').find(r => r.startsWith('userId='))?.split('=')[1],
                    inputs: [heartBeatsArray]
                };

                console.log('🫀 Sending to Arrhythmia API:');
                console.log('   - Client ID:', arrhythmiaPayload.clientId);
                console.log('   - Intervals count:', heartBeatsArray.length);
                console.log('   - Payload:', JSON.stringify(arrhythmiaPayload).substring(0, 200) + '...');

                await fetch(String(apiUrl) + '/Arrhythmia/AddArrhythmiaRequest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(arrhythmiaPayload)
                });

                // Call the completion callback instead of redirecting (use ref)
                if (onScanCompleteRef.current) {
                    onScanCompleteRef.current();
                }
            } catch (error) {
                console.error('Error saving scan results:', error);
            } finally {
                (window as any).setReactLoading?.(false);
            }
        };

        const initialize = async () => {
            try {
                // allow the canvas to mount
                await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

                // Build runtime URL to avoid TS resolution during build
                const sdkPath = '/shenai-sdk/index.mjs';
                const mod: any = await import(/* webpackIgnore: true */ sdkPath);
                const CreateShenaiSDK = mod.default;
                shenaiSDK = await CreateShenaiSDK();

                if (!isMounted) return;

                const API_KEY = "66b96244e85346c89425c3259feb01f9";
                const USER_ID = document.cookie.split('; ').find(r => r.startsWith('userId='))?.split('=')[1] ?? null;

                shenaiSDK.initialize(
                    API_KEY,
                    USER_ID,
                    {
                        // ✅ VISUAL ENHANCEMENTS
                        hideShenaiLogo: true,
                        showFaceMask: true,              // 3D face mesh overlay
                        showBloodFlow: true,             // Blood flow visualization
                        showFacePositioningOverlay: true, // Face positioning hints
                        showVisualWarnings: true,         // Signal quality warnings

                        // ✅ CUSTOM COLORS (match app theme)
                        themeColor: "#407EFF",
                        backgroundColor: "#FFFFFF",
                        textColor: "#1F2937",
                        tileColor: "#F3F4F6",

                        measurementPreset: shenaiSDK.MeasurementPreset.CUSTOM,
                        eventCallback: async (event: string) => {
                            if (event === "START_BUTTON_CLICKED") {
                                shenaiSDK.setCustomMeasurementConfig({
                                    durationSeconds: 30,
                                    instantMetrics: [
                                        shenaiSDK.Metric.HEART_RATE,
                                        shenaiSDK.Metric.HRV_SDNN,
                                        shenaiSDK.Metric.BREATHING_RATE,
                                        shenaiSDK.Metric.SYSTOLIC_BP,
                                        shenaiSDK.Metric.DIASTOLIC_BP,
                                        shenaiSDK.Metric.CARDIAC_STRESS,
                                        shenaiSDK.Metric.PNS_ACTIVITY,
                                        shenaiSDK.Metric.CARDIAC_WORKLOAD,
                                        shenaiSDK.Metric.AGE,
                                        shenaiSDK.Metric.BMI
                                    ],
                                    summaryMetrics: [
                                        shenaiSDK.Metric.HEART_RATE,
                                        shenaiSDK.Metric.HRV_SDNN,
                                        shenaiSDK.Metric.BREATHING_RATE,
                                        shenaiSDK.Metric.SYSTOLIC_BP,
                                        shenaiSDK.Metric.DIASTOLIC_BP,
                                        shenaiSDK.Metric.CARDIAC_STRESS,
                                        shenaiSDK.Metric.PNS_ACTIVITY,
                                        shenaiSDK.Metric.CARDIAC_WORKLOAD,
                                        shenaiSDK.Metric.AGE,
                                        shenaiSDK.Metric.BMI
                                    ]
                                });
                            }
                            if (event === "MEASUREMENT_FINISHED") {
                                // Wait for measurement data to be fully processed
                                await new Promise(resolve => setTimeout(resolve, 500));

                                // ✅ GET ALL DATA FROM getMeasurementResults() - single source of truth
                                const measurementResults = shenaiSDK.getMeasurementResults();
                                const healthRisks = shenaiSDK.getHealthRisks();

                                console.log('📊 Measurement Results:', measurementResults);
                                console.log('💓 Heartbeats in results:', measurementResults?.heartbeats?.length || 0);
                                console.log('💓 Sample heartbeat:', measurementResults?.heartbeats?.[0]);

                                // Extract heartbeats from measurementResults
                                heartbeats = measurementResults?.heartbeats || [];

                                const results = {
                                    // All data from getMeasurementResults()
                                    heartRate: measurementResults?.heart_rate_bpm,
                                    hrvSdnnMs: measurementResults?.hrv_sdnn_ms,
                                    hrvLnrmssdMs: measurementResults?.hrv_lnrmssd_ms,
                                    breathingRate: measurementResults?.breathing_rate_bpm,
                                    systolicBloodPressureMmhg: measurementResults?.systolic_blood_pressure_mmhg,
                                    diastolicBloodPressureMmhg: measurementResults?.diastolic_blood_pressure_mmhg,
                                    cardiacStress: measurementResults?.stress_index,
                                    cardiacWorkload: measurementResults?.cardiac_workload_mmhg_per_sec,
                                    parasympatheticActivity: measurementResults?.parasympathetic_activity,
                                    age: measurementResults?.age_years,
                                    bmi: measurementResults?.bmi_kg_per_m2,
                                    weight: measurementResults?.weight_kg,
                                    height: measurementResults?.height_cm,
                                    averageSignalQuality: measurementResults?.average_signal_quality,
                                    heartbeats: measurementResults?.heartbeats || [],
                                    healthRisks: healthRisks
                                };

                                console.log('📦 Prepared results for API:', {
                                    heartRate: results.heartRate,
                                    hrvSdnnMs: results.hrvSdnnMs,
                                    breathingRate: results.breathingRate,
                                    bloodPressure: `${results.systolicBloodPressureMmhg}/${results.diastolicBloodPressureMmhg}`,
                                    heartbeatsCount: results.heartbeats.length
                                });

                                await saveScanResults(results);
                            }
                        },
                        onCameraError: (error: string) => {
                            console.error('Camera Error:', error);
                        }
                    },
                    (initResult: any) => {
                        if (initResult !== shenaiSDK.InitializationResult.OK) {
                            console.error('Shen.AI init error:', initResult?.toString?.() ?? initResult);
                            return;
                        }

                        // ✅ ENABLE RECORDING to capture heartbeat intervals for arrhythmia detection
                        shenaiSDK.setRecordingEnabled(true);
                        console.log('Recording enabled for heartbeat capture');

                        // ✅ NOTIFY THAT SDK IS READY
                        console.log('✅ SDK initialization complete - calling onSdkReady');
                        onSdkReadyRef.current?.();

                        // ensure canvas is ready then toggle camera to trigger permission prompt
                        const applyCameraWorkaround = () => {
                            const canvas = document.getElementById('mxcanvas');
                            if (!canvas || !(window as any).shenaiInitialized) {
                                setTimeout(applyCameraWorkaround, 200);
                                return;
                            }
                            setTimeout(() => {
                                try {
                                    shenaiSDK.setCameraMode(shenaiSDK.CameraMode.OFF);
                                    setTimeout(() => {
                                        if ((window as any).shenaiInitialized) {
                                            shenaiSDK.setCameraMode(shenaiSDK.CameraMode.FACING_USER);

                                            // ✅ RE-APPLY VISUAL EFFECTS AFTER CAMERA STARTS
                                            shenaiSDK.setShowFaceMask(true);
                                            shenaiSDK.setShowBloodFlow(true);
                                            shenaiSDK.setShowFacePositioningOverlay(true);
                                            shenaiSDK.setShowVisualWarnings(true);
                                        }
                                    }, 100);
                                } catch (e) {
                                    console.warn('Camera workaround error:', e);
                                }
                            }, 500);
                        };
                        applyCameraWorkaround();
                    }
                );

                (window as any).shenai = shenaiSDK;
            } catch (error) {
                console.error('Failed to initialize ShenAI SDK:', error);
                (window as any).shenaiInitialized = false;
            }
        };

        initialize();

        return () => {
            isMounted = false;
            try {
                shenaiSDK?.deinitialize?.();
            } catch {}
            try {
                shenaiSDK?.destroyRuntime?.();
            } catch {}
            (window as any).shenai = null;
            (window as any).shenaiInitialized = false;
            (window as any).setReactLoading = undefined;
        };
    }, []); // Empty deps - SDK should only initialize once

    return (
      <div className={`w-full h-full min-h-[300px] flex items-center justify-center relative ${!isVisible ? 'hidden' : ''}`}>
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-3xl"></div>

          {/* Decorative Border */}
          <div className="absolute inset-0 border-4 border-blue-200/50 rounded-3xl pointer-events-none"></div>

          {/* Canvas */}
          <canvas
            id="mxcanvas"
            className="relative w-full h-full rounded-2xl shadow-2xl z-10"
            style={{
              objectFit: 'cover'
            }}
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center z-30">
              <div className="bg-white rounded-2xl p-6 flex flex-col items-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#407EFF] rounded-full animate-spin"></div>
                <div className="text-base font-medium text-gray-700">{t('assessment.savingResults')}</div>
              </div>
            </div>
          )}
      </div>
    );
};

export default ShenaiScanner;