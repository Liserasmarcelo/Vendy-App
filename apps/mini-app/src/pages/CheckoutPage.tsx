import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';
import { useCart } from '../hooks/useCart';
import { useCheckout } from '../hooks/useCheckout';
import CheckoutForm from '../components/CheckoutForm';
import PaymentMethods from '../components/PaymentMethods';
import OrderConfirmation from '../components/OrderConfirmation';
import CartSummary from '../components/CartSummary';
import { formatPrice } from '../utils/format';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();
  const { items, summary, coupon, clearCart } = useCart();
  const {
    formData,
    updateField,
    selectedPayment,
    selectPayment,
    paymentMethods,
    errors,
    isSubmitting,
    confirmation,
    submitOrder,
  } = useCheckout();
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Redirect if cart is empty
  if (items.length === 0 && !confirmation) {
    return (
      <div className="p-4 text-center py-12">
        <span className="text-6xl">🛒</span>
        <p className="text-gray-1 mt-4">Tu carrito está vacío</p>
        <button
          onClick={() => navigate('/catalog')}
          className="telegram-button mt-4"
        >
          Explorar Catálogo
        </button>
      </div>
    );
  }

  const handleSubmit = async () => {
    const result = await submitOrder(items, summary, 1, 'USD');
    
    if (result.success && result.confirmation) {
      setShowConfirmation(true);
      // Don't clear cart yet for Stripe payments
      if (selectedPayment !== 'stripe') {
        clearCart();
      }
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    clearCart();
    navigate('/');
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-vendy-primary">1. Datos</span>
        <span className="text-gray-2">→</span>
        <span className="text-vendy-primary">2. Pago</span>
        <span className="text-gray-2">→</span>
        <span className="text-gray-1">3. Confirmar</span>
      </div>

      {/* Cart Items Summary */}
      <div className="telegram-card space-y-2">
        <h2 className="font-semibold">📦 Tu Pedido ({summary.itemCount} items)</h2>
        {items.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-1">
              {item.name} × {item.quantity}
            </span>
            <span>{formatPrice(item.price * item.quantity, item.currency)}</span>
          </div>
        ))}
      </div>

      {/* Checkout Form */}
      <CheckoutForm
        formData={formData}
        onUpdateField={updateField}
        errors={errors}
      />

      {/* Payment Methods */}
      <PaymentMethods
        methods={paymentMethods}
        selectedId={selectedPayment}
        onSelect={selectPayment}
      />

      {/* Order Summary */}
      <CartSummary summary={summary} currency="USD" />

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="telegram-button w-full"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Procesando...
          </span>
        ) : (
          `💳 Confirmar y Pagar ${formatPrice(summary.total, 'USD')}`
        )}
      </button>

      {/* Security Note */}
      <p className="text-xs text-gray-1 text-center">
        🔒 Tu información está protegida. Pagos procesados de forma segura.
      </p>

      {/* Order Confirmation Modal */}
      {showConfirmation && confirmation && (
        <OrderConfirmation
          confirmation={confirmation}
          onClose={handleCloseConfirmation}
        />
      )}
    </div>
  );
}
