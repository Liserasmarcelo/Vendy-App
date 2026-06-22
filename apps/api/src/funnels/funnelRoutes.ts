import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getFunnelAnalyzer, FunnelType } from './funnelAnalyzer';

// ==========================================
// FUNNEL ROUTES
// ==========================================
export async function registerFunnelRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
  const analyzer = getFunnelAnalyzer(prisma);

  // Get funnel analysis
  fastify.get('/funnels/:type', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type } = request.params as { type: string };
    const { shopId, startDate, endDate } = request.query as any;

    if (!shopId || !startDate || !endDate) {
      return reply.status(400).send({
        error: 'Missing required parameters: shopId, startDate, endDate',
      });
    }

    try {
      const funnel = await analyzer.analyze(
        type as FunnelType,
        parseInt(shopId),
        new Date(startDate),
        new Date(endDate)
      );

      reply.send(funnel);
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to analyze funnel',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Compare funnels (current vs previous period)
  fastify.get('/funnels/:type/compare', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type } = request.params as { type: string };
    const {
      shopId,
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    } = request.query as any;

    if (!shopId || !currentStart || !currentEnd || !previousStart || !previousEnd) {
      return reply.status(400).send({
        error: 'Missing required parameters',
      });
    }

    try {
      const comparison = await analyzer.compareFunnels(
        type as FunnelType,
        parseInt(shopId),
        { start: new Date(currentStart), end: new Date(currentEnd) },
        { start: new Date(previousStart), end: new Date(previousEnd) }
      );

      reply.send(comparison);
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to compare funnels',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get drop-off analysis with recommendations
  fastify.get('/funnels/:type/dropoff', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type } = request.params as { type: string };
    const { shopId, startDate, endDate } = request.query as any;

    if (!shopId || !startDate || !endDate) {
      return reply.status(400).send({
        error: 'Missing required parameters',
      });
    }

    try {
      const analysis = await analyzer.getDropOffAnalysis(
        type as FunnelType,
        parseInt(shopId),
        new Date(startDate),
        new Date(endDate)
      );

      reply.send(analysis);
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to analyze drop-off',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // List available funnel types
  fastify.get('/funnels', async (request: FastifyRequest, reply: FastifyReply) => {
    const funnels = [
      {
        id: 'purchase',
        name: 'Funnel de Compra',
        description: 'Seguimiento del journey de compra desde visita hasta checkout',
        steps: 5,
      },
      {
        id: 'onboarding',
        name: 'Funnel de Onboarding',
        description: 'Proceso de registro de nuevos vendedores',
        steps: 5,
      },
      {
        id: 'retention',
        name: 'Funnel de Retención',
        description: 'Retorno de clientes después de primera compra',
        steps: 4,
      },
      {
        id: 'reactivation',
        name: 'Funnel de Reactivación',
        description: 'Reactivación de usuarios inactivos vía email',
        steps: 5,
      },
    ];

    reply.send({ funnels });
  });
}
