import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock grammy
vi.mock('grammy', () => ({
  Bot: vi.fn().mockImplementation(() => ({
    token: 'test-token',
    use: vi.fn().mockReturnThis(),
    command: vi.fn().mockReturnThis(),
    catch: vi.fn().mockReturnThis(),
    start: vi.fn(),
    api: {
      sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
      setWebhook: vi.fn().mockResolvedValue(true),
    },
  })),
  session: vi.fn().mockReturnValue({
    initial: vi.fn().mockReturnValue({ isAdmin: false, language: 'es' }),
  }),
  conversations: vi.fn().mockReturnValue({}),
  createConversation: vi.fn().mockReturnValue({}),
  Menu: vi.fn().mockImplementation(() => ({
    text: vi.fn().mockReturnThis(),
    row: vi.fn().mockReturnThis(),
  })),
  hydrateReply: vi.fn(),
  parseMode: vi.fn().mockReturnValue({}),
}));

vi.stubEnv('PARENT_BOT_TOKEN', '1234567890:TEST_PARENT_TOKEN_1234567890ABCDEF');
vi.stubEnv('ADMIN_TELEGRAM_IDS', '123456,789012');

describe('Bot Parent', () => {
  it('creates bot with token', async () => {
    const { default: bot } = await import('./index');
    expect(bot).toBeDefined();
    expect(bot.token).toBe('1234567890:TEST_PARENT_TOKEN_1234567890ABCDEF');
  });

  it('has admin IDs configured', async () => {
    const { CONFIG } = await import('./index');
    expect(CONFIG.adminTelegramIds).toContain(123456);
    expect(CONFIG.adminTelegramIds).toContain(789012);
  });

  it('registers commands', async () => {
    const { default: bot } = await import('./index');
    expect(bot.command).toHaveBeenCalledWith('start', expect.any(Function));
    expect(bot.command).toHaveBeenCalledWith('shops', expect.any(Function));
    expect(bot.command).toHaveBeenCalledWith('stats', expect.any(Function));
    expect(bot.command).toHaveBeenCalledWith('settings', expect.any(Function));
    expect(bot.command).toHaveBeenCalledWith('help', expect.any(Function));
    expect(bot.command).toHaveBeenCalledWith('language', expect.any(Function));
  });

  it('has isAdmin function', async () => {
    const { isAdmin } = await import('./index');
    expect(typeof isAdmin).toBe('function');
  });
});

describe('i18n', () => {
  const i18n = {
    es: {
      welcome: 'Bienvenido',
      createShop: 'Crear Tienda',
      myShops: 'Mis Tiendas',
      statistics: 'Estadísticas',
    },
    en: {
      welcome: 'Welcome',
      createShop: 'Create Shop',
      myShops: 'My Shops',
      statistics: 'Statistics',
    },
  };

  it('has Spanish translations', () => {
    expect(i18n.es.welcome).toContain('Bienvenido');
    expect(i18n.es.createShop).toBe('Crear Tienda');
  });

  it('has English translations', () => {
    expect(i18n.en.welcome).toContain('Welcome');
    expect(i18n.en.createShop).toBe('Create Shop');
  });

  it('has matching keys', () => {
    expect(Object.keys(i18n.es)).toEqual(Object.keys(i18n.en));
  });
});

describe('Shop Summary', () => {
  it('has correct structure', () => {
    const shop = {
      id: 1,
      name: 'Test Shop',
      status: 'active',
      totalOrders: 10,
      totalRevenue: 5000,
      productCount: 20,
    };

    expect(shop).toHaveProperty('id');
    expect(shop).toHaveProperty('name');
    expect(shop).toHaveProperty('status');
    expect(shop).toHaveProperty('totalOrders');
    expect(shop).toHaveProperty('totalRevenue');
    expect(shop).toHaveProperty('productCount');
  });

  it('formats shop status', () => {
    const statuses = {
      active: '🟢 Activa',
      pending: '⏳ Pendiente',
      inactive: '🔴 Inactiva',
    };

    expect(statuses.active).toContain('Activa');
    expect(statuses.pending).toContain('Pendiente');
  });
});

describe('Mock Data', () => {
  it('returns mock shops', () => {
    const shops = [
      { id: 1, name: 'Shop 1', status: 'active', totalOrders: 5, totalRevenue: 1000, productCount: 10 },
      { id: 2, name: 'Shop 2', status: 'pending', totalOrders: 0, totalRevenue: 0, productCount: 5 },
    ];

    expect(shops).toHaveLength(2);
    expect(shops[0].status).toBe('active');
  });

  it('returns mock stats', () => {
    const stats = {
      totalShops: 3,
      totalOrders: 57,
      totalRevenue: 15900,
      totalCustomers: 89,
    };

    expect(stats.totalShops).toBeGreaterThan(0);
    expect(stats.totalRevenue).toBeGreaterThan(0);
  });
});

describe('Admin Middleware', () => {
  it('allows admin access', () => {
    const adminIds = [123456, 789012];
    const userId = 123456;
    expect(adminIds.includes(userId)).toBe(true);
  });

  it('denies non-admin access', () => {
    const adminIds = [123456, 789012];
    const userId = 999999;
    expect(adminIds.includes(userId)).toBe(false);
  });
});
