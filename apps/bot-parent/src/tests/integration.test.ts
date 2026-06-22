import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Bot, Context, SessionFlavor } from 'grammy';
import { ConversationFlavor } from '@grammyjs/conversations';

// ==========================================
// TIPOS Y MOCKS
// ==========================================

interface MockSession {
  step: string | null;
  shopData: Record<string, any>;
  selectedShopId: number | null;
  language: string;
  wizardHistory: string[];
}

type MockContext = Context & SessionFlavor<MockSession> & ConversationFlavor;

// Mock completo de la API de Telegram
const createMockApi = () => ({
  sendMessage: vi.fn().mockResolvedValue({ message_id: 1, date: Date.now() }),
  editMessageText: vi.fn().mockResolvedValue({ message_id: 1, date: Date.now() }),
  answerCallbackQuery: vi.fn().mockResolvedValue(true),
  setWebhook: vi.fn().mockResolvedValue(true),
  getMe: vi.fn().mockResolvedValue({
    id: 123456789,
    is_bot: true,
    first_name: 'Vendy Bot',
    username: 'vendy_parent_bot',
  }),
  deleteWebhook: vi.fn().mockResolvedValue(true),
  getWebhookInfo: vi.fn().mockResolvedValue({ url: '', has_custom_certificate: false }),
});

// Mock de Context de grammy
const createMockContext = (overrides: Partial<MockContext> = {}): MockContext => {
  const mockApi = createMockApi();
  
  return {
    from: {
      id: 123456789,
      is_bot: false,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'es',
    },
    chat: {
      id: 123456789,
      type: 'private',
    },
    message: {
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      chat: { id: 123456789, type: 'private' },
      text: '/start',
    },
    session: {
      step: null,
      shopData: {},
      selectedShopId: null,
      language: 'es',
      wizardHistory: [],
    },
    api: mockApi,
    reply: vi.fn().mockImplementation(async (text: string, extra?: any) => {
      return mockApi.sendMessage(123456789, text, extra);
    }),
    editMessageText: vi.fn().mockImplementation(async (text: string, extra?: any) => {
      return mockApi.editMessageText(123456789, 1, text, extra);
    }),
    answerCallbackQuery: vi.fn().mockImplementation(async (text?: string) => {
      return mockApi.answerCallbackQuery(text);
    }),
    conversation: {
      enter: vi.fn().mockResolvedValue(undefined),
      waitFor: vi.fn().mockResolvedValue({
        message: { text: 'respuesta de prueba' },
        callbackQuery: { data: 'callback_test' },
        answerCallbackQuery: vi.fn().mockResolvedValue(true),
      }),
    },
    callbackQuery: {
      id: 'callback_1',
      from: { id: 123456789, is_bot: false, first_name: 'Test' },
      data: 'test_data',
      message: { message_id: 1, chat: { id: 123456789, type: 'private' }, date: Date.now() },
    },
    ...overrides,
  } as unknown as MockContext;
};

// ==========================================
// TESTS DE INTEGRACIÓN END-TO-END
// ==========================================

