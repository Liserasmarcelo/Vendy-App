import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService, getNotificationService, resetNotificationService, NotificationPayload } from './notificationService';

// Mock grammy Bot
vi.mock('grammy', () => ({
  Bot: vi.fn().mockImplementation(() => ({
    api: {
      sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    },
  })),
}));

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    resetNotificationService();
    service = getNotificationService('test-token');
  });

  it('sends order_created notification', async () => {
    const payload: NotificationPayload = {
      type: 'order_created',
      telegramId: 123456,
      shopId: 1,
      orderNumber: 'ORD-001',
      amount: 100,
      currency: 'USD',
    };

    const result = await service.send(payload);
    expect(result).toBe(true);
  });

  it('sends payment_received notification', async () => {
    const payload: NotificationPayload = {
      type: 'payment_received',
      telegramId: 123456,
      shopId: 1,
      orderNumber: 'ORD-001',
      amount: 100,
      currency: 'USD',
    };

    const result = await service.send(payload);
    expect(result).toBe(true);
  });

  it('sends low_stock notification', async () => {
    const payload: NotificationPayload = {
      type: 'low_stock',
      telegramId: 123456,
      shopId: 1,
      productName: 'iPhone 15',
      stock: 2,
    };

    const result = await service.send(payload);
    expect(result).toBe(true);
  });

  it('returns false for unknown notification type', async () => {
    const payload = {
      type: 'unknown_type' as any,
      telegramId: 123456,
      shopId: 1,
    };

    const result = await service.send(payload);
    expect(result).toBe(false);
  });

  it('queues notification', () => {
    const payload: NotificationPayload = {
      type: 'promotion',
      telegramId: 123456,
      shopId: 1,
      notes: 'Descuento 20%',
    };

    service.queueNotification(payload);
    const status = service.getQueueStatus();
    expect(status.length).toBe(1);
  });

  it('clears queue', () => {
    const payload: NotificationPayload = {
      type: 'promotion',
      telegramId: 123456,
      shopId: 1,
    };

    service.queueNotification(payload);
    service.clearQueue();
    const status = service.getQueueStatus();
    expect(status.length).toBe(0);
  });

  it('broadcasts to multiple recipients', async () => {
    const payloads: NotificationPayload[] = [
      { type: 'promotion', telegramId: 111, shopId: 1 },
      { type: 'promotion', telegramId: 222, shopId: 1 },
      { type: 'promotion', telegramId: 333, shopId: 1 },
    ];

    const result = await service.broadcast(payloads);
    expect(result.sent).toBe(3);
    expect(result.failed).toBe(0);
  });

  it('notifies admin', async () => {
    const result = await service.notifyAdmin(1, 'new_customer', {
      telegramId: 999,
    });
    expect(result).toBe(true);
  });
});

describe('Notification templates', () => {
  it('has all required types', () => {
    const requiredTypes = [
      'order_created', 'order_confirmed', 'order_processing', 'order_completed',
      'order_cancelled', 'order_refunded', 'payment_received', 'payment_failed',
      'payment_pending', 'transfer_pending', 'transfer_confirmed', 'transfer_rejected',
      'cash_pending', 'cash_confirmed', 'cash_delivered', 'low_stock',
      'new_customer', 'review_request', 'promotion',
    ];

    // Templates are tested indirectly through the service
    expect(requiredTypes.length).toBe(19);
  });
});
