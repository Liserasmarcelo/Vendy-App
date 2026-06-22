import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ==========================================
// I18N CONFIGURATION
// ==========================================

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export type LanguageCode = 'es' | 'en' | 'pt' | 'fr' | 'de';

// Default language
export const DEFAULT_LANGUAGE: LanguageCode = 'es';

// Language detection from Telegram
export function detectLanguage(initData?: string): LanguageCode {
  if (!initData) return DEFAULT_LANGUAGE;
  
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    if (userJson) {
      const user = JSON.parse(decodeURIComponent(userJson));
      const lang = user.language_code?.split('-')[0] as LanguageCode;
      if (SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
        return lang;
      }
    }
  } catch {
    // Fallback to default
  }
  
  return DEFAULT_LANGUAGE;
}

// Storage key
const STORAGE_KEY = 'vendy-language';

export function getStoredLanguage(): LanguageCode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
      return stored as LanguageCode;
    }
  } catch {
    // localStorage not available
  }
  return null;
}

export function storeLanguage(lang: LanguageCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // localStorage not available
  }
}

// Initialize i18n
export async function initializeI18n() {
  const resources = await loadTranslations();
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: getStoredLanguage() || DEFAULT_LANGUAGE,
      fallbackLng: DEFAULT_LANGUAGE,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  
  return i18n;
}

// Dynamic translation loader
async function loadTranslations() {
  const translations: Record<string, any> = {};
  
  for (const lang of SUPPORTED_LANGUAGES) {
    try {
      const module = await import(`./locales/${lang.code}.json`);
      translations[lang.code] = { translation: module.default };
    } catch {
      // Fallback to empty if translation missing
      translations[lang.code] = { translation: {} };
    }
  }
  
  return translations;
}

export default i18n;
