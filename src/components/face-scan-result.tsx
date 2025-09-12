/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable react-hooks/exhaustive-deps */

import React from 'react';
import { useState, useEffect } from "react"
import Cookies from 'js-cookie';

import { HealthData } from "@/types/health-data";
import type { UserData } from "./home-screen";

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ClientModel } from '@/payload-types';
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Counter from './Counter';


interface FaceScanResultProps { 
    userData: UserData;
    updateUserData: (data: Partial<UserData>) => void;
    onPrev: () => void;
    onNext: () => void;
};

export default function FaceScanResult({
  userData,
  updateUserData,
  onNext,
  onPrev
}: FaceScanResultProps){
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const [latestResult, setLatestResult] = useState<HealthData | null>(null);
    const [isFetching, setIsFetching] = useState<Boolean>(false);
    
    // Ensure language is preserved on component mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('i18nextLng');
        if (savedLanguage && i18n.language !== savedLanguage) {
            console.log('Face scan result: Restoring language to:', savedLanguage);
            i18n.changeLanguage(savedLanguage);
        }
    }, [i18n]);
     
    useEffect(() => {
        console.log("FaceScan Result UserData: " + JSON.stringify(userData));
        
        const fetcherResults = async () => {
            setIsFetching(true);
            const userId = Cookies.get('userId');
            const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL; 

            if (!userId) {
                setIsFetching(false);
                return;
            }

            const getClientResponse = await fetch(`${apiUrl}/client/GetClient?id=${userId}`, {
                method: "GET",
                headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
                },
            });
     
            const getClientResponseJson = await getClientResponse.json(); 
            const client: ClientModel = getClientResponseJson.Result;   

            const allResults = await fetch(`${apiUrl}/ScanResult/GetClientLatestScanResult?clientId=${userId}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "ngrok-skip-browser-warning": "true",
                },
              }); 
                console.log("allResults: " + JSON.stringify(allResults));
                
            const jsonData = await allResults.json();
            const data: HealthData = jsonData.Result;

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
                    heartRate: data?.RealTimeHeartRate,
                    bloodPressure: data?.SystolicBloodPressureMmhg + "/" + data?.DiastolicBloodPressureMmhg,
                    breathingRate: data?.BreathingRate,
                    hrvSdnnMs: data?.HrvSdnnMs,
                    diastolicBP: data?.DiastolicBloodPressureMmhg,
                    systolicBP : data?.SystolicBloodPressureMmhg,
                    oxygenSaturation: 0,
                    temperature: 0
                }
            });

            setLatestResult(data);
            setIsFetching(false);
        };

        fetcherResults();
    }, []);

    return (
          <div className="flex flex-col justify-between sm:justify-center gap-y-4 sm:gap-y-6 md:gap-y-8 lg:gap-y-12 p-3 sm:p-4 md:p-6 lg:p-10 h-[85vh] sm:h-[80vh] overflow-hidden">
            <div className="text-center flex-shrink-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-700 my-3 sm:my-4 md:my-5">{t('faceScan.scanComplete')}</h2>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 h-[90%] flex-1 min-h-0">
      {/* Heart Rate Card */}
      <Card className="bg-white flex flex-col justify-between items-start p-2 sm:p-3 md:p-4 lg:p-6 rounded-2xl sm:rounded-3xl shadow-lg border-0 h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px]">
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#4F8EFF] mb-2 sm:mb-3 md:mb-4 lg:mb-6 flex-shrink-0">
          {t('faceScan.vitals.heartRate')}
        </p>
        
        <div className="flex items-center justify-between w-full flex-1">
          {/* Heart Icon */}
          <div className="flex items-center justify-center flex-shrink-0">
          <img src="/heart.png" alt="heart" className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20" />

          </div>

          <div className="text-right flex-1 min-w-0">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl font-black text-black leading-none mb-1">
              <Counter 
                value={latestResult?.RealTimeHeartRate || 99} 
                duration={1500}
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl font-black text-black leading-none"
              />
            </p>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700"> 
              <span className="text-xs sm:text-sm md:text-base lg:text-lg">BPM</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Heart Rate Variability Card */}
      <Card className="bg-white flex flex-col justify-between items-start p-2 sm:p-3 md:p-4 lg:p-6 rounded-2xl sm:rounded-3xl shadow-lg border-0 h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px]">
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#4F8EFF] mb-2 sm:mb-3 md:mb-4 lg:mb-6 flex-shrink-0">
          {t('faceScan.vitals.heartRateVariability')}
        </p>
        
        <div className="flex items-center justify-between w-full flex-1">
          {/* Monitor Icon */}
          <div className="flex items-center justify-center flex-shrink-0">
            <img src="/variabilty.png" alt="heart" className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20" />
          </div>

          <div className="text-right flex-1 min-w-0">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl font-black text-black leading-none mb-1">
              <Counter 
                value={latestResult?.HrvSdnnMs || 0} 
                duration={1500}
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl font-black text-black leading-none"
              />
            </p>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700">ms</p>
          </div>
        </div>
      </Card>

      {/* Respiration Rate Card */}
      <Card className="bg-white flex flex-col justify-between items-start p-2 sm:p-3 md:p-4 lg:p-6 rounded-2xl sm:rounded-3xl shadow-lg border-0 h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px]">
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#4F8EFF] mb-2 sm:mb-3 md:mb-4 lg:mb-6 flex-shrink-0">
          {t('faceScan.vitals.respirationRate')}
        </p>
        
        <div className="flex items-center justify-between w-full flex-1">
          {/* Lungs Icon */}
          <div className="flex items-center justify-center flex-shrink-0">
            <img src="/lungs.png" alt="lungs" className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20" />
          </div>

          <div className="text-right flex-1 min-w-0">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl font-black text-black leading-none mb-1">
              <Counter 
                value={latestResult?.BreathingRate || 0} 
                duration={1500}
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl font-black text-black leading-none"
              />
            </p>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700">BPM</p>
          </div>
        </div>
      </Card>

      {/* Blood Pressure Card */}
      <Card className="bg-white flex flex-col justify-between items-start p-2 sm:p-3 md:p-4 lg:p-6 rounded-2xl sm:rounded-3xl shadow-lg border-0 h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px]">
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#4F8EFF] mb-2 sm:mb-3 md:mb-4 lg:mb-6 flex-shrink-0">
          {t('faceScan.vitals.bloodPressure')}
        </p>
        
        <div className="flex items-center justify-between w-full flex-1">
          {/* Blood Pressure Monitor Icon */}
          <div className="flex items-center justify-center flex-shrink-0">
            <img src="/bloodPressure.png" alt="bloodPressure" className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20" />
          </div>

          <div className="text-right flex-1 min-w-0">
            <p className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-black text-black leading-none mb-1">
              <Counter 
                value={latestResult?.SystolicBloodPressureMmhg || 0} 
                duration={1500}
                className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-black text-black leading-none"
              />
              <span className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl">/
                <Counter 
                  value={latestResult?.DiastolicBloodPressureMmhg || 0} 
                  duration={1500}
                  className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-black text-black leading-none"
                />
              </span>
            </p>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700">mm Hg</p>
          </div>
        </div>
      </Card>
                </div>
              </div>

            <div className="flex items-center justify-center w-full pt-2 sm:pt-4 flex-shrink-0">
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
    );
}; 