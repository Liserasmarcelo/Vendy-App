import { describe, it, expect } from 'vitest';
import { validateCheckoutForm, getFieldError, hasFieldError } from './validation';

describe('validateCheckoutForm', () => {
  it('returns errors for empty form', () => {
    const errors = validateCheckoutForm({
      fullName: '',
      phone: '',
      address: '',
      city: '',
      country: '',
    });
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'fullName')).toBe(true);
    expect(errors.some(e => e.field === 'phone')).toBe(true);
  });

  it('validates fullName minimum length', () => {
    const errors = validateCheckoutForm({
      fullName: 'A',
      phone: '+595 981 123456',
      address: 'Calle 123',
      city: 'Asunción',
      country: 'PY',
    });
    
    expect(errors.some(e => e.field === 'fullName')).toBe(true);
  });

  it('validates phone format', () => {
    const errors = validateCheckoutForm({
      fullName: 'Juan Pérez',
      phone: '123',
      address: 'Calle 123',
      city: 'Asunción',
      country: 'PY',
    });
    
    expect(errors.some(e => e.field === 'phone')).toBe(true);
  });

  it('validates email format', () => {
    const errors = validateCheckoutForm({
      fullName: 'Juan Pérez',
      phone: '+595 981 123456',
      email: 'invalid',
      address: 'Calle 123',
      city: 'Asunción',
      country: 'PY',
    });
    
    expect(errors.some(e => e.field === 'email')).toBe(true);
  });

  it('accepts valid email', () => {
    const errors = validateCheckoutForm({
      fullName: 'Juan Pérez',
      phone: '+595 981 123456',
      email: 'test@example.com',
      address: 'Calle 123',
      city: 'Asunción',
      country: 'PY',
    });
    
    expect(errors.some(e => e.field === 'email')).toBe(false);
  });

  it('validates address minimum length', () => {
    const errors = validateCheckoutForm({
      fullName: 'Juan Pérez',
      phone: '+595 981 123456',
      address: '123',
      city: 'Asunción',
      country: 'PY',
    });
    
    expect(errors.some(e => e.field === 'address')).toBe(true);
  });

  it('validates country code length', () => {
    const errors = validateCheckoutForm({
      fullName: 'Juan Pérez',
      phone: '+595 981 123456',
      address: 'Calle 123',
      city: 'Asunción',
      country: 'PAR',
    });
    
    expect(errors.some(e => e.field === 'country')).toBe(true);
  });

  it('passes with valid data', () => {
    const errors = validateCheckoutForm({
      fullName: 'Juan Pérez',
      phone: '+595 981 123456',
      email: 'juan@example.com',
      address: 'Av. España 1234',
      city: 'Asunción',
      state: 'Central',
      country: 'PY',
      postalCode: '001001',
    });
    
    expect(errors).toHaveLength(0);
  });
});

describe('getFieldError', () => {
  it('returns error message for field', () => {
    const errors = [{ field: 'fullName', message: 'Requerido' }];
    expect(getFieldError(errors, 'fullName')).toBe('Requerido');
  });

  it('returns undefined for non-existent field', () => {
    const errors = [{ field: 'fullName', message: 'Requerido' }];
    expect(getFieldError(errors, 'phone')).toBeUndefined();
  });
});

describe('hasFieldError', () => {
  it('returns true for field with error', () => {
    const errors = [{ field: 'fullName', message: 'Requerido' }];
    expect(hasFieldError(errors, 'fullName')).toBe(true);
  });

  it('returns false for field without error', () => {
    const errors = [{ field: 'fullName', message: 'Requerido' }];
    expect(hasFieldError(errors, 'phone')).toBe(false);
  });
});
