import { useEffect, useRef, useCallback } from 'react';

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  children: React.ReactNode;
}

export default function InfiniteScroll({ onLoadMore, hasMore, isLoading, children }: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleObserver]);

  return (
    <div>
      {children}
      <div ref={loadMoreRef} className="py-4">
        {isLoading && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-vendy-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!hasMore && !isLoading && (
          <p className="text-center text-gray-1 text-sm">No hay más productos</p>
        )}
      </div>
    </div>
  );
}
