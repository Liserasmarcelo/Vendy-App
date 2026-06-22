# Vendy - Animaciones Lottie + Haptic Feedback - Plan de Implementación

## Resumen Ejecutivo

Este documento define la estrategia de animaciones y haptic feedback para enriquecer la UX de Vendy (Store-as-a-Service en Telegram). Combina Lottie para animaciones vectoriales, GSAP/Framer Motion para transiciones, y Haptic Feedback nativo de Telegram para crear una experiencia premium.

**Stack:** React + Vite + Tailwind + lottie-react + GSAP + Framer Motion  
**Tamaño estimado de assets:** ~200KB total (~60KB gzip)  
**Haptic:** Nativo Telegram (0KB adicional)

---

## 1. Prioridades de Implementación

### Fase 1: Core Experience (Sprint 14) - ~114KB
| Pantalla | Animación | Haptic | Tamaño |
|----------|-----------|--------|--------|
| Splash/Loading | Lottie logo morphing | medium → selection → success | ~30KB |
| Catálogo | Lottie cart-fill + badge pop | light → medium + success | ~13KB |
| Checkout | Lottie payment processing | medium → selection → success | ~31KB |
| Confirmación Orden | Lottie celebration + confetti | success (celebración) | ~40KB |

### Fase 2: Polish (Sprint 15) - ~18KB
| Pantalla | Animación | Haptic | Tamaño |
|----------|-----------|--------|--------|
| Home/Dashboard | GSAP stagger cards | light (tap) | 0KB |
| Carrito | Framer Motion reorder + counter | error (delete) → success (cupón) | 0KB |
| Órdenes/Seguimiento | Lottie truck + timeline | selection → medium | ~10KB |
| Admin Dashboard | GSAP stagger + Lottie icons | light → warning → error | ~8KB |

### Fase 3: Onboarding (Sprint 16) - ~45KB
| Pantalla | Animación | Haptic | Tamaño |
|----------|-----------|--------|--------|
| Onboarding | Lottie tutorial steps (3 pasos) | medium → success | ~45KB |

---

## 2. Librerías a Instalar

```bash
# Lottie (animaciones vectoriales)
npm install lottie-react

# GSAP (animaciones imperativas avanzadas)
npm install gsap

# Framer Motion (animaciones declarativas React)
npm install framer-motion

# Opcional: rlottie (solo si hay problemas de performance)
# npm install rlottie
```

---

## 3. Estructura de Archivos

```
apps/mini-app/
├── src/
│   ├── components/
│   │   ├── animations/
│   │   │   ├── LottiePlayer.tsx          # Wrapper genérico
│   │   │   ├── SplashAnimation.tsx         # Logo loading
│   │   │   ├── CartAddAnimation.tsx        # Carrito que se llena
│   │   │   ├── PaymentProcessing.tsx       # Procesando pago
│   │   │   ├── SuccessCelebration.tsx      # Confeti + checkmark
│   │   │   ├── OrderTimeline.tsx           # Timeline de estados
│   │   │   └── TruckAnimation.tsx          # Camión en movimiento
│   │   ├── ui/
│   │   │   ├── AnimatedButton.tsx          # Botón con ripple + haptic
│   │   │   ├── AnimatedCounter.tsx         # Número animado
│   │   │   ├── AnimatedCard.tsx            # Card con stagger
│   │   │   └── SkeletonLoader.tsx          # Shimmer effect
│   │   └── ...
│   ├── hooks/
│   │   ├── useHaptic.ts                    # Wrapper tipado de haptic
│   │   ├── useAnimatedNumber.ts            # Contador animado
│   │   └── useLottiePreload.ts             # Precarga de animaciones
│   └── assets/
│       └── animations/
│           ├── vendy-logo.json
│           ├── cart-add.json
│           ├── payment-processing.json
│           ├── success-celebration.json
│           ├── confetti-burst.json
│           ├── truck-delivery.json
│           ├── checkmark.json
│           └── toggle-switch.json
```

---

## 4. Haptic Feedback Matrix

