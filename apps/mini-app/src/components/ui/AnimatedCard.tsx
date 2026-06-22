/**
 * AnimatedCard.tsx
 * Card con animación de entrada stagger vía GSAP.
 * Usado en Home Dashboard y Admin Dashboard.
 */

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Props {
  children: React.ReactNode;
  index?: number;      // Posición para stagger delay
  delay?: number;      // Delay override (ms)
  className?: string;
  onClick?: () => void;
}

export function AnimatedCard({
  children,
  index = 0,
  delay,
  className = '',
  onClick
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const staggerDelay = delay ?? index * 0.08; // 80ms entre cada card

    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 0.5,
      delay: staggerDelay,
      ease: 'power2.out'
    });
  }, [index, delay]);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`
        telegram-card p-4 rounded-2xl
        active:scale-[0.98] transition-transform duration-150
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
