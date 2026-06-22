/**
 * SuccessCelebration.tsx
 * Celebración de compra exitosa: confetti + checkmark + "¡Éxito!".
 * Haptic: patrón de celebración (success + medium + success).
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LottiePlayer } from './LottiePlayer';
import { useHaptic } from '../../hooks/useHaptic';

import successCelebration from '../../assets/animations/success-celebration.json';
import confettiFall from '../../assets/animations/confetti-fall.json';

interface Props {
  orderNumber: string;
  total: string;
  onViewOrder: () => void;
  onBackHome: () => void;
  autoCloseDelay?: number; // ms, default 5000
}

export function SuccessCelebration({
  orderNumber,
  total,
  onViewOrder,
  onBackHome,
  autoCloseDelay = 5000
}: Props) {
  const { impact, notification } = useHaptic();

  useEffect(() => {
    // Patrón de celebración haptic
    notification('success');
    setTimeout(() => impact('medium'), 200);
    setTimeout(() => notification('success'), 400);

    // Auto-navigate después del delay
    const timer = setTimeout(() => {
      onBackHome();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [impact, notification, autoCloseDelay, onBackHome]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden">
      {/* Confetti de fondo */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <LottiePlayer
          src={confettiFall}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Animación principal */}
      <div className="w-48 h-48 relative z-10">
        <LottiePlayer
          src={successCelebration}
          loop={false}
          autoplay={true}
          style={{ width: 192, height: 192 }}
          fallback={
            <div className="w-48 h-48 flex items-center justify-center text-6xl">
              ✅
            </div>
          }
        />
      </div>

      {/* Texto con bounce */}
      <motion.h2
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
        className="text-2xl font-bold text-vendy-success mt-4 relative z-10"
      >
        ¡Orden confirmada!
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-gray-1 mt-2 relative z-10"
      >
        Orden #{orderNumber}
      </motion.p>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xl font-semibold text-vendy-text mt-2 relative z-10"
      >
        Total: {total}
      </motion.p>

      {/* Botones */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-3 mt-8 relative z-10 w-full max-w-xs"
      >
        <button
          onClick={onViewOrder}
          className="flex-1 py-3 px-4 bg-vendy-primary text-white rounded-xl font-medium active:scale-95 transition-transform"
        >
          📋 Ver mi orden
        </button>
        <button
          onClick={onBackHome}
          className="flex-1 py-3 px-4 bg-gray-2 text-vendy-text rounded-xl font-medium active:scale-95 transition-transform"
        >
          🏠 Inicio
        </button>
      </motion.div>

      <p className="text-gray-3 text-xs mt-6 relative z-10">
        Cerrando automáticamente en {autoCloseDelay / 1000}s...
      </p>
    </div>
  );
}
