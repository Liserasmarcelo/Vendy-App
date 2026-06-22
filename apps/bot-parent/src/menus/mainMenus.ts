import { Menu } from '@grammyjs/menu';
import { MyContext } from '../index';
import { generateInitData } from '../utils/initData';

// ==========================================
// TRADUCCIONES DEL MENÚ
// ==========================================

const menuI18n = {
  es: {
    main: {
      title: '📋 *Menú Principal*\n\nSeleccioná una opción:',
      products: '📦 Productos',
      orders: '📋 Órdenes',
      customers: '👥 Clientes',
      analytics: '📊 Estadísticas',
      settings: '⚙️ Configuración',
      marketing: '📢 Marketing',
      openApp: '📱 Abrir Panel',
      back: '⬅️ Volver',
      help: '❓ Ayuda',
    },
    products: {
      title: '📦 *Gestión de Productos*\n\n¿Qué querés hacer?',
      list: '📋 Ver Productos',
      add: '➕ Agregar Producto',
      categories: '📂 Categorías',
      inventory: '📊 Inventario',
      back: '⬅️ Volver al Menú',
    },
    orders: {
      title: '📋 *Gestión de Órdenes*\n\n¿Qué querés hacer?',
      pending: '⏳ Pendientes',
      completed: '✅ Completadas',
      all: '📋 Todas',
      stats: '📊 Estadísticas',
      back: '⬅️ Volver al Menú',
    },
    customers: {
      title: '👥 *Gestión de Clientes*\n\n¿Qué querés hacer?',
      list: '📋 Ver Clientes',
      messages: '💬 Mensajes',
      broadcast: '📢 Broadcast',
      back: '⬅️ Volver al Menú',
    },
    settings: {
      title: '⚙️ *Configuración*\n\n¿Qué querés configurar?',
      shop: '🏪 Tienda',
      payments: '💳 Pagos',
      delivery: '🚚 Envíos',
      notifications: '🔔 Notificaciones',
      team: '👥 Equipo',
      plan: '💎 Plan',
      back: '⬅️ Volver al Menú',
    },
    marketing: {
      title: '📢 *Marketing*\n\n¿Qué querés hacer?',
      coupons: '🎟️ Cupones',
      abandoned: '🛒 Carritos Abandonados',
      campaigns: '📧 Campañas',
      back: '⬅️ Volver al Menú',
    },
    analytics: {
      title: '📊 *Estadísticas*\n\n¿Qué querés ver?',
      sales: '💰 Ventas',
      products: '📦 Productos',
      customers: '👥 Clientes',
      trends: '📈 Tendencias',
      back: '⬅️ Volver al Menú',
    },
    messages: {
      comingSoon: '🔧 *Próximamente*\n\nEsta función estará disponible pronto.',
      openWebApp: '📱 Abrí el panel web para más opciones:',
      noShopSelected: '❌ *No tenés una tienda seleccionada*\n\nUsá /start para seleccionar una tienda.',
    },
  },
  en: {
    main: {
      title: '📋 *Main Menu*\n\nSelect an option:',
      products: '📦 Products',
      orders: '📋 Orders',
      customers: '👥 Customers',
      analytics: '📊 Analytics',
      settings: '⚙️ Settings',
      marketing: '📢 Marketing',
      openApp: '📱 Open Panel',
      back: '⬅️ Back',
      help: '❓ Help',
    },
    products: {
      title: '📦 *Product Management*\n\nWhat do you want to do?',
      list: '📋 View Products',
      add: '➕ Add Product',
      categories: '📂 Categories',
      inventory: '📊 Inventory',
      back: '⬅️ Back to Menu',
    },
    orders: {
      title: '📋 *Order Management*\n\nWhat do you want to do?',
      pending: '⏳ Pending',
      completed: '✅ Completed',
      all: '📋 All Orders',
      stats: '📊 Statistics',
      back: '⬅️ Back to Menu',
    },
    customers: {
      title: '👥 *Customer Management*\n\nWhat do you want to do?',
      list: '📋 View Customers',
      messages: '💬 Messages',
      broadcast: '📢 Broadcast',
      back: '⬅️ Back to Menu',
    },
    settings: {
      title: '⚙️ *Settings*\n\nWhat do you want to configure?',
      shop: '🏪 Shop',
      payments: '💳 Payments',
      delivery: '🚚 Delivery',
      notifications: '🔔 Notifications',
      team: '👥 Team',
      plan: '💎 Plan',
      back: '⬅️ Back to Menu',
    },
    marketing: {
      title: '📢 *Marketing*\n\nWhat do you want to do?',
      coupons: '🎟️ Coupons',
      abandoned: '🛒 Abandoned Carts',
      campaigns: '📧 Campaigns',
      back: '⬅️ Back to Menu',
    },
    analytics: {
      title: '📊 *Analytics*\n\nWhat do you want to see?',
      sales: '💰 Sales',
      products: '📦 Products',
      customers: '👥 Customers',
      trends: '📈 Trends',
      back: '⬅️ Back to Menu',
    },
    messages: {
      comingSoon: '🔧 *Coming Soon*\n\nThis feature will be available soon.',
      openWebApp: '📱 Open the web panel for more options:',
      noShopSelected: '❌ *No shop selected*\n\nUse /start to select a shop.',
    },
  },
};

