import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// ==========================================
// IMPORT ROUTES
// ==========================================
import { registerProductRoutes } from './routes/products';
import { registerOrderRoutes } from './routes/orders';
import { registerShopRoutes } from './routes/shops';
import { registerAdminRoutes } from './routes/admin';
import { registerAuthRoutes } from './routes/auth';
import { registerWebhookRoutes } from './webhooks';
import { registerNotificationRoutes } from './notifications';

// ==========================================
// CONFIG
// ==========================================
const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'vendy-dev-secret';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vendy';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ==========================================
// INIT
// ==========================================
export const app = Fastify({ logger: true });
export const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});
export const redis = new Redis(REDIS_URL);

// ==========================================
// PLUGINS
// ==========================================
app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
});

app.register(jwt, {
  secret: JWT_SECRET,
});

app.register(swagger, {
  openapi: {
    info: {
      title: 'Vendy API',
      description: 'Store-as-a-Service for Telegram',
      version: '1.0.0',
    },
    servers: [{ url: 'http://localhost:3001' }],
  },
});

app.register(swaggerUi, {
  routePrefix: '/docs',
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/health', async () => {
  const dbHealthy = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  const redisHealthy = await redis.ping().then(() => true).catch(() => false);
  
  return {
    status: dbHealthy && redisHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'up' : 'down',
      redis: redisHealthy ? 'up' : 'down',
    },
  };
});

app.get('/health/live', async () => ({ status: 'alive' }));
app.get('/health/ready', async () => {
  const dbHealthy = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  return { status: dbHealthy ? 'ready' : 'not_ready' };
});

// ==========================================
// ROUTES
// ==========================================
app.register(registerAuthRoutes, { prefix: '/auth' });
app.register(registerProductRoutes, { prefix: '/products' });
app.register(registerOrderRoutes, { prefix: '/orders' });
app.register(registerShopRoutes, { prefix: '/shops' });
app.register(registerAdminRoutes, { prefix: '/admin' });
app.register(registerWebhookRoutes, { prefix: '/webhooks' });
app.register(registerNotificationRoutes, { prefix: '/notifications' });

// ==========================================
// ERROR HANDLER
// ==========================================
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.status(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// ==========================================
// START
// ==========================================
async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 API running on http://${HOST}:${PORT}`);
    console.log(`📚 Docs: http://${HOST}:${PORT}/docs`);
    console.log(`❤️  Health: http://${HOST}:${PORT}/health`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export default app;
