import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export async function registerProductRoutes(app: FastifyInstance) {
  // List products (with shop filter)
  app.get('/', async (request, reply) => {
    const { shopId, category, search, page = '1', limit = '20' } = request.query as any;
    
    const where: any = { shopId: parseInt(shopId) };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  });

  // Get single product
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }
    
    return product;
  });

  // Create product
  app.post('/', async (request, reply) => {
    const { shopId, name, description, price, currency, category, stock, images, variants } = request.body as any;
    
    const product = await prisma.product.create({
      data: {
        shopId: parseInt(shopId),
        name,
        description,
        price: parseFloat(price),
        currency,
        category,
        stock: parseInt(stock),
        images: images || [],
        variants: variants || [],
        isActive: true,
      },
    });
    
    return { success: true, product };
  });

  // Update product
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const data = request.body as any;
    
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        ...data,
        price: data.price ? parseFloat(data.price) : undefined,
        stock: data.stock ? parseInt(data.stock) : undefined,
      },
    });
    
    return { success: true, product };
  });

  // Delete product
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as any;
    await prisma.product.delete({ where: { id: parseInt(id) } });
    return { success: true };
  });

  // Toggle product status
  app.patch('/:id/toggle', async (request, reply) => {
    const { id } = request.params as any;
    const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }
    
    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { isActive: !product.isActive },
    });
    
    return { success: true, isActive: updated.isActive };
  });
}
