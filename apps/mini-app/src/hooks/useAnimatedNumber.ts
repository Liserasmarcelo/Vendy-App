/**
 * useAnimatedNumber.ts
 * Contador numérico con easing easeOutCubic.
 * Ideal para totales, precios, cantidades en carrito.
 */

import { useState, useEffect, useRef } from 'react';

type EasingFn = (t: number) => number;

const easeOutCubic: EasingFn = (t) => 1 - Math.pow(1 - t, 3);
const easeOutExpo: EasingFn = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

interface Options {
  duration?: number;      // ms, default 600
  easing?: 'cubic' | 'expo';
  decimals?: number;    // default 0
  prefix?: string;      // ej: "$"
  suffix?: string;      // ej: "USD"
}

export function useAnimatedNumber(
  target: number,
  options: Options = {}
) {
  const {
    duration = 600,
    easing = 'cubic',
    decimals = 0,
    prefix = '',
    suffix = ''
  } = options;

  const [display, setDisplay] = useState(prefix + target.toFixed(decimals) + suffix);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(target);

  useEffect(() => {
    const from = parseFloat(display.replace(prefix, '').replace(suffix, '')) || 0;
    fromRef.current = from;
    startRef.current = performance.now();

    const easeFn = easing === 'expo' ? easeOutExpo : easeOutCubic;

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeFn(progress);
      const current = from + (target - from) * eased;

      setDisplay(
        prefix + current.toFixed(decimals) + suffix
      );

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, easing, decimals, prefix, suffix]);

  return display;
}
