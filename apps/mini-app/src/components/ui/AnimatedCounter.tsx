/**
 * AnimatedCounter.tsx
 * Número que anima su cambio con contador suave.
 * Ideal para totales, precios, cantidades.
 */

import React from 'react';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

interface Props {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 600,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}: Props) {
  const display = useAnimatedNumber(value, {
    duration,
    decimals,
    prefix,
    suffix
  });

  return (
    <span className={`tabular-nums ${className}`}>
      {display}
    </span>
  );
}
