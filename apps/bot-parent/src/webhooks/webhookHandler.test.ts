import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookHandler, createWebhookRouter, NotificationPayload } from './webhookHandler';
import { Bot } from 'grammy';

// ==========================================
// MOCKS
// ==========================================

const mockSendMessage = vi.fn().mockResolvedValue({ message_id: 1 });

const mockBot = {
  api: {
    sendMessage: mockSendMessage,
  },
  handleUpdate: vi.fn().mockResolvedValue(undefined),
} as unknown as Bot;

// ==========================================
// TESTS
// ==========================================

describe('WebhookHandler', () => {
  let handler: WebhookHandler;
  const secretToken = 'test_secret_123';

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new WebhookHandler(mockBot, secretToken);
  });

  describe('verifyTelegramSignature', () => {
    it('debe aceptar firma válida', () => {
      const req = {
        headers: {
          'x-telegram-bot-api-secret-token': secretToken,
        },
      } as any;

      expect(handler.verifyTelegramSignature(req)).toBe(true);
    });

    it('debe rechazar firma inválida', () => {
      const req = {
        headers: {
          'x-telegram-bot-api-secret-token': 'wrong_token',
        },
      } as any;

      expect(handler.verifyTelegramSignature(req)).toBe(false);
    });

    it('debe rechazar firma ausente', () => {
      const req = {
        headers: {},
      } as any;

      expect(handler.verifyTelegramSignature(req)).toBe(false);
    });
  });

  describe('handleTelegramUpdate', () => {
    it('debe procesar update válido', async () => {
      const req = {
        headers: {
          'x-telegram-bot-api-secret-token': secretToken,
        },
        body: {
          update_id: 1,
          message: {
            message_id: 1,
            from: { id: 123, first_name: 'Test' },
            chat: { id: 123, type: 'private' },
            date: 1234567890,
            text: '/start',
          },
        },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleTelegramUpdate(req, res);

      expect(mockBot.handleUpdate).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('debe rechazar update sin firma', async () => {
      const req = {
        headers: {},
        body: {},
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleTelegramUpdate(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('handleInternalNotification', () => {
    it('debe procesar notificación de orden', async () => {
      const payload: NotificationPayload = {
        type: 'order',
        shopId: 1,
        telegramId: 123456789,
        data: {
          orderId: 1,
          orderNumber: 'ORD-001',
          customerName: 'Juan Pérez',
          customerTelegramId: 987654321,
          total: 150.00,
          currency: 'USD',
          items: [
            { name: 'Producto 1', quantity: 2, price: 50.00 },
            { name: 'Producto 2', quantity: 1, price: 50.00 },
          ],
          status: 'pending',
          paymentMethod: 'stripe',
          shippingAddress: 'Calle 123, Ciudad',
        },
        priority: 'high',
        timestamp: new Date().toISOString(),
      };

      const req = { body: payload } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleInternalNotification(req, res);

      expect(mockSendMessage).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true, processed: true });
    });

    it('debe procesar notificación de pago', async () => {
      const payload: NotificationPayload = {
        type: 'payment',
        shopId: 1,
        telegramId: 123456789,
        data: {
          orderId: 1,
          amount: 150.00,
          currency: 'USD',
          status: 'completed',
          provider: 'stripe',
          transactionId: 'txn_123',
        },
        priority: 'high',
        timestamp: new Date().toISOString(),
      };

      const req = { body: payload } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleInternalNotification(req, res);

      expect(mockSendMessage).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe procesar notificación de cliente', async () => {
      const payload: NotificationPayload = {
        type: 'customer',
        shopId: 1,
        telegramId: 123456789,
        data: {
          customerId: 1,
          customerName: 'María García',
          customerTelegramId: 987654321,
          action: 'new',
          message: 'Hola, quiero hacer un pedido',
        },
        priority: 'medium',
        timestamp: new Date().toISOString(),
      };

      const req = { body: payload } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleInternalNotification(req, res);

      expect(mockSendMessage).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe procesar notificación del sistema', async () => {
      const payload: NotificationPayload = {
        type: 'system',
        shopId: 1,
        telegramId: 123456789,
        data: {
          event: 'trial_ending',
          message: 'Tu período de prueba finaliza en 3 días',
          details: { daysRemaining: 3 },
        },
        priority: 'high',
        timestamp: new Date().toISOString(),
      };

      const req = { body: payload } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleInternalNotification(req, res);

      expect(mockSendMessage).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe rechazar payload inválido', async () => {
      const req = { body: {} } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleInternalNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid payload' });
    });

    it('debe rechazar tipo desconocido', async () => {
      const payload = {
        type: 'unknown',
        shopId: 1,
        data: {},
        priority: 'low',
        timestamp: new Date().toISOString(),
      } as any;

      const req = { body: payload } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleInternalNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unknown notification type' });
    });

    it('debe manejar error de envío de mensaje', async () => {
      mockSendMessage.mockRejectedValueOnce(new Error('Telegram API error'));

      const payload: NotificationPayload = {
        type: 'order',
        shopId: 1,
        telegramId: 123456789,
        data: {
          orderId: 1,
          orderNumber: 'ORD-001',
          customerName: 'Test',
          total: 100,
          currency: 'USD',
          items: [],
          status: 'pending',
          paymentMethod: 'stripe',
        },
        priority: 'high',
        timestamp: new Date().toISOString(),
      };

      const req = { body: payload } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleInternalNotification(req, res);

      // Aunque falla el envío, la respuesta debe ser 200
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe saltar notificación si no hay telegramId', async () => {
      const payload: NotificationPayload = {
        type: 'order',
        shopId: 1,
        data: {
          orderId: 1,
          orderNumber: 'ORD-001',
          customerName: 'Test',
          total: 100,
          currency: 'USD',
          items: [],
          status: 'pending',
          paymentMethod: 'stripe',
        },
        priority: 'high',
        timestamp: new Date().toISOString(),
      };

      const req = { body: payload } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleInternalNotification(req, res);

      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Broadcast', () => {
    it('debe procesar broadcast a múltiples usuarios', async () => {
      const payload: NotificationPayload = {
        type: 'broadcast',
        shopId: 1,
        data: {
          targets: [
            { telegramId: 123, message: 'Hola 1' },
            { telegramId: 456, message: 'Hola 2' },
            { telegramId: 789, message: 'Hola 3' },
          ],
        },
        priority: 'low',
        timestamp: new Date().toISOString(),
      };

      const req = { body: payload } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleInternalNotification(req, res);

      expect(mockSendMessage).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe manejar broadcast con targets inválidos', async () => {
      const payload: NotificationPayload = {
        type: 'broadcast',
        shopId: 1,
        data: {
          targets: 'invalid',
        },
        priority: 'low',
        timestamp: new Date().toISOString(),
      };

      const req = { body: payload } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handler.handleInternalNotification(req, res);

      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

describe('createWebhookRouter', () => {
  it('debe crear router con rutas', () => {
    const router = createWebhookRouter(mockBot, 'test_secret');
    expect(router).toBeDefined();
  });
});

describe('Formato de mensajes', () => {
  let handler: WebhookHandler;

  beforeEach(() => {
    handler = new WebhookHandler(mockBot, 'test_secret');
  });

  it('debe formatear mensaje de orden correctamente', async () => {
    const payload: NotificationPayload = {
      type: 'order',
      shopId: 1,
      telegramId: 123,
      data: {
        orderId: 1,
        orderNumber: 'ORD-001',
        customerName: 'Juan',
        total: 100,
        currency: 'USD',
        items: [
          { name: 'Producto', quantity: 1, price: 100 },
        ],
        status: 'pending',
        paymentMethod: 'stripe',
      },
      priority: 'high',
      timestamp: new Date().toISOString(),
    };

    const req = { body: payload } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    await handler.handleInternalNotification(req, res);

    const call = mockSendMessage.mock.calls[0];
    const message = call[1];

    expect(message).toContain('🛒 *Nueva Orden*');
    expect(message).toContain('ORD-001');
    expect(message).toContain('Juan');
    expect(message).toContain('USD 100');
    expect(message).toContain('Producto');
  });

  it('debe formatear mensaje de pago correctamente', async () => {
    const payload: NotificationPayload = {
      type: 'payment',
      shopId: 1,
      telegramId: 123,
      data: {
        orderId: 1,
        amount: 100,
        currency: 'USD',
        status: 'completed',
        provider: 'stripe',
        transactionId: 'txn_123',
      },
      priority: 'high',
      timestamp: new Date().toISOString(),
    };

    const req = { body: payload } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    await handler.handleInternalNotification(req, res);

    const call = mockSendMessage.mock.calls[0];
    const message = call[1];

    expect(message).toContain('💳 *Actualización de Pago*');
    expect(message).toContain('✅');
    expect(message).toContain('completed');
    expect(message).toContain('txn_123');
  });

  it('debe formatear mensaje de cliente correctamente', async () => {
    const payload: NotificationPayload = {
      type: 'customer',
      shopId: 1,
      telegramId: 123,
      data: {
        customerId: 1,
        customerName: 'María',
        action: 'new',
        message: 'Hola',
      },
      priority: 'medium',
      timestamp: new Date().toISOString(),
    };

    const req = { body: payload } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    await handler.handleInternalNotification(req, res);

    const call = mockSendMessage.mock.calls[0];
    const message = call[1];

    expect(message).toContain('👋 *Nuevo Cliente*');
    expect(message).toContain('María');
    expect(message).toContain('Hola');
  });

  it('debe formatear mensaje del sistema correctamente', async () => {
    const payload: NotificationPayload = {
      type: 'system',
      shopId: 1,
      telegramId: 123,
      data: {
        event: 'trial_ending',
        message: 'Tu prueba finaliza en 3 días',
        details: { daysRemaining: 3 },
      },
      priority: 'high',
      timestamp: new Date().toISOString(),
    };

    const req = { body: payload } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    await handler.handleInternalNotification(req, res);

    const call = mockSendMessage.mock.calls[0];
    const message = call[1];

    expect(message).toContain('🔔 *Notificación del Sistema*');
    expect(message).toContain('trial_ending');
    expect(message).toContain('3 días');
  });
});
