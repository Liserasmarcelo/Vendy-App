import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BillingDashboard } from './BillingDashboard';

// Mock hooks
vi.mock('../hooks/useBilling', () => ({
  useBilling: vi.fn().mockReturnValue({
    invoices: [
      { id: 'inv_1', amount: 15, currency: 'USD', status: 'paid', description: 'Monthly', createdAt: '2024-06-01' },
      { id: 'inv_2', amount: 15, currency: 'USD', status: 'pending', description: 'Monthly', createdAt: '2024-07-01' },
    ],
    paymentMethods: [
      { id: 'pm_1', type: 'card', last4: '4242', brand: 'visa', isDefault: true },
      { id: 'pm_2', type: 'card', last4: '1234', brand: 'mastercard', isDefault: false },
    ],
    fetchInvoices: vi.fn(),
    fetchPaymentMethods: vi.fn(),
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

describe('BillingDashboard', () => {
  it('renders billing dashboard', () => {
    render(<BillingDashboard shopId={1} />);
    
    expect(screen.getByText('💳 Facturación')).toBeInTheDocument();
    expect(screen.getByText('Plan Actual')).toBeInTheDocument();
    expect(screen.getByText('crecimiento')).toBeInTheDocument();
  });

  it('shows subscription status', () => {
    render(<BillingDashboard shopId={1} />);
    
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('Próximo cobro')).toBeInTheDocument();
  });

  it('shows invoices tab by default', () => {
    render(<BillingDashboard shopId={1} />);
    
    expect(screen.getByText('📄 Facturas')).toBeInTheDocument();
    expect(screen.getByText('inv_1')).toBeInTheDocument();
    expect(screen.getByText('inv_2')).toBeInTheDocument();
  });

  it('shows invoice details', () => {
    render(<BillingDashboard shopId={1} />);
    
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('switches to payment methods tab', () => {
    render(<BillingDashboard shopId={1} />);
    
    const paymentTab = screen.getByText('💳 Métodos de Pago');
    fireEvent.click(paymentTab);
    
    expect(screen.getByText('visa')).toBeInTheDocument();
    expect(screen.getByText('•••• 4242')).toBeInTheDocument();
    expect(screen.getByText('Predeterminado')).toBeInTheDocument();
  });

  it('shows payment method cards', () => {
    render(<BillingDashboard shopId={1} />);
    
    const paymentTab = screen.getByText('💳 Métodos de Pago');
    fireEvent.click(paymentTab);
    
    expect(screen.getByText('mastercard')).toBeInTheDocument();
    expect(screen.getByText('•••• 1234')).toBeInTheDocument();
  });

  it('shows status badges with colors', () => {
    render(<BillingDashboard shopId={1} />);
    
    const badges = document.querySelectorAll('.status-badge');
    expect(badges.length).toBe(2);
  });
});
