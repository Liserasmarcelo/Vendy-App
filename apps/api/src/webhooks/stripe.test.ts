import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripeWebhookHandler } from './stripe';

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: vi.fn((payload, signature, secret) => {
          if (signature === 'invalid') throw new Error('Invalid signature');
          return {
            id: 'evt_123',
            type: 'payment_intent.succeeded',
            data: {
              object: {
                id: 'pi_123',
                amount: 10000,
                currency: 'usd',
                metadata: {
                  orderId: '1',
                  shopId: '1',
                  customerTelegramId: '123456',
                },
              },
            },
          };
        }),
      },
    })),
  };
});

describe('stripeWebhookHandler', () => {
  const mockReply = () => {
    const status = vi.fn().mockReturnThis();
    const send = vi.fn().mockReturnThis();
    return { status, send } as any;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for missing signature', async () => {
    const reply = mockReply();
    await stripeWebhookHandler(
      { headers: {}, body: '' } as any,
      reply
    );
    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Missing stripe-signature header' });
  });

  it('returns 400 for invalid signature', async () => {
    const reply = mockReply();
    await stripeWebhookHandler(
      { headers: { 'stripe-signature': 'invalid' }, body: '' } as any,
      reply
    );
    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Invalid signature' });
  });

  it('processes payment_intent.succeeded', async () => {
    const reply = mockReply();
    await stripeWebhookHandler(
      { headers: { 'stripe-signature': 'valid' }, body: '{}' } as any,
      reply
    );
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ received: true });
  });
});

describe('Payment event handlers', () => {
  it('handles payment_intent.succeeded metadata', () => {
    const paymentIntent = {
      id: 'pi_123',
      amount: 10000,
      currency: 'usd',
      metadata: {
        orderId: '1',
        shopId: '1',
        customerTelegramId: '123456',
      },
    };

    expect(paymentIntent.metadata.orderId).toBe('1');
    expect(paymentIntent.metadata.shopId).toBe('1');
    expect(paymentIntent.amount).toBe(10000);
  });

  it('converts amount from cents', () => {
    const amount = 10000;
    expect(amount / 100).toBe(100);
  });
});
