import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { validateInitDataComplete, WebAppUser } from '../lib/initData';
import { prisma } from '../lib/prisma';

// Extender tipos de Fastify para incluir user
export interface AuthenticatedRequest extends FastifyRequest {
  user: WebAppUser;
  shopId?: number;
  isAdmin?: boolean;
}

/**
 * Middleware de autenticación: valida initData del header X-Telegram-Init-Data
 */
export async function authenticateTelegram(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const initData = request.headers['x-telegram-init-data'] as string;
  
  if (!initData) {
    return reply.status(401).send({ 
      error: 'Unauthorized', 
      message: 'Missing X-Telegram-Init-Data header' 
    });
  }
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN_PARENT;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN_PARENT not configured');
    return reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Bot token not configured' 
    });
  }
  
  const result = validateInitDataComplete(initData, botToken);
  
  if (!result.valid) {
    return reply.status(401).send({ 
      error: 'Unauthorized', 
      message: result.error || 'Invalid initData' 
    });
  }
  
  // Adjuntar usuario al request
  (request as AuthenticatedRequest).user = result.user!;
}

/**
 * Middleware de multi-tenancy: extrae shop_id y valida ownership
 * Requiere authenticateTelegram previo
 */
export async function extractShopContext(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authReq = request as AuthenticatedRequest;
  
  if (!authReq.user) {
    return reply.status(401).send({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
  }
  
  // Buscar shop_id en múltiples fuentes (header, query, params, body)
  const shopId = 
    request.headers['x-shop-id'] as string ||
    (request.query as any)?.shop_id ||
    (request.params as any)?.shop_id ||
    (request.body as any)?.shop_id;
  
  if (!shopId) {
    // Si no hay shop_id, buscar si el usuario tiene tiendas
    // Para endpoints como GET /shops (listar tiendas del usuario)
    authReq.shopId = undefined;
    return;
  }
  
  const shopIdNum = parseInt(shopId, 10);
  if (isNaN(shopIdNum)) {
    return reply.status(400).send({ 
      error: 'Bad Request', 
      message: 'Invalid shop_id' 
    });
  }
  
  // Verificar que la tienda existe y el usuario tiene acceso
  const shop = await prisma.shop.findFirst({
    where: {
      id: shopIdNum,
      OR: [
        { ownerId: authReq.user.id },
        { 
          managers: {
            some: {
              user: {
                telegramId: BigInt(authReq.user.id)
              }
            }
          }
        }
      ]
    },
    include: {
      managers: true
    }
  });
  
  if (!shop) {
    return reply.status(403).send({ 
      error: 'Forbidden', 
      message: 'You do not have access to this shop' 
    });
  }
  
  // Verificar si es admin (owner o manager con permisos)
  const isOwner = shop.ownerId === authReq.user.id;
  const isManager = shop.managers.some(m => m.userId === authReq.user.id);
  
  authReq.shopId = shopIdNum;
  authReq.isAdmin = isOwner || isManager;
}

/**
 * Middleware combinado: auth + shop context
 */
export async function authenticateAndExtractShop(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await authenticateTelegram(request, reply);
  if (reply.sent) return;
  
  await extractShopContext(request, reply);
}

/**
 * Plugin de Fastify para registrar middlewares
 */
export async function registerAuthMiddlewares(app: FastifyInstance) {
  // Decorar request con user
  app.decorateRequest('user', null);
  app.decorateRequest('shopId', null);
  app.decorateRequest('isAdmin', null);
  
  // Hook preHandler global para logging (opcional)
  app.addHook('preHandler', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    if (authReq.user) {
      request.log.info({ 
        userId: authReq.user.id, 
        username: authReq.user.username,
        shopId: authReq.shopId 
      }, 'Authenticated request');
    }
  });
}
