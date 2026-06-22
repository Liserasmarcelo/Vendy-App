import { useState } from 'react';
import { useTelegram } from '../context/TelegramContext';

interface CouponInputProps {
  coupon: { code: string; type: string; value: number } | null;
  onApply: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemove: () => void;
}

export default function CouponInput({ coupon, onApply, onRemove }: CouponInputProps) {
  const { haptic } = useTelegram();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    
    haptic.impact('medium');
    setLoading(true);
    setError('');
    
    const result = await onApply(code.trim());
    
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Error al aplicar cupón');
      haptic.notification('error');
    } else {
      setCode('');
      haptic.notification('success');
    }
  };

  if (coupon) {
    return (
      <div className="telegram-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎟️</span>
          <div>
            <p className="font-medium">{coupon.code}</p>
            <p className="text-sm text-vendy-success">
              {coupon.type === 'percentage' ? `-${coupon.value}%` : `-$${coupon.value}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            haptic.impact('light');
            onRemove();
          }}
          className="text-vendy-danger text-sm"
        >
          Quitar
        </button>
      </div>
    );
  }

  return (
    <div className="telegram-card space-y-2">
      <label className="text-sm text-gray-1">¿Tenés un cupón?</label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ingresá tu código"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="telegram-input flex-1"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="telegram-button py-2 px-4"
        >
          {loading ? '⏳' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p className="text-sm text-vendy-danger">{error}</p>
      )}
    </div>
  );
}
