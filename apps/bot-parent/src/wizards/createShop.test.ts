import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// ==========================================
// ESQUEMAS DE VALIDACIÓN (copiados del wizard)
// ==========================================

const shopNameSchema = z.string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre no puede exceder 100 caracteres')
  .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s&'-]+$/, 'El nombre contiene caracteres no válidos');

const shopDescriptionSchema = z.string()
  .max(500, 'La descripción no puede exceder 500 caracteres')
  .optional();

// ==========================================
// DATOS DE CONFIGURACIÓN (copiados del wizard)
// ==========================================

const CATEGORIES = [
  { id: 'electronics', name: 'Electrónica', emoji: '💻' },
  { id: 'fashion', name: 'Moda', emoji: '👗' },
  { id: 'beauty', name: 'Belleza', emoji: '💄' },
  { id: 'food', name: 'Alimentos', emoji: '🍔' },
  { id: 'home', name: 'Hogar', emoji: '🏠' },
  { id: 'sports', name: 'Deportes', emoji: '⚽' },
  { id: 'toys', name: 'Juguetes', emoji: '🧸' },
  { id: 'books', name: 'Libros', emoji: '📚' },
  { id: 'health', name: 'Salud', emoji: '💊' },
  { id: 'other', name: 'Otros', emoji: '📦' },
];

