export {
  fetchShopStats,
  fetchGlobalStats,
  fetchStatsComparison,
  formatShopStatsMessage,
  formatGlobalStatsMessage,
  formatComparisonMessage,
  formatRevenueChart,
  formatTopProducts,
} from './statsManager';

export {
  showShopStats,
  showRevenueChart,
  showTopProducts,
  showComparison,
  showGlobalStats,
  createShopStatsMenu,
  createGlobalStatsMenu,
} from './statsMenus';

export type {
  ShopStats,
  GlobalStats,
} from './statsManager';
