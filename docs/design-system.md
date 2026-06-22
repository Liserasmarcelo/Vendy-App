# Vendy Design System

**Producto:** Vendy — Store-as-a-Service para Telegram
**Versión:** 1.0
**Fecha:** 2026-06-17
**Tema:** Oscuro obligatorio (no hay light mode)

---

## 1. Filosofía de Diseño

"Tu tienda donde ya conversas. Sin código. En 3 minutos."

- **Minimalismo funcional:** Cada elemento debe tener un propósito claro.
- **Familiaridad iOS/Android:** Usuarios ya conocen patrones de apps nativas.
- **Accesibilidad:** Contraste alto, touch targets >= 44px, lectura clara.
- **Performance:** Animaciones 60fps, carga < 2s, sin layout shift.

---

## 2. Paleta de Colores

### Primarios

| Token | Hex | Uso |
|-------|-----|-----|
| `--vendy-primary` | `#FF7403` | Botones primarios, precios, CTA, acentos |
| `--vendy-primary-hover` | `#E66800` | Estados hover/active de primario |
| `--vendy-primary-light` | `#FF9A4D` | Acentos sutiles, highlights, gradientes |

### Fondos (Tema Oscuro)

| Token | Hex | Uso |
|-------|-----|-----|
| `--vendy-bg` | `#000000` | Fondo principal de la app |
| `--vendy-bg-elevated` | `#1C1C1E` | Cards, modales, inputs, secciones elevadas |
| `--vendy-bg-secondary` | `#2C2C2E` | Hover states, separadores sutiles, backgrounds secundarios |

### Texto

| Token | Hex | Uso |
|-------|-----|-----|
| `--vendy-text-primary` | `#FFFFFF` | Títulos, texto principal, labels |
| `--vendy-text-secondary` | `#8E8E93` | Subtítulos, descripciones, placeholders |
| `--vendy-text-tertiary` | `#48484A` | Texto deshabilitado, hints, timestamps |

### Estados Semánticos

| Token | Hex | Uso |
|-------|-----|-----|
| `--vendy-success` | `#34C759` | Éxito, checkmarks, confirmaciones, estados positivos |
| `--vendy-danger` | `#FF3B30` | Errores, eliminar, alertas críticas |
| `--vendy-warning` | `#FF9500` | Advertencias, badges trial, atención requerida |
| `--vendy-info` | `#0A84FF` | Información, links, badges informativos |

### Bordes y Overlays

| Token | Hex | Uso |
|-------|-----|-----|
| `--vendy-border` | `#38383A` | Bordes sutiles, divisores, separadores |
| `--vendy-overlay` | `rgba(0,0,0,0.7)` | Overlays de modales, backdrops, loading states |

---

## 3. Tipografía

### Familia

**Font:** `Inter` (Google Fonts)
**Fallbacks:** `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Pesos

| Peso | Valor | Uso |
|------|-------|-----|
| Regular | 400 | Body text, descripciones, labels |
| Medium | 500 | Subtítulos, nombres de productos, botones secundarios |
| Semibold | 600 | Títulos de sección, precios, botones primarios |
| Bold | 700 | Hero titles, números grandes, badges |

### Escala (Mobile-first, base 16px)

| Token | Tamaño | Línea | Peso | Uso |
|-------|--------|-------|------|-----|
| `text-hero` | 28px | 32px | 700 | Título principal de pantalla |
| `text-h1` | 24px | 28px | 600 | Títulos de sección |
| `text-h2` | 20px | 24px | 600 | Subtítulos, nombres de tienda |
| `text-h3` | 18px | 22px | 600 | Títulos de card, nombres de producto |
| `text-body` | 16px | 20px | 400 | Texto principal, descripciones |
| `text-body-sm` | 14px | 18px | 400 | Texto secundario, metadatos |
| `text-caption` | 12px | 16px | 500 | Labels, badges, timestamps, hints |
| `text-price` | 20px | 24px | 700 | Precios, totales, montos |
| `text-button` | 16px | 20px | 600 | Texto de botones |

---

## 4. Espaciado

### Sistema de 8px

| Token | Valor | Uso |
|-------|-------|-----|
| `space-1` | 4px | Micro-ajustes, icon gaps |
| `space-2` | 8px | Gap entre elementos relacionados, padding interno pequeño |
| `space-3` | 12px | Padding de botones, gap entre icon + text |
| `space-4` | 16px | Padding estándar de cards, secciones |
| `space-5` | 20px | Padding generoso, separación entre secciones |
| `space-6` | 24px | Padding de pantalla, separación entre bloques |
| `space-8` | 32px | Separación entre secciones grandes |
| `space-10` | 40px | Padding de pantalla completa, hero sections |

### Layout

- **Pantalla:** Padding horizontal 16px (móvil), 24px (tablet)
- **Cards:** Padding 16px, gap entre cards 8px
- **Listas:** Gap entre items 8px
- **Formularios:** Gap entre fields 16px

---

## 5. Bordes y Radios

| Token | Valor | Uso |
|-------|-------|-----|
| `radius-sm` | 4px | Badges, tags, chips |
| `radius-md` | 8px | Botones, inputs, small cards |
| `radius-lg` | 12px | Cards principales, modales, secciones |
| `radius-xl` | 16px | Hero banners, bottom sheets |
| `radius-full` | 9999px | Avatares, iconos circulares, botones pill |

---

## 6. Sombras (Tema Oscuro)

En tema oscuro las sombras son sutiles y se usan principalmente para elevación:

| Token | Valor | Uso |
|-------|-------|-----|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Elevación mínima, cards compactas |
| `shadow-md` | `0 4px 8px rgba(0,0,0,0.4)` | Cards estándar, dropdowns |
| `shadow-lg` | `0 8px 16px rgba(0,0,0,0.5)` | Modales, bottom sheets, overlays |
| `shadow-glow` | `0 0 20px rgba(255,116,3,0.15)` | Glow sutil alrededor de elementos primarios |

---

## 7. Componentes Base

### Botones

#### Primario
- Background: `--vendy-primary`
- Texto: `#FFFFFF`
- Border-radius: `radius-md` (8px)
- Padding: 12px 20px
- Font: `text-button` (16px, 600)
- Hover: `--vendy-primary-hover`, scale(1.02)
- Active: scale(0.98)
- Disabled: opacity 0.5, cursor not-allowed

