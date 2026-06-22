import { Bot } from 'grammy';

// ==========================================
// TYPES
// ==========================================
export type NotificationType = 
  | 'order_created'
  | 'order_confirmed'
  | 'order_processing'
  | 'order_completed'
  | 'order_cancelled'
  | 'order_refunded'
  | 'payment_received'
  | 'payment_failed'
  | 'payment_pending'
  | 'transfer_pending'
  | 'transfer_confirmed'
  | 'transfer_rejected'
  | 'cash_pending'
  | 'cash_confirmed'
  | 'cash_delivered'
  | 'low_stock'
  | 'new_customer'
  | 'review_request'
  | 'promotion';

export interface NotificationPayload {
  type: NotificationType;
  telegramId: number;
  shopId: number;
  orderId?: number;
  orderNumber?: string;
  amount?: number;
  currency?: string;
  productName?: string;
  stock?: number;
  notes?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

export interface NotificationTemplate {
  emoji: string;
  title: string;
  body: (data: NotificationPayload) => string;
  actions?: { label: string; url?: string; callback?: string }[];
}

// ==========================================
// TEMPLATES
// ==========================================
const templates: Record<NotificationType, NotificationTemplate> = {
  order_created: {
    emoji: '📦',
    title: 'Nueva Orden',
    body: (data) => `Tu orden *${data.orderNumber}* fue creada exitosamente.

💰 Total: $${data.amount} ${data.currency}

Te notificaremos cuando sea confirmada.`,
  },
  order_confirmed: {
    emoji: '✅',
    title: 'Orden Confirmada',
    body: (data) => `Tu orden *${data.orderNumber}* fue confirmada.

📦 Preparando tu pedido...`,
  },
  order_processing: {
    emoji: '📦',
    title: 'Orden en Proceso',
    body: (data) => `Tu orden *${data.orderNumber}* está siendo preparada.

${data.estimatedDelivery ? `📅 Entrega estimada: ${data.estimatedDelivery}` : ''}`,
  },
  order_completed: {
    emoji: '🎉',
    title: 'Orden Completada',
    body: (data) => `¡Tu orden *${data.orderNumber}* fue entregada!

¿Qué te pareció? Dejanos tu opinión.`,
    actions: [
      { label: '⭐ Calificar', callback: 'rate_order' },
    ],
  },
  order_cancelled: {
    emoji: '❌',
    title: 'Orden Cancelada',
    body: (data) => `Tu orden *${data.orderNumber}* fue cancelada.

${data.notes ? `Motivo: ${data.notes}` : ''}`,
  },
  order_refunded: {
    emoji: '💰',
    title: 'Reembolso Procesado',
    body: (data) => `El reembolso de tu orden *${data.orderNumber}* fue procesado.

💰 Monto: $${data.amount} ${data.currency}

El dinero será acreditado en 3-5 días hábiles.`,
  },
  payment_received: {
    emoji: '💳',
    title: 'Pago Recibido',
    body: (data) => `Recibimos tu pago de *$${data.amount} ${data.currency}* para la orden *${data.orderNumber}*.

✅ Orden confirmada.`,
  },
  payment_failed: {
    emoji: '⚠️',
    title: 'Pago Fallido',
    body: (data) => `El pago de tu orden *${data.orderNumber}* no pudo ser procesado.

Intentá nuevamente o usá otro método de pago.`,
    actions: [
      { label: 'Reintentar Pago', callback: 'retry_payment' },
    ],
  },
  payment_pending: {
    emoji: '⏳',
    title: 'Pago Pendiente',
    body: (data) => `Estamos esperando la confirmación de tu pago para la orden *${data.orderNumber}*.

⏳ Tiempo estimado: 15 minutos.`,
  },
  transfer_pending: {
    emoji: '🏦',
    title: 'Transferencia Recibida',
    body: (data) => `Recibimos tu comprobante de transferencia para la orden *${data.orderNumber}*.

⏳ Estamos verificando el pago. Te avisaremos en breve.`,
  },
  transfer_confirmed: {
    emoji: '✅',
    title: 'Transferencia Confirmada',
    body: (data) => `Tu transferencia para la orden *${data.orderNumber}* fue confirmada.

📦 Preparando tu pedido...`,
  },
  transfer_rejected: {
    emoji: '❌',
    title: 'Transferencia Rechazada',
    body: (data) => `No pudimos verificar tu transferencia para la orden *${data.orderNumber}*.

${data.notes ? `Motivo: ${data.notes}` : ''}

Por favor, intentá nuevamente o usá otro método de pago.`,
  },
  cash_pending: {
    emoji: '💵',
    title: 'Contra-Entrega Solicitada',
    body: (data) => `Solicitaste pago contra-entrega para la orden *${data.orderNumber}*.

⏳ Esperando confirmación del vendedor.`,
  },
  cash_confirmed: {
    emoji: '✅',
    title: 'Contra-Entrega Confirmada',
    body: (data) => `Tu orden *${data.orderNumber}* fue confirmada para entrega contra-pago.

${data.estimatedDelivery ? `📅 Entrega estimada: ${data.estimatedDelivery}` : ''}

💰 Total a pagar: $${data.amount} ${data.currency}`,
  },
  cash_delivered: {
    emoji: '🎉',
    title: 'Orden Entregada',
    body: (data) => `Tu orden *${data.orderNumber}* fue entregada.

¡Gracias por tu compra!`,
  },
  low_stock: {
    emoji: '⚠️',
    title: 'Stock Bajo',
    body: (data) => `El producto *${data.productName}* tiene stock bajo.

📦 Stock actual: ${data.stock} unidades

Reponé pronto para no quedarte sin ventas.`,
  },
  new_customer: {
    emoji: '👋',
    title: 'Nuevo Cliente',
    body: (data) => `¡Tenés un nuevo cliente!

Telegram ID: ${data.telegramId}

Empezá a construir una relación con tu nuevo cliente.`,
  },
  review_request: {
    emoji: '⭐',
    title: 'Calificar Compra',
    body: (data) => `¿Cómo fue tu experiencia con la orden *${data.orderNumber}*?

Tu opinión nos ayuda a mejorar.`,
    actions: [
      { label: '⭐⭐⭐⭐⭐', callback: 'rate_5' },
      { label: '⭐⭐⭐⭐', callback: 'rate_4' },
    ],
  },
  promotion: {
    emoji: '🎁',
    title: 'Oferta Especial',
    body: (data) => `¡No te pierdas nuestra oferta especial!

${data.notes || 'Productos seleccionados con descuento.'}`,
  },
};

// ==========================================
// NOTIFICATION SERVICE
// ==========================================
export class NotificationService {
  private bot: Bot;
  private queue: NotificationPayload[] = [];
  private isProcessing = false;
  private batchSize = 10;
  private batchInterval = 1000; // ms

