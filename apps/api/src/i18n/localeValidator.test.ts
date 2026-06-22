import { describe, it, expect, vi } from 'vitest';
import { LocaleValidator } from './localeValidator';

vi.mock('fs', () => ({
  readFileSync: vi.fn().mockImplementation((path: string) => {
    if (path.includes('es.json')) {
      return JSON.stringify({
        common: { loading: 'Cargando...', save: 'Guardar' },
        auth: { login: 'Iniciar sesión' },
      });
    }
    if (path.includes('en.json')) {
      return JSON.stringify({
        common: { loading: 'Loading...', save: 'Save' },
        auth: { login: 'Log in' },
      });
    }
    if (path.includes('incomplete.json')) {
      return JSON.stringify({
        common: { loading: 'Loading...' },
        // missing auth section
      });
    }
    if (path.includes('extra.json')) {
      return JSON.stringify({
        common: { loading: 'Loading...', save: 'Save', extra: 'Extra' },
        auth: { login: 'Log in' },
      });
    }
    if (path.includes('empty.json')) {
      return JSON.stringify({
        common: { loading: '', save: 'Save' },
        auth: { login: 'Log in' },
      });
    }
    if (path.includes('interpolation.json')) {
      return JSON.stringify({
        common: { loading: 'Loading...', save: 'Save' },
        auth: { login: 'Log in {{name}}' },
      });
    }
    throw new Error('File not found');
  }),
  readdirSync: vi.fn().mockReturnValue(['es.json', 'en.json', 'incomplete.json', 'extra.json', 'empty.json', 'interpolation.json']),
}));

vi.mock('path', () => ({
  join: vi.fn((...args: string[]) => args.join('/')),
}));

describe('LocaleValidator', () => {
  const validator = new LocaleValidator('./locales', 'es');

  it('validates complete locale', () => {
    const result = validator.validateLocale('en');

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.missingKeys).toHaveLength(0);
  });

  it('detects missing keys', () => {
    const result = validator.validateLocale('incomplete');

    expect(result.valid).toBe(false);
    expect(result.missingKeys).toContain('auth.login');
    expect(result.errors).toContain('Missing key: auth.login');
  });

  it('detects extra keys', () => {
    const result = validator.validateLocale('extra');

    expect(result.extraKeys).toContain('common.extra');
    expect(result.warnings).toContain('Extra key: common.extra');
  });

  it('detects empty translations', () => {
    const result = validator.validateLocale('empty');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Empty translation: common.loading');
  });

  it('detects interpolation mismatches', () => {
    const result = validator.validateLocale('interpolation');

    expect(result.warnings).toContain('Interpolation mismatch: auth.login');
  });

  it('validates all locales', () => {
    const results = validator.validateAll();

    expect(results).toHaveProperty('en');
    expect(results).toHaveProperty('incomplete');
    expect(results).toHaveProperty('extra');
    expect(results).toHaveProperty('empty');
    expect(results).toHaveProperty('interpolation');
  });

  it('returns valid for complete locale', () => {
    const result = validator.validateLocale('en');
    expect(result.valid).toBe(true);
  });
});
