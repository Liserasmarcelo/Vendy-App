import { Link } from 'react-router-dom';
import { OrderConfirmation as OrderConfirmationType } from '../types/checkout';
import { useTelegram } from '../context/TelegramContext';

interface OrderConfirmationProps {
  confirmation: OrderConfirmationType;
  onClose: () => void;
}

export default function OrderConfirmation({ confirmation, onClose }: OrderConfirmationProps) {
  const { haptic } = useTelegram();

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(confirmation.orderNumber);
    haptic.notification('success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-1 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-vendy-success/20 rounded-full flex items-center justify-center mx-auto">
          <span className="text-4xl">✅</span>
        </div>

        <h2 className="text-xl font-bold">¡Orden Confirmada!</h2>
        
        <p className="text-gray-1">
          Tu pedido fue recibido exitosamente.
        </p>

        {/* Order Number */}
        <div className="telegram-card">
          <p className="text-sm text-gray-1">Número de orden</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-lg font-bold font-mono">{confirmation.orderNumber}</p>
            <button
              onClick={handleCopyOrderNumber}
              className="text-vendy-primary text-sm"
            >
              📋
            </button>
          </div>
        </div>

        {/* Payment Instructions */}
        {confirmation.instructions && (
          <div className="telegram-card bg-vendy-warning/10 border border-vendy-warning/30">
            <p className="text-sm font-medium mb-1">📋 Instrucciones de pago</p>
            <p className="text-sm text-gray-1">{confirmation.instructions}</p>
          </div>
        )}

        {/* Payment URL */}
        {confirmation.paymentUrl && (
          <a
            href={confirmation.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="telegram-button block"
          >
            💳 Pagar ahora
          </a>
        )}

        {/* QR Code */}
        {confirmation.qrCode && (
          <div className="telegram-card">
            <p className="text-sm text-gray-1 mb-2">Escaneá para pagar</p>
            <img src={confirmation.qrCode} alt="QR Code" className="mx-auto w-32 h-32" />
          </div>
        )}

        {/* Delivery Estimate */}
        {confirmation.estimatedDelivery && (
          <p className="text-sm text-gray-1">
            📦 Entrega estimada: <span className="text-white">{confirmation.estimatedDelivery}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="flex-1 py-3 rounded-lg bg-dark-2 text-gray-1"
          >
            Seguir comprando
          </button>
          <Link
            to="/admin/orders"
            onClick={() => haptic.impact('light')}
            className="flex-1 telegram-button py-3"
          >
            Ver mis órdenes
          </Link>
        </div>
      </div>
    </div>
  );
}
