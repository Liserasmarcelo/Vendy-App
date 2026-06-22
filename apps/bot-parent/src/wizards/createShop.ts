import { Bot, Context, session, SessionFlavor } from 'grammy';
import { conversations, createConversation, ConversationFlavor } from '@grammyjs/conversations';
import { Menu } from '@grammyjs/menu';
import { z } from 'zod';

// ==========================================
// TIPOS Y ESQUEMAS DE VALIDACIÓN
// ==========================================

interface SessionData {
  step: string | null;
  shopData: {
    name?: string;
    description?: string;
    category?: string;
    country?: string;
    currency?: string;
  };
  selectedShopId: number | null;
  language: string;
  wizardHistory: string[];
}

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;

// Esquemas Zod para validación
const shopNameSchema = z.string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre no puede exceder 100 caracteres')
  .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s&'-]+$/, 'El nombre contiene caracteres no válidos');

const shopDescriptionSchema = z.string()
  .max(500, 'La descripción no puede exceder 500 caracteres')
  .optional();

// ==========================================
// CONFIGURACIÓN DE DATOS
// ==========================================

const CATEGORIES = [
  { id: 'electronics', name: 'Electrónica', emoji: '💻' },
  { id: 'fashion', name: 'Moda', emoji: '👗' },
  { id: 'beauty', name: 'Belleza', emoji: '💄' },
  { id: 'food', name: 'Alimentos', emoji: '🍔' },
  { id: 'home', name: 'Hogar', emoji: '🏠' },
  { id: 'sports', name: 'Deportes', emoji: '⚽' },
  { id: 'toys', name: 'Juguetes', emoji: '🧸' },
  { id: 'books', name: 'Libros', emoji: '📚' },
  { id: 'health', name: 'Salud', emoji: '💊' },
  { id: 'other', name: 'Otros', emoji: '📦' },
];

