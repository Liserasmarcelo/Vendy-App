import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export async function registerAdminRoutes(app: FastifyInstance) {
  // Get admin stats
  app.get('/:adminId/stats', async (request, reply) => {
    const { adminId } = request.params as any;
    
    const [shops, orders, customers] = await Promise.all([
      prisma.shop.findMany({ where: { adminId: parseInt(adminId) } }),
      prisma.order.findMany({
        where: { shop: { adminId: parseInt(adminId) } },
        include: { shop: true },
      }),
      prisma.order.groupBy({
        by: ['customerId'],
        where: { shop: { adminId: parseInt(adminId) } },
      }).then(r => r.length),
    ]);
    
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);
    
    const activeShops = shops.filter(s => s.status === 'active').length;
    
    return {
      totalShops: shops.length,
      activeShops,
      totalOrders: orders.length,
      totalRevenue,
      totalCustomers: customers,
      topShops: shops.map(shop => ({
        name: shop.name,
        revenue: orders
          .filter(o => o.shopId === shop.id && o.status === 'completed')
          .reduce((sum, o) => sum + o.total, 0),
        orders: orders.filter(o => o.shopId === shop.id).length,
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    };
  });

  // Get admin shops
  app.get('/:adminId/shops', async (request, reply) => {
    const { adminId } = request.params as any;
    
    const shops = await prisma.shop.findMany({
      where: { adminId: parseInt(adminId) },
      include: {
        _count: {
          select: { products: true, orders: true },
        },
      },
    });
    
    return {
      shops: shops.map(shop => ({
        ...shop,
        productCount: shop._count.products,
        totalOrders: shop._count.orders,
      })),
    };
  });

  // Get all orders for admin
  app.get('/:adminId/orders', async (request, reply) => {
    const { adminId } = request.params as any;
    const { status, page = '1', limit = '20' } = request.query as any;
    
    const where: any = { shop: { adminId: parseInt(adminId) } };
    if (status) where.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { shop: true, items: true },
      }),
      prisma.order.count({ where }),
    ]);
    
    return { orders, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
  });
}
