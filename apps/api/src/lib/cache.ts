import redis from './redis';

// ==========================================
// SESIONES DE MINI-APP (TTL 24h)
// ==========================================

const SESSION_PREFIX = 'session:';
const SESSION_TTL = 24 * 60 * 60; // 24 horas en segundos

interface SessionData {
  userId: number;
  telegramId: string;
  username?: string;
  firstName: string;
  languageCode: string;
  shopId?: number;
  role?: 'owner' | 'admin' | 'customer';
  createdAt: string;
}

/**
 * Crea o actualiza una sesión de Mini-App
 * @param sessionId - ID único de sesión (puede ser hash de initData o JWT token)
 * @param data - Datos del usuario y contexto
 */
export async function createSession(sessionId: string, data: SessionData): Promise<void> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  await redis.setex(key, SESSION_TTL, JSON.stringify(data));
}

/**
 * Obtiene una sesión por ID
 * @param sessionId - ID de sesión
 * @returns SessionData | null
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  const data = await redis.get(key);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data) as SessionData;
  } catch {
    return null;
  }
}

/**
 * Renueva el TTL de una sesión (slide session)
 * @param sessionId - ID de sesión
 */
export async function refreshSession(sessionId: string): Promise<boolean> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  const exists = await redis.exists(key);
  
  if (!exists) return false;
  
  await redis.expire(key, SESSION_TTL);
  return true;
}

/**
 * Elimina una sesión
 * @param sessionId - ID de sesión
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  await redis.del(key);
}

/**
 * Elimina todas las sesiones de un usuario
 * @param telegramId - ID de Telegram del usuario
 */
export async function deleteUserSessions(telegramId: string): Promise<number> {
  const pattern = `${SESSION_PREFIX}*`;
  const keys = await redis.keys(pattern);
  
  let deleted = 0;
  for (const key of keys) {
    const data = await redis.get(key);
    if (data) {
      try {
        const session = JSON.parse(data) as SessionData;
        if (session.telegramId === telegramId) {
          await redis.del(key);
          deleted++;
        }
      } catch {
        // Ignorar sesiones corruptas
      }
    }
  }
  
  return deleted;
}

// ==========================================
// CACHÉ DE CATÁLOGOS PÚBLICOS (TTL 5 min)
// ==========================================

const CATALOG_PREFIX = 'catalog:';
const CATALOG_TTL = 5 * 60; // 5 minutos en segundos

interface CatalogCache {
  shopId: number;
  products: any[];
  categories: any[];
  shopInfo: any;
  generatedAt: string;
}

/**
 * Guarda el catálogo público de una tienda en caché
 * @param shopId - ID de la tienda
 * @param data - Datos del catálogo
 */
export async function cacheCatalog(shopId: number, data: CatalogCache): Promise<void> {
  const key = `${CATALOG_PREFIX}${shopId}`;
  await redis.setex(key, CATALOG_TTL, JSON.stringify(data));
}

/**
 * Obtiene el catálogo público de una tienda desde caché
 * @param shopId - ID de la tienda
 * @returns CatalogCache | null
 */
export async function getCachedCatalog(shopId: number): Promise<CatalogCache | null> {
  const key = `${CATALOG_PREFIX}${shopId}`;
  const data = await redis.get(key);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data) as CatalogCache;
  } catch {
    return null;
  }
}

/**
 * Invalida el caché de catálogo de una tienda
 * @param shopId - ID de la tienda
 */
export async function invalidateCatalogCache(shopId: number): Promise<void> {
  const key = `${CATALOG_PREFIX}${shopId}`;
  await redis.del(key);
}

/**
 * Invalida todos los cachés de catálogos (útil para deploys)
 */
export async function invalidateAllCatalogCaches(): Promise<number> {
  const pattern = `${CATALOG_PREFIX}*`;
  const keys = await redis.keys(pattern);
  
  if (keys.length === 0) return 0;
  
  return redis.del(...keys);
}

// ==========================================
// CACHÉ DE PRODUCTOS INDIVIDUALES (TTL 10 min)
// ==========================================

const PRODUCT_PREFIX = 'product:';
const PRODUCT_TTL = 10 * 60; // 10 minutos

/**
 * Guarda un producto en caché
 * @param productId - ID del producto
 * @param shopId - ID de la tienda (para namespace)
 * @param data - Datos del producto
 */
export async function cacheProduct(productId: number, shopId: number, data: any): Promise<void> {
  const key = `${PRODUCT_PREFIX}${shopId}:${productId}`;
  await redis.setex(key, PRODUCT_TTL, JSON.stringify(data));
}

/**
 * Obtiene un producto desde caché
 * @param productId - ID del producto
 * @param shopId - ID de la tienda
 */
