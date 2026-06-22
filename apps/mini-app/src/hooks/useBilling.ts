import { useState, useCallback } from 'react';

// ==========================================
// BILLING TYPES
// ==========================================
export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  description: string;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'crypto';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// ==========================================
// BILLING HOOK
// ==========================================
export function useBilling(shopId: number) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (options?: { status?: string; limit?: number }) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', String(options.limit));

      const response = await fetch(`/api/billing/${shopId}/invoices?${params}`);
      const data = await response.json();
      setInvoices(data.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const fetchPaymentMethods = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/billing/${shopId}/payment-methods`);
      const data = await response.json();
      setPaymentMethods(data.paymentMethods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const addPaymentMethod = useCallback(async (method: Omit<PaymentMethod, 'id'>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/billing/${shopId}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method),
      });

      if (!response.ok) {
        throw new Error('Failed to add payment method');
      }

      await fetchPaymentMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [shopId, fetchPaymentMethods]);

  const setDefaultPaymentMethod = useCallback(async (methodId: string) => {
    try {
      await fetch(`/api/billing/${shopId}/payment-methods/${methodId}/default`, {
        method: 'PATCH',
      });
      await fetchPaymentMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [shopId, fetchPaymentMethods]);

  const removePaymentMethod = useCallback(async (methodId: string) => {
    try {
      await fetch(`/api/billing/payment-methods/${methodId}`, {
        method: 'DELETE',
      });
      await fetchPaymentMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [fetchPaymentMethods]);

  const getProration = useCallback(async (newPlanId: string) => {
    try {
      const response = await fetch(`/api/billing/${shopId}/proration?newPlanId=${newPlanId}`);
      return await response.json();
    } catch (err) {
      return null;
    }
  }, [shopId]);

  return {
    invoices,
    paymentMethods,
    isLoading,
    error,
    fetchInvoices,
    fetchPaymentMethods,
    addPaymentMethod,
    setDefaultPaymentMethod,
    removePaymentMethod,
    getProration,
  };
}
