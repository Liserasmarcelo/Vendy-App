import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from './LanguageSelector';

vi.mock('../hooks/useLanguage', () => ({
  useLanguage: vi.fn().mockReturnValue({
    currentLanguage: 'es',
    supportedLanguages: [
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'pt', name: 'Português', flag: '🇧🇷' },
    ],
    changeLanguage: vi.fn(),
    getLanguageFlag: vi.fn((code: string) => {
      const flags: Record<string, string> = { es: '🇪🇸', en: '🇬🇧', pt: '🇧🇷' };
      return flags[code] || '🌐';
    }),
  }),
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dropdown by default', () => {
    render(<LanguageSelector />);
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('🇪🇸 Español')).toBeInTheDocument();
    expect(screen.getByText('🇬🇧 English')).toBeInTheDocument();
  });

  it('renders flag buttons', () => {
    render(<LanguageSelector variant="flags" />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent('🇪🇸');
  });

  it('renders language buttons', () => {
    render(<LanguageSelector variant="buttons" />);
    
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Português')).toBeInTheDocument();
  });

  it('changes language on select', () => {
    const mockChange = vi.fn();
    vi.mocked(require('../hooks/useLanguage').useLanguage).mockReturnValueOnce({
      currentLanguage: 'es',
      supportedLanguages: [
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
      ],
      changeLanguage: mockChange,
      getLanguageFlag: vi.fn(),
    });

    render(<LanguageSelector />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'en' } });
    
    expect(mockChange).toHaveBeenCalledWith('en');
  });

  it('changes language on flag click', () => {
    const mockChange = vi.fn();
    vi.mocked(require('../hooks/useLanguage').useLanguage).mockReturnValueOnce({
      currentLanguage: 'es',
      supportedLanguages: [
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
      ],
      changeLanguage: mockChange,
      getLanguageFlag: vi.fn((code: string) => code === 'es' ? '🇪🇸' : '🇬🇧'),
    });

    render(<LanguageSelector variant="flags" />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // Click English flag
    
    expect(mockChange).toHaveBeenCalledWith('en');
  });

  it('marks current language as active', () => {
    render(<LanguageSelector variant="buttons" />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveClass('active'); // Spanish is current
  });
});
