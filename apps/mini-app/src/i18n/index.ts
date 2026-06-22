import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ==========================================
// I18N CONFIGURATION
// ==========================================
import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';

export const SUPPORTED_LOCALES = ['es', 'en', 'pt'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: SupportedLocale = 'es';

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
};

export const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  es: '🇪🇸',
  en: '🇬🇧',
  pt: '🇧🇷',
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
    },
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator', 'localStorage', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
