import { PrismaClient } from '@prisma/client';

// ==========================================
// BILLING TYPES
// ==========================================
export interface Invoice {
  id: string;
  shopId: number;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  description: string;
  periodStart: Date;
  periodEnd: Date;
  paidAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
}

export interface PaymentMethod {
  id: string;
  shopId: number;
  type: 'card' | 'bank_transfer' | 'crypto';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  stripePaymentMethodId?: string;
  createdAt: Date;
}

export interface BillingHistory {
  invoices: Invoice[];
  totalPaid: number;
  totalFailed: number;
  currentBalance: number;
}

// ==========================================
// BILLING MANAGER
// ==========================================
export class BillingManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create invoice
  async createInvoice(data: {
    shopId: number;
    subscriptionId: string;
    amount: number;
    currency: string;
    description: string;
    periodStart: Date;
    periodEnd: Date;
    stripeInvoiceId?: string;
  }): Promise<Invoice> {
    const invoice = await this.prisma.invoice.create({
      data: {
        shopId: data.shopId,
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        currency: data.currency,
        status: 'pending',
        description: data.description,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        stripeInvoiceId: data.stripeInvoiceId,
      },
    });

    return this.mapInvoice(invoice);
  }

  // Mark invoice as paid
  async markInvoicePaid(invoiceId: string, stripePaymentIntentId?: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        stripePaymentIntentId,
      },
    });

    return this.mapInvoice(invoice);
  }

  // Mark invoice as failed
  async markInvoiceFailed(invoiceId: string, reason: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'failed',
        failedAt: new Date(),
        failureReason: reason,
      },
    });

    return this.mapInvoice(invoice);
  }

  // Get invoice by ID
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    return invoice ? this.mapInvoice(invoice) : null;
  }

  // Get invoices for shop
  async getInvoices(shopId: number, options?: { limit?: number; offset?: number; status?: string }): Promise<Invoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        shopId,
        ...(options?.status && { status: options.status }),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return invoices.map(this.mapInvoice);
  }

  // Get billing history
  async getBillingHistory(shopId: number): Promise<BillingHistory> {
    const invoices = await this.getInvoices(shopId);

    const paid = invoices.filter(i => i.status === 'paid');
    const failed = invoices.filter(i => i.status === 'failed');

    const totalPaid = paid.reduce((sum, i) => sum + i.amount, 0);
    const totalFailed = failed.reduce((sum, i) => sum + i.amount, 0);

    return {
      invoices,
      totalPaid,
      totalFailed,
      currentBalance: totalPaid - totalFailed,
    };
  }

  // Add payment method
  async addPaymentMethod(data: {
    shopId: number;
    type: 'card' | 'bank_transfer' | 'crypto';
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    stripePaymentMethodId?: string;
  }): Promise<PaymentMethod> {
    // If this is the first payment method, make it default
    const existingCount = await this.prisma.paymentMethod.count({
      where: { shopId: data.shopId },
    });

    const method = await this.prisma.paymentMethod.create({
      data: {
        shopId: data.shopId,
        type: data.type,
        last4: data.last4,
        brand: data.brand,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        isDefault: existingCount === 0,
        stripePaymentMethodId: data.stripePaymentMethodId,
      },
    });

    return this.mapPaymentMethod(method);
  }

  // Get payment methods
  async getPaymentMethods(shopId: number): Promise<PaymentMethod[]> {
    const methods = await this.prisma.paymentMethod.findMany({
      where: { shopId },
      orderBy: { isDefault: 'desc' },
    });

    return methods.map(this.mapPaymentMethod);
  }

  // Set default payment method
  async setDefaultPaymentMethod(shopId: number, methodId: string): Promise<void> {
    // Unset current default
    await this.prisma.paymentMethod.updateMany({
      where: { shopId, isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    await this.prisma.paymentMethod.update({
      where: { id: methodId },
      data: { isDefault: true },
    });
  }

  // Remove payment method
  async removePaymentMethod(methodId: string): Promise<void> {
    await this.prisma.paymentMethod.delete({
      where: { id: methodId },
    });
  }

  // Generate next invoice
  async generateNextInvoice(shopId: number): Promise<Invoice> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: subscription.planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    
    if (plan.billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return this.createInvoice({
      shopId,
      subscriptionId: subscription.id,
      amount: plan.price,
      currency: plan.currency,
      description: `Suscripción ${plan.name} - ${plan.billingCycle === 'yearly' ? 'Anual' : 'Mensual'}`,
      periodStart: now,
      periodEnd,
    });
  }

  // Calculate proration for plan change
  async calculateProration(shopId: number, newPlanId: string): Promise<{
    currentPlanId: string;
    newPlanId: string;
    daysRemaining: number;
    daysInPeriod: number;
    unusedAmount: number;
    newPlanAmount: number;
    amountDue: number;
  }> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    const currentPlan = await this.prisma.plan.findUnique({
      where: { id: subscription.planId },
    });

    const newPlan = await this.prisma.plan.findUnique({
      where: { id: newPlanId },
    });

    if (!currentPlan || !newPlan) {
      throw new Error('Plan not found');
    }

    const now = new Date();
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const dailyRate = currentPlan.price / daysInPeriod;
    const unusedAmount = dailyRate * daysRemaining;

    const newPlanDailyRate = newPlan.price / daysInPeriod;
    const newPlanAmount = newPlanDailyRate * daysRemaining;

    const amountDue = Math.max(0, newPlanAmount - unusedAmount);

    return {
      currentPlanId: currentPlan.id,
      newPlanId: newPlan.id,
      daysRemaining,
      daysInPeriod,
      unusedAmount: Math.round(unusedAmount * 100) / 100,
      newPlanAmount: Math.round(newPlanAmount * 100) / 100,
      amountDue: Math.round(amountDue * 100) / 100,
    };
  }

  // Private mappers
  private mapInvoice(invoice: any): Invoice {
    return {
      id: invoice.id,
      shopId: invoice.shopId,
      subscriptionId: invoice.subscriptionId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
      description: invoice.description,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      paidAt: invoice.paidAt || undefined,
      failedAt: invoice.failedAt || undefined,
      failureReason: invoice.failureReason || undefined,
      stripeInvoiceId: invoice.stripeInvoiceId || undefined,
      stripePaymentIntentId: invoice.stripePaymentIntentId || undefined,
      createdAt: invoice.createdAt,
    };
  }

  private mapPaymentMethod(method: any): PaymentMethod {
    return {
      id: method.id,
      shopId: method.shopId,
      type: method.type,
      last4: method.last4 || undefined,
      brand: method.brand || undefined,
      expiryMonth: method.expiryMonth || undefined,
      expiryYear: method.expiryYear || undefined,
      isDefault: method.isDefault,
      stripePaymentMethodId: method.stripePaymentMethodId || undefined,
      createdAt: method.createdAt,
    };
  }
}

// Singleton
let billingManager: BillingManager | null = null;

export function getBillingManager(prisma: PrismaClient): BillingManager {
  if (!billingManager) {
    billingManager = new BillingManager(prisma);
  }
  return billingManager;
}
