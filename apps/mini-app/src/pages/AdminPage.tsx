import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTelegram } from '../context/TelegramContext';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { useAdminOrders } from '../hooks/useAdminOrders';
import ProductForm from '../components/ProductForm';
import OrderCard from '../components/OrderCard';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Product } from '../types';

function AdminDashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatsCard title="Ventas Hoy" value="$1,234" change="+12%" icon="💰" color="success" />
        <StatsCard title="Órdenes" value="23" change="+5%" icon="📋" color="primary" />
        <StatsCard title="Productos" value="156" change="-2%" icon="📦" color="warning" />
        <StatsCard title="Clientes" value="89" change="+8%" icon="👥" color="primary" />
      </div>

      <div className="telegram-card">
        <h3 className="font-semibold mb-3">📈 Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/admin/products" className="p-3 bg-dark-2 rounded-lg text-center">
            <span className="text-2xl">📦</span>
            <p className="text-sm mt-1">Productos</p>
          </Link>
          <Link to="/admin/orders" className="p-3 bg-dark-2 rounded-lg text-center">
            <span className="text-2xl">📋</span>
            <p className="text-sm mt-1">Órdenes</p>
          </Link>
          <Link to="/admin/settings" className="p-3 bg-dark-2 rounded-lg text-center">
            <span className="text-2xl">⚙️</span>
            <p className="text-sm mt-1">Config</p>
          </Link>
          <Link to="/admin/analytics" className="p-3 bg-dark-2 rounded-lg text-center">
            <span className="text-2xl">📊</span>
            <p className="text-sm mt-1">Analytics</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProductsAdmin() {
  const { haptic } = useTelegram();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { products, loading, isCreating, isUpdating, isDeleting, fetchProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus } = useAdminProducts({
    shopId: 1,
    status: filterStatus,
    search: searchQuery,
  });

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAdd = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSubmit = async (data: any) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await createProduct(data);
    }
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este producto?')) {
      await deleteProduct(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Productos ({products.length})</h2>
        <button onClick={handleAdd} className="telegram-button py-2 px-4 text-sm">
          ➕ Nuevo
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="telegram-input flex-1"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="telegram-input"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      {loading && <LoadingSpinner />}

      <div className="space-y-2">
        {products.map(product => (
          <div key={product.id} className="telegram-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-dark-2 rounded-lg flex items-center justify-center">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  '📦'
                )}
              </div>
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-1">${product.price} · Stock: {product.stock}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleProductStatus(product.id, !product.isActive)}
                className={`px-2 py-1 rounded text-xs ${product.isActive ? 'bg-vendy-success/20 text-vendy-success' : 'bg-vendy-danger/20 text-vendy-danger'}`}
              >
                {product.isActive ? 'Activo' : 'Inactivo'}
              </button>
              <button onClick={() => handleEdit(product)} className="p-2 text-vendy-primary">✏️</button>
              <button onClick={() => handleDelete(product.id)} className="p-2 text-vendy-danger">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          isSubmitting={isCreating || isUpdating}
        />
      )}
    </div>
  );
}

