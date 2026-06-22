import { Request, Response } from 'express';
import { Bot } from 'grammy';
import crypto from 'crypto';

// ==========================================
// TIPOS DE NOTIFICACIONES
// ==========================================

export interface NotificationPayload {
  type: 'order' | 'payment' | 'customer' | 'system' | 'broadcast';
  shopId: number;
  telegramId?: number;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
}

export interface OrderNotificationData {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerTelegramId?: number;
  total: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  status: string;
  paymentMethod: string;
  shippingAddress?: string;
}

export interface PaymentNotificationData {
  orderId: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: string;
  transactionId?: string;
}

export interface CustomerNotificationData {
  customerId: number;
  customerName: string;
  customerTelegramId?: number;
  action: 'new' | 'message' | 'review' | 'repeat';
  message?: string;
}

export interface SystemNotificationData {
  event: 'trial_ending' | 'plan_changed' | 'shop_suspended' | 'shop_activated' | 'commission_due';
  message: string;
  details?: Record<string, any>;
}

// ==========================================
// WEBHOOK HANDLER
// ==========================================

export class WebhookHandler {
  private bot: Bot;
  private secretToken: string;

  constructor(bot: Bot, secretToken: string) {
    this.bot = bot;
    this.secretToken = secretToken;
  }

  /**
   * Verifica la firma del webhook de Telegram
   */
  verifyTelegramSignature(req: Request): boolean {
    const signature = req.headers['x-telegram-bot-api-secret-token'] as string;
    return signature === this.secretToken;
  }

  /**
   * Procesa un update de Telegram
   */
  async handleTelegramUpdate(req: Request, res: Response): Promise<void> {
    try {
      // Verificar firma
      if (!this.verifyTelegramSignature(req)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const update = req.body;

      // Procesar el update
      await this.bot.handleUpdate(update);

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error processing Telegram update:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Procesa notificación interna de la API
   */
  async handleInternalNotification(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body as NotificationPayload;

      // Validar payload
      if (!this.validatePayload(payload)) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }

      // Procesar según tipo
      switch (payload.type) {
        case 'order':
          await this.handleOrderNotification(payload);
          break;
        case 'payment':
          await this.handlePaymentNotification(payload);
          break;
        case 'customer':
          await this.handleCustomerNotification(payload);
          break;
        case 'system':
          await this.handleSystemNotification(payload);
          break;
        case 'broadcast':
          await this.handleBroadcastNotification(payload);
          break;
        default:
          res.status(400).json({ error: 'Unknown notification type' });
          return;
      }

      res.status(200).json({ ok: true, processed: true });
    } catch (error) {
      console.error('Error processing internal notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Valida el payload de notificación
   */
  private validatePayload(payload: NotificationPayload): boolean {
    return !!(
      payload &&
      payload.type &&
      payload.shopId &&
      payload.data &&
      payload.priority
    );
  }

  // ==========================================
  // HANDLERS ESPECÍFICOS
  // ==========================================

  /**
   * Notificación de nueva orden
   */
  private async handleOrderNotification(payload: NotificationPayload): Promise<void> {
    const data = payload.data as OrderNotificationData;
    const { shopId, telegramId } = payload;

    if (!telegramId) {
      console.warn(`No telegramId for shop ${shopId}, skipping notification`);
      return;
    }

    const message = this.formatOrderMessage(data);

    try {
      await this.bot.api.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📋 Ver Orden',
                web_app: { url: this.getWebAppUrl(shopId, `orders/${data.orderId}`) },
              },
              {
                text: '✅ Confirmar',
                callback_data: `confirm_order_${data.orderId}`,
              },
            ],
            [
              {
                text: '💬 Contactar Cliente',
                url: data.customerTelegramId
                  ? `https://t.me/user${data.customerTelegramId}`
                  : '#',
              },
            ],
          ],
        },
      });

