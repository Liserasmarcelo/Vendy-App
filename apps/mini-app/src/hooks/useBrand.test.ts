import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBrand } from './useBrand';

// Mock fetch
global.fetch = vi.fn();

describe('useBrand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches brand config', async () => {
    const mockBrand = {
      shopId: 1,
      name: 'TechStore',
      primaryColor: '#FF7403',
      logo: 'https://example.com/logo.png',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBrand),
    } as Response);

    const { result } = renderHook(() => useBrand(1));

    await act(async () => {
      await result.current.fetchBrand();
    });

    await waitFor(() => {
      expect(result.current.brand).toEqual(mockBrand);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('updates brand config', async () => {
    const mockBrand = {
      shopId: 1,
      name: 'Nuevo Nombre',
      primaryColor: '#2196F3',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBrand),
    } as Response);

    const { result } = renderHook(() => useBrand(1));

    await act(async () => {
      await result.current.updateBrand({ name: 'Nuevo Nombre', primaryColor: '#2196F3' });
    });

    await waitFor(() => {
      expect(result.current.brand?.name).toBe('Nuevo Nombre');
    });
  });

  it('validates domain', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ valid: true, errors: [] }),
    } as Response);

    const { result } = renderHook(() => useBrand(1));

    const validation = await act(async () => {
      return await result.current.validateDomain('mitienda.com');
    });

    expect(validation.valid).toBe(true);
  });

  it('configures custom domain', async () => {
    const mockDomain = {
      domain: 'mitienda.com',
      shopId: 1,
      status: 'pending',
      dnsRecords: [],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDomain),
    } as Response);

    const { result } = renderHook(() => useBrand(1));

    const config = await act(async () => {
      return await result.current.configureDomain('mitienda.com');
    });

    expect(config.domain).toBe('mitienda.com');
  });

  it('handles fetch errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(() => useBrand(1));

    await act(async () => {
      await result.current.fetchBrand();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
