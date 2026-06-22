import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminDashboard } from './AdminDashboard';

// Mock all hooks and child components
vi.mock('../hooks/useBrand', () => ({
  useBrand: vi.fn().mockReturnValue({
    brand: {
      shopId: 1,
      name: 'TechStore',
      logo: 'https://example.com/logo.png',
      primaryColor: '#FF7403',
    },
    fetchBrand: vi.fn(),
  }),
}));

vi.mock('../hooks/useSubscription', () => ({
  useSubscription: vi.fn().mockReturnValue({
    subscription: {
      planId: 'crecimiento',
      status: 'active',
      currentPeriodEnd: '2024-07-01',
    },
    fetchSubscription: vi.fn(),
  }),
}));

vi.mock('../hooks/useBilling', () => ({
  useBilling: vi.fn().mockReturnValue({
    invoices: [],
    fetchInvoices: vi.fn(),
  }),
}));

vi.mock('./BrandCustomizer', () => ({
  BrandCustomizer: () => <div data-testid="brand-customizer">Brand Customizer</div>,
}));

vi.mock('./PlanSelector', () => ({
  PlanSelector: () => <div data-testid="plan-selector">Plan Selector</div>,
}));

vi.mock('./BillingDashboard', () => ({
  BillingDashboard: () => <div data-testid="billing-dashboard">Billing Dashboard</div>,
}));

vi.mock('./RealtimeDashboard', () => ({
  RealtimeDashboard: () => <div data-testid="realtime-dashboard">Realtime Dashboard</div>,
}));

vi.mock('./ReportExport', () => ({
  ReportExport: () => <div data-testid="report-export">Report Export</div>,
}));

describe('AdminDashboard', () => {
  it('renders admin dashboard', () => {
    render(<AdminDashboard shopId={1} />);
    
    expect(screen.getByText('TechStore')).toBeInTheDocument();
    expect(screen.getByText('crecimiento')).toBeInTheDocument();
  });

  it('shows all navigation tabs', () => {
    render(<AdminDashboard shopId={1} />);
    
    expect(screen.getByText('📊 Resumen')).toBeInTheDocument();
    expect(screen.getByText('🎨 Marca')).toBeInTheDocument();
    expect(screen.getByText('📦 Productos')).toBeInTheDocument();
    expect(screen.getByText('🛒 Órdenes')).toBeInTheDocument();
    expect(screen.getByText('📈 Analytics')).toBeInTheDocument();
    expect(screen.getByText('💳 Facturación')).toBeInTheDocument();
    expect(screen.getByText('⚙️ Configuración')).toBeInTheDocument();
  });

  it('shows overview by default', () => {
    render(<AdminDashboard shopId={1} />);
    
    expect(screen.getByText('Resumen')).toBeInTheDocument();
    expect(screen.getByText('Ventas Hoy')).toBeInTheDocument();
    expect(screen.getByText('Órdenes')).toBeInTheDocument();
  });

  it('switches to brand tab', () => {
    render(<AdminDashboard shopId={1} />);
    
    const brandTab = screen.getByText('🎨 Marca');
    fireEvent.click(brandTab);
    
    expect(screen.getByTestId('brand-customizer')).toBeInTheDocument();
  });

  it('switches to billing tab', () => {
    render(<AdminDashboard shopId={1} />);
    
    const billingTab = screen.getByText('💳 Facturación');
    fireEvent.click(billingTab);
    
    expect(screen.getByTestId('billing-dashboard')).toBeInTheDocument();
  });

  it('shows trial badge when in trial', () => {
    vi.mocked(require('../hooks/useSubscription').useSubscription).mockReturnValueOnce({
      subscription: {
        planId: 'pro',
        status: 'trial',
        currentPeriodEnd: '2024-07-01',
      },
      fetchSubscription: vi.fn(),
    });

    render(<AdminDashboard shopId={1} />);
    
    expect(screen.getByText('🎁 Trial')).toBeInTheDocument();
  });

  it('shows stat cards with changes', () => {
    render(<AdminDashboard shopId={1} />);
    
    expect(screen.getByText('$1,250')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows header actions', () => {
    render(<AdminDashboard shopId={1} />);
    
    expect(screen.getByText('👁️ Vista Previa')).toBeInTheDocument();
    expect(screen.getByText('❓ Ayuda')).toBeInTheDocument();
  });

  it('shows plan info in sidebar', () => {
    render(<AdminDashboard shopId={1} />);
    
    expect(screen.getByText('Plan: crecimiento')).toBeInTheDocument();
  });
});
