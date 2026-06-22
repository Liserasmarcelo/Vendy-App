/**
 * OnboardingTutorial.tsx
 * Tutorial de 3 pasos con Lottie + swipe entre pasos.
 * Skip siempre visible. Haptic en cada avance.
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LottiePlayer, LottiePlayerHandle } from './LottiePlayer';
import { useHaptic } from '../../hooks/useHaptic';
import { AnimatedButton } from '../ui/AnimatedButton';

// TODO: Crear assets
// import onboardingStep1 from '../../assets/animations/onboarding-step1.json';
// import onboardingStep2 from '../../assets/animations/onboarding-step2.json';
// import onboardingStep3 from '../../assets/animations/onboarding-step3.json';
const onboardingStep1 = {} as object;
const onboardingStep2 = {} as object;
const onboardingStep3 = {} as object;

interface Step {
  title: string;
  description: string;
  animation: object;
}

const steps: Step[] = [
  {
    title: 'Crea tu tienda',
    description: 'Configura tu marca en menos de 2 minutos',
    animation: onboardingStep1
  },
  {
    title: 'Agrega productos',
    description: 'Sube fotos, precios y descripciones fácilmente',
    animation: onboardingStep2
  },
  {
    title: 'Recibe pedidos',
    description: 'Vende directamente en Telegram',
    animation: onboardingStep3
  }
];

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTutorial({ onComplete, onSkip }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const { impact, notification } = useHaptic();
  const lottieRef = useRef<LottiePlayerHandle>(null);

  const goNext = () => {
    impact('medium');

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      lottieRef.current?.play();
    } else {
      notification('success');
      onComplete();
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      impact('light');
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="flex flex-col h-screen bg-vendy-bg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`
                h-1 rounded-full transition-all duration-300
                ${i === currentStep ? 'w-8 bg-vendy-primary' : 'w-4 bg-gray-2'}
              `}
            />
          ))}
        </div>
        <button
          onClick={onSkip}
          className="text-gray-3 text-sm hover:text-vendy-text transition-colors"
        >
          Saltar
        </button>
      </div>

      {/* Animation */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full max-w-sm"
          >
            <div className="w-64 h-64 mx-auto">
              <LottiePlayer
                ref={lottieRef}
                src={step.animation}
                loop={true}
                autoplay={true}
                style={{ width: 256, height: 256 }}
                fallback={
                  <div className="w-64 h-64 flex items-center justify-center text-6xl">
                    {currentStep === 0 && '🏪'}
                    {currentStep === 1 && '📦'}
                    {currentStep === 2 && '💰'}
                  </div>
                }
              />
            </div>

            <h2 className="text-2xl font-bold text-vendy-text text-center mt-6">
              {step.title}
            </h2>
            <p className="text-gray-1 text-center mt-2">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex gap-3 mt-8">
        {currentStep > 0 && (
          <AnimatedButton
            variant="ghost"
            className="flex-1"
            onClick={goBack}
          >
            ← Atrás
          </AnimatedButton>
        )}
        <AnimatedButton
          variant="primary"
          className="flex-1"
          haptic="medium"
          onClick={goNext}
        >
          {currentStep === steps.length - 1 ? '¡Empezar!' : 'Siguiente →'}
        </AnimatedButton>
      </div>
    </div>
  );
}