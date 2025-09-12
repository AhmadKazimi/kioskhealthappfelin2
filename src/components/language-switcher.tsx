"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
// import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(languages[0]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Initialize i18n if not already loaded
    if (typeof window !== 'undefined') {
      import('@/lib/i18n');
    }
  }, []);

  useEffect(() => {
    if (isMounted && i18n && i18n.language) {
      const current = languages.find(lang => lang.code === i18n.language) || languages[0];
      setCurrentLanguage(current);
      
      // Update document direction for Arabic
      if (typeof document !== 'undefined') {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
      }
    }
  }, [isMounted, i18n?.language]);

  const changeLanguage = async (languageCode: string) => {
    if (isMounted && i18n && typeof i18n.changeLanguage === 'function') {
      try {
        // Store language before changing to ensure persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('i18nextLng', languageCode);
        }
        await i18n.changeLanguage(languageCode);
        
        // Manually update document direction for immediate feedback
        if (typeof document !== 'undefined') {
          document.documentElement.dir = languageCode === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = languageCode;
        }
        
        console.log('Language changed to:', languageCode);
      } catch (error) {
        console.error('Failed to change language:', error);
      }
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <Button
        size="sm"
        className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 bg-white rounded-full text-[#407EFF] hover:bg-gray-100 shadow-sm transition-colors"
      >
        <span className="text-sm sm:text-base lg:text-lg">🇺🇸</span>
        <span className="hidden md:inline text-sm sm:text-base lg:text-lg font-medium">EN</span>
      </Button>
    );
  }

  return (
    <DropdownMenu   >
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 bg-white rounded-full text-[#407EFF] hover:bg-gray-100 shadow-sm transition-colors"
        >
          {/* Show flag on all screen sizes, text on larger screens */}
          <span className="text-sm sm:text-base lg:text-lg">{currentLanguage.flag}</span>
          <span className="hidden md:inline text-sm sm:text-base lg:text-lg font-medium">
            {currentLanguage.name === 'English' ? 'EN' : 'ع'.toLocaleUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg min-w-[140px] sm:min-w-[160px]">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-100 px-3 py-2 sm:px-4 sm:py-3 ${
              currentLanguage.code === language.code ? 'bg-blue-50 text-blue-700' : ''
            }`}
          >
            <span className="text-base sm:text-lg">{language.flag}</span>
            <span className="text-sm sm:text-base">{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 