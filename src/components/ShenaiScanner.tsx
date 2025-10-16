/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface ShenaiScannerProps {
    onScanComplete?: () => void;
    // Emit measured vitals upward for local summary rendering (before API save)
    onLocalResults?: (results: {
        heartRate: number;
        breathingRate: number;
        hrvSdnnMs: number;
        systolicBP: number;
        diastolicBP: number;
        bloodPressure: string;
    }) => void;
}

const ShenaiScanner = ({ onScanComplete, onLocalResults }: ShenaiScannerProps) => {
    const { t } = useTranslation();
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
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
            const clientId = document.cookie.split('; ').find(r => r.startsWith('userId='))?.split('=')[1];
            const requestId = `FACE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // CORRECTED: Match backend schema exactly (camelCase, correct field names)
            // Map to backend DTO (PascalCase keys as returned by GetClientLatestScanResult)
            const requestBody = {
                ClientId: clientId ? Number(clientId) : undefined,
                HeartRate10s: results.heartRate10s ?? 0,
                HeartRate4s: results.heartRate4s ?? 0,
                RealTimeHeartRate: results.realtimeHeartRate ?? 0,
                HrvSdnnMs: results.hrvSdnnMs ?? null,
                CardiacStress: results.cardiacStress ?? null,
                // Save BP in both fields to be compatible with different readers
                SystolicBloodPressureMmhg: results.systolicBloodPressureMmhg ?? results.systolicBloodPressure ?? null,
                DiastolicBloodPressureMmhg: results.diastolicBloodPressureMmhg ?? results.diastolicBloodPressure ?? null,
                BreathingRate: results.breathingRate ?? null,
                // Some backends expect HRIntervals; include both for safety
                HRIntervals: JSON.stringify(heartBeatsArray),
                HearRateIntervals: JSON.stringify(heartBeatsArray),
            };

            try {
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('💾 FACE SCAN - INITIATING SAVE');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📋 Save Details:');
                console.log('  Request ID:', requestId);
                console.log('  ClientId:', clientId);
                console.log('  API URL:', String(apiUrl) + '/ScanResult/AddScanResult');
                console.log('  Timestamp:', new Date().toISOString());
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📊 Vitals Data Being Saved (CORRECTED FIELD NAMES):');
                console.log('  heartRate10s:', results.heartRate10s, 'BPM');
                console.log('  heartRate4s:', results.heartRate4s, 'BPM');
                console.log('  realTimeHeartRate:', results.realtimeHeartRate, 'BPM');
                console.log('  heartRateVariability:', results.hrvSdnnMs, 'ms');
                console.log('  breathingRate:', results.breathingRate, 'BPM');
                console.log('  systolicBloodPressure:', results.systolicBloodPressureMmhg, 'mmHg');
                console.log('  diastolicBloodPressureMmhg:', results.diastolicBloodPressureMmhg, 'mmHg');
                console.log('  cardiacStress:', results.cardiacStress);
                console.log('  heartRateIntervals Count:', heartBeatsArray.length);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📦 Complete Request Body:', JSON.stringify(requestBody, null, 2));
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                const response = await fetch(String(apiUrl) + '/ScanResult/AddScanResult', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                const responseData = await response.json();

                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('✅ FACE SCAN - SAVE RESPONSE RECEIVED');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('Request ID:', requestId);
                console.log('Response Status:', response.status, response.statusText);
                console.log('Response Data:', JSON.stringify(responseData, null, 2));
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                // Arrhythmia detection request
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📤 FACE SCAN - Arrhythmia Detection Request');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('Request ID:', requestId);
                console.log('ClientId:', clientId);
                console.log('API URL:', String(apiUrl) + '/Arrhythmia/AddArrhythmiaRequest');
                console.log('RR Intervals Count:', heartBeatsArray.length);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                // Only call arrhythmia when we actually have RR intervals
                if (heartBeatsArray.length > 0) {
                    const arrhythmiaResponse = await fetch(String(apiUrl) + '/Arrhythmia/AddArrhythmiaRequest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clientId: clientId,
                            inputs: [heartBeatsArray]
                        })
                    });

                    const arrhythmiaData = await arrhythmiaResponse.json();
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('✅ FACE SCAN - Arrhythmia Response Received');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('Request ID:', requestId);
                    console.log('Response Status:', arrhythmiaResponse.status, arrhythmiaResponse.statusText);
                    console.log('Response Data:', JSON.stringify(arrhythmiaData, null, 2));
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                } else {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('⏭️  Skipping Arrhythmia request (no RR intervals)');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                }


                // Stop loading before navigation
                (window as any).setReactLoading?.(false);

                // Give SDK a moment to finish internal cleanup before navigating
                // This prevents "Cannot read properties of null" errors
                console.log('⏳ Waiting 500ms for SDK cleanup before navigation...');
                await new Promise(resolve => setTimeout(resolve, 500));

                // Call the completion callback instead of redirecting
                if (onScanComplete && isMounted) {
                    console.log('✓ Calling onScanComplete...');
                    onScanComplete();
                }
            } catch (error) {
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('❌ FACE SCAN - Save Error');
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('Request ID:', requestId);
                console.error('Error:', error);
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                // Still navigate on error, but stop loading first
                (window as any).setReactLoading?.(false);
                if (onScanComplete && isMounted) {
                    onScanComplete();
                }
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
                                // Check if component is still mounted before processing
                                if (!isMounted) {
                                    console.warn('Component unmounted before MEASUREMENT_FINISHED processing');
                                    return;
                                }

                                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                                console.log('📊 MEASUREMENT_FINISHED - Extracting Results');
                                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                                try {
                                    // Safely extract heartbeats with error handling
                                    try {
                                        heartbeats = await shenaiSDK.getRealtimeHeartbeats(120);
                                        console.log('✓ Heartbeats extracted:', heartbeats?.length || 0);
                                    } catch (err) {
                                        console.error('⚠️ Failed to get heartbeats:', err);
                                        heartbeats = [];
                                    }

                                    // Safely extract results with null checks
                                    const measurementResults = shenaiSDK.getMeasurementResults?.() || {};
                                    console.log('✓ Measurement results obtained');

                                    const results = {
                                        heartRate10s: shenaiSDK.getHeartRate10s?.() || 0,
                                        heartRate4s: shenaiSDK.getHeartRate4s?.() || 0,
                                        realtimeHeartRate: shenaiSDK.getRealtimeHeartRate?.() || 0,
                                        hrvSdnn: shenaiSDK.getRealtimeHrvSdnn?.() || 0,
                                        cardiacStress: shenaiSDK.getRealtimeCardiacStress?.() || 0,
                                        healthRisks: shenaiSDK.getHealthRisks?.() || [],
                                        breathingRate: measurementResults.breathing_rate_bpm || 0,
                                        hrvSdnnMs: measurementResults.hrv_sdnn_ms || 0,
                                        systolicBloodPressureMmhg: measurementResults.systolic_blood_pressure_mmhg || 0,
                                        diastolicBloodPressureMmhg: measurementResults.diastolic_blood_pressure_mmhg || 0
                                    };

                                    console.log('✓ Results object created:', JSON.stringify(results, null, 2));
                                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                                    // Check mounted again before processing
                                    if (!isMounted) {
                                        console.warn('Component unmounted before save');
                                        return;
                                    }

                                    // ✅ EMIT LOCAL RESULTS IMMEDIATELY (before API save)
                                    // This allows parent to update UI with fresh data without waiting for API
                                    if (onLocalResults) {
                                        const localVitals = {
                                            heartRate: results.realtimeHeartRate || results.heartRate10s || 0,
                                            breathingRate: results.breathingRate || 0,
                                            hrvSdnnMs: results.hrvSdnnMs || 0,
                                            systolicBP: results.systolicBloodPressureMmhg || 0,
                                            diastolicBP: results.diastolicBloodPressureMmhg || 0,
                                            bloodPressure: `${results.systolicBloodPressureMmhg || 0}/${results.diastolicBloodPressureMmhg || 0}`,
                                        };

                                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                                        console.log('📤 FACE SCAN - Emitting Local Results to Parent');
                                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                                        console.log('Local Vitals:', JSON.stringify(localVitals, null, 2));
                                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                                        try {
                                            onLocalResults(localVitals);
                                            console.log('✅ Local results emitted successfully');
                                        } catch (err) {
                                            console.error('❌ Error emitting local results:', err);
                                        }
                                    }

                                    await saveScanResults(results);
                                } catch (error) {
                                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                                    console.error('❌ MEASUREMENT_FINISHED - Error extracting results');
                                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                                    console.error('Error:', error);
                                    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
                                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                                    // Still try to navigate even if extraction failed
                                    if (isMounted && onScanComplete) {
                                        console.log('Attempting navigation despite error...');
                                        onScanComplete();
                                    }
                                }
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
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🧹 ShenaiScanner - Cleanup on Unmount');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            isMounted = false;

            // Stop SDK camera first
            try {
                if (shenaiSDK?.setCameraMode) {
                    shenaiSDK.setCameraMode(shenaiSDK.CameraMode?.OFF || 0);
                    console.log('✓ Camera stopped');
                }
            } catch (err) {
                console.warn('Failed to stop camera:', err);
            }

            // Deinitialize SDK
            try {
                if (shenaiSDK?.deinitialize) {
                    shenaiSDK.deinitialize();
                    console.log('✓ SDK deinitialized');
                }
            } catch (err) {
                console.warn('Failed to deinitialize SDK:', err);
            }

            // Destroy runtime
            try {
                if (shenaiSDK?.destroyRuntime) {
                    shenaiSDK.destroyRuntime();
                    console.log('✓ Runtime destroyed');
                }
            } catch (err) {
                console.warn('Failed to destroy runtime:', err);
            }

            // Clear global state
            (window as any).shenai = null;
            (window as any).shenaiInitialized = false;
            (window as any).setReactLoading = undefined;

            console.log('✅ Cleanup complete');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        };
    }, [apiUrl, onScanComplete]);

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