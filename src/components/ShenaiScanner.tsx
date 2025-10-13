/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface ShenaiScannerProps {
    onScanComplete?: () => void;
}

const ShenaiScanner = ({ onScanComplete }: ShenaiScannerProps) => {
    const { t } = useTranslation();
    // Memoize apiUrl to prevent dependency changes
    const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL, []);
    const [isLoading, setIsLoading] = useState(false);

    // Use ref for callback to avoid dependency changes
    const onScanCompleteRef = useRef(onScanComplete);

    // Update ref when callback changes
    useEffect(() => {
        onScanCompleteRef.current = onScanComplete;
    }, [onScanComplete]);

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

        // guard against multiple inits
        if ((window as any).shenaiInitialized) {
            return () => {};
        }
        (window as any).shenaiInitialized = true;

        const saveScanResults = async (results: any) => {
            (window as any).setReactLoading?.(true);
            const heartBeatsArray = heartbeats.map(x => x.duration_ms);
            try {
                const response = await fetch(String(apiUrl) + '/ScanResult/AddScanResult', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientId: document.cookie.split('; ').find(r => r.startsWith('userId='))?.split('=')[1],
                        heartRate10s: results.heartRate10s,
                        heartRate4s: results.heartRate4s,
                        realtimeHeartRate: results.realtimeHeartRate,
                        hrvSdnn: results.hrvSdnn,
                        cardiacStress: results.cardiacStress,
                        systolicBloodPressure: results.systolicBp,
                        diastolicBloodPressure: results.diastolicBp,
                        healthRisks: results.healthRisks,
                        breathingRate: results.breathingRate,
                        hrvSdnnMs: results.hrvSdnnMs,
                        systolicBloodPressureMmhg: results.systolicBloodPressureMmhg,
                        diastolicBloodPressureMmhg: results.diastolicBloodPressureMmhg,
                        heartRateIntervals: heartBeatsArray
                    })
                });
                await response.json();
                await fetch(String(apiUrl) + '/Arrhythmia/AddArrhythmiaRequest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientId: document.cookie.split('; ').find(r => r.startsWith('userId='))?.split('=')[1],
                        inputs: [heartBeatsArray]
                    })
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
                                    durationSeconds: 100,
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
                                heartbeats = await shenaiSDK.getRealtimeHeartbeats(120);
                                const results = {
                                    heartRate10s: shenaiSDK.getHeartRate10s(),
                                    heartRate4s: shenaiSDK.getHeartRate4s(),
                                    realtimeHeartRate: shenaiSDK.getRealtimeHeartRate(),
                                    hrvSdnn: shenaiSDK.getRealtimeHrvSdnn(),
                                    cardiacStress: shenaiSDK.getRealtimeCardiacStress(),
                                    healthRisks: shenaiSDK.getHealthRisks(),
                                    breathingRate: shenaiSDK.getMeasurementResults()?.breathing_rate_bpm,
                                    hrvSdnnMs: shenaiSDK.getMeasurementResults()?.hrv_sdnn_ms,
                                    systolicBloodPressureMmhg: shenaiSDK.getMeasurementResults()?.systolic_blood_pressure_mmhg,
                                    diastolicBloodPressureMmhg: shenaiSDK.getMeasurementResults()?.diastolic_blood_pressure_mmhg
                                };
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
      <div className="w-full h-full min-h-[300px] flex items-center justify-center relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-3xl"></div>

          {/* Decorative Border */}
          <div className="absolute inset-0 border-4 border-blue-200/50 rounded-3xl pointer-events-none"></div>

          {/* Canvas */}
          <canvas
            id="mxcanvas"
            className="relative w-full max-w-full h-auto rounded-2xl shadow-2xl z-10"
            style={{
              aspectRatio: '480/894',
              maxHeight: '70vh',
              objectFit: 'contain'
            }}
          />

          {/* Signal Quality Indicator */}
          <div className="absolute top-4 right-4 z-20">
            <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">{t('faceScan.activeScanning') || 'Active Scan'}</span>
            </div>
          </div>

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