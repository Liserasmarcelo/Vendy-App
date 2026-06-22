/**
 * useHaptic.ts
 * Wrapper tipado y seguro para Telegram WebApp HapticFeedback.
 * Throttling integrado para evitar saturación del dispositivo.
 */

import { useCallback, useRef } from 'react';
import { getWebApp } from '../lib/telegram';

export type HapticImpact = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type HapticNotification = 'success' | 'error' | 'warning';

const THROTTLE_MS = 80; // Máximo ~12 haptics/segundo

export function useHaptic() {
  const webApp = getWebApp();
  const lastCall = useRef<number>(0);

  const throttled = useCallback(
    (fn: () => void) => {
      const now = Date.now();
      if (now - lastCall.current < THROTTLE_MS) return;
      lastCall.current = now;
      fn();
    },
    []
  );

  const impact = useCallback(
    (style: HapticImpact) => {
      if (!webApp?.HapticFeedback?.impactOccurred) return;
      throttled(() => webApp.HapticFeedback!.impactOccurred!(style));
    },
    [webApp, throttled]
  );

  const notification = useCallback(
    (type: HapticNotification) => {
      if (!webApp?.HapticFeedback?.notificationOccurred) return;
      throttled(() => webApp.HapticFeedback!.notificationOccurred!(type));
    },
    [webApp, throttled]
  );

  const selection = useCallback(() => {
    if (!webApp?.HapticFeedback?.selectionChanged) return;
    throttled(() => webApp.HapticFeedback!.selectionChanged!());
  }, [webApp, throttled]);

  const isSupported = useCallback(() => {
    return !!webApp?.HapticFeedback;
  }, [webApp]);

  return { impact, notification, selection, isSupported };
}