export async function getCachedProduct(productId: number, shopId: number): Promise<any | null> {
  const key = `${PRODUCT_PREFIX}${shopId}:${productId}`;
  const data = await redis.get(key);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Invalida el caché de un producto
 */
export async function invalidateProductCache(productId: number, shopId: number): Promise<void> {
  const key = `${PRODUCT_PREFIX}${shopId}:${productId}`;
  await redis.del(key);
}

// ==========================================
// RATE LIMITING POR SHOP (Sliding window)
// ==========================================

const RATE_LIMIT_PREFIX = 'ratelimit:';

/**
 * Verifica si un shop ha excedido su límite de requests
 * @param shopId - ID de la tienda
 * @param maxRequests - Máximo de requests permitidos
 * @param windowSeconds - Ventana de tiempo en segundos
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export async function checkShopRateLimit(
  shopId: number,
  maxRequests: number = 1000,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `${RATE_LIMIT_PREFIX}shop:${shopId}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;
  
  // Usar sorted set para sliding window
  // Limpiar entradas antiguas
  await redis.zremrangebyscore(key, 0, windowStart);
  
  // Contar requests en la ventana actual
  const currentCount = await redis.zcard(key);
  
  if (currentCount >= maxRequests) {
    // Obtener el timestamp más antiguo en la ventana
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const resetAt = oldest.length > 1 ? parseInt(oldest[1]) + windowSeconds : now + windowSeconds;
    
    return {
      allowed: false,
      remaining: 0,
      resetAt
    };
  }
  
  // Agregar request actual
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.expire(key, windowSeconds);
  
  return {
    allowed: true,
    remaining: maxRequests - currentCount - 1,
    resetAt: now + windowSeconds
  };
}

// ==========================================
// CACHÉ DE CONFIGURACIÓN DE TIENDA (TTL 1h)
// ==========================================

const SHOP_CONFIG_PREFIX = 'shop-config:';
const SHOP_CONFIG_TTL = 60 * 60; // 1 hora

/**
 * Guarda la configuración de una tienda en caché
 */
export async function cacheShopConfig(shopId: number, config: any): Promise<void> {
  const key = `${SHOP_CONFIG_PREFIX}${shopId}`;
  await redis.setex(key, SHOP_CONFIG_TTL, JSON.stringify(config));
}

/**
 * Obtiene la configuración de una tienda desde caché
 */
export async function getCachedShopConfig(shopId: number): Promise<any | null> {
  const key = `${SHOP_CONFIG_PREFIX}${shopId}`;
  const data = await redis.get(key);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Invalida el caché de configuración de una tienda
 */
export async function invalidateShopConfigCache(shopId: number): Promise<void> {
  const key = `${SHOP_CONFIG_PREFIX}${shopId}`;
  await redis.del(key);
}

// ==========================================
// CARRITOS TEMPORALES (TTL 2h)
// ==========================================

const CART_PREFIX = 'cart:';
const CART_TTL = 2 * 60 * 60; // 2 horas

interface CartItem {
  productId: number;
  quantity: number;
  variants?: Record<string, string>;
}

interface CartData {
  items: CartItem[];
  shopId: number;
  customerTelegramId?: string;
  updatedAt: string;
}

/**
 * Guarda un carrito temporal
 * @param cartId - ID único del carrito (puede ser sessionId o customerId)
 * @param data - Datos del carrito
 */
export async function saveCart(cartId: string, data: CartData): Promise<void> {
  const key = `${CART_PREFIX}${cartId}`;
  await redis.setex(key, CART_TTL, JSON.stringify(data));
}

/**
 * Obtiene un carrito temporal
 */
export async function getCart(cartId: string): Promise<CartData | null> {
  const key = `${CART_PREFIX}${cartId}`;
  const data = await redis.get(key);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data) as CartData;
  } catch {
    return null;
  }
}

/**
 * Elimina un carrito temporal
 */
export async function deleteCart(cartId: string): Promise<void> {
  const key = `${CART_PREFIX}${cartId}`;
  await redis.del(key);
}

// ==========================================
// WEBHOOK PENDING (Cola de webhooks no procesados)
// ==========================================

const WEBHOOK_PENDING_PREFIX = 'webhook-pending:';
const WEBHOOK_PENDING_TTL = 24 * 60 * 60; // 24 horas

/**
 * Guarda un webhook pendiente para reintentar
 */
export async function savePendingWebhook(webhookId: string, data: any): Promise<void> {
  const key = `${WEBHOOK_PENDING_PREFIX}${webhookId}`;
  await redis.setex(key, WEBHOOK_PENDING_TTL, JSON.stringify(data));
}

/**
 * Obtiene un webhook pendiente
 */
export async function getPendingWebhook(webhookId: string): Promise<any | null> {
  const key = `${WEBHOOK_PENDING_PREFIX}${webhookId}`;
  const data = await redis.get(key);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Elimina un webhook pendiente (cuando se procesa exitosamente)
 */
export async function deletePendingWebhook(webhookId: string): Promise<void> {
  const key = `${WEBHOOK_PENDING_PREFIX}${webhookId}`;
  await redis.del(key);
}

// ==========================================
// ESTADÍSTICAS DE REDIS (para monitoreo)
// ==========================================

/**
 * Obtiene estadísticas de uso de Redis
 */
export async function getRedisStats() {
  const info = await redis.info('memory');
  const dbSize = await redis.dbsize();
  
  return {
    dbSize,
    info: info.split('\r\n').filter(line => line.includes('used_memory')),
  };
}

/**
 * Limpia todas las claves de un prefijo (útil para tests)
 */
export async function clearByPrefix(prefix: string): Promise<number> {
  const pattern = `${prefix}*`;
  const keys = await redis.keys(pattern);
  
  if (keys.length === 0) return 0;
  
  return redis.del(...keys);
}
