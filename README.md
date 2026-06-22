# Vendy 🛒

> **Store-as-a-Service para Telegram** — Crea tu tienda online en minutos directamente desde Telegram.

[![CI](https://github.com/vendy/vendy/actions/workflows/ci.yml/badge.svg)](https://github.com/vendy/vendy/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.0-black.svg)](https://www.fastify.io/)

---

## 🚀 Características Principales

- **🤖 Bot Padre** — Gestión multi-tenant de tiendas
- **👶 Bot Hijo** — Experiencia de compra para clientes
- **📱 Mini-App** — Interfaz web React dentro de Telegram
- **💳 Pagos** — Stripe, Telegram Stars, transferencias
- **📦 Órdenes** — Gestión completa de pedidos
- **🎫 Soporte** — Tickets + chat en tiempo real
- **🔔 Notificaciones** — Push, email, in-app
- **🌍 Multi-idioma** — Español, English, Português
- **📊 Analytics** — Métricas de ventas y comportamiento

---

## 📁 Estructura del Monorepo

```
vendy/
├── apps/
│   ├── api/              # Backend Fastify + Prisma + PostgreSQL
│   ├── bot-parent/       # Bot de administración (grammy)
│   ├── bot-child/        # Bot de compras (grammy)
│   └── mini-app/         # React + Vite + Tailwind + @twa-dev/sdk
├── packages/
│   ├── shared-types/     # Tipos TypeScript compartidos
│   ├── ui-components/    # Componentes React reutilizables
│   └── config/           # Configs compartidas (ESLint, TS, Tailwind)
├── infra/
│   ├── docker/           # Dockerfiles y docker-compose
│   └── terraform/        # Infraestructura como código (opcional)
├── docs/
│   ├── architecture/     # Documentación de arquitectura
│   ├── api/              # OpenAPI/Swagger specs
│   ├── deployment/       # Guías de despliegue
│   ├── operations/       # Monitoreo, logs, alertas
│   ├── user-guides/      # Guías de usuario
│   └── onboarding/       # Onboarding de desarrolladores
├── scripts/              # Scripts de utilidad
└── .github/
    └── workflows/         # GitHub Actions CI/CD
```

---

## 🛠️ Requisitos del Sistema

### Obligatorios

| Requisito | Versión | Verificación |
|-----------|---------|--------------|
| Node.js   | >= 18.0 | `node --version` |
| pnpm      | >= 8.0  | `pnpm --version` |
| Docker    | >= 24.0 | `docker --version` |
| Docker Compose | >= 2.20 | `docker compose version` |

### Opcionales (recomendados)

| Requisito | Uso |
|-----------|-----|
| ngrok     | Webhooks locales de Telegram |
| Redis CLI | Debug de caché |
| PostgreSQL CLI | Debug de base de datos |

---

## 🚀 Instalación Rápida (5 minutos)

### 1. Clonar el repositorio

```bash
git clone https://github.com/vendy/vendy.git
cd vendy
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

Variables mínimas requeridas:

```env
# Base de datos
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vendy?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Telegram Bots
PARENT_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
CHILD_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew22"
WEBHOOK_SECRET="tu-webhook-secret-seguro"

# JWT
JWT_SECRET="tu-jwt-secret-minimo-32-caracteres"
JWT_REFRESH_SECRET="tu-refresh-secret-minimo-32-caracteres"

# Stripe (opcional para desarrollo)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Levantar infraestructura local

```bash
cd infra/docker
docker compose up -d
```

Esto levanta:
- PostgreSQL en `localhost:5432`
- Redis en `localhost:6379`
- Adminer en `localhost:8080` (UI de DB)

### 5. Ejecutar migraciones

```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

### 6. Iniciar desarrollo

```bash
# En terminal 1: Backend API
pnpm dev:api

# En terminal 2: Bot Padre
pnpm dev:bot-parent

# En terminal 3: Bot Hijo
pnpm dev:bot-child

# En terminal 4: Mini-App
pnpm dev:mini-app
```

O usa TurboRepo para todo:

```bash
pnpm dev
```

### 7. Verificar instalación

- API: http://localhost:3001/health
- Mini-App: http://localhost:5173
- Adminer: http://localhost:8080

---

## 📜 Scripts Disponibles

### Raíz (TurboRepo)

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Inicia todos los apps en modo desarrollo |
| `pnpm build` | Build de producción de todos los apps |
| `pnpm test` | Ejecuta todos los tests |
| `pnpm lint` | Lint de todo el código |
| `pnpm typecheck` | Verificación de tipos TypeScript |

### Por App

```bash
# API
pnpm --filter api dev
pnpm --filter api test
pnpm --filter api build

# Bot Padre
pnpm --filter bot-parent dev
pnpm --filter bot-parent test

# Bot Hijo
pnpm --filter bot-child dev
pnpm --filter bot-child test

# Mini-App
pnpm --filter mini-app dev
pnpm --filter mini-app build
pnpm --filter mini-app test
```

---

## 🧪 Testing

### Tests unitarios

```bash
pnpm test
```

### Tests con cobertura

```bash
pnpm test --coverage
```

### Tests de integración (requiere DB)

```bash
pnpm test:integration
```

### Tests e2e (requiere todo el stack)

```bash
pnpm test:e2e
```

---

## 🔧 Configuración de Desarrollo

### VS Code (recomendado)

Extensiones sugeridas:
- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- Thunder Client (API testing)

Configuración workspace en `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Webhooks de Telegram (desarrollo local)

Para recibir webhooks de Telegram en local, usa ngrok:

```bash
# Instalar ngrok
brew install ngrok

# Iniciar túnel
ngrok http 3001

# Configurar webhook
# Usa la URL de ngrok en WEBHOOK_URL del .env
```

---

## 🐳 Docker

### Desarrollo

```bash
cd infra/docker
docker compose up -d
```

### Producción

```bash
cd infra/docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Rebuild

```bash
docker compose build --no-cache
```

---

## 📚 Documentación

- [Arquitectura](docs/architecture/README.md)
- [API](docs/api/README.md)
- [Despliegue](docs/deployment/README.md)
- [Operaciones](docs/operations/README.md)
- [Guías de usuario](docs/user-guides/README.md)
- [Onboarding](docs/onboarding/README.md)

---

## 🤝 Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guías de contribución.

---

## 📄 Licencia

[MIT](LICENSE) © 2026 Vendy

---

## 💬 Soporte

- [GitHub Issues](https://github.com/vendy/vendy/issues)
- [Telegram: @vendysupport](https://t.me/vendysupport)
- Email: support@vendyapp.app
