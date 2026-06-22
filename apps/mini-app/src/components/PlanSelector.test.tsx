import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlanSelector } from './PlanSelector';

// Mock useSubscription
vi.mock('../hooks/useSubscription', () => ({
  useSubscription: vi.fn().mockReturnValue({
    plans: [
      {
        id: 'inicial',
        name: 'Inicial',
        description: 'Perfecto para empezar',
        price: 0,
        currency: 'USD',
        billingCycle: 'monthly',
        commissionRate: 0.03,
        features: {
          maxProducts: 50,
          maxOrdersPerMonth: 100,
          maxAdmins: 1,
          maxStorageMB: 500,
          analyticsLevel: 'basic',
          customDomain: false,
          whiteLabel: false,
          prioritySupport: false,
          apiAccess: false,
          webhooks: false,
        },
      },
      {
        id: 'crecimiento',
        name: 'Crecimiento',
        description: 'Para tiendas en expansión',
        price: 15,
        currency: 'USD',
        billingCycle: 'monthly',
        commissionRate: 0.02,
        features: {
          maxProducts: 500,
          maxOrdersPerMonth: 1000,
          maxAdmins: 3,
          maxStorageMB: 5000,
          analyticsLevel: 'advanced',
          customDomain: true,
          whiteLabel: false,
          prioritySupport: true,
          apiAccess: true,
          webhooks: true,
        },
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'Máximo poder',
        price: 49,
        currency: 'USD',
        billingCycle: 'monthly',
        commissionRate: 0.01,
        features: {
          maxProducts: -1,
          maxOrdersPerMonth: -1,
          maxAdmins: 10,
          maxStorageMB: 50000,
          analyticsLevel: 'full',
          customDomain: true,
          whiteLabel: true,
          prioritySupport: true,
          apiAccess: true,
          webhooks: true,
        },
      },
    ],
    isLoading: false,
    subscribe: vi.fn().mockResolvedValue({}),
    changePlan: vi.fn().mockResolvedValue({}),
  }),
}));

describe('PlanSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders plan selector', () => {
    render(<PlanSelector shopId={1} />);
    
    expect(screen.getByText('Elige tu plan')).toBeInTheDocument();
    expect(screen.getByText('Inicial')).toBeInTheDocument();
    expect(screen.getByText('Crecimiento')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('shows free plan correctly', () => {
    render(<PlanSelector shopId={1} />);
    
    expect(screen.getByText('Gratis')).toBeInTheDocument();
    expect(screen.getByText('Comenzar Gratis')).toBeInTheDocument();
  });

  it('shows paid plan prices', () => {
    render(<PlanSelector shopId={1} />);
    
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('49')).toBeInTheDocument();
  });

  it('shows commission rates', () => {
    render(<PlanSelector shopId={1} />);
    
    expect(screen.getByText('Comisión: 3%')).toBeInTheDocument();
    expect(screen.getByText('Comisión: 2%')).toBeInTheDocument();
    expect(screen.getByText('Comisión: 1%')).toBeInTheDocument();
  });

  it('shows feature lists', () => {
    render(<PlanSelector shopId={1} />);
    
    expect(screen.getByText('50 productos')).toBeInTheDocument();
    expect(screen.getByText('Productos ilimitados')).toBeInTheDocument();
    expect(screen.getByText('Dominio personalizado')).toBeInTheDocument();
  });

  it('highlights current plan', () => {
    render(<PlanSelector shopId={1} currentPlanId="inicial" />);
    
    expect(screen.getByText('Plan Actual')).toBeInTheDocument();
  });

  it('toggles billing cycle', () => {
    render(<PlanSelector shopId={1} />);
    
    const yearlyButton = screen.getByText('Anual');
    fireEvent.click(yearlyButton);
    
    expect(yearlyButton).toHaveClass('active');
  });

  it('selects plan on click', async () => {
    const mockSubscribe = vi.fn().mockResolvedValue({});
    vi.mocked(require('../hooks/useSubscription').useSubscription).mockReturnValueOnce({
      plans: [
        { id: 'inicial', name: 'Inicial', price: 0, billingCycle: 'monthly', commissionRate: 0.03, features: { maxProducts: 50, maxOrdersPerMonth: 100, maxAdmins: 1, analyticsLevel: 'basic', customDomain: false, whiteLabel: false, prioritySupport: false, apiAccess: false, webhooks: false } },
        { id: 'crecimiento', name: 'Crecimiento', price: 15, billingCycle: 'monthly', commissionRate: 0.02, features: { maxProducts: 500, maxOrdersPerMonth: 1000, maxAdmins: 3, analyticsLevel: 'advanced', customDomain: true, whiteLabel: false, prioritySupport: true, apiAccess: true, webhooks: true } },
      ],
      isLoading: false,
      subscribe: mockSubscribe,
      changePlan: vi.fn(),
    });

    render(<PlanSelector shopId={1} />);
    
    const selectButton = screen.getByText('Comenzar Gratis');
    fireEvent.click(selectButton);
    
    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith('inicial', 14);
    });
  });

  it('shows featured badge on Pro plan', () => {
    render(<PlanSelector shopId={1} />);
    
    expect(screen.getByText('Más Popular')).toBeInTheDocument();
  });

  it('shows unlimited features correctly', () => {
    render(<PlanSelector shopId={1} />);
    
    expect(screen.getByText('Productos ilimitados')).toBeInTheDocument();
    expect(screen.getByText('Órdenes ilimitadas')).toBeInTheDocument();
  });
});
