/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserData } from "../home-screen";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Globe, Mail, Phone, User } from "lucide-react";
import { UserResponse } from "@/types/user-response-type";
import { ClientModel } from "@/payload-types";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css"; 
import AgreementModal from "../agreementModal";
import Cookies from 'js-cookie';
import { useTranslation } from "@/hooks/useTranslation";
import { motion } from "framer-motion";
import CountrySelector from "../ui/country-selector";
import { Card, CardContent } from "../ui/card";
import { AspectRatio } from "../ui/aspect-ratio";



interface PersonalInfoScreenProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onNext: (clientData?: ClientModel) => void; // Allow passing ClientModel data
  onPrev: () => void;
}

export default function NewPersonalInfoScreen({
  userData,
  updateUserData,
  onNext,
  onPrev,
}: PersonalInfoScreenProps) {
  const { t, i18n } = useTranslation();


  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(
    userData.personalInfo?.fullName || ""
  );
  const [email, setEmail] = useState(userData.personalInfo?.email || "");
  const [phone, setPhone] = useState(userData.personalInfo?.phone || "");
  const [nationalityId, setNationalityId] = useState<string | number>(userData.personalInfo?.nationalityId || "");
  const [consent, setConsent] = useState(
    userData.personalInfo?.consent || false
  );
  const [agree, setAgree] = useState(false);



  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    consent: "",
    agree: "",
    nationalityId: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const [isClient, setIsClient] = useState(false);

  // Ensure component is hydrated on client side
  useEffect(() => {
    setIsClient(true);
  }, []);



  const validateEmail = (email: string) => {
    if (!email) return { isValid: true, error: "" }; // Empty is valid since it's optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: t('personalInfo.errors.invalidEmailFormat') };
    }
    return { isValid: true, error: "" };
  };

  const validatePhone = (phone: string) => {
    if (!phone) return { isValid: true, error: "" }; // Empty is valid since it's optional
    
    // Check if phone contains only digits, spaces, parentheses, hyphens, and plus sign
    const phoneRegex = /^[\+\d\s\(\)\-\s]+$/;
    if (!phoneRegex.test(phone)) {
      return { isValid: false, error: t('personalInfo.errors.invalidPhoneCharacters') };
    }
    
    // Remove all non-digit characters to check length
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      return { isValid: false, error: t('personalInfo.errors.invalidPhoneLength').replace('{digits}', digitsOnly.length.toString()) };
    }
    
    if (digitsOnly.length > 15) {
      return { isValid: false, error: t('personalInfo.errors.invalidPhoneTooLong').replace('{digits}', digitsOnly.length.toString()) };
    }
    
    return { isValid: true, error: "" };
  };

  const handleNext = async () => {
    console.log("handleNext called - button clicked!"); // Debug log
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    console.log("API URL:", apiUrl); // Debug log

    // Reset errors
    setErrors({
      fullName: "",
      email: "",
      phone: "",
      consent: "",
      agree: "",
      nationalityId: ""
    });      
    let isValid = true;
    const newErrors = {
      fullName: "",
      email: "",
      phone: "",
      consent: "",
      agree: "",
      nationalityId: ""
    };

    if (!fullName) {
      newErrors.fullName = t('personalInfo.errors.fullNameRequired');
      isValid = false;
    }

    if (!email) {
      newErrors.email = t('personalInfo.errors.emailRequired');
      isValid = false;
    }

    if (!nationalityId) {
      newErrors.nationalityId = t('personalInfo.errors.nationalityRequired');
      isValid = false;
    }

    if (email && !validateEmail(email).isValid) {
      newErrors.email = validateEmail(email).error;
      isValid = false;
    }

    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error;
        isValid = false;
      }
    }

    // Check consent if any information is provided
    if (!consent) {
      newErrors.consent = t('personalInfo.errors.consentRequired');
      isValid = false;
    }
    if (!agree) {
      newErrors.agree = t('personalInfo.errors.agreementRequired');
      isValid = false;
    }

    if (!isValid) {
      console.log("Validation failed:", newErrors); // Debug log
      setErrors(newErrors);
      return;
    }

    // Save data and proceed
    updateUserData({
      personalInfo: {
        fullName,
        email,
        phone,
        consent,
        agree,
        nationalityId
      },
    });

    try {
      setIsLoading(true);
      console.log("Making API call to:", `${apiUrl}/client/AddOrUpdateClient`); // Debug log
      // Make a POST request to the API
      const response = await fetch(`${apiUrl}/client/AddOrUpdateClient`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          username: fullName.replaceAll(" ", "").toLocaleLowerCase(),
          email,
          phone,
          password: "123456",
          nationalityId: nationalityId
        }),
      });

      const responseJson = await response.json();
      if (!responseJson.IsSuccess) {
        await Swal.fire({
          icon: "error",
          title: t('common.error'),
          text: t('common.somethingWentWrong'),
          confirmButtonColor: "#dc2626",
        });
        return;
      }

      const data: UserResponse = responseJson;  
      Cookies.set('userId', data.Result.Id, { expires: 1 }); 
      Cookies.set('clientData', JSON.stringify({  FullName: fullName,
        username: fullName,
        email,
        phone,
        nationalityId: nationalityId
      }), { expires: 1 }); 
      
      const clientData: ClientModel = {
        Id: Number(data.Result.Id),
        UserName: fullName, // Use the original fullName with spaces
        FullName: fullName, // Use the original fullName with spaces  
        Email: email,
        Phone: phone,
        NationalityId: String(nationalityId),
        HealthConcern: "",
        Age: "",
        Gender: "",
        HeartRate: 0,
        BloodPressure: "",
        Temperature: 0,
        OxygonSaturation: "",
        ReportedSymptoms: "",
      };
      
      console.log('NewPersonalInfoScreen - Passing clientData to nextStep:', clientData);
      onNext(clientData);      } catch (error) {
      console.error("Error saving personal information:", error);
      await Swal.fire({
          icon: "error",
          title: t('common.error'),
          text: t('common.somethingWentWrong'),
          confirmButtonColor: "#dc2626",
        });
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => setIsModalOpen(true); // Function to open modal
  const closeModal = () => setIsModalOpen(false); // Function to close modal

  // Check if there are any validation errors
  const hasValidationErrors = Object.values(errors).some(error => error !== "");

  return (
    <> 
    
     {/* Mobile Layout (up to 1023px) */}
<motion.div 
    className="lg:hidden flex flex-col h-full overflow-hidden"
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.3 }}
>
    <motion.div 
        className="flex-1 flex flex-col p-4 sm:p-6 h-full min-h-0"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
    >
        {/* Header - Fixed at top */}
        <motion.div 
              className="text-center flex-shrink-0 items-center justify-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
        >
            <h2 className="text-lg sm:text-xl font-bold text-[#407EFF] mb-2">
                {t('personalInfo.title')}
            </h2>
            <p className="text-gray-600 text-xs">
                {t('personalInfo.subtitle')}
            </p>
        </motion.div>

        {/* Scrollable Form Content */}
        <div className="flex-1 px-1 overflow-y-auto min-h-0">
                {/* All your form fields go here - keep them as they are */}
                <form  className="space-y-1 flex flex-col flex-1" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} onSubmit={(e) => e.preventDefault()}>
        {/* Validation Error Summary */}
        {/* Full Name */}
        <div className="space-y-1">
          <Label htmlFor="fullName" className="text-xs font-semibold text-gray-700">
            {t('personalInfo.fullName')}
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) {
                setErrors(prev => ({ ...prev, fullName: "" }));
              }
            }}
            
            placeholder={t('personalInfo.fullNamePlaceholderExample')}
            autoComplete="off"
            className={`w-full py-2 sm:py-3 px-3 sm:px-4 border rounded-lg
                       bg-white transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-[#407EFF]/20 text-xs
                       ${errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#407EFF]'}`}
          />
          {errors.fullName && (
            <p className="text-red-500 text-xs">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
            {t('personalInfo.email')}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors(prev => ({ ...prev, email: "" }));
              }
            }}
            placeholder={t('personalInfo.emailPlaceholderExample')}
            autoComplete="off"
            className={`w-full py-2 sm:py-3 px-3 sm:px-4 border rounded-lg
                       bg-white transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-[#407EFF]/20 text-xs
                       ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#407EFF]'}`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <Label htmlFor="phone" className="text-xs font-semibold text-gray-700 ">
            {t('personalInfo.phone')}
          </Label>
          <div className="relative">
            
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                const newPhoneValue = e.target.value;
                setPhone(newPhoneValue);
                // Only clear error if the input becomes valid
                if (errors.phone && (newPhoneValue === "" || validatePhone(newPhoneValue).isValid)) {
                  setErrors(prev => ({ ...prev, phone: "" }));
                }
              }}
              placeholder={t('personalInfo.phonePlaceholderExample')}
              autoComplete="off"
              className={`w-full py-2 sm:py-3  pr-3 sm:pr-4 border rounded-lg
                         bg-white transition-all duration-300 text-xs
                         focus:outline-none focus:ring-2 focus:ring-[#407EFF]/20 focus:shadow-lg
                         ${errors.phone 
                           ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                           : 'border-gray-300 focus:border-[#407EFF] hover:border-gray-400'
                         }
                         ${phone ? 'bg-blue-50/30' : 'bg-white'}`}
            />
            {phone && (
              <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center">
                <div className={`w-2 h-2 rounded-full ${validatePhone(phone).isValid ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
            )}
          </div>
          {errors.phone && (
            <motion.p 
              className="text-red-500 text-xs flex items-center gap-1 mt-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="w-3 h-3" />
              {errors.phone}
            </motion.p>
          )}
          {phone && !errors.phone && validatePhone(phone).isValid && (
            <motion.p 
              className="text-green-600 text-xs flex items-center gap-1 mt-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CheckCircle className="w-3 h-3" />
              {t('personalInfo.errors.validPhoneNumber')}
            </motion.p>
          )}
        </div>

        {/* Nationality */}
        <div className="space-y-1  mb-3">
          <Label htmlFor="nationalityId" className="text-xs font-semibold text-gray-700">
            {t('personalInfo.nationality')}
          </Label>
          <CountrySelector
            language={i18n.language as "en" | "ar"} 
            onSelect={(id) => setNationalityId(id ?? "")} 
          />
          {errors.nationalityId && (
            <p className="text-red-500 text-xs">{errors.nationalityId}</p>
          )}
        </div>

        {/* Consent Section */}
        <div className="space-y-1 flex-shrink-0">
            {/* Consent Checkbox */}
            <div className="group">
              <div 
                className="flex items-start space-x-3 p-2 md:p-3 rounded-2xl border-2 border-gray-500 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md cursor-pointer"
                onClick={() => setConsent(!consent)}
              >
                <div className="relative">
                  <div
                    className={`w-4 h-4 md:w-5 md:h-5 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md pointer-events-none flex items-center justify-center ${
                      consent 
                        ? 'bg-gradient-to-r from-[#407EFF] to-[#1E40AF] border-[#407EFF]' 
                        : 'border-gray-300 bg-white hover:border-[#407EFF]/50'
                    }`}
                  >
                    {consent && (
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <Label 
                    htmlFor="consent" 
                    className="text-sm  font-medium text-gray-700 leading-relaxed cursor-pointer block pointer-events-none"
                  >
                    {t('personalInfo.consent')}
                  </Label>
                 
                </div>
              </div>
            </div>
            {errors.consent && (
              <p className="text-red-500 text-sm mt-1">{errors.consent}</p>
            )}

            {/* Agreement Checkbox */}
            <div className="group" >
              <div 
                className="flex items-start space-x-3 p-2 md:p-3 rounded-2xl border-2 border-gray-500 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md cursor-pointer"
                onClick={(e) => {
                  // Check if click is on the "View Agreement" area
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-view-agreement]')) {
                    openModal();
                  } else {
                    setAgree(!agree);
                  }
                }}
              >
                <div className="relative">
                  <div
                    className={`w-4 h-4 md:w-5 md:h-5 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md pointer-events-none flex items-center justify-center ${
                      agree 
                        ? 'bg-gradient-to-r from-[#407EFF] to-[#1E40AF] border-[#407EFF]' 
                        : 'border-gray-300 bg-white hover:border-[#407EFF]/50'
                    }`}
                  >
                    {agree && (
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <Label 
                    htmlFor="agree" 
                    className="text-sm  font-medium text-gray-700 leading-relaxed cursor-pointer block pointer-events-none"
                  >
                    {t('personalInfo.agreement')}
                    <span 
                      className="text-xs text-blue-600 mt-0.5 hover:underline pointer-events-auto cursor-pointer"
                      data-view-agreement
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal();
                      }}
                    >
                      {t('personalInfo.viewAgreement')}
                    </span>
                  </Label>
               
                </div>
              </div>
            </div>
            {errors.agree && (
              <p className="text-red-500 text-sm mt-1">{errors.agree}</p>
            )}
          </div>

      
      </form>
           
        </div>

        {/* Navigation Buttons - Fixed at bottom */}
        <div className="flex justify-between w-full pt-2 sm:pt-4 flex-shrink-0 mt-4">
        <button 
                onClick={onPrev} 
                                className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 
                         text-xs sm:text-sm md:text-base font-medium text-gray-600 bg-white/80 backdrop-blur-sm
                         border-2 border-gray-300 rounded-lg sm:rounded-xl shadow-sm
                         transition-all duration-300 ease-out
                         hover:border-[#407EFF] hover:text-[#407EFF] hover:bg-white hover:shadow-md
                         focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20
                         active:scale-[0.98]`}
              >
                {i18n.language === 'ar' ? (
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                ) : (
                  <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
                )}
                <span>{t('buttons.back')}</span>
              </button>

          <button 
                type="button"
                onClick={(e) => {
                  console.log("Button clicked!", e);
                  handleNext()
                }}
              
                className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-6 py-2 md:py-3
                         text-xs sm:text-sm md:text-base font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                         rounded-lg sm:rounded-xl shadow-lg
                         transition-all duration-300 ease-out
                         hover:shadow-xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                         focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                         active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg`}
              >
                      {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs sm:text-sm md:text-base">{t('buttons.loading')}</span>
                  </div>
                ) : (
                  <>
                    <span>{t('buttons.next')}</span>
                    {i18n.language === 'ar' ? (
                      <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
                    ) : (
                      <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </>
                )}
              </button>
        </div>
    </motion.div>
</motion.div>

  

      {/* Desktop Layout (1024px and above) */}
      <motion.div 
        className="hidden lg:flex w-full h-full items-center justify-center max-w-7xl mx-auto overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        {/* Form */}
        <motion.div 
          className="rounded-3xl p-4 md:p-6 h-full max-w-4xl w-full flex flex-col min-h-0"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        >
          {/* Header */}
          <motion.div 
            className="text-center mb-2 md:mb-4 flex-shrink-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#407EFF] mb-2">
              {t('personalInfo.title')}
            </h2>
          </motion.div>

          <form className="flex-1 flex flex-col min-h-0 overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} onSubmit={(e) => e.preventDefault()}>
            {/* Scrollable content area */}
            <div className="flex-1 pr-2 space-y-2 md:space-y-3 overflow-y-auto overflow-x-hidden min-h-0">
              {/* Full Name */}
              <div className="group flex-shrink-0">
                <Label htmlFor="fullName" className="text-sm  font-semibold text-gray-700  block uppercase tracking-wide">
                  {t('personalInfo.fullName')}
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('personalInfo.fullNamePlaceholderExample')}
                    autoComplete="off"
                    className="w-full text-base md:text-lg py-3 md:py-3 px-4 border border-gray-500
                    hover:border-2 
                    focus:border-2 rounded-xl 
                               bg-gray-50/50 backdrop-blur-sm
                               transition-all duration-300 ease-out
                               hover:border-gray-300 hover:bg-white/70
                               focus:border-[#407EFF] focus:bg-white focus:outline-none 
                               focus:ring-4 focus:ring-[#407EFF]/10 focus:shadow-lg
                               placeholder:text-gray-600 placeholder:font-medium"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="group flex-shrink-0">
                <Label htmlFor="email" className="text-sm  font-semibold text-gray-700  block uppercase tracking-wide">
                  {t('personalInfo.email')}
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('personalInfo.emailPlaceholderExample')}
                    autoComplete="off"
                    className="w-full text-base md:text-lg py-3 md:py-3 px-4 border border-gray-500
                    hover:border-2 
                    focus:border-2 rounded-xl 
                               bg-gray-50/50 backdrop-blur-sm
                               transition-all duration-300 ease-out
                               hover:border-gray-300 hover:bg-white/70
                               focus:border-[#407EFF] focus:bg-white focus:outline-none 
                               focus:ring-4 focus:ring-[#407EFF]/10 focus:shadow-lg
                               placeholder:text-gray-600 placeholder:font-medium"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone and Nationality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="group flex-shrink-0">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 block uppercase tracking-wide">
                    {t('personalInfo.phone')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const newPhoneValue = e.target.value;
                        setPhone(newPhoneValue);
                        // Only clear error if the input becomes valid
                        if (errors.phone && (newPhoneValue === "" || validatePhone(newPhoneValue).isValid)) {
                          setErrors(prev => ({ ...prev, phone: "" }));
                        }
                      }}
                      placeholder={t('personalInfo.phonePlaceholderExample')}
                      autoComplete="off"
                      className="w-full text-base md:text-lg py-3 md:py-3 px-4 border border-gray-500
                      hover:border-2 
                      focus:border-2 rounded-xl 
                                     bg-gray-50/50 backdrop-blur-sm
                                     transition-all duration-300 ease-out
                                     hover:border-gray-300 hover:bg-white/70
                                     focus:border-[#407EFF] focus:bg-white focus:outline-none 
                                     focus:ring-4 focus:ring-[#407EFF]/10 focus:shadow-lg
                                     placeholder:text-gray-600 placeholder:font-medium"
                    />
                    {phone && (
                      <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center">
                        <div className={`w-2 h-2 rounded-full ${validatePhone(phone).isValid ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </div>
                    )}
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                  {phone && !errors.phone && validatePhone(phone).isValid && (
                    <motion.p 
                      className="text-green-600 text-xs flex items-center gap-1 mt-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CheckCircle className="w-3 h-3" />
                      {t('personalInfo.errors.validPhoneNumber')}
                    </motion.p>
                  )}
                </div>

                {/* Nationality */}
                <div className="group flex-shrink-0">
                  <Label htmlFor="nationalityId" className="text-sm font-semibold text-gray-700 block uppercase tracking-wide">
                    {t('personalInfo.nationality')}
                  </Label>
                  <div className="relative">
                    <CountrySelector
                      language={i18n.language as "en" | "ar"} 
                      onSelect={(id) => setNationalityId(id ?? "")} 
                    />
                  </div>
                  {errors.nationalityId && (
                    <p className="text-red-500 text-sm mt-1">{errors.nationalityId}</p>
                  )}
                </div>
              </div>

              {/* Consent Section */}
              <div className="space-y-2 md:space-y-3 flex-shrink-0">
                {/* Consent Checkbox */}
                <div className="group">
                  <div 
                    className="flex items-start space-x-3 p-2 md:p-3 rounded-2xl border-2 border-gray-500 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md cursor-pointer"
                    onClick={() => setConsent(!consent)}
                  >
                    <div className="relative">
                      <div
                        className={`w-4 h-4 md:w-5 md:h-5 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md pointer-events-none flex items-center justify-center ${
                          consent 
                            ? 'bg-gradient-to-r from-[#407EFF] to-[#1E40AF] border-[#407EFF]' 
                            : 'border-gray-300 bg-white hover:border-[#407EFF]/50'
                        }`}
                      >
                        {consent && (
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label 
                        htmlFor="consent" 
                        className="text-xs  font-medium text-gray-700 leading-relaxed cursor-pointer block pointer-events-none"
                      >
                        {t('personalInfo.consent')}
                      </Label>
                      <p className="text-xs text-gray-500 mt-0.5 pointer-events-none">
                        {t('personalInfo.consentDescription')}
                      </p>
                    </div>
                  </div>
                </div>
                {errors.consent && (
                  <p className="text-red-500 text-sm mt-1">{errors.consent}</p>
                )}

                {/* Agreement Checkbox */}
                <div className="group">
                  <div 
                    className="flex items-start space-x-3 p-2 md:p-3 rounded-2xl border-2 border-gray-500 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md cursor-pointer"
                    onClick={(e) => {
                      // Check if click is on the "View Agreement" text in description
                      const target = e.target as HTMLElement;
                      if (target.closest('[data-view-agreement]')) {
                        openModal();
                      } else {
                        setAgree(!agree);
                      }
                    }}
                  >
                    <div className="relative">
                      <div
                        className={`w-4 h-4 md:w-5 md:h-5 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md pointer-events-none flex items-center justify-center ${
                          agree 
                            ? 'bg-gradient-to-r from-[#407EFF] to-[#1E40AF] border-[#407EFF]' 
                            : 'border-gray-300 bg-white hover:border-[#407EFF]/50'
                        }`}
                      >
                        {agree && (
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label 
                        htmlFor="agree" 
                        className="text-xs   font-medium text-gray-700 leading-relaxed cursor-pointer block pointer-events-none"
                      >
                        {t('personalInfo.agreement')}
                      </Label>
                      <p 
                        className="text-xs text-gray-500 mt-0.5 pointer-events-none"
                        data-view-agreement
                      >
                        <span 
                          className="text-blue-600 hover:underline cursor-pointer pointer-events-auto"
                          data-view-agreement
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal();
                          }}
                        >
                          {t('personalInfo.agreementDescription')}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                {errors.agree && (
                  <p className="text-red-500 text-sm mt-1">{errors.agree}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between w-full pt-2 sm:pt-4 flex-shrink-0 mt-4">
        <button 
                 onClick={onPrev} 
                                className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 
                         text-xs sm:text-sm md:text-base font-medium text-gray-600 bg-white/80 backdrop-blur-sm
                         border-2 border-gray-300 rounded-lg sm:rounded-xl shadow-sm
                         transition-all duration-300 ease-out
                         hover:border-[#407EFF] hover:text-[#407EFF] hover:bg-white hover:shadow-md
                         focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20
                         active:scale-[0.98]`}
              >
                {i18n.language === 'ar' ? (
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                ) : (
                  <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
                )}
                <span>{t('buttons.back')}</span>
              </button>

          <button 
                type="button"
                onClick={(e) => {
                  console.log("Button clicked!", e);
                  handleNext()
                }}
              
                className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-6 py-2 md:py-3
                         text-xs sm:text-sm md:text-base font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                         rounded-lg sm:rounded-xl shadow-lg
                         transition-all duration-300 ease-out
                         hover:shadow-xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                         focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                         active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg`}
              >
                    {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs sm:text-sm md:text-base">{t('buttons.loading')}</span>
                  </div>
                ) : (
                  <>
                    <span>{t('buttons.next')}</span>
                    {i18n.language === 'ar' ? (
                      <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
                    ) : (
                      <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </>
                )}
              </button>
        </div>
          </form>
        </motion.div>

      
      </motion.div>
  
      {/* Agreement Modal */}
      <AgreementModal isOpen={isModalOpen} onClose={closeModal} />
      

    </>
  );
}
