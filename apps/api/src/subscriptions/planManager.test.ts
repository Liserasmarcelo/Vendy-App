import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanManager, getPlanManager, DEFAULT_PLANS } from './planManager';

// Mock Prisma
const mockPrisma = {
  subscription: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  shop: {
    update: vi.fn(),
  },
  product: {
    count: vi.fn(),
  },
  order: {
    count: vi.fn(),
  },
  shopAdmin: {
    count: vi.fn(),
  },
} as any;

describe('PlanManager', () => {
  let manager: PlanManager;

  beforeEach(() => {
    manager = new PlanManager(mockPrisma);
    vi.clearAllMocks();
  });

  it('gets all active plans', async () => {
    const plans = await manager.getPlans();
    expect(plans.length).toBeGreaterThan(0);
    expect(plans.some(p => p.id === 'inicial')).toBe(true);
    expect(plans.some(p => p.id === 'crecimiento')).toBe(true);
    expect(plans.some(p => p.id === 'pro')).toBe(true);
  });

  it('gets plan by ID', async () => {
    const plan = await manager.getPlan('inicial');
    expect(plan).toBeDefined();
    expect(plan?.name).toBe('Inicial');
    expect(plan?.price).toBe(0);
    expect(plan?.commissionRate).toBe(0.03);
  });

  it('returns null for unknown plan', async () => {
    const plan = await manager.getPlan('unknown');
    expect(plan).toBeNull();
  });

  it('gets subscription for shop', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'inicial',
      status: 'active',
      currentPeriodStart: new Date('2024-06-01'),
      currentPeriodEnd: new Date('2024-07-01'),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const subscription = await manager.getSubscription(1);

    expect(subscription).toBeDefined();
    expect(subscription?.planId).toBe('inicial');
    expect(subscription?.status).toBe('active');
  });

  it('creates subscription', async () => {
    mockPrisma.subscription.create.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'crecimiento',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const subscription = await manager.createSubscription(1, 'crecimiento');

    expect(subscription.planId).toBe('crecimiento');
    expect(subscription.status).toBe('active');
    expect(mockPrisma.shop.update).toHaveBeenCalled();
  });

  it('creates subscription with trial', async () => {
    mockPrisma.subscription.create.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'pro',
      status: 'trial',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const subscription = await manager.createSubscription(1, 'pro', { trialDays: 14 });

    expect(subscription.status).toBe('trial');
    expect(subscription.trialEndsAt).toBeDefined();
  });

  it('changes plan (upgrade)', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'inicial',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    });

    mockPrisma.subscription.update.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'crecimiento',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const subscription = await manager.changePlan(1, 'crecimiento');

    expect(subscription.planId).toBe('crecimiento');
    expect(mockPrisma.shop.update).toHaveBeenCalled();
  });

  it('cancels subscription at period end', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'crecimiento',
      status: 'active',
      cancelAtPeriodEnd: false,
    });

    mockPrisma.subscription.update.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'crecimiento',
      status: 'active',
      cancelAtPeriodEnd: true,
    });

    const subscription = await manager.cancelSubscription(1, true);

    expect(subscription.cancelAtPeriodEnd).toBe(true);
    expect(subscription.status).toBe('active'); // Still active until period end
  });

  it('cancels subscription immediately', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'crecimiento',
      status: 'active',
      cancelAtPeriodEnd: false,
    });

    mockPrisma.subscription.update.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'crecimiento',
      status: 'cancelled',
      cancelAtPeriodEnd: false,
    });

    const subscription = await manager.cancelSubscription(1, false);

    expect(subscription.status).toBe('cancelled');
  });

  it('checks feature availability', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'crecimiento',
      status: 'active',
    });

    const customDomain = await manager.checkFeature(1, 'customDomain');
    expect(customDomain).toBe(true);

    const whiteLabel = await manager.checkFeature(1, 'whiteLabel');
    expect(whiteLabel).toBe(false); // Not available in crecimiento
  });

  it('checks usage limits', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'inicial',
      status: 'active',
    });

    mockPrisma.product.count.mockResolvedValue(45);

    const limit = await manager.checkLimit(1, 'products');

    expect(limit.current).toBe(45);
    expect(limit.limit).toBe(50);
    expect(limit.exceeded).toBe(false);
  });

  it('detects exceeded limits', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'inicial',
      status: 'active',
    });

    mockPrisma.product.count.mockResolvedValue(50);

    const limit = await manager.checkLimit(1, 'products');

    expect(limit.current).toBe(50);
    expect(limit.limit).toBe(50);
    expect(limit.exceeded).toBe(true);
  });

  it('handles unlimited plans', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'pro',
      status: 'active',
    });

    mockPrisma.product.count.mockResolvedValue(1000);

    const limit = await manager.checkLimit(1, 'products');

    expect(limit.limit).toBe(-1); // Unlimited
    expect(limit.exceeded).toBe(false);
  });

  it('gets subscription status', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_1',
      shopId: 1,
      planId: 'crecimiento',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    });

    const status = await manager.getSubscriptionStatus(1);

    expect(status.isActive).toBe(true);
    expect(status.daysUntilExpiry).toBe(20);
    expect(status.plan).toBeDefined();
    expect(status.features).toBeDefined();
  });

  it('throws on unknown plan creation', async () => {
    await expect(
      manager.createSubscription(1, 'unknown')
    ).rejects.toThrow('Plan not found');
  });

  it('throws when changing plan without subscription', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);

    await expect(
      manager.changePlan(1, 'pro')
    ).rejects.toThrow('No active subscription found');
  });
});

describe('DEFAULT_PLANS', () => {
  it('has correct plan structure', () => {
    expect(DEFAULT_PLANS).toHaveLength(3);

    const inicial = DEFAULT_PLANS.find(p => p.id === 'inicial');
    expect(inicial?.price).toBe(0);
    expect(inicial?.features.maxProducts).toBe(50);
    expect(inicial?.features.customDomain).toBe(false);

    const pro = DEFAULT_PLANS.find(p => p.id === 'pro');
    expect(pro?.price).toBe(49);
    expect(pro?.features.maxProducts).toBe(-1);
    expect(pro?.features.whiteLabel).toBe(true);
  });
});

describe('getPlanManager', () => {
  it('returns singleton instance', () => {
    const manager1 = getPlanManager(mockPrisma);
    const manager2 = getPlanManager(mockPrisma);
    expect(manager1).toBe(manager2);
  });
});
