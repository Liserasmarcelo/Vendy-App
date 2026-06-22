import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrandCustomizer } from './BrandCustomizer';

// Mock useBrand
vi.mock('../hooks/useBrand', () => ({
  useBrand: vi.fn().mockReturnValue({
    brand: {
      shopId: 1,
      name: 'TechStore',
      primaryColor: '#FF7403',
      secondaryColor: '#333333',
      accentColor: '#2196F3',
      fontFamily: 'Inter',
    },
    isLoading: false,
    error: null,
    fetchBrand: vi.fn(),
    updateBrand: vi.fn().mockResolvedValue({}),
    validateDomain: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
    configureDomain: vi.fn().mockResolvedValue({ domain: 'mitienda.com' }),
  }),
}));

describe('BrandCustomizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand customizer', () => {
    render(<BrandCustomizer shopId={1} />);
    
    expect(screen.getByText('🎨 Personalización de Marca')).toBeInTheDocument();
    expect(screen.getByText('Información Básica')).toBeInTheDocument();
    expect(screen.getByText('Colores')).toBeInTheDocument();
  });

  it('loads existing brand data', () => {
    render(<BrandCustomizer shopId={1} />);
    
    const nameInput = screen.getByDisplayValue('TechStore') as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe('TechStore');
  });

  it('updates brand name', () => {
    render(<BrandCustomizer shopId={1} />);
    
    const nameInput = screen.getByDisplayValue('TechStore');
    fireEvent.change(nameInput, { target: { value: 'Nuevo Nombre' } });
    
    expect(screen.getByDisplayValue('Nuevo Nombre')).toBeInTheDocument();
  });

  it('validates domain', async () => {
    render(<BrandCustomizer shopId={1} />);
    
    const domainInput = screen.getByPlaceholderText('mitienda.com');
    fireEvent.change(domainInput, { target: { value: 'mitienda.com' } });
    
    const checkButton = screen.getByText('Verificar');
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(screen.getByText('✅ Dominio disponible')).toBeInTheDocument();
    });
  });

  it('shows configure button after valid domain', async () => {
    render(<BrandCustomizer shopId={1} />);
    
    const domainInput = screen.getByPlaceholderText('mitienda.com');
    fireEvent.change(domainInput, { target: { value: 'mitienda.com' } });
    
    const checkButton = screen.getByText('Verificar');
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(screen.getByText('Configurar Dominio')).toBeInTheDocument();
    });
  });

  it('saves brand changes', async () => {
    const mockUpdateBrand = vi.fn().mockResolvedValue({});
    vi.mocked(require('../hooks/useBrand').useBrand).mockReturnValueOnce({
      brand: { shopId: 1, name: 'TechStore', primaryColor: '#FF7403' },
      isLoading: false,
      error: null,
      fetchBrand: vi.fn(),
      updateBrand: mockUpdateBrand,
      validateDomain: vi.fn(),
      configureDomain: vi.fn(),
    });

    render(<BrandCustomizer shopId={1} />);
    
    const saveButton = screen.getByText('💾 Guardar Cambios');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateBrand).toHaveBeenCalled();
    });
  });

  it('renders color pickers', () => {
    render(<BrandCustomizer shopId={1} />);
    
    const colorInputs = document.querySelectorAll('input[type="color"]');
    expect(colorInputs.length).toBe(3);
  });

  it('renders font selector', () => {
    render(<BrandCustomizer shopId={1} />);
    
    expect(screen.getByText('Inter')).toBeInTheDocument();
    expect(screen.getByText('Roboto')).toBeInTheDocument();
    expect(screen.getByText('Poppins')).toBeInTheDocument();
  });

  it('renders preview section', () => {
    render(<BrandCustomizer shopId={1} />);
    
    expect(screen.getByText('Vista Previa')).toBeInTheDocument();
    expect(screen.getByText('Botón Primario')).toBeInTheDocument();
  });
});
