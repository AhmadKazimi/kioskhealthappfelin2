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
  import { useRouter } from "next/navigation";

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

  export default function HealthSummaryPage({
    isOpen,
    onClose,
    userData,
    //recommendation
  }: HealthSummaryModalProps) { 
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const [latestResult, setLatestResult] = useState<HealthData | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [timer, setTimer] = useState(30); // 10 seconds countdown 
    const [isTimerActive, setIsTimerActive] = useState(true);
    const [sendingEmail, setSendingEmail] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const hostUrl = process.env.NEXT_PUBLIC_HOST_DOMAIN;
    const userId = Cookies.get('userId');

    // Check if current language is Arabic
    const isArabic = i18n.language === 'ar';

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

  // Create patient object from userData with better fallback handling
  const patient = {
    name: combineName(
      userData?.FullName,
      userData?.UserName
    ),
    age: userData?.Age || "N/A", 
    gender: userData?.Gender || "N/A"
  };

    // Create vital signs array from latestResult
    const vitalSigns = latestResult ? [
      {
        name: t('faceScan.vitals.heartRate'),
        value: `${latestResult.HeartRate10s || "N/A"} ${t('fastScan.units.bpm')}`,
        normalRange: `60-100 ${t('fastScan.units.bpm')}`,
        status: latestResult.HeartRate10s && latestResult.HeartRate10s >= 60 && latestResult.HeartRate10s <= 100 ? t('healthSummary.normal') : t('healthSummary.abnormal')
      },
      {
        name: t('faceScan.vitals.bloodPressure'),
        value: `${latestResult.SystolicBloodPressureMmhg || "N/A"}/${latestResult.DiastolicBloodPressureMmhg || "N/A"} ${t('fastScan.units.mmhg')}`,
        normalRange: `<120/<80 ${t('fastScan.units.mmhg')}`,
        status: latestResult.SystolicBloodPressureMmhg && latestResult.SystolicBloodPressureMmhg < 120 && latestResult.DiastolicBloodPressureMmhg && latestResult.DiastolicBloodPressureMmhg < 80 ? t('healthSummary.normal') : t('healthSummary.abnormal')
      },
      {
        name: t('faceScan.vitals.heartRateVariability'),
        value: `${latestResult.HrvSdnnMs || "N/A"} ${t('fastScan.units.ms')}`,
        normalRange: `20-100 ${t('fastScan.units.ms')}`,
        status: latestResult.HrvSdnnMs && latestResult.HrvSdnnMs >= 20 && latestResult.HrvSdnnMs <= 100 ? t('healthSummary.normal') : t('healthSummary.abnormal')
      },
      {
        name: t('faceScan.vitals.respirationRate'),
        value: `${latestResult.BreathingRate || "N/A"} ${t('healthSummary.breathingRateUnit')}`,
        normalRange: `12-20 ${t('healthSummary.breathingRateUnit')}`,
        status: latestResult.BreathingRate && latestResult.BreathingRate >= 12 && latestResult.BreathingRate <= 20 ? t('healthSummary.normal') : t('healthSummary.abnormal')
      }
    ] : [];

    // Create symptoms array from userData.HealthConcern
    const symptoms = userData.HealthConcern ? 
      userData.HealthConcern.split(/[,;]|\band\b/i).map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'nothing') : 
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
      // Force refresh by using window.location.href
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
        // Force refresh and navigate to home
        setIsTimerActive(false);
        onClose();
        // Force refresh by using window.location.href
        window.location.href = '/';
      }
    }, [timer, isTimerActive, onClose]);

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
            text: t('healthSummary.emailMissing'),
          });
          return;
        }
        setSendingEmail(true);
        const response = await fetch(`${apiUrl}/email/SendMedicalReport`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
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
              heartRate: latestResult?.HeartRate10s || "N/A",
              bloodPressure: latestResult ? `${latestResult.SystolicBloodPressureMmhg}/${latestResult.DiastolicBloodPressureMmhg}` : "N/A",
              heartRateVariability: latestResult?.HrvSdnnMs || "N/A",
              respirationRate: latestResult?.BreathingRate || "N/A",
              reportedSymptoms: translateSymptoms(userData.HealthConcern) || t('healthSummary.noSymptomsReported')
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
      } finally {
        setSendingEmail(false);
      }
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

      // Trigger width animation after a short delay
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 100);

      return () => clearTimeout(timer);
    }, [apiUrl, userId]);

    console.log('HealthSummaryPage Debug Info:');
    console.log('- Screen width:', window.innerWidth);
    console.log('- userData:', userData);
    console.log('- userData.UserName:', userData?.UserName);
    console.log('- userData.FullName:', userData?.FullName);
    console.log('- Combined name result:', combineName(userData?.FullName));
    console.log('- Patient object:', patient);
    console.log('- Latest result:', latestResult);
    //console.log('recomend:',recommendation);
    
    return (
      <div className="flex justify-center items-start min-h-screen p-2 sm:p-4 lg:p-6"> 
        <div className={`border-0 ${isArabic ? 'rtl' : 'ltr'} transition-all duration-1000 ease-out overflow-x-hidden w-full max-w-7xl ${
          isAnimating ? 'w-full' : 'w-full'
        }`}>
          <div className={`p-2 sm:p-4 lg:p-6 h-full overflow-y-auto ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
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
        </div>
      </div>
    );
  }
