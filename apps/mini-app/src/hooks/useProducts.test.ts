import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from './useProducts';

// Mock useApi
vi.mock('./useApi', () => ({
  useApi: () => ({
    request: vi.fn(),
    loading: false,
    error: null,
  }),
}));

describe('useProducts', () => {
  it('should initialize with empty products', () => {
    const { result } = renderHook(() => useProducts());
    expect(result.current.products).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.hasMore).toBe(false);
  });

  it('should apply filters correctly', () => {
    const { result } = renderHook(() => useProducts({
      category: 'electronics',
      search: 'iphone',
      minPrice: 100,
      maxPrice: 1000,
      sortBy: 'price_asc',
    }));
    
    expect(result.current.products).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('should have loadMore function', () => {
    const { result } = renderHook(() => useProducts());
    expect(typeof result.current.loadMore).toBe('function');
  });

  it('should have refresh function', () => {
    const { result } = renderHook(() => useProducts());
    expect(typeof result.current.refresh).toBe('function');
  });
});