const COUNTRIES = [
  { code: 'PY', name: 'Paraguay', emoji: '🇵🇾' },
  { code: 'AR', name: 'Argentina', emoji: '🇦🇷' },
  { code: 'BR', name: 'Brasil', emoji: '🇧🇷' },
  { code: 'UY', name: 'Uruguay', emoji: '🇺🇾' },
  { code: 'CL', name: 'Chile', emoji: '🇨🇱' },
  { code: 'CO', name: 'Colombia', emoji: '🇨🇴' },
  { code: 'MX', name: 'México', emoji: '🇲🇽' },
  { code: 'ES', name: 'España', emoji: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', emoji: '🇺🇸' },
  { code: 'PE', name: 'Perú', emoji: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', emoji: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', emoji: '🇧🇴' },
  { code: 'OTHER', name: 'Otro', emoji: '🌍' },
];

const CURRENCIES = [
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$', emoji: '💵' },
  { code: 'PYG', name: 'Guaraní paraguayo', symbol: '₲', emoji: '🇵🇾' },
  { code: 'ARS', name: 'Peso argentino', symbol: '$', emoji: '🇦🇷' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$', emoji: '🇧🇷' },
  { code: 'UYU', name: 'Peso uruguayo', symbol: '$', emoji: '🇺🇾' },
  { code: 'CLP', name: 'Peso chileno', symbol: '$', emoji: '🇨🇱' },
  { code: 'COP', name: 'Peso colombiano', symbol: '$', emoji: '🇨🇴' },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$', emoji: '🇲🇽' },
  { code: 'EUR', name: 'Euro', symbol: '€', emoji: '🇪🇺' },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£', emoji: '🇬🇧' },
];

// ==========================================
// TRADUCCIONES
// ==========================================

const i18n = {
  es: {
    wizard: {
      welcome: '🏪 *Crear Nueva Tienda*\n\nTe guiaré paso a paso. Podés cancelar en cualquier momento con /cancel.',
      step1: '✏️ *Paso 1/5: Nombre de tu tienda*\n\n¿Cómo se llama tu negocio?\n\n_Ejemplos: "ElectroTech", "Moda Paraguay", "Café Central"_',
      step1Error: '❌ *Nombre inválido*\n\n{error}\n\nIntentá de nuevo o escribí /cancel para salir.',
      step2: '✏️ *Paso 2/5: Descripción*\n\nDescribí brevemente qué vendés (opcional).\n\n_Ejemplo: "Venta de electrónica y accesorios"_\n\nEscribí /skip para omitir.',
      step2Error: '❌ *Descripción muy larga*\n\n{error}\n\nIntentá de nuevo o escribí /skip para omitir.',
      step3: '📂 *Paso 3/5: Categoría*\n\n¿Qué categoría describe mejor tu negocio?',
      step4: '🌍 *Paso 4/5: País*\n\n¿En qué país operás principalmente?',
      step5: '💱 *Paso 5/5: Moneda*\n\n¿Qué moneda usás para tus precios?',
      summary: '📋 *Resumen de tu tienda*\n\n🏪 *Nombre:* {name}\n📝 *Descripción:* {description}\n📂 *Categoría:* {category}\n🌍 *País:* {country}\n💱 *Moneda:* {currency}\n\n¿Todo correcto?',
      summaryNoDescription: '📋 *Resumen de tu tienda*\n\n🏪 *Nombre:* {name}\n📝 *Descripción:* _Sin descripción_\n📂 *Categoría:* {category}\n🌍 *País:* {country}\n💱 *Moneda:* {currency}\n\n¿Todo correcto?',
      creating: '⏳ *Creando tu tienda...*\n\nEsto tomará unos segundos.',
      success: '🎉 *¡Tienda creada exitosamente!*\n\n🏪 *{name}*\n🆔 *ID:* `{id}`\n\n✅ Ahora podés:\n• Agregar productos desde el panel web\n• Configurar métodos de pago\n• Compartir tu tienda con clientes\n\n📱 Accedé a tu panel: [Abrir Vendy](https://t.me/vendy_parent_bot?startapp=shop_{id})',
      error: '❌ *Error al crear la tienda*\n\n{message}\n\nPor favor, intentá de nuevo con /start.',
      cancelled: '❌ *Creación cancelada*\n\nNo se creó ninguna tienda.\n\n¿Querés intentar de nuevo? Usá /start.',
      timeout: '⏰ *Tiempo agotado*\n\nLa creación de tienda se canceló por inactividad.\n\n¿Querés intentar de nuevo? Usá /start.',
      invalidInput: '❌ *Entrada no válida*\n\nPor favor, seguí las instrucciones o escribí /cancel para salir.',
      backButton: '⬅️ Volver',
      skipButton: '⏭️ Omitir',
      confirmButton: '✅ Confirmar',
      cancelButton: '❌ Cancelar',
      editButton: '✏️ Editar',
      maxShopsError: '❌ *Límite alcanzado*\n\nYa tenés el máximo de tiendas permitidas para tu plan.\n\nActualizá tu plan para crear más tiendas.',
      apiError: '❌ *Error de conexión*\n\nNo se pudo conectar con el servidor.\n\nPor favor, intentá más tarde.',
    },
    categories: Object.fromEntries(CATEGORIES.map(c => [c.id, `${c.emoji} ${c.name}`])),
    countries: Object.fromEntries(COUNTRIES.map(c => [c.code, `${c.emoji} ${c.name}`])),
    currencies: Object.fromEntries(CURRENCIES.map(c => [c.code, `${c.emoji} ${c.name} (${c.symbol})`])),
  },
  en: {
    wizard: {
      welcome: '🏪 *Create New Store*\n\nI\'ll guide you step by step. You can cancel anytime with /cancel.',
      step1: '✏️ *Step 1/5: Store Name*\n\nWhat\'s your business name?\n\n_Examples: "ElectroTech", "Fashion Store", "Central Cafe"_',
      step1Error: '❌ *Invalid Name*\n\n{error}\n\nTry again or type /cancel to exit.',
      step2: '✏️ *Step 2/5: Description*\n\nBriefly describe what you sell (optional).\n\n_Example: "Electronics and accessories sales"_\n\nType /skip to skip.',
      step2Error: '❌ *Description too long*\n\n{error}\n\nTry again or type /skip to skip.',
      step3: '📂 *Step 3/5: Category*\n\nWhich category best describes your business?',
      step4: '🌍 *Step 4/5: Country*\n\nWhich country do you primarily operate in?',
      step5: '💱 *Step 5/5: Currency*\n\nWhat currency do you use for your prices?',
      summary: '📋 *Store Summary*\n\n🏪 *Name:* {name}\n📝 *Description:* {description}\n📂 *Category:* {category}\n🌍 *Country:* {country}\n💱 *Currency:* {currency}\n\nEverything correct?',
      summaryNoDescription: '📋 *Store Summary*\n\n🏪 *Name:* {name}\n📝 *Description:* _No description_\n📂 *Category:* {category}\n🌍 *Country:* {country}\n💱 *Currency:* {currency}\n\nEverything correct?',
      creating: '⏳ *Creating your store...*\n\nThis will take a few seconds.',
      success: '🎉 *Store created successfully!*\n\n🏪 *{name}*\n🆔 *ID:* `{id}`\n\n✅ Now you can:\n• Add products from the web panel\n• Set up payment methods\n• Share your store with customers\n\n📱 Access your panel: [Open Vendy](https://t.me/vendy_parent_bot?startapp=shop_{id})',
      error: '❌ *Error creating store*\n\n{message}\n\nPlease try again with /start.',
      cancelled: '❌ *Creation cancelled*\n\nNo store was created.\n\nWant to try again? Use /start.',
      timeout: '⏰ *Time expired*\n\nStore creation was cancelled due to inactivity.\n\nWant to try again? Use /start.',
      invalidInput: '❌ *Invalid input*\n\nPlease follow the instructions or type /cancel to exit.',
      backButton: '⬅️ Back',
      skipButton: '⏭️ Skip',
      confirmButton: '✅ Confirm',
      cancelButton: '❌ Cancel',
      editButton: '✏️ Edit',
      maxShopsError: '❌ *Limit reached*\n\nYou already have the maximum stores allowed for your plan.\n\nUpgrade your plan to create more stores.',
      apiError: '❌ *Connection error*\n\nCould not connect to the server.\n\nPlease try again later.',
    },
    categories: Object.fromEntries(CATEGORIES.map(c => [c.id, `${c.emoji} ${c.name}`])),
    countries: Object.fromEntries(COUNTRIES.map(c => [c.code, `${c.emoji} ${c.name}`])),
    currencies: Object.fromEntries(CURRENCIES.map(c => [c.code, `${c.emoji} ${c.name} (${c.symbol})`])),
  },
};

function t(ctx: MyContext, key: string, replacements?: Record<string, string>): string {
  const lang = ctx.session?.language || 'es';
  const messages = i18n[lang as keyof typeof i18n] || i18n.es;
  
  const keys = key.split('.');
  let message: any = messages;
  for (const k of keys) {
    message = message?.[k];
  }
  
  if (!message || typeof message !== 'string') {
    let fallback: any = i18n.es;
    for (const k of keys) {
      fallback = fallback?.[k];
    }
    message = fallback || key;
  }
  
  if (replacements) {
    return Object.entries(replacements).reduce(
      (str, [k, v]) => str.replace(new RegExp(`{${k}}`, 'g'), v),
      message as string
    );
  }
  
  return message as string;
}

// ==========================================
// WIZARD DE CREACIÓN DE TIENDA (REFINADO)
// ==========================================

export async function createShopWizard(conversation: any, ctx: MyContext) {
  const user = ctx.from;
  if (!user) return;
  
  // Inicializar historial
  ctx.session.wizardHistory = ['start'];
  
  try {
    // Verificar límite de tiendas antes de comenzar
    const shopCount = await checkShopCount(ctx);
    if (shopCount >= 3) { // Límite de GROWTH plan
      await ctx.reply(t(ctx, 'wizard.maxShopsError'), { parse_mode: 'Markdown' });
      return;
    }
    
    // Mensaje de bienvenida
    await ctx.reply(t(ctx, 'wizard.welcome'), { parse_mode: 'Markdown' });
    
    // ====================
    // PASO 1: Nombre
    // ====================
    ctx.session.wizardHistory.push('name');
    const name = await askForName(conversation, ctx);
    if (name === null) return; // Cancelado
    ctx.session.shopData.name = name;
    
    // ====================
    // PASO 2: Descripción
    // ====================
    ctx.session.wizardHistory.push('description');
    const description = await askForDescription(conversation, ctx);
    if (description === null) return; // Cancelado
    ctx.session.shopData.description = description;
    
    // ====================
    // PASO 3: Categoría
    // ====================
    ctx.session.wizardHistory.push('category');
    const category = await askForCategory(conversation, ctx);
    if (category === null) return; // Cancelado
    ctx.session.shopData.category = category;
    
    // ====================
    // PASO 4: País
    // ====================
    ctx.session.wizardHistory.push('country');
    const country = await askForCountry(conversation, ctx);
    if (country === null) return; // Cancelado
    ctx.session.shopData.country = country;
    
    // ====================
    // PASO 5: Moneda
    // ====================
    ctx.session.wizardHistory.push('currency');
    const currency = await askForCurrency(conversation, ctx);
    if (currency === null) return; // Cancelado
    ctx.session.shopData.currency = currency;
    
    // ====================
    // RESUMEN Y CONFIRMACIÓN
    // ====================
    ctx.session.wizardHistory.push('summary');
    const confirmed = await askForConfirmation(conversation, ctx);
    if (!confirmed) {
      await ctx.reply(t(ctx, 'wizard.cancelled'), { parse_mode: 'Markdown' });
      return;
    }
    
    // ====================
    // CREAR TIENDA EN API
    // ====================
    await ctx.reply(t(ctx, 'wizard.creating'), { parse_mode: 'Markdown' });
    
    const shop = await createShopInAPI(ctx);
    if (shop) {
      await ctx.reply(
        t(ctx, 'wizard.success', { name: shop.name, id: shop.id.toString() }),
        { parse_mode: 'Markdown', disable_web_page_preview: true }
      );
    } else {
      await ctx.reply(t(ctx, 'wizard.error', { message: 'Error desconocido' }), { parse_mode: 'Markdown' });
    }
    
  } catch (error) {
    console.error('Error en wizard:', error);
    
    if (error instanceof TimeoutError) {
      await ctx.reply(t(ctx, 'wizard.timeout'), { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(
        t(ctx, 'wizard.error', { message: (error as Error).message || 'Error desconocido' }),
        { parse_mode: 'Markdown' }
      );
    }
  } finally {
    // Limpiar datos del wizard
    ctx.session.step = null;
    ctx.session.shopData = {};
    ctx.session.wizardHistory = [];
  }
}

// ==========================================
// PASOS DEL WIZARD (con validaciones)
// ==========================================

async function askForName(conversation: any, ctx: MyContext): Promise<string | null> {
  await ctx.reply(t(ctx, 'wizard.step1'), { parse_mode: 'Markdown' });
  
  while (true) {
    const response = await conversation.waitFor('message:text', {
      timeout: 300000, // 5 minutos timeout
    });
    
    const text = response.message.text.trim();
    
    // Verificar cancelación
    if (text === '/cancel') {
      await ctx.reply(t(ctx, 'wizard.cancelled'), { parse_mode: 'Markdown' });
      return null;
    }
    
    // Validar
    const validation = shopNameSchema.safeParse(text);
    if (validation.success) {
      return text;
    }
    
    // Mostrar error
    const errorMessage = validation.error.errors[0]?.message || 'Nombre inválido';
    await ctx.reply(
      t(ctx, 'wizard.step1Error', { error: errorMessage }),
      { parse_mode: 'Markdown' }
    );
  }
}

async function askForDescription(conversation: any, ctx: MyContext): Promise<string | null> {
  await ctx.reply(t(ctx, 'wizard.step2'), { parse_mode: 'Markdown' });
  
  while (true) {
    const response = await conversation.waitFor(['message:text', 'callback_query'], {
      timeout: 300000,
    });
    
    // Si es callback_query (botón)
    if (response.callbackQuery) {
      const data = response.callbackQuery.data;
      await response.answerCallbackQuery();
      
      if (data === 'skip_description') {
        return '';
      }
      continue;
    }
    
    const text = response.message.text.trim();
    
    // Verificar comandos
    if (text === '/cancel') {
      await ctx.reply(t(ctx, 'wizard.cancelled'), { parse_mode: 'Markdown' });
      return null;
    }
    
    if (text === '/skip') {
      return '';
    }
    
    // Validar
    const validation = shopDescriptionSchema.safeParse(text);
    if (validation.success) {
      return text;
    }
    
    const errorMessage = validation.error.errors[0]?.message || 'Descripción inválida';
    await ctx.reply(
      t(ctx, 'wizard.step2Error', { error: errorMessage }),
      { parse_mode: 'Markdown' }
    );
  }
}

async function askForCategory(conversation: any, ctx: MyContext): Promise<string | null> {
  // Crear botones de categorías (2 por fila)
  const categoryButtons = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    const row = [];
    row.push({
      text: `${CATEGORIES[i].emoji} ${CATEGORIES[i].name}`,
      callback_data: `cat_${CATEGORIES[i].id}`,
    });
    if (CATEGORIES[i + 1]) {
      row.push({
        text: `${CATEGORIES[i + 1].emoji} ${CATEGORIES[i + 1].name}`,
        callback_data: `cat_${CATEGORIES[i + 1].id}`,
      });
    }
    categoryButtons.push(row);
  }
  
  // Agregar botón de cancelar
  categoryButtons.push([
    { text: '❌ Cancelar', callback_data: 'cancel_wizard' },
  ]);
  
  await ctx.reply(t(ctx, 'wizard.step3'), {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: categoryButtons,
    },
  });
  
  while (true) {
    const response = await conversation.waitFor('callback_query', {
      timeout: 300000,
    });
    
    const data = response.callbackQuery.data;
    await response.answerCallbackQuery();
    
    if (data === 'cancel_wizard') {
      await ctx.reply(t(ctx, 'wizard.cancelled'), { parse_mode: 'Markdown' });
      return null;
    }
    
    if (data.startsWith('cat_')) {
      const categoryId = data.replace('cat_', '');
      const category = CATEGORIES.find(c => c.id === categoryId);
      if (category) {
        return category.name;
      }
    }
    
    // Si llega acá, input inválido
    await ctx.reply(t(ctx, 'wizard.invalidInput'), { parse_mode: 'Markdown' });
  }
}

async function askForCountry(conversation: any, ctx: MyContext): Promise<string | null> {
  // Crear botones de países (2 por fila)
  const countryButtons = [];
  for (let i = 0; i < COUNTRIES.length; i += 2) {
    const row = [];
    row.push({
      text: `${COUNTRIES[i].emoji} ${COUNTRIES[i].name}`,
      callback_data: `country_${COUNTRIES[i].code}`,
    });
    if (COUNTRIES[i + 1]) {
      row.push({
        text: `${COUNTRIES[i + 1].emoji} ${COUNTRIES[i + 1].name}`,
        callback_data: `country_${COUNTRIES[i + 1].code}`,
      });
    }
    countryButtons.push(row);
  }
  
  // Agregar botón de volver
  countryButtons.push([
    { text: '⬅️ Volver', callback_data: 'back_to_category' },
    { text: '❌ Cancelar', callback_data: 'cancel_wizard' },
  ]);
  
  await ctx.reply(t(ctx, 'wizard.step4'), {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: countryButtons,
    },
  });
  
  while (true) {
    const response = await conversation.waitFor('callback_query', {
      timeout: 300000,
    });
    
    const data = response.callbackQuery.data;
    await response.answerCallbackQuery();
    
    if (data === 'cancel_wizard') {
      await ctx.reply(t(ctx, 'wizard.cancelled'), { parse_mode: 'Markdown' });
      return null;
    }
    
    if (data === 'back_to_category') {
      // Volver al paso anterior
      ctx.session.wizardHistory.pop();
      const category = await askForCategory(conversation, ctx);
      if (category === null) return null;
      ctx.session.shopData.category = category;
      // Re-mostrar país
      await ctx.reply(t(ctx, 'wizard.step4'), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: countryButtons,
        },
      });
      continue;
    }
    
    if (data.startsWith('country_')) {
      const countryCode = data.replace('country_', '');
      const country = COUNTRIES.find(c => c.code === countryCode);
      if (country) {
        return country.code;
      }
    }
    
    await ctx.reply(t(ctx, 'wizard.invalidInput'), { parse_mode: 'Markdown' });
  }
}

