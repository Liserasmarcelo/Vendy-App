import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from './useAnalytics';

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({ ok: true });

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tracks page view', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackPageView('catalog', { category: 'electronics' });
    });

    expect(result.current.sessionId).toBeTruthy();
  });

  it('tracks product view', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackProductView(1, 'iPhone 15 Pro');
    });

    expect(result.current.sessionId).toBeTruthy();
  });

  it('tracks add to cart', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackAddToCart(1, 2, 999);
    });

    expect(result.current.sessionId).toBeTruthy();
  });

  it('tracks checkout started', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackCheckoutStarted(1998, 2);
    });

    expect(result.current.sessionId).toBeTruthy();
  });

  it('tracks checkout completed', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackCheckoutCompleted('ORD-001', 1998, 'stripe');
    });

    expect(result.current.sessionId).toBeTruthy();
  });

  it('tracks search query', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackSearch('iPhone', 5);
    });

    expect(result.current.sessionId).toBeTruthy();
  });

  it('tracks filter applied', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackFilter('category', 'electronics');
    });

    expect(result.current.sessionId).toBeTruthy();
  });

  it('flushes events', async () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackPageView('catalog');
    });

    await act(async () => {
      await result.current.flush();
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/analytics/track/batch',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('generates unique session ID', () => {
    const { result: result1 } = renderHook(() => useAnalytics());
    const { result: result2 } = renderHook(() => useAnalytics());

    expect(result1.current.sessionId).not.toBe(result2.current.sessionId);
  });
});
