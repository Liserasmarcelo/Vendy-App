import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RealtimeDashboard } from './RealtimeDashboard';

// Mock useRealtime
vi.mock('../hooks/useRealtime', () => ({
  useRealtime: vi.fn().mockReturnValue({
    isConnected: true,
    metrics: {
      activeUsers: 5,
      todayOrders: 12,
      todayRevenue: 1500,
      conversionRate: 3.5,
      lastUpdate: new Date().toISOString(),
    },
    lastEvent: null,
    error: null,
  }),
}));

describe('RealtimeDashboard', () => {
  it('renders connected status', () => {
    render(<RealtimeDashboard shopId={1} />);
    expect(screen.getByText('🟢 En vivo')).toBeInTheDocument();
  });

  it('renders metric cards', () => {
    render(<RealtimeDashboard shopId={1} />);
    expect(screen.getByText('Usuarios Activos')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Órdenes Hoy')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Ingresos Hoy')).toBeInTheDocument();
    expect(screen.getByText('$1,500')).toBeInTheDocument();
    expect(screen.getByText('Conversión')).toBeInTheDocument();
    expect(screen.getByText('3.5%')).toBeInTheDocument();
  });

  it('renders last update time', () => {
    render(<RealtimeDashboard shopId={1} />);
    expect(screen.getByText(/Última actualización/)).toBeInTheDocument();
  });
});

describe('RealtimeDashboard disconnected', () => {
  it('renders disconnected status', () => {
    vi.mocked(require('../hooks/useRealtime').useRealtime).mockReturnValueOnce({
      isConnected: false,
      metrics: null,
      lastEvent: null,
      error: 'Connection lost',
    });

    render(<RealtimeDashboard shopId={1} />);
    expect(screen.getByText('🔴 Desconectado')).toBeInTheDocument();
  });
});
