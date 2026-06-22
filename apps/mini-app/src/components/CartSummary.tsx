import { CartSummary as CartSummaryType } from '../hooks/useCart';
import { formatPrice } from '../utils/format';

interface CartSummaryProps {
  summary: CartSummaryType;
  currency: string;
}

export default function CartSummary({ summary, currency }: CartSummaryProps) {
  const { subtotal, discount, shipping, tax, total, itemCount } = summary;

  return (
    <div className="telegram-card space-y-3">
      <h3 className="font-semibold">Resumen</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-1">Subtotal ({itemCount} items)</span>
          <span>{formatPrice(subtotal, currency)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-vendy-success">
            <span>Descuento</span>
            <span>-{formatPrice(discount, currency)}</span>
          </div>
        )}
        
        {shipping > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-1">Envío</span>
            <span>{formatPrice(shipping, currency)}</span>
          </div>
        )}
        
        {tax > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-1">Impuestos (5%)</span>
            <span>{formatPrice(tax, currency)}</span>
          </div>
        )}
        
        <div className="border-t border-dark-2 pt-2 flex justify-between">
          <span className="font-bold">Total</span>
          <span className="text-xl font-bold text-vendy-primary">
            {formatPrice(total, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
