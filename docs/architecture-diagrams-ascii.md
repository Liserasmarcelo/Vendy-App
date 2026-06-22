╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                    ARQUITECTURA VENDY - SELF-HOSTED + TELEGRAM                               ║
║                         Diagrama ASCII Art (Terminal-Friendly)                               ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    🌐 INTERNET                                              │
│                                                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                                 │
│   │  Cloudflare  │    │   DuckDNS    │    │ UptimeRobot  │                                 │
│   │  DNS + SSL   │    │  IP Dinámica │    │   Monitoreo  │                                 │
│   │  + CDN + DDoS│    │   Gratuito   │    │   Externo    │                                 │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                                 │
│          │                   │                   │                                            │
│          └───────────────────┴───────────────────┘                                        │
│                              │                                                            │
└──────────────────────────────┼────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   🏠 ROUTER (Casa/Oficina)                                  │
│                                                                                             │
│   ┌─────────────────────────────────────────────────────────┐                               │
│   │              Port Forwarding: 443 → 192.168.1.100         │                               │
│   └─────────────────────────────┬─────────────────────────────┘                               │
│                                 │                                                           │
└─────────────────────────────────┼───────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                         🖥️  DELL OPTIPLEX 3060 (Ubuntu Server)                              │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           🐳  DOCKER COMPOSE                                         │    │
│  │                                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐   │    │
│  │  │                         🔄 TRAEFIK (Reverse Proxy)                             │   │    │
│  │  │                    SSL: Let's Encrypt + Cloudflare                            │   │    │
│  │  │                         Ports: 80, 443, 8080                                  │   │    │
│  │  │                                                                               │   │    │
│  │  │   Routes:                                                                       │   │    │
│  │  │   ├── api.vendy.app      → api:3001                                           │   │    │
│  │  │   ├── app.vendy.app      → mini-app:80                                        │   │    │
│  │  │   ├── grafana.vendy.app  → grafana:3000                                      │   │    │
│  │  │   └── prometheus.vendy.app → prometheus:9090                                   │   │    │
│  │  └─────────────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                                     │    │
│  │  ┌──────────────────────────────┐  ┌──────────────────────────────┐                │    │
│  │  │      ⚡ API (Fastify)        │  │      📱 MINI-APP (React)     │                │    │
│  │  │         Port: 3001            │  │        Port: 80               │                │    │
│  │  │                              │  │                               │                │    │
│  │  │  ┌────────────────────────┐ │  │  ┌────────────────────────┐  │                │    │
│  │  │  │  Middleware Stack:     │ │  │  │  Components:           │  │                │    │
│  │  │  │  • authenticateTelegram│ │  │  │  • App.tsx             │  │                │    │
│  │  │  │  • rateLimit (Redis) │ │  │  │  • React Router        │  │                │    │
│  │  │  │  • CORS              │ │  │  │  • AuthContext         │  │                │    │
│  │  │  │  • errorHandler      │ │  │  │  • @twa-dev/sdk        │  │                │    │
│  │  │  └────────────────────────┘ │  │  └────────────────────────┘  │                │    │
│  │  │                              │  │                               │                │    │
│  │  │  Routes:                     │  │  Services:                    │                │    │
│  │  │  ├── /webhook (Telegram)    │  │  ├── ApiClient.ts             │                │    │
│  │  │  ├── /api/* (Protected)   │  │  │   └─ X-Telegram-Init-Data   │                │    │
│  │  │  ├── /metrics (Prometheus)│  │  ├── telegram.ts              │                │    │
│  │  │  └── /health              │  │  │   └─ WebApp helpers          │                │    │
│  │  │                              │  │  └── stripe.ts                │                │    │
│  │  │  Services:                   │  │      └─ Payment processing      │                │    │
│  │  │  ├── bot.ts (Telegraf)      │  │                               │                │    │
│  │  │  ├── payment.ts             │  │                               │                │    │
│  │  │  └── notification.ts        │  │                               │                │    │
│  │  │                              │  │                               │                │    │
│  │  │  Libs:                      │  │                               │                │    │
│  │  │  ├── initData.ts            │  │                               │                │    │
│  │  │  │   └─ HMAC-SHA256        │  │                               │                │    │
│  │  │  ├── metrics.ts            │  │                               │                │    │
│  │  │  │   └─ Prometheus client  │  │                               │                │    │
│  │  │  └── prisma.ts             │  │                               │                │    │
│  │  │      └─ Multi-tenant       │  │                               │                │    │
│  │  └──────────────────────────────┘  └──────────────────────────────┘                │    │
│  │                                                                                     │    │
│  │  ┌──────────────────────────────┐  ┌──────────────────────────────┐                │    │
│  │  │      🗄️  POSTGRESQL          │  │      🔴 REDIS                │                │    │
│  │  │         Port: 5432            │  │        Port: 6379             │                │    │
│  │  │                              │  │                               │                │    │
│  │  │  Tables:                     │  │  Uses:                        │                │    │
│  │  │  • users                     │  │  • Sessions (24h TTL)         │                │    │
│  │  │  • shops                     │  │  • Rate limiting              │                │    │
│  │  │  • products                  │  │  • Catalog cache (5min)       │                │    │
│  │  │  • orders                    │  │  • Cart (2h TTL)              │                │    │
│  │  │  • customers                 │  │  • BullMQ queues              │                │    │
│  │  │  • analytics_events          │  │  • Webhook retry (24h)        │                │    │
│  │  │  • daily_metrics             │  │                               │                │    │
│  │  └──────────────────────────────┘  └──────────────────────────────┘                │    │
│  │                                                                                     │    │
│  │  ┌──────────────────────────────┐  ┌──────────────────────────────┐                │    │
│  │  │      📊 PROMETHEUS           │  │      📈 GRAFANA              │                │    │
│  │  │         Port: 9090            │  │        Port: 3000             │                │    │
│  │  │                              │  │                               │                │    │
│  │  │  Scrapes:                    │  │  Dashboards:                  │                │    │
│  │  │  • API /metrics             │  │  • Server (Node Exporter)     │                │    │
│  │  │  • Node Exporter            │  │  • PostgreSQL                 │                │    │
│  │  │  • Postgres Exporter        │  │  • Redis                      │                │    │
│  │  │  • Redis Exporter           │  │  • Telegram Bots (NEW)        │                │    │
│  │  │                              │  │  • Business Metrics           │                │    │
│  │  └──────────────────────────────┘  └──────────────────────────────┘                │    │
│  │                                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐│    │
│  │  │                         🤖 BOTS TELEGRAM (grammy)                                ││    │
│  │  │                                                                                 ││    │
│  │  │  ┌────────────────────────┐    ┌────────────────────────┐                      ││    │
│  │  │  │   BOT PADRE            │    │   BOT HIJO             │                      ││    │
│  │  │  │   @vendy_bot           │    │   @vendy_shop_bot      │                      ││    │
│  │  │  │                        │    │                        │                      ││    │
│  │  │  │  Commands:             │    │  Commands:             │                      ││    │
│  │  │  │  • /start → Open App   │    │  • /start → Catalog    │                      ││    │
│  │  │  │  • /help               │    │  • /catalog            │                      ││    │
│  │  │  │  • /language           │    │  • /cart               │                      ││    │
│  │  │  │                        │    │  • /orders             │                      ││    │
│  │  │  │  Webhook Mode          │    │  Webhook Mode          │                      ││    │
│  │  │  │  (Production)          │    │  (Production)          │                      ││    │
│  │  │  └────────────────────────┘    └────────────────────────┘                      ││    │
│  │  │                                                                                 ││    │
│  │  │  BotFather Config:                                                                ││    │
│  │  │  • Description (512 chars)                                                        ││    │
│  │  │  • About (120 chars)                                                              ││    │
│  │  │  • Menu Button → https://app.vendy.app                                            ││    │
│  │  │  • Mini App URL → https://app.vendy.app                                           ││    │
│  │  │  • Commands: /start, /help, /catalog, /cart, /orders, /language                   ││    │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘│    │
│  │                                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    💬 TELEGRAM APP                                          │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              USUARIO (Teléfono/Desktop)                              │    │
│  │                                                                                     │    │
│  │  1. Abre @vendy_bot                                                                 │    │
│  │  2. Toca /start                                                                     │    │
│  │  3. Ve botón "Abrir App" (menu button)                                             │    │
│  │  4. Toca botón → Abre Mini-App                                                      │    │
│  │                                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐   │    │
│  │  │                         MINI-APP (Dentro de Telegram)                        │   │    │
│  │  │                                                                              │   │    │
│  │  │  ┌────────────────────────────────────────────────────────────────────────┐  │   │    │
│  │  │  │  Header (color: Telegram theme)                                        │  │   │    │
│  │  │  │  ┌──────────────────────────────────────────────────────────────────┐  │  │   │    │
│  │  │  │  │  🏠 Home    📦 Catalog    🛒 Cart    📋 Orders               │  │  │   │    │
│  │  │  │  └──────────────────────────────────────────────────────────────────┘  │  │   │    │
│  │  │  │  ┌──────────────────────────────────────────────────────────────────┐  │  │   │    │
│  │  │  │  │  📦 Productos                                                    │  │  │   │    │
│  │  │  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │  │  │   │    │
│  │  │  │  │  │  🍎      │  │  👕      │  │  📱      │                    │  │  │   │    │
│  │  │  │  │  │ Manzanas │  │  Remera  │  │  iPhone  │                    │  │  │   │    │
│  │  │  │  │  │  $2.99   │  │  $29.99  │  │  $999    │                    │  │  │   │    │
│  │  │  │  │  └──────────┘  └──────────┘  └──────────┘                    │  │  │   │    │
│  │  │  │  │                                                                    │  │  │   │    │
│  │  │  │  │  [Agregar al Carrito]  [Ver Detalles]                           │  │  │   │    │
│  │  │  │  └──────────────────────────────────────────────────────────────────┘  │  │   │    │
│  │  │  │  ┌──────────────────────────────────────────────────────────────────┐  │  │   │    │
│  │  │  │  │  💳 Checkout                                                     │  │  │   │    │
│  │  │  │  │  Total: $1,031.97                                                │  │  │   │    │
│  │  │  │  │  [Pagar con Tarjeta]  [Transferencia]  [Efectivo]               │  │  │   │    │
│  │  │  │  └──────────────────────────────────────────────────────────────────┘  │  │   │   │
│  │  │  │  ┌──────────────────────────────────────────────────────────────────┐  │  │   │    │
│  │  │  │  │  📋 Mis Órdenes                                                  │  │  │   │    │
│  │  │  │  │  #1234 - PAGADA ✅                                               │  │  │   │    │
│  │  │  │  │  #1235 - ENVIADO 🚚                                              │  │  │   │    │
│  │  │  │  └──────────────────────────────────────────────────────────────────┘  │  │   │   │
│  │  │  │                                                                          │  │   │    │
│  │  │  │  ┌────────────────────────────────────────────────────────────────────┐  │   │    │
│  │  │  │  │  Footer                                                            │  │   │    │
│  │  │  │  │  Vendy © 2024 | Soporte: @vendy_soporte_bot                      │  │   │    │
│  │  │  │  └────────────────────────────────────────────────────────────────────┘  │   │    │
│  │  │  └────────────────────────────────────────────────────────────────────────┘  │   │    │
│  │  │                                                                              │   │    │
│  │  │  Cada request envía:                                                         │   │    │
│  │  │  Header: X-Telegram-Init-Data: user={...}&auth_date=...&hash=...           │   │    │
│  │  └─────────────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                         FLUJO DE AUTENTICACIÓN (initData)                                    ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │  Telegram   │         │   Mini-App  │         │     API     │
    │   Server    │         │   (React)   │         │  (Fastify)  │
    └──────┬──────┘         └──────┬──────┘         └──────┬──────┘
           │                       │                       │
           │  1. Abre Mini-App     │                       │
           │──────────────────────>│                       │
           │                       │                       │
           │  2. Genera initData   │                       │
           │  + user={id:123,...}  │                       │
           │  + auth_date=1699...  │                       │
           │  + hash=abc123...     │                       │
           │  (HMAC-SHA256 firmado)│                       │
           │──────────────────────>│                       │
           │                       │                       │
           │                       │  3. GET /api/products │
           │                       │  Header:              │
           │                       │  X-Telegram-Init-Data:│
           │                       │  user=...&hash=...    │
           │                       │──────────────────────>│
           │                       │                       │
           │                       │                       │  4. Extrae hash
           │                       │                       │  5. Ordena params
           │                       │                       │  6. Calcula HMAC:
           │                       │                       │     secret = HMAC(
           │                       │                       │       "WebAppData",
           │                       │                       │       botToken
           │                       │                       │     )
           │                       │                       │     calculatedHash =
           │                       │                       │       HMAC(secret,
           │                       │                       │       dataCheckString
           │                       │                       │       )
           │                       │                       │
           │                       │                       │  7. Compara:
           │                       │                       │     hash == calculatedHash?
           │                       │                       │
           │                       │                       │
           │                       │    ┌────────────────┐ │
           │                       │    │   VÁLIDO ✅    │ │
           │                       │    │  hash == calc  │ │
           │                       │    └────────────────┘ │
           │                       │                       │
           │                       │  8a. 200 OK + JSON    │
           │                       │<──────────────────────│
           │                       │                       │
           │                       │    ┌────────────────┐ │
           │                       │    │  INVÁLIDO ❌   │ │
           │                       │    │ hash != calc   │ │
           │                       │    └────────────────┘ │
           │                       │                       │
           │                       │  8b. 401 Unauthorized │
           │                       │<──────────────────────│
           │                       │                       │
           │                       │                       │


╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                         FLUJO DE COMPRA COMPLETO                                             ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  USUARIO          TELEGRAM          MINI-APP            API           STRIPE        BOT HIJO
    │                │                  │                 │              │             │
    │ 1. Abre link   │                  │                 │              │             │
    │    t.me/...    │                  │                 │              │             │
    │───────────────>│                  │                 │              │             │
    │                │                  │                 │              │             │
    │ 2. Toca botón  │                  │                 │              │             │
    │    "Abrir App" │                  │                 │              │             │
    │─────────────────────────────────>│                 │              │             │
    │                │                  │                 │              │             │
    │                │                  │ 3. GET products │              │             │
    │                │                  │ + initData       │              │             │
    │                │                  │────────────────>│              │             │
    │                │                  │                 │              │             │
    │                │                  │ 4. JSON products│              │             │
    │                │                  │<────────────────│              │             │
    │                │                  │                 │              │             │
    │ 5. Ve catálogo │                  │                 │              │             │
    │<─────────────────────────────────│                 │              │             │
    │                │                  │                 │              │             │
    │ 6. Agrega carro│                  │                 │              │             │
    │─────────────────────────────────>│                 │              │             │
    │                │                  │                 │              │             │
    │ 7. Checkout    │                  │                 │              │             │
    │─────────────────────────────────>│                 │              │             │
    │                │                  │                 │              │             │
    │                │                  │ 8. POST /orders │              │             │
    │                │                  │ + initData + cart│             │             │
    │                │                  │────────────────>│              │             │
    │                │                  │                 │              │             │
    │                │                  │                 │ 9. Crea orden│             │
    │                │                  │                 │    PENDING   │             │
    │                │                  │                 │              │             │
    │                │                  │                 │ 10. PaymentIntent
    │                │                  │                 │────────────>│             │
    │                │                  │                 │              │             │
    │                │                  │                 │ 11. client_secret
    │                │                  │                 │<────────────│             │
    │                │                  │                 │              │             │
    │                │                  │ 12. Orden + secret│             │             │
    │                │                  │<────────────────│              │             │
    │                │                  │                 │              │             │
    │ 13. Ingresa    │                  │                 │              │             │
    │     tarjeta    │                  │                 │              │             │
    │─────────────────────────────────>│                 │              │             │
    │                │                  │                 │              │             │
    │                │                  │ 14. Confirmar  │              │             │
    │                │                  │     pago        │              │             │
    │                │                  │──────────────────────────────>│             │
    │                │                  │                 │              │             │
    │                │                  │ 15. Pago exitoso│              │             │
    │                │                  │<──────────────────────────────│             │
    │                │                  │                 │              │             │
    │                │                  │ 16. POST webhook│              │             │
    │                │                  │     /stripe     │              │             │
    │                │                  │────────────────>│              │             │
    │                │                  │                 │              │             │
    │                │                  │                 │ 17. Orden   │             │
    │                │                  │                 │     PAID ✅   │             │
    │                │                  │                 │              │             │
    │                │                  │                 │ 18. Notificar│            │
    │                │                  │                 │     vendedor │            │
    │                │                  │                 │────────────────────────>│
    │                │                  │                 │              │             │
    │ 19. Notificación│                 │                 │              │             │
    │    "Orden confirmada"             │                 │              │             │
    │<────────────────────────────────────────────────────────────────────────────────│
    │                │                  │                 │              │             │
    │ 20. Ver        │                  │                 │              │             │
    │     seguimiento│                  │                 │              │             │
    │─────────────────────────────────>│                 │              │             │
    │                │                  │                 │              │             │
    │                │                  │ 21. GET /orders│              │             │
    │                │                  │     /1234        │              │             │
    │                │                  │────────────────>│              │             │
    │                │                  │                 │              │             │
    │                │                  │ 22. Estado:    │              │             │
    │                │                  │     PAID → SHIPPED            │             │
    │                │                  │<────────────────│              │             │
    │                │                  │                 │              │             │
    │ 23. Muestra    │                  │                 │              │             │
    │     tracking   │                  │                 │              │             │
    │<─────────────────────────────────│                 │              │             │
    │                │                  │                 │              │             │


╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                         ESTRUCTURA DE CARPETAS (Monorepo)                                    ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

Vendy/
│
├── 📁 apps/
│   │
│   ├── 📁 api/                          ← Backend Fastify
│   │   ├── 📁 src/
│   │   │   ├── 📁 config/
│   │   │   │   ├── env.ts               ← Variables de entorno
│   │   │   │   └── telegram.ts          ← Configuración de bot
│   │   │   │
│   │   │   ├── 📁 lib/
│   │   │   │   ├── initData.ts          ← ✅ NUEVO: HMAC-SHA256 validation
│   │   │   │   ├── initData.test.ts     ← ✅ NUEVO: Tests vitest
│   │   │   │   ├── metrics.ts           ← ✅ ACTUALIZAR: Métricas bots Telegram
│   │   │   │   ├── prisma.ts            ← Cliente Prisma + extensión
│   │   │   │   └── cache.ts             ← Helpers Redis
│   │   │   │
│   │   │   ├── 📁 middleware/
│   │   │   │   ├── auth.ts              ← ✅ NUEVO: authenticateTelegram
│   │   │   │   ├── rateLimit.ts         ← Rate limiting Redis
│   │   │   │   └── errorHandler.ts      ← Manejo de errores
│   │   │   │
│   │   │   ├── 📁 routes/
│   │   │   │   ├── webhook.ts           ← ✅ NUEVO: Endpoints webhook Telegram
│   │   │   │   ├── analytics.ts         ← Métricas de negocio
│   │   │   │   ├── shops.ts             ← CRUD tiendas
│   │   │   │   ├── products.ts          ← CRUD productos
│   │   │   │   ├── orders.ts            ← CRUD órdenes
│   │   │   │   ├── payments.ts          ← Pagos Stripe
│   │   │   │   └── auth.ts              ← Autenticación
│   │   │   │
│   │   │   ├── 📁 services/
│   │   │   │   ├── bot.ts               ← ✅ NUEVO: Comandos bot (Telegraf)
│   │   │   │   ├── payment.ts           ← Procesamiento de pagos
│   │   │   │   ├── notification.ts      ← Notificaciones Telegram
│   │   │   │   └── order.ts             ← Lógica de órdenes
│   │   │   │
│   │   │   └── index.ts                 ← Entry point Fastify
│   │   │
│   │   ├── 📁 prisma/
│   │   │   ├── schema.prisma            ← Esquema multi-tenant
│   │   │   └── migrations/              ← Migraciones
│   │   │
│   │   ├── Dockerfile                   ← Multi-stage build
│   │   ├── package.json                 ← Dependencias
│   │   └── tsconfig.json                ← Config TypeScript
│   │
│   ├── 📁 mini-app/                     ← Frontend React
│   │   ├── 📁 src/
│   │   │   ├── 📁 lib/
│   │   │   │   ├── api.ts               ← ✅ NUEVO: Cliente API + initData
│   │   │   │   ├── telegram.ts          ← ✅ NUEVO: Helpers WebApp
│   │   │   │   └── stripe.ts            ← Cliente Stripe.js
│   │   │   │
│   │   │   ├── 📁 pages/
│   │   │   │   ├── Home.tsx             ← Landing de tienda
│   │   │   │   ├── Catalog.tsx          ← Catálogo de productos
│   │   │   │   ├── Product.tsx          ← Detalle de producto
│   │   │   │   ├── Cart.tsx             ← Carrito de compras
│   │   │   │   ├── Checkout.tsx         ← Checkout + pago
│   │   │   │   └── Orders.tsx           ← Historial de órdenes
│   │   │   │
│   │   │   ├── 📁 components/
│   │   │   │   ├── Header.tsx           ← Header con tema Telegram
│   │   │   │   ├── ProductCard.tsx      ← Card de producto
│   │   │   │   ├── CartItem.tsx         ← Item de carrito
│   │   │   │   └── PaymentForm.tsx      ← Formulario Stripe
│   │   │   │
│   │   │   ├── App.tsx                  ← Router + AuthContext
│   │   │   └── main.tsx                 ← Entry point React
│   │   │
│   │   ├── Dockerfile                   ← Nginx serve
│   │   ├── package.json                 ← Dependencias
│   │   └── vite.config.ts               ← Config Vite
│   │
│   └── 📁 bot-parent/                   ← Bot Padre (opcional, separado)
│       └── ...
│
├── 📁 packages/
│   ├── 📁 shared-types/                 ← Tipos TypeScript compartidos
│   ├── 📁 ui-components/                ← Componentes React reutilizables
│   └── 📁 config/                       ← Configs compartidas (eslint, tsconfig, tailwind)
│
├── 📁 infra/
│   ├── docker-compose.yml               ← Docker Compose completo
│   ├── docker-compose.prod.yml          ← Override producción
│   └── monitoring/                      ← Prometheus + Grafana configs
│       ├── prometheus.yml
│       └── grafana/
│           ├── datasources/
│           └── dashboards/
│
├── 📁 scripts/
│   ├── deploy.sh                        ← Deploy en Dell
│   ├── backup.sh                        ← Backup PostgreSQL
│   ├── restore.sh                       ← Restore PostgreSQL
│   ├── health-check.sh                  ← Verificación de salud
│   ├── logs.sh                          ← Ver logs
│   ├── setup-telegram.sh                ← ✅ NUEVO: Configurar webhook
│   └── test-initData.sh                 ← ✅ NUEVO: Generar initData test
│
├── 📁 docs/
│   ├── sprint-11-self-hosted-guia.md    ← Infraestructura + Telegram Production
│   ├── sprint-12-self-hosted-guia.md    ← Monitoreo + Métricas Bots
│   ├── sprint-13-self-hosted-guia.md    ← Documentación + Go-live
│   ├── architecture-diagrams-mermaid.md ← Diagramas Mermaid
│   ├── architecture-diagrams-ascii.md   ← ✅ ESTE ARCHIVO
│   └── RESUMEN-SPRINTS-11-13-TELEGRAM.md ← Resumen ejecutivo
│
├── 📁 .github/
│   └── workflows/
│       ├── ci.yml                       ← Test + Lint
│       └── cd.yml                       ← Deploy en Dell
│
├── package.json                         ← Root monorepo (pnpm workspaces)
├── pnpm-workspace.yaml                  ← Definición workspaces
├── turbo.json                           ← Pipeline de builds
├── .env.example                         ← Variables de entorno template
└── README.md                            ← Documentación principal


╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                         COSTOS MENSUALES (Self-Hosted)                                       ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────┬──────────────┬────────────────────────────────────────────┐
│ Servicio                        │ Costo/mes    │ Notas                                      │
├─────────────────────────────────┼──────────────┼────────────────────────────────────────────┤
│ Electricidad (Dell 24/7)        │    ~$15      │ i5-6500, 8GB RAM, 1TB SSD + 1TB HDD      │
│ Dominio (vendy.app)             │     ~$1      │ Namecheap/Cloudflare                       │
│ Cloudflare (DNS + CDN)          │      $0      │ Plan gratuito                              │
│ DuckDNS (IP dinámica)           │      $0      │ Gratuito                                   │
│ UptimeRobot (monitoreo)         │      $0      │ 50 monitores gratis                        │
│ Telegram Bot API                │      $0      │ Gratuito                                   │
│ Prometheus + Grafana            │      $0      │ Open source, self-hosted                   │
│ Let's Encrypt (SSL)             │      $0      │ Gratuito, auto-renueva                     │
├─────────────────────────────────┼──────────────┼────────────────────────────────────────────┤
│ TOTAL                           │   ~$16/mes   │ Capacidad: 100-500 clientes                │
└─────────────────────────────────┴──────────────┴────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                         COSTOS MENSUALES (Nube - Comparación)                                ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────┬──────────────┬────────────────────────────────────────────┐
│ Servicio                        │ Costo/mes    │ Notas                                      │
├─────────────────────────────────┼──────────────┼────────────────────────────────────────────┤
│ Railway Pro (API)               │    $20       │ Sin límites de horas                      │
│ Railway PostgreSQL              │    $10       │ 1GB RAM, 10GB SSD                         │
│ Railway Redis                   │     $5       │ 256MB RAM                                 │
│ Vercel Pro (Mini-App)           │    $20       │ Sin límites de bandwidth                  │
│ Cloudflare (DNS + CDN)          │     $0       │ Plan gratuito                              │
│ Dominio                         │     ~$1      │ Namecheap/Cloudflare                       │
├─────────────────────────────────┼──────────────┼────────────────────────────────────────────┤
│ TOTAL                           │   ~$56/mes   │ Capacidad: Ilimitada                      │
└─────────────────────────────────┴──────────────┴────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                         CHECKLIST DE DEPLOY TELEGRAM                                         ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

SPRINT 11 - TICKET 6: CONFIGURACIÓN TELEGRAM PRODUCTION
─────────────────────────────────────────────────────────────────────────────────────────────

[ ] 1. Tokens de bots obtenidos de @BotFather
[ ] 2. Descripción configurada (512 chars)
[ ] 3. About configurado (120 chars)
[ ] 4. Comandos configurados: /start, /help, /catalog, /cart, /orders, /language
[ ] 5. Menú button configurado: URL → https://app.vendy.app
[ ] 6. Mini App URL configurada: https://app.vendy.app
[ ] 7. Webhook endpoint creado en API: POST /webhook
[ ] 8. Webhook secret generado: openssl rand -base64 32
[ ] 9. Webhook seteado en Telegram: POST /webhook/set
[ ] 10. Comandos del bot funcionando: /start, /help
[ ] 11. initData validation implementado: HMAC-SHA256
[ ] 12. Middleware aplicado a rutas protegidas: authenticateTelegram
[ ] 13. Tests de initData pasando: vitest run
[ ] 14. Mini-App envía initData: Header X-Telegram-Init-Data
[ ] 15. Flujo completo probado: bot → Mini-App → API → DB

SPRINT 12 - TICKET 4: MÉTRICAS DE BOTS TELEGRAM
─────────────────────────────────────────────────────────────────────────────────────────────

[ ] 1. Métricas de bots creadas: telegramMessagesTotal, telegramUsersActive
[ ] 2. Métricas de performance: telegramWebhookLatency, telegramErrorsTotal
[ ] 3. Bot padre instrumentado: contadores en cada comando
[ ] 4. Dashboard creado en Grafana: 4 queries Prometheus
[ ] 5. Queries funcionando: rate(...[5m]), histogram_quantile(...)

SPRINT 13 - GO-LIVE
─────────────────────────────────────────────────────────────────────────────────────────────

[ ] 1. Guías de usuario actualizadas: Mini-App explicada
[ ] 2. Links de referido funcionan: t.me/vendy_bot?start=shop_XXX
[ ] 3. Landing page con CTA de Telegram: ?start=landing
[ ] 4. Checklist de go-live: 5 items nuevos de Telegram
[ ] 5. Términos de servicio: actualizados para Telegram
[ ] 6. Política de privacidad: menciona Telegram initData


╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                         COMANDOS ÚTILES (Terminal)                                           ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

# Verificar que Docker está corriendo
docker compose ps

# Ver logs de la API (en tiempo real)
docker compose logs -f api

# Ver logs de los bots
docker compose logs -f bot-parent

# Verificar webhook de Telegram
curl -X GET https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Setear webhook manualmente
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url":"https://api.vendy.app/webhook","secret_token":"<SECRET>"}'

# Probar initData (desde terminal)
node -e "
const crypto = require('crypto');
const botToken = '123456:ABC...XYZ';
const user = { id: 123, first_name: 'Test' };
const authDate = Math.floor(Date.now() / 1000);
const data = \`user=\${encodeURIComponent(JSON.stringify(user))}&auth_date=\${authDate}\`;
const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
console.log(\`initData=\${data}&hash=\${hash}\`);
"

# Probar API con initData
curl -X GET https://api.vendy.app/api/products \
  -H "X-Telegram-Init-Data: <INIT_DATA>"

# Ver métricas de Prometheus
curl https://api.vendy.app/metrics | grep telegram

# Backup de PostgreSQL
docker compose exec postgres pg_dump -U postgres vendy > backup_$(date +%Y%m%d).sql

# Restore de PostgreSQL
docker compose exec -T postgres psql -U postgres vendy < backup_20240101.sql


╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                         ESCALAMIENTO (Self-Hosted → Nube)                                    ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

FASE 1: MVP (0-100 clientes)
─────────────────────────────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🏠 Self-Hosted (Dell Optiplex 3060)                                                    │
│  • Costo: ~$16/mes                                                                      │
│  • Capacidad: 100 clientes                                                              │
│  • Todo en casa: API + DB + Mini-App + Bots                                             │
│  • Backup: Semanal a HDD externo                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

FASE 2: Crecimiento (100-300 clientes)
─────────────────────────────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🏠 + ☁️  Híbrido                                                                        │
│  • Dell: API + Bots (mantiene costo bajo)                                               │
│  • Vercel: Mini-App (mejor performance global)                                          │
│  • Railway: PostgreSQL (backups automáticos)                                           │
│  • Costo: ~$30/mes                                                                      │
│  • Capacidad: 300 clientes                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

FASE 3: Escala (300+ clientes)
─────────────────────────────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  ☁️  Nube Completa                                                                       │
│  • Railway: API + PostgreSQL + Redis                                                    │
│  • Vercel: Mini-App (edge CDN)                                                          │
│  • Cloudflare: DDoS + CDN                                                               │
│  • Costo: ~$56/mes                                                                      │
│  • Capacidad: Ilimitada                                                                 │
│  • SLA: 99.9% uptime                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                         ARCHIVOS CREADOS/ACTUALIZADOS                                        ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

✅ docs/sprint-11-self-hosted-guia.md          (3,043 líneas | 79,884 bytes)
   └─ Ticket 6: Configuración Telegram Production (18 pasos)

✅ docs/sprint-12-self-hosted-guia.md          (1,033 líneas | 25,516 bytes)
   └─ Ticket 4: Métricas de Bots Telegram (3 pasos)

✅ docs/sprint-13-self-hosted-guia.md          (1,230 líneas | 33,509 bytes)
   └─ Guías actualizadas con Telegram, checklist, landing

✅ docs/RESUMEN-SPRINTS-11-13-TELEGRAM.md      (196 líneas | 6,990 bytes)
   └─ Resumen ejecutivo con checklist y arquitectura

✅ docs/architecture-diagrams-mermaid.md       (NUEVO)
   └─ 5 diagramas Mermaid: flujo, secuencia, infraestructura, componentes, CI/CD

✅ docs/architecture-diagrams-ascii.md         (ESTE ARCHIVO)
   └─ Diagramas ASCII: arquitectura, flujo auth, flujo compra, carpetas, costos

✅ Skill: telegram-mini-apps-backend            (1,233 líneas | 38,552 bytes)
   └─ Sección "Deploy en Producción (Self-Hosted)" agregada


╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                         FIN DEL DOCUMENTO                                                    ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝
