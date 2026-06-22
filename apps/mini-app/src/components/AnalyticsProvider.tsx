import React, { createContext, useContext, useEffect } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';

// ==========================================
// ANALYTICS CONTEXT
// ==========================================
const AnalyticsContext = createContext<ReturnType<typeof useAnalytics> | null>(null);

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
}

// ==========================================
// ANALYTICS PROVIDER
// ==========================================
interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const analytics = useAnalytics();

  // Track page views on route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      analytics.trackPageView(path);
    };

    // Track initial page view
    handleRouteChange();

    // Listen for route changes (if using React Router)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [analytics]);

  // Flush events on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      analytics.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [analytics]);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}
