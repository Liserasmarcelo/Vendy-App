import { PrismaClient } from '@prisma/client';

// ==========================================
// PLAN DEFINITIONS
// ==========================================
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  commissionRate: number;
  features: PlanFeatures;
  isActive: boolean;
  stripePriceId?: string;
}

export interface PlanFeatures {
  maxProducts: number;
  maxOrdersPerMonth: number;
  maxAdmins: number;
  maxStorageMB: number;
  analyticsLevel: 'basic' | 'advanced' | 'full';
  customDomain: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  webhooks: boolean;
}

export interface Subscription {
  id: string;
  shopId: number;
  planId: string;
  status: 'trial' | 'active' | 'cancelled' | 'past_due' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// DEFAULT PLANS
// ==========================================
export const DEFAULT_PLANS: Plan[] = [
  {
    id: 'inicial',
    name: 'Inicial',
    description: 'Perfecto para empezar a vender',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    commissionRate: 0.03,
    features: {
      maxProducts: 50,
      maxOrdersPerMonth: 100,
      maxAdmins: 1,
      maxStorageMB: 500,
      analyticsLevel: 'basic',
      customDomain: false,
      whiteLabel: false,
      prioritySupport: false,
      apiAccess: false,
      webhooks: false,
    },
    isActive: true,
  },
  {
    id: 'crecimiento',
    name: 'Crecimiento',
    description: 'Para tiendas en expansión',
    price: 15,
    currency: 'USD',
    billingCycle: 'monthly',
    commissionRate: 0.02,
    features: {
      maxProducts: 500,
      maxOrdersPerMonth: 1000,
      maxAdmins: 3,
      maxStorageMB: 5000,
      analyticsLevel: 'advanced',
      customDomain: true,
      whiteLabel: false,
      prioritySupport: true,
      apiAccess: true,
      webhooks: true,
    },
    isActive: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Máximo poder para tu negocio',
    price: 49,
    currency: 'USD',
    billingCycle: 'monthly',
    commissionRate: 0.01,
    features: {
      maxProducts: -1, // unlimited
      maxOrdersPerMonth: -1,
      maxAdmins: 10,
      maxStorageMB: 50000,
      analyticsLevel: 'full',
      customDomain: true,
      whiteLabel: true,
      prioritySupport: true,
      apiAccess: true,
      webhooks: true,
    },
    isActive: true,
  },
];

// Yearly plans (2 months free)
export const YEARLY_PLANS: Plan[] = DEFAULT_PLANS.map(plan => ({
  ...plan,
  id: `${plan.id}_yearly`,
  price: Math.round(plan.price * 10), // 12 months - 2 free
  billingCycle: 'yearly' as const,
}));

export const ALL_PLANS = [...DEFAULT_PLANS, ...YEARLY_PLANS];

// ==========================================
// PLAN MANAGER
// ==========================================
export class PlanManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Get all active plans
  async getPlans(): Promise<Plan[]> {
    return ALL_PLANS.filter(plan => plan.isActive);
  }

  // Get plan by ID
  async getPlan(planId: string): Promise<Plan | null> {
    return ALL_PLANS.find(plan => plan.id === planId) || null;
  }

