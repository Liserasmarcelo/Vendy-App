import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { Order } from '../types';

interface UseAdminOrdersOptions {
  shopId: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function useAdminOrders(options: UseAdminOrdersOptions) {
  const { request, loading, error } = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
  });

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.dateFrom) params.append('dateFrom', options.dateFrom);
    if (options.dateTo) params.append('dateTo', options.dateTo);
    if (options.search) params.append('search', options.search);

    const response = await request<{ orders: Order[]; stats: typeof stats }>(
      `/shops/${options.shopId}/orders?${params}`
    );
    if (response) {
      setOrders(response.orders);
      setStats(response.stats);
    }
  }, [request, options.shopId, options.status, options.dateFrom, options.dateTo, options.search]);

  const updateOrderStatus = useCallback(async (orderId: number, status: Order['status']) => {
    const response = await request<Order>(`/shops/${options.shopId}/orders/${orderId}`, {
      method: 'PATCH',
      body: { status },
    });
    if (response) {
      setOrders(prev => prev.map(o => o.id === orderId ? response : o));
    }
    return response;
  }, [request, options.shopId]);

  const cancelOrder = useCallback(async (orderId: number) => {
    return updateOrderStatus(orderId, 'cancelled');
  }, [updateOrderStatus]);

  return {
    orders,
    stats,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
    cancelOrder,
  };
}