async function askForCurrency(conversation: any, ctx: MyContext): Promise<string | null> {
  // Crear botones de monedas (2 por fila)
  const currencyButtons = [];
  for (let i = 0; i < CURRENCIES.length; i += 2) {
    const row = [];
    row.push({
      text: `${CURRENCIES[i].emoji} ${CURRENCIES[i].code}`,
      callback_data: `currency_${CURRENCIES[i].code}`,
    });
    if (CURRENCIES[i + 1]) {
      row.push({
        text: `${CURRENCIES[i + 1].emoji} ${CURRENCIES[i + 1].code}`,
        callback_data: `currency_${CURRENCIES[i + 1].code}`,
      });
    }
    currencyButtons.push(row);
  }
  
  // Agregar botón de volver
  currencyButtons.push([
    { text: '⬅️ Volver', callback_data: 'back_to_country' },
    { text: '❌ Cancelar', callback_data: 'cancel_wizard' },
  ]);
  
  await ctx.reply(t(ctx, 'wizard.step5'), {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: currencyButtons,
    },
  });
  
  while (true) {
    const response = await conversation.waitFor('callback_query', {
      timeout: 300000,
    });
    
    const data = response.callbackQuery.data;
    await response.answerCallbackQuery();
    
    if (data === 'cancel_wizard') {
      await ctx.reply(t(ctx, 'wizard.cancelled'), { parse_mode: 'Markdown' });
      return null;
    }
    
    if (data === 'back_to_country') {
      // Volver al paso anterior
      ctx.session.wizardHistory.pop();
      const country = await askForCountry(conversation, ctx);
      if (country === null) return null;
      ctx.session.shopData.country = country;
      // Re-mostrar moneda
      await ctx.reply(t(ctx, 'wizard.step5'), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: currencyButtons,
        },
      });
      continue;
    }
    
    if (data.startsWith('currency_')) {
      const currencyCode = data.replace('currency_', '');
      const currency = CURRENCIES.find(c => c.code === currencyCode);
      if (currency) {
        return currency.code;
      }
    }
    
    await ctx.reply(t(ctx, 'wizard.invalidInput'), { parse_mode: 'Markdown' });
  }
}

