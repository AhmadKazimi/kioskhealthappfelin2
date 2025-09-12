/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation"; 
import WelcomeScreen from "@/components/welcome-screen";
import PersonalInfoScreen from "@/components/personal-info-screen";
import UserInfoScreen from "@/components/user-info-screen";
import FaceScanScreen from "@/components/face-scan-screen";
import FaceScanResult from "@/components/face-scan-result";
import ComplaintScreen from "@/components/complaint-screen";
import ClientAssessment from "@/components/client-assessment"; 
import KioskLayout from "@/components/kiosk-layout";
import NewPersonalInfoScreen from "./New pages/Newpersonal-info-screen";
import NewLayout from "./New pages/NewLayout";
import HealthSummaryPage from "./New pages/health-summary-page";
import { ClientModel } from "@/payload-types";
//import UserData 

export type UserData = {
  id: number,
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    consent: boolean;
    agree:boolean;
    nationalityId: string | number;
  } | null;
  age: string;
  gender: string;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    hrvSdnnMs: number;
    breathingRate: number; 
    temperature: number;
    oxygenSaturation: number;
    systolicBP: number;
    diastolicBP: number;
  } | null;
  complaint: string;
};

export default function HomeScreen() {
  const searchParams = useSearchParams(); 
  const isChecked = searchParams.get("ischecked") === "true"; 
  const stepParam = searchParams.get("step");

  const [step, setStep] = useState(0); 
  const [userData, setUserData] = useState<UserData>({
    id: 0,
    personalInfo: null,
    age: "",
    gender: "",
    vitals: null,
    complaint: "",
  });

  // Set initial step to 4 if isChecked is true
  useEffect(() => {
    if (isChecked) { 
      setStep(4);
    }
 
    if(stepParam)
      setStep(parseInt(stepParam));

  }, [isChecked, stepParam]);

  const nextStep = (apiData?: ClientModel | null) => {
    // We don't need to store apiData anymore since we use session storage
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const updateUserData = (data: Partial<UserData>) => {
    setUserData({ ...userData, ...data });
  }; 

  const renderStepForDesktop = () => { 
    switch (step) {
      case 0:
        return <WelcomeScreen onNext={nextStep} />;
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
        return (
      
          <NewLayout 
            userData={userData}
            updateUserData={updateUserData}
            onNext={nextStep}
            onPrev={prevStep}
            currentStep={step}
            totalSteps={6}
          />
  
        );
        case 7:
          // Get client data from session storage
          const sessionClientData = sessionStorage.getItem('clientData');
          const clientData = sessionClientData ? JSON.parse(sessionClientData) : null;
          
          return (
            <HealthSummaryPage
              isOpen={true}
              onClose={prevStep}
              userData={clientData || {
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
              }}
            />
          );
      // case 6:
      //   return <ChatbotScreen userData={userData} onReset={() => setStep(0)} />;
      default:
        return <WelcomeScreen onNext={nextStep} />;
    }
  };
 
  return (
    <KioskLayout currentStep={step} totalSteps={7}>
      <div className="hidden md:block">
        {renderStepForDesktop()}
      </div>
      <div className="block md:hidden">
      <NewLayout 
            userData={userData}
            updateUserData={updateUserData}
            onNext={nextStep}
            onPrev={prevStep}
            currentStep={step}
            totalSteps={7}
          />    
            </div>
    </KioskLayout>
  );
}
