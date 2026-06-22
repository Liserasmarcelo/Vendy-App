import { describe, it, expect, vi } from 'vitest';

// ==========================================
// ANALYTICS E2E TESTS
// ==========================================
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Analytics E2E', () => {
  it('complete analytics flow: track → analyze → report', async () => {
    // Step 1: Track events
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'page_view',
        shopId: 1,
        source: 'mini_app',
      }),
    });

    // Step 2: Get real-time stats
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        totalEvents: 1,
        uniqueUsers: 1,
        eventsByType: { page_view: 1 },
        conversionRate: 0,
      }),
    });

    const statsResponse = await fetch('/api/analytics/realtime?shopId=1');
    const stats = await statsResponse.json();
    expect(stats.totalEvents).toBe(1);

    // Step 3: Get funnel data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { step: 'Visitas', count: 100, conversionRate: 100 },
        { step: 'Compra', count: 10, conversionRate: 10 },
      ]),
    });

    const funnelResponse = await fetch('/api/analytics/funnel?shopId=1&startDate=2024-06-01&endDate=2024-06-30');
    const funnel = await funnelResponse.json();
    expect(funnel).toHaveLength(2);

    // Step 4: Generate report
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(new Blob(['test'], { type: 'text/csv' })),
    });

    const reportResponse = await fetch('/api/reports/orders?shopId=1&startDate=2024-06-01&endDate=2024-06-30&format=csv');
    expect(reportResponse.ok).toBe(true);
  });

  it('real-time dashboard flow', async () => {
    // Connect to SSE
    const mockEventSource = {
      onopen: null as any,
      onmessage: null as any,
      onerror: null as any,
      close: vi.fn(),
    };

    global.EventSource = vi.fn().mockImplementation(() => mockEventSource) as any;

    const eventSource = new EventSource('/api/realtime/1');

    // Simulate connection and metrics
    if (mockEventSource.onopen) mockEventSource.onopen();

    if (mockEventSource.onmessage) {
      mockEventSource.onmessage({
        data: JSON.stringify({
          type: 'metrics',
          data: {
            activeUsers: 5,
            todayOrders: 12,
            todayRevenue: 1500,
            conversionRate: 3.5,
          },
        }),
      });
    }

    expect(global.EventSource).toHaveBeenCalledWith('/api/realtime/1');
  });

  it('funnel analysis and recommendations', async () => {
    // Get funnel analysis
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 'purchase_1_2024-06-01',
        name: 'Funnel de Compra',
        steps: [
          { id: 'visit', label: 'Visitas', count: 1000, conversionRate: 100, dropOffRate: 0 },
          { id: 'product_view', label: 'Productos', count: 500, conversionRate: 50, dropOffRate: 50 },
          { id: 'add_cart', label: 'Carrito', count: 200, conversionRate: 40, dropOffRate: 60 },
          { id: 'checkout', label: 'Checkout', count: 100, conversionRate: 50, dropOffRate: 50 },
          { id: 'purchase', label: 'Compra', count: 50, conversionRate: 50, dropOffRate: 50 },
        ],
        totalConversionRate: 5,
        totalDropOffRate: 95,
      }),
    });

    const funnelResponse = await fetch('/api/funnels/purchase?shopId=1&startDate=2024-06-01&endDate=2024-06-30');
    const funnel = await funnelResponse.json();

    expect(funnel.totalConversionRate).toBe(5);
    expect(funnel.steps).toHaveLength(5);

    // Get drop-off analysis
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        biggestDropOff: { stepId: 'add_cart', stepLabel: 'Carrito', dropOffRate: 60 },
        recommendations: [
          'Considerá agregar reviews o fotos de clientes',
          'Ofrecé envío gratis o descuentos',
        ],
      }),
    });

    const dropOffResponse = await fetch('/api/funnels/purchase/dropoff?shopId=1&startDate=2024-06-01&endDate=2024-06-30');
    const dropOff = await dropOffResponse.json();

    expect(dropOff.biggestDropOff.stepLabel).toBe('Carrito');
    expect(dropOff.recommendations.length).toBeGreaterThan(0);
  });

  it('scheduled report generation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        message: 'Report scheduled',
        schedule: {
          type: 'sales',
          shopId: 1,
          frequency: 'weekly',
          email: 'admin@example.com',
          nextRun: '2024-06-08T00:00:00Z',
        },
      }),
    });

    const response = await fetch('/api/reports/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sales',
        shopId: 1,
        frequency: 'weekly',
        email: 'admin@example.com',
        format: 'csv',
      }),
    });

    const data = await response.json();
    expect(data.message).toBe('Report scheduled');
    expect(data.schedule.frequency).toBe('weekly');
  });
});
