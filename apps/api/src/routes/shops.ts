import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export async function registerShopRoutes(app: FastifyInstance) {
  // List shops
  app.get('/', async (request, reply) => {
    const { adminId } = request.query as any;
    
    const shops = await prisma.shop.findMany({
      where: { adminId: parseInt(adminId) },
      orderBy: { createdAt: 'desc' },
    });
    
    return { shops };
  });

  // Get single shop
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { adminId } = request.query as any;
    
    const shop = await prisma.shop.findFirst({
      where: { id: parseInt(id), adminId: parseInt(adminId) },
    });
    
    if (!shop) {
      return reply.status(404).send({ error: 'Shop not found' });
    }
    
    return shop;
  });

  // Create shop
  app.post('/', async (request, reply) => {
    const { adminId, name, description, category, country, currency, primaryColor } = request.body as any;
    
    const shop = await prisma.shop.create({
      data: {
        adminId: parseInt(adminId),
        name,
        description,
        category,
        country,
        currency,
        primaryColor: primaryColor || '#FF7403',
        status: 'pending',
      },
    });
    
    return { success: true, shop };
  });

  // Create shop from onboarding
  app.post('/onboarding', async (request, reply) => {
    const { adminId, name, description, category, country, currency, adminEmail, adminPhone, adminName, botUsername } = request.body as any;
    
    const shop = await prisma.shop.create({
      data: {
        adminId: parseInt(adminId),
        name,
        description,
        category,
        country,
        currency,
        primaryColor: '#FF7403',
        status: 'pending',
        botUsername,
        adminEmail,
        adminPhone,
        adminName,
      },
    });
    
    return { success: true, shopId: shop.id, shop };
  });

  // Update shop
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const data = request.body as any;
    
    const shop = await prisma.shop.update({
      where: { id: parseInt(id) },
      data,
    });
    
    return { success: true, shop };
  });

  // Delete shop
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as any;
    await prisma.shop.delete({ where: { id: parseInt(id) } });
    return { success: true };
  });

  // Regenerate bot token
  app.post('/:id/regenerate-token', async (request, reply) => {
    const { id } = request.params as any;
    const token = `bot${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const shop = await prisma.shop.update({
      where: { id: parseInt(id) },
      data: { botToken: token },
    });
    
    return { success: true, token };
  });

  // Get shop stats
  app.get('/:id/stats', async (request, reply) => {
    const { id } = request.params as any;
    const { adminId } = request.query as any;
    
    const shop = await prisma.shop.findFirst({
      where: { id: parseInt(id), adminId: parseInt(adminId) },
    });
    
    if (!shop) {
      return reply.status(404).send({ error: 'Shop not found' });
    }
    
    const [totalOrders, totalRevenue, totalCustomers, productsSold] = await Promise.all([
      prisma.order.count({ where: { shopId: parseInt(id) } }),
      prisma.order.aggregate({
        where: { shopId: parseInt(id), status: 'completed' },
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ['customerId'],
        where: { shopId: parseInt(id) },
      }).then(r => r.length),
      prisma.orderItem.aggregate({
        where: { order: { shopId: parseInt(id) } },
        _sum: { quantity: true },
      }),
    ]);
    
    return {
      shopId: parseInt(id),
      shopName: shop.name,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalCustomers,
      productsSold: productsSold._sum.quantity || 0,
    };
  });
}
