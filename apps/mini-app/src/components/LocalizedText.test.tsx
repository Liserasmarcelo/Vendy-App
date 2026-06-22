import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocalizedText, T, TButton } from './LocalizedText';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: vi.fn((key: string, options?: any) => {
      if (key === 'loading') return 'Cargando...';
      if (key === 'save') return 'Guardar';
      if (options?.defaultValue) return options.defaultValue;
      return key;
    }),
  }),
}));

describe('LocalizedText', () => {
  it('renders translated text', () => {
    render(<LocalizedText key="loading" />);
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('uses fallback when translation missing', () => {
    render(<LocalizedText key="missing.key" fallback="Fallback text" />);
    
    expect(screen.getByText('Fallback text')).toBeInTheDocument();
  });

  it('renders with custom component', () => {
    render(<LocalizedText key="save" as="h1" className="title" />);
    
    const element = screen.getByText('Guardar');
    expect(element.tagName).toBe('H1');
    expect(element).toHaveClass('title');
  });

  it('interpolates values', () => {
    const { t } = require('react-i18next').useTranslation();
    t.mockReturnValue('Hello John, you have 5 messages');
    
    render(<LocalizedText key="greeting" values={{ name: 'John', count: 5 }} />);
    
    expect(screen.getByText('Hello John, you have 5 messages')).toBeInTheDocument();
  });
});

describe('T', () => {
  it('renders with children as key', () => {
    render(<T>loading</T>);
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });
});

describe('TButton', () => {
  it('renders translated button', () => {
    render(<TButton label="save" />);
    
    expect(screen.getByRole('button')).toHaveTextContent('Guardar');
  });
});
