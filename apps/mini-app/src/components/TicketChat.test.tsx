import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TicketChat } from './TicketChat';

vi.mock('../hooks/useTickets', () => ({
  useTickets: vi.fn().mockReturnValue({
    messages: {
      ticket_1: [
        { id: 'm1', senderId: 'system', senderType: 'system', content: 'Ticket creado', createdAt: '2024-06-01T10:00:00Z' },
        { id: 'm2', senderId: 'user_1', senderType: 'customer', content: 'Hello, I need help', createdAt: '2024-06-01T10:05:00Z' },
        { id: 'm3', senderId: 'agent_1', senderType: 'agent', content: 'How can I help?', createdAt: '2024-06-01T10:10:00Z' },
      ],
    },
    fetchMessages: vi.fn(),
    sendMessage: vi.fn().mockResolvedValue({ id: 'm4', content: 'Thanks!' }),
  }),
}));

describe('TicketChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat with messages', () => {
    render(<TicketChat ticketId="ticket_1" userId="user_1" />);
    
    expect(screen.getByText('Ticket creado')).toBeInTheDocument();
    expect(screen.getByText('Hello, I need help')).toBeInTheDocument();
    expect(screen.getByText('How can I help?')).toBeInTheDocument();
  });

  it('shows sender labels', () => {
    render(<TicketChat ticketId="ticket_1" userId="user_1" />);
    
    expect(screen.getByText('Vos')).toBeInTheDocument();
    expect(screen.getByText('Agente')).toBeInTheDocument();
    expect(screen.getByText('Sistema')).toBeInTheDocument();
  });

  it('sends message on button click', async () => {
    const mockSend = vi.fn().mockResolvedValue({ id: 'm4', content: 'Thanks!' });
    vi.mocked(require('../hooks/useTickets').useTickets).mockReturnValueOnce({
      messages: { ticket_1: [] },
      fetchMessages: vi.fn(),
      sendMessage: mockSend,
    });

    render(<TicketChat ticketId="ticket_1" userId="user_1" />);
    
    const textarea = screen.getByPlaceholderText('Escribí tu mensaje...');
    fireEvent.change(textarea, { target: { value: 'Thanks!' } });
    
    const sendBtn = screen.getByText('Enviar');
    fireEvent.click(sendBtn);
    
    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith('ticket_1', 'Thanks!', 'user_1');
    });
  });

  it('sends message on Enter key', async () => {
    const mockSend = vi.fn().mockResolvedValue({ id: 'm4', content: 'Quick reply' });
    vi.mocked(require('../hooks/useTickets').useTickets).mockReturnValueOnce({
      messages: { ticket_1: [] },
      fetchMessages: vi.fn(),
      sendMessage: mockSend,
    });

    render(<TicketChat ticketId="ticket_1" userId="user_1" />);
    
    const textarea = screen.getByPlaceholderText('Escribí tu mensaje...');
    fireEvent.change(textarea, { target: { value: 'Quick reply' } });
    fireEvent.keyPress(textarea, { key: 'Enter', code: 13, charCode: 13 });
    
    await waitFor(() => {
      expect(mockSend).toHaveBeenCalled();
    });
  });

  it('disables send when empty', () => {
    render(<TicketChat ticketId="ticket_1" userId="user_1" />);
    
    const sendBtn = screen.getByText('Enviar');
    expect(sendBtn).toBeDisabled();
  });

  it('shows empty state', () => {
    vi.mocked(require('../hooks/useTickets').useTickets).mockReturnValueOnce({
      messages: {},
      fetchMessages: vi.fn(),
      sendMessage: vi.fn(),
    });

    render(<TicketChat ticketId="ticket_2" userId="user_1" />);
    
    expect(screen.getByText('No hay mensajes aún')).toBeInTheDocument();
  });
});
