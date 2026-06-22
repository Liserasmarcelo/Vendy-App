import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getReportGenerator, ReportFormat, ReportType } from './reportGenerator';

// ==========================================
// REPORT ROUTES
// ==========================================
export async function registerReportRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
  const generator = getReportGenerator(prisma);

  // Generate report
  fastify.get('/reports/:type', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type } = request.params as { type: string };
    const { 
      shopId, 
      startDate, 
      endDate, 
      format = 'csv',
      ...filters 
    } = request.query as any;

    if (!shopId || !startDate || !endDate) {
      return reply.status(400).send({
        error: 'Missing required parameters: shopId, startDate, endDate',
      });
    }

    try {
      const report = await generator.generate({
        shopId: parseInt(shopId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        format: format as ReportFormat,
        type: type as ReportType,
        filters,
      });

      reply
        .header('Content-Type', report.contentType)
        .header('Content-Disposition', `attachment; filename="${report.filename}"`)
        .header('Content-Length', report.size)
        .send(report.buffer);
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // List available reports
  fastify.get('/reports', async (request: FastifyRequest, reply: FastifyReply) => {
    const reports = [
      {
        id: 'orders',
        name: 'Órdenes',
        description: 'Listado de órdenes con detalles de cliente y productos',
        formats: ['csv', 'excel', 'pdf'],
        filters: ['status'],
      },
      {
        id: 'products',
        name: 'Productos',
        description: 'Catálogo de productos con ventas e ingresos',
        formats: ['csv', 'excel', 'pdf'],
        filters: ['isActive'],
      },
      {
        id: 'customers',
        name: 'Clientes',
        description: 'Listado de clientes con historial de compras',
        formats: ['csv', 'excel', 'pdf'],
        filters: [],
      },
      {
        id: 'sales',
        name: 'Ventas',
        description: 'Resumen de ventas diarias con totales',
        formats: ['csv', 'excel', 'pdf'],
        filters: [],
      },
      {
        id: 'inventory',
        name: 'Inventario',
        description: 'Estado del inventario con alertas de stock',
        formats: ['csv', 'excel', 'pdf'],
        filters: [],
      },
    ];

    reply.send({ reports });
  });

  // Generate scheduled report (placeholder for cron job)
  fastify.post('/reports/schedule', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type, shopId, frequency, email, format } = request.body as any;

    // In a real implementation, this would store the schedule in the database
    // and a cron job would generate and send the report
    reply.send({
      message: 'Report scheduled',
      schedule: {
        type,
        shopId,
        frequency,
        email,
        format,
        nextRun: getNextRunDate(frequency),
      },
    });
  });
}

function getNextRunDate(frequency: string): string {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    default:
      now.setDate(now.getDate() + 1);
  }
  return now.toISOString();
}
