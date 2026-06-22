import { Link } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';
import { useCart } from '../hooks/useCart';
import CartItemCard from '../components/CartItemCard';
import CartSummary from '../components/CartSummary';
import CouponInput from '../components/CouponInput';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CartPage() {
  const { haptic } = useTelegram();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    coupon,
    applyCoupon,
    removeCoupon,
    calculateShipping,
    summary,
  } = useCart();

  const handleClearCart = () => {
    haptic.impact('heavy');
    if (confirm('¿Estás seguro de que querés vaciar el carrito?')) {
      clearCart();
      haptic.notification('success');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Carrito</h1>
        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-sm text-vendy-danger"
          >
            Vaciar todo
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl">🛒</span>
          <p className="text-gray-1 mt-4">Tu carrito está vacío</p>
          <Link to="/catalog" className="telegram-button inline-block mt-4">
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="space-y-3">
            {items.map(item => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Coupon */}
          <CouponInput
            coupon={coupon}
            onApply={applyCoupon}
            onRemove={removeCoupon}
          />

          {/* Shipping Calculator */}
          <div className="telegram-card space-y-3">
            <h3 className="font-semibold">📦 Envío</h3>
            <div className="flex gap-2">
              <select
                onChange={(e) => calculateShipping(e.target.value, '')}
                className="telegram-input flex-1"
              >
                <option value="">Seleccionar país</option>
                <option value="PY">🇵🇾 Paraguay</option>
                <option value="AR">🇦🇷 Argentina</option>
                <option value="BR">🇧🇷 Brasil</option>
                <option value="UY">🇺🇾 Uruguay</option>
                <option value="CL">🇨🇱 Chile</option>
                <option value="CO">🇨🇴 Colombia</option>
                <option value="MX">🇲🇽 México</option>
                <option value="OTHER">🌍 Otro</option>
              </select>
            </div>
            {summary.shipping > 0 && (
              <p className="text-sm text-gray-1">
                Costo de envío: <span className="text-white">${summary.shipping.toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Summary */}
          <CartSummary summary={summary} currency="USD" />

          {/* Checkout Button */}
          <Link
            to="/checkout"
            onClick={() => haptic.impact('medium')}
            className="telegram-button block text-center"
          >
            💳 Proceder al Pago ({formatPrice(summary.total, 'USD')})
          </Link>
        </>
      )}
    </div>
  );
}

function formatPrice(price: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    PYG: '₲',
    ARS: '$',
    BRL: 'R$',
    EUR: '€',
  };
  const symbol = symbols[currency] || currency;
  if (currency === 'PYG') return `${symbol} ${price.toLocaleString('es-PY')}`;
  return `${symbol} ${price.toFixed(2)}`;
}
