import { useState, useCallback } from 'react';
import { useTelegram } from '../context/TelegramContext';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import FilterDrawer from '../components/FilterDrawer';
import InfiniteScroll from '../components/InfiniteScroll';
import { useCart } from '../hooks/useCart';

const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: '📦' },
  { id: 'electronics', name: 'Electrónica', icon: '💻' },
  { id: 'fashion', name: 'Moda', icon: '👗' },
  { id: 'home', name: 'Hogar', icon: '🏠' },
  { id: 'sports', name: 'Deportes', icon: '⚽' },
  { id: 'beauty', name: 'Belleza', icon: '💄' },
  { id: 'food', name: 'Alimentos', icon: '🍔' },
  { id: 'toys', name: 'Juguetes', icon: '🧸' },
  { id: 'books', name: 'Libros', icon: '📚' },
  { id: 'health', name: 'Salud', icon: '💊' },
];

export default function CatalogPage() {
  const { haptic } = useTelegram();
  const { addItem } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    inStock: undefined as boolean | undefined,
    sortBy: undefined as 'price_asc' | 'price_desc' | 'name' | 'newest' | undefined,
  });

  const {
    products,
    total,
    hasMore,
    loading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
  } = useProducts({
    category: selectedCategory,
    search: searchQuery || undefined,
    ...filters,
    limit: 10,
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    haptic.impact('light');
  }, [haptic]);

  const handleCategoryChange = useCallback((category: string) => {
    haptic.impact('light');
    setSelectedCategory(category);
  }, [haptic]);

  const handleAddToCart = useCallback((product: any) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      image: product.images?.[0],
    });
    haptic.notification('success');
  }, [addItem, haptic]);

  const handleApplyFilters = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <span className="text-sm text-gray-1">{total} productos</span>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="🔍 Buscar productos..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="telegram-input w-full pl-10"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-1">🔍</span>
        </div>
        <button
          onClick={() => {
            haptic.impact('light');
            setShowFilters(true);
          }}
          className={`p-3 rounded-lg ${
            Object.values(filters).some(v => v !== undefined)
              ? 'bg-vendy-primary text-white'
              : 'bg-dark-1 text-gray-1'
          }`}
        >
          ⚙️
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-vendy-primary text-white'
                : 'bg-dark-1 text-gray-1'
            }`}
          >
            <span>{cat.icon}</span>
            <span className="text-sm">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="telegram-card text-center py-8">
          <span className="text-4xl">😵</span>
          <p className="text-vendy-danger mt-2">{error}</p>
          <button onClick={refresh} className="telegram-button mt-4">
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !products.length && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Products */}
      {!loading && products.length === 0 && !error && (
        <div className="text-center py-12">
          <span className="text-6xl">📭</span>
          <p className="text-gray-1 mt-4">No se encontraron productos</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setFilters({});
              haptic.impact('light');
            }}
            className="telegram-button mt-4"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {products.length > 0 && (
        <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} isLoading={isLoadingMore}>
          <div className="space-y-3">
            {products.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                currency={product.currency}
                image={product.images?.[0]}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        </InfiniteScroll>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleApplyFilters}
        currency="USD"
      />
    </div>
  );
}
