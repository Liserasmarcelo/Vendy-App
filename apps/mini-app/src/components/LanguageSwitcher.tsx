import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES, LOCALE_NAMES, LOCALE_FLAGS, type SupportedLocale } from '../i18n';

// ==========================================
// LANGUAGE SWITCHER COMPONENT
// ==========================================
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as SupportedLocale;

  const handleChange = (lang: SupportedLocale) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('vendy_locale', lang);
  };

  return (
    <div className="language-switcher">
      <select
        value={currentLang}
        onChange={(e) => handleChange(e.target.value as SupportedLocale)}
        className="lang-select"
        aria-label="Seleccionar idioma"
      >
        {SUPPORTED_LOCALES.map((lang) => (
          <option key={lang} value={lang}>
            {LOCALE_FLAGS[lang]} {LOCALE_NAMES[lang]}
          </option>
        ))}
      </select>
    </div>
  );
}

// Compact version for navbars
export function LanguageSwitcherCompact() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as SupportedLocale;

  const handleChange = (lang: SupportedLocale) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('vendy_locale', lang);
  };

  return (
    <div className="language-switcher-compact">
      {SUPPORTED_LOCALES.map((lang) => (
        <button
          key={lang}
          className={currentLang === lang ? 'active' : ''}
          onClick={() => handleChange(lang)}
          aria-label={LOCALE_NAMES[lang]}
        >
          {LOCALE_FLAGS[lang]}
        </button>
      ))}
    </div>
  );
}
