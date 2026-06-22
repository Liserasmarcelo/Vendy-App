import { Queue, Worker, Job } from 'bullmq';
import redis from './redis';

// ==========================================
// QUEUES (Colas de trabajo)
// ==========================================

/**
 * Cola de webhooks de Telegram
 * Procesa updates de bots padre e hijo
 */
export const telegramWebhookQueue = new Queue('telegram-webhooks', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/**
 * Cola de notificaciones a clientes
 * Envía mensajes de pedido, envío, entrega via bot hijo
 */
export const notificationQueue = new Queue('notifications', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 200,
    removeOnFail: 100,
  },
});

/**
 * Cola de marketing automation
 * Carrito abandonado, re-engagement, post-compra review
 */
export const automationQueue = new Queue('automation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
    removeOnComplete: 500,
    removeOnFail: 200,
  },
});

/**
 * Cola de procesamiento de pagos
 * Webhooks de Stripe, Smart Glocal, Unlimit
 */
export const paymentQueue = new Queue('payments', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/**
 * Cola de analytics (eventos en background)
 * No bloquea el request principal
 */
export const analyticsQueue = new Queue('analytics', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: 1000,
    removeOnFail: 100,
  },
});

// ==========================================
// WORKERS (Procesadores de colas)
// ==========================================

/**
 * Worker de webhooks de Telegram
 * Procesa updates de bots de forma asíncrona
 */
export const telegramWebhookWorker = new Worker(
  'telegram-webhooks',
  async (job: Job) => {
    const { botToken, update } = job.data;
    
    try {
      // Enrutar el update según el tipo
      if (update.message?.text?.startsWith('/')) {
        // Comando del bot
        await handleBotCommand(botToken, update);
      } else if (update.callback_query) {
        // Callback query (botones inline)
        await handleCallbackQuery(botToken, update);
      } else if (update.pre_checkout_query) {
        // Pre-checkout (Telegram Payments)
        await handlePreCheckout(botToken, update);
      } else if (update.message?.successful_payment) {
        // Pago exitoso (Telegram Payments)
        await handleSuccessfulPayment(botToken, update);
      }
      
      return { success: true, processed: true };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error; // Reintentar según configuración de backoff
    }
  },
  { connection: redis, concurrency: 10 }
);

/**
 * Worker de notificaciones
 * Envía mensajes a clientes via bot hijo
 */
