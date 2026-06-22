import { Counter, Histogram, Gauge, Registry } from 'prom-client';

/**
 * Prometheus metrics for Vendy API.
 *
 * Provides metrics for:
 * - HTTP requests (count, duration, status codes)
 * - Business operations (orders, payments, users)
 * - Telegram bot activity (messages, users, webhooks, errors)
 * - System health (database, cache, queues)
 *
 * All metrics are registered on the default Prometheus registry
 * and exposed via the /metrics endpoint.
 *
 * @see https://prometheus.io/docs/concepts/metric_types/
 */

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Metrics
// ─────────────────────────────────────────────────────────────────────────────

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
});

export const httpRequestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

export const httpResponseSize = new Histogram({
  name: 'http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

// ─────────────────────────────────────────────────────────────────────────────
// Business Metrics
// ─────────────────────────────────────────────────────────────────────────────

export const ordersTotal = new Counter({
  name: 'orders_total',
  help: 'Total number of orders created',
  labelNames: ['status', 'currency', 'plan'],
});

export const orderValue = new Histogram({
  name: 'order_value_usd',
  help: 'Order value in USD',
  labelNames: ['status', 'plan'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
});

export const paymentsTotal = new Counter({
  name: 'payments_total',
  help: 'Total number of payment attempts',
  labelNames: ['status', 'provider', 'currency'],
});

export const paymentAmount = new Histogram({
  name: 'payment_amount_usd',
  help: 'Payment amount in USD',
  labelNames: ['status', 'provider'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
});

export const usersRegistered = new Counter({
  name: 'users_registered_total',
  help: 'Total number of registered users',
  labelNames: ['source', 'plan'],
});

export const shopsCreated = new Counter({
  name: 'shops_created_total',
  help: 'Total number of shops created',
  labelNames: ['plan', 'source'],
});

export const productsCreated = new Counter({
  name: 'products_created_total',
  help: 'Total number of products created',
  labelNames: ['shop_id'],
});

// ─────────────────────────────────────────────────────────────────────────────
// Telegram Bot Metrics (NEW)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Total messages received from Telegram users.
 * Label: command (start, help, language, callback, text, other)
 */
export const telegramMessagesTotal = new Counter({
  name: 'telegram_messages_total',
  help: 'Total messages received from Telegram users',
  labelNames: ['command', 'bot_type'],
});

/**
 * Number of unique active Telegram users (by user_id) in the last 24h.
 * Updated periodically via gauge.
 */
export const telegramUsersActive = new Gauge({
  name: 'telegram_users_active',
  help: 'Number of unique active Telegram users in the last 24 hours',
  labelNames: ['bot_type'],
});

/**
 * Webhook latency from Telegram to our API.
 * Measures time from Telegram sending update to our response.
 */
export const telegramWebhookLatency = new Histogram({
  name: 'telegram_webhook_latency_seconds',
  help: 'Webhook latency from Telegram to API',
  labelNames: ['update_type'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

/**
 * Total errors from Telegram bot operations.
 * Label: error_type (webhook, api, payment, command, callback)
 */
export const telegramErrorsTotal = new Counter({
  name: 'telegram_errors_total',
  help: 'Total errors from Telegram bot operations',
  labelNames: ['error_type', 'bot_type'],
});

/**
 * Number of Mini App opens initiated from Telegram.
 * Label: source (menu_button, inline_button, deep_link, start_param)
 */
export const telegramMiniAppOpens = new Counter({
  name: 'telegram_miniapp_opens_total',
  help: 'Total Mini App opens initiated from Telegram',
  labelNames: ['source', 'bot_type'],
});

/**
 * Number of pre-checkout queries processed.
 * Label: result (approved, rejected, error)
 */
export const telegramPreCheckoutTotal = new Counter({
  name: 'telegram_pre_checkout_total',
  help: 'Total pre-checkout queries processed',
  labelNames: ['result', 'currency'],
});

/**
 * Number of successful Telegram payments.
 * Label: currency
 */
export const telegramPaymentsSuccessful = new Counter({
  name: 'telegram_payments_successful_total',
  help: 'Total successful Telegram payments',
  labelNames: ['currency', 'bot_type'],
});

/**
 * Number of callback queries processed.
 * Label: action (help, language, help_shop, help_payments, help_sellers, other)
 */
export const telegramCallbacksTotal = new Counter({
  name: 'telegram_callbacks_total',
  help: 'Total callback queries processed',
  labelNames: ['action', 'bot_type'],
});

/**
 * Current webhook status from Telegram.
 * Value: 1 = healthy, 0 = error, -1 = not configured
 */
export const telegramWebhookStatus = new Gauge({
  name: 'telegram_webhook_status',
  help: 'Current webhook status (1=healthy, 0=error, -1=not configured)',
  labelNames: ['bot_type'],
});

/**
 * Number of pending updates in Telegram webhook queue.
 * High values indicate processing backlog.
 */
export const telegramPendingUpdates = new Gauge({
  name: 'telegram_pending_updates',
  help: 'Number of pending updates in Telegram webhook queue',
  labelNames: ['bot_type'],
});

// ─────────────────────────────────────────────────────────────────────────────
// System Metrics
// ─────────────────────────────────────────────────────────────────────────────

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
});

export const dbQueryErrors = new Counter({
  name: 'db_query_errors_total',
  help: 'Total database query errors',
  labelNames: ['operation', 'table', 'error_type'],
});

export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_type', 'operation'],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_type', 'operation'],
});

export const cacheErrors = new Counter({
  name: 'cache_errors_total',
  help: 'Total cache errors',
  labelNames: ['cache_type', 'operation', 'error_type'],
});

export const queueJobsTotal = new Counter({
  name: 'queue_jobs_total',
  help: 'Total queue jobs processed',
  labelNames: ['queue', 'status'],
});

export const queueJobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Queue job processing duration',
  labelNames: ['queue', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

export const queueJobRetries = new Counter({
  name: 'queue_job_retries_total',
  help: 'Total queue job retries',
  labelNames: ['queue'],
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions for easy metric recording
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record an HTTP request with all related metrics.
 */
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  durationMs: number,
  requestSizeBytes?: number,
  responseSizeBytes?: number
): void {
  const durationSeconds = durationMs / 1000;
  const statusLabel = statusCode.toString();

  httpRequestsTotal.inc({ method, route, status_code: statusLabel });
  httpRequestDuration.observe({ method, route, status_code: statusLabel }, durationSeconds);

  if (requestSizeBytes !== undefined) {
    httpRequestSize.observe({ method, route }, requestSizeBytes);
  }
  if (responseSizeBytes !== undefined) {
    httpResponseSize.observe({ method, route, status_code: statusLabel }, responseSizeBytes);
  }
}

/**
 * Record a Telegram message received.
 */
export function recordTelegramMessage(command: string, botType: 'parent' | 'child' = 'parent'): void {
  telegramMessagesTotal.inc({ command, bot_type: botType });
}

/**
 * Record a Telegram webhook latency.
 */
export function recordTelegramWebhookLatency(updateType: string, durationMs: number): void {
  telegramWebhookLatency.observe({ update_type: updateType }, durationMs / 1000);
}

/**
 * Record a Telegram bot error.
 */
export function recordTelegramError(errorType: string, botType: 'parent' | 'child' = 'parent'): void {
  telegramErrorsTotal.inc({ error_type: errorType, bot_type: botType });
}

/**
 * Record a Mini App open from Telegram.
 */
export function recordMiniAppOpen(source: string, botType: 'parent' | 'child' = 'parent'): void {
  telegramMiniAppOpens.inc({ source, bot_type: botType });
}

/**
 * Record a pre-checkout query result.
 */
export function recordPreCheckout(result: 'approved' | 'rejected' | 'error', currency: string): void {
  telegramPreCheckoutTotal.inc({ result, currency });
}

/**
 * Record a successful Telegram payment.
 */
export function recordTelegramPayment(currency: string, botType: 'parent' | 'child' = 'parent'): void {
  telegramPaymentsSuccessful.inc({ currency, bot_type: botType });
}

/**
 * Record a callback query action.
 */
export function recordCallback(action: string, botType: 'parent' | 'child' = 'parent'): void {
  telegramCallbacksTotal.inc({ action, bot_type: botType });
}

/**
 * Update webhook status gauge.
 */
export function setWebhookStatus(status: 'healthy' | 'error' | 'not_configured', botType: 'parent' | 'child' = 'parent'): void {
  const valueMap = { healthy: 1, error: 0, not_configured: -1 };
  telegramWebhookStatus.set({ bot_type: botType }, valueMap[status]);
}

/**
 * Update pending updates gauge.
 */
export function setPendingUpdates(count: number, botType: 'parent' | 'child' = 'parent'): void {
  telegramPendingUpdates.set({ bot_type: botType }, count);
}

/**
 * Update active users gauge.
 */
export function setActiveUsers(count: number, botType: 'parent' | 'child' = 'parent'): void {
  telegramUsersActive.set({ bot_type: botType }, count);
}

/**
 * Record a database query.
 */
export function recordDbQuery(
  operation: string,
  table: string,
  durationMs: number,
  error?: Error
): void {
  const durationSeconds = durationMs / 1000;
  dbQueryDuration.observe({ operation, table }, durationSeconds);

  if (error) {
    dbQueryErrors.inc({ operation, table, error_type: error.name || 'unknown' });
  }
}

/**
 * Record a cache operation.
 */
export function recordCacheOperation(
  cacheType: string,
  operation: string,
  hit: boolean,
  error?: Error
): void {
  if (hit) {
    cacheHits.inc({ cache_type: cacheType, operation });
  } else {
    cacheMisses.inc({ cache_type: cacheType, operation });
  }

  if (error) {
    cacheErrors.inc({ cache_type: cacheType, operation, error_type: error.name || 'unknown' });
  }
}

/**
 * Record a queue job.
 */
export function recordQueueJob(
  queue: string,
  status: 'completed' | 'failed' | 'retry',
  durationMs: number
): void {
  queueJobsTotal.inc({ queue, status });
  queueJobDuration.observe({ queue, status }, durationMs / 1000);

  if (status === 'retry') {
    queueJobRetries.inc({ queue });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Default registry export
// ─────────────────────────────────────────────────────────────────────────────

export { Registry } from 'prom-client';

/**
 * Get all registered metrics as Prometheus text format.
 * Used by the /metrics endpoint.
 */
export async function getMetrics(): Promise<string> {
  const register = new Registry();
  
  // Collect all metrics from default registry
  const metrics = await register.metrics();
  return metrics;
}

export default {
  httpRequestsTotal,
  httpRequestDuration,
  ordersTotal,
  orderValue,
  paymentsTotal,
  paymentAmount,
  usersRegistered,
  shopsCreated,
  productsCreated,
  // Telegram metrics
  telegramMessagesTotal,
  telegramUsersActive,
  telegramWebhookLatency,
  telegramErrorsTotal,
  telegramMiniAppOpens,
  telegramPreCheckoutTotal,
  telegramPaymentsSuccessful,
  telegramCallbacksTotal,
  telegramWebhookStatus,
  telegramPendingUpdates,
  // System metrics
  dbConnectionsActive,
  dbQueryDuration,
  dbQueryErrors,
  cacheHits,
  cacheMisses,
  cacheErrors,
  queueJobsTotal,
  queueJobDuration,
  queueJobRetries,
  // Helpers
  recordHttpRequest,
  recordTelegramMessage,
  recordTelegramWebhookLatency,
  recordTelegramError,
  recordMiniAppOpen,
  recordPreCheckout,
  recordTelegramPayment,
  recordCallback,
  setWebhookStatus,
  setPendingUpdates,
  setActiveUsers,
  recordDbQuery,
  recordCacheOperation,
  recordQueueJob,
  getMetrics,
};
