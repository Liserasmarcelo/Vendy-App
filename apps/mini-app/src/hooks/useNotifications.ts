import { useState, useCallback, useEffect } from 'react';

// ==========================================
// NOTIFICATION TYPES
// ==========================================
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'read';
  createdAt: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  channels: Record<string, string[]>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// ==========================================
// NOTIFICATIONS HOOK
// ==========================================
export function useNotifications(shopId?: number) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (options?: { status?: string; limit?: number }) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (shopId) params.append('shopId', String(shopId));
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', String(options.limit));

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (shopId) params.append('shopId', String(shopId));

      const response = await fetch(`/api/notifications/unread?${params}`);
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [shopId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, status: 'read' as const } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (shopId) params.append('shopId', String(shopId));

      await fetch(`/api/notifications/read-all?${params}`, {
        method: 'POST',
      });

      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' as const }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  }, [shopId]);

  const fetchPreferences = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (shopId) params.append('shopId', String(shopId));

      const response = await fetch(`/api/notifications/preferences?${params}`);
      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    }
  }, [shopId]);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, ...prefs }),
      });

      if (!response.ok) throw new Error('Failed to update preferences');

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  }, [shopId]);

  const subscribePush = useCallback(async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/notifications/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: (subscription as any).getKey('p256dh'),
          auth: (subscription as any).getKey('auth'),
        }),
      });

      if (!response.ok) throw new Error('Failed to subscribe');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    }
  }, []);

  const unsubscribePush = useCallback(async (endpoint: string) => {
    try {
      await fetch('/api/notifications/push-unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    fetchPreferences,
    updatePreferences,
    subscribePush,
    unsubscribePush,
  };
}
