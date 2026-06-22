import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SUPPORTED_LANGUAGES, 
  type LanguageCode, 
  DEFAULT_LANGUAGE,
  storeLanguage,
  getStoredLanguage,
  detectLanguage 
} from '../i18n/config';

// ==========================================
// LANGUAGE HOOK
// ==========================================
export function useLanguage() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(
    getStoredLanguage() || DEFAULT_LANGUAGE
  );
  const [isLoading, setIsLoading] = useState(false);

  // Detect language on mount (from Telegram initData)
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData;
    const detected = detectLanguage(initData);
    
    if (detected !== currentLanguage) {
      changeLanguage(detected);
    }
  }, []);

  const changeLanguage = useCallback(async (lang: LanguageCode) => {
    if (!SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
      console.warn(`Language ${lang} not supported`);
      return;
    }

    setIsLoading(true);
    try {
      await i18n.changeLanguage(lang);
      storeLanguage(lang);
      setCurrentLanguage(lang);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  }, [i18n]);

  const getLanguageName = useCallback((code: LanguageCode) => {
    return SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code;
  }, []);

  const getLanguageFlag = useCallback((code: LanguageCode) => {
    return SUPPORTED_LANGUAGES.find(l => l.code === code)?.flag || '🌐';
  }, []);

  return {
    currentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isLoading,
    changeLanguage,
    getLanguageName,
    getLanguageFlag,
  };
}
