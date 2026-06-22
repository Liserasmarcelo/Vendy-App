import { FastifyRequest, FastifyReply } from 'fastify';
import { checkShopRateLimit } from '../lib/cache';

// ==========================================
// RATE LIMITING POR TELEGRAM ID (Anti-spam)
// ==========================================

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

// Configuración por tipo de endpoint
const RATE_LIMITS = {
  // Default: 100 requests/min
  default: { maxRequests: 100, windowSeconds: 60 },
  
  // Auth: 10 requests/min (login, token validation)
  auth: { maxRequests: 10, windowSeconds: 60 },
  
  // Shop creation: 5 requests/min (evita spam de tiendas)
  shopCreate: { maxRequests: 5, windowSeconds: 60 },
  
  // Webhooks: 1000 requests/min (bots pueden enviar muchos updates)
  webhook: { maxRequests: 1000, windowSeconds: 60 },
  
  // Analytics: 500 requests/min (event tracking)
  analytics: { maxRequests: 500, windowSeconds: 60 },
  
  // Broadcast: 1 request/min (evita spam masivo)
  broadcast: { maxRequests: 1, windowSeconds: 60 },
};

type RateLimitCategory = keyof typeof RATE_LIMITS;

/**
 * Extrae telegram_id del request para rate limiting
 */
function getTelegramId(request: FastifyRequest): string | null {
  // 1. Desde initData (header X-Telegram-Init-Data)
  const initData = request.headers['x-telegram-init-data'] as string;
  if (initData) {
    try {
      const urlParams = new URLSearchParams(initData);
      const userJson = urlParams.get('user');
      if (userJson) {
        const user = JSON.parse(decodeURIComponent(userJson));
        return user.id?.toString() || null;
      }
    } catch {
      // Fallthrough
    }
  }
  
  // 2. Desde JWT (si se usa auth alternativa)
  // const jwt = request.headers.authorization;
  
  // 3. Fallback a IP (anónimo)
  return null;
}

/**
 * Middleware de rate limiting por telegram_id
 * Usa Redis para sliding window (ya implementado en cache.ts)
 */
export async function rateLimitByTelegramId(
  request: FastifyRequest,
  reply: FastifyReply,
  category: RateLimitCategory = 'default'
) {
  const telegramId = getTelegramId(request);
  
  if (!telegramId) {
    // Sin telegram_id, usar IP como fallback
    return rateLimitByIP(request, reply, category);
  }
  
  const config = RATE_LIMITS[category];
  
  // Usar shop_id 0 como placeholder para rate limit global por usuario
  const result = await checkShopRateLimit(
    parseInt(`1${telegramId.slice(-9)}`), // Hash del telegramId a número
    config.maxRequests,
    config.windowSeconds
  );
  
  // Set headers de rate limit
  reply.header('X-RateLimit-Limit', config.maxRequests);
  reply.header('X-RateLimit-Remaining', result.remaining);
  reply.header('X-RateLimit-Reset', result.resetAt);
  
  if (!result.allowed) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: `Rate limit exceeded for user. Try again in ${result.resetAt - Math.floor(Date.now() / 1000)} seconds.`,
      retryAfter: result.resetAt - Math.floor(Date.now() / 1000)
    });
  }
}

/**
 * Middleware de rate limiting por IP (fallback para anónimos)
 */
async function rateLimitByIP(
  request: FastifyRequest,
  reply: FastifyReply,
  category: RateLimitCategory = 'default'
) {
  const ip = request.ip || 'unknown';
  const config = RATE_LIMITS[category];
  
  // IP como hash numérico
  const ipHash = ip.split('.').reduce((acc, octet) => acc + parseInt(octet), 0) || 1;
  
  const result = await checkShopRateLimit(
    ipHash,
    Math.floor(config.maxRequests / 2), // Mitad del límite para anónimos
    config.windowSeconds
  );
  
  reply.header('X-RateLimit-Limit', Math.floor(config.maxRequests / 2));
  reply.header('X-RateLimit-Remaining', result.remaining);
  reply.header('X-RateLimit-Reset', result.resetAt);
  
  if (!result.allowed) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please authenticate or try again later.',
      retryAfter: result.resetAt - Math.floor(Date.now() / 1000)
    });
  }
}

/**
 * Middleware de rate limiting por shop_id
 * Diferentes límites según el plan de la tienda
 */
