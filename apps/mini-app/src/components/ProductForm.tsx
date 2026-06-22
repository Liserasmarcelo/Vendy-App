import { useState } from 'react';
import { Product } from '../types';
import { useTelegram } from '../context/TelegramContext';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const CATEGORIES = [
  'Electrónica', 'Moda', 'Hogar', 'Deportes', 'Belleza', 'Alimentos', 'Juguetes', 'Libros', 'Salud', 'Otros'
];

const CURRENCIES = ['USD', 'PYG', 'ARS', 'BRL', 'UYU', 'CLP', 'COP', 'MXN', 'EUR'];

export default function ProductForm({ product, onSubmit, onCancel, isSubmitting }: ProductFormProps) {
  const { haptic } = useTelegram();
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    currency: product?.currency || 'USD',
    category: product?.category || 'Electrónica',
    stock: product?.stock || 0,
    images: product?.images?.join(',') || '',
    isActive: product?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) newErrors.name = 'Nombre requerido (mín 2 chars)';
    if (form.price <= 0) newErrors.price = 'Precio debe ser mayor a 0';
    if (form.stock < 0) newErrors.stock = 'Stock no puede ser negativo';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      haptic.notification('error');
      return;
    }
    haptic.impact('medium');
    await onSubmit({
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      images: form.images.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-dark-1 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{product ? 'Editar' : 'Nuevo'} Producto</h2>
          <button onClick={onCancel} className="text-gray-1">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-1 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              className={`telegram-input w-full ${errors.name ? 'border-vendy-danger' : ''}`}
            />
            {errors.name && <p className="text-xs text-vendy-danger mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-1 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              className="telegram-input w-full h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-1 mb-1">Precio *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => updateField('price', e.target.value)}
                className={`telegram-input w-full ${errors.price ? 'border-vendy-danger' : ''}`}
              />
              {errors.price && <p className="text-xs text-vendy-danger mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-1 mb-1">Moneda</label>
              <select
                value={form.currency}
                onChange={e => updateField('currency', e.target.value)}
                className="telegram-input w-full"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-1 mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={e => updateField('category', e.target.value)}
                className="telegram-input w-full"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-1 mb-1">Stock *</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={e => updateField('stock', e.target.value)}
                className={`telegram-input w-full ${errors.stock ? 'border-vendy-danger' : ''}`}
              />
              {errors.stock && <p className="text-xs text-vendy-danger mt-1">{errors.stock}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-1 mb-1">Imágenes (URLs separadas por coma)</label>
            <input
              type="text"
              placeholder="https://..."
              value={form.images}
              onChange={e => updateField('images', e.target.value)}
              className="telegram-input w-full"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => updateField('isActive', e.target.checked)}
              className="w-5 h-5 accent-vendy-primary"
            />
            <span>Producto activo</span>
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-lg bg-dark-2 text-gray-1">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 telegram-button"
          >
            {isSubmitting ? '⏳ Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
