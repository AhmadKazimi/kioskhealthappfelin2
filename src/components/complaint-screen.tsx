/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UserData } from "./home-screen";
import Cookies from 'js-cookie';
import { ClientModel } from "@/payload-types";
import HealthSummaryModal from "./health-summary-modal";
import { ArrowLeft } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import HealthSummaryPage from "./New pages/health-summary-page";

interface ComplaintScreenProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onNext: (apiData?: ClientModel | null) => void;
  onPrev: () => void;
  apiData?: ClientModel | null; // Made optional
  setApiData?: React.Dispatch<React.SetStateAction<ClientModel | null>>; // Made optional
}

export default function ComplaintScreen({
  userData,
  updateUserData,
  onNext,
  onPrev,
  apiData = null, // Default value
  setApiData = () => {}, // Default empty function
}: ComplaintScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [isLoading, setIsLoading] = useState(false); 
  const [showSummary, setShowSummary] = useState(false);
  const [localApiData, setLocalApiData] = useState<ClientModel | null>(apiData); // Local state fallback
  const [isError, setIsError] = useState(false);
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
  
  // New state for "Other" functionality
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherComplaint, setOtherComplaint] = useState("");
  const [otherComplaintError, setOtherComplaintError] = useState("");



  const commonComplaints = [
    { key: 'headache', value: 'Headache' },
    { key: 'fever', value: 'Fever' },
    { key: 'cough', value: 'Cough' },
    { key: 'soreThroat', value: 'Sore Throat' },
    { key: 'stomachPain', value: 'Stomach Pain' },
    { key: 'backPain', value: 'Back Pain' },
    { key: 'dizziness', value: 'Dizziness' },
    { key: 'fatigue', value: 'Fatigue' },
    { key: 'nausea', value: 'Nausea' },
    { key: 'shortnessOfBreath', value: 'Shortness of Breath' },
    { key: 'chestPain', value: 'Chest Pain' },
    { key: 'other', value: 'Other' },
  ];
  
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Unified function to update API data
  const updateApiData = (data: ClientModel | null) => {
    if (setApiData) {
      setApiData(data);
    }
    setLocalApiData(data);
  };

  // Updated toggleComplaint function to handle "Other" specially
  const toggleComplaint = (complaintValue: string) => {
    if (complaintValue === "other") {
      if (selectedComplaints.includes("other")) {
        // Remove "other" and hide input
        setSelectedComplaints(prev => prev.filter(item => item !== "other"));
        setShowOtherInput(false);
        setOtherComplaint("");
        setOtherComplaintError("");
      } else {
        // Add "other" and show input
        setSelectedComplaints(prev => [...prev, "other"]);
        setShowOtherInput(true);
      }
    } else {
      setSelectedComplaints(prev => {
        if (prev.includes(complaintValue)) {
          return prev.filter(item => item !== complaintValue);
        } else {
          return [...prev, complaintValue];
        }
      });
    }
  };

  // Validation function for "Other" input
  const validateOtherComplaint = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length > 10) {
      setOtherComplaintError(t('complaint.validation.maxWords'));
      return false;
    }
    setOtherComplaintError("");
    return true;
  };

  // Handle "Other" input change
  const handleOtherComplaintChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherComplaint(value);
    validateOtherComplaint(value);
  };



  // Get final complaints list including custom "other" text
  const getFinalComplaintsList = () => {
    const complaints = selectedComplaints.filter(item => item !== "other");
    if (selectedComplaints.includes("other") && otherComplaint.trim()) {
      complaints.push(otherComplaint.trim());
    }
    return complaints;
  };

  const handleNext = async () => {
    const userId = Cookies.get('userId');
    
    // Validate "other" input if it's selected
    if (selectedComplaints.includes("other") && !validateOtherComplaint(otherComplaint)) {
      return;
    }
    
    if (selectedComplaints.includes("other") && !otherComplaint.trim()) {
      setOtherComplaintError(t('complaint.validation.required'));
      return;
    }

    const complaintsString = getFinalComplaintsList().join(", ");

    try {
      setIsLoading(true); 
      await submitSymptoms(complaintsString);
      onNext();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleShowSummary = async () => {
    // Validate "other" input if it's selected
    if (selectedComplaints.includes("other") && !validateOtherComplaint(otherComplaint)) {
      return;
    }
    
    if (selectedComplaints.includes("other") && !otherComplaint.trim()) {
      setOtherComplaintError(t('complaint.validation.required'));
      return;
    }

    const complaintsString = getFinalComplaintsList().join(", ");
    const updated = await submitSymptoms(complaintsString);
    // Navigate to next step and pass the freshest api data
    onNext(updated);
    
  };

  const submitSymptoms = async (complaintsString: string): Promise<ClientModel | null> => {
    const userId = Cookies.get('userId');

    try {
      setIsLoading(true); 
      updateUserData({ complaint: complaintsString });

      // Update both local and parent state
      const updatedData = {
        ...(localApiData || {}),
        HealthConcern: complaintsString
      } as ClientModel;
      
      updateApiData(updatedData);

      // Save updated data to session storage
      sessionStorage.setItem('clientData', JSON.stringify(updatedData));

      const req = await fetch(`${apiUrl}/client/EditClientHealthConcern`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          healthConcern: complaintsString,
        }),
      }); 
      
      if (!req.ok) {
        throw new Error("Failed to update health concerns");
      }
      return updatedData;
    } catch (err) {
      console.error(err);
      throw err; // Re-throw to handle in calling functions
    } finally {
      setIsLoading(false);
    } 
  };

  useEffect(() => { 
    const fetchData = async () => {
      try {
        setIsLoading(true); 
        const userId = Cookies.get('userId');

        const response = await fetch(`${apiUrl}/client/GetClient?id=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        const responseJson = await response.json();
        if (!responseJson.IsSuccess) {
          throw new Error("Failed to fetch data");
        }
 
        const data: ClientModel = responseJson.Result;

        updateApiData(data);
        setIsError(false);

        if (data.HealthConcern) {
          const complaints = data.HealthConcern.split(',').map(s => s.trim());
          console.log('🔍 Raw HealthConcern from API:', data.HealthConcern);
          console.log('🔍 Parsed complaints:', complaints);
          
          // Check if there's a custom complaint that's not in the predefined list
          const predefinedValues = commonComplaints.map(c => c.value);
          const predefinedKeys = commonComplaints.map(c => c.key);
          
          // Map stored values to keys for proper selection
          const mappedComplaints = complaints.map(complaint => {
            // First try to find by value (exact match)
            const foundByValue = commonComplaints.find(c => c.value === complaint);
            if (foundByValue) return foundByValue.key;
            
            // Then try to find by key (in case keys are stored)
            const foundByKey = commonComplaints.find(c => c.key === complaint);
            if (foundByKey) return foundByKey.key;
            
            // If not found in predefined list, it's a custom complaint
            return complaint;
          });
          
          console.log('🔍 Mapped complaints:', mappedComplaints);
          
          // Separate predefined and custom complaints
          const predefinedSelectedComplaints = mappedComplaints.filter(c => predefinedKeys.includes(c));
          const customComplaints = mappedComplaints.filter(c => !predefinedKeys.includes(c));
          
          console.log('🔍 Predefined selected:', predefinedSelectedComplaints);
          console.log('🔍 Custom complaints:', customComplaints);
          
          if (customComplaints.length > 0) {
            // If there are custom complaints, add "other" to selection and set the first custom complaint
            setSelectedComplaints([...predefinedSelectedComplaints, "other"]);
            setOtherComplaint(customComplaints[0]);
            setShowOtherInput(true);
            console.log('🔍 Final selection with other:', [...predefinedSelectedComplaints, "other"]);
          } else {
            setSelectedComplaints(predefinedSelectedComplaints);
            console.log('🔍 Final selection without other:', predefinedSelectedComplaints);
          }
        } else {
          console.log('🔍 No HealthConcern data found, keeping empty selection');
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (!localApiData) { // Only fetch if we don't have data
      fetchData();
    }
  }, [apiUrl]); // Removed setApiData from dependencies

  return (
    <div className="flex flex-col space-y-2 w-full h-full justify-between items-center p-10">
      <div className="text-center">
        <h2 className="text-2xl sm:text-4xl font-bold text-blue-700 mb-2">
          {t('complaint.title')}
        </h2>
        <p className="text-sm sm:text-xl text-gray-600 mb-2">
        {t('complaint.subtitle1')} <span className="text-sm text-gray-600">({t('complaint.subtitle2')})</span>
        </p>
      </div>

      <div>
        <div className="flex flex-wrap justify-center items-start gap-4">
          {commonComplaints.map((complaint) => (
            <div 
              key={complaint.key} 
              onClick={() => toggleComplaint(complaint.key)} 
              className={`flex justify-between items-center px-3 sm:px-6 py-2 sm:py-4 rounded-2xl text-3xl shadow-[0px_4px_10px_0px_rgba(64,126,255,0.20)] cursor-pointer transition-all duration-200 ${
                selectedComplaints.includes(complaint.key) 
                  ? 'bg-[#407EFF] text-white border-2 border-blue-500' 
                  : 'bg-white hover:bg-gray-50 border-2 border-gray-200'
              }`}
              style={{
                boxShadow: '0 4px 10px 0 rgba(64, 126, 255, 0.20)'
              }}
            > 
              <p className={`text-sm sm:text-base ${
                selectedComplaints.includes(complaint.key) 
                  ? 'text-white' 
                  : 'text-gray-600'
              }`}>
                {t(`complaint.symptoms.${complaint.key}`)}
              </p>
            </div>  
          ))}
        </div>
        
        {/* "Other" input field */}
        {showOtherInput && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="block text-lg font-medium text-gray-700 mb-2">
              {t('complaint.other.label')}
            </label>
            <Input
              type="text"
              value={otherComplaint}
              onChange={handleOtherComplaintChange}
              placeholder={t('complaint.other.placeholder')}
              className={`text-lg p-3 ${otherComplaintError ? 'border-red-500' : ''}`}
              maxLength={100}
              autoComplete="off"
            />
            {otherComplaintError && (
              <p className="text-red-500 text-sm mt-1">{otherComplaintError}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {t('complaint.other.hint')}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between w-full pt-2">
        <button 
                onClick={onPrev} 
                                className={`cursor-pointer   group relative flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3 
                         text-sm md:text-base font-medium text-gray-600 bg-white/80 backdrop-blur-sm
                         border-2 border-gray-300 rounded-xl shadow-sm
                         transition-all duration-300 ease-out
                         hover:border-[#407EFF] hover:text-[#407EFF] hover:bg-white hover:shadow-md
                         focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20
                         active:scale-[0.98]`}
              >
                {isArabic ? (
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                ) : (
                  <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
                )}
                <span>{t('buttons.back')}</span>
              </button>

          <button 
                type="button"
                onClick={handleShowSummary} 
                disabled={isLoading}
                className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3
                         text-sm md:text-base font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                         rounded-xl shadow-lg
                         transition-all duration-300 ease-out
                         hover:shadow-xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                         focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                         active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('buttons.loading')}</span>
                  </div>
                ) : (
                  <>
                    <span>{t('buttons.next')}</span>
                    {isArabic ? (
                      <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
                    ) : (
                      <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </>
                )}
              </button>
        </div>
                


    </div>
  );
}