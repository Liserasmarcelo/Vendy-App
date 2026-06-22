/**
 * TruckAnimation.tsx
 * Camión en movimiento (loop continuo).
 * Usado en OrderTimeline y TrackingScreen.
 */

import React from 'react';
import { LottiePlayer } from './LottiePlayer';

import truckMoving from '../../assets/animations/truck-moving.json';

interface Props {
  className?: string;
  size?: number;
}

export function TruckAnimation({ className = '', size = 48 }: Props) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <LottiePlayer
        src={truckMoving}
        loop={true}
        autoplay={true}
        style={{ width: size, height: size }}
        fallback={
          <div className="text-2xl animate-bounce">🚚</div>
        }
      />
    </div>
  );
}
