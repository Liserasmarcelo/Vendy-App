import { useState, useEffect, useCallback } from 'react';

// ==========================================
// FUNNEL DATA TYPES
// ==========================================
interface FunnelStep {
  id: string;
  name: string;
  label: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
}

interface FunnelData {
  id: string;
  name: string;
  steps: FunnelStep[];
  totalConversionRate: number;
  totalDropOffRate: number;
  period: {
    start: string;
    end: string;
  };
}

interface FunnelComparison {
  current: FunnelData;
  previous: FunnelData;
  changes: Array<{
    stepId: string;
    stepLabel: string;
    countChange: number;
    rateChange: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

// ==========================================
// FUNNEL HOOK
// ==========================================
export function useFunnel(shopId: number, funnelType: string = 'purchase') {
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [comparison, setComparison] = useState<FunnelComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFunnel = useCallback(async (startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/funnels/${funnelType}?shopId=${shopId}&startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch funnel data');
      }

      const data = await response.json();
      setFunnel(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [shopId, funnelType]);

  const compareFunnels = useCallback(async (
    currentStart: string,
    currentEnd: string,
    previousStart: string,
    previousEnd: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/funnels/${funnelType}/compare?` +
        `shopId=${shopId}&` +
        `currentStart=${currentStart}&currentEnd=${currentEnd}&` +
        `previousStart=${previousStart}&previousEnd=${previousEnd}`
      );

      if (!response.ok) {
        throw new Error('Failed to compare funnels');
      }

      const data = await response.json();
      setComparison(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [shopId, funnelType]);

  return {
    funnel,
    comparison,
    isLoading,
    error,
    fetchFunnel,
    compareFunnels,
  };
}
