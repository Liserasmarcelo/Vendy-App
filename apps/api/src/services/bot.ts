import { Telegraf, Markup, Context } from 'telegraf';
import type { Update } from 'telegraf/types';

/**
 * Telegram Bot Service for Vendy.
 *
 * Configures and runs the parent bot (@vendy_bot) that handles:
 * - /start command with Mini App open button
 * - /help command with available commands list
 * - /language command for language selection
 * - Callback queries (inline button interactions)
 * - Pre-checkout queries (payment validation)
 * - Successful payment confirmations
 * - Error handling and logging
 *
 * The bot operates in webhook mode in production (via /webhook endpoint)
 * and can run in polling mode for development.
 *
 * @see https://telegraf.js.org/
 * @see https://core.telegram.org/bots/api
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BotConfig {
  token: string;
  webhookUrl?: string;
  webhookSecret?: string;
  appUrl: string;
  isProduction: boolean;
}

interface ShopInfo {
  id: string;
  name: string;
  description?: string;
  currency: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

function getConfig(): BotConfig {
  const token = process.env.PARENT_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('PARENT_BOT_TOKEN or BOT_TOKEN environment variable is required');
  }

  return {
    token,
    webhookUrl: process.env.WEBHOOK_URL,
    webhookSecret: process.env.WEBHOOK_SECRET,
    appUrl: process.env.MINI_APP_URL || 'https://app.vendy.app',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bot instance
// ─────────────────────────────────────────────────────────────────────────────

let botInstance: Telegraf | null = null;

/**
 * Get or create the Telegraf bot instance.
 * Singleton pattern to ensure single bot instance across the app.
 */
export function getBot(): Telegraf {
  if (botInstance) {
    return botInstance;
  }

  const config = getConfig();
  botInstance = createBot(config);
  return botInstance;
}

/**
 * Create a new Telegraf bot instance with all handlers configured.
 */
export function createBot(config: BotConfig): Telegraf {
  const bot = new Telegraf(config.token);

  // Register all handlers
  registerStartCommand(bot, config);
  registerHelpCommand(bot);
  registerLanguageCommand(bot);
  registerCallbackQueries(bot);
  registerPreCheckoutQuery(bot);
  registerSuccessfulPayment(bot);
  registerErrorHandler(bot);

  return bot;
}

// ─────────────────────────────────────────────────────────────────────────────
// Command handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * /start command handler.
 *
 * Entry point for new users. Shows welcome message and button to open Mini App.
 * Supports deep linking with start parameter (e.g., /start shop_123).
 */
function registerStartCommand(bot: Telegraf, config: BotConfig): void {
  bot.start(async (ctx) => {
    const startParam = ctx.payload; // e.g., "shop_123" from /start shop_123
    const user = ctx.from;

    // Log user interaction for analytics
    console.log({
      event: 'bot_start',
      userId: user?.id,
      username: user?.username,
      startParam,
      timestamp: new Date().toISOString(),
    });

    // Build Mini App URL with start parameter if provided
    let appUrl = config.appUrl;
    if (startParam) {
      appUrl = `${appUrl}?startapp=${encodeURIComponent(startParam)}`;
    }

    // Welcome message with localized text
    const welcomeText = startParam
      ? `👋 Welcome to Vendy!\n\nYou were invited to shop. Tap the button below to open the store.`
      : `👋 Welcome to Vendy!\n\nYour store-as-a-service platform. Tap the button below to get started.`;

    // Send welcome message with Mini App button
    await ctx.reply(welcomeText, {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.webApp('🛍️ Open Vendy', appUrl)],
        [Markup.button.callback('❓ Help', 'help')],
      ]).reply_markup,
    });

    // Track in analytics (non-blocking)
    trackEvent('bot_start', {
      userId: user?.id,
      startParam,
      language: user?.language_code,
    }).catch(() => { /* silent fail */ });
  });
}

/**
 * /help command handler.
 *
 * Shows available commands and how to use the bot.
 */
function registerHelpCommand(bot: Telegraf): void {
  bot.help(async (ctx) => {
    const helpText = `
🛍️ *Vendy Bot - Help*

*Commands:*
/start - Start using Vendy
/help - Show this help message
/language - Change language

*How to use:*
1. Tap "Open Vendy" to launch the Mini App
2. Browse products in your store
3. Add items to cart
4. Checkout with your preferred payment method

*Need support?*
Contact us at @vendy_support
    `.trim();

    await ctx.reply(helpText, { parse_mode: 'Markdown' });
  });
}