#### Secundario
- Background: `--vendy-bg-elevated`
- Texto: `--vendy-text-primary`
- Border: 1px solid `--vendy-border`
- Border-radius: `radius-md` (8px)
- Padding: 12px 20px
- Hover: `--vendy-bg-secondary`

#### Ghost
- Background: transparent
- Texto: `--vendy-primary`
- Padding: 12px 20px
- Hover: `rgba(255,116,3,0.1)`

#### Icon Button
- Size: 44px × 44px (touch target mínimo)
- Background: `--vendy-bg-elevated`
- Border-radius: `radius-md` (8px)
- Icon: 24px, color `--vendy-text-secondary`
- Hover: `--vendy-bg-secondary`, icon `--vendy-text-primary`

### Inputs

- Background: `--vendy-bg-elevated`
- Border: 1px solid `--vendy-border`
- Border-radius: `radius-md` (8px)
- Padding: 12px 16px
- Font: `text-body` (16px, 400)
- Color: `--vendy-text-primary`
- Placeholder: `--vendy-text-secondary`
- Focus: border-color `--vendy-primary`, shadow-glow
- Error: border-color `--vendy-danger`, icon error
- Disabled: opacity 0.5, background `--vendy-bg-secondary`

### Cards

- Background: `--vendy-bg-elevated`
- Border-radius: `radius-lg` (12px)
- Padding: 16px
- Shadow: `shadow-md`
- Hover: `shadow-lg`, translateY(-2px)
- Border: 1px solid `--vendy-border` (opcional, para definición extra)

### Badges

#### Estado Trial
- Background: `rgba(10,132,255,0.15)`
- Texto: `--vendy-info`
- Border-radius: `radius-sm` (4px)
- Padding: 4px 8px
- Font: `text-caption` (12px, 500)

#### Alerta
- Background: `rgba(255,59,48,0.15)`
- Texto: `--vendy-danger`
- Border-radius: `radius-sm` (4px)
- Padding: 4px 8px

#### Éxito
- Background: `rgba(52,199,89,0.15)`
- Texto: `--vendy-success`
- Border-radius: `radius-sm` (4px)
- Padding: 4px 8px

---

## 8. Iconografía

- **Set principal:** Lucide React (lucide-react)
- **Tamaños:**
  - Small: 16px (badges, inline)
  - Medium: 20px (botones, list items)
  - Large: 24px (navigation, headers)
  - XL: 32px (empty states, hero)
- **Color default:** `--vendy-text-secondary`
- **Color active:** `--vendy-primary`
- **Color disabled:** `--vendy-text-tertiary`

---

## 9. Animaciones

### Transiciones

| Token | Duración | Easing | Uso |
|-------|----------|--------|-----|
| `transition-fast` | 150ms | ease-out | Hover states, color changes |
| `transition-normal` | 250ms | ease-in-out | Transform, opacity, layout |
| `transition-slow` | 350ms | cubic-bezier(0.4, 0, 0.2, 1) | Modales, page transitions |

### Micro-interacciones

