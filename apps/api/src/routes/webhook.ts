import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Telegraf } from 'telegraf';

/**
 * Telegram Bot API webhook routes for Fastify.
 *
 * Provides endpoints to:
 * 1. Receive webhook updates from Telegram (POST /webhook)
 * 2. Configure/set the webhook URL (POST /webhook/set)
 * 3. Query current webhook info (GET /webhook/info)
 * 4. Delete the webhook (POST /webhook/delete)
 *
 * Security:
 * - Validates X-Telegram-Bot-Api-Secret-Token header on incoming updates
 * - Requires admin API key for management endpoints (set/info/delete)
 *
 * @see https://core.telegram.org/bots/api#setwebhook
 * @see https://core.telegram.org/bots/api#webhookinfo
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface WebhookSetBody {
  url?: string;
  secret_token?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

interface WebhookDeleteBody {
  drop_pending_updates?: boolean;
}

interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  ip_address?: string;
  last_error_date?: number;
  last_error_message?: string;
  last_synchronization_error_date?: number;
  max_connections?: number;
  allowed_updates?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Environment helpers
// ─────────────────────────────────────────────────────────────────────────────

function getBotToken(): string {
  const token = process.env.PARENT_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('BOT_TOKEN or PARENT_BOT_TOKEN environment variable is required');
  }
  return token;
}

function getWebhookSecret(): string {
  return process.env.WEBHOOK_SECRET || '';
}

function getWebhookUrl(): string {
  return process.env.WEBHOOK_URL || '';
}

function getAdminApiKey(): string {
  return process.env.ADMIN_API_KEY || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin auth middleware
// ─────────────────────────────────────────────────────────────────────────────

async function requireAdminAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = request.headers['x-admin-api-key'] as string | undefined;
  const expectedKey = getAdminApiKey();

  if (!expectedKey) {
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'ADMIN_API_KEY not configured',
    });
    return;
  }

  if (!apiKey || apiKey !== expectedKey) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing X-Admin-Api-Key header',
    });
    return;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Telegram API client
// ─────────────────────────────────────────────────────────────────────────────

async function telegramApiCall<T>(
  method: string,
  params?: Record<string, unknown>
): Promise<TelegramApiResponse<T>> {
  const token = getBotToken();
  const url = `https://api.telegram.org/bot${token}/${method}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: params ? JSON.stringify(params) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Telegram API HTTP error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<TelegramApiResponse<T>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /webhook
 *
 * Receives webhook updates from Telegram.
 * This is the endpoint Telegram calls when new messages/events occur.
 *
 * Security:
 * - Validates X-Telegram-Bot-Api-Secret-Token header
 * - Passes update to Telegraf bot for processing
 *
 * Expected body: Telegram Update object
 * @see https://core.telegram.org/bots/api#update
 */
async function handleWebhookPost(
  request: FastifyRequest<{ Body: Record<string, unknown> }>,
  reply: FastifyReply
): Promise<void> {
  const secretToken = request.headers['x-telegram-bot-api-secret-token'] as string | undefined;
  const expectedSecret = getWebhookSecret();

  // Validate secret token if configured
  if (expectedSecret && secretToken !== expectedSecret) {
    request.log.warn({
      msg: 'Invalid webhook secret token',
      ip: request.ip,
      expectedSecretLength: expectedSecret.length,
      receivedSecretLength: secretToken?.length || 0,
    });

    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid secret token',
    });
    return;
  }

  // Log webhook receipt for monitoring
  request.log.info({
    msg: 'Webhook received',
    updateId: request.body.update_id,
    ip: request.ip,
  });

  // Pass update to Telegraf for processing
  // The bot instance is expected to be registered on the Fastify instance
  const bot = (request.server as any).telegramBot as Telegraf | undefined;

  if (!bot) {
    request.log.error('Telegraf bot instance not found on server');
    reply.status(503).send({
      error: 'Service Unavailable',
      message: 'Bot handler not initialized',
    });
    return;
  }

  try {
    // Telegraf handles the update
    await bot.handleUpdate(request.body as any);

    // Respond quickly to Telegram (they expect 200 within ~60s)
    reply.status(200).send({ ok: true });
  } catch (error) {
    request.log.error({
      msg: 'Error processing webhook update',
      error: error instanceof Error ? error.message : 'Unknown error',
      updateId: request.body.update_id,
    });

    // Still return 200 to Telegram to prevent retries
    // Log the error internally for monitoring
    reply.status(200).send({ ok: true, warning: 'Update processed with errors' });
  }
}

/**
 * POST /webhook/set
 *
 * Configures the webhook URL with Telegram.
 * Requires admin API key.
 *
 * Body (optional):
 *   - url: Custom webhook URL (defaults to WEBHOOK_URL env)
 *   - secret_token: Custom secret (defaults to WEBHOOK_SECRET env)
 *   - max_connections: Max concurrent connections (1-100, default 40)
 *   - allowed_updates: Array of update types to receive
 *
 * @see https://core.telegram.org/bots/api#setwebhook
 */