async function askForConfirmation(conversation: any, ctx: MyContext): Promise<boolean> {
  const { name, description, category, country, currency } = ctx.session.shopData;
  
  const countryName = COUNTRIES.find(c => c.code === country)?.name || country;
  const currencyName = CURRENCIES.find(c => c.code === currency)?.name || currency;
  
  const template = description 
    ? t(ctx, 'wizard.summary', {
        name: name!,
        description: description || '_Sin descripción_',
        category: category!,
        country: countryName,
        currency: currencyName,
      })
    : t(ctx, 'wizard.summaryNoDescription', {
        name: name!,
        category: category!,
        country: countryName,
        currency: currencyName,
      });
  
  await ctx.reply(template, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Confirmar', callback_data: 'confirm_create' },
          { text: '❌ Cancelar', callback_data: 'cancel_create' },
        ],
        [
          { text: '✏️ Editar', callback_data: 'edit_shop' },
        ],
      ],
    },
  });
  
  while (true) {
    const response = await conversation.waitFor('callback_query', {
      timeout: 300000,
    });
    
    const data = response.callbackQuery.data;
    await response.answerCallbackQuery();
    
    if (data === 'confirm_create') {
      return true;
    }
    
    if (data === 'cancel_create') {
      return false;
    }
    
    if (data === 'edit_shop') {
      // TODO: Implementar edición de campos específicos
      await ctx.reply('📝 Edición próximamente... Por favor, confirmá o cancelá.');
      continue;
    }
    
    await ctx.reply(t(ctx, 'wizard.invalidInput'), { parse_mode: 'Markdown' });
  }
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

