import { useState } from 'react';
import { useTelegram } from '../context/TelegramContext';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: 'price_asc' | 'price_desc' | 'name' | 'newest';
  };
  onApply: (filters: FilterDrawerProps['filters']) => void;
  currency: string;
}

export default function FilterDrawer({ isOpen, onClose, filters, onApply, currency }: FilterDrawerProps) {
  const { haptic } = useTelegram();
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    haptic.impact('medium');
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    haptic.impact('light');
    setLocalFilters({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="absolute bottom-0 left-0 right-0 bg-dark-1 rounded-t-2xl p-4 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Filtros</h2>
          <button onClick={onClose} className="text-gray-1">✕</button>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm text-gray-1 mb-2">Ordenar por</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'price_asc', label: `💰 Menor ${currency}` },
              { value: 'price_desc', label: `💰 Mayor ${currency}` },
              { value: 'name', label: '📝 Nombre' },
              { value: 'newest', label: '🆕 Nuevos' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setLocalFilters(prev => ({ ...prev, sortBy: option.value as any }))}
                className={`p-2 rounded-lg text-sm ${
                  localFilters.sortBy === option.value
                    ? 'bg-vendy-primary text-white'
                    : 'bg-dark-2 text-gray-1'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm text-gray-1 mb-2">Rango de precio ({currency})</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={localFilters.minPrice || ''}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, minPrice: Number(e.target.value) || undefined }))}
              className="telegram-input flex-1"
            />
            <input
              type="number"
              placeholder="Max"
              value={localFilters.maxPrice || ''}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) || undefined }))}
              className="telegram-input flex-1"
            />
          </div>
        </div>

        {/* Stock */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={localFilters.inStock || false}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, inStock: e.target.checked }))}
            className="w-5 h-5 accent-vendy-primary"
          />
          <span>Solo productos en stock</span>
        </label>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button onClick={handleReset} className="flex-1 py-3 rounded-lg bg-dark-2 text-gray-1">
            Limpiar
          </button>
          <button onClick={handleApply} className="flex-1 telegram-button">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
