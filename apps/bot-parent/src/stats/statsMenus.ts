import { Menu } from '@grammyjs/menu';
import { ParentContext } from '../index';
import {
  ShopStats,
  GlobalStats,
  fetchShopStats,
  fetchGlobalStats,
  fetchStatsComparison,
  formatShopStatsMessage,
  formatGlobalStatsMessage,
  formatComparisonMessage,
  formatRevenueChart,
  formatTopProducts,
} from './statsManager';

// ==========================================
// SHOP STATS MENU
// ==========================================
export function createShopStatsMenu(shopId: number): Menu<ParentContext> {
  const menu = new Menu<ParentContext>(`shop-stats-${shopId}`);

  menu.text('📈 Ingresos', async (ctx) => {
    await showRevenueChart(ctx, shopId);
  });

  menu.text('🏆 Productos', async (ctx) => {
    await showTopProducts(ctx, shopId);
  });
  menu.row();

  menu.text('📊 Comparar', async (ctx) => {
    await ctx.reply('📊 *Período de comparación*

Seleccioná:', {
      reply_markup: createComparisonPeriodMenu(shopId),
    });
  });

  menu.text('📥 Exportar', async (ctx) => {
    await ctx.reply('📥 *Exportar datos*

Próximamente podrás exportar a CSV/Excel.');
  });
  menu.row();

  menu.text('⬅️ Volver', async (ctx) => {
    await ctx.reply('🏪 Volviendo a tienda...');
    // In production: call showShopDetail from shops module
  });

  return menu;
}

// ==========================================
// COMPARISON PERIOD MENU
// ==========================================
function createComparisonPeriodMenu(shopId: number): Menu<ParentContext> {
  const menu = new Menu<ParentContext>(`stats-compare-${shopId}`);

  menu.text('📅 Semana', async (ctx) => {
    await showComparison(ctx, shopId, 'week');
  });

  menu.text('📅 Mes', async (ctx) => {
    await showComparison(ctx, shopId, 'month');
  });
  menu.row();

  menu.text('📅 Trimestre', async (ctx) => {
    await showComparison(ctx, shopId, 'quarter');
  });

  menu.text('📅 Año', async (ctx) => {
    await showComparison(ctx, shopId, 'year');
  });
  menu.row();

  menu.text('⬅️ Volver', async (ctx) => {
    await showShopStats(ctx, shopId);
  });

  return menu;
}

// ==========================================
// GLOBAL STATS MENU
// ==========================================
export function createGlobalStatsMenu(): Menu<ParentContext> {
  const menu = new Menu<ParentContext>('global-stats');

  menu.text('🏪 Tiendas', async (ctx) => {
    await ctx.reply('🏪 *Tiendas*

Próximamente: lista detallada de tiendas.');
  });

  menu.text('📋 Órdenes', async (ctx) => {
    await ctx.reply('📋 *Órdenes*

Próximamente: lista de órdenes recientes.');
  });
  menu.row();

  menu.text('📥 Exportar', async (ctx) => {
    await ctx.reply('📥 *Exportar*

Próximamente: exportar reporte completo.');
  });

  menu.text('⬅️ Volver', async (ctx) => {
    await ctx.reply('👋 Menú principal');
    // In production: show admin menu
  });

  return menu;
}

// ==========================================
// HANDLERS
// ==========================================
export async function showShopStats(ctx: ParentContext, shopId: number) {
  const adminId = ctx.from?.id;
  if (!adminId) {
    await ctx.reply('❌ Error: No se pudo identificar tu usuario.');
    return;
  }

  await ctx.reply('⏳ Cargando estadísticas...');

  const stats = await fetchShopStats(shopId, adminId);
  if (!stats) {
    await ctx.reply('❌ No se pudieron cargar las estadísticas.');
    return;
  }

  const menu = createShopStatsMenu(shopId);
  // In production: bot.use(menu)

  await ctx.reply(formatShopStatsMessage(stats), {
    reply_markup: menu,
    parse_mode: 'Markdown',
  });
}

export async function showRevenueChart(ctx: ParentContext, shopId: number) {
  const adminId = ctx.from?.id;
  if (!adminId) return;

  const stats = await fetchShopStats(shopId, adminId);
  if (!stats) {
    await ctx.reply('❌ Error al cargar datos.');
    return;
  }

  await ctx.reply(formatRevenueChart(stats), {
    parse_mode: 'Markdown',
    reply_markup: createShopStatsMenu(shopId),
  });
}

export async function showTopProducts(ctx: ParentContext, shopId: number) {
  const adminId = ctx.from?.id;
  if (!adminId) return;

  const stats = await fetchShopStats(shopId, adminId);
  if (!stats) {
    await ctx.reply('❌ Error al cargar datos.');
    return;
  }

  await ctx.reply(formatTopProducts(stats), {
    parse_mode: 'Markdown',
    reply_markup: createShopStatsMenu(shopId),
  });
}

export async function showComparison(
  ctx: ParentContext,
  shopId: number,
  period: 'week' | 'month' | 'quarter' | 'year'
) {
  const adminId = ctx.from?.id;
  if (!adminId) return;

  await ctx.reply(`⏳ Comparando período: ${period}...`);

  const comparison = await fetchStatsComparison(shopId, adminId, period);
  if (!comparison) {
    await ctx.reply('❌ Error al cargar comparativa.');
    return;
  }

  const periodLabels = {
    week: 'Semana',
    month: 'Mes',
    quarter: 'Trimestre',
    year: 'Año',
  };

  await ctx.reply(
    formatComparisonMessage(comparison.current, comparison.previous, periodLabels[period]),
    {
      parse_mode: 'Markdown',
      reply_markup: createShopStatsMenu(shopId),
    }
  );
}

export async function showGlobalStats(ctx: ParentContext) {
  const adminId = ctx.from?.id;
  if (!adminId) {
    await ctx.reply('❌ Error: No se pudo identificar tu usuario.');
    return;
  }

  await ctx.reply('⏳ Cargando estadísticas globales...');

  const stats = await fetchGlobalStats(adminId);
  if (!stats) {
    await ctx.reply('❌ No se pudieron cargar las estadísticas.');
    return;
  }

  const menu = createGlobalStatsMenu();
  // In production: bot.use(menu)

  await ctx.reply(formatGlobalStatsMessage(stats), {
    reply_markup: menu,
    parse_mode: 'Markdown',
  });
}