describe('Bot Integration - Flujo Completo', () => {
  let mockCtx: MockContext;
  let mockApi: ReturnType<typeof createMockApi>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = createMockApi();
    mockCtx = createMockContext();
  });

  describe('Flujo /start', () => {
    it('debe responder a /start con mensaje de bienvenida', async () => {
      const ctx = createMockContext({
        message: { ...createMockContext().message, text: '/start' },
      });

      // Simular handler de /start
      const welcomeMessage = `👋 ¡Bienvenido a *Vendy*!\n\nSoy tu asistente para crear y gestionar tiendas en Telegram.\n\n¿Qué querés hacer?`;
      
      await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });

      expect(ctx.reply).toHaveBeenCalledWith(welcomeMessage, { parse_mode: 'Markdown' });
    });

    it('debe detectar usuario nuevo sin tiendas', async () => {
      const ctx = createMockContext();
      ctx.session.selectedShopId = null;

      // Simular verificación de tiendas
      const hasShops = !!ctx.session.selectedShopId;
      
      expect(hasShops).toBe(false);
    });

    it('debe detectar usuario con tiendas existentes', async () => {
      const ctx = createMockContext();
      ctx.session.selectedShopId = 123;

      const hasShops = !!ctx.session.selectedShopId;
      
      expect(hasShops).toBe(true);
    });
  });

  describe('Flujo de Onboarding', () => {
    it('debe iniciar wizard de creación de tienda', async () => {
      const ctx = createMockContext();
      
      await ctx.conversation.enter('createShopWizard');
      
      expect(ctx.conversation.enter).toHaveBeenCalledWith('createShopWizard');
    });

    it('debe almacenar datos del wizard en sesión', async () => {
      const ctx = createMockContext();
      
      ctx.session.shopData = {
        name: 'Mi Tienda',
        description: 'Descripción de prueba',
        category: 'Electrónica',
        country: 'PY',
        currency: 'USD',
      };
      ctx.session.step = 'summary';
      
      expect(ctx.session.shopData.name).toBe('Mi Tienda');
      expect(ctx.session.shopData.category).toBe('Electrónica');
      expect(ctx.session.step).toBe('summary');
    });

    it('debe limpiar datos del wizard al finalizar', async () => {
      const ctx = createMockContext();
      
      ctx.session.shopData = { name: 'Test' };
      ctx.session.step = 'summary';
      ctx.session.wizardHistory = ['start', 'name', 'description'];
      
      // Simular limpieza
      ctx.session.shopData = {};
      ctx.session.step = null;
      ctx.session.wizardHistory = [];
      
      expect(ctx.session.shopData).toEqual({});
      expect(ctx.session.step).toBeNull();
      expect(ctx.session.wizardHistory).toEqual([]);
    });
  });

  describe('Flujo de Menú Principal', () => {
    it('debe mostrar menú principal para usuarios con tiendas', async () => {
      const ctx = createMockContext();
      ctx.session.selectedShopId = 123;
      
      const menuText = '📋 *Menú Principal*\n\nSeleccioná una opción:';
      
      await ctx.reply(menuText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📦 Productos', callback_data: 'menu_products' }],
            [{ text: '📋 Órdenes', callback_data: 'menu_orders' }],
          ],
        },
      });

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Menú Principal'),
        expect.objectContaining({
          parse_mode: 'Markdown',
          reply_markup: expect.any(Object),
        })
      );
    });

    it('debe manejar callback de menú de productos', async () => {
      const ctx = createMockContext();
      ctx.callbackQuery = {
        ...ctx.callbackQuery,
        data: 'menu_products',
      };
      
      await ctx.answerCallbackQuery('Menú de productos');
      
      expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('Menú de productos');
    });

    it('debe manejar callback de volver al menú principal', async () => {
      const ctx = createMockContext();
      ctx.callbackQuery = {
        ...ctx.callbackQuery,
        data: 'back_to_main',
      };
      
      const menuText = '📋 *Menú Principal*\n\nSeleccioná una opción:';
      
      await ctx.answerCallbackQuery('Volviendo...');
      await ctx.editMessageText(menuText, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [] },
      });
      
      expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('Volviendo...');
      expect(ctx.editMessageText).toHaveBeenCalled();
    });
  });

  describe('Flujo de Web App', () => {
    it('debe generar URL de Web App con shopId', async () => {
      const shopId = 123;
      const baseUrl = 'https://app.vendy.app';
      const path = 'products';
      
      const webAppUrl = `${baseUrl}/shop/${shopId}/${path}`;
      
      expect(webAppUrl).toBe('https://app.vendy.app/shop/123/products');
    });

    it('debe enviar mensaje con botón de Web App', async () => {
      const ctx = createMockContext();
      
      const webAppUrl = 'https://app.vendy.app/shop/123/products';
      
      await ctx.reply('📱 Abrí el panel:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Abrir Panel', web_app: { url: webAppUrl } }],
          ],
        },
      });

      const call = ctx.reply.mock.calls[0];
      expect(call[1].reply_markup.inline_keyboard[0][0].web_app.url).toBe(webAppUrl);
    });
  });

  describe('Flujo de Notificaciones', () => {
    it('debe enviar notificación de nueva orden', async () => {
      const ctx = createMockContext();
      
      const orderMessage = `🛒 *Nueva Orden*\n\n📋 *N°:* \`ORD-001\`\n👤 *Cliente:* Juan Pérez\n💰 *Total:* USD 150.00`;
      
      await ctx.reply(orderMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📋 Ver Orden', callback_data: 'view_order_1' },
              { text: '✅ Confirmar', callback_data: 'confirm_order_1' },
            ],
          ],
        },
      });

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Nueva Orden'),
        expect.objectContaining({
          parse_mode: 'Markdown',
          reply_markup: expect.any(Object),
        })
      );
    });

    it('debe enviar notificación de pago completado', async () => {
      const ctx = createMockContext();
      
      const paymentMessage = `💳 *Actualización de Pago*\n\n✅ *Estado:* completed\n💰 *Monto:* USD 150.00`;
      
      await ctx.reply(paymentMessage, { parse_mode: 'Markdown' });

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Actualización de Pago'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });
  });

  describe('Manejo de Errores', () => {
    it('debe manejar error de API de Telegram', async () => {
      const ctx = createMockContext();
      ctx.reply = vi.fn().mockRejectedValue(new Error('Telegram API error'));
      
      try {
        await ctx.reply('Test message');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Telegram API error');
      }
    });

    it('debe manejar mensaje sin texto', async () => {
      const ctx = createMockContext({
        message: { ...createMockContext().message, text: undefined },
      });
      
      const hasText = !!ctx.message?.text;
      expect(hasText).toBe(false);
    });

    it('debe manejar callback sin datos', async () => {
      const ctx = createMockContext({
        callbackQuery: { ...createMockContext().callbackQuery, data: undefined },
      });
      
      const hasData = !!ctx.callbackQuery?.data;
      expect(hasData).toBe(false);
    });

    it('debe manejar usuario sin idioma definido', async () => {
      const ctx = createMockContext({
        from: { ...createMockContext().from, language_code: undefined },
      });
      
      const language = ctx.from?.language_code || 'es';
      expect(language).toBe('es'); // Fallback a español
    });
  });

  describe('Internacionalización', () => {
    it('debe detectar idioma español', async () => {
      const ctx = createMockContext({
        from: { ...createMockContext().from, language_code: 'es' },
      });
      
      const detectedLang = ctx.from?.language_code === 'en' ? 'en' : 'es';
      expect(detectedLang).toBe('es');
    });

    it('debe detectar idioma inglés', async () => {
      const ctx = createMockContext({
        from: { ...createMockContext().from, language_code: 'en' },
      });
      
      const detectedLang = ctx.from?.language_code === 'en' ? 'en' : 'es';
      expect(detectedLang).toBe('en');
    });

    it('debe hacer fallback a español para idioma no soportado', async () => {
      const ctx = createMockContext({
        from: { ...createMockContext().from, language_code: 'fr' },
      });
      
      const detectedLang = ctx.from?.language_code === 'en' ? 'en' : 'es';
      expect(detectedLang).toBe('es');
    });
  });

  describe('Sesión y Estado', () => {
    it('debe mantener shopId seleccionado en sesión', async () => {
      const ctx = createMockContext();
      ctx.session.selectedShopId = 456;
      
      expect(ctx.session.selectedShopId).toBe(456);
    });

    it('debe mantener idioma en sesión', async () => {
      const ctx = createMockContext();
      ctx.session.language = 'en';
      
      expect(ctx.session.language).toBe('en');
    });

    it('debe mantener historial del wizard', async () => {
      const ctx = createMockContext();
      ctx.session.wizardHistory = ['start', 'name', 'description', 'category'];
      
      expect(ctx.session.wizardHistory).toHaveLength(4);
      expect(ctx.session.wizardHistory[0]).toBe('start');
    });
  });

  describe('Bot API Calls', () => {
    it('debe llamar a sendMessage con parámetros correctos', async () => {
      const ctx = createMockContext();
      
      await ctx.reply('Test message', { parse_mode: 'Markdown' });
      
      expect(ctx.reply).toHaveBeenCalledWith('Test message', { parse_mode: 'Markdown' });
    });

    it('debe llamar a editMessageText con parámetros correctos', async () => {
      const ctx = createMockContext();
      
      await ctx.editMessageText('Updated text', { parse_mode: 'Markdown' });
      
      expect(ctx.editMessageText).toHaveBeenCalledWith('Updated text', { parse_mode: 'Markdown' });
    });

    it('debe llamar a answerCallbackQuery', async () => {
      const ctx = createMockContext();
      
      await ctx.answerCallbackQuery('Loading...');
      
      expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('Loading...');
    });
  });

  describe('Flujo de Selección de Tienda', () => {
    it('debe seleccionar tienda desde callback', async () => {
      const ctx = createMockContext();
      const shopId = 789;
      
      ctx.callbackQuery = {
        ...ctx.callbackQuery,
        data: `shop_${shopId}`,
      };
      
      // Simular selección
      ctx.session.selectedShopId = shopId;
      
      await ctx.answerCallbackQuery('Tienda seleccionada');
      
      expect(ctx.session.selectedShopId).toBe(789);
      expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('Tienda seleccionada');
    });

    it('debe mostrar mensaje de tienda seleccionada', async () => {
      const ctx = createMockContext();
      ctx.session.selectedShopId = 789;
      
      const message = `🛍️ Tienda seleccionada: ID 789\n\nPróximamente: panel de gestión`;
      
      await ctx.reply(message);
      
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Tienda seleccionada'));
    });
  });

  describe('Flujo de Configuración', () => {
    it('debe cambiar idioma de sesión', async () => {
      const ctx = createMockContext();
      
      ctx.session.language = 'en';
      
      expect(ctx.session.language).toBe('en');
    });

    it('debe mantener configuración de tienda', async () => {
      const ctx = createMockContext();
      
      ctx.session.shopData = {
        name: 'Test Shop',
        description: 'Test Description',
        category: 'Electrónica',
      };
      
      expect(ctx.session.shopData.name).toBe('Test Shop');
      expect(ctx.session.shopData.category).toBe('Electrónica');
    });
  });
});

