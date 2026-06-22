import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RealtimeDashboard } from '../RealtimeDashboard';
import { FunnelChart } from '../FunnelChart';

// Mock hooks
vi.mock('../../hooks/useRealtime', () => ({
  useRealtime: vi.fn().mockReturnValue({
    isConnected: true,
    metrics: {
      activeUsers: 10,
      todayOrders: 25,
      todayRevenue: 3500,
      conversionRate: 4.2,
      lastUpdate: new Date().toISOString(),
    },
    lastEvent: null,
    error: null,
  }),
}));

describe('Analytics Dashboard Integration', () => {
  it('renders real-time dashboard', () => {
    render(<RealtimeDashboard shopId={1} />);
    
    expect(screen.getByText('🟢 En vivo')).toBeInTheDocument();
    expect(screen.getByText('Usuarios Activos')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('$3,500')).toBeInTheDocument();
    expect(screen.getByText('4.2%')).toBeInTheDocument();
  });

  it('renders funnel chart', () => {
    const steps = [
      { id: 'visit', label: 'Visitas', count: 1000, conversionRate: 100, dropOffRate: 0 },
      { id: 'product', label: 'Productos', count: 600, conversionRate: 60, dropOffRate: 40 },
      { id: 'cart', label: 'Carrito', count: 300, conversionRate: 50, dropOffRate: 50 },
      { id: 'checkout', label: 'Checkout', count: 150, conversionRate: 50, dropOffRate: 50 },
      { id: 'purchase', label: 'Compra', count: 75, conversionRate: 50, dropOffRate: 50 },
    ];

    render(<FunnelChart steps={steps} title="Funnel de Compra" />);
    
    expect(screen.getByText('Funnel de Compra')).toBeInTheDocument();
    expect(screen.getByText('Visitas')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('Compra')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('shows conversion and drop-off rates', () => {
    const steps = [
      { id: 'visit', label: 'Visitas', count: 1000, conversionRate: 100, dropOffRate: 0 },
      { id: 'product', label: 'Productos', count: 600, conversionRate: 60, dropOffRate: 40 },
    ];

    render(<FunnelChart steps={steps} />);
    
    expect(screen.getByText('60.0%')).toBeInTheDocument();
    expect(screen.getByText('Abandono:')).toBeInTheDocument();
    expect(screen.getByText('40.0%')).toBeInTheDocument();
  });

  it('shows total conversion rate', () => {
    const steps = [
      { id: 'visit', label: 'Visitas', count: 1000, conversionRate: 100, dropOffRate: 0 },
      { id: 'purchase', label: 'Compra', count: 75, conversionRate: 7.5, dropOffRate: 92.5 },
    ];

    render(<FunnelChart steps={steps} />);
    
    expect(screen.getByText('Conversión Total:')).toBeInTheDocument();
    expect(screen.getByText('7.5%')).toBeInTheDocument();
  });
});
