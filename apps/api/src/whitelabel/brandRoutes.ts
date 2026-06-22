import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getBrandManager } from './brandManager';

// ==========================================
// BRAND ROUTES
// ==========================================
export async function registerBrandRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
  const manager = getBrandManager(prisma);

  // Get brand config
  fastify.get('/brand/:shopId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };

    const config = await manager.getBrandConfig(parseInt(shopId));
    
    if (!config) {
      return reply.status(404).send({ error: 'Shop not found' });
    }

    reply.send(config);
  });

  // Update brand config
  fastify.patch('/brand/:shopId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };
    const updates = request.body as any;

    try {
      const config = await manager.updateBrandConfig(parseInt(shopId), updates);
      reply.send(config);
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to update brand config',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Validate domain
  fastify.post('/brand/domain/validate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { domain } = request.body as { domain: string };

    const result = await manager.validateDomain(domain);
    reply.send(result);
  });

  // Configure custom domain
  fastify.post('/brand/:shopId/domain', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };
    const { domain } = request.body as { domain: string };

    try {
      const config = await manager.configureDomain(parseInt(shopId), domain);
      reply.send(config);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to configure domain',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Verify domain
  fastify.post('/brand/:shopId/domain/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };

    try {
      const result = await manager.verifyDomain(parseInt(shopId));
      reply.send(result);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to verify domain',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get brand CSS
  fastify.get('/brand/:shopId/css', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.params as { shopId: string };

    const config = await manager.getBrandConfig(parseInt(shopId));
    
    if (!config) {
      return reply.status(404).send({ error: 'Shop not found' });
    }

    const css = manager.generateBrandCSS(config);

    reply
      .header('Content-Type', 'text/css')
      .send(css);
  });

  // Get brand config by domain (for custom domains)
  fastify.get('/brand/domain/:domain', async (request: FastifyRequest, reply: FastifyReply) => {
    const { domain } = request.params as { domain: string };

    const shop = await prisma.shop.findFirst({
      where: {
        customDomain: domain,
        domainVerified: true,
      },
    });

    if (!shop) {
      return reply.status(404).send({ error: 'Domain not found or not verified' });
    }

    const config = await manager.getBrandConfig(shop.id);
    reply.send(config);
  });
}
