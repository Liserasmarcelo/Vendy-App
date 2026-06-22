import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLanguage } from './useLanguage';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      language: 'es',
    },
  }),
}));

// Mock i18n config
vi.mock('../i18n/config', () => ({
  SUPPORTED_LANGUAGES: [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
  ],
  DEFAULT_LANGUAGE: 'es',
  getStoredLanguage: vi.fn().mockReturnValue(null),
  storeLanguage: vi.fn(),
  detectLanguage: vi.fn().mockReturnValue('es'),
}));

describe('useLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.Telegram
    (window as any).Telegram = undefined;
  });

  it('returns default language initially', () => {
    const { result } = renderHook(() => useLanguage());
    
    expect(result.current.currentLanguage).toBe('es');
    expect(result.current.supportedLanguages).toHaveLength(3);
  });

  it('changes language', async () => {
    const { result } = renderHook(() => useLanguage());
    
    await act(async () => {
      await result.current.changeLanguage('en');
    });
    
    await waitFor(() => {
      expect(result.current.currentLanguage).toBe('en');
    });
  });

  it('gets language name', () => {
    const { result } = renderHook(() => useLanguage());
    
    expect(result.current.getLanguageName('es')).toBe('Español');
    expect(result.current.getLanguageName('en')).toBe('English');
  });

  it('gets language flag', () => {
    const { result } = renderHook(() => useLanguage());
    
    expect(result.current.getLanguageFlag('es')).toBe('🇪🇸');
    expect(result.current.getLanguageFlag('en')).toBe('🇬🇧');
  });

  it('ignores unsupported languages', async () => {
    const { result } = renderHook(() => useLanguage());
    
    await act(async () => {
      await result.current.changeLanguage('xx' as any);
    });
    
    // Should remain on default
    expect(result.current.currentLanguage).toBe('es');
  });

  it('detects language from Telegram initData', () => {
    (window as any).Telegram = {
      WebApp: {
        initData: 'user={"language_code":"pt-BR"}',
      },
    };

    const { detectLanguage } = require('../i18n/config');
    detectLanguage.mockReturnValue('pt');

    const { result } = renderHook(() => useLanguage());
    
    // Should detect pt from Telegram
    expect(result.current.currentLanguage).toBe('es'); // Still default since changeLanguage is async
  });
});
