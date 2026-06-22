# Vendy — Decisiones de Arquitectura y Branding

**Producto:** Vendy — Store-as-a-Service para Telegram  
**Versión:** 1.0  
**Fecha:** 2026-06-17  
**Estado:** APROBADO — Sprint 0 en ejecución

---

## 1. Branding

| Decisión | Valor | Notas |
|----------|-------|-------|
| **Nombre empresa/plataforma** | `Vendy` | Nombre corto, memorable, dominio vendyapp.app |
| **Bot Padre username** | `@VendyBot` o `@VendyShopBot` | Disponibilidad a verificar en BotFather |
| **Color primario** | `#FF7403` | Naranja energético, acción, compra. Tema oscuro obligatorio. |
| **Tipografía** | `Inter` | Sans-serif moderna, legible en móvil, weights 400/500/600/700 |
| **Radios** | Cards 12px, botones 8px, inputs 8px | Consistente con estándares iOS/Android |
| **Idiomas soportados** | Español, English, Português, Русский, Français, Hindi | MVP: Español + English primarios |

### Paleta de Colores (Tema Oscuro Obligatorio)

```
--vendy-primary:       #FF7403   (naranja, acciones primarias, precios)
--vendy-primary-hover: #E66800   (naranja oscuro, estados hover)
--vendy-primary-light: #FF9A4D   (naranja claro, acentos)
--vendy-bg:            #000000   (fondo principal, negro puro)
--vendy-bg-elevated:   #1C1C1E   (cards, modales, inputs)
--vendy-bg-secondary:  #2C2C2E   (hover states, separadores sutiles)
--vendy-text-primary:  #FFFFFF   (texto principal)
--vendy-text-secondary:#8E8E93   (texto secundario, placeholders)
--vendy-text-tertiary: #48484A   (texto deshabilitado, hints)
--vendy-success:       #34C759   (éxito, checkmarks, confirmaciones)
--vendy-danger:        #FF3B30   (errores, eliminar, alertas)
--vendy-warning:       #FF9500   (advertencias, badges trial)
--vendy-info:          #0A84FF   (info, links, badges)
--vendy-border:        #38383A   (bordes sutiles)
--vendy-overlay:       rgba(0,0,0,0.7)  (overlays, modales)
```

---

## 2. Stack Técnico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Frontend Mini-App** | React 18 + Vite + TypeScript + Tailwind CSS + @twa-dev/sdk | Stack estándar comunidad TMA, Vite rápido, Tailwind utility-first, SDK oficial |
| **Backend API** | Fastify (Node.js) + TypeScript | Performance async, compatible con stack FanPass existente, ecosistema Node.js maduro |
| **ORM/DB** | Prisma + PostgreSQL 15+ | Prisma type-safe, migraciones robustas, PostgreSQL multi-tenant |
| **Cache/Colas** | Redis 7+ | Sesiones Mini-App (TTL 24h), cola webhooks, caché catálogos (TTL 5min) |
| **Bots** | grammy (Node.js) + TypeScript | Mejor TS support que telegraf, consistencia con backend Node.js |
| **Storage** | Cloudflare R2 | Económico, API S3-compatible, CDN global, buena para imágenes productos |
| **Deploy Dev** | Docker Compose | PostgreSQL + Redis + API + bots en local |
| **Deploy Staging** | Railway / Render | Simple, escalable, PostgreSQL/Redis managed |
| **Deploy Prod** | AWS ECS / Railway (eventual) | Railway para MVP rápido, AWS ECS para escala |
| **Frontend Deploy** | Vercel | CDN global, previews por PR, perfecto para Mini-App SPA |
| **CI/CD** | GitHub Actions | Lint + test + deploy automático a Vercel (frontend) y Railway (backend) |
| **Monitoreo** | Sentry (errores) + UptimeRobot (uptime) | Stack mínimo viable, Grafana/Prometheus backlog |
| **Analytics** | Tabla propia `analytics_events` + eventual ClickHouse/Postgres | MVP: contadores básicos, backlog: funnel, cohortes |

### Versiones Específicas

```
Node.js:     >= 20.x LTS
TypeScript:  ~5.5.x
Fastify:     ~4.x
Prisma:      ~5.x
grammy:      ~1.x
React:       ~18.3.x
Vite:        ~5.x
Tailwind:    ~3.4.x
@twa-dev/sdk: ~7.x
Redis:       ~7.x
PostgreSQL:  ~15.x
```

