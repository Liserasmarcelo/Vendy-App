import { Menu } from '@grammyjs/menu';
import { MyContext } from '../index';
import {
  Order,
  fetchCustomerOrders,
  fetchOrderDetails,
  cancelOrder,
  reorder,
  formatOrderMessage,
  formatOrderStatus,
} from './orderManager';

// ==========================================
// ORDER LIST MENU
// ==========================================
export function createOrderListMenu(orders: Order[], page: number, hasMore: boolean): Menu<MyContext> {
  const menu = new Menu<MyContext>(`order-list-${page}`);
  
  for (const order of orders) {
    const status = formatOrderStatus(order.status);
    menu.text(`${status.emoji} ${order.orderNumber} ($${order.total})`, async (ctx) => {
      await showOrderDetails(ctx, order.id);
    });
    menu.row();
  }
  
  // Pagination
  if (page > 1 || hasMore) {
    if (page > 1) {
      menu.text('⬅️ Anterior', async (ctx) => {
        await showOrderList(ctx, page - 1);
      });
    }
    if (hasMore) {
      menu.text('Siguiente ➡️', async (ctx) => {
        await showOrderList(ctx, page + 1);
      });
    }
    menu.row();
  }
  
  menu.text('⬅️ Volver al Menú', async (ctx) => {
    await ctx.reply('👋 Menú principal', { reply_markup: mainMenu });
  });
  
  return menu;
}

// ==========================================
// ORDER DETAIL MENU
// ==========================================
export function createOrderDetailMenu(order: Order): Menu<MyContext> {
  const menu = new Menu<MyContext>(`order-detail-${order.id}`);
  
  // Actions based on status
  if (order.status === 'pending') {
    menu.text('❌ Cancelar Orden', async (ctx) => {
      await handleCancelOrder(ctx, order.id);
    });
    menu.row();
  }
  
  if (order.status === 'completed') {
    menu.text('🔄 Reordenar', async (ctx) => {
      await handleReorder(ctx, order.id);
    });
    menu.row();
  }
  
  menu.text('⬅️ Volver a Órdenes', async (ctx) => {
    await showOrderList(ctx, 1);
  });
  
  return menu;
}

// ==========================================
// HANDLERS
// ==========================================
export async function showOrderList(ctx: MyContext, page = 1) {
  const telegramId = ctx.from?.id || 0;
  const limit = 5;
  const offset = (page - 1) * limit;
  
  await ctx.reply('📋 *Cargando órdenes...*');
  
  const response = await fetchCustomerOrders(telegramId, limit, offset);
  
  if (response.orders.length === 0) {
    await ctx.reply(
      '📭 *No tenés órdenes*

Hacé tu primera compra desde el catálogo.',
      { reply_markup: mainMenu }
    );
    return;
  }
  
  const menu = createOrderListMenu(response.orders, page, response.hasMore);
  
  // Need to register this menu instance
  // In production, use a dynamic menu registry
  
  await ctx.reply(
    `📋 *Mis Órdenes* (${response.total} total)

Seleccioná una orden para ver los detalles:`,
    { reply_markup: menu }
  );
}

export async function showOrderDetails(ctx: MyContext, orderId: number) {
  const order = await fetchOrderDetails(orderId);
  
  if (!order) {
    await ctx.reply('❌ Orden no encontrada.');
    return;
  }
  
  const menu = createOrderDetailMenu(order);
  
  await ctx.reply(formatOrderMessage(order), {
    reply_markup: menu,
    parse_mode: 'Markdown',
  });
}

async function handleCancelOrder(ctx: MyContext, orderId: number) {
  const telegramId = ctx.from?.id || 0;
  
  await ctx.reply('⏳ *Cancelando orden...*');
  
  const success = await cancelOrder(orderId, telegramId);
  
  if (success) {
    await ctx.reply(
      '✅ *Orden cancelada*

Tu orden fue cancelada exitosamente.',
      { reply_markup: mainMenu }
    );
  } else {
    await ctx.reply(
      '❌ *No se pudo cancelar*

La orden ya no puede ser cancelada. Contactá a soporte.',
      { reply_markup: mainMenu }
    );
  }
}

async function handleReorder(ctx: MyContext, orderId: number) {
  const telegramId = ctx.from?.id || 0;
  
  await ctx.reply('🔄 *Procesando reorden...*');
  
  const result = await reorder(orderId, telegramId);
  
  if (result.success) {
    await ctx.reply(
      `✅ *Reorden creada*

Nueva orden: \`${result.orderId}\`

Te contactaremos para confirmar.`,
      { reply_markup: mainMenu }
    );
  } else {
    await ctx.reply(
      '❌ *Error al reordenar*

Intentá nuevamente más tarde.',
      { reply_markup: mainMenu }
    );
  }
}

// Import mainMenu from index (circular dependency handled by module system)
// This is a placeholder - in production, import from a shared menu file
const mainMenu = new Menu<MyContext>('orders-main-placeholder')
  .text('📦 Catálogo', async (ctx) => {
    await ctx.reply('📦 Catálogo...');
  });
