/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable react-hooks/exhaustive-deps */

import React from 'react';
import { useState, useEffect, useCallback } from "react"
import Cookies from 'js-cookie';
import { motion } from "framer-motion";

import { HealthData } from "@/types/health-data";
import type { UserData } from "./home-screen";

import { ClientModel } from '@/payload-types';
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useClientScanResults } from '@/hooks/useClientScanResults';
import VitalCard from './VitalCard';
import BloodPressureCard from './BloodPressureCard';
import { getLatestScanResults, type SDKMeasurementResults } from '@/utils/scanStorage';


interface FaceScanResultProps {
    userData: UserData;
    updateUserData: (data: Partial<UserData>) => void;
    onPrev: () => void;
    onNext: () => void;
    onlyVitalResult?: boolean;
    onScanAgain?: () => void;
};

const FaceScanResult = React.memo(function FaceScanResult({
  userData,
  updateUserData,
  onNext,
  onPrev,
  onlyVitalResult = false,
  onScanAgain
}: FaceScanResultProps){
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';

    // ✅ PRIMARY DATA SOURCE: Session storage (SDK results)
    const [sdkResults, setSdkResults] = useState<SDKMeasurementResults | null>(null);
    const [isLoadingLocal, setIsLoadingLocal] = useState(true);

    // Ensure language is preserved on component mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('i18nextLng');
        if (savedLanguage && i18n.language !== savedLanguage) {
            console.log('Face scan result: Restoring language to:', savedLanguage);
            i18n.changeLanguage(savedLanguage);
        }
    }, [i18n]);

    // ✅ LOAD FROM SESSION STORAGE FIRST (primary data source)
    useEffect(() => {
        const results = getLatestScanResults();
        setSdkResults(results);
        setIsLoadingLocal(false);

        if (results) {
            console.log('✅ Using SDK results from sessionStorage:', results);
        } else {
            console.log('⚠️ No SDK results in sessionStorage, falling back to API');
        }
    }, []);

    // Use shared hook for API calls
    const { data: latestResult, client, loading: isFetching, error } = useClientScanResults({
        onSuccess: useCallback((data: HealthData) => {
            console.log("FaceScan Result Data received:", data);
        }, [])
    });

    // Update user data when client and scan results are available
    useEffect(() => {
        if (client && latestResult && (!userData.id || userData.id !== client.Id)) {
            console.log("FaceScan Result UserData: " + JSON.stringify(userData));

            updateUserData({
                id: client?.Id,
                age: client?.Age,
                gender: client?.Gender,
                complaint: client?.HealthConcern,
                personalInfo:{
                    fullName: client?.FullName,
                    email: client?.Email,
                    phone: client?.Phone,
                    agree: true,
                    consent: true,
                    nationalityId: client.NationalityId
                },
                vitals: {
                    heartRate: latestResult?.RealTimeHeartRate,
                    bloodPressure: latestResult?.SystolicBloodPressureMmhg + "/" + latestResult?.DiastolicBloodPressureMmhg,
                    breathingRate: latestResult?.BreathingRate,
                    hrvSdnnMs: latestResult?.HrvSdnnMs,
                    diastolicBP: latestResult?.DiastolicBloodPressureMmhg,
                    systolicBP : latestResult?.SystolicBloodPressureMmhg,
                    oxygenSaturation: 0,
                    temperature: 0
                }
            });
        }
    }, [client, latestResult, userData.id]);

    return (
          <div className="h-full flex flex-col p-3 sm:p-4 md:p-6 lg:p-10">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center flex-shrink-0 pb-6"
              >
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#407EFF]">{t('faceScan.scanComplete')}</h2>
              </motion.div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {/* Heart Rate Card */}
                <VitalCard
                  title={t('faceScan.vitals.heartRate')}
                  icon="/heart.png"
                  iconAlt="heart"
                  value={sdkResults?.heart_rate_bpm ?? latestResult?.RealTimeHeartRate}
                  unit="BPM"
                  isLoading={isLoadingLocal}
                />

                {/* Heart Rate Variability (SDNN) Card */}
                <VitalCard
                  title={t('faceScan.vitals.heartRateVariability')}
                  icon="/variabilty.png"
                  iconAlt="heart rate variability"
                  value={sdkResults?.hrv_sdnn_ms ?? latestResult?.HrvSdnnMs}
                  unit="ms"
                  isLoading={isLoadingLocal}
                />

                {/* Respiration Rate Card */}
                <VitalCard
                  title={t('faceScan.vitals.respirationRate')}
                  icon="/lungs.png"
                  iconAlt="lungs"
                  value={sdkResults?.breathing_rate_bpm ?? latestResult?.BreathingRate}
                  unit="BPM"
                  isLoading={isLoadingLocal}
                />

                {/* Blood Pressure Card */}
                <BloodPressureCard
                  title={t('faceScan.vitals.bloodPressure')}
                  icon="/bloodPressure.png"
                  iconAlt="blood pressure"
                  systolicValue={sdkResults?.systolic_blood_pressure_mmhg ?? latestResult?.SystolicBloodPressureMmhg}
                  diastolicValue={sdkResults?.diastolic_blood_pressure_mmhg ?? latestResult?.DiastolicBloodPressureMmhg}
                  unit="mm Hg"
                  isLoading={isLoadingLocal}
                />

                {/* HRV lnRMSSD Card - if available */}
                {(sdkResults?.hrv_lnrmssd_ms !== undefined && sdkResults?.hrv_lnrmssd_ms !== null) && (
                  <VitalCard
                    title={t('faceScan.vitals.hrvLnrmssd')}
                    icon="/variabilty.png"
                    iconAlt="hrv lnrmssd"
                    value={sdkResults?.hrv_lnrmssd_ms ?? latestResult?.HrvLnrmssdMs}
                    unit="ms"
                    isLoading={isLoadingLocal}
                    decimals={2}
                  />
                )}

                {/* Cardiac Stress / Stress Index Card - if available */}
                {(sdkResults?.stress_index !== undefined && sdkResults?.stress_index !== null) && (
                  <VitalCard
                    title={t('faceScan.vitals.stressIndex')}
                    icon="/heart.png"
                    iconAlt="stress index"
                    value={sdkResults?.stress_index ?? latestResult?.CardiacStress}
                    unit=""
                    decimals={2}
                    isLoading={isLoadingLocal}
                  />
                )}

                {/* Cardiac Workload Card - if available */}
                {(sdkResults?.cardiac_workload_mmhg_per_sec !== undefined && sdkResults?.cardiac_workload_mmhg_per_sec !== null) && (
                  <VitalCard
                    title={t('faceScan.vitals.cardiacWorkload')}
                    icon="/heart.png"
                    iconAlt="cardiac workload"
                    value={sdkResults?.cardiac_workload_mmhg_per_sec ?? latestResult?.CardiacWorkload}
                    unit="mmHg/s"
                    decimals={1}
                    isLoading={isLoadingLocal}
                  />
                )}

                {/* Parasympathetic Activity Card - if available */}
                {(sdkResults?.parasympathetic_activity !== undefined && sdkResults?.parasympathetic_activity !== null) && (
                  <VitalCard
                    title={t('faceScan.vitals.parasympatheticActivity')}
                    icon="/variabilty.png"
                    iconAlt="parasympathetic activity"
                    value={sdkResults?.parasympathetic_activity ?? latestResult?.ParasympatheticActivity}
                    unit="%"
                    decimals={1}
                    isLoading={isLoadingLocal}
                  />
                )}

                {/* BMI Card - if available */}
                {(sdkResults?.bmi_kg_per_m2 !== undefined && sdkResults?.bmi_kg_per_m2 !== null) && (
                  <VitalCard
                    title={t('faceScan.vitals.bmi')}
                    icon="/heart.png"
                    iconAlt="bmi"
                    value={sdkResults?.bmi_kg_per_m2 ?? latestResult?.BMI}
                    unit="kg/m²"
                    decimals={1}
                    isLoading={isLoadingLocal}
                  />
                )}

                {/* Estimated Age Card - if available */}
                {(sdkResults?.age_years !== undefined && sdkResults?.age_years !== null) && (
                  <VitalCard
                    title={t('faceScan.vitals.estimatedAge')}
                    icon="/heart.png"
                    iconAlt="estimated age"
                    value={sdkResults?.age_years ?? latestResult?.Age}
                    unit="years"
                    isLoading={isLoadingLocal}
                  />
                )}

                {/* Weight Card - if available */}
                {(sdkResults?.weight_kg !== undefined && sdkResults?.weight_kg !== null) && (
                  <VitalCard
                    title={t('faceScan.vitals.weight')}
                    icon="/heart.png"
                    iconAlt="weight"
                    value={sdkResults?.weight_kg ?? latestResult?.Weight}
                    unit="kg"
                    decimals={1}
                    isLoading={isLoadingLocal}
                  />
                )}

                {/* Height Card - if available */}
                {(sdkResults?.height_cm !== undefined && sdkResults?.height_cm !== null) && (
                  <VitalCard
                    title={t('faceScan.vitals.height')}
                    icon="/heart.png"
                    iconAlt="height"
                    value={sdkResults?.height_cm ?? latestResult?.Height}
                    unit="cm"
                    isLoading={isLoadingLocal}
                  />
                )}

                {/* Signal Quality Card - if available */}
                {(sdkResults?.average_signal_quality !== undefined && sdkResults?.average_signal_quality !== null) && (
                  <VitalCard
                    title={t('faceScan.vitals.signalQuality')}
                    icon="/heart.png"
                    iconAlt="signal quality"
                    value={(sdkResults?.average_signal_quality ?? latestResult?.AverageSignalQuality) ? (sdkResults?.average_signal_quality ?? latestResult?.AverageSignalQuality) * 100 : null}
                    unit="%"
                    decimals={1}
                    isLoading={isLoadingLocal}
                  />
                )}
              </div>
                </div>
    
            {/* Sticky Button at Bottom */}
            <div className="flex-shrink-0 pt-4">
              <div className="flex items-center justify-center w-full">
          <button
                type="button"
                onClick={(e) => {
                  console.log("Button clicked!", e);
                  if (onlyVitalResult && onScanAgain) {
                    onScanAgain();
                  } else {
                    onNext();
                  }
                }}

                className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-4 sm:px-6 md:px-8 py-2 sm:py-3
                         text-sm sm:text-base md:text-lg font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                         rounded-lg sm:rounded-xl shadow-lg
                         transition-all duration-300 ease-out
                         hover:shadow-xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                         focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                         active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg
                         w-full sm:w-auto max-w-sm`}
              >
                    {isLoadingLocal ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm sm:text-base md:text-lg">{t('buttons.loading')}</span>
                  </div>
                ) : (
                  <>
                    <span>{onlyVitalResult ? t('buttons.scanAgain') : t('buttons.next')}</span>
                    {isArabic ? (
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    ) : (
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </>
                )}
              </button>
              </div>
            </div>
            </div>
  )
}
)

export default FaceScanResult; 