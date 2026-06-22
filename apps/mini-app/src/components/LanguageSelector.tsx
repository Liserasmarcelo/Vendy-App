import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

// ==========================================
// LANGUAGE SELECTOR COMPONENT
// ==========================================
interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons' | 'flags';
}

export function LanguageSelector({ variant = 'dropdown' }: LanguageSelectorProps) {
  const { currentLanguage, supportedLanguages, changeLanguage, getLanguageFlag } = useLanguage();

  if (variant === 'flags') {
    return (
      <div className="language-selector flags">
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            className={`language-flag ${currentLanguage === lang.code ? 'active' : ''}`}
            onClick={() => changeLanguage(lang.code as any)}
            title={lang.name}
          >
            <span className="flag">{lang.flag}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className="language-selector buttons">
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            className={`language-btn ${currentLanguage === lang.code ? 'active' : ''}`}
            onClick={() => changeLanguage(lang.code as any)}
          >
            <span className="flag">{lang.flag}</span>
            <span className="name">{lang.name}</span>
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className="language-selector dropdown">
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value as any)}
        className="language-select"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
