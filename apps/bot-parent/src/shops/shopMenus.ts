import { Menu } from '@grammyjs/menu';
import { ParentContext } from '../index';
import { Shop, fetchShop, updateShop, deleteShop, toggleShopStatus, regenerateBotToken, formatShopMessage } from './shopManager';

// ==========================================
// SHOP DETAIL MENU
// ==========================================
export function createShopDetailMenu(shop: Shop): Menu<ParentContext> {
  const menu = new Menu<ParentContext>(`shop-detail-${shop.id}`);

  // Edit
  menu.text('✏️ Editar', async (ctx) => {
    ctx.session.selectedShopId = shop.id;
    await ctx.reply('✏️ *Editar Tienda*

Seleccioná qué querés editar:', {
      reply_markup: createShopEditMenu(shop),
    });
  });

  // Toggle status
  const statusAction = shop.status === 'active' ? '⏸️ Pausar' : '▶️ Activar';
  menu.text(statusAction, async (ctx) => {
    const newStatus = shop.status === 'active' ? 'inactive' : 'active';
    const result = await toggleShopStatus(shop.id, ctx.from?.id || 0, newStatus);

    if (result.success) {
      await ctx.answerCallbackQuery({
        text: newStatus === 'active' ? 'Tienda activada' : 'Tienda pausada',
      });
      await ctx.reply(
        `${newStatus === 'active' ? '▶️' : '⏸️'} La tienda *${shop.name}* ahora está ${newStatus === 'active' ? 'activa' : 'pausada'}.`
      );
    } else {
      await ctx.reply('❌ Error al cambiar el estado.');
    }
  });
  menu.row();

  // Bot settings
  menu.text('🤖 Bot', async (ctx) => {
    await ctx.reply(`🤖 *Configuración del Bot*

Username: @${shop.botUsername || 'No configurado'}

¿Qué querés hacer?`, {
      reply_markup: createBotConfigMenu(shop),
    });
  });

  // Delete
  menu.text('🗑️ Eliminar', async (ctx) => {
    await ctx.reply(
      `⚠️ *¿Eliminar ${shop.name}?*

` +
      `Esta acción no se puede deshacer.

` +
      `Todos los productos, órdenes y datos serán eliminados.

` +
      `Escribí *ELIMINAR* para confirmar.`,
      { reply_markup: createDeleteConfirmMenu(shop) }
    );
  });
  menu.row();

  // Back
  menu.text('⬅️ Volver', async (ctx) => {
    await showShopList(ctx);
  });

  return menu;
}

// ==========================================
// SHOP EDIT MENU
// ==========================================
function createShopEditMenu(shop: Shop): Menu<ParentContext> {
  const menu = new Menu<ParentContext>(`shop-edit-${shop.id}`);

  menu.text('🏪 Nombre', async (ctx) => {
    await ctx.reply(`Nombre actual: *${shop.name}*

Escribí el nuevo nombre:`);
    // In production: enter conversation to edit
  });

  menu.text('📝 Descripción', async (ctx) => {
    await ctx.reply(`Descripción actual: *${shop.description}*

Escribí la nueva descripción:`);
  });
  menu.row();

  menu.text('🎨 Color', async (ctx) => {
    await ctx.reply(`Color actual: ${shop.primaryColor}

Escribí el nuevo color (hex):`);
  });

  menu.text('💰 Moneda', async (ctx) => {
    await ctx.reply(`Moneda actual: *${shop.currency}*

Opciones: USD, PYG, ARS, BRL`);
  });
  menu.row();

  menu.text('⬅️ Volver', async (ctx) => {
    await showShopDetail(ctx, shop.id);
  });

  return menu;
}