      console.log(`✅ Order notification sent to ${telegramId} for order ${data.orderId}`);
    } catch (error) {
      console.error(`Failed to send order notification to ${telegramId}:`, error);
    }
  }

  /**
   * Notificación de pago
   */
  private async handlePaymentNotification(payload: NotificationPayload): Promise<void> {
    const data = payload.data as PaymentNotificationData;
    const { shopId, telegramId } = payload;

    if (!telegramId) return;

    const message = this.formatPaymentMessage(data);

    try {
      await this.bot.api.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📋 Ver Orden',
                web_app: { url: this.getWebAppUrl(shopId, `orders/${data.orderId}`) },
              },
            ],
          ],
        },
      });

      console.log(`✅ Payment notification sent to ${telegramId}`);
    } catch (error) {
      console.error(`Failed to send payment notification to ${telegramId}:`, error);
    }
  }

  /**
   * Notificación de cliente
   */
  private async handleCustomerNotification(payload: NotificationPayload): Promise<void> {
    const data = payload.data as CustomerNotificationData;
    const { shopId, telegramId } = payload;

    if (!telegramId) return;

    const message = this.formatCustomerMessage(data);

    try {
      await this.bot.api.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '👥 Ver Clientes',
                web_app: { url: this.getWebAppUrl(shopId, 'customers') },
              },
              {
                text: '💬 Responder',
                url: data.customerTelegramId
                  ? `https://t.me/user${data.customerTelegramId}`
                  : '#',
              },
            ],
          ],
        },
      });

      console.log(`✅ Customer notification sent to ${telegramId}`);
    } catch (error) {
      console.error(`Failed to send customer notification to ${telegramId}:`, error);
    }
  }

  /**
   * Notificación del sistema
   */
  private async handleSystemNotification(payload: NotificationPayload): Promise<void> {
    const data = payload.data as SystemNotificationData;
    const { shopId, telegramId } = payload;

    if (!telegramId) return;

    const message = this.formatSystemMessage(data);

    try {
      await this.bot.api.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '⚙️ Configuración',
                web_app: { url: this.getWebAppUrl(shopId, 'settings') },
              },
            ],
          ],
        },
      });

      console.log(`✅ System notification sent to ${telegramId}`);
    } catch (error) {
      console.error(`Failed to send system notification to ${telegramId}:`, error);
    }
  }

  /**
   * Notificación de broadcast (mensaje masivo)
   */
  private async handleBroadcastNotification(payload: NotificationPayload): Promise<void> {
    const { data } = payload;

    // Broadcast se maneja de forma diferente - envía a múltiples usuarios
    const targets = data.targets as Array<{ telegramId: number; message: string }>;

    if (!targets || !Array.isArray(targets)) {
      console.warn('Invalid broadcast targets');
      return;
    }

    const results = await Promise.allSettled(
      targets.map(async (target) => {
        try {
          await this.bot.api.sendMessage(target.telegramId, target.message, {
            parse_mode: 'Markdown',
          });
          return { success: true, telegramId: target.telegramId };
        } catch (error) {
          return { success: false, telegramId: target.telegramId, error };
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = results.length - successful;

    console.log(`✅ Broadcast completed: ${successful} sent, ${failed} failed`);
  }

  // ==========================================
  // FORMATEO DE MENSAJES
  // ==========================================

  private formatOrderMessage(data: OrderNotificationData): string {
    const items = data.items
      .map((item) => `• ${item.name} x${item.quantity} - ${data.currency} ${item.price}`)
      .join('\n');

    return (
      `🛒 *Nueva Orden*\n\n` +
      `📋 *N°:* \`${data.orderNumber}\`\n` +
      `👤 *Cliente:* ${data.customerName}\n` +
      `💰 *Total:* ${data.currency} ${data.total}\n` +
      `💳 *Pago:* ${data.paymentMethod}\n\n` +
      `📦 *Productos:*\n${items}\n\n` +
      (data.shippingAddress ? `📍 *Envío:* ${data.shippingAddress}\n\n` : '') +
      `⏰ *Estado:* ${data.status}`
    );
  }

  private formatPaymentMessage(data: PaymentNotificationData): string {
    const statusEmoji = {
      pending: '⏳',
      completed: '✅',
      failed: '❌',
      refunded: '↩️',
    };

    return (
      `💳 *Actualización de Pago*\n\n` +
      `📋 *Orden:* #${data.orderId}\n` +
      `${statusEmoji[data.status]} *Estado:* ${data.status}\n` +
      `💰 *Monto:* ${data.currency} ${data.amount}\n` +
      `🏦 *Proveedor:* ${data.provider}\n` +
      (data.transactionId ? `🆔 *Transacción:* \`${data.transactionId}\`` : '')
    );
  }

  private formatCustomerMessage(data: CustomerNotificationData): string {
    const actionEmoji = {
      new: '👋',
      message: '💬',
      review: '⭐',
      repeat: '🔄',
    };

    return (
      `${actionEmoji[data.action]} *Nuevo Cliente*\n\n` +
      `👤 *Nombre:* ${data.customerName}\n` +
      `🆔 *ID:* ${data.customerId}\n` +
      `📌 *Acción:* ${data.action}\n` +
      (data.message ? `💬 *Mensaje:* ${data.message}` : '')
    );
  }

  private formatSystemMessage(data: SystemNotificationData): string {
    const eventEmoji = {
      trial_ending: '⏰',
      plan_changed: '💎',
      shop_suspended: '🔒',
      shop_activated: '✅',
      commission_due: '💰',
    };

    return (
      `🔔 *Notificación del Sistema*\n\n` +
      `${eventEmoji[data.event] || '🔔'} *Evento:* ${data.event}\n\n` +
      `${data.message}\n\n` +
      (data.details ? `📋 *Detalles:* ${JSON.stringify(data.details, null, 2)}` : '')
    );
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  private getWebAppUrl(shopId: number, path: string): string {
    const baseUrl = process.env.WEBAPP_URL || 'https://app.vendy.app';
    return `${baseUrl}/shop/${shopId}/${path}`;
  }
}

// ==========================================
// EXPRESS ROUTES
// ==========================================

import express from 'express';

export function createWebhookRouter(bot: Bot, secretToken: string): express.Router {
  const router = express.Router();
  const handler = new WebhookHandler(bot, secretToken);

  // Webhook de Telegram
  router.post('/telegram', express.json(), (req, res) => {
    handler.handleTelegramUpdate(req, res);
  });

  // Webhook interno de notificaciones
  router.post('/notify', express.json(), (req, res) => {
    handler.handleInternalNotification(req, res);
  });

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'webhook-handler' });
  });

  return router;
}

export default WebhookHandler;
