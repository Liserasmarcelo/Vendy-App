import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './useApi';
import { Product } from '../types';

interface UseProductsOptions {
  shopId?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'newest';
  limit?: number;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { request, loading, error } = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Ref to track current options for loadMore
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchProducts = useCallback(async (isInitial = true) => {
    const params = new URLSearchParams();
    
    if (options.shopId) params.append('shopId', options.shopId.toString());
    if (options.category && options.category !== 'all') params.append('category', options.category);
    if (options.search) params.append('search', options.search);
    if (options.minPrice !== undefined) params.append('minPrice', options.minPrice.toString());
    if (options.maxPrice !== undefined) params.append('maxPrice', options.maxPrice.toString());
    if (options.inStock !== undefined) params.append('inStock', options.inStock.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.limit) params.append('limit', options.limit.toString());
    if (!isInitial && cursor) params.append('cursor', cursor);

    const response = await request<ProductsResponse>(
      `/products?${params.toString()}`
    );

    if (response) {
      if (isInitial) {
        setProducts(response.products);
      } else {
        setProducts(prev => [...prev, ...response.products]);
      }
      setTotal(response.total);
      setHasMore(response.hasMore);
      setCursor(response.nextCursor);
    }
  }, [request, cursor, options.shopId, options.category, options.search, options.minPrice, options.maxPrice, options.inStock, options.sortBy, options.limit]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchProducts(false);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, fetchProducts]);

  const refresh = useCallback(async () => {
    setCursor(undefined);
    await fetchProducts(true);
  }, [fetchProducts]);

  // Initial fetch
  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  return {
    products,
    total,
    hasMore,
    loading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
  };
}
