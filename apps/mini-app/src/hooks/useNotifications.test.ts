import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications } from './useNotifications';

// Mock fetch
global.fetch = vi.fn();

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches notifications', async () => {
    const mockData = {
      notifications: [
        { id: 'n1', type: 'order_created', title: 'New Order', body: 'Body', status: 'sent', createdAt: '2024-06-01' },
        { id: 'n2', type: 'payment_received', title: 'Payment', body: 'Body', status: 'read', createdAt: '2024-06-02' },
      ],
      total: 2,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useNotifications(1));

    await act(async () => {
      await result.current.fetchNotifications();
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });
  });

  it('fetches unread count', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ count: 5 }),
    } as Response);

    const { result } = renderHook(() => useNotifications(1));

    await act(async () => {
      await result.current.fetchUnreadCount();
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(5);
    });
  });

  it('marks notification as read', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() => useNotifications(1));

    // Set initial notifications
    act(() => {
      result.current.notifications = [
        { id: 'n1', type: 'order', title: 'Order', body: 'Body', status: 'sent', createdAt: '2024-06-01' },
      ];
      result.current.unreadCount = 1;
    });

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    await waitFor(() => {
      expect(result.current.notifications[0].status).toBe('read');
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it('marks all as read', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() => useNotifications(1));

    act(() => {
      result.current.notifications = [
        { id: 'n1', type: 'order', title: 'Order', body: 'Body', status: 'sent', createdAt: '2024-06-01' },
        { id: 'n2', type: 'payment', title: 'Payment', body: 'Body', status: 'sent', createdAt: '2024-06-02' },
      ];
      result.current.unreadCount = 2;
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    await waitFor(() => {
      expect(result.current.notifications.every(n => n.status === 'read')).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it('fetches preferences', async () => {
    const mockPrefs = {
      channels: { order_created: ['push', 'email'] },
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPrefs),
    } as Response);

    const { result } = renderHook(() => useNotifications(1));

    await act(async () => {
      await result.current.fetchPreferences();
    });

    await waitFor(() => {
      expect(result.current.preferences).toEqual(mockPrefs);
    });
  });

  it('updates preferences', async () => {
    const updatedPrefs = {
      channels: { order_created: ['push'] },
      quietHours: { enabled: true, start: '23:00', end: '07:00' },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updatedPrefs),
    } as Response);

    const { result } = renderHook(() => useNotifications(1));

    await act(async () => {
      await result.current.updatePreferences({
        quietHours: { enabled: true, start: '23:00', end: '07:00' },
      });
    });

    await waitFor(() => {
      expect(result.current.preferences?.quietHours.enabled).toBe(true);
    });
  });

  it('subscribes to push', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() => useNotifications(1));

    const mockSub = {
      endpoint: 'https://push.example.com/1',
      getKey: vi.fn((key: string) => key === 'p256dh' ? 'key1' : 'auth1'),
    } as any;

    await act(async () => {
      await result.current.subscribePush(mockSub);
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/notifications/push-subscribe',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('unsubscribes from push', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() => useNotifications(1));

    await act(async () => {
      await result.current.unsubscribePush('https://push.example.com/1');
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/notifications/push-unsubscribe',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('polls unread count', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 3 }),
    } as Response);

    const { result } = renderHook(() => useNotifications(1));

    // Initial fetch
    await act(async () => {});

    // Advance 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    vi.useRealTimers();
  });
});