function OrdersAdmin() {
  const { haptic } = useTelegram();
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { orders, stats, loading, fetchOrders, updateOrderStatus, cancelOrder } = useAdminOrders({
    shopId: 1,
    status: filterStatus,
    dateFrom,
    dateTo,
  });

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <div className="telegram-card text-center p-2">
          <p className="text-lg font-bold">{stats.total}</p>
          <p className="text-xs text-gray-1">Total</p>
        </div>
        <div className="telegram-card text-center p-2">
          <p className="text-lg font-bold text-vendy-warning">{stats.pending}</p>
          <p className="text-xs text-gray-1">Pendientes</p>
        </div>
        <div className="telegram-card text-center p-2">
          <p className="text-lg font-bold text-vendy-primary">{stats.processing}</p>
          <p className="text-xs text-gray-1">Procesando</p>
        </div>
        <div className="telegram-card text-center p-2">
          <p className="text-lg font-bold text-vendy-success">{stats.completed}</p>
          <p className="text-xs text-gray-1">Completadas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {['', 'pending', 'processing', 'completed', 'cancelled'].map(status => (
          <button
            key={status || 'all'}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-2 rounded-full text-sm whitespace-nowrap ${
              filterStatus === status ? 'bg-vendy-primary text-white' : 'bg-dark-1 text-gray-1'
            }`}
          >
            {status === '' ? 'Todas' : status === 'pending' ? 'Pendientes' : status === 'processing' ? 'Procesando' : status === 'completed' ? 'Completadas' : 'Canceladas'}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="telegram-input flex-1"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="telegram-input flex-1"
        />
      </div>

      {loading && <LoadingSpinner />}

      <div className="space-y-2">
        {orders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onUpdateStatus={updateOrderStatus}
            onCancel={cancelOrder}
          />
        ))}
      </div>
    </div>
  );
}

function SettingsAdmin() {
  const { haptic } = useTelegram();
  const [settings, setSettings] = useState({
    name: 'Mi Tienda',
    description: 'Descripción de la tienda',
    category: 'Electrónica',
    country: 'PY',
    currency: 'USD',
    primaryColor: '#FF7403',
    whatsapp: '',
    instagram: '',
    autoConfirm: false,
    lowStockAlert: 5,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    haptic.notification('success');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Configuración</h2>

      <div className="telegram-card space-y-4">
        <div>
          <label className="block text-sm text-gray-1 mb-1">Nombre de la Tienda</label>
          <input
            type="text"
            value={settings.name}
            onChange={e => setSettings(prev => ({ ...prev, name: e.target.value }))}
            className="telegram-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-1 mb-1">Descripción</label>
          <textarea
            value={settings.description}
            onChange={e => setSettings(prev => ({ ...prev, description: e.target.value }))}
            className="telegram-input w-full h-20 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-1 mb-1">País</label>
            <select
              value={settings.country}
              onChange={e => setSettings(prev => ({ ...prev, country: e.target.value }))}
              className="telegram-input w-full"
            >
              <option value="PY">🇵🇾 Paraguay</option>
              <option value="AR">🇦🇷 Argentina</option>
              <option value="BR">🇧🇷 Brasil</option>
              <option value="UY">🇺🇾 Uruguay</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-1 mb-1">Moneda</label>
            <select
              value={settings.currency}
              onChange={e => setSettings(prev => ({ ...prev, currency: e.target.value }))}
              className="telegram-input w-full"
            >
              <option value="USD">USD - Dólar</option>
              <option value="PYG">PYG - Guaraní</option>
              <option value="ARS">ARS - Peso Argentino</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-1 mb-1">Color Principal</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings.primaryColor}
              onChange={e => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
              className="w-12 h-10 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={settings.primaryColor}
              onChange={e => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
              className="telegram-input flex-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-1 mb-1">WhatsApp</label>
            <input
              type="tel"
              placeholder="+595 981 123456"
              value={settings.whatsapp}
              onChange={e => setSettings(prev => ({ ...prev, whatsapp: e.target.value }))}
              className="telegram-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-1 mb-1">Instagram</label>
            <input
              type="text"
              placeholder="@mitienda"
              value={settings.instagram}
              onChange={e => setSettings(prev => ({ ...prev, instagram: e.target.value }))}
              className="telegram-input w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoConfirm}
              onChange={e => setSettings(prev => ({ ...prev, autoConfirm: e.target.checked }))}
              className="w-5 h-5 accent-vendy-primary"
            />
            <span>Auto-confirmar órdenes pagadas</span>
          </label>
        </div>

        <div>
          <label className="block text-sm text-gray-1 mb-1">Alerta de stock bajo</label>
          <input
            type="number"
            min="1"
            value={settings.lowStockAlert}
            onChange={e => setSettings(prev => ({ ...prev, lowStockAlert: Number(e.target.value) }))}
            className="telegram-input w-full"
          />
        </div>

        <button onClick={handleSave} className="telegram-button w-full">
          {saved ? '✅ Guardado!' : '💾 Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}

function AnalyticsAdmin() {
  const mockData = [
    { label: 'Ene', sales: 1200 },
    { label: 'Feb', sales: 1900 },
    { label: 'Mar', sales: 1500 },
    { label: 'Abr', sales: 2100 },
    { label: 'May', sales: 1800 },
    { label: 'Jun', sales: 2400 },
  ];

  const maxSales = Math.max(...mockData.map(d => d.sales));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Analytics</h2>

      <div className="grid grid-cols-2 gap-3">
        <StatsCard title="Ventas Totales" value="$12,456" change="+15%" icon="💰" color="success" />
        <StatsCard title="Ticket Promedio" value="$45.50" change="+3%" icon="🎫" color="primary" />
        <StatsCard title="Conversión" value="3.2%" change="+0.5%" icon="📈" color="warning" />
        <StatsCard title="Retención" value="68%" change="-2%" icon="🔄" color="danger" />
      </div>

      <div className="telegram-card">
        <h3 className="font-semibold mb-4">Ventas por Mes</h3>
        <div className="flex items-end gap-2 h-40">
          {mockData.map(d => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-vendy-primary rounded-t-lg transition-all"
                style={{ height: `${(d.sales / maxSales) * 100}%` }}
              />
              <span className="text-xs text-gray-1">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="telegram-card">
        <h3 className="font-semibold mb-3">Productos Más Vendidos</h3>
        <div className="space-y-2">
          {['iPhone 15 Pro', 'AirPods Pro 2', 'Camiseta Nike', 'Zapatillas Adidas'].map((name, i) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-1">#{i + 1}</span>
                <span>{name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-dark-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-vendy-primary rounded-full"
                    style={{ width: `${100 - i * 20}%` }}
                  />
                </div>
                <span className="text-sm text-gray-1">{100 - i * 20}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const location = useLocation();
  const { haptic } = useTelegram();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/products', label: 'Productos', icon: '📦' },
    { path: '/admin/orders', label: 'Órdenes', icon: '📋' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin/settings', label: 'Config', icon: '⚙️' },
  ];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Panel de Admin</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => haptic.impact('light')}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${
              isActive(item.path)
                ? 'bg-vendy-primary text-white'
                : 'bg-dark-1 text-gray-1'
            }`}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>

      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/products" element={<ProductsAdmin />} />
        <Route path="/orders" element={<OrdersAdmin />} />
        <Route path="/analytics" element={<AnalyticsAdmin />} />
        <Route path="/settings" element={<SettingsAdmin />} />
      </Routes>
    </div>
  );
}
