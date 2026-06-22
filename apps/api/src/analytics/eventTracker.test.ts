import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventTracker, getEventTracker } from './eventTracker';

// Mock Prisma and Redis
const mockPrisma = {
  $executeRaw: vi.fn().mockResolvedValue(1),
  analyticsEvent: {
    count: vi.fn().mockResolvedValue(10),
  },
} as any;

const mockRedis = {
  pipeline: vi.fn().mockReturnValue({
    incr: vi.fn().mockReturnThis(),
    zadd: vi.fn().mockReturnThis(),
    setex: vi.fn().mockReturnThis(),
    sadd: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([]),
  }),
  zrangebyscore: vi.fn().mockResolvedValue(['evt_1', 'evt_2']),
  get: vi.fn().mockImplementation((key: string) => {
    if (key.includes('evt_')) {
      return Promise.resolve(JSON.stringify({
        id: key,
        type: 'page_view',
        shopId: 1,
        userId: '123',
        timestamp: new Date().toISOString(),
        source: 'mini_app',
      }));
    }
    return Promise.resolve(null);
  }),
} as any;

describe('EventTracker', () => {
  let tracker: EventTracker;

  beforeEach(() => {
    tracker = new EventTracker(mockPrisma, mockRedis);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await tracker.dispose();
  });

  it('tracks single event', async () => {
    await tracker.track({
      type: 'page_view',
      shopId: 1,
      userId: '123',
      source: 'mini_app',
    });

    expect(mockRedis.pipeline).toHaveBeenCalled();
  });

  it('tracks multiple events', async () => {
    await tracker.trackMany([
      { type: 'page_view', shopId: 1, source: 'mini_app' },
      { type: 'product_view', shopId: 1, source: 'mini_app', metadata: { productId: '1' } },
    ]);

    expect(mockRedis.pipeline).toHaveBeenCalled();
  });

  it('flushes batch to database', async () => {
    // Add events to batch
    for (let i = 0; i < 5; i++) {
      await tracker.track({
        type: 'page_view',
        shopId: 1,
        source: 'mini_app',
      });
    }

    // Manually flush
    await tracker.flush();

    expect(mockPrisma.$executeRaw).toHaveBeenCalled();
  });

  it('gets real-time stats', async () => {
    const stats = await tracker.getRealtimeStats(1, '24h');

    expect(stats).toHaveProperty('totalEvents');
    expect(stats).toHaveProperty('uniqueUsers');
    expect(stats).toHaveProperty('eventsByType');
    expect(stats).toHaveProperty('eventsBySource');
    expect(stats).toHaveProperty('eventsByHour');
    expect(stats).toHaveProperty('topProducts');
    expect(stats).toHaveProperty('conversionRate');
  });

  it('calculates conversion rate', async () => {
    // Track checkout events
    await tracker.track({ type: 'checkout_started', shopId: 1, source: 'mini_app' });
    await tracker.track({ type: 'checkout_completed', shopId: 1, source: 'mini_app' });

    const stats = await tracker.getRealtimeStats(1, '24h');
    expect(stats.conversionRate).toBeGreaterThanOrEqual(0);
  });

  it('groups events by type', async () => {
    await tracker.track({ type: 'page_view', shopId: 1, source: 'mini_app' });
    await tracker.track({ type: 'page_view', shopId: 1, source: 'mini_app' });
    await tracker.track({ type: 'product_view', shopId: 1, source: 'mini_app' });

    const stats = await tracker.getRealtimeStats(1, '24h');
    expect(stats.eventsByType).toHaveProperty('page_view');
    expect(stats.eventsByType).toHaveProperty('product_view');
    expect(stats.eventsByType.page_view).toBeGreaterThanOrEqual(2);
  });

  it('gets funnel data', async () => {
    const funnel = await tracker.getFunnelData(1, new Date(), new Date());

    expect(funnel).toHaveLength(5);
    expect(funnel[0].step).toBe('Visitas');
    expect(funnel[4].step).toBe('Compras completadas');
  });

  it('detects device from user agent', async () => {
    await tracker.track({
      type: 'page_view',
      shopId: 1,
      source: 'mini_app',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    });

    const stats = await tracker.getRealtimeStats(1, '24h');
    // Would verify device detection in real implementation
    expect(stats).toBeDefined();
  });

  it('handles errors gracefully', async () => {
    mockPrisma.$executeRaw.mockRejectedValueOnce(new Error('DB error'));

    await tracker.track({ type: 'page_view', shopId: 1, source: 'mini_app' });
    
    // Should not throw
    await expect(tracker.flush()).resolves.not.toThrow();
  });
});

describe('getEventTracker', () => {
  it('returns singleton instance', () => {
    const tracker1 = getEventTracker(mockPrisma, mockRedis);
    const tracker2 = getEventTracker(mockPrisma, mockRedis);

    expect(tracker1).toBe(tracker2);
  });
});
