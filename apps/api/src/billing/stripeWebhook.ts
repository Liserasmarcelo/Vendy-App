import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getBillingManager } from './billingManager';
import { getPlanManager } from '../subscriptions/planManager';

// ==========================================
// STRIPE WEBHOOK HANDLER
// ==========================================
export async function registerStripeWebhook(fastify: FastifyInstance, prisma: PrismaClient) {
  const billingManager = getBillingManager(prisma);
  const planManager = getPlanManager(prisma);

  fastify.post('/webhooks/stripe', async (request: FastifyRequest, reply: FastifyReply) => {
    const signature = request.headers['stripe-signature'] as string;
    const payload = request.body as any;

    // In a real implementation, verify signature with Stripe library
    // const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    const event = payload;

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object, billingManager, prisma);
          break;

        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object, billingManager, prisma);
          break;

        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object, planManager, prisma);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object, planManager, prisma);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object, planManager, prisma);
          break;

        case 'payment_method.attached':
          await handlePaymentMethodAttached(event.data.object, billingManager, prisma);
          break;

        default:
          console.log(`Unhandled Stripe event: ${event.type}`);
      }

      reply.send({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      reply.status(400).send({ error: 'Webhook processing failed' });
    }
  });
}

// ==========================================
// EVENT HANDLERS
// ==========================================
async function handlePaymentSucceeded(
  invoice: any,
  billingManager: any,
  prisma: PrismaClient
) {
  // Find our invoice by Stripe invoice ID
  const ourInvoice = await prisma.invoice.findFirst({
    where: { stripeInvoiceId: invoice.id },
  });

  if (ourInvoice) {
    await billingManager.markInvoicePaid(ourInvoice.id, invoice.payment_intent);
  }

  // Update subscription period
  if (invoice.subscription) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription },
      data: {
        status: 'active',
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000),
      },
    });
  }

  console.log(`Payment succeeded for invoice: ${invoice.id}`);
}

async function handlePaymentFailed(
  invoice: any,
  billingManager: any,
  prisma: PrismaClient
) {
  const ourInvoice = await prisma.invoice.findFirst({
    where: { stripeInvoiceId: invoice.id },
  });

  if (ourInvoice) {
    await billingManager.markInvoiceFailed(ourInvoice.id, invoice.last_payment_error?.message || 'Payment failed');
  }

  // Update subscription status if retry exhausted
  if (invoice.attempt_count >= 3 && invoice.subscription) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription },
      data: { status: 'past_due' },
    });
  }

  console.log(`Payment failed for invoice: ${invoice.id}`);
}

async function handleSubscriptionCreated(
  subscription: any,
  planManager: any,
  prisma: PrismaClient
) {
  // Find shop by Stripe customer ID
  const shop = await prisma.shop.findFirst({
    where: { stripeCustomerId: subscription.customer },
  });

  if (shop) {
    await prisma.subscription.updateMany({
      where: { shopId: shop.id },
      data: {
        stripeSubscriptionId: subscription.id,
        status: subscription.status === 'trialing' ? 'trial' : 'active',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  console.log(`Subscription created: ${subscription.id}`);
}

async function handleSubscriptionUpdated(
  subscription: any,
  planManager: any,
  prisma: PrismaClient
) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status === 'active' ? 'active' : subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  console.log(`Subscription updated: ${subscription.id}`);
}

async function handleSubscriptionDeleted(
  subscription: any,
  planManager: any,
  prisma: PrismaClient
) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'cancelled',
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`Subscription deleted: ${subscription.id}`);
}

async function handlePaymentMethodAttached(
  paymentMethod: any,
  billingManager: any,
  prisma: PrismaClient
) {
  const shop = await prisma.shop.findFirst({
    where: { stripeCustomerId: paymentMethod.customer },
  });

  if (shop) {
    await billingManager.addPaymentMethod({
      shopId: shop.id,
      type: 'card',
      last4: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
      expiryMonth: paymentMethod.card?.exp_month,
      expiryYear: paymentMethod.card?.exp_year,
      stripePaymentMethodId: paymentMethod.id,
    });
  }

  console.log(`Payment method attached: ${paymentMethod.id}`);
}
