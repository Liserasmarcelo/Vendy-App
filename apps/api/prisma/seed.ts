import { PrismaClient } from '@prisma/client';

// ==========================================
// SEED DATA PARA DESARROLLO
// ==========================================

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // 1. Usuario admin
  console.log('Creando usuario admin...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vendy.app' },
    update: {},
    create: {
      email: 'admin@vendy.app',
      passwordHash: '$2b$10$EpRnTzVqlHPKO8i5QyMU9u5VzG2iJzWz7JqJzWz7JqJzWz7JqJzWz', // bcrypt de 'admin123'
      firstName: 'Admin',
      lastName: 'Vendy',
      username: 'adminvendy',
      role: 'admin',
      language: 'es',
    },
  });

  // 2. Tienda de ejemplo
  console.log('Creando tienda de ejemplo...');
  const shop = await prisma.shop.upsert({
    where: { slug: 'tienda-ejemplo' },
    update: {},
    create: {
      ownerId: admin.id,
      name: 'Tienda de Ejemplo',
      slug: 'tienda-ejemplo',
      description: 'Una tienda de ejemplo para probar todas las funcionalidades de Vendy',
      currency: 'USD',
      timezone: 'America/Asuncion',
      status: 'active',
      plan: 'crecimiento',
      commissionRate: 0.02,
      whiteLabelEnabled: false,
      settings: JSON.stringify({
        theme: 'dark',
        primaryColor: '#FF7403',
        allowGuestCheckout: true,
        requirePhone: true,
      }),
    },
  });

  // 3. Productos de ejemplo
  console.log('Creando productos...');
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'VEN-001' },
      update: {},
      create: {
        shopId: shop.id,
        name: 'Camiseta Vendy',
        description: 'Camiseta oficial de Vendy. 100% algodón, disponible en tallas S, M, L, XL.',
        price: 29.99,
        stock: 100,
        category: 'ropa',
        sku: 'VEN-001',
        barcode: '1234567890123',
        images: JSON.stringify([
          'https://cdn.vendy.app/products/camiseta-1.jpg',
          'https://cdn.vendy.app/products/camiseta-2.jpg',
        ]),
        variants: JSON.stringify([
          { size: 'S', stock: 25 },
          { size: 'M', stock: 30 },
          { size: 'L', stock: 25 },
          { size: 'XL', stock: 20 },
        ]),
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'VEN-002' },
      update: {},
      create: {
        shopId: shop.id,
        name: 'Taza Vendy',
        description: 'Taza oficial de Vendy. Cerámica de alta calidad, 350ml.',
        price: 14.99,
        stock: 50,
        category: 'hogar',
        sku: 'VEN-002',
        barcode: '1234567890124',
        images: JSON.stringify([
          'https://cdn.vendy.app/products/taza-1.jpg',
        ]),
        variants: JSON.stringify([
          { color: 'blanco', stock: 30 },
          { color: 'negro', stock: 20 },
        ]),
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'VEN-003' },
      update: {},
      create: {
        shopId: shop.id,
        name: 'Sticker Pack Vendy',
        description: 'Pack de 10 stickers de Vendy. Resistentes al agua.',
        price: 4.99,
        stock: 200,
        category: 'accesorios',
        sku: 'VEN-003',
        barcode: '1234567890125',
        images: JSON.stringify([
          'https://cdn.vendy.app/products/stickers-1.jpg',
        ]),
        variants: JSON.stringify([]),
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'VEN-004' },
      update: {},
      create: {
        shopId: shop.id,
        name: 'Gorra Vendy',
        description: 'Gorra oficial de Vendy. Ajustable, 100% algodón.',
        price: 19.99,
        stock: 75,
        category: 'ropa',
        sku: 'VEN-004',
        barcode: '1234567890126',
        images: JSON.stringify([
          'https://cdn.vendy.app/products/gorra-1.jpg',
        ]),
        variants: JSON.stringify([
          { color: 'negro', stock: 40 },
          { color: 'azul', stock: 35 },
        ]),
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'VEN-005' },
      update: {},
      create: {
        shopId: shop.id,
        name: 'Mochila Vendy',
        description: 'Mochila oficial de Vendy. Resistente al agua, compartimento para laptop.',
        price: 49.99,
        stock: 30,
        category: 'accesorios',
        sku: 'VEN-005',
        barcode: '1234567890127',
        images: JSON.stringify([
          'https://cdn.vendy.app/products/mochila-1.jpg',
        ]),
        variants: JSON.stringify([]),
        isActive: true,
      },
    }),
  ]);

  // 4. Cliente de ejemplo
  console.log('Creando cliente de ejemplo...');
  const customer = await prisma.customer.upsert({
    where: { id: '123456789' },
    update: {},
    create: {
      id: '123456789',
      shopId: shop.id,
      telegramId: '123456789',
      firstName: 'Juan',
      lastName: 'Pérez',
      username: 'juanperez',
      phone: '+595991234567',
      email: 'juan@example.com',
      language: 'es',
      preferences: JSON.stringify({
        notifications: { push: true, email: true },
        currency: 'USD',
      }),
    },
  });

  // 5. Orden de ejemplo
  console.log('Creando orden de ejemplo...');
  const order = await prisma.order.create({
    data: {
      shopId: shop.id,
      customerId: customer.id,
      status: 'processing',
      total: 44.98,
      subtotal: 44.98,
      shipping: 0,
      tax: 0,
      discount: 0,
      paymentStatus: 'paid',
      shippingAddress: JSON.stringify({
        street: 'Av. Example 123',
        city: 'Asunción',
        state: 'Central',
        zipCode: '001001',
        country: 'PY',
      }),
      metadata: JSON.stringify({
        source: 'telegram_bot',
        campaign: 'summer_2024',
      }),
    },
  });

  // 6. Items de la orden
  console.log('Creando items de orden...');
  await Promise.all([
    prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: products[0].id, // Camiseta
        productName: products[0].name,
        quantity: 1,
        unitPrice: 29.99,
        totalPrice: 29.99,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: products[1].id, // Taza
        productName: products[1].name,
        quantity: 1,
        unitPrice: 14.99,
        totalPrice: 14.99,
      },
    }),
  ]);

  // 7. Pago de la orden
  console.log('Creando pago...');
  await prisma.payment.create({
    data: {
      orderId: order.id,
      method: 'stripe',
      status: 'paid',
      amount: 44.98,
      currency: 'USD',
      transactionId: 'pi_1234567890',
      receiptUrl: 'https://pay.stripe.com/receipts/...',
      metadata: JSON.stringify({
        paymentMethod: 'card',
        last4: '4242',
      }),
    },
  });

  // 8. Ticket de soporte de ejemplo
  console.log('Creando ticket de soporte...');
  const ticket = await prisma.ticket.create({
    data: {
      id: 'ticket_1',
      shopId: shop.id,
      customerId: customer.id,
      subject: 'Problema con el pago',
      description: 'Intenté pagar con tarjeta pero me dio error.',
      status: 'open',
      priority: 'high',
      category: 'billing',
    },
  });

  // 9. Mensajes del ticket
  console.log('Creando mensajes del ticket...');
  await Promise.all([
    prisma.ticketMessage.create({
      data: {
        id: 'msg_1',
        ticketId: ticket.id,
        senderId: customer.id,
        senderType: 'customer',
        content: 'Hola, necesito ayuda con mi pago.',
      },
    }),
    prisma.ticketMessage.create({
      data: {
        id: 'msg_2',
        ticketId: ticket.id,
        senderId: admin.id.toString(),
        senderType: 'agent',
        content: 'Hola Juan, con gusto te ayudo. ¿Podrías indicarme qué error te apareció?',
      },
    }),
  ]);

  // 10. Artículos de ayuda
  console.log('Creando artículos de ayuda...');
  await Promise.all([
    prisma.helpArticle.create({
      data: {
        id: 'article_1',
        title: 'Cómo crear tu primera tienda',
        content: 'Paso 1: Abre el bot padre y escribe /start...',
        category: 'getting-started',
        tags: JSON.stringify(['tutorial', 'setup', 'beginner']),
        viewCount: 150,
        helpfulCount: 42,
        isPublished: true,
      },
    }),
    prisma.helpArticle.create({
      data: {
        id: 'article_2',
        title: 'Cómo agregar productos',
        content: 'Desde el Mini-App, ve a Productos y haz clic en "Nuevo Producto"...',
        category: 'products',
        tags: JSON.stringify(['tutorial', 'products']),
        viewCount: 89,
        helpfulCount: 31,
        isPublished: true,
      },
    }),
    prisma.helpArticle.create({
      data: {
        id: 'article_3',
        title: 'Configurar pagos con Stripe',
        content: 'Ve a Configuración > Pagos y conecta tu cuenta de Stripe...',
        category: 'payments',
        tags: JSON.stringify(['stripe', 'payments', 'setup']),
        viewCount: 67,
        helpfulCount: 28,
        isPublished: true,
      },
    }),
  ]);

  // 11. FAQs
  console.log('Creando FAQs...');
  await Promise.all([
    prisma.fAQ.create({
      data: {
        id: 'faq_1',
        question: '¿Cómo cambio mi plan?',
        answer: 'Ve a Configuración > Facturación y selecciona el plan que deseas.',
        category: 'billing',
        helpfulCount: 25,
        isPublished: true,
      },
    }),
    prisma.fAQ.create({
      data: {
        id: 'faq_2',
        question: '¿Puedo tener múltiples tiendas?',
        answer: 'Sí, puedes crear hasta 3 tiendas en el plan Crecimiento y ilimitadas en el plan Pro.',
        category: 'general',
        helpfulCount: 18,
        isPublished: true,
      },
    }),
    prisma.fAQ.create({
      data: {
        id: 'faq_3',
        question: '¿Cómo configuro envíos?',
        answer: 'Ve a Configuración > Envíos y define tus zonas y tarifas.',
        category: 'shipping',
        helpfulCount: 15,
        isPublished: true,
      },
    }),
  ]);

  console.log('✅ Seed completado exitosamente!');
  console.log('');
  console.log('Datos creados:');
  console.log(`  - Usuario admin: ${admin.email}`);
  console.log(`  - Tienda: ${shop.name} (${shop.slug})`);
  console.log(`  - Productos: ${products.length}`);
  console.log(`  - Cliente: ${customer.firstName} ${customer.lastName}`);
  console.log(`  - Orden: #${order.id} ($${order.total})`);
  console.log(`  - Ticket: ${ticket.id}`);
  console.log(`  - Artículos de ayuda: 3`);
  console.log(`  - FAQs: 3`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
