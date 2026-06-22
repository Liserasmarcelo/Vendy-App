/**
 * CartAddAnimation.tsx
 * Ícono de carrito que se llena al agregar producto.
 * Control programático: play() desde el padre.
 */

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { LottiePlayer, LottiePlayerHandle } from './LottiePlayer';

import cartAdd from '../../assets/animations/cart-add.json';

export interface CartAddHandle {
  play: () => void;
}

export const CartAddAnimation = forwardRef<CartAddHandle, { className?: string }>(
  ({ className = '' }, ref) => {
    const playerRef = useRef<LottiePlayerHandle>(null);

    useImperativeHandle(ref, () => ({
      play: () => playerRef.current?.play(),
    }));

    return (
      <div className={`w-10 h-10 ${className}`}>
        <LottiePlayer
          ref={playerRef}
          src={cartAdd}
          loop={false}
          autoplay={false}
          style={{ width: 40, height: 40 }}
          fallback={
            <div className="w-10 h-10 flex items-center justify-center text-vendy-primary">
              🛒
            </div>
          }
        />
      </div>
    );
  }
);

CartAddAnimation.displayName = 'CartAddAnimation';
