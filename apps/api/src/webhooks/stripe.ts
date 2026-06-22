import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';
import crypto from 'crypto';

// ==========================================
// CONFIGURATION
// ==========================================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// ==========================================
// TYPES
// ==========================================
interface StripeWebhookBody {
  id: string;
  object: string;
  type: string;
  data: {
    object: any;
  };
}

interface PaymentMetadata {
  orderId: string;
  shopId: string;
  customerTelegramId?: string;
}

// ==========================================
// WEBHOOK HANDLER
// ==========================================
export async function stripeWebhookHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const signature = request.headers['stripe-signature'] as string;
  
  if (!signature) {
    return reply.status(400).send({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    const payload = request.body as string;
    event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return reply.status(400).send({ error: 'Invalid signature' });
  }

  // Handle event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return reply.status(200).send({ received: true });
  } catch (err) {
    console.error('Error processing Stripe webhook:', err);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

// ==========================================
// EVENT HANDLERS
// ==========================================
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata as PaymentMetadata;
  
  console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
  console.log(`   Order: ${metadata.orderId}, Shop: ${metadata.shopId}`);

  // Update order status in database
  await updateOrderStatus(
    parseInt(metadata.orderId),
    parseInt(metadata.shopId),
    'completed',
    {
      paymentId: paymentIntent.id,
      paymentMethod: 'stripe',
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      paidAt: new Date().toISOString(),
    }
  );

  // Send notification to customer
  if (metadata.customerTelegramId) {
    await sendPaymentNotification(
      parseInt(metadata.customerTelegramId),
      metadata.orderId,
      'success',
      paymentIntent.amount / 100,
      paymentIntent.currency
    );
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata as PaymentMetadata;
  
  console.log(`❌ Payment failed: ${paymentIntent.id}`);
  console.log(`   Order: ${metadata.orderId}, Error: ${paymentIntent.last_payment_error?.message}`);

  await updateOrderStatus(
    parseInt(metadata.orderId),
    parseInt(metadata.shopId),
    'failed',
    {
      paymentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message || 'Payment failed',
      failedAt: new Date().toISOString(),
    }
  );

  if (metadata.customerTelegramId) {
    await sendPaymentNotification(
      parseInt(metadata.customerTelegramId),
      metadata.orderId,
      'failed',
      0,
      paymentIntent.currency
    );
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const metadata = charge.metadata as PaymentMetadata;
  
  console.log(`💰 Charge refunded: ${charge.id}`);

  await updateOrderStatus(
    parseInt(metadata.orderId),
    parseInt(metadata.shopId),
    'refunded',
    {
      refundId: charge.refunds?.data[0]?.id,
      refundAmount: charge.amount_refunded / 100,
      refundedAt: new Date().toISOString(),
    }
  );
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata as PaymentMetadata;
  
  console.log(`✅ Checkout completed: ${session.id}`);

  await updateOrderStatus(
    parseInt(metadata.orderId),
    parseInt(metadata.shopId),
    'completed',
    {
      sessionId: session.id,
      paymentMethod: 'stripe_checkout',
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || 'usd',
      paidAt: new Date().toISOString(),
    }
  );

  if (metadata.customerTelegramId) {
    await sendPaymentNotification(
      parseInt(metadata.customerTelegramId),
      metadata.orderId,
      'success',
      (session.amount_total || 0) / 100,
      session.currency || 'usd'
    );
  }
}

// ==========================================
// DATABASE HELPERS
// ==========================================
async function updateOrderStatus(
  orderId: number,
  shopId: number,
  status: string,
  paymentData: Record<string, any>
) {
  // In production, this would update the database via Prisma/Drizzle
  console.log(`📊 Updating order ${orderId} (shop ${shopId}) to status: ${status}`);
  console.log(`   Payment data:`, paymentData);
  
  // Mock implementation - replace with actual DB call
  // await db.update(orders)
  //   .set({ status, paymentData, updatedAt: new Date() })
  //   .where(and(eq(orders.id, orderId), eq(orders.shopId, shopId)));
}

// ==========================================
// NOTIFICATION HELPER
// ==========================================
async function sendPaymentNotification(
  telegramId: number,
  orderId: string,
  status: 'success' | 'failed' | 'refunded',
  amount: number,
  currency: string
) {
  // In production, send message via Telegram Bot API
  console.log(`📨 Notification to ${telegramId}: Order ${orderId} ${status}`);
  
  // Mock: would call bot.api.sendMessage()
  // await bot.api.sendMessage(telegramId, `...`);
}

// ==========================================
// ROUTE REGISTRATION
// ==========================================
export async function registerStripeWebhook(app: FastifyInstance) {
  app.post('/webhooks/stripe', {
    config: {
      rawBody: true, // Need raw body for signature verification
    },
  }, stripeWebhookHandler);
  
  console.log('✅ Stripe webhook registered: POST /webhooks/stripe');
}