  // Get current subscription for shop
  async getSubscription(shopId: number): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) return null;

    return {
      id: subscription.id,
      shopId: subscription.shopId,
      planId: subscription.planId,
      status: subscription.status as Subscription['status'],
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt || undefined,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      paymentMethod: subscription.paymentMethod || undefined,
      stripeSubscriptionId: subscription.stripeSubscriptionId || undefined,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  // Create new subscription
  async createSubscription(
    shopId: number,
    planId: string,
    options: { trialDays?: number; paymentMethod?: string } = {}
  ): Promise<Subscription> {
    const plan = await this.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    
    if (plan.billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        shopId,
        planId,
        status: options.trialDays ? 'trial' : 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: options.trialDays
          ? new Date(now.getTime() + options.trialDays * 24 * 60 * 60 * 1000)
          : null,
        cancelAtPeriodEnd: false,
        paymentMethod: options.paymentMethod,
      },
    });

    // Update shop plan
    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        planId,
        planUpdatedAt: now,
      },
    });

    return {
      id: subscription.id,
      shopId: subscription.shopId,
      planId: subscription.planId,
      status: subscription.status as Subscription['status'],
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt || undefined,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      paymentMethod: subscription.paymentMethod || undefined,
      stripeSubscriptionId: subscription.stripeSubscriptionId || undefined,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  // Change plan (upgrade/downgrade)
  async changePlan(shopId: number, newPlanId: string): Promise<Subscription> {
    const currentSub = await this.getSubscription(shopId);
    if (!currentSub) {
      throw new Error('No active subscription found');
    }

    const newPlan = await this.getPlan(newPlanId);
    if (!newPlan) {
      throw new Error(`Plan not found: ${newPlanId}`);
    }

    const currentPlan = await this.getPlan(currentSub.planId);
    const isUpgrade = currentPlan && newPlan.price > currentPlan.price;

    // Update subscription
    const now = new Date();
    const updated = await this.prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        planId: newPlanId,
        status: 'active',
        updatedAt: now,
        ...(isUpgrade && {
          // Prorate if upgrading
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        }),
      },
    });

    // Update shop
    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        planId: newPlanId,
        planUpdatedAt: now,
      },
    });

    return {
      id: updated.id,
      shopId: updated.shopId,
      planId: updated.planId,
      status: updated.status as Subscription['status'],
      currentPeriodStart: updated.currentPeriodStart,
      currentPeriodEnd: updated.currentPeriodEnd,
      trialEndsAt: updated.trialEndsAt || undefined,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      paymentMethod: updated.paymentMethod || undefined,
      stripeSubscriptionId: updated.stripeSubscriptionId || undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Cancel subscription
  async cancelSubscription(shopId: number, atPeriodEnd: boolean = true): Promise<Subscription> {
    const currentSub = await this.getSubscription(shopId);
    if (!currentSub) {
      throw new Error('No active subscription found');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        cancelAtPeriodEnd: atPeriodEnd,
        status: atPeriodEnd ? currentSub.status : 'cancelled',
        updatedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      shopId: updated.shopId,
      planId: updated.planId,
      status: updated.status as Subscription['status'],
      currentPeriodStart: updated.currentPeriodStart,
      currentPeriodEnd: updated.currentPeriodEnd,
      trialEndsAt: updated.trialEndsAt || undefined,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      paymentMethod: updated.paymentMethod || undefined,
      stripeSubscriptionId: updated.stripeSubscriptionId || undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Check if feature is available
  async checkFeature(shopId: number, feature: keyof PlanFeatures): Promise<boolean> {
    const subscription = await this.getSubscription(shopId);
    if (!subscription) return false;

    const plan = await this.getPlan(subscription.planId);
    if (!plan) return false;

    // Check if subscription is active or in trial
    if (subscription.status !== 'active' && subscription.status !== 'trial') {
      return false;
    }

    // Check trial expiration
    if (subscription.status === 'trial' && subscription.trialEndsAt) {
      if (new Date() > subscription.trialEndsAt) {
        return false;
      }
    }

    return plan.features[feature] as boolean;
  }

  // Check usage limits
  async checkLimit(shopId: number, limitType: 'products' | 'orders' | 'admins' | 'storage'): Promise<{ current: number; limit: number; exceeded: boolean }> {
    const subscription = await this.getSubscription(shopId);
    if (!subscription) {
      return { current: 0, limit: 0, exceeded: true };
    }

    const plan = await this.getPlan(subscription.planId);
    if (!plan) {
      return { current: 0, limit: 0, exceeded: true };
    }

    let current = 0;
    let limit = 0;

    switch (limitType) {
      case 'products':
        current = await this.prisma.product.count({ where: { shopId } });
        limit = plan.features.maxProducts;
        break;
      case 'orders':
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        current = await this.prisma.order.count({
          where: {
            shopId,
            createdAt: { gte: monthStart },
          },
        });
        limit = plan.features.maxOrdersPerMonth;
        break;
      case 'admins':
        current = await this.prisma.shopAdmin.count({ where: { shopId } });
        limit = plan.features.maxAdmins;
        break;
      case 'storage':
        // Simplified - would need actual storage calculation
        current = 0;
        limit = plan.features.maxStorageMB;
        break;
    }

    // -1 means unlimited
    const exceeded = limit !== -1 && current >= limit;

    return { current, limit, exceeded };
  }

  // Get subscription status with details
  async getSubscriptionStatus(shopId: number): Promise<{
    subscription: Subscription | null;
    plan: Plan | null;
    isActive: boolean;
    daysUntilExpiry: number;
    features: PlanFeatures | null;
  }> {
    const subscription = await this.getSubscription(shopId);
    if (!subscription) {
      return {
        subscription: null,
        plan: null,
        isActive: false,
        daysUntilExpiry: 0,
        features: null,
      };
    }

    const plan = await this.getPlan(subscription.planId);
    const now = new Date();
    const periodEnd = subscription.currentPeriodEnd;
    const daysUntilExpiry = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const isActive = subscription.status === 'active' ||
      (subscription.status === 'trial' && subscription.trialEndsAt && now < subscription.trialEndsAt);

    return {
      subscription,
      plan,
      isActive,
      daysUntilExpiry,
      features: plan?.features || null,
    };
  }
}

// Singleton
let planManager: PlanManager | null = null;

export function getPlanManager(prisma: PrismaClient): PlanManager {
  if (!planManager) {
    planManager = new PlanManager(prisma);
  }
  return planManager;
}
