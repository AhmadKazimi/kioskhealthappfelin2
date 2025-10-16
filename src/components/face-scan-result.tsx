/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable react-hooks/exhaustive-deps */

import React from 'react';
import { useState, useEffect, useCallback } from "react"
import Cookies from 'js-cookie';
import { motion } from "framer-motion";

import { HealthData } from "@/types/health-data";
import type { UserData } from "./home-screen";

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ClientModel } from '@/payload-types';
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Counter from './Counter';
import { useClientScanResults } from '@/hooks/useClientScanResults';


interface FaceScanResultProps { 
    userData: UserData;
    updateUserData: (data: Partial<UserData>) => void;
    onPrev: () => void;
    onNext: () => void;
};

const FaceScanResult = React.memo(function FaceScanResult({
  userData,
  updateUserData,
  onNext,
  onPrev
}: FaceScanResultProps){
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';

    // Ensure language is preserved on component mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('i18nextLng');
        if (savedLanguage && i18n.language !== savedLanguage) {
            console.log('Face scan result: Restoring language to:', savedLanguage);
            i18n.changeLanguage(savedLanguage);
        }
    }, [i18n]);

    // Use shared hook for API calls
    const { data: latestResult, client, loading: isFetching, error } = useClientScanResults({
        onSuccess: useCallback((data: HealthData) => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📊 FACE SCAN RESULT PAGE - Data Received from Hook');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Full Data Object:', JSON.stringify(data, null, 2));
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Vitals Being Displayed:');
            console.log('  Heart Rate (Realtime):', data.RealTimeHeartRate, 'BPM');
            console.log('  HRV SDNN:', data.HrvSdnnMs, 'ms');
            console.log('  Breathing Rate:', data.BreathingRate, 'BPM');
            console.log('  Blood Pressure:', `${data.SystolicBloodPressureMmhg}/${data.DiastolicBloodPressureMmhg}`, 'mmHg');
            console.log('  Scan Type:', data.ScanType);
            console.log('  Scan Date:', data.ScanDate);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔍 Verify these match your scan!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }, [])
    });

    // Update user data when client and scan results are available (ONLY IF LOCAL DATA NOT PRESENT)
    useEffect(() => {
        // Only update from API if we don't have local vitals data already
        const hasLocalVitals = userData.vitals &&
                               (userData.vitals.heartRate > 0 ||
                                userData.vitals.systolicBP > 0);

        if (client && latestResult && (!userData.id || userData.id !== client.Id) && !hasLocalVitals) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📊 FACE SCAN RESULT - Updating userData from API (no local data)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
        } else if (hasLocalVitals) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ FACE SCAN RESULT - Using LOCAL vitals data (already present)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Local Vitals:', JSON.stringify(userData.vitals, null, 2));
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
    }, [client, latestResult, userData.id, userData.vitals]);

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
      <Card className="bg-white flex flex-col p-3 sm:p-4 md:p-5 lg:p-6 rounded-2xl sm:rounded-3xl shadow-lg border-0 h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px]">
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#4F8EFF] mb-auto">
          {t('faceScan.vitals.heartRate')}
        </p>

        <div className="flex items-end justify-between gap-3 sm:gap-4 mt-3">
          {/* Heart Icon */}
          <div className="flex-shrink-0">
            <img src="/heart.png" alt="heart" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" />
          </div>

          <div className="flex flex-col items-end min-w-0">
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black leading-tight whitespace-nowrap">
              <Counter
                value={userData.vitals?.heartRate || latestResult?.RealTimeHeartRate || 0}
                duration={1500}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black"
              />
            </p>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700 mt-0.5">BPM</p>
          </div>
        </div>
      </Card>

      {/* Heart Rate Variability Card */}
      <Card className="bg-white flex flex-col p-3 sm:p-4 md:p-5 lg:p-6 rounded-2xl sm:rounded-3xl shadow-lg border-0 h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px]">
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#4F8EFF] mb-auto">
          {t('faceScan.vitals.heartRateVariability')}
        </p>

        <div className="flex items-end justify-between gap-3 sm:gap-4 mt-3">
          {/* Monitor Icon */}
          <div className="flex-shrink-0">
            <img src="/variabilty.png" alt="heart" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" />
          </div>

          <div className="flex flex-col items-end min-w-0">
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black leading-tight whitespace-nowrap">
              <Counter
                value={userData.vitals?.hrvSdnnMs || latestResult?.HrvSdnnMs || 0}
                duration={1500}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black"
              />
            </p>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700 mt-0.5">ms</p>
          </div>
        </div>
      </Card>

      {/* Respiration Rate Card */}
      <Card className="bg-white flex flex-col p-3 sm:p-4 md:p-5 lg:p-6 rounded-2xl sm:rounded-3xl shadow-lg border-0 h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px]">
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#4F8EFF] mb-auto">
          {t('faceScan.vitals.respirationRate')}
        </p>

        <div className="flex items-end justify-between gap-3 sm:gap-4 mt-3">
          {/* Lungs Icon */}
          <div className="flex-shrink-0">
            <img src="/lungs.png" alt="lungs" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" />
          </div>

          <div className="flex flex-col items-end min-w-0">
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black leading-tight whitespace-nowrap">
              <Counter
                value={userData.vitals?.breathingRate || latestResult?.BreathingRate || 0}
                duration={1500}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black"
              />
            </p>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700 mt-0.5">BPM</p>
          </div>
        </div>
      </Card>

      {/* Blood Pressure Card */}
      <Card className="bg-white flex flex-col p-3 sm:p-4 md:p-5 lg:p-6 rounded-2xl sm:rounded-3xl shadow-lg border-0 h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px]">
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#4F8EFF] mb-auto">
          {t('faceScan.vitals.bloodPressure')}
        </p>

        <div className="flex items-end justify-between gap-3 sm:gap-4 mt-3">
          {/* Blood Pressure Monitor Icon */}
          <div className="flex-shrink-0">
            <img src="/bloodPressure.png" alt="bloodPressure" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" />
          </div>

          <div className="flex flex-col items-end min-w-0">
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-black leading-tight whitespace-nowrap">
              <Counter
                value={userData.vitals?.systolicBP || latestResult?.SystolicBloodPressureMmhg || latestResult?.SystolicBloodPressure || 0}
                duration={1500}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-black"
              />
              <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">/</span>
              <Counter
                value={userData.vitals?.diastolicBP || latestResult?.DiastolicBloodPressureMmhg || latestResult?.DiastolicBloodPressure || 0}
                duration={1500}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-black"
              />
            </p>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700 mt-0.5">mm Hg</p>
          </div>
        </div>
      </Card>
                  </div>
                </div>
    
            {/* Sticky Button at Bottom */}
            <div className="flex-shrink-0 pt-4">
              <div className="flex items-center justify-center w-full">
          <button 
                type="button"
                onClick={(e) => {
                  console.log("Button clicked!", e);
                  onNext();
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
                    {isFetching ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm sm:text-base md:text-lg">{t('buttons.loading')}</span>
                  </div>
                ) : (
                  <>
                    <span>{t('buttons.next')}</span>
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