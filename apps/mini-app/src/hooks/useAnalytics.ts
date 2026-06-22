import { useCallback, useRef } from 'react';

// ==========================================
// ANALYTICS HOOK
// ==========================================
export type AnalyticsEventType = 
  | 'page_view'
  | 'product_view'
  | 'product_click'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_started'
  | 'checkout_completed'
  | 'payment_initiated'
  | 'payment_success'
  | 'payment_failed'
  | 'search_query'
  | 'filter_applied'
  | 'category_view'
  | 'admin_login'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted';

interface TrackEventOptions {
  type: AnalyticsEventType;
  metadata?: Record<string, any>;
  shopId?: number;
}

export function useAnalytics() {
  const sessionId = useRef(`sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`).current;
  const eventQueue = useRef<Array<TrackEventOptions>>([]);
  const flushTimeout = useRef<NodeJS.Timeout | null>(null);

  const flush = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const events = [...eventQueue.current];
    eventQueue.current = [];

    try {
      await fetch('/api/analytics/track/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: events.map(e => ({
            ...e,
            sessionId,
            source: 'mini_app',
          })),
        }),
      });
    } catch (error) {
      console.error('Failed to track events:', error);
      // Put events back in queue
      eventQueue.current.unshift(...events);
    }
  }, [sessionId]);

  const scheduleFlush = useCallback(() => {
    if (flushTimeout.current) {
      clearTimeout(flushTimeout.current);
    }
    flushTimeout.current = setTimeout(() => {
      flush();
    }, 5000); // Flush every 5 seconds
  }, [flush]);

  const track = useCallback((options: TrackEventOptions) => {
    eventQueue.current.push(options);
    scheduleFlush();
  }, [scheduleFlush]);

  const trackPageView = useCallback((page: string, metadata?: Record<string, any>) => {
    track({ type: 'page_view', metadata: { page, ...metadata } });
  }, [track]);

  const trackProductView = useCallback((productId: number, productName: string) => {
    track({ type: 'product_view', metadata: { productId, productName } });
  }, [track]);

  const trackAddToCart = useCallback((productId: number, quantity: number, price: number) => {
    track({ type: 'add_to_cart', metadata: { productId, quantity, price } });
  }, [track]);

  const trackRemoveFromCart = useCallback((productId: number, quantity: number) => {
    track({ type: 'remove_from_cart', metadata: { productId, quantity } });
  }, [track]);

  const trackCheckoutStarted = useCallback((total: number, itemCount: number) => {
    track({ type: 'checkout_started', metadata: { total, itemCount } });
  }, [track]);

  const trackCheckoutCompleted = useCallback((orderNumber: string, total: number, paymentMethod: string) => {
    track({ type: 'checkout_completed', metadata: { orderNumber, total, paymentMethod } });
  }, [track]);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    track({ type: 'search_query', metadata: { query, resultsCount } });
  }, [track]);

  const trackFilter = useCallback((filterType: string, filterValue: string) => {
    track({ type: 'filter_applied', metadata: { filterType, filterValue } });
  }, [track]);

  return {
    track,
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackCheckoutStarted,
    trackCheckoutCompleted,
    trackSearch,
    trackFilter,
    flush,
    sessionId,
  };
}
