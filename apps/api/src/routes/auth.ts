import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export async function registerAuthRoutes(app: FastifyInstance) {
  // Telegram initData validation
  app.post('/telegram', async (request, reply) => {
    const { initData, shopId } = request.body as any;
    
    // In production: validate HMAC-SHA256 signature
    // For now: parse and return user info
    
    try {
      const params = new URLSearchParams(initData);
      const user = JSON.parse(params.get('user') || '{}');
      
      // Find or create customer
      let customer = await prisma.customer.findUnique({
        where: { telegramId: user.id.toString() },
      });
      
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            telegramId: user.id.toString(),
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            language: user.language_code || 'es',
          },
        });
      }
      
      // Generate JWT
      const token = await reply.jwtSign({
        customerId: customer.id,
        telegramId: user.id,
        shopId: parseInt(shopId),
      });
      
      return { success: true, token, customer };
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid initData' });
    }
  });

  // Verify token
  app.get('/verify', async (request, reply) => {
    try {
      await request.jwtVerify();
      return { valid: true, user: request.user };
    } catch {
      return reply.status(401).send({ valid: false });
    }
  });
}
