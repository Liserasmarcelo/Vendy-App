import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBilling } from './useBilling';

// Mock fetch
global.fetch = vi.fn();

describe('useBilling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches invoices', async () => {
    const mockInvoices = {
      invoices: [
        { id: 'inv_1', amount: 15, status: 'paid', description: 'Monthly', createdAt: '2024-06-01' },
        { id: 'inv_2', amount: 15, status: 'pending', description: 'Monthly', createdAt: '2024-07-01' },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockInvoices),
    } as Response);

    const { result } = renderHook(() => useBilling(1));

    await act(async () => {
      await result.current.fetchInvoices();
    });

    await waitFor(() => {
      expect(result.current.invoices).toHaveLength(2);
    });
  });

  it('fetches payment methods', async () => {
    const mockMethods = {
      paymentMethods: [
        { id: 'pm_1', type: 'card', last4: '4242', brand: 'visa', isDefault: true },
        { id: 'pm_2', type: 'card', last4: '1234', brand: 'mastercard', isDefault: false },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMethods),
    } as Response);

    const { result } = renderHook(() => useBilling(1));

    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    await waitFor(() => {
      expect(result.current.paymentMethods).toHaveLength(2);
      expect(result.current.paymentMethods[0].isDefault).toBe(true);
    });
  });

  it('adds payment method', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ paymentMethods: [] }),
      } as Response);

    const { result } = renderHook(() => useBilling(1));

    await act(async () => {
      await result.current.addPaymentMethod({
        type: 'card',
        last4: '4242',
        brand: 'visa',
        isDefault: false,
      });
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/billing/1/payment-methods',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('sets default payment method', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ paymentMethods: [] }),
      } as Response);

    const { result } = renderHook(() => useBilling(1));

    await act(async () => {
      await result.current.setDefaultPaymentMethod('pm_1');
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/billing/1/payment-methods/pm_1/default',
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('removes payment method', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ paymentMethods: [] }),
      } as Response);

    const { result } = renderHook(() => useBilling(1));

    await act(async () => {
      await result.current.removePaymentMethod('pm_1');
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/billing/payment-methods/pm_1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('gets proration', async () => {
    const mockProration = {
      currentPlanId: 'inicial',
      newPlanId: 'pro',
      daysRemaining: 15,
      amountDue: 25,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProration),
    } as Response);

    const { result } = renderHook(() => useBilling(1));

    const proration = await act(async () => {
      return await result.current.getProration('pro');
    });

    expect(proration?.amountDue).toBe(25);
  });

  it('handles fetch errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useBilling(1));

    await act(async () => {
      await result.current.fetchInvoices();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
