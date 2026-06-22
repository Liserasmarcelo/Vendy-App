/**
 * SplashAnimation.tsx
 * Pantalla de carga inicial con logo Lottie + barra de progreso.
 * Haptic: medium → selection → success.
 * Auto-navigate al completar.
 */

import React, { useEffect, useRef, useState } from 'react';
import { LottiePlayer, LottiePlayerHandle } from './LottiePlayer';
import { useHaptic } from '../../hooks/useHaptic';
import { useLottiePreload } from '../../hooks/useLottiePreload';

// TODO: Crear asset vendy-logo.json
// import vendyLogo from '../../assets/animations/vendy-logo.json';
const vendyLogo = {} as object; // Placeholder hasta tener el JSON

interface Props {
  onComplete: () => void;
  minDuration?: number;  // ms, default 2500
}

export function SplashAnimation({ onComplete, minDuration = 2500 }: Props) {
  const lottieRef = useRef<LottiePlayerHandle>(null);
  const { impact, notification } = useHaptic();
  const [progress, setProgress] = useState(0);
  const startTime = useRef(performance.now());

  useLottiePreload(['/assets/animations/vendy-logo.json']);

  useEffect(() => {
    // Haptic de inicio
    impact('medium');

    // Simular progreso de carga
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime.current;
      const pct = Math.min((elapsed / minDuration) * 100, 100);
      setProgress(pct);

      if (pct >= 50 && pct < 55) {
        // Feedback de mitad de carga
        impact('light');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [minDuration, impact]);

  const handleComplete = () => {
    const elapsed = performance.now() - startTime.current;
    const remaining = Math.max(0, minDuration - elapsed);

    // Esperar al menos minDuration
    setTimeout(() => {
      notification('success');
      impact('light');
      onComplete();
    }, remaining);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-vendy-bg">
      <div className="w-48 h-48">
        <LottiePlayer
          ref={lottieRef}
          src={vendyLogo}
          loop={false}
          autoplay={true}
          onComplete={handleComplete}
          fallback={
            <div className="w-48 h-48 rounded-2xl bg-vendy-primary/20 flex items-center justify-center">
              <span className="text-4xl">🔶</span>
            </div>
          }
        />
      </div>

      <h1 className="text-2xl font-bold text-vendy-primary mt-6">
        Vendy
      </h1>

      <p className="text-gray-1 mt-2 text-sm">
        {progress < 100 ? 'Cargando tu tienda...' : 'Listo'}
      </p>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-gray-2 rounded-full mt-4 overflow-hidden">
        <div
          className="h-full bg-vendy-primary rounded-full transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-gray-3 text-xs mt-2">
        {Math.round(progress)}%
      </p>
    </div>
  );
}
