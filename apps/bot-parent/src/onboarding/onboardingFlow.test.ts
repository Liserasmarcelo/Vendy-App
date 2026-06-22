import { describe, it, expect } from 'vitest';
import {
  ONBOARDING_STEPS,
  validateStep,
  formatOnboardingValue,
  generateOnboardingSummary,
  generateBotUsername,
} from './onboardingFlow';

describe('ONBOARDING_STEPS', () => {
  it('has 9 steps', () => {
    expect(ONBOARDING_STEPS).toHaveLength(9);
  });

  it('has correct order', () => {
    expect(ONBOARDING_STEPS[0].key).toBe('fullName');
    expect(ONBOARDING_STEPS[1].key).toBe('email');
    expect(ONBOARDING_STEPS[2].key).toBe('phone');
    expect(ONBOARDING_STEPS[8].key).toBe('terms');
  });

  it('each step has question and validate', () => {
    for (const step of ONBOARDING_STEPS) {
      expect(step.question).toBeTruthy();
      expect(typeof step.validate).toBe('function');
    }
  });
});

describe('validateStep', () => {
  it('validates fullName', () => {
    expect(validateStep(0, 'Juan Pérez').valid).toBe(true);
    expect(validateStep(0, 'Ju').valid).toBe(false);
    expect(validateStep(0, '').valid).toBe(false);
  });

  it('validates email', () => {
    expect(validateStep(1, 'test@example.com').valid).toBe(true);
    expect(validateStep(1, 'invalid-email').valid).toBe(false);
    expect(validateStep(1, '').valid).toBe(false);
  });

  it('validates phone', () => {
    expect(validateStep(2, '+595 981 123456').valid).toBe(true);
    expect(validateStep(2, '12345678').valid).toBe(true);
    expect(validateStep(2, '123').valid).toBe(false);
    expect(validateStep(2, '').valid).toBe(false);
  });

  it('validates businessName', () => {
    expect(validateStep(3, 'Mi Tienda').valid).toBe(true);
    expect(validateStep(3, 'A').valid).toBe(false);
  });

  it('validates country', () => {
    expect(validateStep(6, 'PY').valid).toBe(true);
    expect(validateStep(6, 'py').valid).toBe(true);
    expect(validateStep(6, 'AR').valid).toBe(true);
    expect(validateStep(6, 'XX').valid).toBe(false);
  });

  it('validates currency', () => {
    expect(validateStep(7, 'USD').valid).toBe(true);
    expect(validateStep(7, 'usd').valid).toBe(true);
    expect(validateStep(7, 'PYG').valid).toBe(true);
    expect(validateStep(7, 'BTC').valid).toBe(false);
  });

  it('validates terms', () => {
    expect(validateStep(8, 'Sí').valid).toBe(true);
    expect(validateStep(8, 'si').valid).toBe(true);
    expect(validateStep(8, 'yes').valid).toBe(true);
    expect(validateStep(8, 'No').valid).toBe(false);
    expect(validateStep(8, 'nope').valid).toBe(false);
  });

  it('returns error messages for invalid input', () => {
    const result = validateStep(1, 'invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Email');
  });
});

describe('formatOnboardingValue', () => {
  it('formats terms as boolean', () => {
    expect(formatOnboardingValue('terms', 'Sí')).toBe(true);
    expect(formatOnboardingValue('terms', 'No')).toBe(false);
  });

  it('uppercases country and currency', () => {
    expect(formatOnboardingValue('country', 'py')).toBe('PY');
    expect(formatOnboardingValue('currency', 'usd')).toBe('USD');
  });

  it('trims other values', () => {
    expect(formatOnboardingValue('fullName', '  Juan  ')).toBe('Juan');
  });
});

describe('generateOnboardingSummary', () => {
  it('generates summary with all data', () => {
    const data = {
      fullName: 'Juan Pérez',
      email: 'juan@test.com',
      phone: '+595 981 123456',
      businessName: 'TechStore',
      businessType: 'Tienda online',
      category: 'Electrónica',
      country: 'PY',
      currency: 'USD',
      acceptedTerms: true,
      botUsername: 'techstore_bot1234',
    };

    const summary = generateOnboardingSummary(data);
    expect(summary).toContain('Juan Pérez');
    expect(summary).toContain('TechStore');
    expect(summary).toContain('Electrónica');
    expect(summary).toContain('PY');
    expect(summary).toContain('USD');
    expect(summary).toContain('techstore_bot1234');
  });
});

describe('generateBotUsername', () => {
  it('generates valid username', () => {
    const username = generateBotUsername('Mi Tienda');
    expect(username).toMatch(/^mi_tienda_bot\d{4}$/);
  });

  it('handles special characters', () => {
    const username = generateBotUsername('Tienda!@#$%');
    expect(username).toMatch(/^tienda_bot\d{4}$/);
  });

  it('limits length', () => {
    const username = generateBotUsername('Nombre Muy Largo De Tienda Online');
    expect(username.length).toBeLessThanOrEqual(32);
  });

  it('generates unique usernames', () => {
    const u1 = generateBotUsername('Test');
    const u2 = generateBotUsername('Test');
    expect(u1).not.toBe(u2);
  });
});
