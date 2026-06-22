# Guía de Instalación Local

> **Tiempo estimado:** 15-30 minutos
> **Nivel:** Principiante a Intermedio

---

## Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Instalación paso a paso](#instalación-paso-a-paso)
3. [Configuración de variables de entorno](#configuración-de-variables-de-entorno)
4. [Verificación de la instalación](#verificación-de-la-instalación)
5. [Configuración de Telegram Bots](#configuración-de-telegram-bots)
6. [Solución de problemas comunes](#solución-de-problemas-comunes)
7. [Próximos pasos](#próximos-pasos)

---

## Prerrequisitos

### Software requerido

| Software | Versión mínima | Cómo verificar | Instalación |
|----------|---------------|----------------|-------------|
| Node.js | 18.0.0 | `node --version` | [nodejs.org](https://nodejs.org/) |
| pnpm | 8.0.0 | `pnpm --version` | `npm install -g pnpm` |
| Docker | 24.0.0 | `docker --version` | [docker.com](https://docker.com/) |
| Docker Compose | 2.20.0 | `docker compose version` | Incluido con Docker Desktop |
| Git | 2.30.0 | `git --version` | [git-scm.com](https://git-scm.com/) |

### Hardware recomendado

- **RAM:** 8GB mínimo, 16GB recomendado
- **Disco:** 10GB libres (SSD recomendado)
- **CPU:** 2 cores mínimo, 4 cores recomendado

### Sistemas operativos soportados

- ✅ macOS 12+ (Intel y Apple Silicon)
- ✅ Ubuntu 20.04+ / Debian 11+
- ✅ Windows 11 con WSL2

---

## Instalación paso a paso

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/vendy/vendy.git
cd vendy
```

**Tiempo estimado:** 1-2 minutos

### Paso 2: Instalar dependencias

```bash
pnpm install
```

Esto instala todas las dependencias del monorepo usando workspaces.

**Tiempo estimado:** 2-5 minutos (depende de la conexión)

**Salida esperada:**
```
Packages: +2842
++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 2842, reused 2842, downloaded 0, added 2842, done
```

### Paso 3: Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tu editor favorito:

```bash
# macOS/Linux
nano .env

# O VS Code
code .env
```

#### Variables mínimas requeridas

```env
# ==========================================
# BASE DE DATOS
# ==========================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vendy?schema=public"

# ==========================================
# REDIS
# ==========================================
REDIS_URL="redis://localhost:6379"

# ==========================================
# TELEGRAM BOTS (obtené los tokens de @BotFather)
# ==========================================
PARENT_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
CHILD_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew22"
WEBHOOK_SECRET="tu-webhook-secret-seguro-minimo-32-chars"

# ==========================================
# JWT (generá con: openssl rand -base64 32)
# ==========================================
JWT_SECRET="tu-jwt-secret-aqui-minimo-32-caracteres"
JWT_REFRESH_SECRET="tu-refresh-secret-aqui-minimo-32-caracteres"

# ==========================================
# SERVIDOR
# ==========================================
PORT=3001
NODE_ENV=development

# ==========================================
# FRONTEND URL
# ==========================================
MINI_APP_URL="http://localhost:5173"
```

#### Variables opcionales (para features avanzadas)

```env
# ==========================================
# STRIPE (opcional para desarrollo)
# ==========================================
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# ==========================================
# CLOUD STORAGE (opcional)
# ==========================================
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="vendy-uploads"

# ==========================================
# EMAIL (opcional)
# ==========================================
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
FROM_EMAIL="noreply@vendy.app"

# ==========================================
# ANALYTICS (opcional)
# ==========================================
POSTHOG_API_KEY=""
POSTHOG_HOST=""
```

### Paso 4: Levantar infraestructura con Docker

```bash
cd infra/docker
docker compose up -d
```

**Servicios que se levantan:**

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| PostgreSQL | 5432 | Base de datos principal |
| Redis | 6379 | Caché y sesiones |
| Adminer | 8080 | UI para gestionar PostgreSQL |

**Verificar que están corriendo:**

```bash
docker compose ps
```

**Salida esperada:**
```
NAME                STATUS          PORTS
vendy-postgres      Up 10 seconds   0.0.0.0:5432->5432/tcp
vendy-redis         Up 10 seconds   0.0.0.0:6379->6379/tcp
vendy-adminer       Up 10 seconds   0.0.0.0:8080->8080/tcp
```

### Paso 5: Ejecutar migraciones de Prisma

```bash
cd apps/api
npx prisma migrate dev
```

Cuando te pregunte por el nombre de la migración, poné:
```
init
```

**Salida esperada:**
```
✔ Generated Prisma Client
✔ Database migrated successfully
```

### Paso 6: Seed de datos de desarrollo

```bash
npx prisma db seed
```

Esto crea:
- Usuario admin de prueba
- Tienda de ejemplo
- Productos de ejemplo
- Categorías de ejemplo

**Salida esperada:**
```
🌱 Seeding database...
✅ Created admin user: admin@vendy.app
✅ Created shop: Tienda de Ejemplo
✅ Created 10 products
✅ Database seeded successfully
```

### Paso 7: Iniciar el desarrollo

#### Opción A: Todo junto con TurboRepo

```bash
# Desde la raíz del proyecto
pnpm dev
```

#### Opción B: Por separado (recomendado para debugging)

**Terminal 1 — API:**
```bash
pnpm --filter api dev
```

**Terminal 2 — Bot Padre:**
```bash
pnpm --filter bot-parent dev
```

**Terminal 3 — Bot Hijo:**
```bash
pnpm --filter bot-child dev
```

**Terminal 4 — Mini-App:**
```bash
pnpm --filter mini-app dev
```

---

## Verificación de la instalación

### 1. Health check de la API

```bash
curl http://localhost:3001/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2024-06-15T10:30:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 2. Mini-App en el navegador

Abre http://localhost:5173

Deberías ver la pantalla de login de Vendy.

### 3. Adminer (gestión de DB)

Abre http://localhost:8080

- **Sistema:** PostgreSQL
- **Servidor:** postgres
- **Usuario:** postgres
- **Contraseña:** postgres
- **Base de datos:** vendy

### 4. Verificar logs

```bash
# Logs de la API
pnpm --filter api logs

# Logs de los bots
pnpm --filter bot-parent logs
pnpm --filter bot-child logs
```

---

## Configuración de Telegram Bots

### 1. Crear bots con @BotFather

1. Abre Telegram y busca [@BotFather](https://t.me/BotFather)
2. Envía `/newbot`
3. Seguí las instrucciones para crear:
   - **Bot Padre:** `vendy_parent_bot` (gestión de tiendas)
   - **Bot Hijo:** `vendy_child_bot` (experiencia de compra)
4. Copiá los tokens y pegalos en `.env`

### 2. Configurar webhooks (desarrollo local)

Para recibir actualizaciones de Telegram en local, necesitás ngrok:

```bash
# Instalar ngrok
brew install ngrok    # macOS
# o
npm install -g ngrok  # global

# Iniciar túnel
ngrok http 3001
```

Copiá la URL HTTPS de ngrok (ej: `https://abc123.ngrok.io`) y configurá el webhook:

```bash
curl -X POST "https://api.telegram.org/bot<PARENT_BOT_TOKEN>/setWebhook"   -H "Content-Type: application/json"   -d '{
    "url": "https://abc123.ngrok.io/webhooks/parent",
    "secret_token": "<WEBHOOK_SECRET>"
  }'
```

### 3. Configurar Mini-App

En @BotFather:
1. `/mybots` → seleccioná tu bot
2. `Bot Settings` → `Menu Button` → `Configure menu button`
3. `Configure Web App` → pegá la URL del mini-app

Para desarrollo local, usá la URL de ngrok + `/mini-app`.

---

## Solución de problemas comunes

### Error: "Cannot find module '@vendy/shared-types'"

**Causa:** Los paquetes internos no están compilados.

**Solución:**
```bash
pnpm build:packages
# o
pnpm --filter shared-types build
pnpm --filter ui-components build
pnpm --filter config build
```

### Error: "Database connection failed"

**Causa:** PostgreSQL no está corriendo o las credenciales son incorrectas.

**Solución:**
```bash
# Verificar que PostgreSQL está corriendo
docker compose ps

# Si no está corriendo, iniciarlo
docker compose up -d postgres

# Verificar logs
docker compose logs postgres

# Resetear la base de datos (⚠️ borra todos los datos)
docker compose down -v
docker compose up -d postgres
```

### Error: "Redis connection failed"

**Causa:** Redis no está corriendo.

**Solución:**
```bash
docker compose up -d redis
```

### Error: "Port 3001 is already in use"

**Causa:** Otro proceso está usando el puerto.

**Solución:**
```bash
# Encontrar el proceso
lsof -i :3001

# Matar el proceso
kill -9 <PID>

# O cambiar el puerto en .env
PORT=3002
```

### Error: "Prisma Client is not generated"

**Solución:**
```bash
cd apps/api
npx prisma generate
```

### Error: "pnpm command not found"

**Solución:**
```bash
npm install -g pnpm

# O usando corepack
corepack enable
corepack prepare pnpm@latest --activate
```

### Error: "Docker daemon is not running"

**macOS:**
```bash
open -a Docker
```

**Linux:**
```bash
sudo systemctl start docker
```

**Windows (WSL2):**
```bash
# Asegurate de que Docker Desktop esté corriendo
# Y que WSL2 integration esté habilitada
```

### Error: "Migration failed"

**Solución:**
```bash
# Resetear migraciones (⚠️ borra datos)
cd apps/api
npx prisma migrate reset

# O recrear la base de datos
docker compose down -v
docker compose up -d postgres
npx prisma migrate dev
```

### Error: "Bot webhook not receiving updates"

**Verificaciones:**
```bash
# Verificar que el webhook está configurado
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Debería mostrar la URL configurada y "has_custom_certificate": false

# Si hay errores, borrar y reconfigurar
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
# Y luego configurar de nuevo
```

---

## Próximos pasos

Una vez que la instalación está funcionando:

1. **[Crear tu primera tienda](docs/user-guides/create-shop.md)**
2. **[Agregar productos](docs/user-guides/add-products.md)**
3. **[Configurar pagos](docs/user-guides/setup-payments.md)**
4. **[Personalizar el bot](docs/user-guides/customize-bot.md)**
5. **[Ver analytics](docs/user-guides/analytics.md)**

Para desarrolladores:

1. **[Leer la arquitectura](docs/architecture/README.md)**
2. **[Explorar la API](docs/api/README.md)**
3. **[Contribuir al proyecto](CONTRIBUTING.md)**

---

## Recursos adicionales

- [Documentación de Fastify](https://www.fastify.io/docs/)
- [Documentación de Prisma](https://www.prisma.io/docs/)
- [Documentación de grammy](https://grammy.dev/)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

## ¿Necesitás ayuda?

- [GitHub Issues](https://github.com/vendy/vendy/issues)
- [Telegram: @vendysupport](https://t.me/vendysupport)
- Email: support@vendy.app
