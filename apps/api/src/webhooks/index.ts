import { FastifyInstance } from 'fastify';
import { registerStripeWebhook } from './stripe';
import { registerTransferWebhooks } from './transfer';
import { registerCashWebhooks } from './cash';

// ==========================================
// REGISTER ALL WEBHOOKS
// ==========================================
export async function registerAllWebhooks(app: FastifyInstance) {
  await registerStripeWebhook(app);
  await registerTransferWebhooks(app);
  await registerCashWebhooks(app);
  
  console.log('✅ All webhooks registered successfully');
}

// ==========================================
// WEBHOOK SECURITY MIDDLEWARE
// ==========================================
export async function webhookSecurityMiddleware(
  request: any,
  reply: any,
  done: () => void
) {
  // Skip security for health checks
  if (request.url === '/health') {
    return done();
  }

  // Check for webhook-specific headers
  const isStripe = request.headers['stripe-signature'];
  const isTransfer = request.headers['x-transfer-webhook'];
  const isCash = request.headers['x-cash-webhook'];

  if (!isStripe && !isTransfer && !isCash) {
    // For non-webhook routes, apply standard auth
    return done();
  }

  // Validate webhook secrets if configured
  const webhookSecret = request.headers['x-webhook-secret'];
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (expectedSecret && webhookSecret !== expectedSecret) {
    return reply.status(401).send({ error: 'Invalid webhook secret' });
  }

  done();
}
