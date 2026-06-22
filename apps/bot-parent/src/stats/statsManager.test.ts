import { describe, it, expect, vi } from 'vitest';
import {
  ShopStats,
  GlobalStats,
  fetchShopStats,
  fetchGlobalStats,
  fetchStatsComparison,
  formatShopStatsMessage,
  formatGlobalStatsMessage,
  formatComparisonMessage,
  formatRevenueChart,
  formatTopProducts,
} from './statsManager';

vi.stubGlobal('fetch', vi.fn());

describe('fetchShopStats', () => {
  it('returns stats on success', async () => {
    const mockStats: ShopStats = {
      shopId: 1,
      shopName: 'Test Shop',
      totalOrders: 10,
      totalRevenue: 1000,
      totalCustomers: 5,
      avgOrderValue: 100,
      conversionRate: 2.5,
      productsSold: 20,
      activeProducts: 15,
      lowStockProducts: 2,
      pendingOrders: 3,
      completedOrders: 7,
      cancelledOrders: 0,
      revenueByDay: [],
      topProducts: [],
      ordersByStatus: [],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    } as Response);

    const result = await fetchShopStats(1, 123);
    expect(result).toEqual(mockStats);
  });

  it('returns mock on error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchShopStats(1, 123);
    expect(result).toBeTruthy();
    expect(result?.shopName).toBe('TechStore PY');
  });
});

describe('fetchGlobalStats', () => {
  it('returns global stats', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totalShops: 5,
        totalOrders: 100,
        totalRevenue: 50000,
      }),
    } as Response);

    const result = await fetchGlobalStats(123);
    expect(result).toBeTruthy();
    expect(result?.totalShops).toBe(5);
  });

  it('returns mock on error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchGlobalStats(123);
    expect(result).toBeTruthy();
    expect(result?.totalShops).toBe(3);
  });
});

describe('fetchStatsComparison', () => {
  it('returns comparison', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        current: { totalRevenue: 1000, totalOrders: 10 },
        previous: { totalRevenue: 800, totalOrders: 8 },
      }),
    } as Response);

    const result = await fetchStatsComparison(1, 123, 'month');
    expect(result).toBeTruthy();
  });
});

describe('formatShopStatsMessage', () => {
  it('formats stats with trend up', () => {
    const stats: ShopStats = {
      shopId: 1,
      shopName: 'Test Shop',
      totalOrders: 45,
      totalRevenue: 12500,
      totalCustomers: 32,
      avgOrderValue: 278,
      conversionRate: 3.5,
      productsSold: 67,
      activeProducts: 23,
      lowStockProducts: 3,
      pendingOrders: 5,
      completedOrders: 38,
      cancelledOrders: 2,
      revenueByDay: [],
      topProducts: [],
      ordersByStatus: [],
    };

    const message = formatShopStatsMessage(stats);
    expect(message).toContain('Test Shop');
    expect(message).toContain('12,500');
    expect(message).toContain('45');
    expect(message).toContain('32');
    expect(message).toContain('3.5%');
    expect(message).toContain('📈');
    expect(message).toContain('⚠️');
  });

  it('formats stats with trend down', () => {
    const stats: ShopStats = {
      shopId: 1,
      shopName: 'Test Shop',
      totalOrders: 10,
      totalRevenue: 1000,
      totalCustomers: 5,
      avgOrderValue: 100,
      conversionRate: 2.0,
      productsSold: 15,
      activeProducts: 10,
      lowStockProducts: 0,
      pendingOrders: 2,
      completedOrders: 8,
      cancelledOrders: 0,
      revenueByDay: [],
      topProducts: [],
      ordersByStatus: [],
    };

    const message = formatShopStatsMessage(stats);
    expect(message).toContain('📉');
  });
});

describe('formatGlobalStatsMessage', () => {
  it('formats global stats', () => {
    const stats: GlobalStats = {
      totalShops: 3,
      activeShops: 2,
      totalOrders: 57,
      totalRevenue: 15900,
      totalCustomers: 89,
      avgOrderValue: 279,
      newShopsThisMonth: 1,
      newOrdersThisMonth: 23,
      revenueThisMonth: 6500,
      topShops: [
        { name: 'Shop A', revenue: 10000, orders: 40 },
        { name: 'Shop B', revenue: 5000, orders: 17 },
      ],
      growthRate: 15.5,
    };

    const message = formatGlobalStatsMessage(stats);
    expect(message).toContain('Estadísticas Globales');
    expect(message).toContain('3');
    expect(message).toContain('57');
    expect(message).toContain('15,900');
    expect(message).toContain('89');
    expect(message).toContain('15.5%');
    expect(message).toContain('Shop A');
    expect(message).toContain('Shop B');
    expect(message).toContain('📈');
  });

  it('shows negative growth', () => {
    const stats: GlobalStats = {
      totalShops: 2,
      activeShops: 1,
      totalOrders: 30,
      totalRevenue: 5000,
      totalCustomers: 40,
      avgOrderValue: 167,
      newShopsThisMonth: 0,
      newOrdersThisMonth: 10,
      revenueThisMonth: 2000,
      topShops: [],
      growthRate: -5.2,
    };

    const message = formatGlobalStatsMessage(stats);
    expect(message).toContain('📉');
    expect(message).toContain('-5.2%');
  });
});

