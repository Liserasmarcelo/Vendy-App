import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher, LanguageSwitcherCompact } from './LanguageSwitcher';

const mockChangeLanguage = vi.fn();
const mockI18n = {
  language: 'es',
  changeLanguage: mockChangeLanguage,
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: mockI18n,
    t: vi.fn((key: string) => key),
  }),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders language selector', () => {
    render(<LanguageSwitcher />);
    
    expect(screen.getByLabelText('Seleccionar idioma')).toBeInTheDocument();
    expect(screen.getByText('🇪🇸 Español')).toBeInTheDocument();
    expect(screen.getByText('🇬🇧 English')).toBeInTheDocument();
    expect(screen.getByText('🇧🇷 Português')).toBeInTheDocument();
  });

  it('changes language on select', () => {
    render(<LanguageSwitcher />);
    
    const select = screen.getByLabelText('Seleccionar idioma');
    fireEvent.change(select, { target: { value: 'en' } });
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    expect(localStorage.getItem('vendy_locale')).toBe('en');
  });

  it('changes language to portuguese', () => {
    render(<LanguageSwitcher />);
    
    const select = screen.getByLabelText('Seleccionar idioma');
    fireEvent.change(select, { target: { value: 'pt' } });
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('pt');
  });
});

describe('LanguageSwitcherCompact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders compact buttons', () => {
    render(<LanguageSwitcherCompact />);
    
    expect(screen.getByLabelText('Español')).toBeInTheDocument();
    expect(screen.getByLabelText('English')).toBeInTheDocument();
    expect(screen.getByLabelText('Português')).toBeInTheDocument();
  });

  it('changes language on click', () => {
    render(<LanguageSwitcherCompact />);
    
    const enButton = screen.getByLabelText('English');
    fireEvent.click(enButton);
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('marks current language as active', () => {
    render(<LanguageSwitcherCompact />);
    
    const esButton = screen.getByLabelText('Español');
    expect(esButton).toHaveClass('active');
  });
});
