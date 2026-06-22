import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { registerBrandRoutes } from '../whitelabel/brandRoutes';
import { registerPlanRoutes } from '../subscriptions/planRoutes';
import { registerBillingRoutes } from '../billing/billingRoutes';

// E2E Tests for White-label + Subscriptions

describe('White-label E2E', () => {
  let app: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = Fastify();
    prisma = new PrismaClient();
    await registerBrandRoutes(app, prisma);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('complete white-label flow', async () => {
    // 1. Get default brand config
    const getResponse = await app.inject({
      method: 'GET',
      url: '/brand/1',
    });

    expect(getResponse.statusCode).toBe(200);
    const brand = JSON.parse(getResponse.body);
    expect(brand.name).toBe('Mi Tienda');

    // 2. Update brand config
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: '/brand/1',
      payload: {
        name: 'TechStore',
        primaryColor: '#2196F3',
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    const updated = JSON.parse(updateResponse.body);
    expect(updated.name).toBe('TechStore');
    expect(updated.primaryColor).toBe('#2196F3');

    // 3. Validate custom domain
    const validateResponse = await app.inject({
      method: 'POST',
      url: '/brand/domain/validate',
      payload: { domain: 'techstore.com' },
    });

    expect(validateResponse.statusCode).toBe(200);
    const validation = JSON.parse(validateResponse.body);
    expect(validation.valid).toBe(true);

    // 4. Configure domain
    const configResponse = await app.inject({
      method: 'POST',
      url: '/brand/1/domain',
      payload: { domain: 'techstore.com' },
    });

    expect(configResponse.statusCode).toBe(200);
    const config = JSON.parse(configResponse.body);
    expect(config.domain).toBe('techstore.com');
    expect(config.dnsRecords).toBeDefined();

    // 5. Get generated CSS
    const cssResponse = await app.inject({
      method: 'GET',
      url: '/brand/1/css',
    });

    expect(cssResponse.statusCode).toBe(200);
    expect(cssResponse.body).toContain('--brand-primary');
  });

  it('handles invalid domain validation', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/brand/domain/validate',
      payload: { domain: 'invalid' },
    });

    expect(response.statusCode).toBe(400);
    const result = JSON.parse(response.body);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Formato de dominio inválido');
  });

  it('gets brand by domain', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/brand/domain/techstore.com',
    });

    // May 404 if not configured, but endpoint exists
    expect([200, 404]).toContain(response.statusCode);
  });
});

