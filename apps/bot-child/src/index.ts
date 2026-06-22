import { Bot, Context, session, SessionFlavor } from 'grammy';
import { conversations, createConversation, ConversationFlavor } from '@grammyjs/conversations';
import { Menu } from '@grammyjs/menu';
import { hydrateReply, parseMode } from '@grammyjs/hydrate';

// ==========================================
// TYPES
// ==========================================
interface ShopConfig {
  shopId: number;
  name: string;
  description?: string;
  category: string;
  country: string;
  currency: string;
  primaryColor: string;
  botToken: string;
  apiUrl: string;
}

interface SessionData {
  cart: CartItem[];
  selectedCategory?: string;
  language: 'es' | 'en';
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
}

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;

// ==========================================
// CONFIGURATION
// ==========================================
const SHOP_CONFIG: ShopConfig = {
  shopId: parseInt(process.env.SHOP_ID || '1'),
  name: process.env.SHOP_NAME || 'Mi Tienda',
  description: process.env.SHOP_DESCRIPTION,
  category: process.env.SHOP_CATEGORY || 'general',
  country: process.env.SHOP_COUNTRY || 'PY',
  currency: process.env.SHOP_CURRENCY || 'USD',
  primaryColor: process.env.SHOP_COLOR || '#FF7403',
  botToken: process.env.BOT_TOKEN || '',
  apiUrl: process.env.API_URL || 'http://localhost:3001',
};

// Validate token
if (!SHOP_CONFIG.botToken) {
  throw new Error('BOT_TOKEN is required');
}

// ==========================================
// I18N
// ==========================================
const i18n = {
  es: {
    welcome: (name: string) => `¡Bienvenido a *${name}*! 🛍️`,
    description: (desc?: string) => desc || 'Explorá nuestro catálogo y hacé tu pedido.',
    catalog: '📦 Catálogo',
    cart: '🛒 Carrito',
    orders: '📋 Mis Órdenes',
    support: '💬 Soporte',
    back: '⬅️ Volver',
    addToCart: '➕ Agregar',
    viewCart: '🛒 Ver Carrito',
    checkout: '💳 Finalizar Compra',
    emptyCart: 'Tu carrito está vacío',
    quantity: 'Cantidad',
    total: 'Total',
    confirmOrder: '✅ Confirmar Orden',
    cancel: '❌ Cancelar',
    orderConfirmed: '¡Orden confirmada! Número:',
    categories: 'Categorías',
    allProducts: 'Todos los productos',
    inStock: 'En stock',
    outOfStock: 'Sin stock',
    price: 'Precio',
    productAdded: 'Producto agregado al carrito',
    cartUpdated: 'Carrito actualizado',
    orderCancelled: 'Orden cancelada',
    contactSupport: 'Contactá a soporte:',
    languageChanged: 'Idioma cambiado a español',
  },
  en: {
    welcome: (name: string) => `Welcome to *${name}*! 🛍️`,
    description: (desc?: string) => desc || 'Browse our catalog and place your order.',
    catalog: '📦 Catalog',
    cart: '🛒 Cart',
    orders: '📋 My Orders',
    support: '💬 Support',
    back: '⬅️ Back',
    addToCart: '➕ Add',
    viewCart: '🛒 View Cart',
    checkout: '💳 Checkout',
    emptyCart: 'Your cart is empty',
    quantity: 'Quantity',
    total: 'Total',
    confirmOrder: '✅ Confirm Order',
    cancel: '❌ Cancel',
    orderConfirmed: 'Order confirmed! Number:',
    categories: 'Categories',
    allProducts: 'All products',
    inStock: 'In stock',
    outOfStock: 'Out of stock',
    price: 'Price',
    productAdded: 'Product added to cart',
    cartUpdated: 'Cart updated',
    orderCancelled: 'Order cancelled',
    contactSupport: 'Contact support:',
    languageChanged: 'Language changed to English',
  },
};

function t(ctx: MyContext, key: keyof typeof i18n.es, ...args: any[]): string {
  const lang = ctx.session.language || 'es';
  const messages = i18n[lang] || i18n.es;
  const value = messages[key];
  return typeof value === 'function' ? value(...args) : value;
}

