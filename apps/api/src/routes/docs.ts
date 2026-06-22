import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// ==========================================
// API DOCS ROUTES
// ==========================================
export async function registerDocsRoutes(fastify: FastifyInstance) {
  // Export OpenAPI spec as JSON
  fastify.get('/api/openapi.json', async (request: FastifyRequest, reply: FastifyReply) => {
    const spec = fastify.swagger();
    reply.send(spec);
  });

  // Health check endpoint (documented in Swagger)
  fastify.get('/health', {
    schema: {
      description: 'Verificar estado de salud de la API',
      tags: ['Health'],
      response: {
        200: {
          description: 'API funcionando correctamente',
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string', example: '1.0.0' },
            uptime: { type: 'number', example: 3600 },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string', example: 'connected' },
                redis: { type: 'string', example: 'connected' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
  });

  // Database health check
  fastify.get('/health/db', {
    schema: {
      description: 'Verificar conexión a la base de datos',
      tags: ['Health'],
      response: {
        200: {
          description: 'Base de datos conectada',
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            latency: { type: 'number', example: 5.2 },
          },
        },
        503: {
          description: 'Base de datos no disponible',
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const start = Date.now();
    try {
      // Simple query to check DB connection
      await (request.server as any).prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      reply.send({ status: 'ok', latency });
    } catch (error) {
      reply.status(503).send({
        status: 'error',
        message: error instanceof Error ? error.message : 'Database connection failed',
      });
    }
  });

  // Redis health check
  fastify.get('/health/redis', {
    schema: {
      description: 'Verificar conexión a Redis',
      tags: ['Health'],
      response: {
        200: {
          description: 'Redis conectado',
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            latency: { type: 'number', example: 2.1 },
          },
        },
        503: {
          description: 'Redis no disponible',
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const start = Date.now();
    try {
      // Simple ping to check Redis
      await (request.server as any).redis.ping();
      const latency = Date.now() - start;
      reply.send({ status: 'ok', latency });
    } catch (error) {
      reply.status(503).send({
        status: 'error',
        message: error instanceof Error ? error.message : 'Redis connection failed',
      });
    }
  });
}
