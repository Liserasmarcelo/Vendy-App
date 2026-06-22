import { useState, useCallback } from 'react';

// ==========================================
// BRAND CONFIG TYPES
// ==========================================
export interface BrandConfig {
  shopId: number;
  name: string;
  description?: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
  customDomain?: string;
  subdomain?: string;
}

// ==========================================
// BRAND HOOK
// ==========================================
export function useBrand(shopId: number) {
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrand = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/brand/${shopId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch brand config');
      }

      const data = await response.json();
      setBrand(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const updateBrand = useCallback(async (updates: Partial<BrandConfig>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/brand/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update brand config');
      }

      const data = await response.json();
      setBrand(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const validateDomain = useCallback(async (domain: string) => {
    try {
      const response = await fetch('/api/brand/domain/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      return await response.json();
    } catch (err) {
      return { valid: false, errors: ['Validation failed'] };
    }
  }, []);

  const configureDomain = useCallback(async (domain: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/brand/${shopId}/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        throw new Error('Failed to configure domain');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  return {
    brand,
    isLoading,
    error,
    fetchBrand,
    updateBrand,
    validateDomain,
    configureDomain,
  };
}
