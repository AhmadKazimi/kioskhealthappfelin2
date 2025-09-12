/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { UserData } from "./home-screen";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { UserResponse } from "@/types/user-response-type";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css"; 
import AgreementModal from "./agreementModal";
import Cookies from 'js-cookie';
import CountrySelector from "@/components/ui/country-selector";
import { useTranslation } from "@/hooks/useTranslation";
import { motion } from "framer-motion";




interface PersonalInfoScreenProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function PersonalInfoScreen({
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



  const validateEmail = (email: string) => {
    if (!email) return true; // Empty is valid since it's optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true; // Empty is valid since it's optional
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const handleNext = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

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

    if (email && !validateEmail(email)) {
      newErrors.email = t('personalInfo.errors.invalidEmail');
      isValid = false;
    }

    if (phone && !validatePhone(phone)) {
      newErrors.phone = t('personalInfo.errors.invalidPhone');
      isValid = false;
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
      setErrors(newErrors);
      return;
    }
    console.log({ fullName, email, phone, consent, nationalityId }, "personal information");

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
      onNext();  
    } catch (error) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"
    > 
 {/* Mobile Layout */}
    <div className="md:hidden px-4 py-6 sm:px-6">
      <div className="bg-white/80 text-center backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#407EFF] mb-6 sm:mb-8 text-center">
          {t('personalInfo.title')}
        </h2>
        <form className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-2xl mx-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
  {/* Full Name */}
  <div className="space-y-3">
    <Label htmlFor="fullName" className="text-base sm:text-lg font-semibold text-gray-700 block">
      {t('personalInfo.fullName')}
    </Label>
    <Input
      id="fullName"
      value={fullName}
      onChange={(e) => setFullName(e.target.value)}
      placeholder={t('personalInfo.fullNamePlaceholder')}
      autoComplete="off"
      className="w-full text-base sm:text-lg py-3 sm:py-4 px-3 sm:px-4 border-2 border-gray-300 rounded-xl 
                 transition-all duration-200 ease-in-out
                 hover:border-gray-400
                 focus:border-[#407EFF] focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20
                 placeholder:text-gray-400"
    />  
  </div>

  {/* Email */}
  <div className="space-y-3">
    <Label htmlFor="email" className="text-base sm:text-lg font-semibold text-gray-700 block">
      {t('personalInfo.email')}
    </Label>
    <Input
      id="email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder={t('personalInfo.emailPlaceholder')}
      autoComplete="off"
      className="w-full text-base sm:text-lg py-3 sm:py-4 px-3 sm:px-4 border-2 border-gray-300 rounded-xl 
                 transition-all duration-200 ease-in-out
                 hover:border-gray-400
                 focus:border-[#407EFF] focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20
                 placeholder:text-gray-400"
    />
  </div>

  {/* Phone */}
  <div className="space-y-3">
    <Label htmlFor="phone" className="text-base sm:text-lg font-semibold text-gray-700 block">
      {t('personalInfo.phone')}
    </Label>
    <Input
      id="phone"
      type="tel"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      placeholder={t('personalInfo.phonePlaceholder')}
      autoComplete="off"
      className="w-full text-base sm:text-lg py-3 sm:py-4 px-3 sm:px-4 border-2 border-gray-300 rounded-xl 
                 transition-all duration-200 ease-in-out
                 hover:border-gray-400
                 focus:border-[#407EFF] focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20
                 placeholder:text-gray-400"
    />
  </div>

  {/* Nationality */}
  <div className="space-y-3">
    <Label htmlFor="nationalityId" className="text-base sm:text-lg font-semibold text-gray-700 block">
      {t('personalInfo.nationality')}
    </Label>
    <div className="relative">
      <CountrySelector 
        language={i18n.language as "en" | "ar"} 
        onSelect={(id) => setNationalityId(id ?? "")} 
      />
    </div>
  </div>

  {/* Consent Checkbox */}
  <div className="space-y-3">
    <div className={`flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 ${i18n.language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
      <Checkbox
        id="consent"
        checked={consent}
        onCheckedChange={(checked) => setConsent(checked === true)}
        className="w-5 h-5 mt-1 flex-shrink-0 rounded border-2 border-gray-300 
                   data-[state=checked]:bg-[#407EFF] data-[state=checked]:border-[#407EFF]
                   focus:ring-4 focus:ring-[#407EFF]/20 focus:outline-none
                   transition-all duration-200"
      />
      <div className="flex-1">
        <Label 
          htmlFor="consent" 
          className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed cursor-pointer"
        >
          {t('personalInfo.consent')}
        </Label>
      </div>
    </div>
  </div>

  {/* Agreement Checkbox */}
  <div className="space-y-3">
    <div className={`flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 ${i18n.language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
      <Checkbox
        id="agree"
        checked={agree}
        onCheckedChange={(checked) => setAgree(checked === true)}
        className="w-5 h-5 mt-1 flex-shrink-0 rounded border-2 border-gray-300 
                   data-[state=checked]:bg-[#407EFF] data-[state=checked]:border-[#407EFF]
                   focus:ring-4 focus:ring-[#407EFF]/20 focus:outline-none
                   transition-all duration-200"
      />
      <div className="flex-1">
        <Label 
          htmlFor="agree" 
          className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed cursor-pointer"
        >
          {t('personalInfo.agreement')}
        </Label>
      </div>
    </div>
  </div>

  {/* Navigation Buttons */}
  <div className={`flex justify-between gap-3 sm:gap-4 pt-4 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
    <button
      type="button"
      onClick={onPrev}
      className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 
                 text-sm sm:text-base font-medium text-gray-600 bg-white/80 backdrop-blur-sm
                 border-2 border-gray-300 rounded-xl shadow-sm
                 transition-all duration-300 ease-out
                 hover:border-[#407EFF] hover:text-[#407EFF] hover:bg-white hover:shadow-md
                 focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20
                 active:scale-[0.98] ${i18n.language === 'ar' ? 'space-x-reverse' : ''}`}
    >
      <ArrowLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${i18n.language === 'ar' ? 'rotate-180' : ''}`} />
      <span>{t('buttons.back')}</span>
    </button>

    <button
      type="button"
      onClick={handleNext}
      disabled={isLoading}
      className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3
                 text-sm sm:text-base font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                 rounded-xl shadow-lg
                 transition-all duration-300 ease-out
                 hover:shadow-xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                 focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                 active:scale-[0.98]
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg ${i18n.language === 'ar' ? 'space-x-reverse' : ''}`}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>{t('buttons.loading')}</span>
        </div>
      ) : (
        <>
          <span>{t('buttons.continue')}</span>
          <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${i18n.language === 'ar' ? 'rotate-180' : ''}`} />
        </>
      )}
    </button>
  </div>
</form>
      </div>
    </div>
    {/* Desktop Layout */}
    <div className="hidden md:grid grid-cols-4 gap-6 lg:gap-8 relative min-h-screen w-full p-6 lg:p-8">
      {/* Left Sidebar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#407EFF] to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#407EFF]">
            {t('personalInfo.title')}
          </h3>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 col-span-2">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold bg-gradient-to-r from-[#407EFF] to-blue-600 bg-clip-text text-transparent mb-4">
            {t('personalInfo.title')}
          </h2>
          <p className={`text-lg lg:text-xl text-gray-600 max-w-md mx-auto ${i18n.language === 'ar' ? 'text-right' : 'text-center'}`}>
            {t('personalInfo.description')}
          </p>
        </div>
        
        <form className="space-y-8 max-w-2xl mx-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="space-y-3">
            <Label htmlFor="fullName" className={`text-xl font-semibold text-gray-700 flex items-center ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <svg className={`w-5 h-5 text-[#407EFF] ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t('personalInfo.fullName')}
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('personalInfo.fullNamePlaceholder')}
              autoComplete="off"
              className="text-xl py-6 border-2 border-gray-200 rounded-2xl px-6 focus:border-[#407EFF] focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:border-gray-300"
              style={{
                '--tw-ring-color': '#407EFF',
                '--tw-ring-opacity': '0.2',
              } as React.CSSProperties}
            />  
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="email" className={`text-xl font-semibold text-gray-700 flex items-center ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <svg className={`w-5 h-5 text-[#407EFF] ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('personalInfo.email')}
            </Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('personalInfo.emailPlaceholder')}
              autoComplete="off"
              className="text-xl py-6 border-2 border-gray-200 rounded-2xl px-6 focus:border-[#407EFF] focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:border-gray-300"
              style={{
                '--tw-ring-color': '#407EFF',
                '--tw-ring-opacity': '0.2',
              } as React.CSSProperties}
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="phone" className={`text-xl font-semibold text-gray-700 flex items-center ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <svg className={`w-5 h-5 text-[#407EFF] ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {t('personalInfo.phone')}
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('personalInfo.phonePlaceholder')}
              autoComplete="off"
              className="text-xl py-6 border-2 border-gray-200 rounded-2xl px-6 focus:border-[#407EFF] focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:border-gray-300"
              style={{
                '--tw-ring-color': '#407EFF',
                '--tw-ring-opacity': '0.2',
              } as React.CSSProperties}
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="nationalityId" className={`text-xl font-semibold text-gray-700 flex items-center ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <svg className={`w-5 h-5 text-[#407EFF] ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('personalInfo.nationality')}
            </Label>
            <div className="border-2 border-gray-200 rounded-2xl focus-within:border-[#407EFF] focus-within:ring-4 focus-within:ring-[#407EFF]/20 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:border-gray-300">
              <CountrySelector language={i18n.language as "en" | "ar"} onSelect={(id) => setNationalityId(id ?? "")} />
            </div>
          </div>
          
          <div className="space-y-6 pt-6">
            <div className={`flex items-start gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 ${i18n.language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className="w-7 h-7 mt-1 flex-shrink-0 text-[#407EFF] border-2 border-gray-300 rounded-lg"
              />
              <Label htmlFor="consent" className="text-xl font-medium text-gray-700 leading-relaxed cursor-pointer">
                {t('personalInfo.consent')}
              </Label>
            </div>
            
            <div className={`flex items-start gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 ${i18n.language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <Checkbox
                id="agree"
                checked={agree}
                onCheckedChange={(checked) => setAgree(checked === true)}
                className="w-7 h-7 mt-1 flex-shrink-0 text-[#407EFF] border-2 border-gray-300 rounded-lg"
              />
              <Label htmlFor="agree" className="text-xl font-medium text-gray-700 leading-relaxed cursor-pointer">
                {t('personalInfo.agreement')}
              </Label>
            </div>
          </div>
        </form>
      </div>
      
      {/* Right Sidebar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#407EFF] to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#407EFF]">
            {t('personalInfo.securePrivate')}
          </h3>
        </div>
      </div>
    </div>
    
    {/* Desktop Navigation Buttons */}
    <div className={`hidden md:block fixed bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 z-10`}>
      <div className={`flex justify-between gap-4 lg:gap-6 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <button
          type="button"
          onClick={onPrev}
          className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-4 lg:px-6 py-3 lg:py-4 
                     text-base lg:text-lg font-medium text-gray-600 bg-white/90 backdrop-blur-sm
                     border-2 border-gray-300 rounded-2xl shadow-lg
                     transition-all duration-300 ease-out
                     hover:border-[#407EFF] hover:text-[#407EFF] hover:bg-white hover:shadow-xl
                     focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20
                     active:scale-[0.98] ${i18n.language === 'ar' ? 'space-x-reverse' : ''}`}
        >
          <ArrowLeft className={`w-5 h-5 transition-transform group-hover:-translate-x-1 ${i18n.language === 'ar' ? 'rotate-180' : ''}`} />
          <span>{t('buttons.back')}</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading}
          className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-4 lg:px-6 py-3 lg:py-4
                     text-base lg:text-lg font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                     rounded-2xl shadow-lg
                     transition-all duration-300 ease-out
                     hover:shadow-2xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                     focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                     active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg ${i18n.language === 'ar' ? 'space-x-reverse' : ''}`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{t('buttons.loading')}</span>
            </div>
          ) : (
            <>
              <span>{t('buttons.continue')}</span>
              <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${i18n.language === 'ar' ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
      </div>
    </div>


    </motion.div>
  );
}
