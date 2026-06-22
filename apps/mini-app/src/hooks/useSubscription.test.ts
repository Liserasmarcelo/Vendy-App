import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSubscription } from './useSubscription';

// Mock fetch
global.fetch = vi.fn();

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches plans', async () => {
    const mockPlans = {
      plans: [
        { id: 'inicial', name: 'Inicial', price: 0 },
        { id: 'crecimiento', name: 'Crecimiento', price: 15 },
        { id: 'pro', name: 'Pro', price: 49 },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPlans),
    } as Response);

    const { result } = renderHook(() => useSubscription(1));

    await act(async () => {
      await result.current.fetchPlans();
    });

    await waitFor(() => {
      expect(result.current.plans).toHaveLength(3);
      expect(result.current.plans[0].name).toBe('Inicial');
    });
  });

  it('fetches subscription', async () => {
    const mockSubscription = {
      id: 'sub_1',
      shopId: 1,
      planId: 'crecimiento',
      status: 'active',
      currentPeriodEnd: '2024-07-01',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscription),
    } as Response);

    const { result } = renderHook(() => useSubscription(1));

    await act(async () => {
      await result.current.fetchSubscription();
    });

    await waitFor(() => {
      expect(result.current.subscription).toEqual(mockSubscription);
    });
  });

  it('creates subscription', async () => {
    const mockSubscription = {
      id: 'sub_1',
      shopId: 1,
      planId: 'pro',
      status: 'trial',
      trialEndsAt: '2024-06-15',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscription),
    } as Response);

    const { result } = renderHook(() => useSubscription(1));

    const sub = await act(async () => {
      return await result.current.subscribe('pro', 14);
    });

    expect(sub.status).toBe('trial');
    expect(sub.trialEndsAt).toBeDefined();
  });

  it('changes plan', async () => {
    const mockSubscription = {
      id: 'sub_1',
      shopId: 1,
      planId: 'pro',
      status: 'active',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscription),
    } as Response);

    const { result } = renderHook(() => useSubscription(1));

    const sub = await act(async () => {
      return await result.current.changePlan('pro');
    });

    expect(sub.planId).toBe('pro');
  });

  it('cancels subscription', async () => {
    const mockSubscription = {
      id: 'sub_1',
      shopId: 1,
      planId: 'crecimiento',
      status: 'active',
      cancelAtPeriodEnd: true,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscription),
    } as Response);

    const { result } = renderHook(() => useSubscription(1));

    const sub = await act(async () => {
      return await result.current.cancel(true);
    });

    expect(sub.cancelAtPeriodEnd).toBe(true);
  });

  it('checks feature availability', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ available: true }),
    } as Response);

    const { result } = renderHook(() => useSubscription(1));

    const available = await act(async () => {
      return await result.current.checkFeature('customDomain');
    });

    expect(available).toBe(true);
  });

  it('checks usage limits', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ current: 45, limit: 50, exceeded: false }),
    } as Response);

    const { result } = renderHook(() => useSubscription(1));

    const limit = await act(async () => {
      return await result.current.checkLimit('products');
    });

    expect(limit.current).toBe(45);
    expect(limit.exceeded).toBe(false);
  });

  it('handles errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as Response);

    const { result } = renderHook(() => useSubscription(1));

    await expect(
      act(async () => {
        await result.current.subscribe('pro');
      })
    ).rejects.toThrow();
  });
});
