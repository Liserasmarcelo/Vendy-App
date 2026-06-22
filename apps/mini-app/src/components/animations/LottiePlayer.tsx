/**
 * LottiePlayer.tsx
 * Wrapper genérico sobre lottie-react con:
 * - Fallback estático si falla carga
 * - Soporte prefers-reduced-motion
 * - Control programático (play, pause, stop, setSpeed)
 * - Renderer configurable (svg | canvas)
 */

import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

export interface LottiePlayerHandle {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  setDirection: (direction: 1 | -1) => void;
  goToAndStop: (frame: number) => void;
}

interface Props {
  src: object;                    // JSON importado
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  renderer?: 'svg' | 'canvas';
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: React.ReactNode;     // Componente estático si reduce-motion o error
}

export const LottiePlayer = forwardRef<LottiePlayerHandle, Props>(
  (
    {
      src,
      loop = false,
      autoplay = true,
      speed = 1,
      renderer = 'svg',
      className = '',
      style = { width: 120, height: 120 },
      onComplete,
      onLoad,
      onError,
      fallback
    },
    ref
  ) => {
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const [hasError, setHasError] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }, []);

    useImperativeHandle(ref, () => ({
      play: () => lottieRef.current?.play(),
      pause: () => lottieRef.current?.pause(),
      stop: () => lottieRef.current?.stop(),
      setSpeed: (s) => lottieRef.current?.setSpeed(s),
      setDirection: (d) => lottieRef.current?.setDirection(d),
      goToAndStop: (f) => lottieRef.current?.goToAndStop(f, true),
    }));

    if (hasError || prefersReducedMotion) {
      return fallback ? (
        <>{fallback}</>
      ) : (
        <div className={`flex items-center justify-center ${className}`} style={style}>
          <div className="w-12 h-12 rounded-full bg-vendy-primary/20 animate-pulse" />
        </div>
      );
    }

    return (
      <div className={className} style={style}>
        <Lottie
          lottieRef={lottieRef}
          animationData={src}
          loop={loop}
          autoplay={autoplay}
          renderer={renderer}
          onComplete={onComplete}
          onLoadedImages={onLoad}
          onError={() => {
            setHasError(true);
            onError?.();
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }
);

LottiePlayer.displayName = 'LottiePlayer';