export const notificationWorker = new Worker(
  'notifications',
  async (job: Job) => {
    const { shopId, customerTelegramId, type, payload } = job.data;
    
    try {
      switch (type) {
        case 'order_confirmation':
          await sendOrderConfirmation(shopId, customerTelegramId, payload);
          break;
        case 'order_shipped':
          await sendOrderShipped(shopId, customerTelegramId, payload);
          break;
        case 'order_delivered':
          await sendOrderDelivered(shopId, customerTelegramId, payload);
          break;
        case 'broadcast':
          await sendBroadcast(shopId, customerTelegramId, payload);
          break;
        default:
          console.warn('Unknown notification type:', type);
      }
      
      return { success: true, sent: true };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },
  { connection: redis, concurrency: 20 }
);

/**
 * Worker de marketing automation
 * Carrito abandonado, re-engagement, etc.
 */
export const automationWorker = new Worker(
  'automation',
  async (job: Job) => {
    const { shopId, customerTelegramId, automationType, payload, delayMinutes } = job.data;
    
    try {
      switch (automationType) {
        case 'abandoned_cart':
          await handleAbandonedCart(shopId, customerTelegramId, payload);
          break;
        case 'post_purchase_review':
          await handlePostPurchaseReview(shopId, customerTelegramId, payload);
          break;
        case 're_engagement':
          await handleReEngagement(shopId, customerTelegramId, payload);
          break;
        case 'welcome_series':
          await handleWelcomeSeries(shopId, customerTelegramId, payload);
          break;
        default:
          console.warn('Unknown automation type:', automationType);
      }
      
      return { success: true, triggered: true };
    } catch (error) {
      console.error('Error processing automation:', error);
      throw error;
    }
  },
  { connection: redis, concurrency: 10 }
);

/**
 * Worker de pagos
 * Procesa webhooks de proveedores de pago
 */
export const paymentWorker = new Worker(
  'payments',
  async (job: Job) => {
    const { provider, eventType, payload } = job.data;
    
    try {
      switch (provider) {
        case 'stripe':
          await handleStripeWebhook(eventType, payload);
          break;
        case 'smart_glocal':
          await handleSmartGlocalWebhook(eventType, payload);
          break;
        case 'unlimit':
          await handleUnlimitWebhook(eventType, payload);
          break;
        case 'telegram_stars':
          await handleTelegramStarsWebhook(eventType, payload);
          break;
        default:
          console.warn('Unknown payment provider:', provider);
      }
      
      return { success: true, processed: true };
    } catch (error) {
      console.error('Error processing payment webhook:', error);
      throw error;
    }
  },
  { connection: redis, concurrency: 5 }
);

/**
 * Worker de analytics
 * Guarda eventos en background
 */
export const analyticsWorker = new Worker(
  'analytics',
  async (job: Job) => {
    const { shopId, eventType, payload } = job.data;
    
    try {
      // Importar prisma dinámicamente para evitar circular deps
      const { prisma } = await import('./prisma');
      
      await prisma.analyticsEvent.create({
        data: {
          shopId,
          eventType,
          payload,
        },
      });
      
      return { success: true, recorded: true };
    } catch (error) {
      console.error('Error recording analytics:', error);
      // No reintentar analytics fallidos (no crítico)
      return { success: false, error: (error as Error).message };
    }
  },
  { connection: redis, concurrency: 50 }
);

// ==========================================
// HANDLERS (Stubs - implementar en sprints posteriores)
// ==========================================

async function handleBotCommand(botToken: string, update: any) {
  // TODO: Implementar en Sprint 2 (Bot Padre)
  console.log('Handling bot command:', update.message.text);
}

async function handleCallbackQuery(botToken: string, update: any) {
  // TODO: Implementar en Sprint 2/6
  console.log('Handling callback query:', update.callback_query.data);
}

async function handlePreCheckout(botToken: string, update: any) {
  // TODO: Implementar en Sprint 5/7 (Payments)
  console.log('Handling pre-checkout query');
}

async function handleSuccessfulPayment(botToken: string, update: any) {
  // TODO: Implementar en Sprint 5/7 (Payments)
  console.log('Handling successful payment');
}

async function sendOrderConfirmation(shopId: number, customerId: string, payload: any) {
  // TODO: Implementar en Sprint 6 (Bot Hijo)
  console.log('Sending order confirmation to', customerId);
}

async function sendOrderShipped(shopId: number, customerId: string, payload: any) {
  // TODO: Implementar en Sprint 6
  console.log('Sending order shipped to', customerId);
}

async function sendOrderDelivered(shopId: number, customerId: string, payload: any) {
  // TODO: Implementar en Sprint 6
  console.log('Sending order delivered to', customerId);
}

async function sendBroadcast(shopId: number, customerId: string, payload: any) {
  // TODO: Implementar en Sprint 5
  console.log('Sending broadcast to', customerId);
}

async function handleAbandonedCart(shopId: number, customerId: string, payload: any) {
  // TODO: Implementar en Sprint 8 (Marketing Automation)
  console.log('Handling abandoned cart for', customerId);
}

async function handlePostPurchaseReview(shopId: number, customerId: string, payload: any) {
  // TODO: Implementar en Sprint 8
  console.log('Handling post-purchase review for', customerId);
}

async function handleReEngagement(shopId: number, customerId: string, payload: any) {
  // TODO: Implementar en Sprint 8
  console.log('Handling re-engagement for', customerId);
}

async function handleWelcomeSeries(shopId: number, customerId: string, payload: any) {
  // TODO: Implementar en Sprint 8
  console.log('Handling welcome series for', customerId);
}

async function handleStripeWebhook(eventType: string, payload: any) {
  // TODO: Implementar en Sprint 7 (Subscriptions)
  console.log('Handling Stripe webhook:', eventType);
}

async function handleSmartGlocalWebhook(eventType: string, payload: any) {
  // TODO: Implementar en Sprint 7
  console.log('Handling Smart Glocal webhook:', eventType);
}

async function handleUnlimitWebhook(eventType: string, payload: any) {
  // TODO: Implementar en Sprint 7
  console.log('Handling Unlimit webhook:', eventType);
}

async function handleTelegramStarsWebhook(eventType: string, payload: any) {
  // TODO: Implementar en Sprint 7
  console.log('Handling Telegram Stars webhook:', eventType);
}

// ==========================================
// FUNCIONES DE AYUDA PARA ENCOLAR JOBS
// ==========================================

/**
 * Encola un webhook de Telegram para procesamiento asíncrono
 */
export async function enqueueTelegramWebhook(botToken: string, update: any) {
  return telegramWebhookQueue.add('process-webhook', { botToken, update });
}

/**
 * Encola una notificación a un cliente
 */
export async function enqueueNotification(
  shopId: number,
  customerTelegramId: string,
  type: string,
  payload: any,
  delayMs?: number
) {
  const jobOptions = delayMs ? { delay: delayMs } : undefined;
  return notificationQueue.add('send-notification', { shopId, customerTelegramId, type, payload }, jobOptions);
}

/**
 * Encola un evento de automation (con delay opcional)
 */
export async function enqueueAutomation(
  shopId: number,
  customerTelegramId: string,
  automationType: string,
  payload: any,
  delayMinutes?: number
) {
  const delayMs = delayMinutes ? delayMinutes * 60 * 1000 : undefined;
  return automationQueue.add('trigger-automation', { shopId, customerTelegramId, automationType, payload, delayMinutes }, { delay: delayMs });
}

/**
 * Encola un webhook de pago
 */
export async function enqueuePaymentWebhook(provider: string, eventType: string, payload: any) {
  return paymentQueue.add('process-payment', { provider, eventType, payload });
}

/**
 * Encola un evento de analytics (non-blocking)
 */
export async function enqueueAnalyticsEvent(shopId: number, eventType: string, payload: any) {
  return analyticsQueue.add('record-event', { shopId, eventType, payload });
}

// ==========================================
// LIMPIEZA Y GRACEFUL SHUTDOWN
// ==========================================

export async function closeQueues() {
  await telegramWebhookQueue.close();
  await notificationQueue.close();
  await automationQueue.close();
  await paymentQueue.close();
  await analyticsQueue.close();
  
  await telegramWebhookWorker.close();
  await notificationWorker.close();
  await automationWorker.close();
  await paymentWorker.close();
  await analyticsWorker.close();
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing queues...');
  await closeQueues();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing queues...');
  await closeQueues();
  process.exit(0);
});
