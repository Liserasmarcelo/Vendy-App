import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from '../useAnalytics';

// Mock fetch
global.fetch = vi.fn();

describe('useAnalytics Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tracks and flushes events', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const { result } = renderHook(() => useAnalytics());

    // Track multiple events
    act(() => {
      result.current.trackPageView('catalog');
      result.current.trackProductView(1, 'iPhone');
      result.current.trackAddToCart(1, 2, 999);
    });

    // Manually flush
    await act(async () => {
      await result.current.flush();
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/analytics/track/batch',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('page_view'),
      })
    );
  });

  it('queues events before flush', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const { result } = renderHook(() => useAnalytics());

    // Track events without flushing
    act(() => {
      result.current.trackPageView('home');
      result.current.trackSearch('iPhone', 5);
    });

    // Events should be queued (not sent yet)
    expect(fetch).not.toHaveBeenCalled();

    // Flush should send them
    await act(async () => {
      await result.current.flush();
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on failure', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackPageView('catalog');
    });

    // First flush fails
    await act(async () => {
      await result.current.flush();
    });

    // Events should be back in queue
    // Second flush should succeed
    await act(async () => {
      await result.current.flush();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('generates unique session IDs', () => {
    const { result: result1 } = renderHook(() => useAnalytics());
    const { result: result2 } = renderHook(() => useAnalytics());

    expect(result1.current.sessionId).toBeTruthy();
    expect(result2.current.sessionId).toBeTruthy();
    expect(result1.current.sessionId).not.toBe(result2.current.sessionId);
  });
});
