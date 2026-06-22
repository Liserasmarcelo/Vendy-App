import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateTicket } from './CreateTicket';

vi.mock('../hooks/useTickets', () => ({
  useTickets: vi.fn().mockReturnValue({
    createTicket: vi.fn().mockResolvedValue({ id: 'new_ticket' }),
    isLoading: false,
  }),
}));

describe('CreateTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create ticket form', () => {
    render(<CreateTicket shopId={1} />);
    
    expect(screen.getByText('📝 Nuevo Ticket')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Resumí tu problema')).toBeInTheDocument();
    expect(screen.getByText('Crear Ticket')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<CreateTicket shopId={1} />);
    
    const submitBtn = screen.getByText('Crear Ticket');
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Completá todos los campos')).toBeInTheDocument();
    });
  });

  it('creates ticket with form data', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'ticket_1' });
    vi.mocked(require('../hooks/useTickets').useTickets).mockReturnValueOnce({
      createTicket: mockCreate,
      isLoading: false,
    });

    render(<CreateTicket shopId={1} />);
    
    fireEvent.change(screen.getByPlaceholderText('Resumí tu problema'), {
      target: { value: 'Payment issue' },
    });
    
    fireEvent.change(screen.getByPlaceholderText('Describí tu problema en detalle...'), {
      target: { value: 'Cannot complete payment' },
    });
    
    fireEvent.click(screen.getByText('Crear Ticket'));
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        subject: 'Payment issue',
        description: 'Cannot complete payment',
        priority: 'medium',
        category: 'general',
      });
    });
  });

  it('shows success message after creation', async () => {
    render(<CreateTicket shopId={1} />);
    
    fireEvent.change(screen.getByPlaceholderText('Resumí tu problema'), {
      target: { value: 'Test' },
    });
    
    fireEvent.change(screen.getByPlaceholderText('Describí tu problema en detalle...'), {
      target: { value: 'Test description' },
    });
    
    fireEvent.click(screen.getByText('Crear Ticket'));
    
    await waitFor(() => {
      expect(screen.getByText('✅ Ticket creado exitosamente')).toBeInTheDocument();
    });
  });

  it('selects priority and category', () => {
    render(<CreateTicket shopId={1} />);
    
    const prioritySelect = screen.getByLabelText('Prioridad');
    fireEvent.change(prioritySelect, { target: { value: 'high' } });
    
    const categorySelect = screen.getByLabelText('Categoría');
    fireEvent.change(categorySelect, { target: { value: 'billing' } });
  });

  it('calls onCreated callback', async () => {
    const mockOnCreated = vi.fn();
    render(<CreateTicket shopId={1} onCreated={mockOnCreated} />);
    
    fireEvent.change(screen.getByPlaceholderText('Resumí tu problema'), {
      target: { value: 'Test' },
    });
    
    fireEvent.change(screen.getByPlaceholderText('Describí tu problema en detalle...'), {
      target: { value: 'Test' },
    });
    
    fireEvent.click(screen.getByText('Crear Ticket'));
    
    await waitFor(() => {
      expect(mockOnCreated).toHaveBeenCalled();
    });
  });
});
