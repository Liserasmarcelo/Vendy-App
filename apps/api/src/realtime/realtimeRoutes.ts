import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';
import { getSSEManager } from './sseManager';

// ==========================================
// REALTIME ROUTES
// ==========================================
export async function registerRealtimeRoutes(fastify: FastifyInstance, redis: Redis) {
  const sseManager = getSSEManager(redis);

  // SSE endpoint for real-time updates
  fastify.get('/realtime/:shopId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };

    // Validate shopId
    const shopIdNum = parseInt(shopId);
    if (isNaN(shopIdNum)) {
      return reply.status(400).send({ error: 'Invalid shopId' });
    }

    // Register SSE connection
    await sseManager.register(shopIdNum, request, reply);
  });

  // Get active connections
  fastify.get('/realtime/connections', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.query as { shopId?: string };
    const count = sseManager.getConnectionCount(shopId ? parseInt(shopId) : undefined);
    
    reply.send({
      activeConnections: count,
      shopId: shopId ? parseInt(shopId) : undefined,
    });
  });

  // Trigger test event (for development/testing)
  fastify.post('/realtime/test', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, event } = request.body as { shopId: number; event: any };

    await sseManager.publishEvent(shopId, {
      type: 'test',
      timestamp: new Date().toISOString(),
      ...event,
    });

    reply.send({ success: true });
  });
}