class TimeoutError extends Error {
  constructor() {
    super('Timeout');
    this.name = 'TimeoutError';
  }
}

async function checkShopCount(ctx: MyContext): Promise<number> {
  try {
    const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/shops`, {
      headers: {
        'X-Telegram-Init-Data': generateInitData(ctx),
      },
    });
    
    if (response.ok) {
      const data = await response.json() as { shops: any[] };
      return data.shops?.length || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error checking shop count:', error);
    return 0;
  }
}

async function createShopInAPI(ctx: MyContext): Promise<{ id: number; name: string } | null> {
  try {
    const { name, description, category, country, currency } = ctx.session.shopData;
    
    const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/shops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': generateInitData(ctx),
      },
      body: JSON.stringify({
        name,
        description: description || undefined,
        category,
        country,
        currency,
      }),
    });
    
    if (response.ok) {
      const data = await response.json() as { shop: { id: number; name: string } };
      return data.shop;
    }
    
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Error al crear tienda');
  } catch (error) {
    console.error('Error creating shop:', error);
    throw error;
  }
}

function generateInitData(ctx: MyContext): string {
  const user = ctx.from;
  if (!user) return '';
  
  const userData = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name || '',
    username: user.username || '',
    language_code: user.language_code || 'es',
    allows_write_to_pm: true,
  };
  
  const authDate = Math.floor(Date.now() / 1000);
  
  const params = new URLSearchParams();
  params.set('user', JSON.stringify(userData));
  params.set('auth_date', authDate.toString());
  params.set('hash', 'dev_hash_' + authDate);
  
  return params.toString();
}

// ==========================================
// EXPORTAR WIZARD
// ==========================================

export default createShopWizard;
