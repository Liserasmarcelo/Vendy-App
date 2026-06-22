/**
 * AnimatedButton.tsx
 * Botón con ripple effect CSS + haptic integrado.
 * Sustituye a <button> estándar en toda la app.
 */

import React, { useRef, useCallback } from 'react';
import { useHaptic } from '../../hooks/useHaptic';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  ripple?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
  children: React.ReactNode;
}

export function AnimatedButton({
  variant = 'primary',
  size = 'md',
  ripple = true,
  haptic = 'light',
  children,
  onClick,
  className = '',
  ...props
}: Props) {
  const { impact } = useHaptic();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Haptic
      if (haptic !== 'none') {
        impact(haptic);
      }

      // Ripple
      if (ripple && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rippleEl = document.createElement('span');
        rippleEl.style.cssText = `
          position: absolute;
          left: ${x}px;
          top: ${y}px;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: ripple-effect 0.6s ease-out;
          pointer-events: none;
        `;

        buttonRef.current.appendChild(rippleEl);
        setTimeout(() => rippleEl.remove(), 600);
      }

      onClick?.(e);
    },
    [haptic, impact, ripple, onClick]
  );

  const variantStyles = {
    primary: 'bg-vendy-primary text-white shadow-vendy',
    secondary: 'bg-gray-2 text-vendy-text',
    danger: 'bg-red-500 text-white',
    ghost: 'bg-transparent text-vendy-primary'
  };

  const sizeStyles = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4 text-base',
    lg: 'py-4 px-6 text-lg'
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`
        relative overflow-hidden rounded-xl font-medium
        active:scale-95 transition-transform duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
