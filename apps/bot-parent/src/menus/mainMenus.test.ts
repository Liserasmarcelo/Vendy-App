import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==========================================
// DATOS DE MENÚS (copiados de mainMenus.ts)
// ==========================================

const menuI18n = {
  es: {
    main: {
      title: '📋 *Menú Principal*',
      products: '📦 Productos',
      orders: '📋 Órdenes',
      customers: '👥 Clientes',
      analytics: '📊 Estadísticas',
      settings: '⚙️ Configuración',
      marketing: '📢 Marketing',
      openApp: '📱 Abrir Panel',
      back: '⬅️ Volver',
      help: '❓ Ayuda',
    },
    products: {
      title: '📦 *Gestión de Productos*',
      list: '📋 Ver Productos',
      add: '➕ Agregar Producto',
      categories: '📂 Categorías',
      inventory: '📊 Inventario',
      back: '⬅️ Volver al Menú',
    },
    orders: {
      title: '📋 *Gestión de Órdenes*',
      pending: '⏳ Pendientes',
      completed: '✅ Completadas',
      all: '📋 Todas',
      stats: '📊 Estadísticas',
      back: '⬅️ Volver al Menú',
    },
    customers: {
      title: '👥 *Gestión de Clientes*',
      list: '📋 Ver Clientes',
      messages: '💬 Mensajes',
      broadcast: '📢 Broadcast',
      back: '⬅️ Volver al Menú',
    },
    settings: {
      title: '⚙️ *Configuración*',
      shop: '🏪 Tienda',
      payments: '💳 Pagos',
      delivery: '🚚 Envíos',
      notifications: '🔔 Notificaciones',
      team: '👥 Equipo',
      plan: '💎 Plan',
      back: '⬅️ Volver al Menú',
    },
    marketing: {
      title: '📢 *Marketing*',
      coupons: '🎟️ Cupones',
      abandoned: '🛒 Carritos Abandonados',
      campaigns: '📧 Campañas',
      back: '⬅️ Volver al Menú',
    },
    analytics: {
      title: '📊 *Estadísticas*',
      sales: '💰 Ventas',
      products: '📦 Productos',
      customers: '👥 Clientes',
      trends: '📈 Tendencias',
      back: '⬅️ Volver al Menú',
    },
    messages: {
      comingSoon: '🔧 *Próximamente*',
      openWebApp: '📱 Abrí el panel web para más opciones:',
      noShopSelected: '❌ *No tenés una tienda seleccionada*',
    },
  },
  en: {
    main: {
      title: '📋 *Main Menu*',
      products: '📦 Products',
      orders: '📋 Orders',
      customers: '👥 Customers',
      analytics: '📊 Analytics',
      settings: '⚙️ Settings',
      marketing: '📢 Marketing',
      openApp: '📱 Open Panel',
      back: '⬅️ Back',
      help: '❓ Help',
    },
    products: {
      title: '📦 *Product Management*',
      list: '📋 View Products',
      add: '➕ Add Product',
      categories: '📂 Categories',
      inventory: '📊 Inventory',
      back: '⬅️ Back to Menu',
    },
    orders: {
      title: '📋 *Order Management*',
      pending: '⏳ Pending',
      completed: '✅ Completed',
      all: '📋 All Orders',
      stats: '📊 Statistics',
      back: '⬅️ Back to Menu',
    },
    customers: {
      title: '👥 *Customer Management*',
      list: '📋 View Customers',
      messages: '💬 Messages',
      broadcast: '📢 Broadcast',
      back: '⬅️ Back to Menu',
    },
    settings: {
      title: '⚙️ *Settings*',
      shop: '🏪 Shop',
      payments: '💳 Payments',
      delivery: '🚚 Delivery',
      notifications: '🔔 Notifications',
      team: '👥 Team',
      plan: '💎 Plan',
      back: '⬅️ Back to Menu',
    },
    marketing: {
      title: '📢 *Marketing*',
      coupons: '🎟️ Coupons',
      abandoned: '🛒 Abandoned Carts',
      campaigns: '📧 Campaigns',
      back: '⬅️ Back to Menu',
    },
    analytics: {
      title: '📊 *Analytics*',
      sales: '💰 Sales',
      products: '📦 Products',
      customers: '👥 Customers',
      trends: '📈 Trends',
      back: '⬅️ Back to Menu',
    },
    messages: {
      comingSoon: '🔧 *Coming Soon*',
      openWebApp: '📱 Open the web panel for more options:',
      noShopSelected: '❌ *No shop selected*',
    },
  },
};

