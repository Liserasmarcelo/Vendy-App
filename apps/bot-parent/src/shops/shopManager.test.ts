import { describe, it, expect, vi } from 'vitest';
import {
  Shop,
  fetchShop,
  fetchAdminShops,
  createShop,
  updateShop,
  deleteShop,
  toggleShopStatus,
  regenerateBotToken,
  formatShopMessage,
  formatShopList,
} from './shopManager';

// Mock fetch
vi.stubGlobal('fetch', vi.fn());

describe('fetchShop', () => {
  it('returns shop on success', async () => {
    const mockShop: Shop = {
      id: 1,
      name: 'Test Shop',
      description: 'Test',
      category: 'Electrónica',
      country: 'PY',
      currency: 'USD',
      status: 'active',
      primaryColor: '#FF7403',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockShop,
    } as Response);

    const result = await fetchShop(1, 123);
    expect(result).toEqual(mockShop);
  });

  it('returns mock on error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchShop(1, 123);
    expect(result).toBeTruthy();
    expect(result?.name).toBe('TechStore PY');
  });
});

describe('fetchAdminShops', () => {
  it('returns shops on success', async () => {
    const mockShops = [
      { id: 1, name: 'Shop 1', description: '', category: '', country: 'PY', currency: 'USD', status: 'active', primaryColor: '', createdAt: '', updatedAt: '' },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shops: mockShops }),
    } as Response);

    const result = await fetchAdminShops(123);
    expect(result).toHaveLength(1);
  });

  it('returns mock on error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchAdminShops(123);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('createShop', () => {
  it('creates shop', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, name: 'New Shop' }),
    } as Response);

    const result = await createShop({
      adminId: 123,
      name: 'New Shop',
      description: 'Test',
      category: 'Electrónica',
      country: 'PY',
      currency: 'USD',
    });

    expect(result.success).toBe(true);
  });
});

describe('updateShop', () => {
  it('updates shop', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, name: 'Updated' }),
    } as Response);

    const result = await updateShop(1, 123, { name: 'Updated' });
    expect(result.success).toBe(true);
  });
});

describe('deleteShop', () => {
  it('deletes shop', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
    const result = await deleteShop(1, 123);
    expect(result.success).toBe(true);
  });
});

describe('toggleShopStatus', () => {
  it('activates shop', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, status: 'active' }),
    } as Response);

    const result = await toggleShopStatus(1, 123, 'active');
    expect(result.success).toBe(true);
  });

  it('deactivates shop', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, status: 'inactive' }),
    } as Response);

    const result = await toggleShopStatus(1, 123, 'inactive');
    expect(result.success).toBe(true);
  });
});

describe('regenerateBotToken', () => {
  it('returns new token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'new_token_123' }),
    } as Response);

    const result = await regenerateBotToken(1, 123);
    expect(result.success).toBe(true);
    expect(result.token).toBe('new_token_123');
  });
});

describe('formatShopMessage', () => {
  it('formats active shop', () => {
    const shop: Shop = {
      id: 1,
      name: 'Test Shop',
      description: 'A test shop',
      category: 'Electrónica',
      country: 'PY',
      currency: 'USD',
      status: 'active',
      primaryColor: '#FF7403',
      botUsername: 'test_bot',
      createdAt: '2024-06-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
    };

    const message = formatShopMessage(shop);
    expect(message).toContain('Test Shop');
    expect(message).toContain('A test shop');
    expect(message).toContain('Electrónica');
    expect(message).toContain('PY');
    expect(message).toContain('USD');
    expect(message).toContain('🟢');
    expect(message).toContain('test_bot');
  });

  it('formats pending shop', () => {
    const shop: Shop = {
      id: 1,
      name: 'Pending Shop',
      description: 'Pending',
      category: 'Moda',
      country: 'AR',
      currency: 'ARS',
      status: 'pending',
      primaryColor: '#000',
      createdAt: '2024-06-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
    };

    const message = formatShopMessage(shop);
    expect(message).toContain('⏳');
    expect(message).toContain('PENDING');
  });
});

describe('formatShopList', () => {
  it('formats list with shops', () => {
    const shops: Shop[] = [
      { id: 1, name: 'Shop A', description: '', category: 'Electrónica', country: 'PY', currency: 'USD', status: 'active', primaryColor: '', createdAt: '', updatedAt: '' },
      { id: 2, name: 'Shop B', description: '', category: 'Moda', country: 'AR', currency: 'ARS', status: 'inactive', primaryColor: '', createdAt: '', updatedAt: '' },
    ];

    const message = formatShopList(shops);
    expect(message).toContain('Shop A');
    expect(message).toContain('Shop B');
    expect(message).toContain('🟢');
    expect(message).toContain('🔴');
  });

  it('formats empty list', () => {
    const message = formatShopList([]);
    expect(message).toContain('No tenés tiendas');
  });
});