  constructor(botToken: string) {
    this.bot = new Bot(botToken);
    this.startBatchProcessor();
  }

  // Send immediately (for critical notifications)
  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      const template = templates[payload.type];
      if (!template) {
        console.error(`Unknown notification type: ${payload.type}`);
        return false;
      }

      const message = `${template.emoji} *${template.title}*

${template.body(payload)}`;

      await this.bot.api.sendMessage(payload.telegramId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

      console.log(`📨 Notification sent: ${payload.type} to ${payload.telegramId}`);
      return true;
    } catch (error) {
      console.error(`Failed to send notification:`, error);
      return false;
    }
  }

  // Queue for batch processing (for non-critical notifications)
  queueNotification(payload: NotificationPayload): void {
    this.queue.push(payload);
    console.log(`📥 Queued notification: ${payload.type} for ${payload.telegramId}`);
  }

  // Process queue in batches
  private startBatchProcessor(): void {
    setInterval(async () => {
      if (this.isProcessing || this.queue.length === 0) return;

      this.isProcessing = true;
      const batch = this.queue.splice(0, this.batchSize);

      console.log(`🔄 Processing batch of ${batch.length} notifications`);

      // Send in parallel with rate limiting
      const results = await Promise.allSettled(
        batch.map(payload => this.send(payload))
      );

      const succeeded = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.length - succeeded;

      console.log(`✅ Batch complete: ${succeeded} sent, ${failed} failed`);

      this.isProcessing = false;
    }, this.batchInterval);
  }

  // Send to multiple recipients
  async broadcast(payloads: NotificationPayload[]): Promise<{ sent: number; failed: number }> {
    const results = await Promise.allSettled(
      payloads.map(payload => this.send(payload))
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - sent;

    return { sent, failed };
  }

  // Admin notifications (to shop owner)
  async notifyAdmin(shopId: number, type: NotificationType, data: Omit<NotificationPayload, 'telegramId' | 'shopId' | 'type'>): Promise<boolean> {
    // In production, fetch admin telegram ID from database
    const adminTelegramId = await this.getAdminTelegramId(shopId);
    if (!adminTelegramId) {
      console.log(`No admin found for shop ${shopId}`);
      return false;
    }

    return this.send({
      type,
      telegramId: adminTelegramId,
      shopId,
      ...data,
    });
  }

  private async getAdminTelegramId(shopId: number): Promise<number | null> {
    // In production: return await db.select().from(shops).where(eq(shops.id, shopId)).then(s => s[0]?.adminTelegramId);
    return 123456789; // Mock
  }

  // Get queue status
  getQueueStatus(): { length: number; isProcessing: boolean } {
    return {
      length: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }

  // Clear queue
  clearQueue(): void {
    this.queue = [];
    console.log('🗑️ Notification queue cleared');
  }
}

// ==========================================
// FACTORY / SINGLETON
// ==========================================
let notificationService: NotificationService | null = null;

export function getNotificationService(botToken: string): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService(botToken);
  }
  return notificationService;
}

export function resetNotificationService(): void {
  notificationService = null;
}
