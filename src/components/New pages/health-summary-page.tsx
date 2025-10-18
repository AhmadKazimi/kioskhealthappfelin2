  /* eslint-disable @typescript-eslint/no-unused-vars */
  "use client";

  import React from 'react';
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
  import { useRouter } from "next/navigation";
  import { useClientScanResults } from '@/hooks/useClientScanResults';

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

  const HealthSummaryPage = React.memo(function HealthSummaryPage({
    isOpen,
    onClose,
    userData,
    //recommendation
  }: HealthSummaryModalProps) {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const [isAnimating, setIsAnimating] = useState(false);
    const [timer, setTimer] = useState(30); // 10 seconds countdown
    const [isTimerActive, setIsTimerActive] = useState(true);
    const [sendingEmail, setSendingEmail] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const hostUrl = process.env.NEXT_PUBLIC_HOST_DOMAIN;
    const userId = Cookies.get('userId');

    // Use shared hook for API calls
    const { data: latestResult, client, loading, error } = useClientScanResults({
      onSuccess: useCallback((data: HealthData) => {
        console.log('Health summary page: Data received:', data);
      }, [])
    });

    // Check if current language is Arabic
    const isArabic = i18n.language === 'ar';

    // Function to translate symptom keys to current language
    const translateSymptom = (symptomKey: string): string => {
      if (!symptomKey) return '';

      // Trim the symptom key
      const trimmedKey = symptomKey.trim();

      // Map of symptom keys to translation keys
      const symptomKeyMap: { [key: string]: string } = {
        'headache': 'complaint.symptoms.headache',
        'fever': 'complaint.symptoms.fever',
        'cough': 'complaint.symptoms.cough',
        'soreThroat': 'complaint.symptoms.soreThroat',
        'sore throat': 'complaint.symptoms.soreThroat',
        'stomachPain': 'complaint.symptoms.stomachPain',
        'stomach pain': 'complaint.symptoms.stomachPain',
        'backPain': 'complaint.symptoms.backPain',
        'back pain': 'complaint.symptoms.backPain',
        'dizziness': 'complaint.symptoms.dizziness',
        'fatigue': 'complaint.symptoms.fatigue',
        'nausea': 'complaint.symptoms.nausea',
        'shortnessOfBreath': 'complaint.symptoms.shortnessOfBreath',
        'shortness of breath': 'complaint.symptoms.shortnessOfBreath',
        'chestPain': 'complaint.symptoms.chestPain',
        'chest pain': 'complaint.symptoms.chestPain',
        'other': 'complaint.symptoms.other',
        'nothing': 'complaint.symptoms.nothing'
      };

      // Try to find the translation key
      const translationKey = symptomKeyMap[trimmedKey] || symptomKeyMap[trimmedKey.toLowerCase()];

      if (translationKey) {
        return t(translationKey);
      }

      // If no mapping found, return the original value (might be custom text)
      return trimmedKey;
    };

    // Define missing variables and functions
    const [currentDate, setCurrentDate] = useState<string>("");
    const [currentTime, setCurrentTime] = useState<string>("");

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

  // Function to translate gender
  const translateGender = (gender?: string | null): string => {
    if (!gender) return "N/A";
    const genderLower = gender.toLowerCase().trim();
    if (genderLower === 'male') return t('userInfo.male');
    if (genderLower === 'female') return t('userInfo.female');
    return gender;
  };

  // Create patient object from userData with better fallback handling
  const patient = {
    name: combineName(
      userData?.FullName,
      userData?.UserName
    ),
    age: userData?.Age || "N/A",
    gender: translateGender(userData?.Gender)
  };

    // Create vital signs array from latestResult
    const vitalSigns = latestResult ? [
      {
        name: t('faceScan.vitals.heartRate'),
        value: `${latestResult.HeartRate10s ? Math.round(latestResult.HeartRate10s) : "N/A"} ${t('fastScan.units.bpm')}`,
        normalRange: `60-100 ${t('fastScan.units.bpm')}`,
        status: latestResult.HeartRate10s && latestResult.HeartRate10s >= 60 && latestResult.HeartRate10s <= 100 ? t('healthSummary.normal') : t('healthSummary.abnormal')
      },
      {
        name: t('faceScan.vitals.bloodPressure'),
        value: `${latestResult.SystolicBloodPressureMmhg ? Math.round(latestResult.SystolicBloodPressureMmhg) : "N/A"}/${latestResult.DiastolicBloodPressureMmhg ? Math.round(latestResult.DiastolicBloodPressureMmhg) : "N/A"} ${t('fastScan.units.mmhg')}`,
        normalRange: `<120/<80 ${t('fastScan.units.mmhg')}`,
        status: latestResult.SystolicBloodPressureMmhg && latestResult.DiastolicBloodPressureMmhg && latestResult.SystolicBloodPressureMmhg < 120 && latestResult.DiastolicBloodPressureMmhg < 80 ? t('healthSummary.normal') : t('healthSummary.abnormal')
      },
      {
        name: t('faceScan.vitals.heartRateVariability'),
        value: `${latestResult.HrvSdnnMs ? Math.round(latestResult.HrvSdnnMs) : "N/A"} ${t('fastScan.units.ms')}`,
        normalRange: `20-100 ${t('fastScan.units.ms')}`,
        status: latestResult.HrvSdnnMs && latestResult.HrvSdnnMs >= 20 && latestResult.HrvSdnnMs <= 100 ? t('healthSummary.normal') : t('healthSummary.abnormal')
      },
      {
        name: t('faceScan.vitals.respirationRate'),
        value: `${latestResult.BreathingRate ? Math.round(latestResult.BreathingRate) : "N/A"} ${t('healthSummary.breathingRateUnit')}`,
        normalRange: `12-20 ${t('healthSummary.breathingRateUnit')}`,
        status: latestResult.BreathingRate && latestResult.BreathingRate >= 12 && latestResult.BreathingRate <= 20 ? t('healthSummary.normal') : t('healthSummary.abnormal')
      }
    ] : [];

    // Create symptoms array from userData.HealthConcern and translate each
    const symptoms = userData.HealthConcern ?
      userData.HealthConcern.split(/[,;]|\band\b/i)
        .map(s => s.trim())
        .filter(s => s && s.toLowerCase() !== 'nothing')
        .map(s => translateSymptom(s)) :
      [];

    // Create timestamp object
    const timestamp = {
      date: currentDate,
      time: currentTime
    };

    // Function to get status style
    const getStatusStyle = (status: string) => {
      return status === t('healthSummary.normal') ? "text-green-600 font-medium" : "text-red-600 font-medium";
    };

    // Handle close button click
    const handleClose = useCallback(() => {
      setIsTimerActive(false);
      onClose();
      // Redirect to main page when user clicks close
      window.location.href = '/';
    }, [onClose]);

    // Timer countdown effect (avoid navigation inside state updater)
    useEffect(() => {
      if (!isTimerActive) return;
      if (timer <= 0) return;
      const timeoutId = setTimeout(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearTimeout(timeoutId);
    }, [isTimerActive, timer]);

    // Navigate when timer reaches 0 (after commit phase)
    useEffect(() => {
      if (!isTimerActive) return;
      if (timer === 0) {
        setIsTimerActive(false);
        onClose();
        // Redirect to main page when timer finishes
        window.location.href = '/';
      }
    }, [timer, isTimerActive, onClose]);

    const sendSummaryByEmail = async (event?: React.MouseEvent) => {
      // Prevent the event from being passed as userData
      if (event) {
        event.preventDefault();
      }
      
      // Stop the timer when user clicks send email
      setIsTimerActive(false);
      
      try { 
        if (!userData?.Email) {
          await Swal.fire({
            icon: "error",
            title: t('healthSummary.emailError'),
            text: t('healthSummary.emailMissing'),
          });
          return;
        }
        setSendingEmail(true);

        const requestData = {
          receiver: userData.Email,
          subject: t('healthSummary.emailSubject'),
          reportData: {
            date: currentDate,
            time: currentTime,
            name: combineName(
              userData?.FullName,
            ),
            age: userData?.Age || "N/A",
            gender: userData?.Gender || "N/A",
            heartRate: latestResult?.HeartRate10s ? Math.round(latestResult.HeartRate10s) : "N/A",
            bloodPressure: latestResult ? `${Math.round(latestResult.SystolicBloodPressureMmhg)}/${Math.round(latestResult.DiastolicBloodPressureMmhg)}` : "N/A",
            heartRateVariability: latestResult?.HrvSdnnMs ? Math.round(latestResult.HrvSdnnMs) : "N/A",
            respirationRate: latestResult?.BreathingRate ? Math.round(latestResult.BreathingRate) : "N/A",
            reportedSymptoms: symptoms.length > 0 ? symptoms.join(', ') : t('healthSummary.noSymptomsReported')
          }
        };

        console.log("SendMedicalReport Request Data:", requestData);

        const response = await fetch(`${apiUrl}/email/SendMedicalReport`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        const responseJson = await response.json();
        if (responseJson.IsSuccess) {
            // Don't clear session storage to prevent redirect
            // sessionStorage.removeItem('clientData');

            await Swal.fire({
              icon: "success",
              title: t('healthSummary.emailSuccess'),
              text: t('healthSummary.emailSuccessMessage'),
              confirmButtonText: t('buttons.ok'),
              confirmButtonColor: '#3085d6',
              allowOutsideClick: false,
              allowEscapeKey: false,
            });

            // Redirect after user clicks OK
            window.location.href = '/';
        } else {
          console.error("Failed to send email");
          await Swal.fire({
            icon: "error",
            title: t('healthSummary.emailError'),
            text: t('healthSummary.emailErrorMessage'),
            confirmButtonText: t('buttons.ok'),
            confirmButtonColor: '#d33',
          });
        }
      } catch (error) {
        console.error("Error:", error);
        await Swal.fire({
          icon: "error",
          title: t('healthSummary.emailError'),
          text: t('healthSummary.emailErrorMessage'),
          confirmButtonText: t('buttons.ok'),
          confirmButtonColor: '#d33',
        });
      } finally {
        setSendingEmail(false);
      }
    };

    useEffect(() => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString()); // Format as MM/DD/YYYY or based on locale
      setCurrentTime(now.toLocaleTimeString()); // Format as HH:MM:SS AM/PM or based on locale

      // Trigger width animation after a short delay
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 100);

      return () => clearTimeout(timer);
    }, []);

    // Debug logging - moved to useEffect to prevent repeated logging
    useEffect(() => {
      console.log('HealthSummaryPage Debug Info:');
      console.log('- Screen width:', window.innerWidth);
      console.log('- userData:', userData);
      console.log('- userData.UserName:', userData?.UserName);
      console.log('- userData.FullName:', userData?.FullName);
      console.log('- Combined name result:', combineName(userData?.FullName));
      console.log('- Patient object:', patient);
      console.log('- Latest result:', latestResult);
      //console.log('recomend:',recommendation);
    }, []); // Empty dependency array - only log once on mount
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`${isArabic ? 'rtl' : 'ltr'} max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-y-auto p-0 border-0`}>
          <div className={`p-2 sm:p-4 lg:p-6 ${isAnimating ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}>
            <div className="bg-white rounded-[20px] sm:rounded-[25px] lg:rounded-[30px] p-3 sm:p-4 md:p-6 lg:p-8 shadow-xl">
              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-medium text-blue-500 text-center mb-3 sm:mb-4 md:mb-6">
                {t('healthSummary.title')}
              </h1>

              {/* Patient Info */}
              <div className="bg-blue-50 rounded-[15px] sm:rounded-[20px] lg:rounded-[25px] px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 mb-3 sm:mb-4 md:mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base md:text-lg lg:text-xl font-normal text-gray-700">{t('healthSummary.name')}:</span>
                    <span className="text-xs sm:text-sm md:text-base lg:text-lg font-medium">{patient.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base md:text-lg lg:text-xl font-normal text-gray-700">{t('healthSummary.age')}:</span>
                    <span className="text-xs sm:text-sm md:text-base lg:text-lg font-medium">{patient.age}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base md:text-lg lg:text-xl font-normal text-gray-700">{t('healthSummary.gender')}:</span>
                    <span className="text-xs sm:text-sm md:text-base lg:text-lg font-medium">{patient.gender}</span>
                  </div>
                </div>
              </div>

              {/* Vital Signs Table */}
              <div className="mb-3 sm:mb-4 md:mb-6 overflow-x-auto">
                <div className="w-full min-w-[500px] lg:min-w-full">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-50 rounded-t-2xl">
                        <th className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-2 sm:px-4 lg:px-6 py-2 text-sm sm:text-base md:text-lg lg:text-xl font-normal`}>{t('healthSummary.vitalSigns')}</th>
                        <th className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-2 sm:px-4 lg:px-6 py-2 text-sm sm:text-base md:text-lg lg:text-xl font-normal`}>{t('common.value')}</th>
                        <th className={`hidden md:table-cell ${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-2 sm:px-4 lg:px-6 py-2 text-sm sm:text-base md:text-lg lg:text-xl font-normal`}>{t('common.normalRange')}</th>
                        <th className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-2 sm:px-4 lg:px-6 py-2 text-sm sm:text-base md:text-lg lg:text-xl font-normal`}>{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitalSigns.map((vital, index) => (
                        <tr key={index} className="border-b-2 border-blue-50">
                          <td className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-2 sm:px-4 lg:px-6 py-2 text-xs sm:text-sm md:text-base`}>{vital.name}</td>
                          <td className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-2 sm:px-4 lg:px-6 py-2 text-xs sm:text-sm md:text-base`}>{vital.value}</td>
                          <td className={`hidden md:table-cell ${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-2 sm:px-4 lg:px-6 py-2 text-xs sm:text-sm md:text-base`}>{vital.normalRange}</td>
                          <td className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-2 sm:px-4 lg:px-6 py-2 text-xs sm:text-sm md:text-base ${getStatusStyle(vital.status)}`}>
                            <div className="flex flex-col">
                              <span>{vital.status}</span>
                              <span className="text-xs text-gray-500 md:hidden">({vital.normalRange})</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reported Symptoms */}
              <div className="mb-3 sm:mb-4 md:mb-6">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <span className="text-base sm:text-lg md:text-xl font-normal">{t('healthSummary.reportedSymptoms')}</span>
                  <div className="flex flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
                    {symptoms.length > 0 ? symptoms.map((symptom, index) => (
                      <div key={index} className="px-2 sm:px-3 py-1 bg-blue-50 rounded-2xl">
                        <span className="text-xs sm:text-sm md:text-base lg:text-lg">{symptom}</span>
                      </div>
                    )) : (
                      <div className="px-2 sm:px-3 py-1 bg-gray-50 rounded-2xl">
                        <span className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-500">{t('healthSummary.noSymptomsReported')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start">
                {/* QR Code Section */}
                <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <QRCode value={`${hostUrl}/health-summary?clientId=${userId}`} size={56} className="sm:w-16 sm:h-16 lg:w-20 lg:h-20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium mb-1">{t('healthSummary.scanToViewMobile')}</h3>
                    <p className="text-xs sm:text-sm md:text-base mb-1">{t('healthSummary.accessAnywhere')}</p>
                    <div className="text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row sm:gap-4">
                      <span className="truncate">{t('healthSummary.date')} {timestamp.date}</span>
                      <span className="truncate">{t('healthSummary.time')} {timestamp.time}</span>
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="flex-1 px-3 sm:px-4 py-3 bg-blue-50 rounded-[15px] sm:rounded-[20px] lg:rounded-tr-[25px] lg:rounded-br-[25px] border-l-2 border-blue-400 w-full lg:w-auto min-w-0">
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium mb-1">{t('healthSummary.importantNoticeTitle')}</h3>
                  <p className="text-xs sm:text-sm md:text-base">
                    {t('healthSummary.importantNotice')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-3 sm:mt-4 md:mt-6">
                <button 
                  onClick={(e) => sendSummaryByEmail(e)}
                  disabled={sendingEmail}
                  aria-busy={sendingEmail}
                  className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-gradient-to-l from-blue-600 to-blue-400 text-white rounded-2xl flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {sendingEmail ? (
                    <>
                      <span className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span className="text-sm sm:text-base lg:text-lg">{t('buttons.loading')}</span>
                    </>
                  ) : (
                    <span className="text-sm sm:text-base lg:text-lg">{t('healthSummary.sendResultsToEmail')}</span>
                  )}
                </button>
                
                {/* Close Button with Timer */}
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-2xl transition-colors duration-200 w-full sm:w-auto text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">
                    {t('common.close')} ({timer}s)
                  </span>
                </button>
              </div>


            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  });

  export default HealthSummaryPage;
