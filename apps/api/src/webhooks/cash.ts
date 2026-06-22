import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// ==========================================
// TYPES
// ==========================================
interface CashOnDeliveryBody {
  orderId: number;
  shopId: number;
  customerTelegramId?: number;
  deliveryAddress: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
}

interface CashConfirmationBody {
  orderId: number;
  shopId: number;
  confirmed: boolean;
  adminId: number;
  deliveryFee?: number;
  notes?: string;
}

// ==========================================
// WEBHOOK: CASH ON DELIVERY REQUEST
// ==========================================
export async function cashOnDeliveryHandler(
  request: FastifyRequest<{ Body: CashOnDeliveryBody }>,
  reply: FastifyReply
) {
  const { orderId, shopId, customerTelegramId, deliveryAddress, preferredDate, preferredTime, notes } = request.body;

  try {
    console.log(`💵 Cash on delivery requested for order ${orderId}`);
    console.log(`   Address: ${deliveryAddress}`);

    // Update order with delivery details
    await updateOrderDeliveryDetails(orderId, shopId, {
      deliveryAddress,
      preferredDate,
      preferredTime,
      notes,
      paymentMethod: 'cash',
      status: 'pending_confirmation',
    });

    // Notify admin
    await notifyAdminCashOrderPending(shopId, orderId, deliveryAddress, preferredDate, preferredTime);

    // Notify customer
    if (customerTelegramId) {
      await notifyCustomerCashOrderReceived(customerTelegramId, orderId, deliveryAddress);
    }

    return reply.status(200).send({
      success: true,
      message: 'Cash on delivery order recorded, awaiting confirmation',
    });
  } catch (err) {
    console.error('Error processing cash order:', err);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

// ==========================================
// WEBHOOK: CASH ORDER CONFIRMED
// ==========================================
export async function cashConfirmedHandler(
  request: FastifyRequest<{ Body: CashConfirmationBody }>,
  reply: FastifyReply
) {
  const { orderId, shopId, confirmed, adminId, deliveryFee, notes } = request.body;

  try {
    if (confirmed) {
      console.log(`✅ Cash order confirmed for order ${orderId} by admin ${adminId}`);

      await updateOrderStatus(orderId, shopId, 'processing', {
        confirmedBy: adminId,
        confirmedAt: new Date().toISOString(),
        deliveryFee,
        notes,
        paymentMethod: 'cash',
        status: 'awaiting_delivery',
      });

      const order = await getOrderDetails(orderId, shopId);
      if (order?.customerTelegramId) {
        await notifyCustomerCashOrderConfirmed(
          order.customerTelegramId,
          orderId,
          deliveryFee,
          order.total,
          order.currency
        );
      }
    } else {
      console.log(`❌ Cash order rejected for order ${orderId} by admin ${adminId}`);

      await updateOrderStatus(orderId, shopId, 'cancelled', {
        rejectedBy: adminId,
        rejectedAt: new Date().toISOString(),
        notes,
      });

      const order = await getOrderDetails(orderId, shopId);
      if (order?.customerTelegramId) {
        await notifyCustomerCashOrderRejected(order.customerTelegramId, orderId, notes);
      }
    }

    return reply.status(200).send({ success: true });
  } catch (err) {
    console.error('Error confirming cash order:', err);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

// ==========================================
// WEBHOOK: CASH DELIVERED
// ==========================================
export async function cashDeliveredHandler(
  request: FastifyRequest<{ Body: { orderId: number; shopId: number; deliveredBy: string; deliveredAt: string } }>,
  reply: FastifyReply
) {
  const { orderId, shopId, deliveredBy, deliveredAt } = request.body;

  try {
    console.log(`✅ Cash order ${orderId} delivered by ${deliveredBy}`);

    await updateOrderStatus(orderId, shopId, 'completed', {
      deliveredBy,
      deliveredAt,
      paymentStatus: 'paid',
      paidAt: deliveredAt,
    });

    const order = await getOrderDetails(orderId, shopId);
    if (order?.customerTelegramId) {
      await notifyCustomerOrderDelivered(order.customerTelegramId, orderId);
    }

    return reply.status(200).send({ success: true });
  } catch (err) {
    console.error('Error marking cash order delivered:', err);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

// ==========================================
// DATABASE HELPERS
// ==========================================
async function updateOrderDeliveryDetails(
  orderId: number,
  shopId: number,
  data: Record<string, any>
) {
  console.log(`📊 Updating order ${orderId} delivery details:`, data);
}

async function updateOrderStatus(
  orderId: number,
  shopId: number,
  status: string,
  data: Record<string, any>
) {
  console.log(`📊 Updating order ${orderId} to ${status}:`, data);
}

async function getOrderDetails(orderId: number, shopId: number): Promise<any> {
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
async function notifyAdminCashOrderPending(
  shopId: number,
  orderId: number,
  address: string,
  date?: string,
  time?: string
) {
  console.log(`📨 Admin: Cash order ${orderId} pending confirmation`);
}

async function notifyCustomerCashOrderReceived(
  telegramId: number,
  orderId: number,
  address: string
) {
  console.log(`📨 Customer ${telegramId}: Cash order ${orderId} received`);
}

async function notifyCustomerCashOrderConfirmed(
  telegramId: number,
  orderId: number,
  deliveryFee: number | undefined,
  total: number,
  currency: string
) {
  console.log(`📨 Customer ${telegramId}: Cash order ${orderId} confirmed`);
}

async function notifyCustomerCashOrderRejected(
  telegramId: number,
  orderId: number,
  notes?: string
) {
  console.log(`📨 Customer ${telegramId}: Cash order ${orderId} rejected`);
}

async function notifyCustomerOrderDelivered(
  telegramId: number,
  orderId: number
) {
  console.log(`📨 Customer ${telegramId}: Order ${orderId} delivered`);
}

// ==========================================
// ROUTE REGISTRATION
// ==========================================
export async function registerCashWebhooks(app: FastifyInstance) {
  app.post('/webhooks/cash/request', cashOnDeliveryHandler);
  app.post('/webhooks/cash/confirmed', cashConfirmedHandler);
  app.post('/webhooks/cash/delivered', cashDeliveredHandler);
  
  console.log('✅ Cash webhooks registered:');
  console.log('   POST /webhooks/cash/request');
  console.log('   POST /webhooks/cash/confirmed');
  console.log('   POST /webhooks/cash/delivered');
}
