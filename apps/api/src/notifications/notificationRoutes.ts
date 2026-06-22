import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getNotificationManager } from './notificationManager';

// ==========================================
// NOTIFICATION ROUTES
// ==========================================
export async function registerNotificationRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
  const manager = getNotificationManager(prisma);

  // Get notifications
  fastify.get('/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, status, limit, offset } = request.query as any;
    const userId = (request as any).user?.id || 'anonymous';

    const result = await manager.getNotifications(userId, {
      shopId: shopId ? parseInt(shopId) : undefined,
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    reply.send(result);
  });

  // Get unread count
  fastify.get('/notifications/unread', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.query as any;
    const userId = (request as any).user?.id || 'anonymous';

    const count = await manager.getUnreadCount(
      userId,
      shopId ? parseInt(shopId) : undefined
    );

    reply.send({ count });
  });

  // Mark as read
  fastify.patch('/notifications/:notificationId/read', async (request: FastifyRequest, reply: FastifyReply) => {
    const { notificationId } = request.params as { notificationId: string };

    try {
      const notification = await manager.markAsRead(notificationId);
      reply.send(notification);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to mark as read',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Mark all as read
  fastify.post('/notifications/read-all', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.query as any;
    const userId = (request as any).user?.id || 'anonymous';

    try {
      const count = await manager.markAllAsRead(
        userId,
        shopId ? parseInt(shopId) : undefined
      );
      reply.send({ count });
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to mark all as read',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get preferences
  fastify.get('/notifications/preferences', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.query as any;
    const userId = (request as any).user?.id || 'anonymous';

    const prefs = await manager.getPreferences(
      userId,
      shopId ? parseInt(shopId) : undefined
    );

    reply.send(prefs || { default: true });
  });

  // Update preferences
  fastify.patch('/notifications/preferences', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, channels, quietHours } = request.body as any;
    const userId = (request as any).user?.id || 'anonymous';

    try {
      const prefs = await manager.updatePreferences(userId, {
        shopId,
        channels,
        quietHours,
      });
      reply.send(prefs);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to update preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Push subscription
  fastify.post('/notifications/push-subscribe', async (request: FastifyRequest, reply: FastifyReply) => {
    const { endpoint, p256dh, auth } = request.body as any;
    const userId = (request as any).user?.id || 'anonymous';

    try {
      const sub = await manager.addPushSubscription(userId, { endpoint, p256dh, auth });
      reply.status(201).send(sub);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to subscribe',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Remove push subscription
  fastify.post('/notifications/push-unsubscribe', async (request: FastifyRequest, reply: FastifyReply) => {
    const { endpoint } = request.body as { endpoint: string };

    try {
      await manager.removePushSubscription(endpoint);
      reply.send({ success: true });
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to unsubscribe',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
