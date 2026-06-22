/**
 * SkeletonLoader.tsx
 * Shimmer effect para estados de carga.
 * Alternativa ligera a Lottie para loading states.
 */

import React from 'react';

interface Props {
  variant?: 'card' | 'text' | 'avatar' | 'image' | 'chart';
  count?: number;
  className?: string;
}

export function SkeletonLoader({ variant = 'card', count = 1, className = '' }: Props) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`bg-gray-2 rounded-2xl p-4 animate-pulse ${className}`}>
            <div className="h-32 bg-gray-3/30 rounded-xl mb-3" />
            <div className="h-4 bg-gray-3/30 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-3/30 rounded w-1/2" />
          </div>
        );
      case 'text':
        return (
          <div className={`space-y-2 animate-pulse ${className}`}>
            <div className="h-4 bg-gray-3/30 rounded w-full" />
            <div className="h-4 bg-gray-3/30 rounded w-5/6" />
            <div className="h-4 bg-gray-3/30 rounded w-4/6" />
          </div>
        );
      case 'avatar':
        return (
          <div className={`w-12 h-12 rounded-full bg-gray-3/30 animate-pulse ${className}`} />
        );
      case 'image':
        return (
          <div className={`h-48 bg-gray-3/30 rounded-xl animate-pulse ${className}`} />
        );
      case 'chart':
        return (
          <div className={`bg-gray-2 rounded-2xl p-4 animate-pulse ${className}`}>
            <div className="flex items-end justify-between h-32 gap-2">
              {[40, 60, 30, 80, 50, 70, 90].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-3/30 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </>
  );
}
