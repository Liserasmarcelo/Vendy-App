import React, { useState, useEffect } from 'react';
import { useBrand } from '../hooks/useBrand';
import { useSubscription } from '../hooks/useSubscription';
import { useBilling } from '../hooks/useBilling';
import { BrandCustomizer } from './BrandCustomizer';
import { PlanSelector } from './PlanSelector';
import { BillingDashboard } from './BillingDashboard';
import { RealtimeDashboard } from './RealtimeDashboard';
import { ReportExport } from './ReportExport';

// ==========================================
// ADMIN DASHBOARD
// ==========================================
interface AdminDashboardProps {
  shopId: number;
}

type AdminTab = 'overview' | 'brand' | 'products' | 'orders' | 'analytics' | 'billing' | 'settings';

export function AdminDashboard({ shopId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const { brand, fetchBrand } = useBrand(shopId);
  const { subscription, fetchSubscription } = useSubscription(shopId);
  const { invoices, fetchInvoices } = useBilling(shopId);

  useEffect(() => {
    fetchBrand();
    fetchSubscription();
    fetchInvoices();
  }, [fetchBrand, fetchSubscription, fetchInvoices]);

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'brand', label: 'Marca', icon: '🎨' },
    { id: 'products', label: 'Productos', icon: '📦' },
    { id: 'orders', label: 'Órdenes', icon: '🛒' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'billing', label: 'Facturación', icon: '💳' },
    { id: 'settings', label: 'Configuración', icon: '⚙️' },
  ];

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="brand-info">
          {brand?.logo && (
            <img src={brand.logo} alt={brand.name} className="brand-logo" />
          )}
          <div>
            <h1>{brand?.name || 'Mi Tienda'}</h1>
            <span className="plan-badge">{subscription?.planId || 'Inicial'}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-preview">👁️ Vista Previa</button>
          <button className="btn-help">❓ Ayuda</button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <nav className="admin-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="plan-info">
            <span>Plan: {subscription?.planId || 'Inicial'}</span>
            {subscription?.status === 'trial' && (
              <span className="trial-badge">🎁 Trial</span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'overview' && <OverviewTab shopId={shopId} />}
        {activeTab === 'brand' && <BrandCustomizer shopId={shopId} />}
        {activeTab === 'products' && <ProductsTab shopId={shopId} />}
        {activeTab === 'orders' && <OrdersTab shopId={shopId} />}
        {activeTab === 'analytics' && <AnalyticsTab shopId={shopId} />}
        {activeTab === 'billing' && <BillingDashboard shopId={shopId} />}
        {activeTab === 'settings' && <SettingsTab shopId={shopId} />}
      </main>
    </div>
  );
}

// ==========================================
// OVERVIEW TAB
// ==========================================
function OverviewTab({ shopId }: { shopId: number }) {
  const { subscription } = useSubscription(shopId);

  return (
    <div className="overview-tab">
      <h2>Resumen</h2>

      <div className="stats-grid">
        <StatCard
          title="Ventas Hoy"
          value="$1,250"
          change="+12%"
          positive
          icon="💰"
        />
        <StatCard
          title="Órdenes"
          value="25"
          change="+5"
          positive
          icon="📦"
        />
        <StatCard
          title="Visitas"
          value="340"
          change="-2%"
          positive={false}
          icon="👀"
        />
        <StatCard
          title="Conversión"
          value="7.4%"
          change="+0.5%"
          positive
          icon="📈"
        />
      </div>

      <div className="dashboard-sections">
        <section className="section">
          <h3>Actividad en Vivo</h3>
          <RealtimeDashboard shopId={shopId} />
        </section>

        <section className="section">
          <h3>Plan Actual</h3>
          {subscription ? (
            <div className="plan-summary">
              <div className="plan-name">{subscription.planId}</div>
              <div className="plan-status">Estado: {subscription.status}</div>
              <div className="plan-renewal">
                Renueva: {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES')}
              </div>
            </div>
          ) : (
            <PlanSelector shopId={shopId} />
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, positive, icon }: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        <div className={`stat-change ${positive ? 'positive' : 'negative'}`}>
          {positive ? '▲' : '▼'} {change}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PRODUCTS TAB
// ==========================================
function ProductsTab({ shopId }: { shopId: number }) {
  return (
    <div className="products-tab">
      <h2>Productos</h2>
      <div className="tab-actions">
        <button className="btn-primary">+ Nuevo Producto</button>
        <button className="btn-secondary">📤 Importar</button>
      </div>
      <p className="placeholder">Lista de productos - Implementar con tabla de productos</p>
    </div>
  );
}

// ==========================================
// ORDERS TAB
// ==========================================
function OrdersTab({ shopId }: { shopId: number }) {
  return (
    <div className="orders-tab">
      <h2>Órdenes</h2>
      <div className="tab-filters">
        <button className="filter-btn active">Todas</button>
        <button className="filter-btn">Pendientes</button>
        <button className="filter-btn">Completadas</button>
        <button className="filter-btn">Canceladas</button>
      </div>
      <p className="placeholder">Lista de órdenes - Implementar con tabla de órdenes</p>
    </div>
  );
}

// ==========================================
// ANALYTICS TAB
// ==========================================
function AnalyticsTab({ shopId }: { shopId: number }) {
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="analytics-tab">
      <h2>Analytics</h2>

      <div className="analytics-sections">
        <section>
          <h3>Métricas en Tiempo Real</h3>
          <RealtimeDashboard shopId={shopId} />
        </section>

        <section>
          <h3>Reportes</h3>
          <div className="report-actions">
            <ReportExport
              shopId={shopId}
              reportType="orders"
              startDate={lastMonth}
              endDate={today}
            />
            <ReportExport
              shopId={shopId}
              reportType="sales"
              startDate={lastMonth}
              endDate={today}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// ==========================================
// SETTINGS TAB
// ==========================================
function SettingsTab({ shopId }: { shopId: number }) {
  return (
    <div className="settings-tab">
      <h2>Configuración</h2>

      <section className="settings-section">
        <h3>General</h3>
        <div className="form-group">
          <label>Nombre de la tienda</label>
          <input type="text" placeholder="Mi Tienda" />
        </div>
        <div className="form-group">
          <label>Email de contacto</label>
          <input type="email" placeholder="contacto@mitienda.com" />
        </div>
      </section>

      <section className="settings-section">
        <h3>Notificaciones</h3>
        <label className="checkbox-label">
          <input type="checkbox" defaultChecked />
          Notificaciones de órdenes por email
        </label>
        <label className="checkbox-label">
          <input type="checkbox" defaultChecked />
          Notificaciones de órdenes por Telegram
        </label>
      </section>

      <section className="settings-section danger">
        <h3>Zona Peligrosa</h3>
        <button className="btn-danger">🗑️ Eliminar Tienda</button>
      </section>
    </div>
  );
}
