import { UserData } from "../home-screen";
import NewPersonalInfoScreen from "./Newpersonal-info-screen";
import LeftSection from "./LeftSection";
import MiddleSection from "./MiddleSection";
import RightSection from "./RightSection";
import UserInfoScreen from "../user-info-screen";
// import FaceScanScreen from "../face-scan-screen";
import FaceScanResult from "../face-scan-result";
import ClientAssessment from "../client-assessment";
import ComplaintScreen from "../complaint-screen";
import WelcomeScreen from "../welcome-screen";
import BeforeScanning from "./beforeScanning";
import HealthSummaryPage from "./health-summary-page";
import { ClientModel } from "@/payload-types";
import React, { useState } from "react";
import ProgressTracker, { ProgressTrackerRef } from "../ProgressTracker";
import { useTranslation } from "@/hooks/useTranslation";
// NEW: Import fingerprint scan components
import { ScanTypeSelection } from "../scan-type-selection";
import { BeforeFingerprintScanning } from "./beforeFingerprintScanning";
import { FingerprintScanScreen } from "../fingerprint-scan-screen";

interface NewLayoutProps {
    userData: UserData;
    updateUserData: (data: Partial<UserData>) => void;
    onNext: () => void;
    onPrev: () => void;
    currentStep?: number;
    totalSteps?: number;
    localApiData?: ClientModel | null;
}

export default function NewLayout({
    userData,
    updateUserData,
    onNext,
    onPrev,
    currentStep = 1,
    totalSteps = 6, // Updated from 7 to 6 (removed old step 4 FaceScanResult)
    //localApiData = null
}: NewLayoutProps) {
    const [storedApiData, setStoredApiData] = useState<ClientModel | null>(null);
    const progressTrackerRef = React.useRef<ProgressTrackerRef>(null);
    const { t, i18n } = useTranslation();
    // NEW: Track selected scan type
    const [scanType, setScanType] = useState<'face' | 'fingerprint' | null>(null);
    const [scanSubStep, setScanSubStep] = useState<'selection' | 'instructions' | 'scanning' | 'results'>('selection');
    
    // Load client data from sessionStorage on mount or when step changes to 6 (Health Summary)
    React.useEffect(() => {
        if (currentStep === 6 && !storedApiData) {
            const sessionClientData = sessionStorage.getItem('clientData');
            console.log('NewLayout - sessionStorage clientData:', sessionClientData);
            if (sessionClientData) {
                try {
                    const clientData = JSON.parse(sessionClientData);
                    console.log('NewLayout - parsed clientData:', clientData);
                    setStoredApiData(clientData);
                } catch (error) {
                    console.error('Error parsing session client data:', error);
                }
            } else {
                console.log('NewLayout - No session data found');
            }
        }
    }, [currentStep, storedApiData]);

    // NEW: Reset scan state when entering/leaving step 3
    React.useEffect(() => {
        if (currentStep === 3) {
            setScanSubStep('selection');
            setScanType(null);
        }
    }, [currentStep]);
    
    const nextStep = (apiData?: ClientModel | null) => {
        // Check if apiData is actually a valid ClientModel object and not an event or HTML element
        if (apiData && typeof apiData === 'object' && 
            !('nativeEvent' in apiData) && // Not an event
            !('nodeType' in apiData) && // Not a DOM element
            ('Id' in apiData || 'UserName' in apiData || 'Email' in apiData)) { // Has expected ClientModel properties
            
            setStoredApiData(apiData);
            // Also save to sessionStorage for persistence
            try {
                sessionStorage.setItem('clientData', JSON.stringify(apiData));
            } catch (error) {
                console.error('Error saving to sessionStorage:', error);
            }
        }
        onNext(); 
    };

    const prevStep = () => {
        onPrev();
    };

    const handleStepChange = (newStep: number) => {
        // Only update if the step is different and within valid range
        if (newStep !== currentStep && newStep >= 1 && newStep <= totalSteps) {
            // Let the parent component handle the step change
            if (newStep > currentStep) {
                onNext();
            } else if (newStep < currentStep) {
                onPrev();
            }
        }
    };

    const renderStep = () => { 
        switch (currentStep) {
          case 1:
            return (
              <NewPersonalInfoScreen
                userData={userData}
                updateUserData={updateUserData}
                onNext={nextStep}
                onPrev={prevStep}
              /> 
            );
          case 2:
            return (
              <UserInfoScreen
                userData={userData}
                updateUserData={updateUserData}
                onNext={nextStep}
                onPrev={prevStep}
              />
            );
          case 3:
            // NEW: Multi-step scanning flow (selection → instructions → scanning)
            if (scanSubStep === 'selection') {
              return (
                <ScanTypeSelection
                  onSelectScanType={(type) => {
                    setScanType(type);
                    setScanSubStep('instructions');
                  }}
                  onBack={prevStep}
                />
              );
            } else if (scanSubStep === 'instructions') {
              if (scanType === 'face') {
                return (
                  <BeforeScanning
                    onNext={() => setScanSubStep('scanning')}
                    onPrev={() => setScanSubStep('selection')}
                  />
                );
              } else if (scanType === 'fingerprint') {
                return (
                  <BeforeFingerprintScanning
                    onStart={() => setScanSubStep('scanning')}
                    onBack={() => setScanSubStep('selection')}
                  />
                );
              }
            } else if (scanSubStep === 'scanning') {
              if (scanType === 'face') {
                // Face scan does actual scanning, then shows results in FaceScanResult component
                return (
                  <FaceScanResult
                    userData={userData}
                    updateUserData={updateUserData}
                    onNext={nextStep}
                    onPrev={() => setScanSubStep('instructions')}
                  />
                );
              } else if (scanType === 'fingerprint') {
                // Fingerprint scan - show the scanning screen
                return (
                  <FingerprintScanScreen
                    userId={String(userData.id || '0')}
                    userEmail={userData.personalInfo?.email || ''}
                    userAge={parseInt(userData.age) || 25}
                    userGender={(userData.gender?.toLowerCase() === 'male' ? 'male' : 'female') as 'male' | 'female'}
                    onBack={() => setScanSubStep('instructions')}
                    onNext={() => setScanSubStep('results')}
                  />
                );
              }
            } else if (scanSubStep === 'results') {
              // Show results page after fingerprint scanning is complete
              return (
                <FaceScanResult
                  userData={userData}
                  updateUserData={updateUserData}
                  onNext={nextStep}
                  onPrev={() => setScanSubStep('scanning')}
                />
              );
            }
            // Fallback to scan type selection if something goes wrong
            return (
              <ScanTypeSelection
                onSelectScanType={(type) => {
                  setScanType(type);
                  setScanSubStep('instructions');
                }}
                onBack={prevStep}
              />
            );

            case 4:
            // Step 4 is now Complaints (moved from step 5)
            return (
              <ComplaintScreen
                userData={userData}
                updateUserData={updateUserData}
                onNext={nextStep}
                onPrev={prevStep}
              />
            );
            case 5:
            // Step 5 is now Client Assessment (moved from step 6)
            return (
              <ClientAssessment onNext={nextStep} onPrev={prevStep}/>
            );
            case 6:
            // Step 6 is now Health Summary (moved from step 7)
            console.log('NewLayout - Step 6 (Health Summary) Debug:');
            console.log('- storedApiData:', storedApiData);
            console.log('- userData:', userData);
            console.log('- Screen width:', window.innerWidth);
            
            // Use sessionStorage data if available, otherwise fall back to userData
            const finalUserData = storedApiData || {
              Id: userData.id || 0,
              UserName: userData.personalInfo?.fullName || "",
              Email: userData.personalInfo?.email || "",
              FullName: userData.personalInfo?.fullName || "",
              Phone: userData.personalInfo?.phone || "",
              NationalityId: String(userData.personalInfo?.nationalityId || ""),
              HealthConcern: userData.complaint || "",
              Age: userData.age || "",
              Gender: userData.gender || "",
              HeartRate: userData.vitals?.heartRate || 0,
              BloodPressure: userData.vitals?.bloodPressure || "",
              Temperature: userData.vitals?.temperature || 0,
              OxygonSaturation: String(userData.vitals?.oxygenSaturation || ""),
              ReportedSymptoms: userData.complaint || "",
            };
            
            console.log('- finalUserData:', finalUserData);
            
            return (
              <HealthSummaryPage
                isOpen={true}
                onClose={() => {
                  // Don't redirect automatically after email is sent
                  // setStoredApiData(null);
                  // window.location.href = '/';
                  console.log('Health summary closed - not redirecting');
                }}
                userData={finalUserData}
              />
            );
          default:
            return <WelcomeScreen onNext={() => nextStep()} />;
        }
    };
    const renderRightSectionData = () => {
      const isEnglish = i18n.language === 'en';

      switch (currentStep) {
        case 1:
          return {
            title: t('progress.personalInformationDescription'),
            description: "Carevision",
            image: isEnglish ? "/video/en_tellusaboutyourself2.mp4" : "/video/tellusaboutyourself2.mp4",
            className:''
          };
        case 2:
          return {
            title: t('progress.ageAndGenderDescription'),
            description: "Carevision",
            image: isEnglish ? "/video/en_ageandgender2.mp4" : "/video/ageandgender2.mp4",
            className:''
          };
        case 3:
          return {
            title: t('progress.faceScanDescription'),
            description: "Carevision",
            image: isEnglish ? "/video/en_facescan.mp4" : "/video/facescan.mp4",

          };
        case 4:
          // Step 4 is now Complaints
          return {
            title: t('complaint.subtitle1'),
            description: "Carevision",
            image: isEnglish ? "/video/en_qastion.mp4" : "/video/qastion.mp4",
            className:''
          };
        case 5:
          // Step 5 is now Client Assessment
          return {
            title: t('progress.symptomsDescription'),
            description: "Carevision",
            image: isEnglish ? "/video/en_answer.mp4" : "/video/answer.mp4",
            className:''
          };
        case 6:
          // Step 6 is now Health Summary
          return {
            title: t('progress.healthAssessmentSummary'),
            description: "Carevision",
            image: isEnglish ? "/video/en_qastion.mp4" : "/video/qastion.mp4",
            className:''
          };
        default:
          return {
            title: t('progress.welcome'),
            description: "Carevision",
            image: isEnglish ? "/video/en_tellusaboutyourself2.mp4" : "/video/tellusaboutyourself2.mp4"
          };
      }
    };
    return (
      <>
      {/* Mobile View (up to md breakpoint) */}
      <div className="block md:hidden h-full w-full bg-white rounded-t-3xl">
      {currentStep >= 1 && currentStep <= 5 && (
        <ProgressTracker
          ref={progressTrackerRef}
          initialStep={currentStep}
          className="flex flex-row justify-center items-center"
          onStepChange={handleStepChange}
          showNavigationButtons={false}
          disabled={false}
        />
        )}
        <div className={`${currentStep === 6 ? 'h-full' : ''} w-full`}>
          {renderStep()}
        </div>
      </div>

      {/* Tablet View (md to lg breakpoint: 768px-1023px) */}
      <div className="hidden md:block lg:hidden h-full w-full bg-white rounded-t-3xl">
        {currentStep >= 1 && currentStep <= 5 && (
          <ProgressTracker
            ref={progressTrackerRef}
            initialStep={currentStep}
            className="flex flex-row justify-center items-center"
            onStepChange={handleStepChange}
            showNavigationButtons={false}
            disabled={false}
          />
        )}
        <div className={`${currentStep === 6 ? 'h-full' : ''} w-full`}>
          {renderStep()}
        </div>
      </div>
      
      {/* Desktop View (lg and up: 1024px+) */}
      <div className="hidden lg:block">
        <div className="relative hidden lg:flex z-50 w-full h-[80vh] items-start justify-center gap-2 xl:gap-[24px]" style={{zIndex: 50}}>
            <div className="flex-1 w-full h-full flex items-start justify-center min-w-0">
                <LeftSection 
                    currentStep={currentStep}
                    onStepChange={handleStepChange}
                    onNext={nextStep}
                    onPrev={prevStep}
                    showNavigationButtons={false}
                />
            </div>
            <div className="flex-2 w-full h-full bg-white rounded-3xl min-w-0 overflow-hidden">
                <MiddleSection>
                    {renderStep()}
                </MiddleSection>
            </div>
            <div className="flex-1 w-full h-full flex-col items-center justify-center flex min-w-0">
                    <RightSection  title={renderRightSectionData().title} description={renderRightSectionData().description} className={renderRightSectionData().className} image={renderRightSectionData().image} />
            </div>
        </div>
        </div>
        </>
    );
}