---

## 3. Arquitectura

### Multi-tenancy: Row-Level (`shop_id` column)

- **Estrategia:** Cada tabla tiene `shop_id` FK. Queries filtran por `shop_id`.
- **Justificación:** Más simple para escala inicial (<1000 tiendas). Menor overhead operativo.
- **Migración futura:** Schema-per-tenant cuando se supere 1000 tiendas activas. Documentar migración en backlog.
- **Seguridad:** Middleware extrae `shop_id` del token/initData y aplica a todas las queries. Nunca confiar en `shop_id` enviado por cliente.

### Estructura Monorepo

```
vendy/
├── apps/
│   ├── bot-parent/          # Bot Padre (@VendyBot) — onboarding, admin
│   ├── bot-child/           # Bot Hijo — catálogo, cliente, notificaciones
│   ├── mini-app/            # Mini-App React (admin + cliente, role-based)
│   └── api/                 # Backend Fastify — API REST, webhooks, auth
├── packages/
│   ├── shared-types/        # TypeScript types compartidos (DB, API, bots)
│   ├── ui-components/       # Componentes React reutilizables (design system)
│   └── config/              # ESLint, TS, Tailwind configs compartidas
├── infra/
│   ├── docker/              # Dockerfiles, docker-compose.yml
│   └── terraform/           # IaC (backlog — staging/prod)
├── docs/
│   ├── design-system.md     # Design Tokens, componentes, guidelines
│   ├── api.md               # Documentación endpoints (generada auto)
│   └── deploy.md            # Guía de deploy
├── scripts/
│   ├── setup.sh             # Script inicialización proyecto
│   └── migrate.sh           # Script migraciones DB
├── .github/
│   └── workflows/
│       ├── ci.yml           # Lint + test + typecheck en PR
│       └── deploy.yml       # Deploy automático staging/prod
├── package.json             # Root — workspaces (pnpm/npm)
├── turbo.json               # TurboRepo config (build pipeline)
├── .env.example             # Variables de entorno requeridas
└── README.md                # Overview proyecto
```

### Gestor de Paquetes: pnpm + TurboRepo

- **pnpm:** Workspaces nativos, disk space eficiente, lockfile robusto.
- **TurboRepo:** Pipeline de builds optimizado, caching, paralelización.

---

## 4. Planes y Monetización

### Planes (nombres en español)

| Plan | Precio Mensual | Precio Anual | Descuento Anual | Productos | Categorías | Features Clave |
|------|---------------|--------------|-----------------|-----------|------------|----------------|
| **Inicial** | $10 | $96 | 20% | 50 | 10 | Tienda básica, analytics simple, broadcast básico, soporte email |
| **Crecimiento** | $25 | $240 | 20% | Ilimitado | Ilimitado | Todo Inicial + colores personalizados, variantes producto, 3 gerentes, métodos entrega avanzados |
| **Pro** | $49 | $470 | ~20% | Ilimitado | Ilimitado | Todo Crecimiento + marketing automation, zonas envío, 10 gerentes, API access, prioridad soporte |

### White-label (Marca Personalizada)

| Opción | Precio |
|--------|--------|
| Mensual | $15/mes |
| Anual | $135/año (15×12 = 180, menos 3 meses = 135) |

**Beneficios:** Retirar "Powered By Vendy", reemplazar por texto/link propio del vendedor.

### Comisión por Transacción

| Plan | Comisión |
|------|----------|
| Inicial | 3% |
| Crecimiento | 2% |
| Pro | 1% |
| Pro Anual | 0% |

**Cálculo:** `commission = order_subtotal × plan_commission_rate`
**Retención:** Stripe Connect `application_fee_amount` (automático). Efectivo/Stars: acumulado en `pending_commissions`, facturado semanalmente.

### Verificación (Insignia)

- **Requisitos orgánicos:** 1,000 clientes + 500 pedidos completados.
- **Compra directa:** 2,000 Telegram Stars (único uso de Stars en la plataforma).
- **Badge:** Visible en tienda pública.

---

## 5. Pagos Soportados

