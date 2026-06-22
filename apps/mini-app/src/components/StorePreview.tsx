import React from 'react';
import { useBrand } from '../hooks/useBrand';

// ==========================================
// STORE PREVIEW
// ==========================================
interface StorePreviewProps {
  shopId: number;
}

export function StorePreview({ shopId }: StorePreviewProps) {
  const { brand } = useBrand(shopId);

  return (
    <div className="store-preview">
      <div className="preview-header">
        <h2>👁️ Vista Previa de Tienda</h2>
        <p>Así ven tu tienda los clientes</p>
      </div>

      <div className="preview-frame">
        <div
          className="preview-store"
          style={{
            '--brand-primary': brand?.primaryColor || '#FF7403',
            '--brand-secondary': brand?.secondaryColor || '#333',
            '--brand-accent': brand?.accentColor || '#2196F3',
            '--brand-font': brand?.fontFamily || 'Inter',
          } as React.CSSProperties}
        >
          {/* Store Header */}
          <header className="store-header">
            {brand?.logo ? (
              <img src={brand.logo} alt={brand.name} className="store-logo" />
            ) : (
              <div className="store-logo-placeholder">
                {brand?.name?.charAt(0) || 'T'}
              </div>
            )}
            <h1 className="store-name">{brand?.name || 'Mi Tienda'}</h1>
            {brand?.description && (
              <p className="store-description">{brand.description}</p>
            )}
          </header>

          {/* Store Navigation */}
          <nav className="store-nav">
            <a href="#" className="nav-link active">Inicio</a>
            <a href="#" className="nav-link">Productos</a>
            <a href="#" className="nav-link">Ofertas</a>
            <a href="#" className="nav-link">Contacto</a>
          </nav>

          {/* Store Hero */}
          <section className="store-hero">
            <h2>Bienvenido a {brand?.name || 'nuestra tienda'}</h2>
            <p>Descubre nuestros productos increíbles</p>
            <button className="hero-cta">Ver Productos</button>
          </section>

          {/* Store Products */}
          <section className="store-products">
            <h3>Productos Destacados</h3>
            <div className="products-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="product-card">
                  <div className="product-image" style={{ backgroundColor: '#f0f0f0' }}>
                    📷
                  </div>
                  <h4 className="product-name">Producto {i}</h4>
                  <p className="product-price">$99.99</p>
                  <button className="product-btn">Agregar al Carrito</button>
                </div>
              ))}
            </div>
          </section>

          {/* Store Footer */}
          <footer className="store-footer">
            <p>© 2024 {brand?.name || 'Mi Tienda'}. Todos los derechos reservados.</p>
          </footer>
        </div>
      </div>

      <div className="preview-devices">
        <button className="device-btn active">📱 Mobile</button>
        <button className="device-btn">💻 Desktop</button>
      </div>
    </div>
  );
}
