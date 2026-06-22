import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckout } from './useCheckout';

// Mock dependencies
vi.mock('./useApi', () => ({
  useApi: () => ({ request: vi.fn() }),
}));

vi.mock('../context/TelegramContext', () => ({
  useTelegram: () => ({
    haptic: { impact: vi.fn(), notification: vi.fn() },
    mainButton: { setText: vi.fn(), show: vi.fn(), hide: vi.fn() },
  }),
}));

describe('useCheckout', () => {
  it('initializes with empty form', () => {
    const { result } = renderHook(() => useCheckout());
    
    expect(result.current.formData.fullName).toBe('');
    expect(result.current.formData.phone).toBe('');
    expect(result.current.selectedPayment).toBe('stripe');
    expect(result.current.isSubmitting).toBe(false);
  });

  it('updates form fields', () => {
    const { result } = renderHook(() => useCheckout());
    
    act(() => {
      result.current.updateField('fullName', 'Juan Pérez');
    });
    
    expect(result.current.formData.fullName).toBe('Juan Pérez');
  });

  it('clears error when updating field', () => {
    const { result } = renderHook(() => useCheckout());
    
    // First validate to trigger errors
    act(() => {
      result.current.validate();
    });
    
    expect(result.current.errors.length).toBeGreaterThan(0);
    
    act(() => {
      result.current.updateField('fullName', 'Juan');
    });
    
    expect(result.current.errors).toHaveLength(0);
  });

  it('selects payment method', () => {
    const { result } = renderHook(() => useCheckout());
    
    act(() => {
      result.current.selectPayment('cash');
    });
    
    expect(result.current.selectedPayment).toBe('cash');
  });

  it('validates empty form', () => {
    const { result } = renderHook(() => useCheckout());
    
    act(() => {
      result.current.validate();
    });
    
    expect(result.current.errors.length).toBeGreaterThan(0);
    expect(result.current.errors.some(e => e.field === 'fullName')).toBe(true);
    expect(result.current.errors.some(e => e.field === 'phone')).toBe(true);
  });

  it('validates invalid phone', () => {
    const { result } = renderHook(() => useCheckout());
    
    act(() => {
      result.current.updateField('fullName', 'Juan Pérez');
      result.current.updateField('phone', '123');
      result.current.updateField('address', 'Calle 123');
      result.current.updateField('city', 'Asunción');
      result.current.updateField('country', 'PY');
    });
    
    act(() => {
      result.current.validate();
    });
    
    expect(result.current.errors.some(e => e.field === 'phone')).toBe(true);
  });

  it('validates invalid email', () => {
    const { result } = renderHook(() => useCheckout());
    
    act(() => {
      result.current.updateField('email', 'invalid-email');
    });
    
    act(() => {
      result.current.validate();
    });
    
    expect(result.current.errors.some(e => e.field === 'email')).toBe(true);
  });

  it('passes validation with valid data', () => {
    const { result } = renderHook(() => useCheckout());
    
    act(() => {
      result.current.updateField('fullName', 'Juan Pérez');
      result.current.updateField('phone', '+595 981 123456');
      result.current.updateField('email', 'juan@test.com');
      result.current.updateField('address', 'Av. España 1234');
      result.current.updateField('city', 'Asunción');
      result.current.updateField('country', 'PY');
    });
    
    act(() => {
      result.current.validate();
    });
    
    expect(result.current.errors).toHaveLength(0);
  });

  it('has 4 payment methods', () => {
    const { result } = renderHook(() => useCheckout());
    expect(result.current.paymentMethods).toHaveLength(4);
  });

  it('has stripe as default payment', () => {
    const { result } = renderHook(() => useCheckout());
    expect(result.current.selectedPayment).toBe('stripe');
  });

  it('crypto is disabled by default', () => {
    const { result } = renderHook(() => useCheckout());
    const crypto = result.current.paymentMethods.find(m => m.id === 'crypto');
    expect(crypto?.enabled).toBe(false);
  });
});