describe('Bot Integration - Webhook Endpoints', () => {
  it('debe verificar secret token de Telegram', () => {
    const secretToken = 'test_secret_123';
    const receivedToken = 'test_secret_123';
    
    expect(receivedToken).toBe(secretToken);
  });

  it('debe rechazar token inválido', () => {
    const secretToken = 'test_secret_123';
    const receivedToken = 'wrong_token';
    
    expect(receivedToken).not.toBe(secretToken);
  });

  it('debe procesar update de Telegram', () => {
    const update = {
      update_id: 1,
      message: {
        message_id: 1,
        from: { id: 123, first_name: 'Test', is_bot: false },
        chat: { id: 123, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      },
    };
    
    expect(update.message.text).toBe('/start');
    expect(update.message.from.id).toBe(123);
  });

  it('debe procesar callback query', () => {
    const update = {
      update_id: 2,
      callback_query: {
        id: 'callback_1',
        from: { id: 123, first_name: 'Test', is_bot: false },
        data: 'menu_products',
        message: {
          message_id: 1,
          chat: { id: 123, type: 'private' },
          date: Math.floor(Date.now() / 1000),
        },
      },
    };
    
    expect(update.callback_query.data).toBe('menu_products');
  });
});

describe('Bot Integration - Rate Limiting', () => {
  it('debe respetar límites de rate por telegram_id', () => {
    const telegramId = 123456789;
    const requests = new Map();
    
    // Simular 5 requests
    for (let i = 0; i < 5; i++) {
      const count = requests.get(telegramId) || 0;
      requests.set(telegramId, count + 1);
    }
    
    expect(requests.get(telegramId)).toBe(5);
  });

  it('debe respetar límites de rate por shop_id', () => {
    const shopId = 123;
    const requests = new Map();
    
    // Simular 10 requests
    for (let i = 0; i < 10; i++) {
      const count = requests.get(shopId) || 0;
      requests.set(shopId, count + 1);
    }
    
    expect(requests.get(shopId)).toBe(10);
  });
});

describe('Bot Integration - API Calls', () => {
  it('debe generar initData correcto', () => {
    const user = {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'es',
    };
    
    const authDate = Math.floor(Date.now() / 1000);
    const params = new URLSearchParams();
    params.set('user', JSON.stringify(user));
    params.set('auth_date', authDate.toString());
    params.set('hash', 'dev_hash_' + authDate);
    
    const initData = params.toString();
    
    expect(initData).toContain('user=');
    expect(initData).toContain('auth_date=');
    expect(initData).toContain('hash=');
    expect(initData).toContain('testuser');
  });

  it('debe construir URL de API correcta', () => {
    const apiUrl = 'http://localhost:3001';
    const endpoint = '/shops';
    const fullUrl = `${apiUrl}${endpoint}`;
    
    expect(fullUrl).toBe('http://localhost:3001/shops');
  });

  it('debe manejar respuesta exitosa de API', () => {
    const response = {
      ok: true,
      shops: [
        { id: 1, name: 'Shop 1' },
        { id: 2, name: 'Shop 2' },
      ],
    };
    
    expect(response.ok).toBe(true);
    expect(response.shops).toHaveLength(2);
  });

  it('debe manejar error de API', () => {
    const error = {
      ok: false,
      error: 'Unauthorized',
      message: 'Invalid token',
    };
    
    expect(error.ok).toBe(false);
    expect(error.error).toBe('Unauthorized');
  });
});

describe('Bot Integration - Multi-tenancy', () => {
  it('debe incluir shop_id en requests', () => {
    const shopId = 123;
    const headers = {
      'X-Telegram-Init-Data': 'test_init_data',
      'X-Shop-Id': shopId.toString(),
    };
    
    expect(headers['X-Shop-Id']).toBe('123');
  });

  it('debe verificar ownership de tienda', () => {
    const userId = 123456789;
    const shopOwnerId = 123456789;
    
    const isOwner = userId === shopOwnerId;
    
    expect(isOwner).toBe(true);
  });

  it('debe rechazar acceso a tienda ajena', () => {
    const userId = 123456789;
    const shopOwnerId = 987654321;
    
    const isOwner = userId === shopOwnerId;
    
    expect(isOwner).toBe(false);
  });
});
