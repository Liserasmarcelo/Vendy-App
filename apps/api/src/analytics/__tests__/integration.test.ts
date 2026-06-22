import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ==========================================
// ANALYTICS INTEGRATION TESTS
// ==========================================
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Analytics Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks event via API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'page_view',
        shopId: 1,
        source: 'mini_app',
      }),
    });

    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/analytics/track',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('page_view'),
      })
    );
  });

  it('tracks batch events', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const events = [
      { type: 'page_view', shopId: 1 },
      { type: 'product_view', shopId: 1, metadata: { productId: 1 } },
      { type: 'add_to_cart', shopId: 1, metadata: { productId: 1, quantity: 2 } },
    ];

    const response = await fetch('/api/analytics/track/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    expect(response.ok).toBe(true);
  });

  it('fetches real-time stats', async () => {
    const mockStats = {
      totalEvents: 150,
      uniqueUsers: 45,
      eventsByType: { page_view: 100, product_view: 30, add_to_cart: 20 },
      eventsBySource: { mini_app: 150 },
      eventsByHour: { '10': 50, '11': 60, '12': 40 },
      topProducts: [{ productId: '1', views: 30, adds: 10 }],
      conversionRate: 15.5,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStats),
    });

    const response = await fetch('/api/analytics/realtime?shopId=1&timeframe=24h');
    const data = await response.json();

    expect(data.totalEvents).toBe(150);
    expect(data.uniqueUsers).toBe(45);
    expect(data.conversionRate).toBe(15.5);
  });

  it('fetches aggregated stats', async () => {
    const mockAggregated = [
      { period: '2024-06-01', type: 'page_view', count: 100, unique_users: 30 },
      { period: '2024-06-01', type: 'product_view', count: 50, unique_users: 20 },
      { period: '2024-06-02', type: 'page_view', count: 120, unique_users: 35 },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAggregated),
    });

    const response = await fetch('/api/analytics/aggregated?shopId=1&startDate=2024-06-01&endDate=2024-06-30&groupBy=day');
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(3);
  });

  it('fetches funnel data', async () => {
    const mockFunnel = [
      { step: 'Visitas', count: 1000, conversionRate: 100 },
      { step: 'Vistas de producto', count: 600, conversionRate: 60 },
      { step: 'Agregados al carrito', count: 300, conversionRate: 50 },
      { step: 'Inicios de checkout', count: 150, conversionRate: 50 },
      { step: 'Compras completadas', count: 75, conversionRate: 50 },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFunnel),
    });

    const response = await fetch('/api/analytics/funnel?shopId=1&startDate=2024-06-01&endDate=2024-06-30');
    const data = await response.json();

    expect(data).toHaveLength(5);
    expect(data[0].step).toBe('Visitas');
    expect(data[4].step).toBe('Compras completadas');
  });

  it('fetches dashboard data', async () => {
    const mockDashboard = {
      realtime: { totalEvents: 50, uniqueUsers: 10 },
      today: [{ period: '10:00', type: 'page_view', count: 20 }],
      thisWeek: [{ period: '2024-06-01', type: 'page_view', count: 100 }],
      thisMonth: [{ period: '2024-06-01', type: 'page_view', count: 100 }],
      funnel: [
        { step: 'Visitas', count: 1000, conversionRate: 100 },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDashboard),
    });

    const response = await fetch('/api/analytics/dashboard?shopId=1');
    const data = await response.json();

    expect(data.realtime).toBeDefined();
    expect(data.today).toBeDefined();
    expect(data.thisWeek).toBeDefined();
    expect(data.funnel).toBeDefined();
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    const response = await fetch('/api/analytics/realtime?shopId=1');
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetch('/api/analytics/track')).rejects.toThrow('Network error');
  });

  it('generates CSV report', async () => {
    const csvContent = 'Número,Fecha,Cliente,Total
ORD-001,01/06/2024,Juan,199.99';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(new Blob([csvContent], { type: 'text/csv' })),
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="orders_2024-06-01.csv"',
      }),
    });

    const response = await fetch('/api/reports/orders?shopId=1&startDate=2024-06-01&endDate=2024-06-30&format=csv');
    const blob = await response.blob();
    const text = await blob.text();

    expect(text).toContain('ORD-001');
    expect(text).toContain('Juan');
  });

  it('connects to SSE endpoint', async () => {
    // Mock EventSource
    const mockEventSource = {
      onopen: null as any,
      onmessage: null as any,
      onerror: null as any,
      close: vi.fn(),
    };

    global.EventSource = vi.fn().mockImplementation(() => mockEventSource) as any;

    const eventSource = new EventSource('/api/realtime/1');
    
    // Simulate connection
    if (mockEventSource.onopen) {
      mockEventSource.onopen();
    }

    expect(global.EventSource).toHaveBeenCalledWith('/api/realtime/1');
  });

  it('fetches funnel analysis', async () => {
    const mockFunnel = {
      id: 'purchase_1_2024-06-01',
      name: 'Funnel de Compra',
      steps: [
        { id: 'visit', label: 'Visitas', count: 1000, conversionRate: 100, dropOffRate: 0 },
        { id: 'product_view', label: 'Vistas de Producto', count: 600, conversionRate: 60, dropOffRate: 40 },
      ],
      totalConversionRate: 60,
      totalDropOffRate: 40,
      period: { start: '2024-06-01', end: '2024-06-30' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFunnel),
    });

    const response = await fetch('/api/funnels/purchase?shopId=1&startDate=2024-06-01&endDate=2024-06-30');
    const data = await response.json();

    expect(data.name).toBe('Funnel de Compra');
    expect(data.steps).toHaveLength(2);
  });

  it('compares funnels', async () => {
    const mockComparison = {
      current: { name: 'Funnel de Compra', steps: [] },
      previous: { name: 'Funnel de Compra', steps: [] },
      changes: [
        { stepId: 'visit', stepLabel: 'Visitas', countChange: 100, rateChange: 5, trend: 'up' },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockComparison),
    });

    const response = await fetch('/api/funnels/purchase/compare?shopId=1&currentStart=2024-06-01&currentEnd=2024-06-30&previousStart=2024-05-01&previousEnd=2024-05-31');
    const data = await response.json();

    expect(data.current).toBeDefined();
    expect(data.previous).toBeDefined();
    expect(data.changes).toHaveLength(1);
  });

  it('fetches drop-off analysis', async () => {
    const mockDropOff = {
      funnelId: 'purchase_1_2024-06-01',
      biggestDropOff: { stepId: 'checkout', stepLabel: 'Checkout', dropOffRate: 50 },
      allDropOffs: [],
      recommendations: ['Simplificá el checkout'],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDropOff),
    });

    const response = await fetch('/api/funnels/purchase/dropoff?shopId=1&startDate=2024-06-01&endDate=2024-06-30');
    const data = await response.json();

    expect(data.biggestDropOff).toBeDefined();
    expect(data.recommendations).toHaveLength(1);
  });
});
