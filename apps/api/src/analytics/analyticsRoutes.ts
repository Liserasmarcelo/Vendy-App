import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { EventTracker, getEventTracker } from './eventTracker';

// ==========================================
// ANALYTICS ROUTES
// ==========================================
export async function registerAnalyticsRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient,
  redis: Redis
) {
  const tracker = getEventTracker(prisma, redis);

  // Track event
  fastify.post('/analytics/track', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type, shopId, metadata, source } = request.body as any;

    await tracker.track({
      type,
      shopId: parseInt(shopId),
      userId: request.user?.id?.toString(),
      sessionId: request.sessionId,
      metadata,
      source: source || 'api',
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      country: request.headers['cf-ipcountry'] as string,
      device: detectDevice(request.headers['user-agent']),
      platform: detectPlatform(request.headers['user-agent']),
    });

    reply.status(204).send();
  });

  // Track batch events
  fastify.post('/analytics/track/batch', async (request: FastifyRequest, reply: FastifyReply) => {
    const { events } = request.body as any;

    await tracker.trackMany(
      events.map((event: any) => ({
        ...event,
        shopId: parseInt(event.shopId),
        userId: request.user?.id?.toString(),
        sessionId: request.sessionId,
        source: event.source || 'api',
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      }))
    );

    reply.status(204).send();
  });

  // Get real-time stats
  fastify.get('/analytics/realtime', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, timeframe } = request.query as any;

    const stats = await tracker.getRealtimeStats(
      parseInt(shopId),
      timeframe || '24h'
    );

    reply.send(stats);
  });

  // Get aggregated stats
  fastify.get('/analytics/aggregated', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, startDate, endDate, groupBy } = request.query as any;

    const stats = await tracker.getAggregatedStats(
      parseInt(shopId),
      new Date(startDate),
      new Date(endDate),
      groupBy || 'day'
    );

    reply.send(stats);
  });

  // Get funnel data
  fastify.get('/analytics/funnel', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, startDate, endDate } = request.query as any;

    const funnel = await tracker.getFunnelData(
      parseInt(shopId),
      new Date(startDate),
      new Date(endDate)
    );

    reply.send(funnel);
  });

  // Get cohort analysis
  fastify.get('/analytics/cohorts', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, cohortSize } = request.query as any;

    const cohorts = await tracker.getCohortAnalysis(
      parseInt(shopId),
      cohortSize || 'week'
    );

    reply.send(cohorts);
  });

  // Get dashboard data
  fastify.get('/analytics/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.query as any;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [realtime, today, thisWeek, thisMonth, funnel] = await Promise.all([
      tracker.getRealtimeStats(parseInt(shopId), '1h'),
      tracker.getAggregatedStats(parseInt(shopId), startOfDay, now, 'hour'),
      tracker.getAggregatedStats(parseInt(shopId), startOfWeek, now, 'day'),
      tracker.getAggregatedStats(parseInt(shopId), startOfMonth, now, 'day'),
      tracker.getFunnelData(parseInt(shopId), startOfWeek, now),
    ]);

    reply.send({
      realtime,
      today,
      thisWeek,
      thisMonth,
      funnel,
    });
  });
}

// ==========================================
// DETECTION HELPERS
// ==========================================
function detectDevice(userAgent?: string): 'mobile' | 'tablet' | 'desktop' {
  if (!userAgent) return 'desktop';
  
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobile|iphone|android/.test(ua)) return 'mobile';
  return 'desktop';
}

function detectPlatform(userAgent?: string): 'ios' | 'android' | 'web' | 'desktop' {
  if (!userAgent) return 'desktop';
  
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/mac|win|linux/.test(ua)) return 'desktop';
  return 'web';
}