| Acción | Tipo | Intensidad | Cuándo |
|--------|------|------------|--------|
| Tap en botón/link | impact | light | Siempre |
| Tap en card importante | impact | medium | Producto, orden |
| Acción destructiva (eliminar) | notification | error | Carrito, producto |
| Acción exitosa (agregar, pagar) | notification | success | Carrito, checkout |
| Seleccionar opción | selection | - | Color, método pago |
| Scroll rápido | selection | - | Cada 5 items |
| Proceso en progreso | selection | - | Cada 0.5s durante pago |
| Llegar al final de lista | impact | soft | Catálogo, órdenes |
| Celebración (compra) | notification | success | Confirmación orden |
| Alerta (stock bajo) | notification | warning | Admin, errores |

---

## 5. Animaciones por Pantalla

### 5.1 Splash / Loading Screen

**Animación:** Lottie - Logo Vendy morphing (hexágono → V → carrito)  
**Duración:** 2.5s, loop: false  
**Color:** #FF7403 con glow sutil  
**Haptic:**
- Inicio: `impactOccurred('medium')`
- 50% progreso: `selectionChanged()`
- Completado: `notificationOccurred('success')` + `impactOccurred('light')`

**Implementación:**
```tsx
// src/components/animations/SplashAnimation.tsx
import Lottie from 'lottie-react';
import vendyLogo from '../../assets/animations/vendy-logo.json';

export function SplashAnimation() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Lottie 
        animationData={vendyLogo} 
        loop={false}
        style={{ width: 200, height: 200 }}
        onComplete={() => {
          haptic.notificationOccurred('success');
          haptic.impactOccurred('light');
        }}
      />
      <p className="text-gray-1 mt-4">Cargando tu tienda...</p>
    </div>
  );
}
```

**Asset:** `assets/animations/vendy-logo.json` (~30KB)

---

### 5.2 Home / Dashboard

**Animación:** GSAP Stagger - Cards de entrada  
**Efecto:** fadeInUp con delay 0.1s entre cada card  
**Haptic:** `impactOccurred('light')` al tocar cada StatsCard

**Implementación:**
```tsx
// src/components/AnimatedCard.tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function AnimatedCards({ children }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    const cards = containerRef.current?.children;
    if (!cards) return;
    
    gsap.from(cards, {
      y: 50,
      opacity: 0,
      duration: 0.4,
      stagger: 0.1,
      ease: 'power2.out'
    });
  }, []);
  
  return <div ref={containerRef} className="grid grid-cols-3 gap-4">{children}</div>;
}
```

**Asset:** Ninguno (CSS/JS puro)

---

### 5.3 Catálogo / Lista de Productos

**Animación:** Lottie cart-fill + badge pop  
**Efecto:**
1. Card: scale(0.96) → scale(1) con spring (0.2s)
2. Ícono carrito: Lottie play desde frame 0 (vacío → lleno)
3. Badge cantidad: pop animation (scale 0 → 1.2 → 1)

**Haptic:**
- Tap en producto: `impactOccurred('light')`
- Agregar al carrito: `impactOccurred('medium')` + `notificationOccurred('success')`
- Scroll rápido: `selectionChanged()` (cada 5 items)
- Pull-to-refresh: `impactOccurred('medium')`

**Implementación:**
```tsx
// src/components/ProductCard.tsx (actualizar)
import Lottie from 'lottie-react';
import cartAdd from '../../assets/animations/cart-add.json';

export function ProductCard({ product }) {
  const lottieRef = useRef(null);
  
  const handleAddToCart = () => {
    haptic.impactOccurred('medium');
    haptic.notificationOccurred('success');
    lottieRef.current?.play();
  };
  
  return (
    <div className="telegram-card active:scale-[0.98] transition-transform">
      {/* ... product info ... */}
      <button onClick={handleAddToCart} className="relative">
        <Lottie 
          lottieRef={lottieRef}
          animationData={cartAdd}
          loop={false}
          autoplay={false}
          style={{ width: 40, height: 40 }}
        />
        <span className="absolute -top-2 -right-2 bg-vendy-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs animate-pop">
          {cartCount}
        </span>
      </button>
    </div>
  );
}
```

**Assets:**
- `assets/animations/cart-add.json` (~8KB)
- `assets/animations/pull-refresh.json` (~5KB)

