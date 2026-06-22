import { CheckoutFormData } from '../types/checkout';
import { getFieldError, hasFieldError } from '../utils/validation';

interface CheckoutFormProps {
  formData: CheckoutFormData;
  onUpdateField: (field: keyof CheckoutFormData, value: string) => void;
  errors: ReturnType<typeof import('../utils/validation').validateCheckoutForm>;
}

const COUNTRIES = [
  { code: 'PY', name: '🇵🇾 Paraguay', phonePrefix: '+595' },
  { code: 'AR', name: '🇦🇷 Argentina', phonePrefix: '+54' },
  { code: 'BR', name: '🇧🇷 Brasil', phonePrefix: '+55' },
  { code: 'UY', name: '🇺🇾 Uruguay', phonePrefix: '+598' },
  { code: 'CL', name: '🇨🇱 Chile', phonePrefix: '+56' },
  { code: 'CO', name: '🇨🇴 Colombia', phonePrefix: '+57' },
  { code: 'MX', name: '🇲🇽 México', phonePrefix: '+52' },
  { code: 'ES', name: '🇪🇸 España', phonePrefix: '+34' },
  { code: 'US', name: '🇺🇸 Estados Unidos', phonePrefix: '+1' },
];

export default function CheckoutForm({ formData, onUpdateField, errors }: CheckoutFormProps) {
  const inputClass = (field: keyof CheckoutFormData) => 
    `telegram-input w-full ${hasFieldError(errors, field) ? 'border-vendy-danger' : ''}`;

  return (
    <div className="telegram-card space-y-4">
      <h2 className="font-semibold">📦 Datos de Envío</h2>

      {/* Full Name */}
      <div>
        <label className="block text-sm text-gray-1 mb-1">Nombre completo *</label>
        <input
          type="text"
          placeholder="Juan Pérez"
          value={formData.fullName}
          onChange={(e) => onUpdateField('fullName', e.target.value)}
          className={inputClass('fullName')}
        />
        {getFieldError(errors, 'fullName') && (
          <p className="text-xs text-vendy-danger mt-1">{getFieldError(errors, 'fullName')}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm text-gray-1 mb-1">Teléfono *</label>
        <input
          type="tel"
          placeholder="+595 981 123456"
          value={formData.phone}
          onChange={(e) => onUpdateField('phone', e.target.value)}
          className={inputClass('phone')}
        />
        {getFieldError(errors, 'phone') && (
          <p className="text-xs text-vendy-danger mt-1">{getFieldError(errors, 'phone')}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm text-gray-1 mb-1">Email (opcional)</label>
        <input
          type="email"
          placeholder="juan@email.com"
          value={formData.email}
          onChange={(e) => onUpdateField('email', e.target.value)}
          className={inputClass('email')}
        />
        {getFieldError(errors, 'email') && (
          <p className="text-xs text-vendy-danger mt-1">{getFieldError(errors, 'email')}</p>
        )}
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm text-gray-1 mb-1">País *</label>
        <select
          value={formData.country}
          onChange={(e) => onUpdateField('country', e.target.value)}
          className={inputClass('country')}
        >
          <option value="">Seleccionar país</option>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        {getFieldError(errors, 'country') && (
          <p className="text-xs text-vendy-danger mt-1">{getFieldError(errors, 'country')}</p>
        )}
      </div>

      {/* City + State */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-1 mb-1">Ciudad *</label>
          <input
            type="text"
            placeholder="Asunción"
            value={formData.city}
            onChange={(e) => onUpdateField('city', e.target.value)}
            className={inputClass('city')}
          />
          {getFieldError(errors, 'city') && (
            <p className="text-xs text-vendy-danger mt-1">{getFieldError(errors, 'city')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-1 mb-1">Estado/Provincia</label>
          <input
            type="text"
            placeholder="Central"
            value={formData.state}
            onChange={(e) => onUpdateField('state', e.target.value)}
            className="telegram-input w-full"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm text-gray-1 mb-1">Dirección *</label>
        <textarea
          placeholder="Av. España 1234, apto 5B"
          value={formData.address}
          onChange={(e) => onUpdateField('address', e.target.value)}
          className={`${inputClass('address')} h-20 resize-none`}
        />
        {getFieldError(errors, 'address') && (
          <p className="text-xs text-vendy-danger mt-1">{getFieldError(errors, 'address')}</p>
        )}
      </div>

      {/* Postal Code */}
      <div>
        <label className="block text-sm text-gray-1 mb-1">Código Postal</label>
        <input
          type="text"
          placeholder="001001"
          value={formData.postalCode}
          onChange={(e) => onUpdateField('postalCode', e.target.value)}
          className="telegram-input w-full"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-gray-1 mb-1">Notas adicionales</label>
        <textarea
          placeholder="Instrucciones de entrega, timbre, etc."
          value={formData.notes}
          onChange={(e) => onUpdateField('notes', e.target.value)}
          className="telegram-input w-full h-20 resize-none"
        />
      </div>
    </div>
  );
}
