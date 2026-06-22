import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TicketList } from './TicketList';

vi.mock('../hooks/useTickets', () => ({
  useTickets: vi.fn().mockReturnValue({
    tickets: [
      {
        id: 'ticket_1',
        shopId: 1,
        subject: 'Payment issue',
        description: 'Cannot complete payment',
        status: 'open',
        priority: 'high',
        category: 'billing',
        createdAt: '2024-06-01T10:00:00Z',
        updatedAt: '2024-06-01T10:00:00Z',
      },
      {
        id: 'ticket_2',
        shopId: 1,
        subject: 'Feature request',
        description: 'Add dark mode',
        status: 'in_progress',
        priority: 'medium',
        category: 'feature_request',
        createdAt: '2024-06-02T10:00:00Z',
        updatedAt: '2024-06-03T10:00:00Z',
      },
    ],
    isLoading: false,
    fetchTickets: vi.fn(),
  }),
}));

describe('TicketList', () => {
  it('renders ticket list', () => {
    render(<TicketList shopId={1} />);
    
    expect(screen.getByText('🎫 Tickets de Soporte')).toBeInTheDocument();
    expect(screen.getByText('Payment issue')).toBeInTheDocument();
    expect(screen.getByText('Feature request')).toBeInTheDocument();
  });

  it('shows status badges', () => {
    render(<TicketList shopId={1} />);
    
    expect(screen.getByText('Abierto')).toBeInTheDocument();
    expect(screen.getByText('En progreso')).toBeInTheDocument();
  });

  it('shows priority badges', () => {
    render(<TicketList shopId={1} />);
    
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('filters by status', () => {
    render(<TicketList shopId={1} />);
    
    const openFilter = screen.getByText('Abierto');
    fireEvent.click(openFilter);
    
    // Should show only open tickets
    expect(screen.getByText('Payment issue')).toBeInTheDocument();
  });

  it('calls onSelectTicket when clicked', () => {
    const mockSelect = vi.fn();
    render(<TicketList shopId={1} onSelectTicket={mockSelect} />);
    
    const rows = screen.getAllByRole('row');
    fireEvent.click(rows[1]); // First data row
    
    expect(mockSelect).toHaveBeenCalled();
  });

  it('shows empty state', () => {
    vi.mocked(require('../hooks/useTickets').useTickets).mockReturnValueOnce({
      tickets: [],
      isLoading: false,
      fetchTickets: vi.fn(),
    });

    render(<TicketList shopId={1} />);
    
    expect(screen.getByText('No hay tickets')).toBeInTheDocument();
  });
});
