import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTickets } from './useTickets';

// Mock fetch
global.fetch = vi.fn();

describe('useTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches tickets', async () => {
    const mockTickets = {
      tickets: [
        { id: 't1', subject: 'Issue 1', status: 'open', priority: 'high' },
        { id: 't2', subject: 'Issue 2', status: 'resolved', priority: 'medium' },
      ],
      total: 2,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTickets),
    } as Response);

    const { result } = renderHook(() => useTickets(1));

    await act(async () => {
      await result.current.fetchTickets();
    });

    await waitFor(() => {
      expect(result.current.tickets).toHaveLength(2);
    });
  });

  it('creates ticket', async () => {
    const mockTicket = {
      id: 't3',
      subject: 'New issue',
      status: 'open',
      priority: 'medium',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTicket),
    } as Response);

    const { result } = renderHook(() => useTickets(1));

    const ticket = await act(async () => {
      return await result.current.createTicket({
        subject: 'New issue',
        description: 'Description',
      });
    });

    expect(ticket.subject).toBe('New issue');
    expect(result.current.tickets).toHaveLength(1);
  });

  it('fetches messages', async () => {
    const mockMessages = {
      messages: [
        { id: 'm1', senderType: 'system', content: 'Ticket created' },
        { id: 'm2', senderType: 'customer', content: 'Hello' },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMessages),
    } as Response);

    const { result } = renderHook(() => useTickets(1));

    await act(async () => {
      await result.current.fetchMessages('t1');
    });

    await waitFor(() => {
      expect(result.current.messages['t1']).toHaveLength(2);
    });
  });

  it('sends message', async () => {
    const mockMessage = {
      id: 'm3',
      senderId: 'user_1',
      senderType: 'customer',
      content: 'Thanks!',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMessage),
    } as Response);

    const { result } = renderHook(() => useTickets(1));

    const message = await act(async () => {
      return await result.current.sendMessage('t1', 'Thanks!', 'user_1');
    });

    expect(message.content).toBe('Thanks!');
  });

  it('handles errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTickets(1));

    await act(async () => {
      await result.current.fetchTickets();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