// ==========================================
// API CLIENT
// ==========================================
async function fetchProducts(shopId: number, category?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    params.append('limit', '20');
    
    const response = await fetch(`${SHOP_CONFIG.apiUrl}/shops/${shopId}/products?${params}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return getMockProducts();
  }
}

function getMockProducts(): any[] {
  return [
    { id: 1, name: 'iPhone 15 Pro', description: '256GB - Titanio', price: 999, currency: 'USD', category: 'Electrónica', stock: 5, images: [] },
    { id: 2, name: 'AirPods Pro 2', description: 'Cancelación de ruido', price: 249, currency: 'USD', category: 'Electrónica', stock: 10, images: [] },
    { id: 3, name: 'Camiseta Nike', description: 'Talla M - Negro', price: 35, currency: 'USD', category: 'Moda', stock: 20, images: [] },
    { id: 4, name: 'Zapatillas Adidas', description: 'Talla 42 - Blanco', price: 89, currency: 'USD', category: 'Moda', stock: 0, images: [] },
  ];
}

// ==========================================
// BOT INSTANCE
// ==========================================
const bot = new Bot<MyContext>(SHOP_CONFIG.botToken);

// Middleware
bot.use(session({
  initial: (): SessionData => ({
    cart: [],
    language: 'es',
  }),
}));
bot.use(conversations());
bot.use(hydrateReply);
bot.use(parseMode('Markdown'));

// ==========================================
// CATALOG MENU
// ==========================================
function createProductMenu(product: any, ctx: MyContext): Menu<MyContext> {
  const menu = new Menu<MyContext>(`product-${product.id}`);
  
  menu.text(`${t(ctx, 'addToCart')} ($${product.price})`, async (ctx) => {
    const session = ctx.session;
    const existing = session.cart.find(item => item.productId === product.id);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      session.cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    }
    
    await ctx.answerCallbackQuery({ text: t(ctx, 'productAdded') });
    await ctx.reply(`✅ *${product.name}* agregado al carrito.

${t(ctx, 'viewCart')}: /cart`);
  });
  
  return menu;
}

// ==========================================
// COMMANDS
// ==========================================
bot.command('start', async (ctx) => {
  const welcomeText = `${t(ctx, 'welcome', SHOP_CONFIG.name)}

${t(ctx, 'description', SHOP_CONFIG.description)}`;
  
  await ctx.reply(welcomeText, {
    reply_markup: mainMenu,
  });
});

bot.command('catalog', async (ctx) => {
  await showCatalog(ctx);
});

bot.command('cart', async (ctx) => {
  await showCart(ctx);
});

bot.command('orders', async (ctx) => {
  await ctx.reply('📋 *Mis Órdenes*

Próximamente podrás ver el historial de tus órdenes aquí.');
});

bot.command('support', async (ctx) => {
  await ctx.reply(`💬 *Soporte*

${t(ctx, 'contactSupport')} @soporte_${SHOP_CONFIG.shopId}`);
});

bot.command('language', async (ctx) => {
  await ctx.reply('🌐 *Idioma / Language*', { reply_markup: languageMenu });
});

// ==========================================
// CATALOG DISPLAY
// ==========================================
async function showCatalog(ctx: MyContext, category?: string) {
  const products = await fetchProducts(SHOP_CONFIG.shopId, category);
  
  if (products.length === 0) {
    await ctx.reply('📭 No hay productos disponibles en esta categoría.');
    return;
  }
  
  await ctx.reply(`📦 *${t(ctx, 'catalog')}*${category ? ` - ${category}` : ''}
_${products.length} productos_`);
  
  for (const product of products.slice(0, 10)) {
    const stockEmoji = product.stock > 0 ? '🟢' : '🔴';
    const stockText = product.stock > 0 ? `${t(ctx, 'inStock')}: ${product.stock}` : t(ctx, 'outOfStock');
    
    const text = `*${product.name}*
_${product.description}_

💰 $${product.price} ${product.currency}
${stockEmoji} ${stockText}`;
    
    const menu = createProductMenu(product, ctx);
    bot.use(menu);
    
    await ctx.reply(text, { reply_markup: menu });
  }
  
  // Show category filter
  await ctx.reply('📂 *Filtrar por categoría:*', { reply_markup: categoryMenu });
}

// ==========================================
// CART DISPLAY
// ==========================================
async function showCart(ctx: MyContext) {
  const cart = ctx.session.cart;
  
  if (cart.length === 0) {
    await ctx.reply(`🛒 *${t(ctx, 'cart')}*

${t(ctx, 'emptyCart')}`, { reply_markup: mainMenu });
    return;
  }
  
  let text = `🛒 *${t(ctx, 'cart')}*

`;
  let total = 0;
  
  for (const item of cart) {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    text += `• ${item.name} x${item.quantity} = $${itemTotal}
`;
  }
  
  text += `
💰 *${t(ctx, 'total')}:* $${total} ${SHOP_CONFIG.currency}`;
  
  await ctx.reply(text, { reply_markup: cartMenu });
}

// ==========================================
// MENUS
// ==========================================
const mainMenu = new Menu<MyContext>('child-main-menu')
  .text('📦 Catálogo', async (ctx) => {
    await showCatalog(ctx);
  })
  .row()
  .text('🛒 Carrito', async (ctx) => {
    await showCart(ctx);
  })
  .text('📋 Órdenes', async (ctx) => {
    await ctx.reply('📋 *Mis Órdenes*

Próximamente...');
  })
  .row()
  .text('💬 Soporte', async (ctx) => {
    await ctx.reply(`💬 *Soporte*
Contactá: @soporte_${SHOP_CONFIG.shopId}`);
  });

const categoryMenu = new Menu<MyContext>('child-categories')
  .text('📦 Todos', async (ctx) => {
    await showCatalog(ctx, 'all');
  })
  .row()
  .text('💻 Electrónica', async (ctx) => {
    await showCatalog(ctx, 'Electrónica');
  })
  .text('👗 Moda', async (ctx) => {
    await showCatalog(ctx, 'Moda');
  })
  .row()
  .text('🏠 Hogar', async (ctx) => {
    await showCatalog(ctx, 'Hogar');
  })
  .text('⚽ Deportes', async (ctx) => {
    await showCatalog(ctx, 'Deportes');
  })
  .row()
  .text('⬅️ Volver', async (ctx) => {
    await ctx.reply('👋 Menú principal', { reply_markup: mainMenu });
  });

const cartMenu = new Menu<MyContext>('child-cart')
  .text('💳 Finalizar Compra', async (ctx) => {
    await ctx.conversation.enter('checkoutConversation');
  })
  .row()
  .text('🗑️ Vaciar Carrito', async (ctx) => {
    ctx.session.cart = [];
    await ctx.answerCallbackQuery({ text: 'Carrito vaciado' });
    await ctx.reply('🗑️ Carrito vaciado.', { reply_markup: mainMenu });
  })
  .row()
  .text('⬅️ Volver', async (ctx) => {
    await ctx.reply('👋 Menú principal', { reply_markup: mainMenu });
  });

const languageMenu = new Menu<MyContext>('child-language')
  .text('🇪🇸 Español', async (ctx) => {
    ctx.session.language = 'es';
    await ctx.answerCallbackQuery({ text: 'Idioma: Español' });
    await ctx.reply('🇪🇸 *Español* seleccionado.', { reply_markup: mainMenu });
  })
  .text('🇬🇧 English', async (ctx) => {
    ctx.session.language = 'en';
    await ctx.answerCallbackQuery({ text: 'Language: English' });
    await ctx.reply('🇬🇧 *English* selected.', { reply_markup: mainMenu });
  });

bot.use(mainMenu);
bot.use(categoryMenu);
bot.use(cartMenu);
bot.use(languageMenu);

// ==========================================
// CHECKOUT CONVERSATION
// ==========================================
async function checkoutConversation(conversation: any, ctx: MyContext) {
  const cart = ctx.session.cart;
  
  if (cart.length === 0) {
    await ctx.reply('🛒 Tu carrito está vacío.');
    return;
  }
  
  // Calculate total
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Ask for name
  await ctx.reply('📦 *Finalizar Compra*

¿Cuál es tu nombre completo?');
  const nameResponse = await conversation.waitFor(':text');
  const fullName = nameResponse.msg.text;
  
  // Ask for phone
  await ctx.reply('📱 ¿Cuál es tu número de teléfono?');
  const phoneResponse = await conversation.waitFor(':text');
  const phone = phoneResponse.msg.text;
  
  // Ask for address
  await ctx.reply('📍 ¿Cuál es tu dirección de entrega?');
  const addressResponse = await conversation.waitFor(':text');
  const address = addressResponse.msg.text;
  
  // Confirm order
  let confirmText = `📋 *Confirmar Orden*

`;
  confirmText += `👤 *Cliente:* ${fullName}
`;
  confirmText += `📱 *Teléfono:* ${phone}
`;
  confirmText += `📍 *Dirección:* ${address}

`;
  confirmText += `🛒 *Productos:*
`;
  
  for (const item of cart) {
    confirmText += `• ${item.name} x${item.quantity} = $${item.price * item.quantity}
`;
  }
  
  confirmText += `
💰 *Total:* $${total} ${SHOP_CONFIG.currency}`;
  
  await ctx.reply(confirmText, {
    reply_markup: new Menu('confirm-order')
      .text('✅ Confirmar', async (ctx) => {
        // Generate order number
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
        
        // Clear cart
        ctx.session.cart = [];
        
        await ctx.reply(`✅ *¡Orden Confirmada!*

Número: \`${orderNumber}\`

Gracias por tu compra. Te contactaremos pronto para coordinar la entrega.`);
      })
      .text('❌ Cancelar', async (ctx) => {
        await ctx.reply('❌ Orden cancelada.');
      }),
  });
}

bot.use(createConversation(checkoutConversation));

// ==========================================
// ERROR HANDLING
// ==========================================
bot.catch((err) => {
  console.error('Bot error:', err);
});

// ==========================================
// START
// ==========================================
console.log(`🤖 Bot Hijo iniciado: ${SHOP_CONFIG.name} (Shop #${SHOP_CONFIG.shopId})`);

if (process.env.NODE_ENV === 'production') {
  // Webhook mode
  const webhookUrl = process.env.WEBHOOK_URL;
  if (webhookUrl) {
    bot.api.setWebhook(webhookUrl).then(() => {
      console.log(`✅ Webhook set: ${webhookUrl}`);
    });
  }
} else {
  // Polling mode
  bot.start();
  console.log('✅ Polling started');
}

export default bot;