export async function rateLimitByShop(
  request: FastifyRequest,
  reply: FastifyReply,
  category: RateLimitCategory = 'default'
) {
  const shopId = extractShopId(request);
  
  if (!shopId) {
    // Sin shop_id, usar rate limit por usuario
    return rateLimitByTelegramId(request, reply, category);
  }
  
  // TODO: Obtener plan de la tienda para límites diferenciados
  // Por ahora usar límites default
  const config = RATE_LIMITS[category];
  
  const result = await checkShopRateLimit(
    shopId,
    config.maxRequests,
    config.windowSeconds
  );
  
  reply.header('X-RateLimit-Limit', config.maxRequests);
  reply.header('X-RateLimit-Remaining', result.remaining);
  reply.header('X-RateLimit-Reset', result.resetAt);
  reply.header('X-Shop-RateLimit', 'true');
  
  if (!result.allowed) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: `Rate limit exceeded for this shop. Try again in ${result.resetAt - Math.floor(Date.now() / 1000)} seconds.`,
      retryAfter: result.resetAt - Math.floor(Date.now() / 1000),
      shopId
    });
  }
}

/**
 * Extrae shop_id del request de múltiples fuentes
 */
function extractShopId(request: FastifyRequest): number | null {
  // Header
  const headerShopId = request.headers['x-shop-id'] as string;
  if (headerShopId) {
    const parsed = parseInt(headerShopId, 10);
    if (!isNaN(parsed)) return parsed;
  }
  
  // Query params
  const queryShopId = (request.query as any)?.shop_id;
  if (queryShopId) {
    const parsed = parseInt(queryShopId, 10);
    if (!isNaN(parsed)) return parsed;
  }
  
  // URL params
  const paramsShopId = (request.params as any)?.shopId || (request.params as any)?.id;
  if (paramsShopId) {
    const parsed = parseInt(paramsShopId, 10);
    if (!isNaN(parsed)) return parsed;
  }
  
  // Body
  const bodyShopId = (request.body as any)?.shop_id;
  if (bodyShopId) {
    const parsed = parseInt(bodyShopId, 10);
    if (!isNaN(parsed)) return parsed;
  }
  
  return null;
}

/**
 * Rate limiting combinado: telegram_id + shop_id
 * Aplica ambos límites, el más restrictivo gana
 */
export async function rateLimitCombined(
  request: FastifyRequest,
  reply: FastifyReply,
  category: RateLimitCategory = 'default'
) {
  // Primero verificar rate limit por usuario
  await rateLimitByTelegramId(request, reply, category);
  if (reply.sent) return;
  
  // Luego verificar rate limit por shop
  await rateLimitByShop(request, reply, category);
}

// ==========================================
// FACTORY FUNCTIONS (para usar con Fastify preHandler)
// ==========================================

/**
 * Crea un preHandler de rate limiting por telegram_id
 * Uso: app.get('/endpoint', { preHandler: [rateLimitByTelegramIdHandler('auth')] }, handler)
 */
export function rateLimitByTelegramIdHandler(category: RateLimitCategory = 'default') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await rateLimitByTelegramId(request, reply, category);
  };
}

/**
 * Crea un preHandler de rate limiting por shop
 */
export function rateLimitByShopHandler(category: RateLimitCategory = 'default') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await rateLimitByShop(request, reply, category);
  };
}

/**
 * Crea un preHandler de rate limiting combinado
 */
export function rateLimitCombinedHandler(category: RateLimitCategory = 'default') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await rateLimitCombined(request, reply, category);
  };
}

// ==========================================
// LÍMITES POR PLAN (para implementación futura)
// ==========================================

interface PlanRateLimits {
  maxShops: number;
  maxProducts: number;
  maxOrdersPerDay: number;
  maxApiRequests: number;
  maxBroadcastsPerDay: number;
  maxManagers: number;
}

export const PLAN_LIMITS: Record<string, PlanRateLimits> = {
  STARTER: {
    maxShops: 1,
    maxProducts: 100,
    maxOrdersPerDay: 50,
    maxApiRequests: 1000,
    maxBroadcastsPerDay: 1,
    maxManagers: 1, // Solo owner
  },
  GROWTH: {
    maxShops: 3,
    maxProducts: 500,
    maxOrdersPerDay: 200,
    maxApiRequests: 5000,
    maxBroadcastsPerDay: 5,
    maxManagers: 3,
  },
  PRO: {
    maxShops: Infinity,
    maxProducts: Infinity,
    maxOrdersPerDay: Infinity,
    maxApiRequests: 50000,
    maxBroadcastsPerDay: 20,
    maxManagers: 10,
  },
};

/**
 * Verifica si una tienda ha excedido los límites de su plan
 * TODO: Implementar en middleware de plan checking
 */
export async function checkPlanLimits(shopId: number, plan: string): Promise<{
  withinLimits: boolean;
  exceeded: string[];
}> {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.STARTER;
  const exceeded: string[] = [];
  
  // Verificar cada límite
  // TODO: Implementar queries a DB para contar recursos actuales
  
  return {
    withinLimits: exceeded.length === 0,
    exceeded
  };
}
