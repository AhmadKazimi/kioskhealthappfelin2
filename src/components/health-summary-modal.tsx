/* eslint-disable @typescript-eslint/no-unused-vars */ 
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; 
import QRCode from "react-qr-code";
import { ClientModel } from "@/payload-types";
import { useEffect, useState, useCallback } from "react";
import { HealthData } from "@/types/health-data";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Cookies from 'js-cookie';
import { useTranslation } from "@/hooks/useTranslation";

// interface SuggestedCare {
//   level?: string;
//   message?: string;
//   timestamp?: number;
// }
interface HealthSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: ClientModel;
  //recommendation: SuggestedCare | null
}

export default function HealthSummaryModal({
  isOpen,
  onClose,
  userData,
  //recommendation
}: HealthSummaryModalProps) { 
  const { t, i18n } = useTranslation();
  const [latestResult, setLatestResult] = useState<HealthData | null>(null);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const hostUrl = process.env.NEXT_PUBLIC_HOST_DOMAIN;
  const userId = Cookies.get('userId');
  
  // Check if current language is Arabic
  const isArabic = i18n.language === 'ar';

  // Function to combine names with proper spacing
  const combineName = (name1?: string | null, name2?: string | null): string => {
    // Clean and check name1
    const cleanName1 = name1?.trim();
    if (cleanName1 && cleanName1 !== '') {
      return cleanName1;
    }
    
    // Clean and check name2 as fallback
    const cleanName2 = name2?.trim();
    if (cleanName2 && cleanName2 !== '') {
      return cleanName2;
    }
    
    // Check userData directly as last resort
    const directName = userData?.UserName?.trim() || userData?.FullName?.trim();
    if (directName && directName !== '') {
      return directName;
    }
    
    return "N/A";
  };


  // Function to translate symptoms from English to Arabic
  const translateSymptoms = (symptomsText: string): string => {
    if (!isArabic || !symptomsText) return symptomsText;
    
    // Create mapping of English symptoms to direct Arabic translations
    const symptomMap: { [key: string]: string } = {
      'headache': t('complaint.symptoms.headache'),
      'fever': t('complaint.symptoms.fever'), 
      'cough': t('complaint.symptoms.cough'),
      'sore throat': t('complaint.symptoms.soreThroat'),
      'stomach pain': t('complaint.symptoms.stomachPain'),
      'back pain': t('complaint.symptoms.backPain'),
      'dizziness': t('complaint.symptoms.dizziness'),
      'fatigue': t('complaint.symptoms.fatigue'),
      'nausea': t('complaint.symptoms.nausea'),
      'shortness of breath': t('complaint.symptoms.shortnessOfBreath'),
      'chest pain': t('complaint.symptoms.chestPain'),
      'other': t('complaint.symptoms.other'),
      'nothing': t('complaint.symptoms.nothing')
    };

    let translatedText = symptomsText;
    
    // Split by common separators (comma, semicolon, and/or) and translate each symptom
    const symptoms = symptomsText.split(/[,;]|\band\b/i).map(s => s.trim());
    
    for (const symptom of symptoms) {
      const lowerSymptom = symptom.toLowerCase();
      for (const [englishSymptom, translation] of Object.entries(symptomMap)) {
        if (lowerSymptom.includes(englishSymptom)) {
          // Make sure we have a valid translation and it's not the same as the key
          if (translation && translation !== `complaint.symptoms.${englishSymptom}`) {
            translatedText = translatedText.replace(new RegExp(symptom, 'gi'), translation);
          }
          break;
        }
      }
    }
    
    return translatedText;
  };

  useEffect(() => {
    const fetcherResults = async () => {  
      const allResults = await fetch(`${apiUrl}/ScanResult/GetClientLatestScanResult?clientId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      }); 

      const jsonData = await allResults.json();
      const data: HealthData = jsonData.Result;

      setLatestResult(data); 
    };

    fetcherResults();

    const now = new Date();
    setCurrentDate(now.toLocaleDateString()); // Format as MM/DD/YYYY or based on locale
    setCurrentTime(now.toLocaleTimeString()); // Format as HH:MM:SS AM/PM or based on locale

    // Debug logging
    console.log('Modal userData:', userData);
    console.log('Modal userData.UserName:', userData?.UserName);
    console.log('Modal userData.FullName:', userData?.FullName);
    console.log('Modal combineName result:', combineName(userData?.UserName, userData?.FullName));
    console.log('Modal screen width:', window.innerWidth);
  }, [userData]);
 
  const sendSummaryByEmail = async (event?: React.MouseEvent) => {
    // Prevent the event from being passed as userData
    if (event) {
      event.preventDefault();
    }
    
    try { 
      if (!userData?.Email) {
        await Swal.fire({
          icon: "error",
          title: t('healthSummary.emailError'),
          text: "Email is missing.",
        });
        return;
      }
      const response = await fetch(`${apiUrl}/email/SendMedicalReport`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver: userData.Email,
          subject: "Health Assessment Report / ملخص التقييم الصحي",
          reportData: {
            date: currentDate,
            time: currentTime,
            name: combineName(userData.UserName, userData.FullName) || "N/A",
            age: userData.Age || "N/A",
            gender: userData.Gender || "N/A",
            heartRate: latestResult?.HeartRate10s || "N/A",
            bloodPressure: latestResult ? `${latestResult.SystolicBloodPressureMmhg}/${latestResult.DiastolicBloodPressureMmhg}` : "N/A",
            heartRateVariability: latestResult?.HrvSdnnMs || "N/A",
            respirationRate: latestResult?.BreathingRate || "N/A",
            reportedSymptoms: translateSymptoms(userData.HealthConcern) || "No symptoms reported"
          }
        }),
      });

      const responseJson = await response.json();

      if (responseJson.IsSuccess) {
          // Clear session storage after successful email
          sessionStorage.removeItem('clientData');
          
          Swal.fire({
            icon: "success",
            title: t('healthSummary.emailSuccess'),
            showConfirmButton: false,
            timer: 1500, 
          });
      } else {
        console.error("Failed to send email");
        alert(t('healthSummary.emailError'));
      }
    } catch (error) {
      console.error("Error:", error);
      alert(t('healthSummary.emailError'));
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-3xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto print:shadow-none print:border-none bg-white ${isArabic ? 'rtl' : 'ltr'}`}>
        <DialogHeader>
          <DialogTitle className={`text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 ${isArabic ? 'text-right' : 'text-left'}`}>
            {t('healthSummary.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="w-full sm:w-auto text-center sm:text-start">
            <div className="inline-flex flex-col items-center bg-blue-100 p-2 rounded-lg">
              <QRCode
                size={window.innerWidth < 400 ? 100 : 120}
                value={`${hostUrl}/health-summary?clientId=${userId}`}
              />
              <p className="text-xs text-gray-600 mt-1">
                {t('healthSummary.scanToViewMobile')}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <p className={`text-sm sm:text-base text-gray-600 ${isArabic ? 'text-right health-summary-content' : 'text-left'} break-words whitespace-pre-wrap`}
               style={{
                 direction: isArabic ? 'rtl' : 'ltr',
                 unicodeBidi: 'plaintext'
               }}
               dir={isArabic ? 'rtl' : 'ltr'}>
              {t('healthSummary.date')} {currentDate}
            </p>
            <p className={`text-sm sm:text-base text-gray-600 ${isArabic ? 'text-right health-summary-content' : 'text-left'} break-words whitespace-pre-wrap`}
               style={{
                 direction: isArabic ? 'rtl' : 'ltr',
                 unicodeBidi: 'plaintext'
               }}
               dir={isArabic ? 'rtl' : 'ltr'}>
              {t('healthSummary.time')} {currentTime}
            </p>
            {userData.UserName && (
              <p className={`text-sm sm:text-base text-gray-600 mt-2 ${isArabic ? 'text-right health-summary-content' : 'text-left'} break-words whitespace-pre-wrap`}
                 style={{
                   direction: isArabic ? 'rtl' : 'ltr',
                   unicodeBidi: 'plaintext'
                 }}
                 dir={isArabic ? 'rtl' : 'ltr'}>
                {t('healthSummary.name')} {combineName(userData?.UserName, userData.FullName)}
              </p>
            )}
            <p className={`text-sm sm:text-base text-gray-600 ${isArabic ? 'text-right health-summary-content' : 'text-left'} break-words whitespace-pre-wrap`}
               style={{
                 direction: isArabic ? 'rtl' : 'ltr',
                 unicodeBidi: 'plaintext'
               }}
               dir={isArabic ? 'rtl' : 'ltr'}>
              {t('healthSummary.age')} {userData.Age}
            </p>
            <p className={`text-sm sm:text-base text-gray-600 ${isArabic ? 'text-right health-summary-content' : 'text-left'} break-words whitespace-pre-wrap`}
               style={{
                 direction: isArabic ? 'rtl' : 'ltr',
                 unicodeBidi: 'plaintext'
               }}
               dir={isArabic ? 'rtl' : 'ltr'}>
              {t('healthSummary.gender')} {userData.Gender}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className={`${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
            <h3 className={`text-lg sm:text-xl font-semibold text-blue-600 mb-2 sm:mb-3 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
              {t('healthSummary.vitalSigns')}
            </h3>
            <div className={`${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
              <p className={`text-sm sm:text-base mb-2 ${isArabic ? 'text-right health-summary-content' : 'text-left'} break-words whitespace-pre-wrap`} 
                 style={{
                   direction: isArabic ? 'rtl' : 'ltr',
                   unicodeBidi: 'plaintext'
                 }}
                 dir={isArabic ? 'rtl' : 'ltr'}>
                • {t('faceScan.vitals.heartRate')}: {!latestResult ? "..." : latestResult.HeartRate10s} {t('userProfile.vitals.bpm')}
              </p>
              <p className={`text-sm sm:text-base mb-2 ${isArabic ? 'text-right health-summary-content' : 'text-left'} break-words whitespace-pre-wrap`}
                 style={{
                   direction: isArabic ? 'rtl' : 'ltr',
                   unicodeBidi: 'plaintext'
                 }}
                 dir={isArabic ? 'rtl' : 'ltr'}>
                • {t('faceScan.vitals.bloodPressure')}:{" "}
                {!latestResult
                  ? "..."
                  : `${latestResult.SystolicBloodPressureMmhg}/${latestResult.DiastolicBloodPressureMmhg}`} {t('userProfile.vitals.mmHg')}
              </p>
              <p className={`text-sm sm:text-base mb-2 ${isArabic ? 'text-right health-summary-content' : 'text-left'} break-words whitespace-pre-wrap`}
                 style={{
                   direction: isArabic ? 'rtl' : 'ltr',
                   unicodeBidi: 'plaintext'
                 }}
                 dir={isArabic ? 'rtl' : 'ltr'}>
                • {t('faceScan.vitals.heartRateVariability')}:{" "}
                {!latestResult ? "..." : latestResult.HrvSdnnMs} {t('userProfile.vitals.ms')}
              </p>
              <p className={`text-sm sm:text-base mb-2 ${isArabic ? 'text-right health-summary-content' : 'text-left'} break-words whitespace-pre-wrap`}
                 style={{
                   direction: isArabic ? 'rtl' : 'ltr',
                   unicodeBidi: 'plaintext'
                 }}
                 dir={isArabic ? 'rtl' : 'ltr'}>
                • {t('faceScan.vitals.respirationRate')}:{" "}
                {!latestResult ? "..." : latestResult.BreathingRate} {t('userProfile.vitals.bps')}
              </p>
            </div>
          </div>

          <div className={`${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
            <h3 className={`text-lg sm:text-xl font-semibold text-blue-600 mb-2 sm:mb-3 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
              {t('healthSummary.reportedSymptoms')}
            </h3>
            <ul className={`list-disc mb-1 text-sm sm:text-base ${isArabic ? 'list-inside text-right' : 'pl-5 text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
              <li className={`mb-1 ${isArabic ? 'text-right health-summary-content' : 'text-left'} break-words whitespace-pre-wrap`} 
                  style={{
                    direction: isArabic ? 'rtl' : 'ltr',
                    unicodeBidi: 'plaintext'
                  }}
                  dir={isArabic ? 'rtl' : 'ltr'}>
                {translateSymptoms(userData.HealthConcern)}
              </li>
            </ul>
          </div>
        </div>

        {/* <div className="mt-6">
            <h3 className="text-xl font-semibold text-blue-600 mb-3">
              Suggested Care
            </h3>
            
            {recommendation ? (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="font-semibold text-lg">{recommendation.level}</p>
                <p>{recommendation.message}</p>
              </div>
            ) : (
              <p className="text-gray-500">No recommendation available.</p>
            )}
          </div> */}

          {/* <div className="mt-6">
            <h3 className="text-xl font-semibold text-blue-600 mb-3">
              Possible Causes
            </h3>
            <div className="space-y-2">
              {possibleCauses.map((cause, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <span>{cause.condition}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      cause.likelihood === "common"
                        ? "bg-red-100 text-red-800"
                        : cause.likelihood === "rare"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {cause.likelihood}
                  </span>
                </div>
              ))}
            </div>
          </div> */}

        <div className="mt-4 md:mt-6 bg-blue-50 p-3 sm:p-4 rounded-lg" dir={isArabic ? 'rtl' : 'ltr'}>
          <h3 className={`text-lg sm:text-xl font-semibold text-blue-600 mb-2 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
            {t('healthSummary.importantNoticeTitle')}
          </h3>
          <p className={`text-sm sm:text-base text-gray-700 ${isArabic ? 'text-right health-summary-content' : 'text-left'} break-words whitespace-pre-wrap`}
             style={{
               direction: isArabic ? 'rtl' : 'ltr',
               unicodeBidi: 'plaintext'
             }}
             dir={isArabic ? 'rtl' : 'ltr'}>
            {t('healthSummary.importantNotice')}
          </p>
        </div>

        <DialogFooter className="mt-4 md:mt-6 flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            {t('buttons.close')}
          </Button>
          <Button
            onClick={() => {
              sendSummaryByEmail();
            }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {t('healthSummary.sendEmail')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ); 
}