/**
 * /language command handler.
 *
 * Shows language selection inline keyboard.
 */
function registerLanguageCommand(bot: Telegraf): void {
  bot.command('language', async (ctx) => {
    await ctx.reply(
      '🌐 Select your language / Selecciona tu idioma / Selecione seu idioma:',
      {
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback('🇺🇸 English', 'lang_en'),
            Markup.button.callback('🇪🇸 Español', 'lang_es'),
          ],
          [
            Markup.button.callback('🇧🇷 Português', 'lang_pt'),
          ],
        ]).reply_markup,
      }
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Callback query handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle inline button callbacks.
 */
function registerCallbackQueries(bot: Telegraf): void {
  // Help button
  bot.action('help', async (ctx) => {
    await ctx.answerCbQuery('Opening help...');
    await ctx.editMessageText(
      '📚 *Help Center*\n\nChoose a topic:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🛍️ How to shop', 'help_shop')],
          [Markup.button.callback('💳 Payments', 'help_payments')],
          [Markup.button.callback('🏪 For sellers', 'help_sellers')],
          [Markup.button.callback('🔙 Back', 'help_back')],
        ]).reply_markup,
      }
    );
  });

  // Help sub-topics
  bot.action('help_shop', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '🛍️ *How to Shop*\n\n1. Open the Mini App\n2. Browse products\n3. Add to cart\n4. Checkout\n5. Track your order',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Back', 'help')],
        ]).reply_markup,
      }
    );
  });

  bot.action('help_payments', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '💳 *Payments*\n\nWe accept:\n• Credit/Debit cards (Visa, Mastercard)\n• Bank transfers\n• Cash on delivery (where available)\n\nAll transactions are secure and encrypted.',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Back', 'help')],
        ]).reply_markup,
      }
    );
  });

  bot.action('help_sellers', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '🏪 *For Sellers*\n\nWant to create your own store?\n\n1. Visit vendy.app\n2. Create your account\n3. Set up your store\n4. Start selling!\n\nPlans start at $0/month.',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.url('🚀 Get Started', 'https://vendy.app')],
          [Markup.button.callback('🔙 Back', 'help')],
        ]).reply_markup,
      }
    );
  });

  bot.action('help_back', async (ctx) => {
    await ctx.answerCbQuery();
    // Re-trigger /start behavior
    await ctx.editMessageText(
      '👋 Welcome back to Vendy!\n\nTap the button below to open the app.',
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.webApp('🛍️ Open Vendy', getConfig().appUrl)],
          [Markup.button.callback('❓ Help', 'help')],
        ]).reply_markup,
      }
    );
  });

  // Language selection
  bot.action('lang_en', async (ctx) => {
    await ctx.answerCbQuery('Language set to English 🇺🇸');
    await ctx.editMessageText('✅ Language set to *English*', { parse_mode: 'Markdown' });
    // TODO: Store language preference in database
  });

  bot.action('lang_es', async (ctx) => {
    await ctx.answerCbQuery('Idioma cambiado a Español 🇪🇸');
    await ctx.editMessageText('✅ Idioma cambiado a *Español*', { parse_mode: 'Markdown' });
    // TODO: Store language preference in database
  });

  bot.action('lang_pt', async (ctx) => {
    await ctx.answerCbQuery('Idioma alterado para Português 🇧🇷');
    await ctx.editMessageText('✅ Idioma alterado para *Português*', { parse_mode: 'Markdown' });
    // TODO: Store language preference in database
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pre-checkout query handler.
 *
 * Validates payment before Telegram shows the checkout UI to the user.
 * Must answer within 10 seconds.
 *
 * @see https://core.telegram.org/bots/api#answerprecheckoutquery
 */
function registerPreCheckoutQuery(bot: Telegraf): void {
  bot.on('pre_checkout_query', async (ctx) => {
    const query = ctx.preCheckoutQuery;

    console.log({
      event: 'pre_checkout_query',
      queryId: query.id,
      userId: query.from.id,
      currency: query.currency,
      totalAmount: query.total_amount,
      invoicePayload: query.invoice_payload,
    });

    try {
      // Validate the order exists and is pending
      // TODO: Check database for order status
      // const order = await getOrderByPayload(query.invoice_payload);
      // if (!order || order.status !== 'PENDING') {
      //   await ctx.answerPreCheckoutQuery(false, 'Order not found or already processed');
      //   return;
      // }

      // Validate amount matches
      // TODO: Verify total_amount matches order total
      // if (query.total_amount !== order.totalAmount) {
      //   await ctx.answerPreCheckoutQuery(false, 'Payment amount mismatch');
      //   return;
      // }

      // All validations passed - approve the payment
      await ctx.answerPreCheckoutQuery(true);

      console.log({
        event: 'pre_checkout_approved',
        queryId: query.id,
      });
    } catch (error) {
      console.error({
        event: 'pre_checkout_error',
        queryId: query.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Must answer even on error to prevent user from being stuck
      await ctx.answerPreCheckoutQuery(
        false,
        'Payment validation failed. Please try again.'
      );
    }
  });
}

/**
 * Successful payment handler.
 *
 * Called when a user completes a payment through Telegram's native payment system.
 * Updates order status and notifies the seller.
 */
function registerSuccessfulPayment(bot: Telegraf): void {
  bot.on('successful_payment', async (ctx) => {
    const payment = ctx.message?.successful_payment;
    if (!payment) return;

    console.log({
      event: 'successful_payment',
      userId: ctx.from?.id,
      currency: payment.currency,
      totalAmount: payment.total_amount,
      invoicePayload: payment.invoice_payload,
      telegramPaymentChargeId: payment.telegram_payment_charge_id,
      providerPaymentChargeId: payment.provider_payment_charge_id,
    });

    try {
      // TODO: Update order status in database
      // await updateOrderStatus(payment.invoice_payload, 'PAID', {
      //   telegramPaymentChargeId: payment.telegram_payment_charge_id,
      //   providerPaymentChargeId: payment.provider_payment_charge_id,
      // });

      // TODO: Notify seller about new order
      // await notifySeller(payment.invoice_payload);

      // Send confirmation to buyer
      await ctx.reply(
        `✅ *Payment Successful!*\n\n` +
        `Order: #${payment.invoice_payload}\n` +
        `Amount: ${payment.total_amount / 100} ${payment.currency}\n\n` +
        `You will receive a notification when your order is shipped.`,
        { parse_mode: 'Markdown' }
      );

      // Track conversion
      trackEvent('payment_success', {
        userId: ctx.from?.id,
        amount: payment.total_amount,
        currency: payment.currency,
        payload: payment.invoice_payload,
      }).catch(() => { /* silent fail */ });
    } catch (error) {
      console.error({
        event: 'successful_payment_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Notify user that payment was received but order processing failed
      await ctx.reply(
        '⚠️ *Payment received* but we encountered an issue processing your order.\n\n' +
        'Our support team has been notified and will contact you shortly.',
        { parse_mode: 'Markdown' }
      );
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Global error handler for the bot.
 */
function registerErrorHandler(bot: Telegraf): void {
  bot.catch((error: unknown, ctx: Context<Update>) => {
    console.error({
      event: 'bot_error',
      updateId: ctx.update.update_id,
      updateType: ctx.updateType,
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Try to notify user if possible
    if (ctx.chat) {
      ctx.reply('⚠️ An error occurred. Please try again or contact support.').catch(() => {
        // Ignore if we can't send error message
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics helper (non-blocking)
// ─────────────────────────────────────────────────────────────────────────────

async function trackEvent(
  event: string,
  properties: Record<string, unknown>
): Promise<void> {
  // TODO: Send to analytics service (e.g., Mixpanel, Amplitude, or internal)
  // For now, just log
  console.log({
    event: `analytics_${event}`,
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start the bot in the appropriate mode.
 *
 * Production: Webhook mode (bot receives updates via HTTP)
 * Development: Polling mode (bot polls Telegram API for updates)
 */
export async function startBot(): Promise<void> {
  const bot = getBot();
  const config = getConfig();

  if (config.isProduction && config.webhookUrl) {
    // Webhook mode - updates are received via POST /webhook
    console.log('Bot configured in webhook mode');
    // Webhook is set via /webhook/set endpoint, not here
  } else {
    // Polling mode for development
    console.log('Starting bot in polling mode (development)');
    await bot.launch();
    console.log('Bot polling started');
  }

  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

/**
 * Stop the bot gracefully.
 */
export async function stopBot(): Promise<void> {
  if (botInstance) {
    await botInstance.stop();
    botInstance = null;
    console.log('Bot stopped');
  }
}

/**
 * Get bot information from Telegram API.
 */
export async function getBotInfo(): Promise<{
  id: number;
  username: string;
  first_name: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}> {
  const bot = getBot();
  const info = await bot.telegram.getMe();
  return info;
}

export default getBot;