describe('formatComparisonMessage', () => {
  it('formats positive comparison', () => {
    const current: ShopStats = {
      shopId: 1,
      shopName: 'Test',
      totalOrders: 10,
      totalRevenue: 1000,
      totalCustomers: 5,
      avgOrderValue: 100,
      conversionRate: 2,
      productsSold: 15,
      activeProducts: 10,
      lowStockProducts: 0,
      pendingOrders: 2,
      completedOrders: 8,
      cancelledOrders: 0,
      revenueByDay: [],
      topProducts: [],
      ordersByStatus: [],
    };

    const previous: ShopStats = {
      shopId: 1,
      shopName: 'Test',
      totalOrders: 8,
      totalRevenue: 800,
      totalCustomers: 4,
      avgOrderValue: 100,
      conversionRate: 2,
      productsSold: 12,
      activeProducts: 10,
      lowStockProducts: 0,
      pendingOrders: 2,
      completedOrders: 6,
      cancelledOrders: 0,
      revenueByDay: [],
      topProducts: [],
      ordersByStatus: [],
    };

    const message = formatComparisonMessage(current, previous, 'Mes');
    expect(message).toContain('Comparativa: Mes');
    expect(message).toContain('📈');
    expect(message).toContain('+200');
    expect(message).toContain('+2');
    expect(message).toContain('+1');
  });

  it('formats negative comparison', () => {
    const current: ShopStats = {
      shopId: 1,
      shopName: 'Test',
      totalOrders: 5,
      totalRevenue: 500,
      totalCustomers: 3,
      avgOrderValue: 100,
      conversionRate: 2,
      productsSold: 8,
      activeProducts: 10,
      lowStockProducts: 0,
      pendingOrders: 1,
      completedOrders: 4,
      cancelledOrders: 0,
      revenueByDay: [],
      topProducts: [],
      ordersByStatus: [],
    };

    const previous: ShopStats = {
      shopId: 1,
      shopName: 'Test',
      totalOrders: 8,
      totalRevenue: 800,
      totalCustomers: 4,
      avgOrderValue: 100,
      conversionRate: 2,
      productsSold: 12,
      activeProducts: 10,
      lowStockProducts: 0,
      pendingOrders: 2,
      completedOrders: 6,
      cancelledOrders: 0,
      revenueByDay: [],
      topProducts: [],
      ordersByStatus: [],
    };

    const message = formatComparisonMessage(current, previous, 'Semana');
    expect(message).toContain('📉');
    expect(message).toContain('-300');
    expect(message).toContain('-3');
    expect(message).toContain('-1');
  });
});

describe('formatRevenueChart', () => {
  it('formats chart', () => {
    const stats: ShopStats = {
      shopId: 1,
      shopName: 'Test',
      totalOrders: 10,
      totalRevenue: 1000,
      totalCustomers: 5,
      avgOrderValue: 100,
      conversionRate: 2,
      productsSold: 15,
      activeProducts: 10,
      lowStockProducts: 0,
      pendingOrders: 2,
      completedOrders: 8,
      cancelledOrders: 0,
      revenueByDay: [
        { date: '2024-06-14', revenue: 450, orders: 2 },
        { date: '2024-06-15', revenue: 890, orders: 3 },
        { date: '2024-06-16', revenue: 320, orders: 1 },
      ],
      topProducts: [],
      ordersByStatus: [],
    };

    const message = formatRevenueChart(stats);
    expect(message).toContain('Ingresos últimos 7 días');
    expect(message).toContain('█');
    expect(message).toContain('$890');
    expect(message).toContain('$450');
    expect(message).toContain('$320');
  });
});

describe('formatTopProducts', () => {
  it('formats top products', () => {
    const stats: ShopStats = {
      shopId: 1,
      shopName: 'Test',
      totalOrders: 10,
      totalRevenue: 1000,
      totalCustomers: 5,
      avgOrderValue: 100,
      conversionRate: 2,
      productsSold: 15,
      activeProducts: 10,
      lowStockProducts: 0,
      pendingOrders: 2,
      completedOrders: 8,
      cancelledOrders: 0,
      revenueByDay: [],
      topProducts: [
        { name: 'iPhone', quantity: 10, revenue: 10000 },
        { name: 'AirPods', quantity: 5, revenue: 1000 },
        { name: 'MacBook', quantity: 3, revenue: 3000 },
      ],
      ordersByStatus: [],
    };

    const message = formatTopProducts(stats);
    expect(message).toContain('🥇 iPhone');
    expect(message).toContain('🥈 AirPods');
    expect(message).toContain('🥉 MacBook');
    expect(message).toContain('10 vendidos');
    expect(message).toContain('$10,000');
  });
});
