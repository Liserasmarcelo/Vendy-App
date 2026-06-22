import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getPlanManager } from './planManager';

// ==========================================
// PLAN ROUTES
// ==========================================
export async function registerPlanRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
  const manager = getPlanManager(prisma);

  // Get all plans
  fastify.get('/plans', async (request: FastifyRequest, reply: FastifyReply) => {
    const plans = await manager.getPlans();
    reply.send({ plans });
  });

  // Get plan by ID
  fastify.get('/plans/:planId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { planId } = request.params as { planId: string };
    const plan = await manager.getPlan(planId);

    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    reply.send(plan);
  });

  // Get current subscription
  fastify.get('/subscriptions/:shopId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };
    const subscription = await manager.getSubscription(parseInt(shopId));

    if (!subscription) {
      return reply.status(404).send({ error: 'No subscription found' });
    }

    reply.send(subscription);
  });

  // Create subscription
  fastify.post('/subscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, planId, trialDays, paymentMethod } = request.body as any;

    try {
      const subscription = await manager.createSubscription(parseInt(shopId), planId, {
        trialDays,
        paymentMethod,
      });

      reply.status(201).send(subscription);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to create subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Change plan
  fastify.patch('/subscriptions/:shopId/plan', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };
    const { planId } = request.body as { planId: string };

    try {
      const subscription = await manager.changePlan(parseInt(shopId), planId);
      reply.send(subscription);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to change plan',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Cancel subscription
  fastify.post('/subscriptions/:shopId/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };
    const { atPeriodEnd = true } = request.body as { atPeriodEnd?: boolean };

    try {
      const subscription = await manager.cancelSubscription(parseInt(shopId), atPeriodEnd);
      reply.send(subscription);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to cancel subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Check feature availability
  fastify.get('/subscriptions/:shopId/features/:feature', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, feature } = request.params as { shopId: string; feature: string };

    const isAvailable = await manager.checkFeature(parseInt(shopId), feature as any);
    reply.send({ available: isAvailable });
  });

  // Check usage limits
  fastify.get('/subscriptions/:shopId/limits/:type', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, type } = request.params as { shopId: string; type: string };

    const limit = await manager.checkLimit(parseInt(shopId), type as any);
    reply.send(limit);
  });

  // Get subscription status
  fastify.get('/subscriptions/:shopId/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };

    const status = await manager.getSubscriptionStatus(parseInt(shopId));
    reply.send(status);
  });
}