function t(ctx: MyContext, section: string, key: string): string {
  const lang = ctx.session?.language || 'es';
  const messages = menuI18n[lang as keyof typeof menuI18n] || menuI18n.es;
  const sectionData = messages[section as keyof typeof messages] as Record<string, string>;
  return sectionData?.[key] || key;
}

// ==========================================
// MENÚ DE PRODUCTOS
// ==========================================

export const productsMenu = new Menu<MyContext>('products-menu')
  .text(async (ctx) => t(ctx, 'products', 'list'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'products') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .text(async (ctx) => t(ctx, 'products', 'add'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'products/add') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'products', 'categories'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'categories') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .text(async (ctx) => t(ctx, 'products', 'inventory'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'inventory') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'products', 'back'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'main', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu,
      }
    );
  });

// ==========================================
// MENÚ DE ÓRDENES
// ==========================================

export const ordersMenu = new Menu<MyContext>('orders-menu')
  .text(async (ctx) => t(ctx, 'orders', 'pending'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'orders?status=pending') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .text(async (ctx) => t(ctx, 'orders', 'completed'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'orders?status=completed') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'orders', 'all'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'orders') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .text(async (ctx) => t(ctx, 'orders', 'stats'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'analytics/orders') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'orders', 'back'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'main', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu,
      }
    );
  });

// ==========================================
// MENÚ DE CLIENTES
// ==========================================

export const customersMenu = new Menu<MyContext>('customers-menu')
  .text(async (ctx) => t(ctx, 'customers', 'list'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'customers') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .text(async (ctx) => t(ctx, 'customers', 'messages'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'customers/messages') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'customers', 'broadcast'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'marketing/broadcast') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'customers', 'back'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'main', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu,
      }
    );
  });

// ==========================================
// MENÚ DE CONFIGURACIÓN
// ==========================================

export const settingsMenu = new Menu<MyContext>('settings-menu')
  .text(async (ctx) => t(ctx, 'settings', 'shop'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'settings/shop') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .text(async (ctx) => t(ctx, 'settings', 'payments'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'settings/payments') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'settings', 'delivery'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'settings/delivery') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .text(async (ctx) => t(ctx, 'settings', 'notifications'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'settings/notifications') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'settings', 'team'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'settings/team') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .text(async (ctx) => t(ctx, 'settings', 'plan'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'settings/plan') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'settings', 'back'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'main', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu,
      }
    );
  });

// ==========================================
// MENÚ DE MARKETING
// ==========================================

