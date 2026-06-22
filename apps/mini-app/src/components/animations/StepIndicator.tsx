/**
 * StepIndicator.tsx
 * Barra de progreso con fill animado vía GSAP.
 * Usado en checkout y onboarding.
 */

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Step {
  label: string;
  completed: boolean;
}

interface Props {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className = '' }: Props) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const progress = (currentStep / (steps.length - 1)) * 100;

    gsap.to(progressRef.current, {
      width: `${progress}%`,
      duration: 0.5,
      ease: 'power2.out'
    });
  }, [currentStep, steps.length]);

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar */}
      <div className="relative h-1 bg-gray-2 rounded-full mb-4">
        <div
          ref={progressRef}
          className="absolute top-0 left-0 h-full bg-vendy-primary rounded-full"
          style={{ width: '0%' }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`
              flex flex-col items-center
              ${i <= currentStep ? 'text-vendy-primary' : 'text-gray-3'}
            `}
          >
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1
                transition-colors duration-300
                ${i < currentStep
                  ? 'bg-vendy-primary text-white'
                  : i === currentStep
                    ? 'bg-vendy-primary/20 text-vendy-primary border-2 border-vendy-primary'
                    : 'bg-gray-2 text-gray-3'
                }
              `}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className="text-xs">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
