import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFunnel } from '../useFunnel';

// Mock fetch
global.fetch = vi.fn();

describe('useFunnel Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches funnel data', async () => {
    const mockFunnel = {
      id: 'purchase_1_2024-06-01',
      name: 'Funnel de Compra',
      steps: [
        { id: 'visit', label: 'Visitas', count: 1000, conversionRate: 100, dropOffRate: 0 },
        { id: 'product', label: 'Productos', count: 600, conversionRate: 60, dropOffRate: 40 },
      ],
      totalConversionRate: 60,
      totalDropOffRate: 40,
      period: { start: '2024-06-01', end: '2024-06-30' },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFunnel),
    } as Response);

    const { result } = renderHook(() => useFunnel(1, 'purchase'));

    await act(async () => {
      await result.current.fetchFunnel('2024-06-01', '2024-06-30');
    });

    await waitFor(() => {
      expect(result.current.funnel).toBeDefined();
      expect(result.current.funnel?.name).toBe('Funnel de Compra');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('compares funnels', async () => {
    const mockComparison = {
      current: { name: 'Funnel de Compra', steps: [] },
      previous: { name: 'Funnel de Compra', steps: [] },
      changes: [
        { stepId: 'visit', stepLabel: 'Visitas', countChange: 100, rateChange: 5, trend: 'up' },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockComparison),
    } as Response);

    const { result } = renderHook(() => useFunnel(1, 'purchase'));

    await act(async () => {
      await result.current.compareFunnels(
        '2024-06-01',
        '2024-06-30',
        '2024-05-01',
        '2024-05-31'
      );
    });

    await waitFor(() => {
      expect(result.current.comparison).toBeDefined();
      expect(result.current.comparison?.changes).toHaveLength(1);
    });
  });

  it('handles fetch errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    } as Response);

    const { result } = renderHook(() => useFunnel(1, 'purchase'));

    await act(async () => {
      await result.current.fetchFunnel('2024-06-01', '2024-06-30');
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.funnel).toBeNull();
    });
  });

  it('sets loading state during fetch', async () => {
    vi.mocked(fetch).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => 
        resolve({ ok: true, json: () => Promise.resolve({}) } as Response), 100)
      )
    );

    const { result } = renderHook(() => useFunnel(1, 'purchase'));

    act(() => {
      result.current.fetchFunnel('2024-06-01', '2024-06-30');
    });

    expect(result.current.isLoading).toBe(true);
  });
});
