'use client'

import React, { useEffect, useState } from 'react';
import { type ScanResults } from '@/types/global';
import { useTranslation } from '@/hooks/useTranslation';

interface FastScanScannerProps {
  onScanComplete?: (results: ScanResults) => void;
  onError?: (error: string) => void;
}

const FastScanScanner: React.FC<FastScanScannerProps> = ({ onScanComplete, onError }) => {
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  const [sdkInitialized, setSdkInitialized] = useState(false);

  // Function to completely reset SDK (only when needed)
  const resetSdk = () => {
    if (typeof window !== 'undefined' && window.shenai) {
      try {
        window.shenai.deinitialize();
        delete window.shenai;
        delete window.fastScanSdkInitialized;
        setSdkInitialized(false);
        console.log('CareVision scanner completely reset');
      } catch (error) {
        console.warn('Error resetting SDK:', error);
      }
    }
  };

  // Fix hydration mismatch by ensuring client-side only rendering
  useEffect(() => {
    setIsClient(true);
    // Expose reset function globally if needed (only on client side)
    if (typeof window !== 'undefined') {
      window.resetFastScanSdk = resetSdk;
    }
  }, []);

  useEffect(() => {
    if (!isClient || sdkInitialized || (typeof window !== 'undefined' && window.fastScanSdkInitialized)) {
      if (typeof window !== 'undefined' && window.fastScanSdkInitialized) {
        setSdkInitialized(true);
      }
      return;
    }
    // Create and inject the SDK script for CareVision experience
    const script = document.createElement('script');
    script.type = 'module';
    script.innerHTML = `
      import CreateShenaiSDK from "/shenai-sdk/index.mjs";  

      const API_KEY = "66b96244e85346c89425c3259feb01f9";
      const USER_ID = document.cookie
        .split('; ')
        .find(row => row.startsWith('userId='))
        ?.split('=')[1] || 'anonymous'; 
      
      var heartbeats = [];

             function handleScanCompletion(results) {
         console.log('Scan completed successfully with results:', results);
         
         // Notify React component of scan completion
         // DO NOT re-initialize SDK - preserve embedded UI state
         if (window.onFastScanComplete) {
           window.onFastScanComplete(results);
         }
       }
       
      const shenaiSDK = await CreateShenaiSDK(); 
      
             // Simplified UI configuration for CareVision
       shenaiSDK.initialize(
         API_KEY,
         USER_ID,
         {
           // Use CUSTOM preset to specify all available metrics for maximum parameter visibility
           measurementPreset: shenaiSDK.MeasurementPreset.CUSTOM,
           
           // Custom measurement configuration to capture ALL available parameters
           customMeasurementConfig: {
             durationSeconds: 60, // Standard 1-minute measurement
             infiniteMeasurement: false,
             
             // Include ALL available instant metrics for real-time display
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
             
             // Include ALL available summary metrics for final results display
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
             ],
             
             // Include ALL available health indices for comprehensive assessment
             healthIndices: [
               // Wellness Score (requires physiological metrics from video measurement)
               shenaiSDK.HealthIndex.WELLNESS_SCORE,
               
               // Health Risk Indices
               shenaiSDK.HealthIndex.VASCULAR_AGE,
               shenaiSDK.HealthIndex.CARDIOVASCULAR_DISEASE_RISK,
               shenaiSDK.HealthIndex.HARD_AND_FATAL_EVENTS_RISKS,
               shenaiSDK.HealthIndex.CARDIOVASCULAR_RISK_SCORE,
               
               // Chronic Disease Risk Indices
               shenaiSDK.HealthIndex.HYPERTENSION_RISK,
               shenaiSDK.HealthIndex.DIABETES_RISK,
               shenaiSDK.HealthIndex.NON_ALCOHOLIC_FATTY_LIVER_DISEASE_RISK,
               
               // Body Composition and Metabolism Indices
               shenaiSDK.HealthIndex.WAIST_TO_HEIGHT_RATIO,
               shenaiSDK.HealthIndex.BODY_FAT_PERCENTAGE,
               shenaiSDK.HealthIndex.BODY_ROUNDNESS_INDEX,
               shenaiSDK.HealthIndex.A_BODY_SHAPE_INDEX,
               shenaiSDK.HealthIndex.CONICITY_INDEX,
               shenaiSDK.HealthIndex.BASAL_METABOLIC_RATE,
               shenaiSDK.HealthIndex.TOTAL_DAILY_ENERGY_EXPENDITURE
             ],
             
             // Configure real-time update periods for smooth parameter display
             realtimeHrPeriodSeconds: 4,
             realtimeHrvPeriodSeconds: 10,
             realtimeCardiacStressPeriodSeconds: 10
           },
           
           // Simplified UI settings - minimal interface for CareVision
           showUserInterface: true,
           showFacePositioningOverlay: true,
           showVisualWarnings: true,
           enableCameraSwap: false,
           showFaceMask: true,
           showBloodFlow: false,
           hideShenaiLogo: true, // Hide Shen.AI logo for CareVision branding
           enableStartAfterSuccess: false,
           enableSummaryScreen: false,
           enableHealthRisks: false,
           showOutOfRangeResultIndicators: false,
           showTrialMetricLabels: false,
           showSignalQualityIndicator: true,
           showSignalTile: false,
           
           // Operating and precision modes for optimal parameter accuracy
           operatingMode: shenaiSDK.OperatingMode.POSITIONING,
           precisionMode: shenaiSDK.PrecisionMode.STRICT,
           cameraMode: shenaiSDK.CameraMode.FACING_USER,
           onboardingMode: shenaiSDK.OnboardingMode.HIDE,
           enableFullFrameProcessing: false,
          
                     eventCallback: async (event) => { 
             console.log('SDK Event:', event);
             
             // Configure custom measurement when user starts scan
             if (event === "START_BUTTON_CLICKED") {
               console.log('Configuring custom measurement for CareVision...');
               shenaiSDK.setCustomMeasurementConfig({
                 durationSeconds: 60,
                 infiniteMeasurement: false,
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
                 ],
                 healthIndices: [
                   // Wellness Score (requires physiological metrics from video measurement)
                   shenaiSDK.HealthIndex.WELLNESS_SCORE,
                   
                   // Health Risk Indices
                   shenaiSDK.HealthIndex.VASCULAR_AGE,
                   shenaiSDK.HealthIndex.CARDIOVASCULAR_DISEASE_RISK,
                   shenaiSDK.HealthIndex.HARD_AND_FATAL_EVENTS_RISKS,
                   shenaiSDK.HealthIndex.CARDIOVASCULAR_RISK_SCORE,
                   
                   // Chronic Disease Risk Indices
                   shenaiSDK.HealthIndex.HYPERTENSION_RISK,
                   shenaiSDK.HealthIndex.DIABETES_RISK,
                   shenaiSDK.HealthIndex.NON_ALCOHOLIC_FATTY_LIVER_DISEASE_RISK,
                   
                   // Body Composition and Metabolism Indices
                   shenaiSDK.HealthIndex.WAIST_TO_HEIGHT_RATIO,
                   shenaiSDK.HealthIndex.BODY_FAT_PERCENTAGE,
                   shenaiSDK.HealthIndex.BODY_ROUNDNESS_INDEX,
                   shenaiSDK.HealthIndex.A_BODY_SHAPE_INDEX,
                   shenaiSDK.HealthIndex.CONICITY_INDEX,
                   shenaiSDK.HealthIndex.BASAL_METABOLIC_RATE,
                   shenaiSDK.HealthIndex.TOTAL_DAILY_ENERGY_EXPENDITURE
                 ]
               });
             }
             
             if (event === "MEASUREMENT_FINISHED") {
              heartbeats = await shenaiSDK.getRealtimeHeartbeats(120);
              console.log('Heartbeats:', heartbeats);

                             // Collect ALL available measurement results
               const measurementResults = shenaiSDK.getMeasurementResults();
               const healthRisks = shenaiSDK.getHealthRisks();
               
               const results = {
                 // Real-time metrics
                 heartRate10s: shenaiSDK.getHeartRate10s(),
                 heartRate4s: shenaiSDK.getHeartRate4s(),
                 realtimeHeartRate: shenaiSDK.getRealtimeHeartRate(),
                 hrvSdnn: shenaiSDK.getRealtimeHrvSdnn(),
                 cardiacStress: shenaiSDK.getRealtimeCardiacStress(),
                 
                 // Comprehensive measurement results
                 heartRateBpm: measurementResults?.heart_rate_bpm,
                 hrvSdnnMs: measurementResults?.hrv_sdnn_ms,
                 hrvLnrmssdMs: measurementResults?.hrv_lnrmssd_ms,
                 stressIndex: measurementResults?.stress_index,
                 parasympatheticActivity: measurementResults?.parasympathetic_activity,
                 breathingRate: measurementResults?.breathing_rate_bpm,
                 systolicBloodPressureMmhg: measurementResults?.systolic_blood_pressure_mmhg,
                 diastolicBloodPressureMmhg: measurementResults?.diastolic_blood_pressure_mmhg,
                 cardiacWorkload: measurementResults?.cardiac_workload_mmhg_per_sec,
                 ageYears: measurementResults?.age_years,
                 bmiKgPerM2: measurementResults?.bmi_kg_per_m2,
                 weightKg: measurementResults?.weight_kg,
                 heightCm: measurementResults?.height_cm,
                 averageSignalQuality: measurementResults?.average_signal_quality,
                 
                 // Health risks and comprehensive health indices
                 healthRisks: healthRisks,
                 
                 // Health Indices (as per Shen.AI documentation)
                 wellnessScore: healthRisks?.wellnessScore,
                 vascularAge: healthRisks?.vascularAge,
                 waistToHeightRatio: healthRisks?.waistToHeightRatio,
                 bodyFatPercentage: healthRisks?.bodyFatPercentage,
                 basalMetabolicRate: healthRisks?.basalMetabolicRate,
                 bodyRoundnessIndex: healthRisks?.bodyRoundnessIndex,
                 conicityIndex: healthRisks?.conicityIndex,
                 aBodyShapeIndex: healthRisks?.aBodyShapeIndex,
                 totalDailyEnergyExpenditure: healthRisks?.totalDailyEnergyExpenditure,
                 hypertensionRisk: healthRisks?.hypertensionRisk,
                 diabetesRisk: healthRisks?.diabetesRisk,
                 nonAlcoholicFattyLiverDiseaseRisk: healthRisks?.nonAlcoholicFattyLiverDiseaseRisk,
                 
                 // Additional derived metrics
                 totalBadSignalSeconds: shenaiSDK.getTotalBadSignalSeconds(),
                 currentSignalQuality: shenaiSDK.getCurrentSignalQualityMetric()
               };
              
                             handleScanCompletion(results);
            } 
          },
          onCameraError: (error) => {
            console.error('Camera error:', error);
            if (window.onFastScanError) {
              window.onFastScanError('Camera error: ' + error.message);
            }
          }
        },
        (result) => {
          if (result !== shenaiSDK.InitializationResult.OK) {
            const errorMessage = "CareVision scanner initialization error: " + result.toString();
            console.error(errorMessage);
            if (window.onFastScanError) {
              window.onFastScanError(errorMessage);
            }
                     } else {
             console.log("CareVision scanner initialized successfully");
             
             // Mark SDK as initialized to prevent re-initialization
             window.fastScanSdkInitialized = true;
             
             // Attach to canvas
             shenaiSDK.attachToCanvas("#fast-scan-canvas");
             
             // Camera workaround for better initialization
             setTimeout(() => {
               console.log("Applying camera workaround...");
               shenaiSDK.setCameraMode(shenaiSDK.CameraMode.OFF);
               setTimeout(() => {
                 shenaiSDK.setCameraMode(shenaiSDK.CameraMode.FACING_USER);
                 console.log("Camera workaround applied - permission prompt should now appear");
               }, 100);
             }, 500);
           }
        }
      );

      // Make CareVision scanner available globally for debugging
      window.shenai = shenaiSDK; 
    `;
    
    document.body.appendChild(script);

    // Set up callbacks for React component
    window.onFastScanComplete = onScanComplete;
    window.onFastScanError = onError;

    // Create canvas style for centered CareVision interface
    const style = document.createElement("style");
    style.innerHTML = `
      #fast-scan-canvas {
        width: 100%;
        max-width: 600px;
        height: 600px;
        margin: 0 auto;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        display: block;
      }
    `;
    document.head.appendChild(style);

    setSdkInitialized(true);

    // Cleanup function - only clean up when component truly unmounts
    return () => {
      // Remove style
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      
      // Only remove script if it's not the main SDK script (preserve SDK state)
      // Clean up global callbacks but preserve SDK
      delete window.onFastScanComplete;
      delete window.onFastScanError;
    };
  }, [isClient]);

  // Separate useEffect to update callbacks without re-initializing SDK
  useEffect(() => {
    if (window.onFastScanComplete !== onScanComplete) {
      window.onFastScanComplete = onScanComplete;
    }
    if (window.onFastScanError !== onError) {
      window.onFastScanError = onError;
    }
     }, [onScanComplete, onError]);

  // Clean up SDK only when component is truly unmounting (e.g., navigating away)
  useEffect(() => {
    return () => {
      // This cleanup runs only when the component is unmounting
      if (window.fastScanSdkInitialized) {
        console.log('CareVision scanner unmounting - preserving scanner state');
        // Don't reset SDK here to preserve state and embedded UI
      }
    };
  }, []);

  // Prevent server-side rendering to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">{t('common.loadingScanner')}</div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <canvas 
        id="fast-scan-canvas"
        style={{ 
          width: '100%', 
          maxWidth: '600px',
          height: '600px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          display: 'block'
        }}
      />
    </div>
  );
};

export default FastScanScanner; 