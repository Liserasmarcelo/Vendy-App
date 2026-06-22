import { Order } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { formatPrice } from '../utils/format';
import { formatDate } from '../utils/format';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: number, status: Order['status']) => void;
  onCancel: (id: number) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pendiente', color: 'text-vendy-warning', icon: '⏳' },
  processing: { label: 'Procesando', color: 'text-vendy-primary', icon: '📦' },
  completed: { label: 'Completada', color: 'text-vendy-success', icon: '✅' },
  cancelled: { label: 'Cancelada', color: 'text-vendy-danger', icon: '❌' },
};

export default function OrderCard({ order, onUpdateStatus, onCancel }: OrderCardProps) {
  const { haptic } = useTelegram();
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  const nextStatus = (): Order['status'] | null => {
    switch (order.status) {
      case 'pending': return 'processing';
      case 'processing': return 'completed';
      default: return null;
    }
  };

  const handleAdvance = () => {
    const next = nextStatus();
    if (next) {
      haptic.impact('medium');
      onUpdateStatus(order.id, next);
    }
  };

  const handleCancel = () => {
    if (confirm('¿Cancelar esta orden?')) {
      haptic.impact('heavy');
      onCancel(order.id);
    }
  };

  return (
    <div className="telegram-card space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold">{order.orderNumber}</p>
          <p className="text-sm text-gray-1">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`font-bold ${status.color}`}>
          {status.icon} {status.label}
        </span>
      </div>

      <div className="space-y-1 text-sm">
        {order.items.map(item => (
          <div key={item.id} className="flex justify-between">
            <span className="text-gray-1">{item.name} × {item.quantity}</span>
            <span>{formatPrice(item.price * item.quantity, order.currency)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dark-2 pt-2 flex justify-between items-center">
        <span className="font-bold">{formatPrice(order.total, order.currency)}</span>
        <div className="flex gap-2">
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <>
              {nextStatus() && (
                <button
                  onClick={handleAdvance}
                  className="text-sm telegram-button py-2 px-3"
                >
                  {order.status === 'pending' ? 'Confirmar' : 'Completar'}
                </button>
              )}
              <button
                onClick={handleCancel}
                className="text-sm py-2 px-3 rounded-lg bg-vendy-danger/20 text-vendy-danger"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