// ==========================================
// BOT CONFIG MENU
// ==========================================
function createBotConfigMenu(shop: Shop): Menu<ParentContext> {
  const menu = new Menu<ParentContext>(`bot-config-${shop.id}`);

  if (shop.botUsername) {
    menu.text('📋 Ver Token', async (ctx) => {
      await ctx.reply(
        `🔑 *Token del Bot*

` +
        `\`${shop.botToken || 'No disponible'}\`

` +
        `⚠️ No compartas este token con nadie.`,
        { parse_mode: 'Markdown' }
      );
    });

    menu.text('🔄 Regenerar Token', async (ctx) => {
      await ctx.reply('⏳ Regenerando token...');
      const result = await regenerateBotToken(shop.id, ctx.from?.id || 0);

      if (result.success) {
        await ctx.reply(
          `✅ *Token regenerado*

` +
          `Nuevo token: \`${result.token}\`

` +
          `⚠️ Actualizá tu configuración del bot hijo.`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply('❌ Error al regenerar token.');
      }
    });
    menu.row();
  } else {
    menu.text('🤖 Crear Bot', async (ctx) => {
      await ctx.reply(
        `🤖 *Crear Bot para ${shop.name}*

` +
        `1. Andá a @BotFather
` +
        `2. Creá un nuevo bot
` +
        `3. Copiá el token acá:

` +
        `Escribí el token:`
      );
    });
    menu.row();
  }

  menu.text('⬅️ Volver', async (ctx) => {
    await showShopDetail(ctx, shop.id);
  });

  return menu;
}

// ==========================================
// DELETE CONFIRM MENU
// ==========================================
function createDeleteConfirmMenu(shop: Shop): Menu<ParentContext> {
  const menu = new Menu<ParentContext>(`shop-delete-${shop.id}`);

  menu.text('❌ Cancelar', async (ctx) => {
    await ctx.reply('✅ Eliminación cancelada.');
    await showShopDetail(ctx, shop.id);
  });

  menu.text('🗑️ Sí, Eliminar', async (ctx) => {
    await ctx.reply('⏳ Eliminando tienda...');
    const result = await deleteShop(shop.id, ctx.from?.id || 0);

    if (result.success) {
      await ctx.reply(
        `🗑️ *Tienda eliminada*

` +
        `La tienda *${shop.name}* y todos sus datos fueron eliminados.`,
        { reply_markup: (await import('../index')).default } // This won't work, needs proper menu
      );
    } else {
      await ctx.reply('❌ Error al eliminar la tienda.');
    }
  });

  return menu;
}

// ==========================================
// HANDLERS
// ==========================================
export async function showShopDetail(ctx: ParentContext, shopId: number) {
  const adminId = ctx.from?.id;
  if (!adminId) {
    await ctx.reply('❌ Error: No se pudo identificar tu usuario.');
    return;
  }

  const shop = await fetchShop(shopId, adminId);
  if (!shop) {
    await ctx.reply('❌ Tienda no encontrada.');
    return;
  }

  const menu = createShopDetailMenu(shop);
  // In production: register menu with bot.use(menu)

  await ctx.reply(formatShopMessage(shop), {
    reply_markup: menu,
    parse_mode: 'Markdown',
  });
}

export async function showShopList(ctx: ParentContext) {
  const adminId = ctx.from?.id;
  if (!adminId) {
    await ctx.reply('❌ Error: No se pudo identificar tu usuario.');
    return;
  }

  const { fetchAdminShops, formatShopList } = await import('./shopManager');
  const shops = await fetchAdminShops(adminId);

  if (shops.length === 0) {
    await ctx.reply('📭 No tenés tiendas.

Creá una con /start');
    return;
  }

  // Create list menu
  const menu = new Menu<ParentContext>('shop-list');
  for (const shop of shops) {
    const emoji = shop.status === 'active' ? '🟢' : shop.status === 'pending' ? '⏳' : '🔴';
    menu.text(`${emoji} ${shop.name}`, async (ctx) => {
      await showShopDetail(ctx, shop.id);
    });
    if (shops.indexOf(shop) % 2 === 1) menu.row();
  }
  menu.row();
  menu.text('➕ Nueva Tienda', async (ctx) => {
    await ctx.conversation.enter('createShopConversation');
  });

  await ctx.reply(formatShopList(shops), {
    reply_markup: menu,
    parse_mode: 'Markdown',
  });
}
