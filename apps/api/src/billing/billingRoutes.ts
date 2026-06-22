import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getBillingManager } from './billingManager';

// ==========================================
// BILLING ROUTES
// ==========================================
export async function registerBillingRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
  const manager = getBillingManager(prisma);

  // Get invoices
  fastify.get('/billing/:shopId/invoices', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };
    const { limit, offset, status } = request.query as any;

    const invoices = await manager.getInvoices(parseInt(shopId), {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      status,
    });

    reply.send({ invoices });
  });

  // Get invoice by ID
  fastify.get('/billing/invoices/:invoiceId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { invoiceId } = request.params as { invoiceId: string };

    const invoice = await manager.getInvoice(invoiceId);
    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    reply.send(invoice);
  });

  // Get billing history
  fastify.get('/billing/:shopId/history', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };

    const history = await manager.getBillingHistory(parseInt(shopId));
    reply.send(history);
  });

  // Get payment methods
  fastify.get('/billing/:shopId/payment-methods', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };

    const methods = await manager.getPaymentMethods(parseInt(shopId));
    reply.send({ paymentMethods: methods });
  });

  // Add payment method
  fastify.post('/billing/:shopId/payment-methods', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };
    const { type, last4, brand, expiryMonth, expiryYear, stripePaymentMethodId } = request.body as any;

    try {
      const method = await manager.addPaymentMethod({
        shopId: parseInt(shopId),
        type,
        last4,
        brand,
        expiryMonth,
        expiryYear,
        stripePaymentMethodId,
      });

      reply.status(201).send(method);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to add payment method',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Set default payment method
  fastify.patch('/billing/:shopId/payment-methods/:methodId/default', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, methodId } = request.params as { shopId: string; methodId: string };

    try {
      await manager.setDefaultPaymentMethod(parseInt(shopId), methodId);
      reply.send({ success: true });
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to set default payment method',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Remove payment method
  fastify.delete('/billing/payment-methods/:methodId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { methodId } = request.params as { methodId: string };

    try {
      await manager.removePaymentMethod(methodId);
      reply.send({ success: true });
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to remove payment method',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Calculate proration
  fastify.get('/billing/:shopId/proration', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };
    const { newPlanId } = request.query as { newPlanId: string };

    if (!newPlanId) {
      return reply.status(400).send({ error: 'newPlanId is required' });
    }

    try {
      const proration = await manager.calculateProration(parseInt(shopId), newPlanId);
      reply.send(proration);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to calculate proration',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
