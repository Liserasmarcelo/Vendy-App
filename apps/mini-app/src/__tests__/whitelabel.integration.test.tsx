import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminDashboard } from '../components/AdminDashboard';
import { BrandCustomizer } from '../components/BrandCustomizer';
import { PlanSelector } from '../components/PlanSelector';
import { BillingDashboard } from '../components/BillingDashboard';

// Mock hooks
vi.mock('../hooks/useBrand', () => ({
  useBrand: vi.fn().mockReturnValue({
    brand: {
      shopId: 1,
      name: 'TechStore',
      description: 'Tech products',
      primaryColor: '#FF7403',
      secondaryColor: '#333',
      accentColor: '#2196F3',
      fontFamily: 'Inter',
      customDomain: 'techstore.com',
      subdomain: 'shop',
      logo: 'https://example.com/logo.png',
    },
    fetchBrand: vi.fn(),
    updateBrand: vi.fn().mockResolvedValue({}),
    validateDomain: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
    configureDomain: vi.fn().mockResolvedValue({
      domain: 'techstore.com',
      dnsRecords: [
        { type: 'CNAME', name: 'techstore.com', value: 'shops.vendy.com' },
      ],
    }),
  }),
}));

vi.mock('../hooks/useSubscription', () => ({
  useSubscription: vi.fn().mockReturnValue({
    subscription: {
      planId: 'pro',
      status: 'active',
      currentPeriodEnd: '2024-07-01',
    },
    fetchSubscription: vi.fn(),
    plans: [
      { id: 'inicial', name: 'Inicial', price: 0 },
      { id: 'crecimiento', name: 'Crecimiento', price: 15 },
      { id: 'pro', name: 'Pro', price: 49 },
    ],
  }),
}));

vi.mock('../hooks/useBilling', () => ({
  useBilling: vi.fn().mockReturnValue({
    invoices: [
      { id: 'inv_1', amount: 49, status: 'paid', description: 'Monthly', createdAt: '2024-06-01' },
    ],
    paymentMethods: [
      { id: 'pm_1', type: 'card', last4: '4242', brand: 'visa', isDefault: true },
    ],
    fetchInvoices: vi.fn(),
    fetchPaymentMethods: vi.fn(),
  }),
}));

vi.mock('../hooks/useRealtime', () => ({
  useRealtime: vi.fn().mockReturnValue({
    metrics: { sales: 1250, orders: 25, visitors: 340 },
    isConnected: true,
  }),
}));

vi.mock('../hooks/useAnalytics', () => ({
  useAnalytics: vi.fn().mockReturnValue({
    track: vi.fn(),
  }),
}));

// Mock child components
vi.mock('../components/RealtimeDashboard', () => ({
  RealtimeDashboard: () => <div data-testid="realtime">Realtime</div>,
}));

vi.mock('../components/ReportExport', () => ({
  ReportExport: () => <div data-testid="report-export">Export</div>,
}));

describe('Admin Dashboard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders complete admin dashboard', () => {
    render(<AdminDashboard shopId={1} />);
    
    expect(screen.getByText('TechStore')).toBeInTheDocument();
    expect(screen.getByText('pro')).toBeInTheDocument();
    expect(screen.getByText('📊 Resumen')).toBeInTheDocument();
  });

  it('navigates between tabs', () => {
    render(<AdminDashboard shopId={1} />);
    
    // Click brand tab
    fireEvent.click(screen.getByText('🎨 Marca'));
    expect(screen.getByText('🎨 Personalización de Marca')).toBeInTheDocument();
    
    // Click billing tab
    fireEvent.click(screen.getByText('💳 Facturación'));
    expect(screen.getByText('💳 Facturación')).toBeInTheDocument();
  });

  it('shows brand info in header', () => {
    render(<AdminDashboard shopId={1} />);
    
    expect(screen.getByText('TechStore')).toBeInTheDocument();
    expect(screen.getByText('pro')).toBeInTheDocument();
  });

  it('shows plan in sidebar', () => {
    render(<AdminDashboard shopId={1} />);
    
    expect(screen.getByText('Plan: pro')).toBeInTheDocument();
  });
});

describe('Brand Customizer Integration', () => {
  it('loads and displays brand data', () => {
    render(<BrandCustomizer shopId={1} />);
    
    expect(screen.getByDisplayValue('TechStore')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tech products')).toBeInTheDocument();
  });

  it('updates brand and shows preview', async () => {
    render(<BrandCustomizer shopId={1} />);
    
    const nameInput = screen.getByLabelText('Nombre de la tienda');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    
    const saveButton = screen.getByText('💾 Guardar Cambios');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('✅ Cambios guardados')).toBeInTheDocument();
    });
  });

  it('shows domain configuration', () => {
    render(<BrandCustomizer shopId={1} />);
    
    expect(screen.getByText('🌐 Dominio Personalizado')).toBeInTheDocument();
    expect(screen.getByDisplayValue('techstore.com')).toBeInTheDocument();
  });
});

describe('Plan + Billing Integration', () => {
  it('shows current plan in billing', () => {
    render(<BillingDashboard shopId={1} />);
    
    expect(screen.getByText('Plan Actual')).toBeInTheDocument();
    expect(screen.getByText('pro')).toBeInTheDocument();
  });

  it('shows invoices for current plan', () => {
    render(<BillingDashboard shopId={1} />);
    
    expect(screen.getByText('inv_1')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
  });

  it('shows payment methods', () => {
    render(<BillingDashboard shopId={1} />);
    
    fireEvent.click(screen.getByText('💳 Métodos de Pago'));
    expect(screen.getByText('visa')).toBeInTheDocument();
    expect(screen.getByText('•••• 4242')).toBeInTheDocument();
  });
});

describe('Complete White-label Flow', () => {
  it('user can customize brand and view preview', () => {
    // Start with brand customizer
    const { container } = render(<BrandCustomizer shopId={1} />);
    
    // Verify brand loaded
    expect(screen.getByDisplayValue('TechStore')).toBeInTheDocument();
    
    // Verify preview section exists
    expect(screen.getByText('👁️ Vista Previa')).toBeInTheDocument();
    
    // Verify color pickers
    expect(screen.getByText('Color Primario')).toBeInTheDocument();
    expect(screen.getByText('Color Secundario')).toBeInTheDocument();
  });

  it('plan restrictions apply to features', () => {
    // Mock free plan subscription
    vi.mocked(require('../hooks/useSubscription').useSubscription).mockReturnValueOnce({
      subscription: {
        planId: 'inicial',
        status: 'active',
      },
      fetchSubscription: vi.fn(),
      plans: [
        { id: 'inicial', name: 'Inicial', price: 0 },
      ],
    });

    render(<AdminDashboard shopId={1} />);
    
    // Should show plan info
    expect(screen.getByText('Plan: inicial')).toBeInTheDocument();
  });
});
