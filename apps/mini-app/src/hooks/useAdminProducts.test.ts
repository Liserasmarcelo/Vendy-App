import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminProducts } from './useAdminProducts';

vi.mock('./useApi', () => ({
  useApi: () => ({ request: vi.fn(), loading: false, error: null }),
}));

describe('useAdminProducts', () => {
  it('initializes with empty products', () => {
    const { result } = renderHook(() => useAdminProducts({ shopId: 1 }));
    expect(result.current.products).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('has create function', () => {
    const { result } = renderHook(() => useAdminProducts({ shopId: 1 }));
    expect(typeof result.current.createProduct).toBe('function');
  });

  it('has update function', () => {
    const { result } = renderHook(() => useAdminProducts({ shopId: 1 }));
    expect(typeof result.current.updateProduct).toBe('function');
  });

  it('has delete function', () => {
    const { result } = renderHook(() => useAdminProducts({ shopId: 1 }));
    expect(typeof result.current.deleteProduct).toBe('function');
  });

  it('has toggle function', () => {
    const { result } = renderHook(() => useAdminProducts({ shopId: 1 }));
    expect(typeof result.current.toggleProductStatus).toBe('function');
  });
});
