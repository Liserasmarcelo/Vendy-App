import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  rateLimitByTelegramId,
  rateLimitByShop,
  rateLimitCombined,
  rateLimitByTelegramIdHandler,
  rateLimitByShopHandler,
  rateLimitCombinedHandler,
  PLAN_LIMITS,
  checkPlanLimits,
} from './rateLimit';

// Mock de Redis/cache
vi.mock('../lib/cache', () => ({
  checkShopRateLimit: vi.fn(),
}));

import { checkShopRateLimit } from '../lib/cache';

const mockCheckShopRateLimit = checkShopRateLimit as ReturnType<typeof vi.fn>;

describe('rateLimitByTelegramId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe permitir request cuando está dentro del límite', async () => {
    mockCheckShopRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });

    const request = {
      headers: {
        'x-telegram-init-data': 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%7D&auth_date=1750243200&hash=abc123',
      },
      ip: '127.0.0.1',
    } as unknown as FastifyRequest;

    const reply = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      sent: false,
    } as unknown as FastifyReply;

    await rateLimitByTelegramId(request, reply, 'default');

    expect(reply.sent).toBe(false);
    expect(reply.header).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
    expect(reply.header).toHaveBeenCalledWith('X-RateLimit-Remaining', 99);
  });

  it('debe rechazar request cuando excede el límite', async () => {
    mockCheckShopRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });

    const request = {
      headers: {
        'x-telegram-init-data': 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%7D&auth_date=1750243200&hash=abc123',
      },
      ip: '127.0.0.1',
    } as unknown as FastifyRequest;

    const reply = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      sent: false,
    } as unknown as FastifyReply;

    await rateLimitByTelegramId(request, reply, 'default');

    expect(reply.status).toHaveBeenCalledWith(429);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Too Many Requests',
      })
    );
  });

  it('debe usar IP como fallback cuando no hay telegram_id', async () => {
    mockCheckShopRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 49,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });

    const request = {
      headers: {},
      ip: '192.168.1.1',
    } as unknown as FastifyRequest;

    const reply = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      sent: false,
    } as unknown as FastifyReply;

    await rateLimitByTelegramId(request, reply, 'default');

    expect(reply.header).toHaveBeenCalledWith('X-RateLimit-Limit', 50); // Mitad para anónimos
  });

  it('debe aplicar límites diferentes por categoría', async () => {
    mockCheckShopRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });

    const request = {
      headers: {
        'x-telegram-init-data': 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%7D&auth_date=1750243200&hash=abc123',
      },
      ip: '127.0.0.1',
    } as unknown as FastifyRequest;

    const reply = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      sent: false,
    } as unknown as FastifyReply;

    await rateLimitByTelegramId(request, reply, 'auth');

    expect(reply.header).toHaveBeenCalledWith('X-RateLimit-Limit', 10); // Límite de auth
  });
});

describe('rateLimitByShop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe permitir request cuando shop está dentro del límite', async () => {
    mockCheckShopRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });

    const request = {
      headers: {
        'x-shop-id': '42',
      },
      ip: '127.0.0.1',
    } as unknown as FastifyRequest;

    const reply = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      sent: false,
    } as unknown as FastifyReply;

    await rateLimitByShop(request, reply, 'default');

    expect(reply.header).toHaveBeenCalledWith('X-Shop-RateLimit', 'true');
    expect(reply.header).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
  });

  it('debe extraer shop_id de múltiples fuentes', async () => {
    mockCheckShopRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });

    // Desde query params
    const request1 = {
      headers: {},
      query: { shop_id: '42' },
      ip: '127.0.0.1',
    } as unknown as FastifyRequest;

    const reply = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      sent: false,
    } as unknown as FastifyReply;

    await rateLimitByShop(request1, reply, 'default');
    expect(mockCheckShopRateLimit).toHaveBeenCalledWith(42, expect.any(Number), expect.any(Number));
  });

  it('debe rechazar request cuando shop excede el límite', async () => {
    mockCheckShopRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });

    const request = {
      headers: {
        'x-shop-id': '42',
      },
      ip: '127.0.0.1',
    } as unknown as FastifyRequest;

    const reply = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      sent: false,
    } as unknown as FastifyReply;

    await rateLimitByShop(request, reply, 'default');

    expect(reply.status).toHaveBeenCalledWith(429);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Too Many Requests',
        shopId: 42,
      })
    );
  });
});

