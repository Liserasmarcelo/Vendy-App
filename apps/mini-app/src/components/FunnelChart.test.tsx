import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FunnelChart } from './FunnelChart';

describe('FunnelChart', () => {
  const mockSteps = [
    { id: 'visit', label: 'Visitas', count: 1000, conversionRate: 100, dropOffRate: 0 },
    { id: 'product', label: 'Productos', count: 600, conversionRate: 60, dropOffRate: 40 },
    { id: 'cart', label: 'Carrito', count: 300, conversionRate: 50, dropOffRate: 50 },
    { id: 'checkout', label: 'Checkout', count: 150, conversionRate: 50, dropOffRate: 50 },
    { id: 'purchase', label: 'Compra', count: 75, conversionRate: 50, dropOffRate: 50 },
  ];

  it('renders funnel with title', () => {
    render(<FunnelChart steps={mockSteps} title="Funnel de Compra" />);
    expect(screen.getByText('Funnel de Compra')).toBeInTheDocument();
  });

  it('renders all steps', () => {
    render(<FunnelChart steps={mockSteps} />);
    
    expect(screen.getByText('Visitas')).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Carrito')).toBeInTheDocument();
    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Compra')).toBeInTheDocument();
  });

  it('renders counts', () => {
    render(<FunnelChart steps={mockSteps} />);
    
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('renders conversion rates', () => {
    render(<FunnelChart steps={mockSteps} />);
    
    expect(screen.getByText('60.0%')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('renders drop-off rates', () => {
    render(<FunnelChart steps={mockSteps} />);
    
    expect(screen.getByText('Abandono:')).toBeInTheDocument();
    expect(screen.getByText('40.0%')).toBeInTheDocument();
  });

  it('renders total conversion', () => {
    render(<FunnelChart steps={mockSteps} />);
    
    expect(screen.getByText('Conversión Total:')).toBeInTheDocument();
    expect(screen.getByText('7.5%')).toBeInTheDocument();
  });

  it('renders with custom color', () => {
    render(<FunnelChart steps={mockSteps} color="#2196F3" />);
    expect(document.querySelector('.funnel-bar')).toBeInTheDocument();
  });

  it('renders empty funnel', () => {
    render(<FunnelChart steps={[]} />);
    expect(screen.getByText('Conversión Total:')).toBeInTheDocument();
  });
});
