import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DomainSetup } from './DomainSetup';

vi.mock('../hooks/useBrand', () => ({
  useBrand: vi.fn().mockReturnValue({
    brand: {
      customDomain: 'mitienda.com',
      subdomain: 'shop',
    },
    validateDomain: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
    configureDomain: vi.fn().mockResolvedValue({
      domain: 'mitienda.com',
      dnsRecords: [
        { type: 'CNAME', name: 'mitienda.com', value: 'shops.vendy.com' },
        { type: 'TXT', name: '_vendy.mitienda.com', value: 'vendy-verification=1' },
      ],
    }),
  }),
}));

describe('DomainSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders domain setup', () => {
    render(<DomainSetup shopId={1} />);
    
    expect(screen.getByText('🌐 Configuración de Dominio')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('mitienda.com')).toBeInTheDocument();
  });

  it('validates domain', async () => {
    render(<DomainSetup shopId={1} />);
    
    const input = screen.getByPlaceholderText('mitienda.com');
    fireEvent.change(input, { target: { value: 'nuevotienda.com' } });
    
    const validateBtn = screen.getByText('Verificar');
    fireEvent.click(validateBtn);
    
    await waitFor(() => {
      expect(screen.getByText('✅ Dominio disponible')).toBeInTheDocument();
    });
  });

  it('configures domain after validation', async () => {
    render(<DomainSetup shopId={1} />);
    
    const input = screen.getByPlaceholderText('mitienda.com');
    fireEvent.change(input, { target: { value: 'nuevotienda.com' } });
    
    fireEvent.click(screen.getByText('Verificar'));
    
    await waitFor(() => {
      expect(screen.getByText('Configurar Dominio')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Configurar Dominio'));
    
    await waitFor(() => {
      expect(screen.getByText('Registros DNS requeridos:')).toBeInTheDocument();
    });
  });

  it('shows DNS records after configuration', async () => {
    render(<DomainSetup shopId={1} />);
    
    const input = screen.getByPlaceholderText('mitienda.com');
    fireEvent.change(input, { target: { value: 'test.com' } });
    
    fireEvent.click(screen.getByText('Verificar'));
    
    await waitFor(() => {
      expect(screen.getByText('Configurar Dominio')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Configurar Dominio'));
    
    await waitFor(() => {
      expect(screen.getByText('CNAME')).toBeInTheDocument();
      expect(screen.getByText('shops.vendy.com')).toBeInTheDocument();
      expect(screen.getByText('TXT')).toBeInTheDocument();
    });
  });

  it('shows current domain', () => {
    render(<DomainSetup shopId={1} />);
    
    expect(screen.getByText('Dominio Actual')).toBeInTheDocument();
    expect(screen.getByText('mitienda.com')).toBeInTheDocument();
  });

  it('shows validation errors', async () => {
    const mockValidate = vi.fn().mockResolvedValue({
      valid: false,
      errors: ['Dominio ya está en uso', 'Formato inválido'],
    });
    
    vi.mocked(require('../hooks/useBrand').useBrand).mockReturnValueOnce({
      brand: {},
      validateDomain: mockValidate,
      configureDomain: vi.fn(),
    });

    render(<DomainSetup shopId={1} />);
    
    fireEvent.click(screen.getByText('Verificar'));
    
    await waitFor(() => {
      expect(screen.getByText('Dominio ya está en uso')).toBeInTheDocument();
      expect(screen.getByText('Formato inválido')).toBeInTheDocument();
    });
  });
});