export const marketingMenu = new Menu<MyContext>('marketing-menu')
  .text(async (ctx) => t(ctx, 'marketing', 'coupons'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'marketing/coupons') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .text(async (ctx) => t(ctx, 'marketing', 'abandoned'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'marketing/abandoned-carts') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'marketing', 'campaigns'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'marketing/campaigns') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'marketing', 'back'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'main', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu,
      }
    );
  });

// ==========================================
// MENÚ DE ANALYTICS
// ==========================================

export const analyticsMenu = new Menu<MyContext>('analytics-menu')
  .text(async (ctx) => t(ctx, 'analytics', 'sales'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'analytics/sales') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .text(async (ctx) => t(ctx, 'analytics', 'products'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'analytics/products') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'analytics', 'customers'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'analytics/customers') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .text(async (ctx) => t(ctx, 'analytics', 'trends'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'messages', 'comingSoon') + '\n\n' + t(ctx, 'messages', 'openWebApp'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel Web',
              web_app: { url: getWebAppUrl(ctx, 'analytics/trends') },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'analytics', 'back'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'main', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu,
      }
    );
  });

// ==========================================
// MENÚ PRINCIPAL
// ==========================================

export const mainMenu = new Menu<MyContext>('main-menu')
  .text(async (ctx) => t(ctx, 'main', 'products'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'products', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: productsMenu,
      }
    );
  })
  .text(async (ctx) => t(ctx, 'main', 'orders'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'orders', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: ordersMenu,
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'main', 'customers'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'customers', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: customersMenu,
      }
    );
  })
  .text(async (ctx) => t(ctx, 'main', 'analytics'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'analytics', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: analyticsMenu,
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'main', 'settings'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'settings', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: settingsMenu,
      }
    );
  })
  .text(async (ctx) => t(ctx, 'main', 'marketing'), async (ctx) => {
    await ctx.editMessageText(
      t(ctx, 'marketing', 'title'),
      {
        parse_mode: 'Markdown',
        reply_markup: marketingMenu,
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'main', 'openApp'), async (ctx) => {
    const webAppUrl = getWebAppUrl(ctx, '');
    await ctx.reply(
      '📱 *Panel de Vendy*\n\nAbrí el panel web para gestionar tu tienda:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Abrir Panel',
              web_app: { url: webAppUrl },
            }],
            [{ text: '⬅️ Volver', callback_data: 'back_to_main' }],
          ],
        },
      }
    );
  })
  .row()
  .text(async (ctx) => t(ctx, 'main', 'help'), async (ctx) => {
    await ctx.reply(
      `📖 *Ayuda de Vendy*\n\n` +
      `*Comandos:*\n` +
      `/start - Iniciar bot\n` +
      `/menu - Menú principal\n` +
      `/help - Esta ayuda\n` +
      `/language - Cambiar idioma\n\n` +
      `*¿Necesitás más ayuda?*\n` +
      `Contactanos: @vendysupport`,
      { parse_mode: 'Markdown' }
    );
  });

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function getWebAppUrl(ctx: MyContext, path: string): string {
  const baseUrl = process.env.WEBAPP_URL || 'https://app.vendy.app';
  const shopId = ctx.session?.selectedShopId;
  
  if (shopId) {
    return `${baseUrl}/shop/${shopId}/${path}`;
  }
  
  return `${baseUrl}/${path}`;
}

// Handler para volver al menú principal
export async function handleBackToMain(ctx: MyContext) {
  await ctx.editMessageText(
    t(ctx, 'main', 'title'),
    {
      parse_mode: 'Markdown',
      reply_markup: mainMenu,
    }
  );
}

// ==========================================
// REGISTRAR MENÚS
// ==========================================

export function registerMenus(bot: any) {
  bot.use(productsMenu);
  bot.use(ordersMenu);
  bot.use(customersMenu);
  bot.use(settingsMenu);
  bot.use(marketingMenu);
  bot.use(analyticsMenu);
  bot.use(mainMenu);
}
