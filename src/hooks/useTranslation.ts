"use client";

import { useTranslation as useReactI18nTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import i18n, { initializeI18n } from '@/lib/i18n';

export function useTranslation(namespace = 'common') {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure i18n is initialized on client side
    if (typeof window !== 'undefined') {
      const checkI18nReady = async () => {
        try {
          await initializeI18n();
          
          // Ensure the saved language is applied after initialization
          const savedLanguage = localStorage.getItem('i18nextLng');
          if (savedLanguage && i18n.language !== savedLanguage) {
            await i18n.changeLanguage(savedLanguage);
          }
          
          // Wait a bit for i18n to be fully ready
          await new Promise(resolve => setTimeout(resolve, 50));
          setIsReady(true);
        } catch (error) {
          console.error('Error initializing i18n in useTranslation:', error);
          // Fallback to ready state even if init fails
          setIsReady(true);
        }
      };

      checkI18nReady();
    } else {
      // Server-side, assume ready
      setIsReady(true);
    }
  }, []);

  // Use the hook only when i18n is ready
  const translation = useReactI18nTranslation(namespace);

  // Return a safe version of the translation function
  return {
    ...translation,
    t: isReady && translation.t ? translation.t : (key: string) => key, // Fallback to key if not ready
    i18n: isReady && translation.i18n ? translation.i18n : { 
      language: 'en', 
      changeLanguage: () => {}, 
      on: () => {}, 
      off: () => {} 
    },
  };
}

export default useTranslation; 