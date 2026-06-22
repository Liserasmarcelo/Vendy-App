/**
 * animations.ts
 * Configuración central de animaciones.
 * Easing curves, duraciones, delays reutilizables.
 */

// Easing curves
export const easing = {
  easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: { type: 'spring' as const, stiffness: 300, damping: 20 }
};

// Duraciones estándar (ms)
export const duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  celebratory: 800
};

// Stagger delays (s)
export const stagger = {
  tight: 0.05,   // 50ms - dashboard stats
  normal: 0.08,  // 80ms - cards
  relaxed: 0.12, // 120ms - list items
  loose: 0.2     // 200ms - onboarding steps
};

// Haptic presets
export const hapticPresets = {
  tap: { type: 'impact' as const, style: 'light' as const },
  action: { type: 'impact' as const, style: 'medium' as const },
  important: { type: 'impact' as const, style: 'heavy' as const },
  success: { type: 'notification' as const, notification: 'success' as const },
  error: { type: 'notification' as const, notification: 'error' as const },
  warning: { type: 'notification' as const, notification: 'warning' as const },
  selection: { type: 'selection' as const }
};

// Animation config para Lottie
export const animationConfig = {
  default: {
    renderer: 'svg' as const,
    loop: false,
    autoplay: true
  },
  loop: {
    renderer: 'svg' as const,
    loop: true,
    autoplay: true
  },
  heavy: {
    renderer: 'canvas' as const,
    loop: false,
    autoplay: true
  }
};