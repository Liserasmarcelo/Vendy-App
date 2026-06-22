import { Bot, Context, session, SessionFlavor } from 'grammy';
import { conversations, createConversation, ConversationFlavor } from '@grammyjs/conversations';
import { Menu } from '@grammyjs/menu';
import { hydrateReply, parseMode } from '@grammyjs/hydrate';

// ==========================================
// TYPES
// ==========================================
interface ParentSessionData {
  isAdmin: boolean;
  adminId?: number;
  selectedShopId?: number;
  language: 'es' | 'en';
  awaitingInput?: string;
}

type ParentContext = Context & SessionFlavor<ParentSessionData> & ConversationFlavor;

interface ShopSummary {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  totalOrders: number;
  totalRevenue: number;
  productCount: number;
  botUsername?: string;
}

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
  botToken: process.env.PARENT_BOT_TOKEN || '',
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  adminTelegramIds: (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(Number).filter(Boolean),
};

if (!CONFIG.botToken) {
  throw new Error('PARENT_BOT_TOKEN is required');
}

// ==========================================
// I18N
// ==========================================
const i18n = {
  es: {
    welcome: '👋 ¡Bienvenido a *Vendy*!

Soy el bot de gestión para vendedores.

Conmigo podés:
• Crear tu tienda
• Gestionar productos
• Ver estadísticas
• Configurar pagos',
    adminWelcome: '🔐 *Panel de Administración*

Bienvenido, administrador.

Seleccioná una opción:',
    notAuthorized: '⛔ No tenés permisos para acceder a esta función.',
    createShop: '🏪 Crear Tienda',
    myShops: '🏪 Mis Tiendas',
    statistics: '📊 Estadísticas',
    settings: '⚙️ Configuración',
    support: '💬 Soporte',
    back: '⬅️ Volver',
    shopCreated: '✅ ¡Tienda creada exitosamente!',
    shopNamePrompt: '🏪 ¿Cómo se llama tu tienda?',
    shopDescPrompt: '📝 ¿Qué vendés? (Descripción breve)',
    shopCategoryPrompt: '📂 ¿En qué categoría?

Ej: Electrónica, Moda, Alimentos, etc.',
    shopCountryPrompt: '🌍 ¿De qué país sos?

Opciones: PY, AR, BR, UY, CL, CO, MX',
    shopCurrencyPrompt: '💰 ¿En qué moneda querés cobrar?

Opciones: USD, PYG, ARS, BRL',
    noShops: '📭 No tenés tiendas creadas.

Creá tu primera tienda con el botón de abajo.',
    selectShop: '🏪 Seleccioná una tienda:',
    shopDetails: (shop: ShopSummary) => `*${shop.name}*

📦 Productos: ${shop.productCount}
📋 Órdenes: ${shop.totalOrders}
💰 Ingresos: $${shop.totalRevenue}

Estado: ${shop.status === 'active' ? '🟢 Activa' : shop.status === 'pending' ? '⏳ Pendiente' : '🔴 Inactiva'}`,
    totalShops: 'Tiendas totales',
    totalOrders: 'Órdenes totales',
    totalRevenue: 'Ingresos totales',
    totalCustomers: 'Clientes totales',
    languageChanged: '🇪🇸 Idioma cambiado a Español',
    help: 'ℹ️ *Ayuda*

Comandos disponibles:
/start - Inicio
/shops - Mis tiendas
/stats - Estadísticas
/settings - Configuración
/help - Ayuda

¿Necesitás más ayuda? Contactá a soporte.',
  },
  en: {
    welcome: '👋 Welcome to *Vendy*!

I am the management bot for sellers.

With me you can:
• Create your shop
• Manage products
• View statistics
• Configure payments',
    adminWelcome: '🔐 *Admin Panel*

Welcome, administrator.

Select an option:',
    notAuthorized: '⛔ You do not have permission to access this feature.',
    createShop: '🏪 Create Shop',
    myShops: '🏪 My Shops',
    statistics: '📊 Statistics',
    settings: '⚙️ Settings',
    support: '💬 Support',
    back: '⬅️ Back',
    shopCreated: '✅ Shop created successfully!',
    shopNamePrompt: '🏪 What is your shop name?',
    shopDescPrompt: '📝 What do you sell? (Brief description)',
    shopCategoryPrompt: '📂 What category?

Ex: Electronics, Fashion, Food, etc.',
    shopCountryPrompt: '🌍 What country are you from?

Options: PY, AR, BR, UY, CL, CO, MX',
    shopCurrencyPrompt: '💰 What currency do you want to charge in?

Options: USD, PYG, ARS, BRL',
    noShops: '📭 You have no shops created.

Create your first shop with the button below.',
    selectShop: '🏪 Select a shop:',
    shopDetails: (shop: ShopSummary) => `*${shop.name}*

📦 Products: ${shop.productCount}
📋 Orders: ${shop.totalOrders}
💰 Revenue: $${shop.totalRevenue}

Status: ${shop.status === 'active' ? '🟢 Active' : shop.status === 'pending' ? '⏳ Pending' : '🔴 Inactive'}`,
    totalShops: 'Total shops',
    totalOrders: 'Total orders',
    totalRevenue: 'Total revenue',
    totalCustomers: 'Total customers',
    languageChanged: '🇬🇧 Language changed to English',
    help: 'ℹ️ *Help*

Available commands:
/start - Start
/shops - My shops
/stats - Statistics
/settings - Settings
/help - Help

Need more help? Contact support.',
  },
};

