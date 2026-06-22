import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// ==========================================
// TYPES
// ==========================================
interface TransferWebhookBody {
  orderId: number;
  shopId: number;
  transferReference: string;
  bankName: string;
  amount: number;
  currency: string;
  screenshotUrl?: string;
  customerTelegramId?: number;
}

interface TransferConfirmationBody {
  orderId: number;
  shopId: number;
  confirmed: boolean;
  adminId: number;
  notes?: string;
}

// ==========================================
// WEBHOOK HANDLER: TRANSFER SUBMITTED
// ==========================================
export async function transferSubmittedHandler(
  request: FastifyRequest<{ Body: TransferWebhookBody }>,
  reply: FastifyReply
) {
  const { orderId, shopId, transferReference, bankName, amount, currency, screenshotUrl, customerTelegramId } = request.body;

  try {
    console.log(`🏦 Transfer submitted for order ${orderId}`);
    console.log(`   Reference: ${transferReference}, Bank: ${bankName}`);

    // Update order with transfer details
    await updateOrderTransferDetails(orderId, shopId, {
      transferReference,
      bankName,
      amount,
      currency,
      screenshotUrl,
      status: 'pending_confirmation',
      submittedAt: new Date().toISOString(),
    });

    // Notify admin
    await notifyAdminTransferPending(shopId, orderId, transferReference, amount, currency);

    // Notify customer
    if (customerTelegramId) {
      await notifyCustomerTransferReceived(customerTelegramId, orderId, transferReference);
    }

    return reply.status(200).send({
      success: true,
      message: 'Transfer recorded, awaiting confirmation',
    });
  } catch (err) {
    console.error('Error processing transfer webhook:', err);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

// ==========================================
// WEBHOOK HANDLER: TRANSFER CONFIRMED
// ==========================================
export async function transferConfirmedHandler(
  request: FastifyRequest<{ Body: TransferConfirmationBody }>,
  reply: FastifyReply
) {
  const { orderId, shopId, confirmed, adminId, notes } = request.body;

  try {
    if (confirmed) {
      console.log(`✅ Transfer confirmed for order ${orderId} by admin ${adminId}`);

      await updateOrderStatus(orderId, shopId, 'completed', {
        confirmedBy: adminId,
        confirmedAt: new Date().toISOString(),
        notes,
        paymentMethod: 'transfer',
      });

      // Get customer telegram ID and notify
      const order = await getOrderDetails(orderId, shopId);
      if (order?.customerTelegramId) {
        await notifyCustomerPaymentSuccess(order.customerTelegramId, orderId, order.total, order.currency);
      }
    } else {
      console.log(`❌ Transfer rejected for order ${orderId} by admin ${adminId}`);

      await updateOrderStatus(orderId, shopId, 'pending', {
        rejectedBy: adminId,
        rejectedAt: new Date().toISOString(),
        notes,
        status: 'awaiting_payment',
      });

      const order = await getOrderDetails(orderId, shopId);
      if (order?.customerTelegramId) {
        await notifyCustomerPaymentRejected(order.customerTelegramId, orderId, notes);
      }
    }

    return reply.status(200).send({ success: true });
  } catch (err) {
    console.error('Error confirming transfer:', err);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

// ==========================================
// DATABASE HELPERS
// ==========================================
async function updateOrderTransferDetails(
  orderId: number,
  shopId: number,
  transferData: Record<string, any>
) {
  console.log(`📊 Updating order ${orderId} transfer details:`, transferData);
  // In production: await db.update(orders).set({ transferData }).where(...)
}

async function updateOrderStatus(
  orderId: number,
  shopId: number,
  status: string,
  data: Record<string, any>
) {
  console.log(`📊 Updating order ${orderId} to ${status}:`, data);
  // In production: await db.update(orders).set({ status, ...data }).where(...)
}

async function getOrderDetails(orderId: number, shopId: number): Promise<any> {
  // In production: return await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.shopId, shopId)));
  return {
    id: orderId,
    shopId,
    customerTelegramId: 123456789,
    total: 100,
    currency: 'USD',
  };
}

// ==========================================
// NOTIFICATIONS
// ==========================================
async function notifyAdminTransferPending(
  shopId: number,
  orderId: number,
  reference: string,
  amount: number,
  currency: string
) {
  console.log(`📨 Admin notification: Transfer pending for order ${orderId}`);
  // In production: send to admin Telegram or dashboard
}

async function notifyCustomerTransferReceived(
  telegramId: number,
  orderId: number,
  reference: string
) {
  console.log(`📨 Customer ${telegramId}: Transfer received for order ${orderId}`);
  // In production: await bot.api.sendMessage(telegramId, `...`);
}

async function notifyCustomerPaymentSuccess(
  telegramId: number,
  orderId: number,
  amount: number,
  currency: string
) {
  console.log(`📨 Customer ${telegramId}: Payment confirmed for order ${orderId}`);
}

async function notifyCustomerPaymentRejected(
  telegramId: number,
  orderId: number,
  notes?: string
) {
  console.log(`📨 Customer ${telegramId}: Payment rejected for order ${orderId}`);
}

// ==========================================
// ROUTE REGISTRATION
// ==========================================
export async function registerTransferWebhooks(app: FastifyInstance) {
  app.post('/webhooks/transfer/submitted', transferSubmittedHandler);
  app.post('/webhooks/transfer/confirmed', transferConfirmedHandler);
  
  console.log('✅ Transfer webhooks registered:');
  console.log('   POST /webhooks/transfer/submitted');
  console.log('   POST /webhooks/transfer/confirmed');
}