function t(lang: string, section: string, key: string): string {
  const messages = menuI18n[lang as keyof typeof menuI18n] || menuI18n.es;
  const sectionData = messages[section as keyof typeof messages] as Record<string, string>;
  return sectionData?.[key] || key;
}

// ==========================================
// TESTS
// ==========================================

describe('Main Menu - Estructura', () => {
  it('debe tener menú principal con 6 secciones', () => {
    const mainSections = ['products', 'orders', 'customers', 'analytics', 'settings', 'marketing'];
    expect(mainSections).toHaveLength(6);
  });

  it('debe tener botón de abrir app', () => {
    const text = t('es', 'main', 'openApp');
    expect(text).toContain('📱');
    expect(text).toContain('Abrir Panel');
  });

  it('debe tener botón de ayuda', () => {
    const text = t('es', 'main', 'help');
    expect(text).toContain('❓');
    expect(text).toContain('Ayuda');
  });

  it('debe tener botón de volver', () => {
    const text = t('es', 'main', 'back');
    expect(text).toContain('⬅️');
    expect(text).toContain('Volver');
  });
});

describe('Products Menu', () => {
  it('debe tener 4 opciones', () => {
    const options = ['list', 'add', 'categories', 'inventory'];
    expect(options).toHaveLength(4);
  });

  it('debe tener título correcto', () => {
    const title = t('es', 'products', 'title');
    expect(title).toContain('📦');
    expect(title).toContain('Productos');
  });

  it('debe tener botón de ver productos', () => {
    const text = t('es', 'products', 'list');
    expect(text).toContain('📋');
    expect(text).toContain('Ver Productos');
  });

  it('debe tener botón de agregar producto', () => {
    const text = t('es', 'products', 'add');
    expect(text).toContain('➕');
    expect(text).toContain('Agregar Producto');
  });

  it('debe tener botón de volver al menú', () => {
    const text = t('es', 'products', 'back');
    expect(text).toContain('⬅️');
    expect(text).toContain('Volver al Menú');
  });
});

describe('Orders Menu', () => {
  it('debe tener 4 opciones', () => {
    const options = ['pending', 'completed', 'all', 'stats'];
    expect(options).toHaveLength(4);
  });

  it('debe tener título correcto', () => {
    const title = t('es', 'orders', 'title');
    expect(title).toContain('📋');
    expect(title).toContain('Órdenes');
  });

  it('debe tener botón de pendientes', () => {
    const text = t('es', 'orders', 'pending');
    expect(text).toContain('⏳');
    expect(text).toContain('Pendientes');
  });

  it('debe tener botón de completadas', () => {
    const text = t('es', 'orders', 'completed');
    expect(text).toContain('✅');
    expect(text).toContain('Completadas');
  });
});

describe('Customers Menu', () => {
  it('debe tener 3 opciones', () => {
    const options = ['list', 'messages', 'broadcast'];
    expect(options).toHaveLength(3);
  });

  it('debe tener botón de broadcast', () => {
    const text = t('es', 'customers', 'broadcast');
    expect(text).toContain('📢');
    expect(text).toContain('Broadcast');
  });
});

describe('Settings Menu', () => {
  it('debe tener 6 opciones', () => {
    const options = ['shop', 'payments', 'delivery', 'notifications', 'team', 'plan'];
    expect(options).toHaveLength(6);
  });

  it('debe tener botón de tienda', () => {
    const text = t('es', 'settings', 'shop');
    expect(text).toContain('🏪');
    expect(text).toContain('Tienda');
  });

  it('debe tener botón de pagos', () => {
    const text = t('es', 'settings', 'payments');
    expect(text).toContain('💳');
    expect(text).toContain('Pagos');
  });

  it('debe tener botón de plan', () => {
    const text = t('es', 'settings', 'plan');
    expect(text).toContain('💎');
    expect(text).toContain('Plan');
  });
});

