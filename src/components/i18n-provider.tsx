"use client";

import { useEffect, ReactNode, useState } from 'react';
import i18n, { initializeI18n } from '@/lib/i18n';

interface I18nProviderProps {
  children: ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize i18n
    if (typeof window !== 'undefined') {
      const setupI18n = async () => {
        try {
          // Ensure i18n is initialized
          await initializeI18n();
          
          // Wait a bit for i18n to be fully ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Set initial language from localStorage or default to English
          const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
          if (i18n.language !== savedLanguage && typeof i18n.changeLanguage === 'function') {
            await i18n.changeLanguage(savedLanguage);
          }
          
          // Update document direction and language
          document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = savedLanguage;
          
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize i18n:', error);
          // Set English as fallback
          document.documentElement.dir = 'ltr';
          document.documentElement.lang = 'en';
          setIsInitialized(true);
        }
      };

      setupI18n();
    } else {
      // Server-side rendering
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    // Listen for language changes and update document attributes
    const handleLanguageChanged = (lng: string) => {
      if (typeof document !== 'undefined') {
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
      }
    };

    // Only add listener if i18n is properly initialized and has the methods
    if (i18n && typeof i18n.on === 'function') {
      i18n.on('languageChanged', handleLanguageChanged);

      // Cleanup listener
      return () => {
        if (i18n && typeof i18n.off === 'function') {
          i18n.off('languageChanged', handleLanguageChanged);
        }
      };
    }
  }, [isInitialized]);

  return <>{children}</>;
} 