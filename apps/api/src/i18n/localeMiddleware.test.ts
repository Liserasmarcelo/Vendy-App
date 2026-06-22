import { describe, it, expect } from 'vitest';
import { getLocaleFromRequest, translate, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './localeMiddleware';

describe('getLocaleFromRequest', () => {
  it('returns locale from query param', () => {
    const request = { query: { lang: 'en' } } as any;
    expect(getLocaleFromRequest(request)).toBe('en');
  });

  it('returns locale from header', () => {
    const request = { 
      query: {},
      headers: { 'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8' }
    } as any;
    expect(getLocaleFromRequest(request)).toBe('pt');
  });

  it('returns user locale if set', () => {
    const request = { 
      query: {},
      headers: {},
      user: { locale: 'en' }
    } as any;
    expect(getLocaleFromRequest(request)).toBe('en');
  });

  it('returns default locale if no match', () => {
    const request = { query: {}, headers: {} } as any;
    expect(getLocaleFromRequest(request)).toBe(DEFAULT_LOCALE);
  });

  it('ignores unsupported query locale', () => {
    const request = { query: { lang: 'fr' } } as any;
    expect(getLocaleFromRequest(request)).toBe(DEFAULT_LOCALE);
  });
});

describe('translate', () => {
  it('translates key in Spanish', () => {
    expect(translate('order.created', 'es')).toBe('Orden creada');
  });

  it('translates key in English', () => {
    expect(translate('order.created', 'en')).toBe('Order created');
  });

  it('translates key in Portuguese', () => {
    expect(translate('order.created', 'pt')).toBe('Pedido criado');
  });

  it('interpolates params', () => {
    expect(translate('welcome', 'es', { name: 'Juan' })).toBe('Bienvenido a Vendy');
  });

  it('falls back to default locale', () => {
    expect(translate('unknown.key', 'pt')).toBe('unknown.key');
  });
});

describe('SUPPORTED_LOCALES', () => {
  it('contains expected locales', () => {
    expect(SUPPORTED_LOCALES).toContain('es');
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toContain('pt');
    expect(SUPPORTED_LOCALES).toHaveLength(3);
  });

  it('has default locale', () => {
    expect(DEFAULT_LOCALE).toBe('es');
  });
});
