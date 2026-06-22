import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RealtimeChart } from './RealtimeChart';

describe('RealtimeChart', () => {
  const mockData = [
    { timestamp: '2024-06-01T10:00:00Z', value: 100 },
    { timestamp: '2024-06-01T10:05:00Z', value: 150 },
    { timestamp: '2024-06-01T10:10:00Z', value: 120 },
    { timestamp: '2024-06-01T10:15:00Z', value: 200 },
  ];

  it('renders chart with title', () => {
    render(<RealtimeChart title="Ventas en vivo" data={mockData} />);
    expect(screen.getByText('Ventas en vivo')).toBeInTheDocument();
  });

  it('renders canvas element', () => {
    render(<RealtimeChart title="Test" data={mockData} />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with custom color', () => {
    render(<RealtimeChart title="Test" data={mockData} color="#FF0000" />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders empty chart', () => {
    render(<RealtimeChart title="Empty" data={[]} />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });
});