async function handleWebhookSet(
  request: FastifyRequest<{ Body: WebhookSetBody }>,
  reply: FastifyReply
): Promise<void> {
  const url = request.body.url || getWebhookUrl();
  const secretToken = request.body.secret_token || getWebhookSecret();

  if (!url) {
    reply.status(400).send({
      error: 'Bad Request',
      message: 'Webhook URL required. Provide in body or set WEBHOOK_URL environment variable.',
    });
    return;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    reply.status(400).send({
      error: 'Bad Request',
      message: 'Invalid webhook URL format',
    });
    return;
  }

  // Ensure URL uses HTTPS (Telegram requirement for webhooks)
  if (!url.startsWith('https://')) {
    reply.status(400).send({
      error: 'Bad Request',
      message: 'Webhook URL must use HTTPS (Telegram requirement)',
    });
    return;
  }

  const params: Record<string, unknown> = {
    url,
    max_connections: request.body.max_connections || 40,
  };

  if (secretToken) {
    params.secret_token = secretToken;
  }

  if (request.body.allowed_updates) {
    params.allowed_updates = request.body.allowed_updates;
  }

  try {
    const result = await telegramApiCall<boolean>('setWebhook', params);

    if (result.ok) {
      request.log.info({
        msg: 'Webhook configured successfully',
        url,
        hasSecret: !!secretToken,
      });

      reply.status(200).send({
        ok: true,
        message: 'Webhook configured',
        url,
        secretConfigured: !!secretToken,
      });
    } else {
      request.log.error({
        msg: 'Failed to configure webhook',
        description: result.description,
        errorCode: result.error_code,
      });

      reply.status(502).send({
        error: 'Bad Gateway',
        message: result.description || 'Telegram API error',
        telegramErrorCode: result.error_code,
      });
    }
  } catch (error) {
    request.log.error({
      msg: 'Exception configuring webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    reply.status(500).send({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to configure webhook',
    });
  }
}

/**
 * GET /webhook/info
 *
 * Returns current webhook status from Telegram.
 * Requires admin API key.
 *
 * @see https://core.telegram.org/bots/api#getwebhookinfo
 */
async function handleWebhookInfo(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const result = await telegramApiCall<WebhookInfo>('getWebhookInfo');

    if (result.ok && result.result) {
      const info = result.result;

      // Add health assessment
      const isHealthy = !info.last_error_message && info.pending_update_count < 100;
      const hasWebhook = !!info.url;

      reply.status(200).send({
        ok: true,
        webhook: {
          configured: hasWebhook,
          url: info.url,
          healthy: isHealthy,
          pendingUpdates: info.pending_update_count,
          maxConnections: info.max_connections,
          allowedUpdates: info.allowed_updates,
          hasCustomCertificate: info.has_custom_certificate,
          ipAddress: info.ip_address,
          lastError: info.last_error_message
            ? {
                message: info.last_error_message,
                date: info.last_error_date
                  ? new Date(info.last_error_date * 1000).toISOString()
                  : null,
              }
            : null,
          lastSyncError: info.last_synchronization_error_date
            ? {
                date: new Date(info.last_synchronization_error_date * 1000).toISOString(),
              }
            : null,
        },
      });
    } else {
      reply.status(502).send({
        error: 'Bad Gateway',
        message: result.description || 'Failed to get webhook info',
        telegramErrorCode: result.error_code,
      });
    }
  } catch (error) {
    request.log.error({
      msg: 'Exception getting webhook info',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    reply.status(500).send({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get webhook info',
    });
  }
}

/**
 * POST /webhook/delete
 *
 * Removes the webhook and optionally drops pending updates.
 * Requires admin API key.
 *
 * Body (optional):
 *   - drop_pending_updates: If true, drops all pending updates
 *
 * @see https://core.telegram.org/bots/api#deletewebhook
 */
async function handleWebhookDelete(
  request: FastifyRequest<{ Body: WebhookDeleteBody }>,
  reply: FastifyReply
): Promise<void> {
  const params: Record<string, unknown> = {};

  if (request.body.drop_pending_updates) {
    params.drop_pending_updates = true;
  }

  try {
    const result = await telegramApiCall<boolean>('deleteWebhook', params);

    if (result.ok) {
      request.log.info({
        msg: 'Webhook deleted',
        droppedPending: request.body.drop_pending_updates || false,
      });

      reply.status(200).send({
        ok: true,
        message: 'Webhook deleted',
        droppedPendingUpdates: request.body.drop_pending_updates || false,
      });
    } else {
      reply.status(502).send({
        error: 'Bad Gateway',
        message: result.description || 'Telegram API error',
        telegramErrorCode: result.error_code,
      });
    }
  } catch (error) {
    request.log.error({
      msg: 'Exception deleting webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    reply.status(500).send({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to delete webhook',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fastify plugin registration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register webhook routes on a Fastify instance.
 *
 * Usage:
 * ```typescript
 * import fastify from 'fastify';
 * import { registerWebhookRoutes } from './routes/webhook';
 * import { bot } from './services/bot';
 *
 * const app = fastify();
 *
 * // Attach bot instance for webhook processing
 * (app as any).telegramBot = bot;
 *
 * // Register routes
 * await app.register(registerWebhookRoutes, { prefix: '/webhook' });
 *
 * // Routes available:
 * // POST /webhook          - Receive Telegram updates
 * // POST /webhook/set      - Configure webhook (admin only)
 * // GET  /webhook/info     - Get webhook status (admin only)
 * // POST /webhook/delete   - Delete webhook (admin only)
 * ```
 */
export async function registerWebhookRoutes(app: FastifyInstance): Promise<void> {
  // Public endpoint: receive updates from Telegram
  app.post('/', handleWebhookPost);

  // Admin endpoints: require API key
  app.post('/set', { preHandler: [requireAdminAuth] }, handleWebhookSet);
  app.get('/info', { preHandler: [requireAdminAuth] }, handleWebhookInfo);
  app.post('/delete', { preHandler: [requireAdminAuth] }, handleWebhookDelete);
}

export default registerWebhookRoutes;
