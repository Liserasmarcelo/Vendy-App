import { useTelegram } from '../context/TelegramContext';
import { formatPrice } from '../utils/format';

interface ProductCardProps {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  onAddToCart: () => void;
}

export default function ProductCard({
  name,
  description,
  price,
  currency,
  image,
  onAddToCart,
}: ProductCardProps) {
  const { haptic } = useTelegram();

  const handleAdd = () => {
    haptic.impact('medium');
    haptic.notification('success');
    onAddToCart();
  };

  return (
    <div className="telegram-card flex gap-4">
      <div className="w-24 h-24 bg-dark-2 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          '📦'
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{name}</h3>
        <p className="text-sm text-gray-1 line-clamp-2">{description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-vendy-primary font-bold">
            {formatPrice(price, currency)}
          </span>
          <button
            onClick={handleAdd}
            className="telegram-button text-sm py-2 px-4"
          >
            ➕ Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
