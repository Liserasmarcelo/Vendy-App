# SPRINT 11: Guía Paso a Paso para Ejecutar Vos Mismo

> **Instrucciones ultra-detalladas, tipo receta, para configurar CI/CD, Docker e infraestructura cloud.**
> 
> **Regla:** Seguí cada paso exactamente como está escrito. No saltear ninguno.

---

## ANTES DE EMPEZAR

### Requisitos Previos

| Requisito | Verificación | Si no lo tenés...
|-----------|-------------|-------------------|
| Cuenta de GitHub | Abrí https://github.com/login | Creá una gratis |
| Cuenta de Railway | Abrí https://railway.app/login | Creá una con GitHub |
| Cuenta de Vercel | Abrí https://vercel.com/login | Creá una con GitHub |
| Cuenta de Cloudflare | Abrí https://dash.cloudflare.com/login | Creá una gratis |
| Node.js instalado | `node --version` → debe decir v18+ | Instalá desde nodejs.org |
| pnpm instalado | `pnpm --version` → debe decir 8+ | `npm install -g pnpm` |
| Docker instalado | `docker --version` → debe decir 24+ | Instalá Docker Desktop |
| Git configurado | `git config user.name` y `git config user.email` | Configurá con tus datos |
| Proyecto Vendy clonado | `cd /Users/marcelo/Desktop/Proyectos/Vendy` | Cloná el repo |

### Convención de esta guía

```
PASO X: [Acción concreta]
> [Comando exacto a ejecutar en terminal]

Verificación: [Cómo saber si salió bien]
```

---

## TICKET 1: GitHub Actions CI/CD Completo

**Tiempo estimado:** 45-60 minutos
**Dificultad:** Media
**Resultado:** Cada push a tu repo ejecuta tests automáticamente y puede deployar a staging/producción

---

### PARTE A: Preparar el repositorio en GitHub

**PASO 1: Crear cuenta de GitHub (si no tenés)**

1. Abrí tu navegador
2. Andá a https://github.com/signup
3. Ingresá tu email
4. Creá una contraseña segura
5. Elegí un username (ej: `marcelo-vendy`)
6. Verificá tu email (te llega un link, hacé click)
7. Elegí el plan gratuito ("Free")
8. Respondé las preguntas de onboarding o saltalas con "Skip"

Verificación: Podés ver tu perfil en `https://github.com/tu-username`

**PASO 2: Crear el repositorio para Vendy**

1. Andá a https://github.com/new
2. En "Repository name" escribí: `vendy`
3. En "Description" escribí: `Store-as-a-Service para Telegram`
4. Marcá "Public" (o Private si preferís)
5. NO marques "Add a README file" (ya tenemos uno)
6. NO marques "Add .gitignore" (ya tenemos uno)
7. NO marques "Choose a license" (ya tenemos uno)
8. Hacé click en "Create repository"

Verificación: Ves una página con instrucciones para "…or push an existing repository"

**PASO 3: Subir tu código local a GitHub**

1. Abrí la terminal
2. Asegurate de estar en el proyecto:

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
```

3. Inicializá Git (si no está inicializado):

```bash
git init
```

4. Agregá todos los archivos:

```bash
git add .
```

5. Hacé el primer commit:

```bash
git commit -m "feat: initial commit - Vendy MVP"
```

6. Conectá con GitHub (reemplazá `TU_USERNAME` con tu usuario de GitHub):

```bash
git remote add origin https://github.com/TU_USERNAME/vendy.git
```

7. Subí el código:

```bash
git branch -M main
git push -u origin main
```

8. Ingresá tu username y password (o token) cuando te lo pida

Verificación: Andá a `https://github.com/TU_USERNAME/vendy` y deberías ver todos tus archivos

**PASO 4: Crear la branch `develop`**

1. En la terminal, asegurate de estar en el proyecto:

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
```

2. Creá la branch develop:

```bash
git checkout -b develop
```

3. Subila a GitHub:

```bash
git push -u origin develop
```

Verificación: En GitHub, hacé click en el dropdown que dice "main" y deberías ver "develop"

---

### PARTE B: Configurar GitHub Actions (CI)

**PASO 5: Crear el directorio de workflows**

1. En la terminal, asegurate de estar en el proyecto:

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
```

2. Creá el directorio (si no existe):

```bash
mkdir -p .github/workflows
```

Verificación: `ls -la .github/workflows` debería mostrar el directorio (vacío o con archivos existentes)

**PASO 6: Crear el archivo de CI (Continuous Integration)**

1. Abrí tu editor de código (VS Code, Cursor, etc.)
2. Navegá a `.github/workflows/`
3. Creá un archivo nuevo llamado `ci.yml`
4. Copiá y pegá exactamente este contenido:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run Prettier check
        run: pnpm format:check

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run TypeScript check
        run: pnpm typecheck

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: vendy_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup test database
        run: |
          cd apps/api
          npx prisma migrate deploy
          npx prisma generate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/vendy_test

      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/vendy_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-jwt-secret-key-for-ci-only
          JWT_REFRESH_SECRET: test-jwt-refresh-secret-for-ci-only

  build:
    name: Build Verification
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build:packages

      - name: Build API
        run: pnpm --filter api build

      - name: Build Mini-App
        run: pnpm --filter mini-app build
```

5. Guardá el archivo (Ctrl+S / Cmd+S)

Verificación: El archivo existe en `.github/workflows/ci.yml`

**PASO 7: Commitear y subir el CI**

1. En la terminal:

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI workflow"
git push origin develop
```

Verificación: Andá a `https://github.com/TU_USERNAME/vendy/actions` y deberías ver el workflow "CI" ejecutándose

**PASO 8: Verificar que el CI funciona**

1. Esperá 2-5 minutos
2. Refrescá la página de Actions
3. Deberías ver una ejecución con 4 jobs: Lint, Type Check, Unit Tests, Build Verification
4. Hacé click en cada job para ver el detalle
5. Si alguno falla, leé el error y corregí el problema en tu código local
6. Hacé los fixes, commiteá y subí de nuevo:

```bash
git add .
git commit -m "fix: corrige errores para CI"
git push origin develop
```

Verificación: Todos los jobs deberían mostrar ✅ verde

---

### PARTE C: Configurar GitHub Actions (CD Staging)

**PASO 9: Crear cuenta en Railway (si no tenés)**

1. Abrí https://railway.app/
2. Hacé click en "Start for Free"
3. Elegí "Login with GitHub"
4. Autorizá a Railway a acceder a tu cuenta de GitHub
5. Completá tu nombre y username en Railway
6. Elegí el plan "Hobby" (gratuito) o "Pro" (pago, $5/mes)

Verificación: Estás en el dashboard de Railway (`https://railway.app/dashboard`)

**PASO 10: Obtener el token de Railway**

1. En Railway, hacé click en tu foto de perfil (arriba a la derecha)
2. Seleccioná "Account Settings"
3. Andá a la pestaña "Tokens"
4. Hacé click en "New Token"
5. En "Name" escribí: `GitHub Actions`
6. En "Description" escribí: `Token para deploy desde GitHub Actions`
7. En "Scope" seleccioná tu proyecto (o "Global" si aún no creaste el proyecto)
8. Hacé click en "Create"
9. **Copiá el token que aparece** (es largo, empieza con `eyJ...`)
10. **Guardalo en un lugar seguro** (no se muestra de nuevo)

Verificación: Tenés un token que empieza con `eyJ` guardado en un archivo de texto temporal

