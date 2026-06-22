import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// ==========================================
// EVENT TYPES
// ==========================================
export type EventType = 
  | 'page_view'
  | 'product_view'
  | 'product_click'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_started'
  | 'checkout_completed'
  | 'payment_initiated'
  | 'payment_success'
  | 'payment_failed'
  | 'order_created'
  | 'order_cancelled'
  | 'search_query'
  | 'filter_applied'
  | 'category_view'
  | 'bot_command'
  | 'bot_message'
  | 'notification_opened'
  | 'notification_dismissed'
  | 'admin_login'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted';

export interface AnalyticsEvent {
  id?: string;
  type: EventType;
  shopId: number;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  source: 'mini_app' | 'bot_child' | 'bot_parent' | 'api';
  userAgent?: string;
  ip?: string;
  country?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  platform?: 'ios' | 'android' | 'web' | 'desktop';
}

// ==========================================
// EVENT TRACKER
// ==========================================
export class EventTracker {
  private prisma: PrismaClient;
  private redis: Redis;
  private batch: AnalyticsEvent[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5 seconds

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
    this.startFlushInterval();
  }

  // Track single event
  async track(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: AnalyticsEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    // Add to batch for efficient bulk insert
    this.batch.push(fullEvent);

    // Also store in Redis for real-time analytics
    await this.storeInRedis(fullEvent);

    // Flush if batch is full
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  // Track multiple events
  async trackMany(events: Omit<AnalyticsEvent, 'id' | 'timestamp'>[]): Promise<void> {
    for (const event of events) {
      await this.track(event);
    }
  }

  // Flush batch to database
  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const eventsToFlush = [...this.batch];
    this.batch = [];

    try {
      // Bulk insert to database
      await this.prisma.$executeRaw`
        INSERT INTO "AnalyticsEvent" (id, type, "shopId", "userId", "sessionId", metadata, timestamp, source, "userAgent", ip, country, device, platform)
        VALUES ${eventsToFlush.map(e => 
          `('${e.id}', '${e.type}', ${e.shopId}, ${e.userId ? `'${e.userId}'` : 'NULL'}, ${e.sessionId ? `'${e.sessionId}'` : 'NULL'}, ${e.metadata ? `'${JSON.stringify(e.metadata)}'::jsonb` : 'NULL'}, '${e.timestamp.toISOString()}', '${e.source}', ${e.userAgent ? `'${e.userAgent}'` : 'NULL'}, ${e.ip ? `'${e.ip}'` : 'NULL'}, ${e.country ? `'${e.country}'` : 'NULL'}, ${e.device ? `'${e.device}'` : 'NULL'}, ${e.platform ? `'${e.platform}'` : 'NULL'})`
        ).join(',')}
      `;
    } catch (error) {
      console.error('Error flushing analytics events:', error);
      // Put events back in batch for retry
      this.batch.unshift(...eventsToFlush);
    }
  }

  // Store in Redis for real-time access
  private async storeInRedis(event: AnalyticsEvent): Promise<void> {
    const key = `analytics:shop:${event.shopId}:${event.type}`;
    const hourKey = `analytics:shop:${event.shopId}:hourly:${this.getHourKey()}`;
    const dayKey = `analytics:shop:${event.shopId}:daily:${this.getDayKey()}`;

    const pipeline = this.redis.pipeline();
    
    // Increment counters
    pipeline.incr(`${key}:count`);
    pipeline.incr(`${hourKey}:${event.type}`);
    pipeline.incr(`${dayKey}:${event.type}`);
    
    // Add to sorted set for time series
    pipeline.zadd(`analytics:shop:${event.shopId}:events`, event.timestamp.getTime(), event.id);
    
    // Store event details (expire after 7 days)
    pipeline.setex(`analytics:event:${event.id}`, 604800, JSON.stringify(event));
    
    // Track unique users
    if (event.userId) {
      pipeline.sadd(`${dayKey}:users`, event.userId);
    }
    
    await pipeline.exec();
  }

