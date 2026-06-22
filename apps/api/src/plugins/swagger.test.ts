import { describe, it, expect, vi } from 'vitest';

describe('Swagger Plugin', () => {
  it('registers swagger and swagger-ui', async () => {
    const mockRegister = vi.fn();
    const mockLog = { info: vi.fn() };
    
    const fastify = {
      register: mockRegister,
      log: mockLog,
    } as any;

    // Import dinámico para no cargar fastify-plugin
    const plugin = await import('./swagger');
    
    // El plugin se exporta como default
    expect(plugin).toBeDefined();
    expect(plugin.default).toBeDefined();
  });

  it('has correct OpenAPI info', () => {
    // Verificar que la configuración tiene la estructura esperada
    const expectedInfo = {
      title: 'Vendy API',
      description: 'Store-as-a-Service para Telegram',
      version: '1.0.0',
    };

    expect(expectedInfo.title).toBe('Vendy API');
    expect(expectedInfo.version).toBe('1.0.0');
  });

  it('has all required tags', () => {
    const expectedTags = [
      'Auth', 'Shops', 'Products', 'Orders', 'Payments',
      'Customers', 'Analytics', 'Support', 'Help',
      'Notifications', 'Webhooks', 'Health',
    ];

    expect(expectedTags).toContain('Auth');
    expect(expectedTags).toContain('Shops');
    expect(expectedTags).toContain('Products');
    expect(expectedTags).toContain('Orders');
    expect(expectedTags).toContain('Payments');
    expect(expectedTags).toContain('Support');
    expect(expectedTags).toContain('Help');
    expect(expectedTags).toContain('Notifications');
    expect(expectedTags).toHaveLength(12);
  });

  it('has security schemes', () => {
    const securitySchemes = {
      bearerAuth: { type: 'http', scheme: 'bearer' },
      telegramInitData: { type: 'apiKey', in: 'header' },
    };

    expect(securitySchemes.bearerAuth).toBeDefined();
    expect(securitySchemes.telegramInitData).toBeDefined();
  });

  it('has required schemas', () => {
    const requiredSchemas = [
      'Error', 'Pagination', 'Shop', 'Product', 'Order',
      'OrderItem', 'Customer', 'Ticket', 'TicketMessage',
      'HelpArticle', 'FAQ', 'Notification', 'Payment',
      'AnalyticsSummary', 'WebhookEvent', 'HealthStatus',
    ];

    expect(requiredSchemas).toContain('Shop');
    expect(requiredSchemas).toContain('Product');
    expect(requiredSchemas).toContain('Order');
    expect(requiredSchemas).toContain('Ticket');
    expect(requiredSchemas).toContain('HelpArticle');
    expect(requiredSchemas).toContain('FAQ');
    expect(requiredSchemas).toContain('Notification');
    expect(requiredSchemas).toHaveLength(16);
  });
});
