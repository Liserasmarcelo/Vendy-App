import { useState, useCallback } from 'react';

// ==========================================
// TICKET TYPES
// ==========================================
export interface Ticket {
  id: string;
  shopId: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'system';
  content: string;
  createdAt: string;
}

// ==========================================
// TICKETS HOOK
// ==========================================
export function useTickets(shopId?: number) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Record<string, TicketMessage[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async (filters?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (shopId) params.append('shopId', String(shopId));
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, value);
        });
      }

      const response = await fetch(`/api/tickets?${params}`);
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const createTicket = useCallback(async (data: {
    subject: string;
    description: string;
    priority?: string;
    category?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          ...data,
        }),
      });

      if (!response.ok) throw new Error('Failed to create ticket');

      const ticket = await response.json();
      setTickets(prev => [ticket, ...prev]);
      return ticket;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/messages`);
      const data = await response.json();
      setMessages(prev => ({
        ...prev,
        [ticketId]: data.messages || [],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    }
  }, []);

  const sendMessage = useCallback(async (ticketId: string, content: string, senderId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId,
          senderType: 'customer',
          content,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const message = await response.json();
      setMessages(prev => ({
        ...prev,
        [ticketId]: [...(prev[ticketId] || []), message],
      }));
      return message;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  return {
    tickets,
    messages,
    isLoading,
    error,
    fetchTickets,
    createTicket,
    fetchMessages,
    sendMessage,
  };
}