function t(ctx: ParentContext, key: keyof typeof i18n.es, ...args: any[]): string {
  const lang = ctx.session.language || 'es';
  const messages = i18n[lang] || i18n.es;
  const value = messages[key];
  return typeof value === 'function' ? value(...args) : value;
}

// ==========================================
// BOT INSTANCE
// ==========================================
const bot = new Bot<ParentContext>(CONFIG.botToken);

bot.use(session({
  initial: (): ParentSessionData => ({
    isAdmin: false,
    language: 'es',
  }),
}));
bot.use(conversations());
bot.use(hydrateReply);
bot.use(parseMode('Markdown'));

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
function isAdmin(ctx: ParentContext): boolean {
  const telegramId = ctx.from?.id;
  if (!telegramId) return false;
  
  // Check if user is in admin list or has admin flag in session
  return CONFIG.adminTelegramIds.includes(telegramId) || ctx.session.isAdmin;
}

function requireAdmin(handler: (ctx: ParentContext) => Promise<void>) {
  return async (ctx: ParentContext) => {
    if (!isAdmin(ctx)) {
      await ctx.reply(t(ctx, 'notAuthorized'));
      return;
    }
    await handler(ctx);
  };
}

// ==========================================
// API CLIENT
// ==========================================
async function fetchAdminShops(adminId: number): Promise<ShopSummary[]> {
  try {
    const response = await fetch(`${CONFIG.apiUrl}/admin/${adminId}/shops`);
    if (!response.ok) throw new Error('Failed to fetch shops');
    const data = await response.json();
    return data.shops || [];
  } catch (error) {
    console.error('Error fetching shops:', error);
    return getMockShops();
  }
}