describe('rateLimitCombined', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe aplicar ambos límites y permitir si ambos pasan', async () => {
    mockCheckShopRateLimit
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 99,
        resetAt: Math.floor(Date.now() / 1000) + 60,
      })
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 99,
        resetAt: Math.floor(Date.now() / 1000) + 60,
      });

    const request = {
      headers: {
        'x-telegram-init-data': 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%7D&auth_date=1750243200&hash=abc123',
        'x-shop-id': '42',
      },
      ip: '127.0.0.1',
    } as unknown as FastifyRequest;

    const reply = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      sent: false,
    } as unknown as FastifyReply;

    await rateLimitCombined(request, reply, 'default');

    expect(reply.sent).toBe(false);
    expect(mockCheckShopRateLimit).toHaveBeenCalledTimes(2);
  });

  it('debe rechazar si telegram_id excede límite', async () => {
    mockCheckShopRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });

    const request = {
      headers: {
        'x-telegram-init-data': 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%7D&auth_date=1750243200&hash=abc123',
        'x-shop-id': '42',
      },
      ip: '127.0.0.1',
    } as unknown as FastifyRequest;

    const reply = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      sent: false,
    } as unknown as FastifyReply;

    await rateLimitCombined(request, reply, 'default');

    expect(reply.status).toHaveBeenCalledWith(429);
    expect(mockCheckShopRateLimit).toHaveBeenCalledTimes(1); // No llega a shop
  });
});

describe('Factory functions', () => {
  it('rateLimitByTelegramIdHandler debe retornar una función', () => {
    const handler = rateLimitByTelegramIdHandler('auth');
    expect(typeof handler).toBe('function');
  });

  it('rateLimitByShopHandler debe retornar una función', () => {
    const handler = rateLimitByShopHandler('default');
    expect(typeof handler).toBe('function');
  });

  it('rateLimitCombinedHandler debe retornar una función', () => {
    const handler = rateLimitCombinedHandler('webhook');
    expect(typeof handler).toBe('function');
  });
});

describe('PLAN_LIMITS', () => {
  it('debe tener límites definidos para STARTER', () => {
    expect(PLAN_LIMITS.STARTER).toBeDefined();
    expect(PLAN_LIMITS.STARTER.maxShops).toBe(1);
    expect(PLAN_LIMITS.STARTER.maxProducts).toBe(100);
    expect(PLAN_LIMITS.STARTER.maxBroadcastsPerDay).toBe(1);
    expect(PLAN_LIMITS.STARTER.maxManagers).toBe(1);
  });

  it('debe tener límites definidos para GROWTH', () => {
    expect(PLAN_LIMITS.GROWTH).toBeDefined();
    expect(PLAN_LIMITS.GROWTH.maxShops).toBe(3);
    expect(PLAN_LIMITS.GROWTH.maxProducts).toBe(500);
    expect(PLAN_LIMITS.GROWTH.maxBroadcastsPerDay).toBe(5);
    expect(PLAN_LIMITS.GROWTH.maxManagers).toBe(3);
  });

  it('debe tener límites ilimitados para PRO', () => {
    expect(PLAN_LIMITS.PRO).toBeDefined();
    expect(PLAN_LIMITS.PRO.maxShops).toBe(Infinity);
    expect(PLAN_LIMITS.PRO.maxProducts).toBe(Infinity);
    expect(PLAN_LIMITS.PRO.maxBroadcastsPerDay).toBe(20);
    expect(PLAN_LIMITS.PRO.maxManagers).toBe(10);
  });
});

describe('checkPlanLimits', () => {
  it('debe retornar withinLimits=true para plan válido', async () => {
    const result = await checkPlanLimits(1, 'STARTER');
    expect(result.withinLimits).toBe(true);
    expect(result.exceeded).toEqual([]);
  });

  it('debe usar STARTER como fallback para plan desconocido', async () => {
    const result = await checkPlanLimits(1, 'UNKNOWN_PLAN');
    expect(result.withinLimits).toBe(true);
    expect(result.exceeded).toEqual([]);
  });
});
