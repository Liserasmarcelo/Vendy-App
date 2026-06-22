import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportGenerator, getReportGenerator } from './reportGenerator';

// Mock Prisma
const mockPrisma = {
  order: {
    findMany: vi.fn().mockResolvedValue([
      {
        orderNumber: 'ORD-001',
        createdAt: new Date('2024-06-01'),
        total: 199.99,
        status: 'completed',
        paymentMethod: 'stripe',
        customer: { firstName: 'Juan', lastName: 'Pérez' },
        items: [
          { product: { name: 'iPhone' }, quantity: 1, price: 199.99 },
        ],
      },
    ]),
  },
  product: {
    findMany: vi.fn().mockResolvedValue([
      {
        name: 'iPhone 15 Pro',
        category: 'Electrónica',
        price: 999,
        stock: 10,
        isActive: true,
        orderItems: [{ quantity: 5, price: 999 }],
        updatedAt: new Date('2024-06-01'),
      },
    ]),
  },
  customer: {
    findMany: vi.fn().mockResolvedValue([
      {
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '+595 981 123456',
        email: 'juan@test.com',
        createdAt: new Date('2024-06-01'),
        orders: [{ total: 199.99 }, { total: 299.99 }],
      },
    ]),
  },
} as any;

describe('ReportGenerator', () => {
  let generator: ReportGenerator;

  beforeEach(() => {
    generator = new ReportGenerator(mockPrisma);
    vi.clearAllMocks();
  });

  it('generates orders CSV report', async () => {
    const report = await generator.generate({
      shopId: 1,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-30'),
      format: 'csv',
      type: 'orders',
    });

    expect(report.filename).toContain('orders');
    expect(report.filename).toContain('.csv');
    expect(report.contentType).toContain('csv');
    expect(report.buffer).toBeInstanceOf(Buffer);
    expect(report.size).toBeGreaterThan(0);
  });

  it('generates products Excel report', async () => {
    const report = await generator.generate({
      shopId: 1,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-30'),
      format: 'excel',
      type: 'products',
    });

    expect(report.filename).toContain('products');
    expect(report.filename).toContain('.xls');
    expect(report.contentType).toContain('excel');
  });

  it('generates customers PDF report', async () => {
    const report = await generator.generate({
      shopId: 1,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-30'),
      format: 'pdf',
      type: 'customers',
    });

    expect(report.filename).toContain('customers');
    expect(report.contentType).toContain('html'); // Would be pdf with puppeteer
  });

  it('generates sales report with summary', async () => {
    const report = await generator.generate({
      shopId: 1,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-30'),
      format: 'csv',
      type: 'sales',
    });

    const content = report.buffer.toString('utf-8');
    expect(content).toContain('Fecha');
    expect(content).toContain('Órdenes');
    expect(content).toContain('Ingresos');
    expect(content).toContain('TOTAL');
  });

  it('generates inventory report with status', async () => {
    const report = await generator.generate({
      shopId: 1,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-30'),
      format: 'csv',
      type: 'inventory',
    });

    const content = report.buffer.toString('utf-8');
    expect(content).toContain('Stock');
    expect(content).toContain('Estado');
  });

  it('applies filters to orders', async () => {
    await generator.generate({
      shopId: 1,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-30'),
      format: 'csv',
      type: 'orders',
      filters: { status: 'completed' },
    });

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'completed',
        }),
      })
    );
  });

  it('throws on unknown report type', async () => {
    await expect(
      generator.generate({
        shopId: 1,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
        format: 'csv',
        type: 'unknown' as any,
      })
    ).rejects.toThrow('Unknown report type');
  });

  it('throws on unknown format', async () => {
    await expect(
      generator.generate({
        shopId: 1,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
        format: 'unknown' as any,
        type: 'orders',
      })
    ).rejects.toThrow('Unknown format');
  });
});

describe('getReportGenerator', () => {
  it('returns singleton instance', () => {
    const gen1 = getReportGenerator(mockPrisma);
    const gen2 = getReportGenerator(mockPrisma);
    expect(gen1).toBe(gen2);
  });
});
