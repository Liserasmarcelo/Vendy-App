import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { Product } from '../types';

interface UseAdminProductsOptions {
  shopId: number;
  status?: 'active' | 'inactive' | 'all';
  category?: string;
  search?: string;
}

export function useAdminProducts(options: UseAdminProductsOptions) {
  const { request, loading, error } = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (options.status && options.status !== 'all') params.append('status', options.status);
    if (options.category) params.append('category', options.category);
    if (options.search) params.append('search', options.search);

    const response = await request<{ products: Product[] }>(`/shops/${options.shopId}/products?${params}`);
    if (response) {
      setProducts(response.products);
    }
  }, [request, options.shopId, options.status, options.category, options.search]);

  const createProduct = useCallback(async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsCreating(true);
    const response = await request<Product>(`/shops/${options.shopId}/products`, {
      method: 'POST',
      body: data,
    });
    setIsCreating(false);
    if (response) {
      setProducts(prev => [response, ...prev]);
    }
    return response;
  }, [request, options.shopId]);

  const updateProduct = useCallback(async (id: number, data: Partial<Product>) => {
    setIsUpdating(true);
    const response = await request<Product>(`/shops/${options.shopId}/products/${id}`, {
      method: 'PATCH',
      body: data,
    });
    setIsUpdating(false);
    if (response) {
      setProducts(prev => prev.map(p => p.id === id ? response : p));
    }
    return response;
  }, [request, options.shopId]);

  const deleteProduct = useCallback(async (id: number) => {
    setIsDeleting(true);
    const response = await request<{ success: boolean }>(`/shops/${options.shopId}/products/${id}`, {
      method: 'DELETE',
    });
    setIsDeleting(false);
    if (response?.success) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
    return response?.success || false;
  }, [request, options.shopId]);

  const toggleProductStatus = useCallback(async (id: number, isActive: boolean) => {
    return updateProduct(id, { isActive });
  }, [updateProduct]);

  return {
    products,
    loading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
  };
}