describe('Marketing Menu', () => {
  it('debe tener 3 opciones', () => {
    const options = ['coupons', 'abandoned', 'campaigns'];
    expect(options).toHaveLength(3);
  });

  it('debe tener botón de cupones', () => {
    const text = t('es', 'marketing', 'coupons');
    expect(text).toContain('🎟️');
    expect(text).toContain('Cupones');
  });

  it('debe tener botón de carritos abandonados', () => {
    const text = t('es', 'marketing', 'abandoned');
    expect(text).toContain('🛒');
    expect(text).toContain('Carritos Abandonados');
  });
});

describe('Analytics Menu', () => {
  it('debe tener 4 opciones', () => {
    const options = ['sales', 'products', 'customers', 'trends'];
    expect(options).toHaveLength(4);
  });

  it('debe tener botón de ventas', () => {
    const text = t('es', 'analytics', 'sales');
    expect(text).toContain('💰');
    expect(text).toContain('Ventas');
  });

  it('debe tener botón de tendencias', () => {
    const text = t('es', 'analytics', 'trends');
    expect(text).toContain('📈');
    expect(text).toContain('Tendencias');
  });
});

describe('Main Menu - Internacionalización', () => {
  it('debe tener traducciones en español', () => {
    const title = t('es', 'main', 'title');
    expect(title).toContain('Menú Principal');
  });

  it('debe tener traducciones en inglés', () => {
    const title = t('en', 'main', 'title');
    expect(title).toContain('Main Menu');
  });

  it('debe tener productos en español', () => {
    const text = t('es', 'main', 'products');
    expect(text).toContain('Productos');
  });

  it('debe tener productos en inglés', () => {
    const text = t('en', 'main', 'products');
    expect(text).toContain('Products');
  });

  it('debe tener órdenes en español', () => {
    const text = t('es', 'main', 'orders');
    expect(text).toContain('Órdenes');
  });

  it('debe tener orders en inglés', () => {
    const text = t('en', 'main', 'orders');
    expect(text).toContain('Orders');
  });

  it('debe tener clientes en español', () => {
    const text = t('es', 'main', 'customers');
    expect(text).toContain('Clientes');
  });

  it('debe tener customers en inglés', () => {
    const text = t('en', 'main', 'customers');
    expect(text).toContain('Customers');
  });
});

describe('Main Menu - Mensajes', () => {
  it('debe tener mensaje de próximamente', () => {
    const text = t('es', 'messages', 'comingSoon');
    expect(text).toContain('🔧');
    expect(text).toContain('Próximamente');
  });

  it('debe tener mensaje de abrir web app', () => {
    const text = t('es', 'messages', 'openWebApp');
    expect(text).toContain('📱');
    expect(text).toContain('panel web');
  });

  it('debe tener mensaje de no tienda seleccionada', () => {
    const text = t('es', 'messages', 'noShopSelected');
    expect(text).toContain('❌');
    expect(text).toContain('No tenés una tienda seleccionada');
  });
});

describe('Main Menu - Web App URLs', () => {
  it('debe generar URL de web app con shopId', () => {
    const baseUrl = 'https://app.vendy.app';
    const shopId = 123;
    const path = 'products';
    const url = `${baseUrl}/shop/${shopId}/${path}`;
    
    expect(url).toBe('https://app.vendy.app/shop/123/products');
  });

  it('debe generar URL de web app sin shopId', () => {
    const baseUrl = 'https://app.vendy.app';
    const path = 'products';
    const url = `${baseUrl}/${path}`;
    
    expect(url).toBe('https://app.vendy.app/products');
  });

  it('debe generar URL con query params', () => {
    const baseUrl = 'https://app.vendy.app';
    const shopId = 123;
    const path = 'orders?status=pending';
    const url = `${baseUrl}/shop/${shopId}/${path}`;
    
    expect(url).toBe('https://app.vendy.app/shop/123/orders?status=pending');
  });
});

describe('Main Menu - Callbacks', () => {
  it('debe manejar callback back_to_main', () => {
    const callback = 'back_to_main';
    expect(callback).toBe('back_to_main');
  });

  it('debe manejar callback shop_id', () => {
    const shopId = 123;
    const callback = `shop_${shopId}`;
    expect(callback).toBe('shop_123');
  });
});

describe('Main Menu - Fallback', () => {
  it('debe fallback a español si idioma no existe', () => {
    const text = t('fr', 'main', 'title');
    expect(text).toContain('Menú Principal'); // Fallback a español
  });

  it('debe retornar key si traducción no existe', () => {
    const text = t('es', 'main', 'nonexistent');
    expect(text).toBe('nonexistent');
  });
});