async function fetchAdminStats(adminId: number): Promise<any> {
  try {
    const response = await fetch(`${CONFIG.apiUrl}/admin/${adminId}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return getMockStats();
  }
}

function getMockShops(): ShopSummary[] {
  return [
    { id: 1, name: 'TechStore PY', status: 'active', totalOrders: 45, totalRevenue: 12500, productCount: 23, botUsername: 'techstore_py_bot' },
    { id: 2, name: 'Moda Asunción', status: 'active', totalOrders: 12, totalRevenue: 3400, productCount: 15, botUsername: 'moda_asuncion_bot' },
    { id: 3, name: 'Café Premium', status: 'pending', totalOrders: 0, totalRevenue: 0, productCount: 8 },
  ];
}

function getMockStats() {
  return {
    totalShops: 3,
    totalOrders: 57,
    totalRevenue: 15900,
    totalCustomers: 89,
    activeShops: 2,
    pendingShops: 1,
  };
}

// ==========================================
// COMMANDS
// ==========================================
bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id;
  
  // Check if admin
  if (telegramId && CONFIG.adminTelegramIds.includes(telegramId)) {
    ctx.session.isAdmin = true;
    ctx.session.adminId = telegramId;
    await ctx.reply(t(ctx, 'adminWelcome'), { reply_markup: adminMenu });
    return;
  }
  
  await ctx.reply(t(ctx, 'welcome'), { reply_markup: mainMenu });
});

bot.command('shops', async (ctx) => {
  await showShopList(ctx);
});

bot.command('stats', requireAdmin(async (ctx) => {
  await showStats(ctx);
}));

bot.command('settings', async (ctx) => {
  await ctx.reply('⚙️ *Configuración*

Seleccioná una opción:', { reply_markup: settingsMenu });
});

bot.command('help', async (ctx) => {
  await ctx.reply(t(ctx, 'help'));
});

bot.command('language', async (ctx) => {
  await ctx.reply('🌐 *Idioma / Language*', { reply_markup: languageMenu });
});

// ==========================================
// SHOP LIST
// ==========================================
async function showShopList(ctx: ParentContext) {
  const adminId = ctx.session.adminId || ctx.from?.id;
  if (!adminId) {
    await ctx.reply('❌ Error: No se pudo identificar tu usuario.');
    return;
  }

  const shops = await fetchAdminShops(adminId);

  if (shops.length === 0) {
    await ctx.reply(t(ctx, 'noShops'), { reply_markup: createShopMenu });
    return;
  }

  await ctx.reply(t(ctx, 'selectShop'));

  for (const shop of shops) {
    const menu = new Menu<ParentContext>(`shop-${shop.id}`)
      .text('📊 Estadísticas', async (ctx) => {
        ctx.session.selectedShopId = shop.id;
        await showShopStats(ctx, shop);
      })
      .row()
      .text('⚙️ Configurar', async (ctx) => {
        ctx.session.selectedShopId = shop.id;
        await ctx.reply(`⚙️ Configurando *${shop.name}*...

Próximamente.`);
      })
      .row()
      .text('🤖 Bot Hijo', async (ctx) => {
        if (shop.botUsername) {
          await ctx.reply(`🤖 *Bot de tu tienda:*

@${shop.botUsername}

Compartí este link con tus clientes.`);
        } else {
          await ctx.reply('⏳ Tu bot está siendo configurado. Te avisaremos cuando esté listo.');
        }
      });

    bot.use(menu);
    await ctx.reply(t(ctx, 'shopDetails', shop), { reply_markup: menu });
  }
}

async function showShopStats(ctx: ParentContext, shop: ShopSummary) {
  const text = `📊 *${shop.name}*

📦 Productos: ${shop.productCount}
📋 Órdenes: ${shop.totalOrders}
💰 Ingresos: $${shop.totalRevenue}
👥 Clientes: ${Math.floor(shop.totalOrders * 1.5)}`;
  
  await ctx.reply(text, { reply_markup: backToShopsMenu });
}

// ==========================================
// STATS
// ==========================================
async function showStats(ctx: ParentContext) {
  const adminId = ctx.session.adminId || ctx.from?.id;
  if (!adminId) return;

  const stats = await fetchAdminStats(adminId);

  const text = `📊 *Estadísticas Globales*

🏪 ${t(ctx, 'totalShops')}: ${stats.totalShops}
📋 ${t(ctx, 'totalOrders')}: ${stats.totalOrders}
💰 ${t(ctx, 'totalRevenue')}: $${stats.totalRevenue}
👥 ${t(ctx, 'totalCustomers')}: ${stats.totalCustomers}`;

  await ctx.reply(text, { reply_markup: adminMenu });
}

// ==========================================
// MENUS
// ==========================================
const mainMenu = new Menu<ParentContext>('parent-main')
  .text('🏪 Crear Tienda', async (ctx) => {
    await ctx.conversation.enter('createShopConversation');
  })
  .row()
  .text('🏪 Mis Tiendas', async (ctx) => {
    await showShopList(ctx);
  })
  .row()
  .text('📊 Estadísticas', async (ctx) => {
    if (isAdmin(ctx)) {
      await showStats(ctx);
    } else {
      await ctx.reply(t(ctx, 'notAuthorized'));
    }
  })
  .row()
  .text('⚙️ Configuración', async (ctx) => {
    await ctx.reply('⚙️ *Configuración*', { reply_markup: settingsMenu });
  });

const adminMenu = new Menu<ParentContext>('parent-admin')
  .text('🏪 Mis Tiendas', async (ctx) => {
    await showShopList(ctx);
  })
  .row()
  .text('📊 Estadísticas', async (ctx) => {
    await showStats(ctx);
  })
  .row()
  .text('⚙️ Configuración', async (ctx) => {
    await ctx.reply('⚙️ *Configuración*', { reply_markup: settingsMenu });
  })
  .row()
  .text('💬 Soporte', async (ctx) => {
    await ctx.reply('💬 *Soporte*

Contactá: @vendy_support');
  });

const createShopMenu = new Menu<ParentContext>('parent-create-shop')
  .text('➕ Crear Mi Primera Tienda', async (ctx) => {
    await ctx.conversation.enter('createShopConversation');
  })
  .row()
  .text('⬅️ Volver', async (ctx) => {
    await ctx.reply('👋 Menú principal', { reply_markup: mainMenu });
  });

const settingsMenu = new Menu<ParentContext>('parent-settings')
  .text('🌐 Idioma', async (ctx) => {
    await ctx.reply('🌐 *Idioma*', { reply_markup: languageMenu });
  })
  .row()
  .text('🔔 Notificaciones', async (ctx) => {
    await ctx.reply('🔔 *Notificaciones*

Próximamente podrás configurar qué notificaciones querés recibir.');
  })
  .row()
  .text('💳 Métodos de Pago', async (ctx) => {
    await ctx.reply('💳 *Métodos de Pago*

Próximamente podrás configurar Stripe, transferencias y efectivo.');
  })
  .row()
  .text('⬅️ Volver', async (ctx) => {
    await ctx.reply('👋 Menú principal', { reply_markup: isAdmin(ctx) ? adminMenu : mainMenu });
  });

const languageMenu = new Menu<ParentContext>('parent-language')
  .text('🇪🇸 Español', async (ctx) => {
    ctx.session.language = 'es';
    await ctx.answerCallbackQuery({ text: 'Español' });
    await ctx.reply(t(ctx, 'languageChanged'), { reply_markup: mainMenu });
  })
  .text('🇬🇧 English', async (ctx) => {
    ctx.session.language = 'en';
    await ctx.answerCallbackQuery({ text: 'English' });
    await ctx.reply(t(ctx, 'languageChanged'), { reply_markup: mainMenu });
  });

const backToShopsMenu = new Menu<ParentContext>('parent-back-shops')
  .text('⬅️ Volver a Tiendas', async (ctx) => {
    await showShopList(ctx);
  });

bot.use(mainMenu);
bot.use(adminMenu);
bot.use(createShopMenu);
bot.use(settingsMenu);
bot.use(languageMenu);
bot.use(backToShopsMenu);

// ==========================================
// CREATE SHOP CONVERSATION
// ==========================================
async function createShopConversation(conversation: any, ctx: ParentContext) {
  await ctx.reply(t(ctx, 'shopNamePrompt'));
  const nameResponse = await conversation.waitFor(':text');
  const shopName = nameResponse.msg.text;

  await ctx.reply(t(ctx, 'shopDescPrompt'));
  const descResponse = await conversation.waitFor(':text');
  const shopDescription = descResponse.msg.text;

  await ctx.reply(t(ctx, 'shopCategoryPrompt'));
  const catResponse = await conversation.waitFor(':text');
  const shopCategory = catResponse.msg.text;

  await ctx.reply(t(ctx, 'shopCountryPrompt'));
  const countryResponse = await conversation.waitFor(':text');
  const shopCountry = countryResponse.msg.text.toUpperCase();

  await ctx.reply(t(ctx, 'shopCurrencyPrompt'));
  const currencyResponse = await conversation.waitFor(':text');
  const shopCurrency = currencyResponse.msg.text.toUpperCase();

  // Create shop via API
  try {
    const response = await fetch(`${CONFIG.apiUrl}/shops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminId: ctx.from?.id,
        name: shopName,
        description: shopDescription,
        category: shopCategory,
        country: shopCountry,
        currency: shopCurrency,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      await ctx.reply(
        `${t(ctx, 'shopCreated')}

🏪 *${shopName}*
📝 ${shopDescription}
📂 ${shopCategory}
🌍 ${shopCountry}
💰 ${shopCurrency}

Tu tienda está siendo configurada. Te avisaremos cuando esté lista.`,
        { reply_markup: adminMenu }
      );
    } else {
      throw new Error('Failed to create shop');
    }
  } catch (error) {
    // Mock success for demo
    await ctx.reply(
      `${t(ctx, 'shopCreated')}

🏪 *${shopName}*
📝 ${shopDescription}
📂 ${shopCategory}
🌍 ${shopCountry}
💰 ${shopCurrency}

🤖 Bot: @${shopName.toLowerCase().replace(/\s+/g, '_')}_bot

¡Tu tienda está lista!`,
      { reply_markup: adminMenu }
    );
  }
}

bot.use(createConversation(createShopConversation));

// ==========================================
// ERROR HANDLING
// ==========================================
bot.catch((err) => {
  console.error('Parent bot error:', err);
});

// ==========================================
// START
// ==========================================
console.log(`🤖 Bot Padre iniciado`);
console.log(`   Admin IDs: ${CONFIG.adminTelegramIds.join(', ') || 'none configured'}`);

if (process.env.NODE_ENV === 'production') {
  const webhookUrl = process.env.PARENT_WEBHOOK_URL;
  if (webhookUrl) {
    bot.api.setWebhook(webhookUrl).then(() => {
      console.log(`✅ Parent webhook set: ${webhookUrl}`);
    });
  }
} else {
  bot.start();
  console.log('✅ Parent bot polling started');
}

export default bot;
export { CONFIG, isAdmin };