  // Get real-time stats
  async getRealtimeStats(shopId: number, timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<any> {
    const now = Date.now();
    const timeframes = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000,
    };
    const startTime = now - timeframes[timeframe];

    // Get events from Redis sorted set
    const eventIds = await this.redis.zrangebyscore(
      `analytics:shop:${shopId}:events`,
      startTime,
      now
    );

    // Get event details
    const events = await Promise.all(
      eventIds.map(id => this.redis.get(`analytics:event:${id}`))
    );

    const parsedEvents = events
      .filter(Boolean)
      .map(e => JSON.parse(e!));

    // Calculate stats
    const stats = {
      totalEvents: parsedEvents.length,
      uniqueUsers: new Set(parsedEvents.filter(e => e.userId).map(e => e.userId)).size,
      eventsByType: this.groupByType(parsedEvents),
      eventsBySource: this.groupBySource(parsedEvents),
      eventsByHour: this.groupByHour(parsedEvents),
      topProducts: this.getTopProducts(parsedEvents),
      conversionRate: this.calculateConversionRate(parsedEvents),
    };

    return stats;
  }

  // Get aggregated stats from database
  async getAggregatedStats(
    shopId: number,
    startDate: Date,
    endDate: Date,
    groupBy: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<any> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, timestamp) as period,
        type,
        COUNT(*) as count,
        COUNT(DISTINCT "userId") as unique_users
      FROM "AnalyticsEvent"
      WHERE "shopId" = ${shopId}
        AND timestamp BETWEEN ${startDate} AND ${endDate}
      GROUP BY DATE_TRUNC(${groupBy}, timestamp), type
      ORDER BY period DESC, count DESC
    `;

    return result;
  }

  // Get funnel data
  async getFunnelData(shopId: number, startDate: Date, endDate: Date): Promise<any> {
    const steps = [
      { name: 'page_view', label: 'Visitas' },
      { name: 'product_view', label: 'Vistas de producto' },
      { name: 'add_to_cart', label: 'Agregados al carrito' },
      { name: 'checkout_started', label: 'Inicios de checkout' },
      { name: 'checkout_completed', label: 'Compras completadas' },
    ];

    const funnelData = await Promise.all(
      steps.map(async (step) => {
        const count = await this.prisma.analyticsEvent.count({
          where: {
            shopId,
            type: step.name as EventType,
            timestamp: { gte: startDate, lte: endDate },
          },
        });

        return {
          step: step.label,
          count,
          conversionRate: 0, // Calculated below
        };
      })
    );

    // Calculate conversion rates
    for (let i = 1; i < funnelData.length; i++) {
      const prevCount = funnelData[i - 1].count;
      const currCount = funnelData[i].count;
      funnelData[i].conversionRate = prevCount > 0 ? (currCount / prevCount) * 100 : 0;
    }

    return funnelData;
  }

  // Get cohort analysis
  async getCohortAnalysis(shopId: number, cohortSize: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    // Implementation would group users by first purchase date
    // and track retention over time
    // This is a simplified version
    return {
      cohorts: [],
      retentionRates: [],
    };
  }

  // Private helpers
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getHourKey(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}`;
  }

  private getDayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  }

  private groupByType(events: AnalyticsEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupBySource(events: AnalyticsEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.source] = (acc[event.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByHour(events: AnalyticsEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      const hour = new Date(event.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopProducts(events: AnalyticsEvent[]): Array<{ productId: string; views: number; adds: number }> {
    const productEvents = events.filter(e => 
      e.metadata?.productId && (e.type === 'product_view' || e.type === 'add_to_cart')
    );

    const stats = productEvents.reduce((acc, event) => {
      const productId = event.metadata!.productId;
      if (!acc[productId]) {
        acc[productId] = { productId, views: 0, adds: 0 };
      }
      if (event.type === 'product_view') acc[productId].views++;
      if (event.type === 'add_to_cart') acc[productId].adds++;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(stats)
      .sort((a: any, b: any) => b.views - a.views)
      .slice(0, 10);
  }

  private calculateConversionRate(events: AnalyticsEvent[]): number {
    const checkouts = events.filter(e => e.type === 'checkout_started').length;
    const completed = events.filter(e => e.type === 'checkout_completed').length;
    return checkouts > 0 ? (completed / checkouts) * 100 : 0;
  }

  private startFlushInterval(): void {
    setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  // Cleanup
  async dispose(): Promise<void> {
    await this.flush();
  }
}

// Singleton instance
let eventTracker: EventTracker | null = null;

export function getEventTracker(prisma: PrismaClient, redis: Redis): EventTracker {
  if (!eventTracker) {
    eventTracker = new EventTracker(prisma, redis);
  }
  return eventTracker;
}