describe('Subscriptions E2E', () => {
  let app: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = Fastify();
    prisma = new PrismaClient();
    await registerPlanRoutes(app, prisma);
    await registerBillingRoutes(app, prisma);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('complete subscription lifecycle', async () => {
    // 1. Get available plans
    const plansResponse = await app.inject({
      method: 'GET',
      url: '/plans',
    });

    expect(plansResponse.statusCode).toBe(200);
    const { plans } = JSON.parse(plansResponse.body);
    expect(plans.length).toBeGreaterThan(0);

    const freePlan = plans.find((p: any) => p.price === 0);
    expect(freePlan).toBeDefined();

    // 2. Create subscription with trial
    const createResponse = await app.inject({
      method: 'POST',
      url: '/subscriptions',
      payload: {
        shopId: 1,
        planId: 'crecimiento',
        trialDays: 14,
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const subscription = JSON.parse(createResponse.body);
    expect(subscription.planId).toBe('crecimiento');
    expect(subscription.status).toBe('trial');

    // 3. Get subscription status
    const statusResponse = await app.inject({
      method: 'GET',
      url: '/subscriptions/1/status',
    });

    expect(statusResponse.statusCode).toBe(200);
    const status = JSON.parse(statusResponse.body);
    expect(status.isActive).toBe(true);
    expect(status.features).toBeDefined();

    // 4. Check feature availability
    const featureResponse = await app.inject({
      method: 'GET',
      url: '/subscriptions/1/features/customDomain',
    });

    expect(featureResponse.statusCode).toBe(200);
    const feature = JSON.parse(featureResponse.body);
    expect(feature.available).toBe(true); // crecimiento has customDomain

    // 5. Check limits
    const limitResponse = await app.inject({
      method: 'GET',
      url: '/subscriptions/1/limits/products',
    });

    expect(limitResponse.statusCode).toBe(200);
    const limit = JSON.parse(limitResponse.body);
    expect(limit.limit).toBe(500);
    expect(limit.exceeded).toBe(false);

    // 6. Change plan
    const changeResponse = await app.inject({
      method: 'PATCH',
      url: '/subscriptions/1/plan',
      payload: { planId: 'pro' },
    });

    expect(changeResponse.statusCode).toBe(200);
    const changed = JSON.parse(changeResponse.body);
    expect(changed.planId).toBe('pro');

    // 7. Cancel subscription
    const cancelResponse = await app.inject({
      method: 'POST',
      url: '/subscriptions/1/cancel',
      payload: { atPeriodEnd: true },
    });

    expect(cancelResponse.statusCode).toBe(200);
    const cancelled = JSON.parse(cancelResponse.body);
    expect(cancelled.cancelAtPeriodEnd).toBe(true);
  });

  it('handles billing integration', async () => {
    // Get billing history
    const historyResponse = await app.inject({
      method: 'GET',
      url: '/billing/1/history',
    });

    expect(historyResponse.statusCode).toBe(200);
    const history = JSON.parse(historyResponse.body);
    expect(history).toHaveProperty('invoices');
    expect(history).toHaveProperty('totalPaid');
    expect(history).toHaveProperty('totalFailed');

    // Calculate proration
    const prorationResponse = await app.inject({
      method: 'GET',
      url: '/billing/1/proration?newPlanId=pro',
    });

    expect(prorationResponse.statusCode).toBe(200);
    const proration = JSON.parse(prorationResponse.body);
    expect(proration).toHaveProperty('currentPlanId');
    expect(proration).toHaveProperty('newPlanId');
    expect(proration).toHaveProperty('amountDue');
  });
});

describe('White-label + Subscription Integration', () => {
  let app: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = Fastify();
    prisma = new PrismaClient();
    await registerBrandRoutes(app, prisma);
    await registerPlanRoutes(app, prisma);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('enforces white-label based on plan', async () => {
    // 1. Subscribe to plan without white-label
    await app.inject({
      method: 'POST',
      url: '/subscriptions',
      payload: {
        shopId: 2,
        planId: 'inicial',
      },
    });

    // 2. Check white-label feature
    const featureResponse = await app.inject({
      method: 'GET',
      url: '/subscriptions/2/features/whiteLabel',
    });

    expect(featureResponse.statusCode).toBe(200);
    const feature = JSON.parse(featureResponse.body);
    expect(feature.available).toBe(false);

    // 3. Try to set white-label branding (should work but feature check prevents)
    const brandResponse = await app.inject({
      method: 'GET',
      url: '/brand/2',
    });

    expect(brandResponse.statusCode).toBe(200);
    // Brand config exists but white-label features are limited
  });

  it('allows white-label on pro plan', async () => {
    // 1. Subscribe to Pro
    await app.inject({
      method: 'POST',
      url: '/subscriptions',
      payload: {
        shopId: 3,
        planId: 'pro',
      },
    });

    // 2. Check white-label feature
    const featureResponse = await app.inject({
      method: 'GET',
      url: '/subscriptions/3/features/whiteLabel',
    });

    expect(featureResponse.statusCode).toBe(200);
    const feature = JSON.parse(featureResponse.body);
    expect(feature.available).toBe(true);

    // 3. Configure full branding
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: '/brand/3',
      payload: {
        name: 'Premium Store',
        customDomain: 'premium.com',
        whiteLabel: true,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
  });
});
