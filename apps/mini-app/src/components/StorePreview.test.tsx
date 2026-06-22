import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StorePreview } from './StorePreview';

vi.mock('../hooks/useBrand', () => ({
  useBrand: vi.fn().mockReturnValue({
    brand: {
      shopId: 1,
      name: 'TechStore',
      description: 'Lo mejor en tecnología',
      logo: 'https://example.com/logo.png',
      primaryColor: '#FF7403',
      secondaryColor: '#333333',
      accentColor: '#2196F3',
      fontFamily: 'Inter',
    },
  }),
}));

describe('StorePreview', () => {
  it('renders store preview', () => {
    render(<StorePreview shopId={1} />);
    
    expect(screen.getByText('👁️ Vista Previa de Tienda')).toBeInTheDocument();
    expect(screen.getByText('TechStore')).toBeInTheDocument();
  });

  it('shows brand description', () => {
    render(<StorePreview shopId={1} />);
    
    expect(screen.getByText('Lo mejor en tecnología')).toBeInTheDocument();
  });

  it('shows store navigation', () => {
    render(<StorePreview shopId={1} />);
    
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Ofertas')).toBeInTheDocument();
    expect(screen.getByText('Contacto')).toBeInTheDocument();
  });

  it('shows hero section', () => {
    render(<StorePreview shopId={1} />);
    
    expect(screen.getByText('Bienvenido a TechStore')).toBeInTheDocument();
    expect(screen.getByText('Ver Productos')).toBeInTheDocument();
  });

  it('shows product cards', () => {
    render(<StorePreview shopId={1} />);
    
    expect(screen.getByText('Productos Destacados')).toBeInTheDocument();
    expect(screen.getByText('Producto 1')).toBeInTheDocument();
    expect(screen.getByText('Producto 4')).toBeInTheDocument();
  });

  it('shows footer with brand name', () => {
    render(<StorePreview shopId={1} />);
    
    expect(screen.getByText('© 2024 TechStore. Todos los derechos reservados.')).toBeInTheDocument();
  });

  it('shows device toggles', () => {
    render(<StorePreview shopId={1} />);
    
    expect(screen.getByText('📱 Mobile')).toBeInTheDocument();
    expect(screen.getByText('💻 Desktop')).toBeInTheDocument();
  });
});
