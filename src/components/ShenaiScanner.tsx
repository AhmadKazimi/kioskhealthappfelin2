/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

const ShenaiScanner = () => {
    const { t } = useTranslation();
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const hostUrl = process.env.NEXT_PUBLIC_HOST_DOMAIN; 
    const [isLoading, setIsLoading] = useState(false);

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
                if (hostUrl) {
                    window.location.href = String(hostUrl) + '/?ischecked=true';
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
                        hideShenaiLogo: true,
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
    }, [apiUrl, hostUrl]);

    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center">
          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-lg p-4 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                <div className="text-sm">{t('assessment.savingResults')}</div>
              </div>
            </div>
          )}
          <canvas id="mxcanvas" className="w-full max-w-full h-auto max-h-[70vh] aspect-[480/894] sm:max-h-[60vh] lg:max-h-[65vh]"></canvas>
      </div>
    );
};

export default ShenaiScanner;