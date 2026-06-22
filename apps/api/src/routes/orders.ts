import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export async function registerOrderRoutes(app: FastifyInstance) {
  // List orders
  app.get('/', async (request, reply) => {
    const { shopId, status, dateFrom, dateTo, page = '1', limit = '20' } = request.query as any;
    
    const where: any = { shopId: parseInt(shopId) };
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  });

  // Get order stats
  app.get('/stats', async (request, reply) => {
    const { shopId } = request.query as any;
    
    const [total, pending, processing, completed, cancelled, revenue] = await Promise.all([
      prisma.order.count({ where: { shopId: parseInt(shopId) } }),
      prisma.order.count({ where: { shopId: parseInt(shopId), status: 'pending' } }),
      prisma.order.count({ where: { shopId: parseInt(shopId), status: 'processing' } }),
      prisma.order.count({ where: { shopId: parseInt(shopId), status: 'completed' } }),
      prisma.order.count({ where: { shopId: parseInt(shopId), status: 'cancelled' } }),
      prisma.order.aggregate({
        where: { shopId: parseInt(shopId), status: 'completed' },
        _sum: { total: true },
      }),
    ]);

    return {
      total,
      pending,
      processing,
      completed,
      cancelled,
      revenue: revenue._sum.total || 0,
    };
  });

  // Get single order
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { items: true },
    });
    
    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }
    
    return order;
  });

  // Create order
  app.post('/', async (request, reply) => {
    const { shopId, customerId, items, total, shippingAddress, paymentMethod } = request.body as any;
    
    const orderNumber = `ORD-${Date.now()}`;
    
    const order = await prisma.order.create({
      data: {
        shopId: parseInt(shopId),
        customerId,
        orderNumber,
        total: parseFloat(total),
        status: 'pending',
        paymentMethod,
        shippingAddress,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            variant: item.variant,
          })),
        },
      },
      include: { items: true },
    });
    
    return { success: true, order };
  });

  // Update order status
  app.patch('/:id/status', async (request, reply) => {
    const { id } = request.params as any;
    const { status } = request.body as any;
    
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    
    return { success: true, order };
  });

  // Cancel order
  app.patch('/:id/cancel', async (request, reply) => {
    const { id } = request.params as any;
    const { reason } = request.body as any;
    
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status: 'cancelled', cancellationReason: reason },
    });
    
    return { success: true, order };
  });
}
