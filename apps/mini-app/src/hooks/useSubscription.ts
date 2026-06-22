import { useState, useCallback } from 'react';

// ==========================================
// SUBSCRIPTION TYPES
// ==========================================
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  commissionRate: number;
  features: {
    maxProducts: number;
    maxOrdersPerMonth: number;
    maxAdmins: number;
    maxStorageMB: number;
    analyticsLevel: string;
    customDomain: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    webhooks: boolean;
  };
}

export interface Subscription {
  id: string;
  shopId: number;
  planId: string;
  status: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
}

// ==========================================
// SUBSCRIPTION HOOK
// ==========================================
export function useSubscription(shopId: number) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      setPlans(data.plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const subscribe = useCallback(async (planId: string, trialDays?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, planId, trialDays }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      setSubscription(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const changePlan = useCallback(async (planId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/subscriptions/${shopId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error('Failed to change plan');
      }

      const data = await response.json();
      setSubscription(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const cancel = useCallback(async (atPeriodEnd: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/subscriptions/${shopId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atPeriodEnd }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      setSubscription(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const checkFeature = useCallback(async (feature: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${shopId}/features/${feature}`);
      const data = await response.json();
      return data.available;
    } catch {
      return false;
    }
  }, [shopId]);

  const checkLimit = useCallback(async (type: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${shopId}/limits/${type}`);
      return await response.json();
    } catch {
      return { current: 0, limit: 0, exceeded: true };
    }
  }, [shopId]);

  return {
    plans,
    subscription,
    isLoading,
    error,
    fetchPlans,
    fetchSubscription,
    subscribe,
    changePlan,
    cancel,
    checkFeature,
    checkLimit,
  };
}