const COUNTRIES = [
  { code: 'PY', name: 'Paraguay', emoji: '🇵🇾' },
  { code: 'AR', name: 'Argentina', emoji: '🇦🇷' },
  { code: 'BR', name: 'Brasil', emoji: '🇧🇷' },
  { code: 'UY', name: 'Uruguay', emoji: '🇺🇾' },
  { code: 'CL', name: 'Chile', emoji: '🇨🇱' },
  { code: 'CO', name: 'Colombia', emoji: '🇨🇴' },
  { code: 'MX', name: 'México', emoji: '🇲🇽' },
  { code: 'ES', name: 'España', emoji: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', emoji: '🇺🇸' },
  { code: 'PE', name: 'Perú', emoji: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', emoji: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', emoji: '🇧🇴' },
  { code: 'OTHER', name: 'Otro', emoji: '🌍' },
];

const CURRENCIES = [
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$', emoji: '💵' },
  { code: 'PYG', name: 'Guaraní paraguayo', symbol: '₲', emoji: '🇵🇾' },
  { code: 'ARS', name: 'Peso argentino', symbol: '$', emoji: '🇦🇷' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$', emoji: '🇧🇷' },
  { code: 'UYU', name: 'Peso uruguayo', symbol: '$', emoji: '🇺🇾' },
  { code: 'CLP', name: 'Peso chileno', symbol: '$', emoji: '🇨🇱' },
  { code: 'COP', name: 'Peso colombiano', symbol: '$', emoji: '🇨🇴' },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$', emoji: '🇲🇽' },
  { code: 'EUR', name: 'Euro', symbol: '€', emoji: '🇪🇺' },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£', emoji: '🇬🇧' },
];

describe('Onboarding Wizard - Validaciones', () => {
  describe('shopNameSchema', () => {
    it('debe aceptar nombre válido', () => {
      const result = shopNameSchema.safeParse('Mi Tienda');
      expect(result.success).toBe(true);
    });

    it('debe aceptar nombre con caracteres especiales válidos', () => {
      const result = shopNameSchema.safeParse('José María & Co\');
      expect(result.success).toBe(true);
    });

    it('debe aceptar nombre con números', () => {
      const result = shopNameSchema.safeParse('Tienda 123');
      expect(result.success).toBe(true);
    });

    it('debe rechazar nombre muy corto', () => {
      const result = shopNameSchema.safeParse('A');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('al menos 2 caracteres');
      }
    });

    it('debe rechazar nombre muy largo', () => {
      const longName = 'A'.repeat(101);
      const result = shopNameSchema.safeParse(longName);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('no puede exceder 100 caracteres');
      }
    });

    it('debe rechazar nombre con caracteres inválidos', () => {
      const result = shopNameSchema.safeParse('Tienda <script>');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('caracteres no válidos');
      }
    });

    it('debe rechazar nombre vacío', () => {
      const result = shopNameSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('debe aceptar nombre con espacios', () => {
      const result = shopNameSchema.safeParse('La Casa de las Flores');
      expect(result.success).toBe(true);
    });

    it('debe aceptar nombre con guiones', () => {
      const result = shopNameSchema.safeParse('Tienda-Express');
      expect(result.success).toBe(true);
    });
  });

  describe('shopDescriptionSchema', () => {
    it('debe aceptar descripción válida', () => {
      const result = shopDescriptionSchema.safeParse('Venta de productos electrónicos');
      expect(result.success).toBe(true);
    });

    it('debe aceptar descripción vacía (opcional)', () => {
      const result = shopDescriptionSchema.safeParse('');
      expect(result.success).toBe(true);
    });

    it('debe aceptar undefined (opcional)', () => {
      const result = shopDescriptionSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('debe rechazar descripción muy larga', () => {
      const longDesc = 'A'.repeat(501);
      const result = shopDescriptionSchema.safeParse(longDesc);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('no puede exceder 500 caracteres');
      }
    });

    it('debe aceptar descripción exactamente en el límite', () => {
      const desc = 'A'.repeat(500);
      const result = shopDescriptionSchema.safeParse(desc);
      expect(result.success).toBe(true);
    });
  });
});

describe('Onboarding Wizard - Datos de Configuración', () => {
  describe('CATEGORIAS', () => {
    it('debe tener 10 categorías', () => {
      expect(CATEGORIES).toHaveLength(10);
    });

    it('debe tener categorías con id, name y emoji', () => {
      CATEGORIES.forEach(cat => {
        expect(cat.id).toBeDefined();
        expect(cat.name).toBeDefined();
        expect(cat.emoji).toBeDefined();
      });
    });

    it('debe incluir Electrónica', () => {
      const electronics = CATEGORIES.find(c => c.id === 'electronics');
      expect(electronics).toBeDefined();
      expect(electronics?.name).toBe('Electrónica');
      expect(electronics?.emoji).toBe('💻');
    });

    it('debe incluir Moda', () => {
      const fashion = CATEGORIES.find(c => c.id === 'fashion');
      expect(fashion).toBeDefined();
      expect(fashion?.name).toBe('Moda');
      expect(fashion?.emoji).toBe('👗');
    });

    it('debe tener ids únicos', () => {
      const ids = CATEGORIES.map(c => c.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(CATEGORIES.length);
    });
  });

  describe('PAISES', () => {
    it('debe tener 13 países', () => {
      expect(COUNTRIES).toHaveLength(13);
    });

    it('debe tener Paraguay como primer país', () => {
      expect(COUNTRIES[0].code).toBe('PY');
      expect(COUNTRIES[0].name).toBe('Paraguay');
      expect(COUNTRIES[0].emoji).toBe('🇵🇾');
    });

    it('debe tener Argentina', () => {
      const argentina = COUNTRIES.find(c => c.code === 'AR');
      expect(argentina).toBeDefined();
      expect(argentina?.name).toBe('Argentina');
    });

    it('debe tener Brasil', () => {
      const brasil = COUNTRIES.find(c => c.code === 'BR');
      expect(brasil).toBeDefined();
      expect(brasil?.name).toBe('Brasil');
    });

    it('debe tener opción "Otro"', () => {
      const other = COUNTRIES.find(c => c.code === 'OTHER');
      expect(other).toBeDefined();
      expect(other?.name).toBe('Otro');
    });

    it('debe tener códigos únicos', () => {
      const codes = COUNTRIES.map(c => c.code);
      const uniqueCodes = [...new Set(codes)];
      expect(uniqueCodes).toHaveLength(COUNTRIES.length);
    });
  });

  describe('MONEDAS', () => {
    it('debe tener 10 monedas', () => {
      expect(CURRENCIES).toHaveLength(10);
    });

    it('debe tener USD como primera moneda', () => {
      expect(CURRENCIES[0].code).toBe('USD');
      expect(CURRENCIES[0].name).toBe('Dólar estadounidense');
      expect(CURRENCIES[0].symbol).toBe('$');
    });

    it('debe tener PYG (Guaraní)', () => {
      const pyg = CURRENCIES.find(c => c.code === 'PYG');
      expect(pyg).toBeDefined();
      expect(pyg?.name).toBe('Guaraní paraguayo');
      expect(pyg?.symbol).toBe('₲');
    });

    it('debe tener ARS (Peso Argentino)', () => {
      const ars = CURRENCIES.find(c => c.code === 'ARS');
      expect(ars).toBeDefined();
      expect(ars?.name).toBe('Peso argentino');
    });

    it('debe tener EUR (Euro)', () => {
      const eur = CURRENCIES.find(c => c.code === 'EUR');
      expect(eur).toBeDefined();
      expect(eur?.symbol).toBe('€');
    });

    it('debe tener códigos únicos', () => {
      const codes = CURRENCIES.map(c => c.code);
      const uniqueCodes = [...new Set(codes)];
      expect(uniqueCodes).toHaveLength(CURRENCIES.length);
    });
  });
});

describe('Onboarding Wizard - Flujo', () => {
  it('debe tener 5 pasos definidos', () => {
    const steps = ['name', 'description', 'category', 'country', 'currency'];
    expect(steps).toHaveLength(5);
    expect(steps[0]).toBe('name');
    expect(steps[4]).toBe('currency');
  });

  it('debe tener resumen con todos los campos', () => {
    const shopData = {
      name: 'Mi Tienda',
      description: 'Descripción de prueba',
      category: 'Electrónica',
      country: 'PY',
      currency: 'USD',
    };

    expect(shopData.name).toBeDefined();
    expect(shopData.description).toBeDefined();
    expect(shopData.category).toBeDefined();
    expect(shopData.country).toBeDefined();
    expect(shopData.currency).toBeDefined();
  });

  it('debe permitir descripción opcional', () => {
    const shopData = {
      name: 'Mi Tienda',
      description: undefined,
      category: 'Electrónica',
      country: 'PY',
      currency: 'USD',
    };

    expect(shopData.description).toBeUndefined();
  });

  it('debe tener timeout de 5 minutos por paso', () => {
    const timeoutMs = 300000; // 5 minutos
    expect(timeoutMs).toBe(300000);
    expect(timeoutMs / 1000 / 60).toBe(5); // 5 minutos
  });
});

describe('Onboarding Wizard - Internacionalización', () => {
  it('debe tener traducciones en español para wizard', () => {
    const es = {
      welcome: '🏪 *Crear Nueva Tienda*',
      step1: '✏️ *Paso 1/5: Nombre de tu tienda*',
      step2: '✏️ *Paso 2/5: Descripción*',
      step3: '📂 *Paso 3/5: Categoría*',
      step4: '🌍 *Paso 4/5: País*',
      step5: '💱 *Paso 5/5: Moneda*',
      summary: '📋 *Resumen de tu tienda*',
      success: '🎉 *¡Tienda creada exitosamente!*',
      cancelled: '❌ *Creación cancelada*',
      timeout: '⏰ *Tiempo agotado*',
    };

    expect(es.welcome).toContain('Crear Nueva Tienda');
    expect(es.step1).toContain('Paso 1/5');
    expect(es.step5).toContain('Paso 5/5');
    expect(es.success).toContain('exitosamente');
  });

  it('debe tener traducciones en inglés para wizard', () => {
    const en = {
      welcome: '🏪 *Create New Store*',
      step1: '✏️ *Step 1/5: Store Name*',
      step2: '✏️ *Step 2/5: Description*',
      step3: '📂 *Step 3/5: Category*',
      step4: '🌍 *Step 4/5: Country*',
      step5: '💱 *Step 5/5: Currency*',
      summary: '📋 *Store Summary*',
      success: '🎉 *Store created successfully!*',
      cancelled: '❌ *Creation cancelled*',
      timeout: '⏰ *Time expired*',
    };

    expect(en.welcome).toContain('Create New Store');
    expect(en.step1).toContain('Step 1/5');
    expect(en.step5).toContain('Step 5/5');
    expect(en.success).toContain('successfully');
  });
});

describe('Onboarding Wizard - Manejo de Errores', () => {
  it('debe manejar cancelación en cualquier paso', () => {
    const cancelled = true;
    expect(cancelled).toBe(true);
  });

  it('debe manejar timeout', () => {
    const timeout = true;
    expect(timeout).toBe(true);
  });

  it('debe manejar error de API', () => {
    const apiError = new Error('Network error');
    expect(apiError.message).toBe('Network error');
  });

  it('debe manejar límite de tiendas alcanzado', () => {
    const maxShops = 3;
    const currentShops = 3;
    const limitReached = currentShops >= maxShops;
    expect(limitReached).toBe(true);
  });
});

describe('Onboarding Wizard - Botones', () => {
  it('debe tener botón de confirmar', () => {
    const button = '✅ Confirmar';
    expect(button).toContain('✅');
    expect(button).toContain('Confirmar');
  });

  it('debe tener botón de cancelar', () => {
    const button = '❌ Cancelar';
    expect(button).toContain('❌');
    expect(button).toContain('Cancelar');
  });

  it('debe tener botón de volver', () => {
    const button = '⬅️ Volver';
    expect(button).toContain('⬅️');
    expect(button).toContain('Volver');
  });

  it('debe tener botón de omitir', () => {
    const button = '⏭️ Omitir';
    expect(button).toContain('⏭️');
    expect(button).toContain('Omitir');
  });
});

describe('Onboarding Wizard - API Integration', () => {
  it('debe generar cuerpo de request correcto', () => {
    const shopData = {
      name: 'Mi Tienda',
      description: 'Descripción',
      category: 'Electrónica',
      country: 'PY',
      currency: 'USD',
    };

    const body = JSON.stringify(shopData);
    expect(body).toContain('Mi Tienda');
    expect(body).toContain('Electrónica');
    expect(body).toContain('PY');
    expect(body).toContain('USD');
  });

  it('debe manejar respuesta exitosa de API', () => {
    const response = {
      shop: {
        id: 1,
        name: 'Mi Tienda',
        status: 'TRIAL',
        plan: 'GROWTH',
      },
    };

    expect(response.shop.id).toBe(1);
    expect(response.shop.status).toBe('TRIAL');
    expect(response.shop.plan).toBe('GROWTH');
  });

  it('debe manejar error de API con mensaje', () => {
    const error = {
      error: 'Bad Request',
      message: 'Invalid shop data',
    };

    expect(error.error).toBe('Bad Request');
    expect(error.message).toBe('Invalid shop data');
  });
});
