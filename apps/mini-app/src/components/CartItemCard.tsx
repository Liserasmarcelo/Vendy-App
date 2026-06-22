import { useTelegram } from '../context/TelegramContext';
import { CartItem, CartItemVariant } from '../hooks/useCart';
import { formatPrice } from '../utils/format';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: number | string, quantity: number) => void;
  onRemove: (id: number | string) => void;
  availableVariants?: Record<string, string[]>;
}

export default function CartItemCard({ item, onUpdateQuantity, onRemove, availableVariants }: CartItemCardProps) {
  const { haptic } = useTelegram();

  const handleQuantityChange = (delta: number) => {
    haptic.impact('light');
    const newQuantity = item.quantity + delta;
    onUpdateQuantity(item.id, newQuantity);
  };

  const handleRemove = () => {
    haptic.impact('medium');
    onRemove(item.id);
  };

  const originalTotal = item.originalPrice ? item.originalPrice * item.quantity : null;
  const currentTotal = item.price * item.quantity;

  return (
    <div className="telegram-card">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-dark-2 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            '📦'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{item.name}</h3>
          
          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.variants.map((variant, i) => (
                <span key={i} className="text-xs bg-dark-2 px-2 py-1 rounded-full text-gray-1">
                  {variant.name}: {variant.value}
                </span>
              ))}
            </div>
          )}
          
          {/* Price */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-vendy-primary font-bold">
              {formatPrice(item.price, item.currency)}
            </span>
            {originalTotal && originalTotal > currentTotal && (
              <span className="text-sm text-gray-1 line-through">
                {formatPrice(item.originalPrice!, item.currency)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quantity + Actions */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={item.quantity <= 1}
            className="w-8 h-8 rounded-full bg-dark-2 flex items-center justify-center disabled:opacity-50"
          >
            −
          </button>
          <span className="font-semibold w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
            className="w-8 h-8 rounded-full bg-dark-2 flex items-center justify-center disabled:opacity-50"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-bold">
            {formatPrice(currentTotal, item.currency)}
          </span>
          <button
            onClick={handleRemove}
            className="p-2 text-vendy-danger"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