- **Button press:** scale(0.97), 100ms
- **Card hover:** translateY(-2px), shadow elevation, 200ms
- **Input focus:** border-color + glow, 150ms
- **Toast entrance:** slideInBottom + fadeIn, 300ms
- **Skeleton loading:** pulse opacity 0.5-1, 1.5s infinite
- **Success check:** scale(0) → scale(1.2) → scale(1), 400ms, spring

### Page Transitions (Mini-App)

- **Entrada:** slideInRight + fadeIn, 300ms
- **Salida:** slideOutLeft + fadeOut, 200ms
- **Modal:** slideUp from bottom + backdrop fadeIn, 300ms

---

## 10. Layout Patterns

### Header Persistente (Dashboard Admin)

```
┌─────────────────────────────────────┐
│  [Hero Banner — 16:9 aspect]        │
│  [Overlay gradient + nombre tienda]  │
│  [Badge estado] [Ver tienda ›]      │
├─────────────────────────────────────┤
│  [Card Suscripción]                 │
│  [Trial badge] [X días restantes]   │
│  [Extender $X] [Suscribir]          │
└─────────────────────────────────────┘
```

### Menú Principal (Lista Vertical)

```
┌─────────────────────────────────────┐
│  [Icon 40x40] [Label]         [›]  │  ← Card bg-elevated, radius-lg
│  [Icon 40x40] [Label]    [🔴] [›]  │  ← Alerta roja si requiere acción
│  [Icon 40x40] [Label]         [›]  │
└─────────────────────────────────────┘
```
- Gap entre cards: 8px
- Icono: 40×40, fondo circular con color de sección
- Chevron derecho: navegación a sub-pantalla
- Alerta: dot rojo 🔴 en icono cuando requiere acción

### Product Card (Catálogo Cliente)

```
┌─────────────┐
│  [Thumbnail]│  ← Square, 1:1 aspect
│             │
├─────────────┤
│  [Nombre]   │  ← text-h3, 1 línea, ellipsis
│  [Categoría]│  ← text-caption, text-secondary
│  [$Precio]  │  ← text-price, primary color
└─────────────┘
```
- Background: `--vendy-bg-elevated`
- Border-radius: `radius-lg` (12px)
- Shadow: `shadow-sm`

---

## 11. Responsive Breakpoints

| Breakpoint | Ancho | Ajustes |
|------------|-------|---------|
| Mobile | < 480px | Layout single column, padding 16px, touch targets 44px |
| Tablet | 480px - 768px | 2-column grid productos, padding 24px |
| Desktop | > 768px | 3-column grid, sidebar navigation, padding 32px |

**Nota:** Mini-App de Telegram es principalmente mobile. Desktop es secondary.

---

## 12. Accesibilidad

- **Contraste:** Todos los textos sobre fondos cumplen WCAG AA (4.5:1)
- **Touch targets:** Mínimo 44×44px para elementos interactivos
- **Focus indicators:** Outline 2px `--vendy-primary` para navegación por teclado
- **Reduced motion:** Respetar `prefers-reduced-motion: reduce`
- **Screen readers:** Labels descriptivos, aria-labels en iconos, roles apropiados

---

## 13. Assets

### Logo
- **Primary:** Vendy wordmark en blanco sobre fondo oscuro
- **Icon:** "V" estilizado en naranja `#FF7403`, forma de bolsa de compra
- **Sizes:** 32×32 (favicon), 64×64 (app icon), 120×120 (og:image), 512×512 (PWA)

### Hero Patterns
- **Pattern de compra:** Grid de iconos de compra (bolsa, carrito, etiqueta, caja) en tonos grises sobre fondo oscuro
- **Gradient overlay:** De transparente a `--vendy-bg` (negro) en la parte inferior

### Empty States
- **Icono 3D:** Caja gris 3D con sombra sutil
- **Texto:** "No hay productos aún" — text-h2, text-secondary
- **CTA:** Botón primario "Agregar producto"

---

## 14. Checklist de Implementación

- [ ] Tailwind config con todos los tokens Vendy
- [ ] Componente Button (primary, secondary, ghost, icon)
- [ ] Componente Input (text, number, select, textarea)
- [ ] Componente Card (con hover animation)
- [ ] Componente Badge (trial, alert, success, info)
- [ ] Componente Header (hero banner + suscripción)
- [ ] Componente MenuItem (icon + label + alert + chevron)
- [ ] Componente ProductCard (thumbnail + nombre + precio)
- [ ] Componente Toast (success, error, info, warning)
- [ ] Componente Skeleton (loading states)
- [ ] Componente Modal / BottomSheet
- [ ] Componente EmptyState
- [ ] Dark mode forzado (no light mode toggle)
- [ ] Inter font loaded (Google Fonts o local)
- [ ] Lucide React icons installed

---

**Fin de Design System**
