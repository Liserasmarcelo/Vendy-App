import { PrismaClient } from '@prisma/client';

// ==========================================
// REPORT TYPES
// ==========================================
export type ReportFormat = 'csv' | 'excel' | 'pdf';
export type ReportType = 'orders' | 'products' | 'customers' | 'sales' | 'inventory';

export interface ReportOptions {
  shopId: number;
  startDate: Date;
  endDate: Date;
  format: ReportFormat;
  type: ReportType;
  filters?: Record<string, any>;
}

export interface GeneratedReport {
  filename: string;
  contentType: string;
  buffer: Buffer;
  size: number;
}

// ==========================================
// CSV GENERATOR
// ==========================================
function generateCSV(headers: string[], rows: any[][]): string {
  const escapeCell = (cell: any): string => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('
')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(',')),
  ];

  return lines.join('
');
}

// ==========================================
// EXCEL GENERATOR (Simple HTML table)
// ==========================================
function generateExcel(title: string, headers: string[], rows: any[][]): string {
  const headerRow = headers.map(h => `<th>${h}</th>`).join('');
  const dataRows = rows.map(row => 
    `<tr>${row.map(cell => `<td>${cell ?? ''}</td>`).join('')}</tr>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${dataRows}</tbody>
  </table>
</body>
</html>`;
}

// ==========================================
// PDF GENERATOR (Simple HTML)
// ==========================================
function generatePDF(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #FF7403; border-bottom: 2px solid #FF7403; padding-bottom: 10px; }
    .stat { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: bold; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #FF7403; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${content}
  <div class="footer">
    Generado por Vendy • ${new Date().toLocaleDateString('es-ES')}
  </div>
</body>
</html>`;
}

// ==========================================
// REPORT GENERATOR
// ==========================================
export class ReportGenerator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async generate(options: ReportOptions): Promise<GeneratedReport> {
    switch (options.type) {
      case 'orders':
        return this.generateOrdersReport(options);
      case 'products':
        return this.generateProductsReport(options);
      case 'customers':
        return this.generateCustomersReport(options);
      case 'sales':
        return this.generateSalesReport(options);
      case 'inventory':
        return this.generateInventoryReport(options);
      default:
        throw new Error(`Unknown report type: ${options.type}`);
    }
  }

  private async generateOrdersReport(options: ReportOptions): Promise<GeneratedReport> {
    const orders = await this.prisma.order.findMany({
      where: {
        shopId: options.shopId,
        createdAt: { gte: options.startDate, lte: options.endDate },
        ...(options.filters?.status && { status: options.filters.status }),
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Número', 'Fecha', 'Cliente', 'Productos', 'Total', 'Estado', 'Método de Pago'];
    const rows = orders.map(order => [
      order.orderNumber,
      order.createdAt.toLocaleDateString('es-ES'),
      order.customer.firstName || 'Anónimo',
      order.items.length,
      `$${order.total.toFixed(2)}`,
      order.status,
      order.paymentMethod || 'N/A',
    ]);

    return this.formatOutput('Órdenes', headers, rows, options);
  }

  private async generateProductsReport(options: ReportOptions): Promise<GeneratedReport> {
    const products = await this.prisma.product.findMany({
      where: {
        shopId: options.shopId,
        ...(options.filters?.isActive !== undefined && { isActive: options.filters.isActive }),
      },
      include: {
        orderItems: {
          where: {
            order: {
              createdAt: { gte: options.startDate, lte: options.endDate },
            },
          },
        },
      },
    });

    const headers = ['Nombre', 'Categoría', 'Precio', 'Stock', 'Vendidos', 'Ingresos', 'Estado'];
    const rows = products.map(product => {
      const sold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const revenue = product.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return [
        product.name,
        product.category || 'N/A',
        `$${product.price.toFixed(2)}`,
        product.stock,
        sold,
        `$${revenue.toFixed(2)}`,
        product.isActive ? 'Activo' : 'Inactivo',
      ];
    });

    return this.formatOutput('Productos', headers, rows, options);
  }

  private async generateCustomersReport(options: ReportOptions): Promise<GeneratedReport> {
    const customers = await this.prisma.customer.findMany({
      where: {
        shopId: options.shopId,
        createdAt: { gte: options.startDate, lte: options.endDate },
      },
      include: {
        orders: {
          where: {
            createdAt: { gte: options.startDate, lte: options.endDate },
          },
        },
      },
    });

    const headers = ['Nombre', 'Teléfono', 'Email', 'Órdenes', 'Total Gastado', 'Fecha Registro'];
    const rows = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
      return [
        `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Anónimo',
        customer.phone || 'N/A',
        customer.email || 'N/A',
        customer.orders.length,
        `$${totalSpent.toFixed(2)}`,
        customer.createdAt.toLocaleDateString('es-ES'),
      ];
    });

    return this.formatOutput('Clientes', headers, rows, options);
  }

  private async generateSalesReport(options: ReportOptions): Promise<GeneratedReport> {
    const orders = await this.prisma.order.findMany({
      where: {
        shopId: options.shopId,
        createdAt: { gte: options.startDate, lte: options.endDate },
        status: 'completed',
      },
    });

    // Group by day
    const dailySales = new Map<string, { count: number; revenue: number }>();
    for (const order of orders) {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = dailySales.get(date) || { count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += order.total;
      dailySales.set(date, existing);
    }

    const sortedDates = Array.from(dailySales.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    const headers = ['Fecha', 'Órdenes', 'Ingresos', 'Ticket Promedio'];
    const rows = sortedDates.map(([date, stats]) => [
      date,
      stats.count,
      `$${stats.revenue.toFixed(2)}`,
      `$${(stats.revenue / stats.count).toFixed(2)}`,
    ]);

    // Add summary row
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    rows.push([
      'TOTAL',
      totalOrders,
      `$${totalRevenue.toFixed(2)}`,
      `$${(totalRevenue / totalOrders).toFixed(2)}`,
    ]);

    return this.formatOutput('Ventas', headers, rows, options);
  }

  private async generateInventoryReport(options: ReportOptions): Promise<GeneratedReport> {
    const products = await this.prisma.product.findMany({
      where: { shopId: options.shopId },
      orderBy: { stock: 'asc' },
    });

    const headers = ['Nombre', 'Categoría', 'Stock', 'Estado', 'Última Actualización'];
    const rows = products.map(product => [
      product.name,
      product.category || 'N/A',
      product.stock,
      product.stock === 0 ? '❌ Agotado' : product.stock < 5 ? '⚠️ Stock Bajo' : '✅ OK',
      product.updatedAt.toLocaleDateString('es-ES'),
    ]);

    return this.formatOutput('Inventario', headers, rows, options);
  }

  private formatOutput(
    title: string,
    headers: string[],
    rows: any[][],
    options: ReportOptions
  ): GeneratedReport {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${options.type}_${dateStr}.${options.format === 'excel' ? 'xls' : options.format}`;

    switch (options.format) {
      case 'csv': {
        const csv = generateCSV(headers, rows);
        return {
          filename,
          contentType: 'text/csv; charset=utf-8',
          buffer: Buffer.from('﻿' + csv, 'utf-8'), // BOM for Excel
          size: csv.length,
        };
      }

      case 'excel': {
        const excel = generateExcel(title, headers, rows);
        return {
          filename,
          contentType: 'application/vnd.ms-excel',
          buffer: Buffer.from(excel, 'utf-8'),
          size: excel.length,
        };
      }

      case 'pdf': {
        // For PDF, we generate HTML that can be converted to PDF with a tool like puppeteer
        const tableHeaders = headers.map(h => `<th>${h}</th>`).join('');
        const tableRows = rows.map(row => 
          `<tr>${row.map(cell => `<td>${cell ?? ''}</td>`).join('')}</tr>`
        ).join('');
        
        const summaryStats = rows.length > 0 ? `
          <div class="stat">
            <div class="stat-label">Total Registros</div>
            <div class="stat-value">${rows.length}</div>
          </div>
        ` : '';

        const content = `
          ${summaryStats}
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        `;

        const pdf = generatePDF(title, content);
        return {
          filename,
          contentType: 'text/html', // Would be application/pdf with puppeteer
          buffer: Buffer.from(pdf, 'utf-8'),
          size: pdf.length,
        };
      }

      default:
        throw new Error(`Unknown format: ${options.format}`);
    }
  }
}

// Singleton
let generator: ReportGenerator | null = null;

export function getReportGenerator(prisma: PrismaClient): ReportGenerator {
  if (!generator) {
    generator = new ReportGenerator(prisma);
  }
  return generator;
}
