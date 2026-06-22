import { Link } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';

export default function HomePage() {
  const { user, haptic } = useTelegram();

  const handleClick = () => {
    haptic.impact('light');
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-vendy-primary mb-2">
          Vendy
        </h1>
        <p className="text-gray-1">
          Tu tienda en Telegram
        </p>
        {user && (
          <p className="text-sm text-gray-2 mt-2">
            Hola, {user.first_name} 👋
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/catalog"
          onClick={handleClick}
          className="telegram-card flex flex-col items-center justify-center p-6 space-y-2"
        >
          <span className="text-4xl">📦</span>
          <span className="font-medium">Catálogo</span>
        </Link>

        <Link
          to="/cart"
          onClick={handleClick}
          className="telegram-card flex flex-col items-center justify-center p-6 space-y-2"
        >
          <span className="text-4xl">🛒</span>
          <span className="font-medium">Carrito</span>
        </Link>

        <Link
          to="/admin"
          onClick={handleClick}
          className="telegram-card flex flex-col items-center justify-center p-6 space-y-2"
        >
          <span className="text-4xl">⚙️</span>
          <span className="font-medium">Admin</span>
        </Link>

        <Link
          to="/checkout"
          onClick={handleClick}
          className="telegram-card flex flex-col items-center justify-center p-6 space-y-2"
        >
          <span className="text-4xl">💳</span>
          <span className="font-medium">Checkout</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="telegram-card">
        <h2 className="text-lg font-semibold mb-4">Actividad Reciente</h2>
        <p className="text-gray-1 text-sm">
          No hay actividad reciente. ¡Empezá a explorar el catálogo!
        </p>
      </div>
    </div>
  );
}
