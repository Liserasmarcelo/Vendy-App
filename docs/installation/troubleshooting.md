# Troubleshooting de Instalación

> Guía detallada de problemas comunes y sus soluciones.

---

## Índice de Problemas

1. [Problemas de Node.js/pnpm](#problemas-de-nodejspnpm)
2. [Problemas de Docker](#problemas-de-docker)
3. [Problemas de base de datos](#problemas-de-base-de-datos)
4. [Problemas de Redis](#problemas-de-redis)
5. [Problemas de Telegram Bots](#problemas-de-telegram-bots)
6. [Problemas de compilación](#problemas-de-compilación)
7. [Problemas de red/puertos](#problemas-de-redpuertos)
8. [Problemas de Prisma](#problemas-de-prisma)
9. [Problemas de autenticación](#problemas-de-autenticación)
10. [Problemas de Mini-App](#problemas-de-mini-app)

---

## Problemas de Node.js/pnpm

### "node: command not found"

**Diagnóstico:**
```bash
which node || echo "Node no encontrado"
```

**Solución:**
```bash
# macOS con Homebrew
brew install node

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar
node --version  # Debe mostrar v18.x.x
```

### "pnpm: command not found"

**Solución:**
```bash
# Opción 1: npm global
npm install -g pnpm

# Opción 2: corepack (recomendado)
corepack enable
corepack prepare pnpm@latest --activate

# Verificar
pnpm --version  # Debe mostrar 8.x.x
```

### "ERR_PNPM_WORKSPACE_PKG_NOT_FOUND"

**Causa:** Los paquetes del workspace no están linkeados.

**Solución:**
```bash
# Limpiar y reinstalar
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# Reconstruir paquetes internos
pnpm build:packages
```

---

## Problemas de Docker

### "Cannot connect to the Docker daemon"

**macOS:**
```bash
# Iniciar Docker Desktop
open -a Docker

# Esperar a que esté listo
while ! docker system info > /dev/null 2>&1; do
  echo "Esperando Docker..."
  sleep 2
done
```

**Linux:**
```bash
sudo systemctl start docker
sudo usermod -aG docker $USER
# Cerrar sesión y volver a entrar
```

### "Port is already allocated"

**Diagnóstico:**
```bash
# Ver qué proceso usa el puerto
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :3001  # API
lsof -i :5173  # Mini-App
lsof -i :8080  # Adminer
```

**Solución:**
```bash
# Opción 1: Matar el proceso
kill -9 <PID>

# Opción 2: Cambiar puertos en docker-compose.yml
# Editar infra/docker/docker-compose.yml
```

### "Docker compose build fails"

**Solución:**
```bash
# Limpiar caché
docker builder prune -f

# Rebuild sin caché
docker compose build --no-cache

# O forzar pull de imágenes base
docker compose pull
```

---

## Problemas de base de datos

### "Database vendy does not exist"

**Solución:**
```bash
# Conectar a PostgreSQL y crear la base de datos
docker compose exec postgres psql -U postgres -c "CREATE DATABASE vendy;"

# O reiniciar con volumen limpio
docker compose down -v
docker compose up -d postgres
```

### "Migration lock timeout"

**Causa:** Otra migración está corriendo o quedó bloqueada.

**Solución:**
```bash
# Conectar a PostgreSQL
docker compose exec postgres psql -U postgres -d vendy

# En PostgreSQL:
SELECT * FROM "_prisma_migrations" WHERE "started_at" IS NOT NULL AND "finished_at" IS NULL;

# Si hay una migración bloqueada:
UPDATE "_prisma_migrations" SET "finished_at" = NOW() WHERE "id" = '<id>';
```

### "Connection refused on port 5432"

**Verificaciones:**
```bash
# Verificar que PostgreSQL está corriendo
docker compose ps postgres

# Verificar logs
docker compose logs postgres

# Verificar conectividad
docker compose exec postgres pg_isready -U postgres

# Si no está corriendo, iniciarlo
docker compose up -d postgres
```

---

## Problemas de Redis

### "Redis connection refused"

**Verificaciones:**
```bash
# Verificar que Redis está corriendo
docker compose ps redis

# Verificar conectividad
docker compose exec redis redis-cli ping
# Debe responder: PONG

# Si no está corriendo
docker compose up -d redis
```

### "Redis AUTH failed"

**Causa:** La URL de Redis no tiene contraseña o es incorrecta.

**Solución:**
```bash
# Verificar .env
REDIS_URL="redis://localhost:6379"

# Si Redis tiene contraseña:
REDIS_URL="redis://:password@localhost:6379"
```

---

## Problemas de Telegram Bots

### "Webhook not set"

**Verificación:**
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

**Solución:**
```bash
# Borrar webhook existente
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Configurar nuevo webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook"   -H "Content-Type: application/json"   -d '{
    "url": "https://tu-url.com/webhooks/parent",
    "secret_token": "tu-secret"
  }'
```

### "Bot not responding"

**Verificaciones:**
1. ¿El bot está corriendo? `pnpm --filter bot-parent dev`
2. ¿El webhook está configurado? Ver arriba.
3. ¿La URL es accesible? Probar con curl.
4. ¿El secret token coincide? Verificar `.env`.

### "Invalid bot token"

**Causa:** El token fue revocado o es incorrecto.

**Solución:**
```bash
# Verificar el token con Telegram
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Si falla, obtener nuevo token de @BotFather
# /mybots → seleccionar bot → API Token
```

---

## Problemas de compilación

### "TypeScript compilation errors"

**Solución:**
```bash
# Verificar tipos
pnpm typecheck

# Si hay errores en paquetes internos, rebuild
pnpm build:packages

# Si persiste, limpiar caché
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### "Module not found"

**Causa:** Los paquetes del workspace no están linkeados.

**Solución:**
```bash
# Reinstalar todo
pnpm install

# Rebuild de paquetes
pnpm build:packages

# Verificar tsconfig.json tenga references correctas
```

---

## Problemas de red/puertos

### "EADDRINUSE: address already in use"

**Solución:**
```bash
# Encontrar y matar proceso
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9

# O cambiar puerto en .env
PORT=3002
```

### "CORS errors in browser"

**Causa:** El frontend no puede comunicarse con el backend.

**Solución:**
```bash
# Verificar que MINI_APP_URL en .env del backend coincida
# con la URL del frontend

# En apps/api/.env:
MINI_APP_URL="http://localhost:5173"

# En apps/mini-app/.env:
VITE_API_URL="http://localhost:3001"
```

---

## Problemas de Prisma

### "Prisma Client is not generated"

**Solución:**
```bash
cd apps/api
npx prisma generate
```

### "Migration failed"

**Solución:**
```bash
# Resetear (⚠️ borra datos)
npx prisma migrate reset

# O recrear desde cero
docker compose down -v
docker compose up -d postgres
npx prisma migrate dev
```

### "Database schema is out of sync"

**Solución:**
```bash
# Aplicar migraciones pendientes
npx prisma migrate deploy

# O recrear el cliente
npx prisma generate
```

---

## Problemas de autenticación

### "JWT token expired"

**Solución:**
```bash
# Refrescar el token
# En el mini-app, hacer logout y login nuevamente

# O regenerar secretos (⚠️ invalida todos los tokens existentes)
# En .env:
JWT_SECRET="nuevo-secret-$(openssl rand -base64 32)"
```

### "Invalid initData"

**Causa:** El hash de Telegram no coincide.

**Verificaciones:**
1. ¿El BOT_TOKEN es correcto? Debe ser del bot que abre el mini-app.
2. ¿El initData no fue modificado?
3. ¿El relojo del servidor está sincronizado? (NTP)

---

## Problemas de Mini-App

### "Mini-App not loading in Telegram"

**Verificaciones:**
1. ¿La URL del mini-app es HTTPS? (Telegram requiere HTTPS)
2. ¿El dominio está configurado en @BotFather?
3. ¿La URL es accesible públicamente?

**Solución para desarrollo local:**
```bash
# Usar ngrok para HTTPS público
ngrok http 5173

# Configurar en @BotFather:
# /mybots → bot → Bot Settings → Menu Button → Configure Web App
# URL: https://abc123.ngrok.io
```

### "Mini-App blank screen"

**Causa:** Error de JavaScript que impide el renderizado.

**Solución:**
```bash
# Abrir DevTools en Telegram Desktop (F12)
# Verificar consola de errores

# Comunes:
# - Error de CORS → verificar VITE_API_URL
# - Error de módulo → rebuild del mini-app
# - Error de initData → verificar BOT_TOKEN
```

---

## Diagnóstico general

### Script de diagnóstico

```bash
#!/bin/bash
# Guardar como scripts/diagnose.sh

echo "=== Diagnóstico de Vendy ==="
echo

echo "--- Node.js ---"
node --version || echo "❌ Node.js no instalado"

echo "--- pnpm ---"
pnpm --version || echo "❌ pnpm no instalado"

echo "--- Docker ---"
docker --version || echo "❌ Docker no instalado"
docker compose version || echo "❌ Docker Compose no instalado"

echo "--- PostgreSQL ---"
docker compose ps postgres || echo "❌ PostgreSQL no corriendo"

echo "--- Redis ---"
docker compose ps redis || echo "❌ Redis no corriendo"

echo "--- Puertos ---"
for port in 3001 5173 5432 6379 8080; do
  if lsof -i :$port > /dev/null 2>&1; then
    echo "✅ Puerto $port en uso"
  else
    echo "⚠️ Puerto $port libre"
  fi
done

echo "--- Variables de entorno ---"
if [ -f .env ]; then
  echo "✅ .env existe"
  grep -q "DATABASE_URL" .env && echo "✅ DATABASE_URL configurado" || echo "❌ DATABASE_URL faltante"
  grep -q "PARENT_BOT_TOKEN" .env && echo "✅ PARENT_BOT_TOKEN configurado" || echo "❌ PARENT_BOT_TOKEN faltante"
else
  echo "❌ .env no existe"
fi

echo "--- Prisma ---"
cd apps/api && npx prisma --version || echo "❌ Prisma no disponible"

echo
echo "=== Fin del diagnóstico ==="
```

### Logs completos

```bash
# Todos los logs
docker compose logs -f

# Logs de un servicio específico
docker compose logs -f api
docker compose logs -f postgres
docker compose logs -f redis

# Logs con timestamp
docker compose logs -f --timestamps
```

---

## Contacto de soporte

Si el problema persiste:

1. [GitHub Issues](https://github.com/vendy/vendy/issues) — Incluir output del script de diagnóstico
2. [Telegram: @vendysupport](https://t.me/vendysupport)
3. Email: support@vendy.app
