import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdminOrders } from './useAdminOrders';

vi.mock('./useApi', () => ({
  useApi: () => ({ request: vi.fn(), loading: false, error: null }),
}));

describe('useAdminOrders', () => {
  it('initializes with empty orders and stats', () => {
    const { result } = renderHook(() => useAdminOrders({ shopId: 1 }));
    expect(result.current.orders).toEqual([]);
    expect(result.current.stats.total).toBe(0);
    expect(result.current.stats.pending).toBe(0);
    expect(result.current.stats.completed).toBe(0);
  });

  it('has updateOrderStatus function', () => {
    const { result } = renderHook(() => useAdminOrders({ shopId: 1 }));
    expect(typeof result.current.updateOrderStatus).toBe('function');
  });

  it('has cancelOrder function', () => {
    const { result } = renderHook(() => useAdminOrders({ shopId: 1 }));
    expect(typeof result.current.cancelOrder).toBe('function');
  });
});