---

### 5.4 Detalle de Producto

**Animación:** Lottie confetti + variant selector  
**Efecto:**
- Galería: parallax effect entre imágenes (CSS transform)
- Selector color: Lottie checkmark que aparece al seleccionar (0.3s)
- Botón agregar: ripple effect + Lottie confetti burst (1s)

**Haptic:**
- Swipe imagen: `impactOccurred('light')`
- Seleccionar color: `impactOccurred('light')` + `selectionChanged()`
- Cambiar cantidad: `impactOccurred('light')`
- Agregar al carrito: `impactOccurred('heavy')` + `notificationOccurred('success')`

**Assets:**
- `assets/animations/checkmark.json` (~3KB)
- `assets/animations/confetti-burst.json` (~15KB)

---

### 5.5 Carrito

**Animación:** Framer Motion - Lista con reorder + swipe-to-delete  
**Efecto:**
- Swipe left: reveal delete button con red background
- Eliminar: slideOutRight + items debajo slideUp (0.3s)
- Total: número animado con contador (0.5s)
- Cupón: Lottie checkmark + "−10%" fadeIn

**Haptic:**
- Swipe para eliminar: `notificationOccurred('error')`
- Eliminar confirmado: `impactOccurred('medium')`
- Cambiar cantidad: `impactOccurred('light')`
- Aplicar cupón: `notificationOccurred('success')`

**Implementación:**
```tsx
// src/components/CartItem.tsx
import { motion, AnimatePresence } from 'framer-motion';

export function CartList({ items }) {
  return (
    <AnimatePresence mode="popLayout">
      {items.map(item => (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
        >
          <CartItem item={item} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

**Asset:** Ninguno (Framer Motion)

---

### 5.6 Checkout / Pago

**Animación:** Lottie payment processing + step indicator  
**Efecto:**
- Step indicator: línea que se "llena" con color #FF7403
- Form transitions: GSAP slide entre pasos (0.4s)
- Radio buttons: Lottie fill animation (0.2s)
- Procesamiento: Lottie tarjeta insertándose + checkmark verde (2s)
- Progress bar: CSS animated width + haptic pulso

**Haptic:**
- Avanzar paso: `impactOccurred('medium')`
- Seleccionar método: `selectionChanged()`
- Iniciar procesamiento: `impactOccurred('heavy')`
- Durante procesamiento: `selectionChanged()` (0.5s interval)
- Pago exitoso: `notificationOccurred('success')` + `impactOccurred('medium')`
- Pago fallido: `notificationOccurred('error')`

**Assets:**
- `assets/animations/step-progress.json` (~8KB)
- `assets/animations/payment-processing.json` (~20KB)
- `assets/animations/radio-fill.json` (~3KB) o CSS puro

---

### 5.7 Confirmación de Orden

**Animación:** Lottie success celebration + confetti  
**Efecto:**
- Checkmark verde con stroke animation (3-4s)
- Confetti que cae desde arriba
- "¡Éxito!" que aparece con bounce
- Color: verde éxito + #FF7403 acentos

**Haptic:**
- Al mostrar: `notificationOccurred('success')` (patrón: largo + corto + largo)
- Al tocar botones: `impactOccurred('light')`

**Implementación:**
```tsx
// src/components/animations/SuccessCelebration.tsx
import Lottie from 'lottie-react';
import successAnimation from '../../assets/animations/success-celebration.json';

