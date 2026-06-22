import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';

// ==========================================
// SWAGGER / OPENAPI CONFIGURATION
// ==========================================
export default fp(async function (fastify: FastifyInstance) {
  // Register Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Vendy API',
        description: 'Store-as-a-Service para Telegram — API Documentation',
        version: '1.0.0',
        contact: {
          name: 'Vendy Support',
          email: 'support@vendy.app',
          url: 'https://vendy.app',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      externalDocs: {
        description: 'Documentación completa',
        url: 'https://docs.vendy.app',
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Desarrollo local',
        },
        {
          url: 'https://api.vendy.app',
          description: 'Producción',
        },
        {
          url: 'https://api-staging.vendy.app',
          description: 'Staging',
        },
      ],
      tags: [
        { name: 'Auth', description: 'Autenticación y autorización' },
        { name: 'Shops', description: 'Gestión de tiendas' },
        { name: 'Products', description: 'Catálogo de productos' },
        { name: 'Orders', description: 'Gestión de órdenes' },
        { name: 'Payments', description: 'Procesamiento de pagos' },
        { name: 'Customers', description: 'Gestión de clientes' },
        { name: 'Analytics', description: 'Métricas y reportes' },
        { name: 'Support', description: 'Tickets y chat de soporte' },
        { name: 'Help', description: 'Centro de ayuda y FAQ' },
        { name: 'Notifications', description: 'Notificaciones y preferencias' },
        { name: 'Webhooks', description: 'Webhooks de Telegram y Stripe' },
        { name: 'Health', description: 'Health checks y monitoreo' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token JWT obtenido del login',
          },
          telegramInitData: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Telegram-Init-Data',
            description: 'Datos de inicialización de Telegram Mini App',
          },
        },
        schemas: {
          // Error response
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string', example: 'NotFound' },
              message: { type: 'string', example: 'Resource not found' },
              statusCode: { type: 'integer', example: 404 },
            },
          },
          // Pagination
          Pagination: {
            type: 'object',
            properties: {
              total: { type: 'integer', example: 100 },
              limit: { type: 'integer', example: 20 },
              offset: { type: 'integer', example: 0 },
              hasMore: { type: 'boolean', example: true },
            },
          },
          // Shop
          Shop: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Mi Tienda' },
              description: { type: 'string', example: 'La mejor tienda' },
              slug: { type: 'string', example: 'mi-tienda' },
              currency: { type: 'string', example: 'USD' },
              timezone: { type: 'string', example: 'America/Asuncion' },
              status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
              plan: { type: 'string', enum: ['inicial', 'crecimiento', 'pro'], example: 'crecimiento' },
              commissionRate: { type: 'number', example: 0.02 },
              whiteLabelEnabled: { type: 'boolean', example: false },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          // Product
          Product: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              shopId: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Camiseta Vendy' },
              description: { type: 'string', example: 'Camiseta oficial de Vendy' },
              price: { type: 'number', example: 29.99 },
              stock: { type: 'integer', example: 100 },
              category: { type: 'string', example: 'ropa' },
              sku: { type: 'string', example: 'VEN-001' },
              barcode: { type: 'string', example: '1234567890123' },
              images: { type: 'array', items: { type: 'string' }, example: ['https://cdn.vendy.app/img1.jpg'] },
              isActive: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          // Order
          Order: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              shopId: { type: 'integer', example: 1 },
              customerId: { type: 'string', example: '123456789' },
              status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], example: 'processing' },
              total: { type: 'number', example: 59.99 },
              subtotal: { type: 'number', example: 54.99 },
              shipping: { type: 'number', example: 5.00 },
              tax: { type: 'number', example: 0.00 },
              discount: { type: 'number', example: 0.00 },
              items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
              shippingAddress: { type: 'object' },
              paymentStatus: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded'], example: 'paid' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          // OrderItem
          OrderItem: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              productId: { type: 'integer', example: 1 },
              productName: { type: 'string', example: 'Camiseta Vendy' },
              quantity: { type: 'integer', example: 2 },
              unitPrice: { type: 'number', example: 29.99 },
              totalPrice: { type: 'number', example: 59.98 },
            },
          },
          // Customer
          Customer: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '123456789' },
              telegramId: { type: 'string', example: '123456789' },
              firstName: { type: 'string', example: 'Juan' },
              lastName: { type: 'string', example: 'Pérez' },
              username: { type: 'string', example: 'juanperez' },
              phone: { type: 'string', example: '+595981123456' },
              email: { type: 'string', example: 'juan@example.com' },
              language: { type: 'string', example: 'es' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          // Ticket
          Ticket: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'ticket_1' },
              shopId: { type: 'integer', example: 1 },
              customerId: { type: 'string', example: '123456789' },
              subject: { type: 'string', example: 'Problema con pago' },
              description: { type: 'string', example: 'No puedo completar el pago' },
              status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'], example: 'open' },
              priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'high' },
              category: { type: 'string', enum: ['general', 'billing', 'technical', 'feature_request', 'bug'], example: 'billing' },
              assignedTo: { type: 'string', example: 'agent_1' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              resolvedAt: { type: 'string', format: 'date-time' },
            },
          },
          // TicketMessage
          TicketMessage: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'msg_1' },
              ticketId: { type: 'string', example: 'ticket_1' },
              senderId: { type: 'string', example: '123456789' },
              senderType: { type: 'string', enum: ['customer', 'agent', 'system'], example: 'customer' },
              content: { type: 'string', example: 'Hola, necesito ayuda' },
              attachments: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          // HelpArticle
          HelpArticle: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'article_1' },
              title: { type: 'string', example: 'Cómo crear una tienda' },
              content: { type: 'string', example: 'Pasos para crear tu tienda...' },
              category: { type: 'string', example: 'getting-started' },
              tags: { type: 'array', items: { type: 'string' }, example: ['tutorial', 'setup'] },
              helpfulCount: { type: 'integer', example: 42 },
              notHelpfulCount: { type: 'integer', example: 3 },
              viewCount: { type: 'integer', example: 150 },
              isPublished: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          // FAQ
          FAQ: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'faq_1' },
              question: { type: 'string', example: '¿Cómo cambio mi plan?' },
              answer: { type: 'string', example: 'Ve a Configuración > Facturación...' },
              category: { type: 'string', example: 'billing' },
              helpfulCount: { type: 'integer', example: 25 },
              notHelpfulCount: { type: 'integer', example: 1 },
              isPublished: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          // Notification
          Notification: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'notif_1' },
              userId: { type: 'string', example: '123456789' },
              shopId: { type: 'integer', example: 1 },
              type: { type: 'string', enum: ['order_created', 'payment_received', 'payment_failed', 'low_stock', 'subscription_expiring', 'ticket_updated', 'new_message', 'system'], example: 'order_created' },
              title: { type: 'string', example: 'Nueva orden' },
              body: { type: 'string', example: 'Tienes una nueva orden #123' },
              data: { type: 'object', example: { orderId: 123 } },
              channel: { type: 'string', enum: ['push', 'email', 'sms', 'in_app'], example: 'push' },
              status: { type: 'string', enum: ['pending', 'sent', 'failed', 'read'], example: 'sent' },
              sentAt: { type: 'string', format: 'date-time' },
              readAt: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          // Payment
          Payment: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'pay_1' },
              orderId: { type: 'integer', example: 1 },
              method: { type: 'string', enum: ['stripe', 'telegram_stars', 'transfer', 'cash'], example: 'stripe' },
              status: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded'], example: 'paid' },
              amount: { type: 'number', example: 59.99 },
              currency: { type: 'string', example: 'USD' },
              transactionId: { type: 'string', example: 'pi_1234567890' },
              receipt: { type: 'string', example: 'https://stripe.com/receipts/123' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          // AnalyticsSummary
          AnalyticsSummary: {
            type: 'object',
            properties: {
              totalRevenue: { type: 'number', example: 15000.50 },
              totalOrders: { type: 'integer', example: 250 },
              totalCustomers: { type: 'integer', example: 180 },
              averageOrderValue: { type: 'number', example: 60.00 },
              conversionRate: { type: 'number', example: 0.035 },
              period: { type: 'string', example: '2024-06' },
            },
          },
          // WebhookEvent
          WebhookEvent: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'wh_123' },
              source: { type: 'string', enum: ['telegram', 'stripe'], example: 'stripe' },
              event: { type: 'string', example: 'payment_intent.succeeded' },
              payload: { type: 'object' },
              status: { type: 'string', enum: ['pending', 'processed', 'failed'], example: 'processed' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          // HealthStatus
          HealthStatus: {
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
    },
  });

  // Register Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
    },
    uiHooks: {
      onRequest: function (request, reply, next) { next() },
      preHandler: function (request, reply, next) { next() },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  fastify.log.info('Swagger documentation registered at /documentation');
});
