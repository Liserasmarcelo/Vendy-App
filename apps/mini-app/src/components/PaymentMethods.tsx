import { PaymentMethod } from '../types/checkout';
import { useTelegram } from '../context/TelegramContext';

interface PaymentMethodsProps {
  methods: PaymentMethod[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function PaymentMethods({ methods, selectedId, onSelect }: PaymentMethodsProps) {
  const { haptic } = useTelegram();

  return (
    <div className="telegram-card space-y-3">
      <h2 className="font-semibold">💳 Método de Pago</h2>

      <div className="space-y-2">
        {methods.filter(m => m.enabled).map(method => (
          <label
            key={method.id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              selectedId === method.id
                ? 'bg-vendy-primary/20 border border-vendy-primary'
                : 'bg-dark-2 border border-transparent'
            }`}
          >
            <input
              type="radio"
              name="payment"
              value={method.id}
              checked={selectedId === method.id}
              onChange={() => {
                haptic.impact('light');
                onSelect(method.id);
              }}
              className="hidden"
            />
            <span className="text-2xl">{method.icon}</span>
            <div className="flex-1">
              <p className="font-medium">{method.name}</p>
              <p className="text-sm text-gray-1">{method.description}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedId === method.id ? 'border-vendy-primary' : 'border-gray-2'
            }`}>
              {selectedId === method.id && (
                <div className="w-3 h-3 rounded-full bg-vendy-primary" />
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Disabled methods info */}
      {methods.some(m => !m.enabled) && (
        <p className="text-xs text-gray-1 text-center">
          Más métodos de pago próximamente
        </p>
      )}
    </div>
  );
}