export function SuccessCelebration() {
  useEffect(() => {
    // Celebration haptic pattern
    haptic.notificationOccurred('success');
    setTimeout(() => haptic.impactOccurred('medium'), 200);
    setTimeout(() => haptic.notificationOccurred('success'), 400);
  }, []);
  
  return (
    <div className="flex flex-col items-center">
      <Lottie 
        animationData={successAnimation}
        loop={false}
        style={{ width: 250, height: 250 }}
      />
      <motion.h2 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-2xl font-bold text-vendy-success"
      >
        ¡Orden confirmada!
      </motion.h2>
    </div>
  );
}
```

**Assets:**
- `assets/animations/success-celebration.json` (~25KB)
- `assets/animations/confetti-fall.json` (~15KB) - opcional

---

### 5.8 Órdenes / Seguimiento

**Animación:** Lottie truck + timeline animada  
**Efecto:**
- Timeline: CSS flex + pseudo-elements para línea
- Truck: Lottie loop o CSS animation (translateX)
- Mapa: expande con slideDown (0.3s)
- Pin: Lottie bounce (0.5s)

**Haptic:**
- Ver orden activa: `selectionChanged()`
- Tocar "Seguir envío": `impactOccurred('medium')`
- Notificación de entrega: `notificationOccurred('success')`

**Asset:** `assets/animations/truck-moving.json` (~10KB) o CSS puro

---

### 5.9 Admin Dashboard

**Animación:** GSAP stagger + Lottie icons  
**Efecto:**
- Stats cards: stagger 0.08s (más rápido que home)
- Gráfico: SVG bars con CSS animation o GSAP
- Notificaciones: Lottie iconos pequeños (ojo, checkmark, warning)
- Toggle: CSS transition o Lottie (~3KB)

**Haptic:**
- Stats cards: `impactOccurred('light')`
- Hover en gráfico: `impactOccurred('light')`
- Nueva notificación: `notificationOccurred('warning')`
- Toggle producto: `impactOccurred('light')` + `selectionChanged()`
- Eliminar producto: `notificationOccurred('error')`

**Assets:**
- `assets/animations/eye-blink.json` (~5KB)
- `assets/animations/toggle-switch.json` (~3KB) o CSS puro

---

### 5.10 Onboarding

**Animación:** Lottie tutorial steps (3 pasos)  
**Efecto:**
- Paso 1: Mano que toca botón "Crear tienda" (loop, 3s)
- Paso 2: Producto siendo agregado
- Paso 3: Primera venta con confetti
- Transición: slide entre pasos (GSAP, 0.4s)

**Haptic:**
- Avanzar paso: `impactOccurred('medium')`
- Completar: `notificationOccurred('success')`

**Assets:**
- `assets/animations/onboarding-step1.json` (~15KB)
- `assets/animations/onboarding-step2.json` (~15KB)
- `assets/animations/onboarding-step3.json` (~15KB)

---

## 6. Hooks Reutilizables

### useHaptic.ts
```typescript
// src/hooks/useHaptic.ts
import { useCallback } from 'react';
import { getWebApp } from '../lib/telegram';

export function useHaptic() {
  const webApp = getWebApp();
  
  const impact = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    webApp?.HapticFeedback?.impactOccurred(style);
  }, [webApp]);
  
  const notification = useCallback((type: 'success' | 'error' | 'warning') => {
    webApp?.HapticFeedback?.notificationOccurred(type);
  }, [webApp]);
  
  const selection = useCallback(() => {
    webApp?.HapticFeedback?.selectionChanged();
  }, [webApp]);
  
  return { impact, notification, selection };
}
```

### useAnimatedNumber.ts
```typescript
// src/hooks/useAnimatedNumber.ts
import { useState, useEffect } from 'react';