**PASO 11: Configurar secrets en GitHub**

1. Andá a tu repo en GitHub: `https://github.com/TU_USERNAME/vendy`
2. Hacé click en "Settings" (pestaña arriba)
3. En el menú lateral, andá a "Secrets and variables" → "Actions"
4. Hacé click en "New repository secret"
5. En "Name" escribí: `RAILWAY_TOKEN`
6. En "Secret" pegá el token de Railway que copiaste en el paso anterior
7. Hacé click en "Add secret"
8. Repetí para estos secrets adicionales:

| Name | Value | Cómo obtenerlo |
|------|-------|---------------|
| `RAILWAY_TOKEN` | El token de Railway | Paso 10 |
| `DATABASE_URL` | `postgresql://...` | Lo vamos a obtener en el Paso 15 |
| `REDIS_URL` | `redis://...` | Lo vamos a obtener en el Paso 15 |
| `JWT_SECRET` | Una string larga y random | Ejecutá: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Otra string larga y random | Ejecutá: `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe Dashboard (o dejalo vacío por ahora) |
| `PARENT_BOT_TOKEN` | Token de @BotFather | @BotFather → /mybots → API Token |
| `CHILD_BOT_TOKEN` | Token de @BotFather | @BotFather → /mybots → API Token |
| `WEBHOOK_SECRET` | Otra string random | `openssl rand -base64 32` |
| `MINI_APP_URL` | `https://app.vendy.app` | Lo configuraremos después |

Verificación: En `Settings → Secrets → Actions` deberías ver todos los secrets listados

**PASO 12: Crear el workflow de CD Staging**

1. En tu editor, navegá a `.github/workflows/`
2. Creá un archivo nuevo llamado `cd-staging.yml`
3. Copiá y pegá exactamente este contenido:

```yaml
name: CD Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-api:
    name: Deploy API to Staging
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build API
        run: pnpm --filter api build

      - name: Deploy to Railway
        uses: railway/cli@v3
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          railway login --token ${{ secrets.RAILWAY_TOKEN }}
          railway link --project vendy-staging
          railway up --service api

      - name: Run migrations
        run: |
          cd apps/api
          npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Health check
        run: |
          sleep 10
          curl -f https://api-staging.vendy.app/health || exit 1

  deploy-mini-app:
    name: Deploy Mini-App to Vercel (Preview)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Mini-App
        run: pnpm --filter mini-app build
        env:
          VITE_API_URL: https://api-staging.vendy.app

      - name: Deploy to Vercel
        uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

4. Guardá el archivo

Verificación: El archivo existe en `.github/workflows/cd-staging.yml`

**PASO 13: Commitear y subir el CD Staging**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add .github/workflows/cd-staging.yml
git commit -m "ci: add staging deployment workflow"
git push origin develop
```

Verificación: En GitHub Actions, deberías ver el workflow "CD Staging" ejecutándose

---

### PARTE D: Configurar GitHub Actions (CD Production)

**PASO 14: Crear el workflow de CD Production**

1. En tu editor, navegá a `.github/workflows/`
2. Creá un archivo nuevo llamado `cd-production.yml`
3. Copiá y pegá exactamente este contenido:

```yaml
name: CD Production

on:
  workflow_dispatch:
    inputs:
      confirm:
        description: 'Type "deploy" to confirm production deployment'
        required: true
        type: string

jobs:
  backup-db:
    name: Backup Database
    runs-on: ubuntu-latest
    if: github.event.inputs.confirm == 'deploy'
    steps:
      - name: Backup database
        run: |
          pg_dump ${{ secrets.DATABASE_URL }} | gzip > backup_pre_deploy_$(date +%Y%m%d_%H%M%S).sql.gz
        continue-on-error: true

  deploy-api:
    name: Deploy API to Production
    needs: backup-db
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build API
        run: pnpm --filter api build

      - name: Deploy to Railway
        uses: railway/cli@v3
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          railway login --token ${{ secrets.RAILWAY_TOKEN }}
          railway link --project vendy-production
          railway up --service api

      - name: Run migrations
        run: |
          cd apps/api
          npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Smoke tests
        run: |
          sleep 15
          curl -f https://api.vendy.app/health || exit 1
          curl -f https://api.vendy.app/health/db || exit 1
          curl -f https://api.vendy.app/health/redis || exit 1

      - name: Notify success
        if: success()
        run: |
          echo "✅ Deploy a producción exitoso"

      - name: Rollback on failure
        if: failure()
        run: |
          echo "❌ Deploy falló. Iniciando rollback..."
          railway rollback

  deploy-mini-app:
    name: Deploy Mini-App to Production
    needs: deploy-api
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Mini-App
        run: pnpm --filter mini-app build
        env:
          VITE_API_URL: https://api.vendy.app

      - name: Deploy to Vercel
        uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

4. Guardá el archivo

Verificación: El archivo existe en `.github/workflows/cd-production.yml`

**PASO 15: Commitear y subir el CD Production**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add .github/workflows/cd-production.yml
git commit -m "ci: add production deployment workflow"
git push origin develop
```

Verificación: En GitHub Actions, vas a la pestaña "Actions" y deberías ver 3 workflows: CI, CD Staging, CD Production

**PASO 16: Probar el deploy manual a producción**

1. Andá a GitHub → tu repo → Actions
2. Hacé click en "CD Production" en la lista de workflows
3. Hacé click en "Run workflow"
4. En el dropdown, seleccioná la branch `main`
5. En "confirm" escribí: `deploy`
6. Hacé click en "Run workflow"
7. Esperá a que termine (puede fallar si Railway/Vercel no están configurados todavía, eso lo haremos en el Ticket 3)

Verificación: El workflow se ejecuta y los pasos se ven en la interfaz de GitHub Actions

---

## TICKET 1: CHECKLIST DE VERIFICACIÓN

Antes de pasar al Ticket 2, verificá que:

- [ ] Tenés cuenta de GitHub creada
- [ ] El repo `vendy` existe en GitHub
- [ ] Tu código está subido (branch `main` y `develop`)
- [ ] El archivo `.github/workflows/ci.yml` existe
- [ ] El CI se ejecuta y pasa (o falla por errores reales que vas a corregir)
- [ ] Tenés cuenta de Railway creada
- [ ] Tenés el token de Railway guardado
- [ ] Los secrets están configurados en GitHub
- [ ] El archivo `.github/workflows/cd-staging.yml` existe
- [ ] El archivo `.github/workflows/cd-production.yml` existe
- [ ] Pudiste ejecutar el workflow de producción manualmente

---

---

## TICKET 2: Dockerización Completa

**Tiempo estimado:** 60-90 minutos
**Dificultad:** Media-Alta
**Resultado:** Podés levantar toda la plataforma localmente con un solo comando

---

### PARTE A: Crear Dockerfile para la API

**PASO 1: Verificar que Docker está funcionando**

1. Abrí la terminal
2. Ejecutá:

```bash
docker --version
docker compose version
```

Verificación: Debe mostrar versiones (Docker 24+ y Docker Compose 2.20+)

**PASO 2: Crear el Dockerfile de la API**

1. En tu editor, navegá a la raíz del proyecto
2. Creá un archivo llamado `apps/api/Dockerfile`
3. Copiá y pegá exactamente este contenido:

```dockerfile
# ==========================================
# STAGE 1: Dependencies
# ==========================================
FROM node:18-alpine AS deps

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de configuración de monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/ui-components/package.json ./packages/ui-components/
COPY apps/api/package.json ./apps/api/

# Instalar dependencias (solo lo necesario para la API)
RUN pnpm install --frozen-lockfile

# ==========================================
# STAGE 2: Builder
# ==========================================
FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copiar todo el código fuente
COPY . .

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Generar Prisma Client
RUN cd apps/api && npx prisma generate

# Build de los paquetes internos
RUN pnpm build:packages

# Build de la API
RUN pnpm --filter api build

# ==========================================
# STAGE 3: Production
# ==========================================
FROM node:18-alpine AS production

RUN npm install -g pnpm

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

WORKDIR /app

# Copiar solo lo necesario para producción
COPY --from=builder --chown=fastify:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=fastify:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=fastify:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=fastify:nodejs /app/package.json ./
COPY --from=builder --chown=fastify:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=fastify:nodejs /app/turbo.json ./

# Copiar paquetes internos compilados
COPY --from=builder --chown=fastify:nodejs /app/packages ./packages

# Instalar solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile

# Generar Prisma Client en producción
RUN cd apps/api && npx prisma generate

# Cambiar al usuario no-root
USER fastify

# Exponer el puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "apps/api/dist/index.js"]
```

4. Guardá el archivo

Verificación: El archivo existe en `apps/api/Dockerfile`

**PASO 3: Crear Dockerfile para el Bot Padre**

1. Creá `apps/bot-parent/Dockerfile`
2. Copiá y pegá:

```dockerfile
# ==========================================
# BOT PARENT DOCKERFILE
# ==========================================
FROM node:18-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/bot-parent/package.json ./apps/bot-parent/

RUN pnpm install --frozen-lockfile

FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/bot-parent/node_modules ./apps/bot-parent/node_modules

RUN pnpm build:packages
RUN pnpm --filter bot-parent build

FROM node:18-alpine AS production

RUN npm install -g pnpm
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 botuser

WORKDIR /app

COPY --from=builder --chown=botuser:nodejs /app/apps/bot-parent/dist ./apps/bot-parent/dist
COPY --from=builder --chown=botuser:nodejs /app/apps/bot-parent/package.json ./apps/bot-parent/
COPY --from=builder --chown=botuser:nodejs /app/package.json ./
COPY --from=builder --chown=botuser:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=botuser:nodejs /app/packages ./packages

RUN pnpm install --prod --frozen-lockfile

USER botuser

HEALTHCHECK --interval=60s --timeout=3s --retries=3 \
  CMD node -e "console.log('Bot is running')" || exit 1

CMD ["node", "apps/bot-parent/dist/index.js"]
```

3. Guardá el archivo

**PASO 4: Crear Dockerfile para el Bot Hijo**

1. Creá `apps/bot-child/Dockerfile`
2. Copiá y pegá el mismo contenido que el Bot Padre pero cambiando `bot-parent` por `bot-child` en todas partes

```dockerfile
# ==========================================
# BOT CHILD DOCKERFILE
# ==========================================
FROM node:18-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/bot-child/package.json ./apps/bot-child/

RUN pnpm install --frozen-lockfile

FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/bot-child/node_modules ./apps/bot-child/node_modules

RUN pnpm build:packages
RUN pnpm --filter bot-child build

FROM node:18-alpine AS production

RUN npm install -g pnpm
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 botuser

WORKDIR /app

COPY --from=builder --chown=botuser:nodejs /app/apps/bot-child/dist ./apps/bot-child/dist
COPY --from=builder --chown=botuser:nodejs /app/apps/bot-child/package.json ./apps/bot-child/
COPY --from=builder --chown=botuser:nodejs /app/package.json ./
COPY --from=builder --chown=botuser:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=botuser:nodejs /app/packages ./packages

RUN pnpm install --prod --frozen-lockfile

USER botuser

HEALTHCHECK --interval=60s --timeout=3s --retries=3 \
  CMD node -e "console.log('Bot is running')" || exit 1

CMD ["node", "apps/bot-child/dist/index.js"]
```

3. Guardá el archivo

**PASO 5: Crear Dockerfile para el Mini-App**

1. Creá `apps/mini-app/Dockerfile`
2. Copiá y pegá:

```dockerfile
# ==========================================
# MINI-APP DOCKERFILE
# ==========================================
FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/ui-components/package.json ./packages/ui-components/
COPY apps/mini-app/package.json ./apps/mini-app/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build:packages
RUN pnpm --filter mini-app build

# ==========================================
# STAGE 2: Nginx para servir archivos estáticos
# ==========================================
FROM nginx:alpine

# Copiar configuración de nginx
COPY apps/mini-app/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados
COPY --from=builder /app/apps/mini-app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

3. Guardá el archivo

**PASO 6: Crear configuración de nginx para el Mini-App**

1. Creá `apps/mini-app/nginx.conf`
2. Copiá y pegá:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

3. Guardá el archivo

---

### PARTE B: Crear .dockerignore

**PASO 7: Crear archivo .dockerignore**

1. En la raíz del proyecto, creá `.dockerignore`
2. Copiá y pegá:

```
# Dependencies
node_modules
.pnpm-store

# Build outputs
**/dist
**/build

# Git
.git
.gitignore

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage
.nyc_output

# Environment (except .env.example)
.env
.env.local
.env.*.local
!.env.example

# Documentation (no necesaria en containers)
docs
*.md

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore

# Scripts (no necesarios en producción)
scripts/*.sh

# Prisma (solo necesitamos schema, no migraciones en prod)
# apps/api/prisma/migrations
```

3. Guardá el archivo

---

### PARTE C: Actualizar Docker Compose para desarrollo

**PASO 8: Actualizar docker-compose.yml**

1. Andá a `infra/docker/docker-compose.yml`
2. Si ya existe, reemplazalo con este contenido. Si no existe, crealo:

```yaml
version: '3.8'

services:
  # ==========================================
  # PostgreSQL
  # ==========================================
  postgres:
    image: postgres:15-alpine
    container_name: vendy-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: vendy
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ==========================================
  # Redis
  # ==========================================
  redis:
    image: redis:7-alpine
    container_name: vendy-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ==========================================
  # API
  # ==========================================
  api:
    build:
      context: ../../
      dockerfile: apps/api/Dockerfile
      target: production
    container_name: vendy-api
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://postgres:postgres@vendy-postgres:5432/vendy?schema=public
      - REDIS_URL=redis://vendy-redis:6379
      - JWT_SECRET=${JWT_SECRET:-dev-jwt-secret}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET:-dev-jwt-refresh-secret}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3

  # ==========================================
  # Bot Parent
  # ==========================================
  bot-parent:
    build:
      context: ../../
      dockerfile: apps/bot-parent/Dockerfile
    container_name: vendy-bot-parent
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - API_URL=http://vendy-api:3001
      - PARENT_BOT_TOKEN=${PARENT_BOT_TOKEN}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
    depends_on:
      - api

  # ==========================================
  # Bot Child
  # ==========================================
  bot-child:
    build:
      context: ../../
      dockerfile: apps/bot-child/Dockerfile
    container_name: vendy-bot-child
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - API_URL=http://vendy-api:3001
      - CHILD_BOT_TOKEN=${CHILD_BOT_TOKEN}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
    depends_on:
      - api

  # ==========================================
  # Mini-App
  # ==========================================
  mini-app:
    build:
      context: ../../
      dockerfile: apps/mini-app/Dockerfile
    container_name: vendy-mini-app
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - api

  # ==========================================
  # Adminer (Database UI)
  # ==========================================
  adminer:
    image: adminer:latest
    container_name: vendy-adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: vendy-network
```

3. Guardá el archivo

---

### PARTE D: Crear Docker Compose para producción

**PASO 9: Crear docker-compose.prod.yml**

1. Creá `infra/docker/docker-compose.prod.yml`
2. Copiá y pegá:

```yaml
version: '3.8'

services:
  # ==========================================
  # Reverse Proxy (Traefik)
  # ==========================================
  traefik:
    image: traefik:v3.0
    container_name: vendy-traefik
    restart: unless-stopped
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@vendy.app"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt

  # ==========================================
  # PostgreSQL
  # ==========================================
  postgres:
    image: postgres:15-alpine
    container_name: vendy-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - vendy-internal

  # ==========================================
  # Redis
  # ==========================================
  redis:
    image: redis:7-alpine
    container_name: vendy-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - vendy-internal

  # ==========================================
  # API
  # ==========================================
  api:
    build:
      context: ../../
      dockerfile: apps/api/Dockerfile
      target: production
    container_name: vendy-api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@vendy-postgres:5432/${DB_NAME}?schema=public
      - REDIS_URL=redis://:${REDIS_PASSWORD}@vendy-redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.vendy.app`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=3001"
    networks:
      - vendy-internal
      - vendy-public
    depends_on:
      - postgres
      - redis

  # ==========================================
  # Mini-App
  # ==========================================
  mini-app:
    build:
      context: ../../
      dockerfile: apps/mini-app/Dockerfile
    container_name: vendy-mini-app
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mini-app.rule=Host(`app.vendy.app`)"
      - "traefik.http.routers.mini-app.entrypoints=websecure"
      - "traefik.http.routers.mini-app.tls.certresolver=letsencrypt"
      - "traefik.http.services.mini-app.loadbalancer.server.port=80"
    networks:
      - vendy-public

volumes:
  postgres_data:
  redis_data:
  letsencrypt:

networks:
  vendy-internal:
    internal: true
  vendy-public:
    driver: bridge
```

3. Guardá el archivo

---

### PARTE E: Probar Docker localmente

**PASO 10: Commitear los Dockerfiles**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add .
git commit -m "docker: add Dockerfiles and docker-compose configurations"
git push origin develop
```

**PASO 11: Probar el build de la API**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
docker build -f apps/api/Dockerfile -t vendy-api:latest .
```

Esto va a tardar 5-10 minutos la primera vez. Esperá a que termine.

Verificación: `docker images | grep vendy-api` debería mostrar la imagen

**PASO 12: Probar docker-compose en desarrollo**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy/infra/docker
docker compose up -d
```

Esperá 1-2 minutos a que todos los servicios arranquen.

Verificación: `docker compose ps` debería mostrar todos los servicios como "Up"

**PASO 13: Verificar que todo funciona**

1. Probar la API:

```bash
curl http://localhost:3001/health
```

Debería responder con JSON de status.

2. Probar el Mini-App:

```bash
curl http://localhost
```

Debería responder con HTML.

3. Probar Adminer:

Abrí http://localhost:8080 en tu navegador.

Debería ver la interfaz de Adminer.

4. Probar PostgreSQL:

```bash
docker compose exec postgres psql -U postgres -d vendy -c "SELECT 1"
```

Debería responder `1`.

5. Probar Redis:

```bash
docker compose exec redis redis-cli ping
```

Debería responder `PONG`.

**PASO 14: Limpiar (detener containers)**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy/infra/docker
docker compose down
```

Verificación: `docker compose ps` no muestra nada

---

## TICKET 2: CHECKLIST DE VERIFICACIÓN

- [ ] Docker y Docker Compose están instalados y funcionan
- [ ] `apps/api/Dockerfile` existe y tiene 3 stages
- [ ] `apps/bot-parent/Dockerfile` existe
- [ ] `apps/bot-child/Dockerfile` existe
- [ ] `apps/mini-app/Dockerfile` existe con nginx
- [ ] `apps/mini-app/nginx.conf` existe
- [ ] `.dockerignore` existe en la raíz
- [ ] `infra/docker/docker-compose.yml` existe y tiene todos los servicios
- [ ] `infra/docker/docker-compose.prod.yml` existe con Traefik
- [ ] El build de la API funciona (`docker build`)
- [ ] `docker compose up -d` levanta todos los servicios
- [ ] La API responde en localhost:3001
- [ ] El Mini-App responde en localhost:80
- [ ] Adminer funciona en localhost:8080
- [ ] PostgreSQL responde a queries
- [ ] Redis responde a PING
- [ ] Los cambios están commiteados y subidos a GitHub

---

---

## TICKET 3: Configuración de Infraestructura Cloud

**Tiempo estimado:** 60-90 minutos
**Dificultad:** Media
**Resultado:** Tu app está deployada en Railway (API) y Vercel (Mini-App), accesible desde internet

---

### PARTE A: Configurar Railway

**PASO 1: Crear proyecto en Railway**

1. Andá a https://railway.app/dashboard
2. Hacé click en "New Project"
3. Elegí "Deploy from GitHub repo"
4. Seleccioná tu repo `vendy`
5. Hacé click en "Add Variables"
6. Agregá las variables de entorno (las mismas que pusiste en GitHub Secrets):
   - `DATABASE_URL` (la vamos a obtener en el Paso 3)
   - `REDIS_URL` (la vamos a obtener en el Paso 3)
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `PARENT_BOT_TOKEN`
   - `CHILD_BOT_TOKEN`
   - `STRIPE_SECRET_KEY`
   - `WEBHOOK_SECRET`
   - `MINI_APP_URL` (después de configurar Vercel)

Verificación: Tenés un proyecto en Railway con el nombre `vendy`

**PASO 2: Agregar PostgreSQL en Railway**

1. En tu proyecto de Railway, hacé click en "New"
2. Elegí "Database" → "Add PostgreSQL"
3. Esperá a que se cree (toma 1-2 minutos)
4. Hacé click en la base de datos creada
5. Andá a la pestaña "Variables"
6. Hacé click en "New Variable"
7. En "Name" escribí: `DATABASE_URL`
8. En "Value" pegá la URL que Railway ya generó (debería ser algo como `postgresql://postgres:password@containers.railway.app:5432/railway`)
9. Marcá "Add Reference" (para que se actualice automáticamente)

Verificación: En "Variables" de tu proyecto, ves `DATABASE_URL` con una URL válida

**PASO 3: Agregar Redis en Railway**

1. En tu proyecto, hacé click en "New"
2. Elegí "Database" → "Add Redis"
3. Esperá a que se cree
4. Hacé click en el Redis creado
5. Andá a "Variables"
6. Agregá `REDIS_URL` con la URL que Railway generó

Verificación: En "Variables" ves `REDIS_URL` con una URL válida

**PASO 4: Configurar deploy del API**

1. En tu proyecto, hacé click en "New"
2. Elegí "GitHub Repo"
3. Seleccioná tu repo `vendy`
4. En "Root Directory" escribí: `apps/api`
5. En "Start Command" escribí: `node dist/index.js`
6. Hacé click en "Deploy"
7. Esperá a que termine el deploy (2-5 minutos)

Verificación: Ves un servicio llamado `api` en tu dashboard de Railway, con status "Running"

**PASO 5: Obtener la URL del API**

1. Hacé click en el servicio `api`
2. Andá a la pestaña "Settings"
3. En "Domains", hacé click en "Generate Domain"
4. Railway te va a dar una URL como `vendy-api.up.railway.app`
5. Copiá esa URL

Verificación: Podés abrir `https://vendy-api.up.railway.app/health` en el navegador y ver la respuesta

**PASO 6: Configurar dominio custom en Railway**

1. En "Settings" del servicio `api`, andá a "Domains"
2. Hacé click en "Custom Domain"
3. Escribí: `api-staging.vendy.app` (para staging)
4. Hacé click en "Add Domain"
5. Railway te va a dar un valor CNAME (algo como `vendy-api.up.railway.app`)
6. **Guardá ese CNAME para el Paso 15**

Verificación: Railway muestra "Domain added" (aunque no va a funcionar hasta que configures DNS en Cloudflare)

---

### PARTE B: Configurar Vercel

**PASO 7: Crear cuenta en Vercel**

1. Andá a https://vercel.com/signup
2. Elegí "Continue with GitHub"
3. Autorizá a Vercel
4. Completá tu nombre de usuario

Verificación: Estás en el dashboard de Vercel (`https://vercel.com/dashboard`)

**PASO 8: Importar proyecto en Vercel**

1. En Vercel, hacé click en "Add New..." → "Project"
2. En "Import Git Repository", seleccioná tu repo `vendy`
3. Hacé click en "Import"
4. En "Framework Preset", elegí "Vite"
5. En "Root Directory", escribí: `apps/mini-app`
6. En "Build Command", escribí: `pnpm build`
7. En "Output Directory", escribí: `dist`
8. En "Environment Variables", agregá:
   - `VITE_API_URL` = `https://api-staging.vendy.app` (o la URL de Railway que obtuviste)
9. Hacé click en "Deploy"
10. Esperá a que termine (1-2 minutos)

Verificación: Vercel muestra "Congratulations! Your project has been deployed." con una URL tipo `vendy-mini-app.vercel.app`

**PASO 9: Obtener tokens de Vercel para GitHub Actions**

1. En Vercel, andá a "Settings" (de tu cuenta, no del proyecto)
2. Andá a "Tokens"
3. Hacé click en "Create Token"
4. En "Token Name" escribí: `GitHub Actions`
5. En "Scope" seleccioná tu proyecto `vendy-mini-app`
6. Hacé click en "Create"
7. **Copiá el token** (empieza con `vercel_...`)

Verificación: Tenés un token de Vercel guardado

**PASO 10: Obtener IDs de Vercel**

1. Instalá la CLI de Vercel:

```bash
npm install -g vercel
```

2. Logueate:

```bash
vercel login
```

3. Seguí las instrucciones (te abre el navegador para autorizar)

4. Andá a tu proyecto:

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy/apps/mini-app
```

5. Linká el proyecto:

```bash
vercel link
```

6. Elegí tu proyecto cuando te lo pregunte

7. Esto crea un archivo `.vercel/project.json`. Abrilo:

```bash
cat .vercel/project.json
```

8. Vas a ver algo como:

```json
{
  "projectId": "prj_xxxxxxxxxxxxxxxx",
  "orgId": "team_xxxxxxxxxxxxxxxx"
}
```

9. **Copiá esos dos valores**

Verificación: Tenés `projectId` y `orgId` guardados

**PASO 11: Agregar secrets de Vercel en GitHub**

1. Andá a tu repo en GitHub → Settings → Secrets → Actions
2. Agregá estos secrets (si no los agregaste antes):

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | El token que copiaste en el Paso 9 |
| `VERCEL_ORG_ID` | El `orgId` del Paso 10 |
| `VERCEL_PROJECT_ID` | El `projectId` del Paso 10 |

Verificación: Los 3 secrets aparecen en la lista de GitHub Secrets

**PASO 12: Configurar dominio custom en Vercel**

1. En Vercel, andá a tu proyecto `vendy-mini-app`
2. Hacé click en "Settings" → "Domains"
3. En "Domain" escribí: `app.vendy.app`
4. Hacé click en "Add"
5. Vercel te va a decir que necesitás configurar un registro DNS
6. **Guardá las instrucciones para el Paso 15**

Verificación: Vercel muestra "Domain configured" (aunque no va a funcionar hasta DNS)

---

### PARTE C: Configurar Cloudflare

**PASO 13: Crear cuenta en Cloudflare**

1. Andá a https://dash.cloudflare.com/sign-up
2. Ingresá tu email y contraseña
3. Verificá tu email (click en el link que te llega)
4. Elegí el plan gratuito

Verificación: Estás en el dashboard de Cloudflare

**PASO 14: Agregar tu dominio a Cloudflare**

1. En Cloudflare, hacé click en "Add a Site"
2. Escribí tu dominio: `vendy.app`
3. Hacé click en "Add Site"
4. Elegí el plan "Free"
5. Cloudflare va a escanear tus registros DNS existentes
6. Si no tenés registros, no importa, los vamos a crear
7. Hacé click en "Continue"
8. Cloudflare te va a dar dos nameservers (algo como `lara.ns.cloudflare.com` y `greg.ns.cloudflare.com`)
9. **Copiá esos dos nameservers**

Verificación: Cloudflare muestra "Complete your nameserver setup"

**PASO 15: Cambiar nameservers en tu registrador de dominio**

1. Andá a donde compraste tu dominio (ej: Namecheap, GoDaddy, Google Domains, NIC Paraguay, etc.)
2. Logueate
3. Encontrá la sección de "DNS" o "Nameservers"
4. Cambiá los nameservers a los dos que te dio Cloudflare
5. Guardá los cambios

> **Nota:** Esto puede tardar de 5 minutos a 24 horas en propagarse. No te preocupes, podés seguir con los demás pasos.

Verificación: En Cloudflare, la página de "Overview" eventualmente va a mostrar "Active" en lugar de "Pending"

**PASO 16: Configurar registros DNS en Cloudflare**

1. En Cloudflare, andá a tu dominio `vendy.app`
2. Hacé click en "DNS" → "Records"
3. Agregá estos registros:

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|-------------|-----|
| CNAME | api | `vendy-api.up.railway.app` | Proxied | Auto |
| CNAME | app | `cname.vercel-dns.com` | Proxied | Auto |
| CNAME | www | `app.vendy.app` | Proxied | Auto |
| A | @ | `192.0.2.1` | Proxied | Auto |

> **Nota:** Para el registro A del root (`@`), usá la IP de Vercel o dejalo como CNAME flattening si tu plan lo permite.

4. Hacé click en "Save"

Verificación: En la lista de DNS records ves los 4 registros creados

**PASO 17: Configurar SSL/TLS en Cloudflare**

1. En Cloudflare, andá a "SSL/TLS"
2. En "Overview", seleccioná "Full (strict)"
3. Andá a "Edge Certificates"
4. Verificá que el certificado esté "Active"
5. Andá a "Always Use HTTPS" y activalo
6. Andá a "Automatic HTTPS Rewrites" y activalo

Verificación: Cloudflare muestra "Active Certificate" y las opciones están activadas

**PASO 18: Configurar seguridad en Cloudflare**

1. Andá a "Security" → "WAF"
2. En "Security Level", elegí "High"
3. Andá a "Bots" → "Bot Fight Mode" y activalo
4. Andá a "Speed" → "Optimization"
5. Activá "Auto Minify" para JS, CSS y HTML
6. Activá "Brotli" compression

Verificación: Las opciones de seguridad muestran "Enabled"

---

### PARTE D: Documentar la configuración

**PASO 19: Crear documentación de Railway**

1. Creá `docs/deployment/railway.md`
2. Escribí los pasos que seguiste para configurar Railway
3. Incluí:
   - Cómo crear el proyecto
   - Cómo agregar PostgreSQL y Redis
   - Cómo configurar variables de entorno
   - Cómo hacer deploy
   - Cómo ver logs
   - Cómo escalar

**PASO 20: Crear documentación de Vercel**

1. Creá `docs/deployment/vercel.md`
2. Escribí los pasos que seguiste para configurar Vercel
3. Incluí:
   - Cómo importar el proyecto
   - Cómo configurar el build
   - Cómo configurar variables de entorno
   - Cómo configurar dominios custom
   - Cómo ver preview deployments

**PASO 21: Crear documentación de variables de entorno**

1. Creá `docs/deployment/environment-variables.md`
2. Listá todas las variables necesarias por entorno:

```markdown
# Variables de Entorno

## Desarrollo Local (.env)

| Variable | Valor de ejemplo | Descripción |
|----------|-----------------|-------------|
| DATABASE_URL | postgresql://postgres:postgres@localhost:5432/vendy | PostgreSQL local |
| REDIS_URL | redis://localhost:6379 | Redis local |
| JWT_SECRET | (openssl rand -base64 32) | Secret para JWT |
| ... | ... | ... |

## Staging (Railway + GitHub Secrets)

| Variable | Origen | Descripción |
|----------|--------|-------------|
| DATABASE_URL | Railway PostgreSQL | Auto-generado |
| ... | ... | ... |

## Producción (Railway + GitHub Secrets)

| Variable | Origen | Descripción |
|----------|--------|-------------|
| DATABASE_URL | Railway PostgreSQL | Auto-generado |
| ... | ... | ... |
```

---

## TICKET 3: CHECKLIST DE VERIFICACIÓN

- [ ] Cuenta de Railway creada y logueada
- [ ] Proyecto `vendy` creado en Railway
- [ ] PostgreSQL agregado en Railway
- [ ] Redis agregado en Railway
- [ ] Servicio `api` deployado en Railway
- [ ] URL de Railway funciona (`https://...railway.app/health`)
- [ ] Dominio custom `api-staging.vendy.app` configurado en Railway
- [ ] Cuenta de Vercel creada y logueada
- [ ] Proyecto `vendy-mini-app` importado en Vercel
- [ ] Mini-App deployado en Vercel
- [ ] URL de Vercel funciona (`https://...vercel.app`)
- [ ] Token de Vercel obtenido y guardado
- [ ] `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` obtenidos
- [ ] Secrets de Vercel agregados en GitHub
- [ ] Dominio custom `app.vendy.app` configurado en Vercel
- [ ] Cuenta de Cloudflare creada
- [ ] Dominio `vendy.app` agregado a Cloudflare
- [ ] Nameservers cambiados en el registrador
- [ ] Cloudflare muestra "Active"
- [ ] Registros DNS configurados (api, app, www)
- [ ] SSL/TLS configurado en Cloudflare (Full strict)
- [ ] HTTPS forzado
- [ ] Seguridad WAF configurada
- [ ] Documentación creada (`railway.md`, `vercel.md`, `environment-variables.md`)
- [ ] Todo commiteado y subido a GitHub

---

---

## TICKET 4: Scripts de Despliegue y Utilidades

**Tiempo estimado:** 30-45 minutos
**Dificultad:** Baja-Media
**Resultado:** Tenés scripts que automatizan deploys, rollbacks, backups y monitoreo

---

### PARTE A: Crear script de deploy manual

**PASO 1: Crear `scripts/deploy.sh`**

1. En tu editor, creá `scripts/deploy.sh`
2. Copiá y pegá:

```bash
#!/bin/bash
# ==========================================
# SCRIPT DE DEPLOY MANUAL
# ==========================================
# Uso: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT="${1:-staging}"
BRANCH="$(git branch --show-current)"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "  Deploy a $ENVIRONMENT"
echo "  Branch: $BRANCH"
echo "  Fecha: $(date)"
echo "=========================================="

# Verificar branch correcta
if [ "$ENVIRONMENT" == "production" ] && [ "$BRANCH" != "main" ]; then
    echo -e "${RED}❌ Error: Para deploy a producción debes estar en la branch 'main'${NC}"
    echo "   Actualmente estás en: $BRANCH"
    echo "   Ejecutá: git checkout main"
    exit 1
fi

if [ "$ENVIRONMENT" == "staging" ] && [ "$BRANCH" != "develop" ]; then
    echo -e "${RED}❌ Error: Para deploy a staging debes estar en la branch 'develop'${NC}"
    echo "   Actualmente estás en: $BRANCH"
    echo "   Ejecutá: git checkout develop"
    exit 1
fi

# Verificar que no hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ Error: Hay cambios sin commitear${NC}"
    echo "   Commiteá o descartá los cambios antes de deployar"
    git status
    exit 1
fi

# Verificar que está actualizado con origin
echo "Verificando que la branch está actualizada..."
git fetch origin
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/$BRANCH)" ]; then
    echo -e "${YELLOW}⚠️  Tu branch no está actualizada con origin${NC}"
    read -p "¿Querés hacer push primero? (y/n): " PUSH_FIRST
    if [ "$PUSH_FIRST" == "y" ]; then
        git push origin $BRANCH
    else
        echo "❌ Deploy cancelado"
        exit 1
    fi
fi

# Ejecutar tests locales
echo ""
echo "Ejecutando tests locales..."
if ! pnpm test; then
    echo -e "${RED}❌ Tests fallaron. Corregí los errores antes de deployar.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tests pasaron${NC}"

# Confirmación para producción
if [ "$ENVIRONMENT" == "production" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  ATENCIÓN: Estás por deployar a PRODUCCIÓN${NC}"
    read -p "Escribí 'deploy' para confirmar: " CONFIRM
    if [ "$CONFIRM" != "deploy" ]; then
        echo "❌ Deploy cancelado"
        exit 1
    fi
fi

# Deploy
echo ""
echo "Iniciando deploy..."
if [ "$ENVIRONMENT" == "production" ]; then
    # Trigger GitHub Actions workflow
    gh workflow run cd-production.yml --ref main -f confirm=deploy
else
    # Push a develop (el CD Staging se ejecuta automáticamente)
    git push origin develop
fi

echo ""
echo -e "${GREEN}✅ Deploy iniciado${NC}"
echo "Verificá el estado en: https://github.com/$(git remote get-url origin | sed 's/.*github.com\///' | sed 's/\.git//')/actions"
```

3. Guardá el archivo
4. Hacelo ejecutable:

```bash
chmod +x /Users/marcelo/Desktop/Proyectos/Vendy/scripts/deploy.sh
```

---

### PARTE B: Crear script de rollback

**PASO 2: Crear `scripts/rollback.sh`**

1. Creá `scripts/rollback.sh`
2. Copiá y pegá:

```bash
#!/bin/bash
# ==========================================
# SCRIPT DE ROLLBACK
# ==========================================
# Uso: ./scripts/rollback.sh

set -e

echo "=========================================="
echo "  Rollback de Vendy"
echo "=========================================="

# Listar últimos deploys en Railway
echo ""
echo "Últimos deploys en Railway:"
railway logs --service api --limit 50 | grep "Deploy" || echo "No se pudieron obtener logs"

echo ""
echo "Para hacer rollback:"
echo "1. Andá a https://railway.app/project/TU-PROYECTO"
echo "2. Seleccioná el servicio 'api'"
echo "3. Andá a 'Deployments'"
echo "4. Hacé click en el deploy anterior al actual"
echo "5. Hacé click en 'Redeploy'"
echo ""
read -p "¿Querés que abra Railway en el navegador? (y/n): " OPEN_BROWSER
if [ "$OPEN_BROWSER" == "y" ]; then
    open https://railway.app/project/$(railway project | grep "Project ID" | awk '{print $3}')
fi
```

3. Guardá y hacelo ejecutable:

```bash
chmod +x /Users/marcelo/Desktop/Proyectos/Vendy/scripts/rollback.sh
```

---

### PARTE C: Crear script de migraciones

**PASO 3: Crear `scripts/migrate.sh`**

1. Creá `scripts/migrate.sh`
2. Copiá y pegá:

```bash
#!/bin/bash
# ==========================================
# SCRIPT DE MIGRACIONES
# ==========================================
# Uso: ./scripts/migrate.sh [local|staging|production]

set -e

ENVIRONMENT="${1:-local}"

echo "=========================================="
echo "  Migraciones - $ENVIRONMENT"
echo "=========================================="

# Determinar DATABASE_URL
if [ "$ENVIRONMENT" == "local" ]; then
    DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/vendy}"
elif [ "$ENVIRONMENT" == "staging" ]; then
    DB_URL="${STAGING_DATABASE_URL}"
    if [ -z "$STAGING_DATABASE_URL" ]; then
        echo "❌ Error: Seteá la variable STAGING_DATABASE_URL"
        exit 1
    fi
elif [ "$ENVIRONMENT" == "production" ]; then
    DB_URL="${PRODUCTION_DATABASE_URL}"
    if [ -z "$PRODUCTION_DATABASE_URL" ]; then
        echo "❌ Error: Seteá la variable PRODUCTION_DATABASE_URL"
        exit 1
    fi
else
    echo "❌ Uso: $0 [local|staging|production]"
    exit 1
fi

echo "Database: $DB_URL"

# Backup antes de migrar (solo staging/producción)
if [ "$ENVIRONMENT" != "local" ]; then
    echo ""
    echo "Creando backup antes de migrar..."
    ./scripts/backup-db.sh
fi

# Ejecutar migraciones
echo ""
echo "Ejecutando migraciones..."
cd apps/api
npx prisma migrate deploy

echo ""
echo "✅ Migraciones completadas"
```

3. Guardá y hacelo ejecutable:

```bash
chmod +x /Users/marcelo/Desktop/Proyectos/Vendy/scripts/migrate.sh
```

---

### PARTE D: Crear script de logs

**PASO 4: Crear `scripts/logs.sh`**

1. Creá `scripts/logs.sh`
2. Copiá y pegá:

```bash
#!/bin/bash
# ==========================================
# SCRIPT DE LOGS
# ==========================================
# Uso: ./scripts/logs.sh [api|bot-parent|bot-child|mini-app|all]

SERVICE="${1:-api}"
ENVIRONMENT="${2:-staging}"

echo "=========================================="
echo "  Logs de $SERVICE ($ENVIRONMENT)"
echo "=========================================="

if [ "$ENVIRONMENT" == "local" ]; then
    if [ "$SERVICE" == "all" ]; then
        docker compose -f infra/docker/docker-compose.yml logs -f
    else
        docker compose -f infra/docker/docker-compose.yml logs -f "$SERVICE"
    fi
else
    # Railway logs
    if [ "$SERVICE" == "all" ]; then
        railway logs --service api
    else
        railway logs --service "$SERVICE"
    fi
fi
```

3. Guardá y hacelo ejecutable:

```bash
chmod +x /Users/marcelo/Desktop/Proyectos/Vendy/scripts/logs.sh
```

---

### PARTE E: Commitear los scripts

**PASO 5: Subir todo a GitHub**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add scripts/
git commit -m "chore: add deployment and utility scripts"
git push origin develop
```

---

## TICKET 4: CHECKLIST DE VERIFICACIÓN

- [ ] `scripts/deploy.sh` existe y es ejecutable
- [ ] `scripts/rollback.sh` existe y es ejecutable
- [ ] `scripts/migrate.sh` existe y es ejecutable
- [ ] `scripts/logs.sh` existe y es ejecutable
- [ ] `scripts/backup-db.sh` existe y funciona (del Sprint 10)
- [ ] `scripts/restore-db.sh` existe y funciona (del Sprint 10)
- [ ] `scripts/health-check.sh` existe y funciona (del Sprint 10)
- [ ] Probar `./scripts/deploy.sh staging` (debería hacer push a develop)
- [ ] Probar `./scripts/logs.sh api local` (debería mostrar logs de Docker)
- [ ] Todo commiteado y subido a GitHub

---

---

## TICKET 5: Configuración de Dominios y SSL

**Tiempo estimado:** 30-45 minutos
**Dificultad:** Baja-Media
**Resultado:** Tus dominios funcionan con HTTPS y SSL válido

---

### PARTE A: Verificar que los dominios resuelven

**PASO 1: Esperar propagación DNS**

> **Nota:** Si acabás de cambiar los nameservers en el Paso 15 del Ticket 3, podés tardar hasta 24 horas. Si ya pasó ese tiempo, continuá.

**PASO 2: Verificar que los dominios funcionan**

1. Abrí la terminal
2. Probar cada dominio:

```bash
# Verificar API
curl -I https://api-staging.vendy.app/health

# Verificar Mini-App
curl -I https://app.vendy.app

# Verificar www redirect
curl -I https://www.vendy.app
```

Verificación: Deberías ver `HTTP/2 200` o `HTTP/2 301/302` (redirect)

**PASO 3: Verificar SSL**

1. Andá a https://www.ssllabs.com/ssltest/
2. Escribí: `api.vendy.app`
3. Hacé click en "Submit"
4. Esperá a que termine el análisis (2-5 minutos)
5. Deberías ver una calificación A o A+

Verificación: SSL Labs muestra "A" o "A+"

---

### PARTE B: Configurar redirecciones

**PASO 4: Redirigir www a app**

1. En Cloudflare, andá a "Rules" → "Page Rules"
2. Hacé click en "Create Page Rule"
3. En "URL" escribí: `www.vendy.app/*`
4. En "Then the settings are", elegí "Forwarding URL"
5. En "Select status code", elegí "301 - Permanent Redirect"
6. En "Destination URL" escribí: `https://app.vendy.app/$1`
7. Hacé click en "Save and Deploy"

Verificación: `curl -I https://www.vendy.app` devuelve `301` con `Location: https://app.vendy.app/`

**PASO 5: Redirigir root domain a app**

1. En Cloudflare, andá a "Rules" → "Page Rules"
2. Hacé click en "Create Page Rule"
3. En "URL" escribí: `vendy.app/*`
4. En "Then the settings are", elegí "Forwarding URL"
5. En "Select status code", elegí "301 - Permanent Redirect"
6. En "Destination URL" escribí: `https://app.vendy.app/$1`
7. Hacé click en "Save and Deploy"

Verificación: `curl -I https://vendy.app` devuelve `301` con `Location: https://app.vendy.app/`

---

### PARTE C: Configurar headers de seguridad

**PASO 6: Agregar headers de seguridad en Cloudflare**

1. En Cloudflare, andá a "Rules" → "Transform Rules" → "Modify Response Header"
2. Hacé click en "Create rule"
3. En "Rule name" escribí: `Security Headers`
4. En "When incoming requests match", dejá "All incoming requests"
5. En "Then", agregá estos headers:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

6. Hacé click en "Deploy"

Verificación: `curl -I https://api.vendy.app/health` muestra los headers de seguridad

---

### PARTE D: Documentar la configuración

**PASO 7: Crear `docs/deployment/domains.md`**

1. Creá el archivo
2. Escribí:

```markdown
# Dominios de Vendy

## Lista de Dominios

| Subdominio | Destino | Uso | Estado |
|------------|---------|-----|--------|
| `api.vendy.app` | Railway | API de producción | ✅ Activo |
| `api-staging.vendy.app` | Railway | API de staging | ✅ Activo |
| `app.vendy.app` | Vercel | Mini-App | ✅ Activo |
| `www.vendy.app` | Redirect → app | Redirect | ✅ Activo |
| `vendy.app` | Redirect → app | Redirect | ✅ Activo |
| `docs.vendy.app` | Vercel/GitBook | Documentación | ⏳ Pendiente |
| `status.vendy.app` | Status page | Estado del sistema | ⏳ Pendiente |

## Configuración DNS

### Cloudflare

- **Nameservers:** `lara.ns.cloudflare.com`, `greg.ns.cloudflare.com`
- **Proxy:** Activado (nube naranja)
- **SSL:** Full (strict)

### Registros DNS

| Type | Name | Content |
|------|------|---------|
| CNAME | api | vendy-api.up.railway.app |
| CNAME | app | cname.vercel-dns.com |
| CNAME | www | app.vendy.app |

## Redirecciones

- `www.vendy.app/*` → `https://app.vendy.app/$1` (301)
- `vendy.app/*` → `https://app.vendy.app/$1` (301)

## SSL/TLS

- **Certificate:** Let's Encrypt (auto-managed)
- **Auto-renewal:** Sí
- **HSTS:** Activado
- **Minimum TLS:** 1.2
```

**PASO 8: Crear `docs/deployment/ssl.md`**

1. Creá el archivo
2. Escribí:

```markdown
# SSL/TLS

## Certificados

| Dominio | Proveedor | Auto-renewal | Expira |
|---------|-----------|-------------|--------|
| `*.vendy.app` | Let's Encrypt | Sí | Auto |

## Configuración

### Cloudflare

- **Mode:** Full (strict)
- **Always Use HTTPS:** Sí
- **Automatic HTTPS Rewrites:** Sí
- **HSTS:** Sí (max-age: 31536000)

### Verificación

```bash
# Verificar SSL
curl -vI https://api.vendy.app/health 2>&1 | grep "SSL"

# Verificar certificado
echo | openssl s_client -servername api.vendy.app -connect api.vendy.app:443 2>/dev/null | openssl x509 -noout -dates
```

## Troubleshooting

### Error: "SSL certificate expired"

1. Verificar en Cloudflare: SSL/TLS → Edge Certificates
2. Si está expired, desactivar y reactivar "Always Use HTTPS"
3. O regenerar el certificado desde Cloudflare

### Error: "Too many redirects"

1. Verificar que no haya loops de redirect
2. En Cloudflare: SSL/TLS debe ser "Full (strict)", no "Flexible"
```

---

### PARTE E: Commitear y verificar

**PASO 9: Subir documentación**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add docs/deployment/
git commit -m "docs: add domain and SSL documentation"
git push origin develop
```

**PASO 10: Probar todos los dominios**

1. Abrí tu navegador
2. Probar cada URL:
   - `https://api.vendy.app/health` → Debería responder JSON
   - `https://app.vendy.app` → Debería cargar el Mini-App
   - `https://www.vendy.app` → Debería redirigir a app.vendy.app
   - `https://vendy.app` → Debería redirigir a app.vendy.app

3. Verificar que el candado de HTTPS está verde en todas

Verificación: Todas las URLs funcionan con HTTPS válido

---

## TICKET 5: CHECKLIST DE VERIFICACIÓN

- [ ] Los dominios resuelven correctamente (DNS propagation completa)
- [ ] `https://api.vendy.app/health` responde 200
- [ ] `https://app.vendy.app` carga el Mini-App
- [ ] `https://www.vendy.app` redirige a `app.vendy.app`
- [ ] `https://vendy.app` redirige a `app.vendy.app`
- [ ] SSL Labs muestra calificación A o A+
- [ ] Headers de seguridad están presentes
- [ ] Cloudflare muestra "Active" para el dominio
- [ ] Documentación de dominios creada (`domains.md`)
- [ ] Documentación de SSL creada (`ssl.md`)
- [ ] Todo commiteado y subido a GitHub

---

---

## SPRINT 11: CHECKLIST FINAL

Antes de decir "Sprint 11 completado", verificá que:

### Ticket 1: CI/CD
- [ ] GitHub repo creado y código subido
- [ ] CI workflow ejecuta tests en cada push
- [ ] CD Staging deploya automáticamente a develop
- [ ] CD Production puede ejecutarse manualmente
- [ ] Secrets configurados en GitHub

### Ticket 2: Docker
- [ ] 4 Dockerfiles creados (api, bot-parent, bot-child, mini-app)
- [ ] Docker Compose dev funciona (`docker compose up -d`)
- [ ] Docker Compose prod tiene Traefik
- [ ] `.dockerignore` existe
- [ ] Todos los servicios responden en local

### Ticket 3: Cloud
- [ ] Railway: API deployada y funcionando
- [ ] Railway: PostgreSQL y Redis configurados
- [ ] Vercel: Mini-App deployada y funcionando
- [ ] Cloudflare: DNS configurado
- [ ] Cloudflare: SSL activo
- [ ] Documentación de despliegue creada

### Ticket 4: Scripts
- [ ] `deploy.sh` funciona
- [ ] `rollback.sh` funciona
- [ ] `migrate.sh` funciona
- [ ] `logs.sh` funciona
- [ ] `backup-db.sh` funciona
- [ ] `restore-db.sh` funciona
- [ ] `health-check.sh` funciona

### Ticket 5: Dominios
- [ ] Todos los dominios funcionan con HTTPS
- [ ] Redirects configurados
- [ ] SSL válido en todos los dominios
- [ ] Headers de seguridad activos
- [ ] Documentación de dominios y SSL creada

---

## NOTAS IMPORTANTES

### Si algo falla

1. **Leer el error cuidadosamente**: Los mensajes de error suelen decir exactamente qué está mal
2. **Verificar los pasos anteriores**: Muchos errores vienen de saltear un paso
3. **Googlea el error**: Copiá el mensaje de error y buscalo
4. **Pedí ayuda**: Si estás atascado, consultá `docs/installation/troubleshooting.md` o escribime

### Seguridad

- **Nunca commitees secrets**: Si accidentalmente subiste un token, rotalo inmediatamente
- **Usá variables de entorno**: Nunca hardcodees passwords o tokens
- **HTTPS siempre**: Nunca deployes sin SSL en producción

### Costos

- **Railway Hobby**: Gratis hasta $5/mes de uso (suficiente para empezar)
- **Vercel Hobby**: Gratis (limitado en bandwidth y funciones)
- **Cloudflare Free**: Gratis (suficiente para la mayoría)
- **Dominio**: ~$10-15/año dependiendo del TLD

---

**¡Buena suerte con el Sprint 11!** 🚀