| Método | Estado Default | Tipo | Plan Requerido | Notas |
|--------|---------------|------|----------------|-------|
| **Efectivo** | Activo | Manual | Todos | Vendedor confirma manualmente en dashboard |
| **Telegram Stars** | Inactivo | Virtual | Pro / Pro Anual | Para compras dentro de la tienda |
| **Stripe** | Inactivo | Tarjeta | Todos | Requiere cuenta Stripe Connect |
| **Smart Glocal** | Inactivo | Local/LATAM | Todos | Docs: https://smart-glocal.com |
| **Unlimit** | Inactivo | Global/LATAM | Todos | Docs: https://www.unlimit.com/es-lat |

---

## 6. Bots

| Bot | Username | Rol | Webhook |
|-----|----------|-----|---------|
| **Bot Padre** | `@VendyBot` (o `@VendyShopBot`) | Onboarding, dashboard admin, suscripciones | `/webhook/parent` |
| **Bot Hijo** | `@MiTiendaBot` (uno por tienda) | Catálogo, checkout, notificaciones cliente | `/webhook/child/:shop_id` |

**Regla de oro:** Cada tienda es un tenant. Bot Padre gestiona el tenant. Bot Hijo es la interfaz pública del tenant. Ambos comparten la misma Mini-App URL parametrizada: `?role=admin|customer&shop_id=xxx`.

---

## 7. Variables de Entorno (`.env.example`)

```env
# === APP ===
NODE_ENV=development
APP_NAME=Vendy
APP_URL=https://api.vendyapp.app
FRONTEND_URL=https://app.vendyapp.app

# === DATABASE ===
DATABASE_URL=postgresql://user:pass@localhost:5432/vendy?schema=public

# === REDIS ===
REDIS_URL=redis://localhost:6379

# === TELEGRAM ===
TELEGRAM_BOT_TOKEN_PARENT=          # Token de @VendyBot (obtenido manualmente vía BotFather)
TELEGRAM_BOT_TOKEN_CHILD_TEMPLATE=  # Template para bots hijo (no usado directamente)
TELEGRAM_WEBHOOK_SECRET=            # Secret para validar webhooks Telegram

# === PAYMENTS ===
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

SMARTGLOCAL_API_KEY=...
SMARTGLOCAL_WEBHOOK_SECRET=...

UNLIMIT_API_KEY=...
UNLIMIT_WEBHOOK_SECRET=...

# === STORAGE ===
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=vendy-uploads
R2_PUBLIC_URL=https://cdn.vendyapp.app

# === SECURITY ===
JWT_SECRET=super-secret-min-32-chars
INIT_DATA_SECRET=                    # Bot token para validar initData (usar TELEGRAM_BOT_TOKEN_PARENT)

# === MONITORING ===
SENTRY_DSN=https://...@sentry.io/...
```

---

## 8. Rate Limits y Límites Telegram

| Recurso | Límite | Estrategia |
|---------|--------|------------|
| Bot API mensajes | 30 msg/seg por bot | Cola Redis, backoff exponencial |
| Mini-App API | 100 req/min por usuario | Rate limiting por `telegram_id` |
| Webhooks | Aceptar y encolar | Nunca procesar sincrónicamente si implica DB pesada |
| Upload imágenes | 2MB por imagen | Validación client-side + server-side, thumbnails auto |

---

## 9. Checklist de Aceptación Sprint 0

- [ ] `docker-compose up` levanta PostgreSQL + Redis + API + bots sin errores.
- [ ] Endpoint `/health` responde OK.
- [ ] Design Tokens documentados en `/docs/design-system.md`.
- [ ] CI/CD ejecuta lint + test + typecheck en cada PR.
- [ ] Monorepo con workspaces funcionando (`pnpm install` en root instala todo).
- [ ] TurboRepo build pipeline configurado.

---

## 10. Historial de Decisiones

| Fecha | Decisión | Cambio | Razón |
|-------|----------|--------|-------|
| 2026-06-17 | Backend | Fastify (Node.js) vs FastAPI | Compatibilidad stack FanPass existente |
| 2026-06-17 | Multi-tenancy | shop_id column vs schema-per-tenant | Simplicidad MVP, migrable a escala |
| 2026-06-17 | Bot framework | grammy vs telegraf | Mejor TypeScript support |
| 2026-06-17 | Mini-App build | Vite vs CRA | Velocidad, moderno, HMR |
| 2026-06-17 | Planes nombres | Español vs inglés | Mercado objetivo LATAM |
| 2026-06-17 | White-label anual | $135 vs $180 | 3 meses gratis como incentivo |

---

**Fin de DECISIONS.md**