export function useAnimatedNumber(target: number, duration: number = 500) {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    const start = performance.now();
    const from = current;
    
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCurrent(Math.round(from + (target - from) * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [target, duration]);
  
  return current;
}
```

### useLottiePreload.ts
```typescript
// src/hooks/useLottiePreload.ts
import { useEffect } from 'react';

const PRELOADED_ASSETS = new Set<string>();

export function useLottiePreload(urls: string[]) {
  useEffect(() => {
    urls.forEach(url => {
      if (PRELOADED_ASSETS.has(url)) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      PRELOADED_ASSETS.add(url);
    });
  }, [urls]);
}
```

---

## 7. Optimizaciones de Performance

### 7.1 Precarga crítica
```html
<!-- index.html -->
<link rel="preload" href="/animations/vendy-logo.json" as="fetch" crossorigin>
<link rel="preload" href="/animations/cart-add.json" as="fetch" crossorigin>
```

### 7.2 Lazy loading secundario
```tsx
const PaymentAnimation = lazy(() => import('./PaymentProcessing'));
```

### 7.3 Lottie renderer
- SVG (default): para animaciones < 20KB
- Canvas: para animaciones > 20KB o complejas

### 7.4 Reduce motion
```css
@media (prefers-reduced-motion: reduce) {
  .lottie-container { display: none; }
  .fallback-static { display: block; }
}
```

### 7.5 Haptic throttling
```typescript
const hapticThrottled = throttle(haptic.impact, 100); // max 10/s
```

---

## 8. Creación de Assets Lottie

### 8.1 Herramientas recomendadas
- **After Effects + Bodymovin**: Profesional, máximo control
- **LottieFiles**: Biblioteca gratuita de animaciones
- **Figma + LottieFiles plugin**: Diseño + animación en un flujo
- **Rive**: Alternativa moderna (más performante, menos madura)

### 8.2 Optimización
1. Usar lottiefiles.com/optimizer para reducir tamaño
2. Limitar a 30-60 frames por segundo
3. Evitar gradientes complejos (aumentan tamaño JSON)
4. Usar shapes simples en lugar de paths complejos
5. Eliminar keyframes innecesarios

### 8.3 Tamaños objetivo por animación
| Animación | Tamaño objetivo |
|-----------|----------------|
| Logo splash | < 30KB |
| Cart add | < 10KB |
| Checkmark | < 5KB |
| Payment processing | < 25KB |
| Success celebration | < 30KB |
| Truck delivery | < 15KB |
| Confetti burst | < 20KB |

---

## 9. A/B Testing de Animaciones

### Métricas a medir
- **Conversion rate**: ¿Checkout completion aumenta con animaciones?
- **Time on task**: ¿Usuarios completan tareas más rápido?
- **Error rate**: ¿Menos errores con haptic feedback?
- **User satisfaction**: NPS o rating post-compra
- **Bounce rate**: ¿Menos abandono en onboarding?

### Variantes a testear
1. **Splash**: Lottie vs CSS spinner vs nada
2. **Checkout**: Payment animation vs static progress bar
3. **Confirmación**: Celebration vs simple "Gracias" page
4. **Haptic**: Full haptic vs solo success/error vs nada

---

## 10. Checklist de Implementación

### Fase 1
- [ ] Instalar lottie-react, gsap, framer-motion
- [ ] Crear assets/animations/ con primeros 4 JSONs
- [ ] Implementar SplashAnimation
- [ ] Implementar CartAddAnimation en ProductCard
- [ ] Implementar PaymentProcessing en Checkout
- [ ] Implementar SuccessCelebration en OrderConfirmation
- [ ] Crear useHaptic hook
- [ ] Integrar haptic en todos los botones interactivos
- [ ] Testear en iOS y Android (haptic varía por plataforma)
- [ ] Medir bundle size impact

### Fase 2
- [ ] Implementar AnimatedCards con GSAP stagger
- [ ] Implementar Cart reorder con Framer Motion
- [ ] Implementar OrderTimeline con truck animation
- [ ] Implementar Admin icons Lottie
- [ ] Crear useAnimatedNumber hook
- [ ] Optimizar con lazy loading
- [ ] Añadir prefers-reduced-motion support

### Fase 3
- [ ] Crear onboarding tutorial steps
- [ ] Implementar QR scanner animation
- [ ] Añadir biometric auth animation
- [ ] Polish: timing, easing, colores
- [ ] A/B testing setup
- [ ] Documentación para diseñadores

---

## 11. Conclusiones

1. **Lottie es ideal para Vendy**: Animaciones vectoriales escalables, control programático, tamaño manejable (~200KB total)

2. **Haptic feedback es obligatorio**: Nativo de Telegram, aumenta percepción de calidad, diferencia app nativa de web promedio

3. **Combinación Lottie + Haptic = experiencia premium**: Animación visual + feedback táctil = doble confirmación, reduce ansiedad, crea momentos memorables

4. **rlottie no es necesario para MVP**: lottie-react es suficiente para 99% de casos. Considerar rlottie solo si hay problemas de performance en gama baja

5. **Implementación gradual**: Fase 1 (core) → Fase 2 (polish) → Fase 3 (onboarding). Cada fase ~1 sprint

---

*Documento creado: 2024-06-21*  
*Próxima revisión: Post-Fase 1 (Sprint 14)*
