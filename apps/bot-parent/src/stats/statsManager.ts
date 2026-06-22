import { ParentContext } from '../index';

// ==========================================
// TYPES
// ==========================================
export interface ShopStats {
  shopId: number;
  shopName: string;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  avgOrderValue: number;
  conversionRate: number;
  productsSold: number;
  activeProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
}

export interface GlobalStats {
  totalShops: number;
  activeShops: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  avgOrderValue: number;
  newShopsThisMonth: number;
  newOrdersThisMonth: number;
  revenueThisMonth: number;
  topShops: { name: string; revenue: number; orders: number }[];
  growthRate: number;
}

// ==========================================
// API CLIENT
// ==========================================
const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function fetchShopStats(shopId: number, adminId: number): Promise<ShopStats | null> {
  try {
    const response = await fetch(`${API_URL}/shops/${shopId}/stats?adminId=${adminId}`);
    if (!response.ok) throw new Error('Failed to fetch shop stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching shop stats:', error);
    return getMockShopStats(shopId);
  }
}

export async function fetchGlobalStats(adminId: number): Promise<GlobalStats | null> {
  try {
    const response = await fetch(`${API_URL}/admin/${adminId}/stats`);
    if (!response.ok) throw new Error('Failed to fetch global stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return getMockGlobalStats();
  }
}

export async function fetchStatsComparison(
  shopId: number,
  adminId: number,
  period: 'week' | 'month' | 'quarter' | 'year'
): Promise<{ current: ShopStats; previous: ShopStats } | null> {
  try {
    const response = await fetch(`${API_URL}/shops/${shopId}/stats/compare?adminId=${adminId}&period=${period}`);
    if (!response.ok) throw new Error('Failed to fetch comparison');
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats comparison:', error);
    return {
      current: getMockShopStats(shopId),
      previous: getMockShopStats(shopId, true),
    };
  }
}

// ==========================================
// MOCK DATA
// ==========================================
function getMockShopStats(shopId: number, previous = false): ShopStats {
  const multiplier = previous ? 0.7 : 1;
  
  return {
    shopId,
    shopName: 'TechStore PY',
    totalOrders: Math.floor(45 * multiplier),
    totalRevenue: Math.floor(12500 * multiplier),
    totalCustomers: Math.floor(32 * multiplier),
    avgOrderValue: Math.floor(278 * multiplier),
    conversionRate: 3.2 * multiplier,
    productsSold: Math.floor(67 * multiplier),
    activeProducts: 23,
    lowStockProducts: 3,
    pendingOrders: Math.floor(5 * multiplier),
    completedOrders: Math.floor(38 * multiplier),
    cancelledOrders: Math.floor(2 * multiplier),
    revenueByDay: [
      { date: '2024-06-14', revenue: Math.floor(450 * multiplier), orders: Math.floor(2 * multiplier) },
      { date: '2024-06-15', revenue: Math.floor(890 * multiplier), orders: Math.floor(3 * multiplier) },
      { date: '2024-06-16', revenue: Math.floor(320 * multiplier), orders: Math.floor(1 * multiplier) },
      { date: '2024-06-17', revenue: Math.floor(1200 * multiplier), orders: Math.floor(4 * multiplier) },
      { date: '2024-06-18', revenue: Math.floor(560 * multiplier), orders: Math.floor(2 * multiplier) },
      { date: '2024-06-19', revenue: Math.floor(780 * multiplier), orders: Math.floor(3 * multiplier) },
      { date: '2024-06-20', revenue: Math.floor(950 * multiplier), orders: Math.floor(3 * multiplier) },
    ],
    topProducts: [
      { name: 'iPhone 15 Pro', quantity: Math.floor(12 * multiplier), revenue: Math.floor(11988 * multiplier) },
      { name: 'AirPods Pro 2', quantity: Math.floor(8 * multiplier), revenue: Math.floor(1992 * multiplier) },
      { name: 'MacBook Air', quantity: Math.floor(3 * multiplier), revenue: Math.floor(3297 * multiplier) },
      { name: 'Apple Watch', quantity: Math.floor(5 * multiplier), revenue: Math.floor(1995 * multiplier) },
      { name: 'iPad Pro', quantity: Math.floor(2 * multiplier), revenue: Math.floor(1798 * multiplier) },
    ],
    ordersByStatus: [
      { status: 'completed', count: Math.floor(38 * multiplier) },
      { status: 'pending', count: Math.floor(5 * multiplier) },
      { status: 'cancelled', count: Math.floor(2 * multiplier) },
    ],
  };
}

function getMockGlobalStats(): GlobalStats {
  return {
    totalShops: 3,
    activeShops: 2,
    totalOrders: 57,
    totalRevenue: 15900,
    totalCustomers: 89,
    avgOrderValue: 279,
    newShopsThisMonth: 1,
    newOrdersThisMonth: 23,
    revenueThisMonth: 6500,
    topShops: [
      { name: 'TechStore PY', revenue: 12500, orders: 45 },
      { name: 'Moda Asunción', revenue: 3400, orders: 12 },
    ],
    growthRate: 15.5,
  };
}

// ==========================================
// FORMATTERS
// ==========================================
export function formatShopStatsMessage(stats: ShopStats): string {
  const trend = stats.conversionRate >= 3 ? '📈' : '📉';
  
  return `📊 *${stats.shopName}*

` +
    `💰 *Ingresos:* $${stats.totalRevenue.toLocaleString()}
` +
    `📋 *Órdenes:* ${stats.totalOrders}
` +
    `👥 *Clientes:* ${stats.totalCustomers}
` +
    `🎫 *Ticket Promedio:* $${stats.avgOrderValue}
` +
    `${trend} *Conversión:* ${stats.conversionRate.toFixed(1)}%

` +
    `📦 *Productos:*
` +
    `   Activos: ${stats.activeProducts}
` +
    `   Vendidos: ${stats.productsSold}
` +
    `   Stock bajo: ${stats.lowStockProducts} ⚠️

` +
    `📋 *Órdenes por estado:*
` +
    `   ✅ Completadas: ${stats.completedOrders}
` +
    `   ⏳ Pendientes: ${stats.pendingOrders}
` +
    `   ❌ Canceladas: ${stats.cancelledOrders}`;
}

export function formatGlobalStatsMessage(stats: GlobalStats): string {
  const growthEmoji = stats.growthRate >= 0 ? '📈' : '📉';
  
  return `📊 *Estadísticas Globales*

` +
    `🏪 *Tiendas:* ${stats.activeShops}/${stats.totalShops} activas
` +
    `📋 *Órdenes:* ${stats.totalOrders}
` +
    `💰 *Ingresos:* $${stats.totalRevenue.toLocaleString()}
` +
    `👥 *Clientes:* ${stats.totalCustomers}
` +
    `🎫 *Ticket Promedio:* $${stats.avgOrderValue}

` +
    `📅 *Este mes:*
` +
    `   🏪 Nuevas tiendas: ${stats.newShopsThisMonth}
` +
    `   📋 Nuevas órdenes: ${stats.newOrdersThisMonth}
` +
    `   💰 Ingresos: $${stats.revenueThisMonth.toLocaleString()}
` +
    `   ${growthEmoji} Crecimiento: ${stats.growthRate}%

` +
    `🏆 *Top Tiendas:*
` +
    stats.topShops.map((shop, i) => 
      `   ${i + 1}. ${shop.name} - $${shop.revenue.toLocaleString()} (${shop.orders} órdenes)`
    ).join('
');
}

export function formatComparisonMessage(
  current: ShopStats,
  previous: ShopStats,
  period: string
): string {
  const revenueDiff = current.totalRevenue - previous.totalRevenue;
  const revenuePct = previous.totalRevenue > 0 
    ? ((revenueDiff / previous.totalRevenue) * 100).toFixed(1) 
    : '0';
  
  const ordersDiff = current.totalOrders - previous.totalOrders;
  const ordersPct = previous.totalOrders > 0
    ? ((ordersDiff / previous.totalOrders) * 100).toFixed(1)
    : '0';
  
  const customersDiff = current.totalCustomers - previous.totalCustomers;
  
  const revenueEmoji = revenueDiff >= 0 ? '📈' : '📉';
  const ordersEmoji = ordersDiff >= 0 ? '📈' : '📉';

  return `📊 *Comparativa: ${period}*

` +
    `*${current.shopName}*

` +
    `💰 *Ingresos:*
` +
    `   Actual: $${current.totalRevenue.toLocaleString()}
` +
    `   Anterior: $${previous.totalRevenue.toLocaleString()}
` +
    `   ${revenueEmoji} ${revenueDiff >= 0 ? '+' : ''}$${revenueDiff.toLocaleString()} (${revenuePct}%)

` +
    `📋 *Órdenes:*
` +
    `   Actual: ${current.totalOrders}
` +
    `   Anterior: ${previous.totalOrders}
` +
    `   ${ordersEmoji} ${ordersDiff >= 0 ? '+' : ''}${ordersDiff} (${ordersPct}%)

` +
    `👥 *Clientes:*
` +
    `   Actual: ${current.totalCustomers}
` +
    `   Anterior: ${previous.totalCustomers}
` +
    `   ${customersDiff >= 0 ? '📈' : '📉'} ${customersDiff >= 0 ? '+' : ''}${customersDiff}`;
}

export function formatRevenueChart(stats: ShopStats): string {
  const maxRevenue = Math.max(...stats.revenueByDay.map(d => d.revenue));
  const chartWidth = 20;
  
  let text = `📈 *Ingresos últimos 7 días*

`;
  
  for (const day of stats.revenueByDay) {
    const barLength = maxRevenue > 0 ? Math.round((day.revenue / maxRevenue) * chartWidth) : 0;
    const bar = '█'.repeat(barLength);
    const date = new Date(day.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    text += `${date.padEnd(6)} ${bar} $${day.revenue}
`;
  }
  
  return text;
}

export function formatTopProducts(stats: ShopStats): string {
  return `🏆 *Productos más vendidos*

` +
    stats.topProducts.map((product, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      return `${medal} ${product.name}
   ${product.quantity} vendidos · $${product.revenue.toLocaleString()}`;
    }).join('

');
}
