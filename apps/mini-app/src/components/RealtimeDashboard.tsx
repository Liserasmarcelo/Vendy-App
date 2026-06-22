import React from 'react';
import { useRealtime } from '../hooks/useRealtime';

// ==========================================
// REALTIME DASHBOARD COMPONENT
// ==========================================
interface RealtimeDashboardProps {
  shopId: number;
}

export function RealtimeDashboard({ shopId }: RealtimeDashboardProps) {
  const { isConnected, metrics, error } = useRealtime(shopId);

  return (
    <div className="realtime-dashboard">
      {/* Connection status */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 En vivo' : '🔴 Desconectado'}
        {error && <span className="error"> - {error}</span>}
      </div>

      {/* Metrics cards */}
      {metrics && (
        <div className="metrics-grid">
          <MetricCard
            label="Usuarios Activos"
            value={metrics.activeUsers}
            icon="👥"
            color="#4CAF50"
          />
          <MetricCard
            label="Órdenes Hoy"
            value={metrics.todayOrders}
            icon="📦"
            color="#2196F3"
          />
          <MetricCard
            label="Ingresos Hoy"
            value={`$${metrics.todayRevenue.toLocaleString()}`}
            icon="💰"
            color="#FF9800"
          />
          <MetricCard
            label="Conversión"
            value={`${metrics.conversionRate.toFixed(1)}%`}
            icon="📈"
            color="#9C27B0"
          />
        </div>
      )}

      {/* Last update */}
      {metrics?.lastUpdate && (
        <div className="last-update">
          Última actualización: {new Date(metrics.lastUpdate).toLocaleTimeString('es-ES')}
        </div>
      )}
    </div>
  );
}

// ==========================================
// METRIC CARD
// ==========================================
interface MetricCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <div className="metric-card" style={{ borderLeftColor: color }}>
      <div className="metric-icon" style={{ color }}>{icon}</div>
      <div className="metric-content">
        <div className="metric-value" style={{ color }}>{value}</div>
        <div className="metric-label">{label}</div>
      </div>
    </div>
  );
}
