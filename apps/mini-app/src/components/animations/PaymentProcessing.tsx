/**
 * PaymentProcessing.tsx
 * Animación de "procesando pago" con tarjeta + checkmark.
 * Haptic pulsante durante el proceso.
 */

import React, { useEffect, useRef } from 'react';
import { LottiePlayer, LottiePlayerHandle } from './LottiePlayer';
import { useHaptic } from '../../hooks/useHaptic';

// TODO: Crear asset payment-processing.json
// import paymentProcessing from '../../assets/animations/payment-processing.json';
const paymentProcessing = {} as object; // Placeholder hasta tener el JSON

interface Props {
  progress: number;      // 0-100
  onComplete?: () => void;
}

export function PaymentProcessing({ progress, onComplete }: Props) {
  const playerRef = useRef<LottiePlayerHandle>(null);
  const { impact, selection } = useHaptic();
  const hapticInterval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Haptic pulsante cada 0.5s durante procesamiento
    hapticInterval.current = setInterval(() => {
      selection();
    }, 500);

    impact('heavy');

    return () => {
      if (hapticInterval.current) clearInterval(hapticInterval.current);
    };
  }, [impact, selection]);

  useEffect(() => {
    if (progress >= 100) {
      if (hapticInterval.current) clearInterval(hapticInterval.current);
      playerRef.current?.play();
      setTimeout(() => onComplete?.(), 500);
    }
  }, [progress, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-40 h-40">
        <LottiePlayer
          ref={playerRef}
          src={paymentProcessing}
          loop={false}
          autoplay={false}
          style={{ width: 160, height: 160 }}
          fallback={
            <div className="w-40 h-40 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-vendy-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }
        />
      </div>

      <h3 className="text-lg font-semibold text-vendy-text mt-4">
        Procesando pago...
      </h3>

      <div className="w-full max-w-xs h-2 bg-gray-2 rounded-full mt-4 overflow-hidden">
        <div
          className="h-full bg-vendy-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-gray-3 text-sm mt-2">
        {Math.round(progress)}%
      </p>

      <p className="text-gray-3 text-xs mt-4 text-center">
        No cierres la app
      </p>
    </div>
  );
}
