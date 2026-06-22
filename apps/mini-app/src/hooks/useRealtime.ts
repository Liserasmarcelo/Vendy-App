import { useEffect, useRef, useState, useCallback } from 'react';

// ==========================================
// REALTIME DATA TYPES
// ==========================================
interface RealtimeMetrics {
  activeUsers: number;
  todayOrders: number;
  todayRevenue: number;
  conversionRate: number;
  lastUpdate: string;
}

interface RealtimeEvent {
  type: 'metrics' | 'order' | 'alert' | 'connected' | 'heartbeat';
  data?: any;
  timestamp: string;
}

// ==========================================
// REALTIME HOOK
// ==========================================
export function useRealtime(shopId: number) {
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/realtime/${shopId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          setIsConnected(true);
        } else if (data.type === 'metrics') {
          setMetrics(data.data);
        } else {
          setLastEvent(data);
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError('Connection lost');
      eventSource.close();

      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [shopId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    metrics,
    lastEvent,
    error,
    connect,
    disconnect,
  };
}
