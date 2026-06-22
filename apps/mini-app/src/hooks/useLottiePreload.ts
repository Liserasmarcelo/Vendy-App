/**
 * useLottiePreload.ts
 * Precarga selectiva de assets Lottie vía <link rel="preload">.
 * Evita descargas en caliente durante animaciones críticas.
 */

import { useEffect } from 'react';

const PRELOADED = new Set<string>();

export function useLottiePreload(urls: string[]) {
  useEffect(() => {
    urls.forEach((url) => {
      if (PRELOADED.has(url)) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);

      PRELOADED.add(url);
    });
  }, [urls]);
}

// Helper estático para precarga desde index.html
export function preloadLottie(url: string): void {
  if (typeof window === 'undefined' || PRELOADED.has(url)) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = 'fetch';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
  PRELOADED.add(url);
}
