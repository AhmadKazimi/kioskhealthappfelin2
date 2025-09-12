import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '../../public/locales/en/common.json';
import arTranslations from '../../public/locales/ar/common.json';

const resources = {
  en: {
    common: enTranslations,
  },
  ar: {
    common: arTranslations,
  },
};

// Initialize i18n
const initializeI18n = () => {
  if (i18n.isInitialized) {
    return Promise.resolve();
  }
  // On server, skip browser language detector
  const isBrowser = typeof window !== 'undefined';
  const instance = isBrowser ? i18n.use(LanguageDetector) : i18n;
  return instance
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      defaultNS: 'common',
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      detection: isBrowser
        ? {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
          }
        : undefined,
      supportedLngs: ['en', 'ar'],
      react: {
        useSuspense: false, // Disable suspense for SSR compatibility
      },
    });
};

// Auto-initialize on import if in browser
if (typeof window !== 'undefined' && !i18n.isInitialized) {
  initializeI18n();
}

export { initializeI18n };
export default i18n; 