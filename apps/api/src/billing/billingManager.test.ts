import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingManager, getBillingManager } from './billingManager';

// Mock Prisma
const mockPrisma = {
  invoice: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  paymentMethod: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  subscription: {
    findFirst: vi.fn(),
  },
  plan: {
    findUnique: vi.fn(),
  },
} as any;

describe('BillingManager', () => {
  let manager: BillingManager;

  beforeEach(() => {
    manager = new BillingManager(mockPrisma);
    vi.clearAllMocks();
  });

  it('creates invoice', async () => {
    mockPrisma.invoice.create.mockResolvedValue({
      id: 'inv_1',
      shopId: 1,
      subscriptionId: 'sub_1',
      amount: 15,
      currency: 'USD',
      status: 'pending',
      description: 'Test invoice',
      periodStart: new Date('2024-06-01'),
      periodEnd: new Date('2024-07-01'),
      createdAt: new Date(),
    });

    const invoice = await manager.createInvoice({
      shopId: 1,
      subscriptionId: 'sub_1',
      amount: 15,
      currency: 'USD',
      description: 'Test invoice',
      periodStart: new Date('2024-06-01'),
      periodEnd: new Date('2024-07-01'),
    });

    expect(invoice.id).toBe('inv_1');
    expect(invoice.status).toBe('pending');
    expect(invoice.amount).toBe(15);
  });

  it('marks invoice as paid', async () => {
    mockPrisma.invoice.update.mockResolvedValue({
      id: 'inv_1',
      status: 'paid',
      paidAt: new Date(),
      stripePaymentIntentId: 'pi_1',
    });

    const invoice = await manager.markInvoicePaid('inv_1', 'pi_1');

    expect(invoice.status).toBe('paid');
    expect(invoice.stripePaymentIntentId).toBe('pi_1');
  });

  it('marks invoice as failed', async () => {
    mockPrisma.invoice.update.mockResolvedValue({
      id: 'inv_1',
      status: 'failed',
      failedAt: new Date(),
      failureReason: 'Card declined',
    });

    const invoice = await manager.markInvoiceFailed('inv_1', 'Card declined');

    expect(invoice.status).toBe('failed');
    expect(invoice.failureReason).toBe('Card declined');
  });

  it('gets invoices for shop', async () => {
    mockPrisma.invoice.findMany.mockResolvedValue([
      {
        id: 'inv_1',
        shopId: 1,
        amount: 15,
        status: 'paid',
        createdAt: new Date(),
      },
      {
        id: 'inv_2',
        shopId: 1,
        amount: 15,
        status: 'pending',
        createdAt: new Date(),
      },
    ]);

    const invoices = await manager.getInvoices(1);

    expect(invoices).toHaveLength(2);
    expect(invoices[0].status).toBe('paid');
    expect(invoices[1].status).toBe('pending');
  });

  it('filters invoices by status', async () => {
    mockPrisma.invoice.findMany.mockResolvedValue([
      {
        id: 'inv_1',
        shopId: 1,
        amount: 15,
        status: 'paid',
        createdAt: new Date(),
      },
    ]);

    const invoices = await manager.getInvoices(1, { status: 'paid' });

    expect(invoices).toHaveLength(1);
    expect(invoices[0].status).toBe('paid');
  });

  it('gets billing history', async () => {
    mockPrisma.invoice.findMany.mockResolvedValue([
      {
        id: 'inv_1',
        shopId: 1,
        amount: 15,
        status: 'paid',
        createdAt: new Date(),
      },
      {
        id: 'inv_2',
        shopId: 1,
        amount: 15,
        status: 'failed',
        createdAt: new Date(),
      },
    ]);

    const history = await manager.getBillingHistory(1);

    expect(history.totalPaid).toBe(15);
    expect(history.totalFailed).toBe(15);
    expect(history.currentBalance).toBe(0);
  });

  it('adds payment method', async () => {
    mockPrisma.paymentMethod.count.mockResolvedValue(0);
    mockPrisma.paymentMethod.create.mockResolvedValue({
      id: 'pm_1',
      shopId: 1,
      type: 'card',
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
      createdAt: new Date(),
    });

    const method = await manager.addPaymentMethod({
      shopId: 1,
      type: 'card',
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2025,
    });

    expect(method.type).toBe('card');
    expect(method.last4).toBe('4242');
    expect(method.isDefault).toBe(true);
  });

  it('sets first payment method as default', async () => {
    mockPrisma.paymentMethod.count.mockResolvedValue(0);
    mockPrisma.paymentMethod.create.mockResolvedValue({
      id: 'pm_1',
      shopId: 1,
      type: 'card',
      isDefault: true,
      createdAt: new Date(),
    });

    const method = await manager.addPaymentMethod({
      shopId: 1,
      type: 'card',
    });

    expect(method.isDefault).toBe(true);
  });

  it('calculates proration', async () => {
    const now = new Date();
    const periodStart = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'inicial',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    });

    mockPrisma.plan.findUnique.mockImplementation((args: any) => {
      if (args.where.id === 'inicial') {
        return Promise.resolve({ id: 'inicial', price: 0, billingCycle: 'monthly' });
      }
      return Promise.resolve({ id: 'crecimiento', price: 15, billingCycle: 'monthly' });
    });

    const proration = await manager.calculateProration(1, 'crecimiento');

    expect(proration.currentPlanId).toBe('inicial');
    expect(proration.newPlanId).toBe('crecimiento');
    expect(proration.daysRemaining).toBeGreaterThan(0);
    expect(proration.amountDue).toBeGreaterThanOrEqual(0);
  });

  it('throws on proration without subscription', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);

    await expect(
      manager.calculateProration(1, 'pro')
    ).rejects.toThrow('No subscription found');
  });

  it('generates next invoice', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'crecimiento',
    });

    mockPrisma.plan.findUnique.mockResolvedValue({
      id: 'crecimiento',
      price: 15,
      currency: 'USD',
      billingCycle: 'monthly',
      name: 'Crecimiento',
    });

    mockPrisma.invoice.create.mockResolvedValue({
      id: 'inv_new',
      shopId: 1,
      subscriptionId: 'sub_1',
      amount: 15,
      currency: 'USD',
      status: 'pending',
      description: 'Suscripción Crecimiento - Mensual',
      periodStart: new Date(),
      periodEnd: new Date(),
      createdAt: new Date(),
    });

    const invoice = await manager.generateNextInvoice(1);

    expect(invoice.amount).toBe(15);
    expect(invoice.description).toContain('Crecimiento');
  });
});

describe('getBillingManager', () => {
  it('returns singleton instance', () => {
    const manager1 = getBillingManager(mockPrisma);
    const manager2 = getBillingManager(mockPrisma);
    expect(manager1).toBe(manager2);
  });
});
