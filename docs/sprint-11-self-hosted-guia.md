# SPRINT 11: Infraestructura Self-Hosted + Cloud-Ready

> **Guía paso a paso para desplegar Vendy en tu Dell Optiplex 3060 (self-hosted)**
> **Optimizado para migración a la nube sin fricciones**
>
> **Regla:** Seguí cada paso exactamente como está escrito. No saltear ninguno.

---

## ANTES DE EMPEZAR

### Requisitos Previos

| Requisito | Verificación | Si no lo tenés...
|-----------|-------------|-------------------|
| Cuenta de GitHub | `https://github.com/login` | Creá una gratis |
| Cuenta de Cloudflare | `https://dash.cloudflare.com/login` | Creá una gratis |
| DuckDNS (DDNS gratuito) | `https://www.duckdns.org/` | Creá una cuenta |
| Node.js instalado | `node --version` → v18+ | Instalá desde nodejs.org |
| pnpm instalado | `pnpm --version` → 8+ | `npm install -g pnpm` |
| Docker instalado | `docker --version` → 24+ | Instalá Docker Desktop |
| Git configurado | `git config user.name` y `git config user.email` | Configurá con tus datos |
| Proyecto Vendy clonado | `cd /Users/marcelo/Desktop/Proyectos/Vendy` | Cloná el repo |
| Tu Dell Optiplex 3060 | Ya lo tenés | — |
| Ubuntu Server instalado | `lsb_release -a` | Instalá Ubuntu Server 22.04 LTS |

### Convención de esta guía

```
PASO X: [Acción concreta]
> [Comando exacto a ejecutar en terminal]

Verificación: [Cómo saber si salió bien]
```

---

## TICKET 1: Preparar el Servidor Local + GitHub + Cloudflare

**Tiempo estimado:** 60-90 minutos
**Dificultad:** Media
**Resultado:** Tu PC está lista como servidor, GitHub sincronizado, Cloudflare protegiendo tu dominio

---

### PARTE A: Instalar Ubuntu Server en la Dell Optiplex 3060

**PASO 1: Descargar Ubuntu Server 22.04 LTS**

1. Abrí tu navegador en tu Mac (la computadora que estás usando ahora)
2. Andá a https://ubuntu.com/download/server
3. Hacé click en "Download Ubuntu Server 22.04.4 LTS"
4. Guardá el archivo ISO (aprox 2GB)

Verificación: Tenés el archivo `ubuntu-22.04.4-live-server-amd64.iso` en tu Downloads

**PASO 2: Crear USB booteable**

1. Descargá BalenaEtcher desde https://www.balena.io/etcher/
2. Instalá BalenaEtcher en tu Mac
3. Insertá un USB de al menos 8GB en tu Mac
4. Abrí BalenaEtcher
5. Hacé click en "Flash from file"
6. Seleccioná el ISO de Ubuntu que descargaste
7. Hacé click en "Select target" y elegí tu USB
8. Hacé click en "Flash"
9. Esperá a que termine (5-10 minutos)

Verificación: BalenaEtcher muestra "Flash complete!"

**PASO 3: Instalar Ubuntu Server en la Dell**

1. Apagá la Dell Optiplex 3060
2. Insertá el USB booteable
3. Prendé la Dell y apretá F12 repetidamente para entrar al boot menu
4. Seleccioná el USB drive (Generalmente "UEFI: USB" o similar)
5. En el menú de Ubuntu, seleccioná "Try or Install Ubuntu Server"
6. Elegí el idioma: "English"
7. En "Keyboard configuration", dejá el default y hacé "Done"
8. En "Choose the type of installation", seleccioná "Ubuntu Server"
9. En "Network configuration", dejá que DHCP asigne IP automáticamente
10. Anotá la IP que te muestra (ej: `192.168.1.100`) — **IMPORTANTE**
11. En "Proxy configuration", dejalo vacío y hacé "Done"
12. En "Ubuntu archive mirror configuration", dejá el default y hacé "Done"
13. En "Guided storage configuration", seleccioná "Use entire disk"
14. Seleccioná el SSD NVMe (no el HDD todavía)
15. En "Storage configuration", confirmá con "Done" y luego "Continue"
16. En "Profile setup", completá:
    - Your name: `vendy`
    - Your server's name: `vendy-server`
    - Pick a username: `vendy`
    - Choose a password: `[creá una contraseña segura, anotala]`
    - Confirm your password: `[repetí]`
17. En "SSH Setup", marcá "Install OpenSSH server" con la barra espaciadora
18. Hacé "Done"
19. En "Featured Server Snaps", NO selecciones ninguno, hacé "Done"
20. Esperá a que instale (10-20 minutos)
21. Cuando termine, hacé "Reboot Now"
22. Sacá el USB cuando te lo pida

Verificación: La Dell arranca y muestra login prompt: `vendy-server login:`

**PASO 4: Primera configuración del servidor**

1. En la Dell, logueate con:
   - Username: `vendy`
   - Password: la que creaste

2. Actualizá el sistema:

```bash
sudo apt update && sudo apt upgrade -y
```

3. Instalá herramientas esenciales:

```bash
sudo apt install -y curl wget git vim htop net-tools ufw fail2ban
```

4. Verificá la IP:

```bash
ip addr show
```

Anotá la IP (ej: `192.168.1.100`)

Verificación: `ping -c 3 google.com` responde desde la Dell

---

### PARTE B: Configurar Docker en el servidor

**PASO 5: Instalar Docker**

1. En la Dell (logueado como `vendy`), ejecutá:

```bash
# Agregar el repositorio oficial de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

2. Agregá tu usuario al grupo docker:

```bash
sudo usermod -aG docker vendy
```

3. Cerrá sesión y volvé a entrar (o reiniciá):

```bash
exit
# Logueate de nuevo
```

4. Verificá que Docker funciona:

```bash
docker --version
docker compose version
```

Verificación: Debe mostrar `Docker version 24.x.x` y `Docker Compose version v2.x.x`

**PASO 6: Instalar Node.js y pnpm**

```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Verificar
node --version
pnpm --version
```

Verificación: Node v18.x.x y pnpm 8.x.x

---

### PARTE C: Configurar GitHub

**PASO 7: Crear cuenta de GitHub (si no tenés)**

1. En tu Mac, abrí https://github.com/signup
2. Completá el registro
3. Verificá tu email

Verificación: Podés ver tu perfil en `https://github.com/tu-username`

**PASO 8: Crear el repositorio para Vendy**

1. Andá a https://github.com/new
2. En "Repository name": `vendy`
3. En "Description": `Store-as-a-Service para Telegram`
4. Marcá "Public"
5. NO marques "Add a README file"
6. NO marques "Add .gitignore"
7. NO marques "Choose a license"
8. Hacé click en "Create repository"

Verificación: Ves una página con instrucciones para "…or push an existing repository"

**PASO 9: Subir tu código local a GitHub**

1. En tu Mac, abrí la terminal
2. Asegurate de estar en el proyecto:

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
```

3. Inicializá Git (si no está):

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

6. Conectá con GitHub (reemplazá `TU_USERNAME`):

```bash
git remote add origin https://github.com/TU_USERNAME/vendy.git
```

7. Subí el código:

```bash
git branch -M main
git push -u origin main
```
Verificación: Andá a `https://github.com/TU_USERNAME/vendy` y deberías ver todos los archivos

**PASO 10: Crear la branch `develop`**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git checkout -b develop
git push -u origin develop
```

Verificación: En GitHub, el dropdown muestra "main" y "develop"

---

### PARTE D: Configurar Cloudflare

**PASO 11: Crear cuenta en Cloudflare**

1. En tu Mac, andá a https://dash.cloudflare.com/sign-up
2. Registrate con tu email
3. Verificá el email (click en el link)

Verificación: Estás en el dashboard de Cloudflare

**PASO 12: Agregar tu dominio a Cloudflare**

1. Hacé click en "Add a Site"
2. Escribí tu dominio: `vendy.app` (o el que tengas)
3. Hacé click en "Add Site"
4. Elegí el plan "Free"
5. Cloudflare escanea registros DNS existentes
6. Hacé click en "Continue"
7. Cloudflare te da dos nameservers (ej: `lara.ns.cloudflare.com`, `greg.ns.cloudflare.com`)
8. **Anotá estos dos nameservers**

Verificación: Cloudflare muestra "Complete your nameserver setup"

**PASO 13: Cambiar nameservers en tu registrador**

1. Andá a donde compraste tu dominio (Namecheap, GoDaddy, etc.)
2. Logueate
3. Buscá la sección "DNS" o "Nameservers"
4. Cambiá a los dos nameservers de Cloudflare
5. Guardá los cambios

Verificación: En Cloudflare, eventualmente muestra "Active" (puede tardar 5 min a 24 horas)

**PASO 14: Configurar registros DNS en Cloudflare**

1. En Cloudflare, andá a tu dominio → "DNS" → "Records"
2. Eliminá cualquier registro A o CNAME existente
3. Agregá estos registros:

| Type | Name | Content | Proxy Status |
|------|------|---------|-------------|
| A | `api` | `[IP de tu Dell, ej: 192.168.1.100]` | DNS only (nube gris) |
| A | `app` | `[IP de tu Dell]` | DNS only (nube gris) |
| A | `@` | `[IP de tu Dell]` | DNS only (nube gris) |
| CNAME | `www` | `vendy.app` | DNS only |

> **IMPORTANTE:** Dejá el proxy en "DNS only" (nube gris) por ahora. Lo activaremos después.

Verificación: Los registros aparecen en la lista de DNS

**PASO 15: Configurar SSL/TLS en Cloudflare**

1. Andá a "SSL/TLS"
2. En "Overview", seleccioná "Full (strict)"
3. Andá a "Edge Certificates"
4. Verificá que el certificado esté "Active"
5. Activá "Always Use HTTPS"
6. Activá "Automatic HTTPS Rewrites"

Verificación: SSL/TLS muestra "Active Certificate"

---

### PARTE E: Configurar DuckDNS (DDNS para IP dinámica)

**PASO 16: Crear cuenta en DuckDNS**

1. En tu Mac, andá a https://www.duckdns.org/
2. Hacé click en "sign in with" y elegí Google, Reddit, Twitter, GitHub o Persona
3. Autorizá la aplicación
4. DuckDNS te va a dar un token (una cadena larga)
5. **Anotá este token**

Verificación: Estás en el dashboard de DuckDNS con tu dominio (ej: `vendy.duckdns.org`)

**PASO 17: Configurar tu dominio DuckDNS**

1. En el dashboard de DuckDNS, en "domains", escribí un nombre: `vendy`
2. En "current ip", dejá la IP que detecta automáticamente (debería ser la IP pública de tu casa)
3. Hacé click en "add domain"
4. Tu dominio será: `vendy.duckdns.org`

Verificación: `vendy.duckdns.org` aparece en la lista de tus dominios

**PASO 18: Instalar el cliente DuckDNS en la Dell**

1. En la Dell (SSH o físicamente), logueate como `vendy`
2. Creá el directorio:

```bash
mkdir -p ~/duckdns
cd ~/duckdns
```

3. Creá el script de actualización:

```bash
cat > duck.sh << 'EOF'
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=vendy&token=TU_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF
```

> **Reemplazá `TU_TOKEN` con el token que anotaste en el Paso 16**

4. Hacelo ejecutable:

```bash
chmod 700 duck.sh
```

5. Probalo:

```bash
./duck.sh
cat duck.log
```

Verificación: `duck.log` muestra "OK"

**PASO 19: Configurar cron para actualización automática**

```bash
crontab -e
```

Elegí el editor (1 para nano, o el que prefieras)

Agregá esta línea al final:

```
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

Guardá (Ctrl+O, Enter, Ctrl+X en nano)

Verificación: `crontab -l` muestra la línea agregada

---

### PARTE F: Configurar firewall en la Dell

**PASO 20: Configurar UFW (Uncomplicated Firewall)**

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS
sudo ufw allow 443/tcp

# Permitir puerto de la API
sudo ufw allow 3001/tcp

# Activar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

Verificación: `sudo ufw status` muestra "Status: active" con los puertos permitidos

**PASO 21: Configurar port forwarding en tu router**

1. Abrí tu navegador en tu Mac
2. Andá a la IP de tu router (generalmente `192.168.1.1` o `192.168.0.1`)
3. Logueate (usuario/password generalmente en una etiqueta del router)
4. Buscá "Port Forwarding" o "Virtual Servers" o "NAT"
5. Agregá estas reglas:

| External Port | Internal IP | Internal Port | Protocol | Description |
|---------------|-------------|---------------|----------|-------------|
| 80 | 192.168.1.100 (IP de tu Dell) | 80 | TCP | HTTP |
| 443 | 192.168.1.100 | 443 | TCP | HTTPS |
| 3001 | 192.168.1.100 | 3001 | TCP | API |

6. Guardá los cambios

Verificación: Desde fuera de tu red (usando datos móviles), podés acceder a `http://vendy.duckdns.org:3001`

---

## TICKET 1: CHECKLIST DE VERIFICACIÓN

- [ ] Ubuntu Server instalado en la Dell
- [ ] IP de la Dell anotada (ej: 192.168.1.100)
- [ ] Docker instalado y funcionando
- [ ] Node.js y pnpm instalados
- [ ] GitHub repo creado y código subido
- [ ] Branch `develop` creada
- [ ] Cloudflare cuenta creada
- [ ] Dominio agregado a Cloudflare
- [ ] Nameservers cambiados en el registrador
- [ ] Registros DNS A creados (api, app, @)
- [ ] SSL/TLS configurado en Cloudflare
- [ ] DuckDNS cuenta creada
- [ ] Dominio `vendy.duckdns.org` configurado
- [ ] Script de actualización DuckDNS funcionando
- [ ] Cron configurado para actualizar cada 5 minutos
- [ ] UFW activado con puertos permitidos
- [ ] Port forwarding configurado en el router

---

---

## TICKET 2: Dockerización + Traefik (Reverse Proxy)

**Tiempo estimado:** 90-120 minutos
**Dificultad:** Alta
**Resultado:** Todos los servicios corriendo en Docker, Traefik manejando SSL y routing

---

### PARTE A: Crear Dockerfiles optimizados

**PASO 1: Crear Dockerfile para la API**

1. En tu Mac, abrí el editor
2. Navegá a `apps/api/`
3. Creá `Dockerfile` con este contenido:

```dockerfile
# ==========================================
# API DOCKERFILE - Multi-stage
# Optimizado para self-hosted + cloud-ready
# ==========================================

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/*/package.json ./packages/*/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:18-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
RUN cd apps/api && npx prisma generate
RUN pnpm build:packages
RUN pnpm --filter api build

# Stage 3: Production
FROM node:18-alpine AS production
RUN npm install -g pnpm
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify
WORKDIR /app
COPY --from=builder --chown=fastify:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=fastify:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=fastify:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=fastify:nodejs /app/package.json ./
COPY --from=builder --chown=fastify:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=fastify:nodejs /app/turbo.json ./
COPY --from=builder --chown=fastify:nodejs /app/packages ./packages
RUN pnpm install --prod --frozen-lockfile
RUN cd apps/api && npx prisma generate
USER fastify
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "apps/api/dist/index.js"]
```

4. Guardá el archivo

Verificación: `apps/api/Dockerfile` existe con el contenido

**PASO 2: Crear Dockerfile para Bot Parent**

1. Creá `apps/bot-parent/Dockerfile`:

```dockerfile
# ==========================================
# BOT PARENT DOCKERFILE
# ==========================================
FROM node:18-alpine AS deps
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/*/package.json ./packages/*/
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
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 botuser
WORKDIR /app
COPY --from=builder --chown=botuser:nodejs /app/apps/bot-parent/dist ./apps/bot-parent/dist
COPY --from=builder --chown=botuser:nodejs /app/apps/bot-parent/package.json ./apps/bot-parent/
COPY --from=builder --chown=botuser:nodejs /app/package.json ./
COPY --from=builder --chown=botuser:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=botuser:nodejs /app/packages ./packages
RUN pnpm install --prod --frozen-lockfile
USER botuser
HEALTHCHECK --interval=60s --timeout=3s --retries=3 \
  CMD node -e "console.log('Bot running')" || exit 1
CMD ["node", "apps/bot-parent/dist/index.js"]
```

2. Guardá el archivo

**PASO 3: Crear Dockerfile para Bot Child**

1. Creá `apps/bot-child/Dockerfile` (mismo que parent pero cambiando `bot-parent` por `bot-child`):

```dockerfile
# ==========================================
# BOT CHILD DOCKERFILE
# ==========================================
FROM node:18-alpine AS deps
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/*/package.json ./packages/*/
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
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 botuser
WORKDIR /app
COPY --from=builder --chown=botuser:nodejs /app/apps/bot-child/dist ./apps/bot-child/dist
COPY --from=builder --chown=botuser:nodejs /app/apps/bot-child/package.json ./apps/bot-child/
COPY --from=builder --chown=botuser:nodejs /app/package.json ./
COPY --from=builder --chown=botuser:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=botuser:nodejs /app/packages ./packages
RUN pnpm install --prod --frozen-lockfile
USER botuser
HEALTHCHECK --interval=60s --timeout=3s --retries=3 \
  CMD node -e "console.log('Bot running')" || exit 1
CMD ["node", "apps/bot-child/dist/index.js"]
```

2. Guardá el archivo

**PASO 4: Crear Dockerfile para Mini-App**

1. Creá `apps/mini-app/Dockerfile`:

```dockerfile
# ==========================================
# MINI-APP DOCKERFILE
# ==========================================
FROM node:18-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/*/package.json ./packages/*/
COPY apps/mini-app/package.json ./apps/mini-app/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build:packages
RUN pnpm --filter mini-app build

FROM nginx:alpine
COPY apps/mini-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/mini-app/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=3s --retries-3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Guardá el archivo

**PASO 5: Crear nginx.conf para Mini-App**

1. Creá `apps/mini-app/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

2. Guardá el archivo

**PASO 6: Crear .dockerignore**

1. En la raíz del proyecto, creá `.dockerignore`:

```
node_modules
.pnpm-store
**/dist
**/build
.git
.gitignore
.vscode
.idea
*.swp
*.swo
.DS_Store
Thumbs.db
logs
*.log
npm-debug.log*
pnpm-debug.log*
coverage
.nyc_output
.env
.env.local
.env.*.local
!.env.example
docs
*.md
Dockerfile*
docker-compose*.yml
.dockerignore
scripts/*.sh
```

2. Guardá el archivo

---

### PARTE B: Crear Docker Compose con Traefik

**PASO 7: Crear docker-compose.yml para producción**

1. Creá `docker-compose.yml` en la raíz del proyecto:

```yaml
version: '3.8'

services:
  # ==========================================
  # TRAEFIK - Reverse Proxy + SSL
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
      - "--certificatesresolvers.letsencrypt.acme.email=tu-email@vendy.app"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - vendy-public

  # ==========================================
  # POSTGRESQL
  # ==========================================
  postgres:
    image: postgres:15-alpine
    container_name: vendy-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-vendy}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - vendy-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ==========================================
  # REDIS
  # ==========================================
  redis:
    image: redis:7-alpine
    container_name: vendy-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-redis}
    volumes:
      - redis_data:/data
    networks:
      - vendy-internal
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
      context: .
      dockerfile: apps/api/Dockerfile
      target: production
    container_name: vendy-api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@vendy-postgres:5432/${DB_NAME:-vendy}?schema=public
      - REDIS_URL=redis://:${REDIS_PASSWORD:-redis}@vendy-redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - PARENT_BOT_TOKEN=${PARENT_BOT_TOKEN}
      - CHILD_BOT_TOKEN=${CHILD_BOT_TOKEN}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - MINI_APP_URL=${MINI_APP_URL:-https://app.vendy.app}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.vendy.app`) || Host(`api.vendy.duckdns.org`)"
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
  # BOT PARENT
  # ==========================================
  bot-parent:
    build:
      context: .
      dockerfile: apps/bot-parent/Dockerfile
      target: production
    container_name: vendy-bot-parent
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - API_URL=http://vendy-api:3001
      - PARENT_BOT_TOKEN=${PARENT_BOT_TOKEN}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
    networks:
      - vendy-internal
      - vendy-public
    depends_on:
      - api

  # ==========================================
  # BOT CHILD
  # ==========================================
  bot-child:
    build:
      context: .
      dockerfile: apps/bot-child/Dockerfile
      target: production
    container_name: vendy-bot-child
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - API_URL=http://vendy-api:3001
      - CHILD_BOT_TOKEN=${CHILD_BOT_TOKEN}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
    networks:
      - vendy-internal
      - vendy-public
    depends_on:
      - api

  # ==========================================
  # MINI-APP
  # ==========================================
  mini-app:
    build:
      context: .
      dockerfile: apps/mini-app/Dockerfile
    container_name: vendy-mini-app
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mini-app.rule=Host(`app.vendy.app`) || Host(`app.vendy.duckdns.org`)"
      - "traefik.http.routers.mini-app.entrypoints=websecure"
      - "traefik.http.routers.mini-app.tls.certresolver=letsencrypt"
      - "traefik.http.services.mini-app.loadbalancer.server.port=80"
    networks:
      - vendy-public

  # ==========================================
  # WATCHTOWER - Auto-update containers
  # ==========================================
  watchtower:
    image: containrrr/watchtower
    container_name: vendy-watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 3600 --cleanup
    networks:
      - vendy-public

volumes:
  postgres_data:
  redis_data:

networks:
  vendy-internal:
    internal: true
  vendy-public:
    driver: bridge
```

> **IMPORTANTE:** Reemplazá `tu-email@vendy.app` con tu email real para Let's Encrypt.

2. Guardá el archivo

---

### PARTE C: Crear archivo de environment

**PASO 8: Crear .env para producción**

1. Creá `.env` en la raíz del proyecto:

```bash
# ==========================================
# VENDY - PRODUCTION ENVIRONMENT
# Self-hosted + Cloud-ready
# ==========================================

# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=vendy

# Redis
REDIS_PASSWORD=redis

# JWT Secrets (generar con: openssl rand -base64 32)
JWT_SECRET=GENERAR
JWT_REFRESH_SECRET=GENERAR

# Telegram Bot Tokens
PARENT_BOT_TOKEN=OBTENER_DE_BOTFATHER
CHILD_BOT_TOKEN=OBTENER_DE_BOTFATHER

# Stripe
STRIPE_SECRET_KEY=sk_test_...

# Webhook Secret
WEBHOOK_SECRET=GENERAR

# URLs
MINI_APP_URL=https://app.vendy.app
API_URL=https://api.vendy.app
```

2. Generá los secrets:

```bash
# En tu Mac, ejecutá:
openssl rand -base64 32
# Copiá el resultado y pegalo en JWT_SECRET

openssl rand -base64 32
# Copiá el resultado y pegalo en JWT_REFRESH_SECRET

openssl rand -base64 32
# Copiá el resultado y pegalo en WEBHOOK_SECRET
```

3. Completá los tokens de Telegram (obtenidos de @BotFather)

4. Guardá el archivo

**PASO 9: Crear .env.example**

1. Copiá `.env` a `.env.example` y reemplazá los valores reales con placeholders:

```bash
cp .env .env.example
```

2. Editá `.env.example` y reemplazá los valores sensibles con `YOUR_...`:

```bash
JWT_SECRET=YOUR_JWT_SECRET
JWT_REFRESH_SECRET=YOUR_JWT_REFRESH_SECRET
PARENT_BOT_TOKEN=YOUR_PARENT_BOT_TOKEN
CHILD_BOT_TOKEN=YOUR_CHILD_BOT_TOKEN
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
```

3. Guardá el archivo

---

### PARTE D: Subir código y probar en local

**PASO 10: Commitear todo**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add .
git commit -m "infra: add Docker setup with Traefik for self-hosted deployment"
git push origin develop
```

**PASO 11: Clonar el repo en la Dell**

1. En la Dell (logueado como `vendy`), ejecutá:

```bash
cd ~
git clone https://github.com/TU_USERNAME/vendy.git
cd vendy
```

2. Verificá que estás en la branch develop:

```bash
git branch
```

Verificación: Muestra `* develop`

**PASO 12: Crear el directorio para certificados**

```bash
mkdir -p letsencrypt
ntouch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json
```

**PASO 13: Copiar .env a la Dell**

1. En tu Mac, copiá el archivo `.env` a la Dell:

```bash
scp /Users/marcelo/Desktop/Proyectos/Vendy/.env vendy@192.168.1.100:~/vendy/
```

> Reemplazá `192.168.1.100` con la IP de tu Dell

2. Ingresá la contraseña de `vendy` cuando te la pida

Verificación: En la Dell, `cat ~/vendy/.env` muestra el contenido

**PASO 14: Levantar los servicios por primera vez**

1. En la Dell:

```bash
cd ~/vendy
docker compose up -d
```

2. Esperá 2-3 minutos a que descargue las imágenes y compile

3. Verificá el estado:

```bash
docker compose ps
```

Verificación: Todos los servicios muestran "Up" o "healthy"

**PASO 15: Verificar que todo funciona**

1. Probar la API:

```bash
curl http://localhost:3001/health
```

Debería responder JSON con status.

2. Probar el Mini-App:

```bash
curl http://localhost
```

Debería responder HTML.

3. Probar Traefik dashboard:

Abrí en tu navegador (en tu Mac): `http://192.168.1.100:8080`

Debería ver el dashboard de Traefik.

4. Verificar logs:

```bash
docker compose logs -f api
```

Presioná Ctrl+C para salir.

Verificación: No hay errores críticos en los logs

---

## TICKET 2: CHECKLIST DE VERIFICACIÓN

- [ ] 4 Dockerfiles creados (api, bot-parent, bot-child, mini-app)
- [ ] `nginx.conf` creado para Mini-App
- [ ] `.dockerignore` creado en la raíz
- [ ] `docker-compose.yml` creado con Traefik
- [ ] `.env` creado con valores reales
- [ ] `.env.example` creado con placeholders
- [ ] Código commiteado y subido a GitHub
- [ ] Repo clonado en la Dell
- [ ] `letsencrypt/acme.json` creado con permisos 600
- [ ] `.env` copiado a la Dell
- [ ] `docker compose up -d` ejecutado sin errores
- [ ] Todos los servicios muestran "Up"
- [ ] API responde en localhost:3001
- [ ] Mini-App responde en localhost:80
- [ ] Traefik dashboard accesible en :8080

---

---

## TICKET 3: GitHub Actions + Webhooks para Auto-Deploy

**Tiempo estimado:** 45-60 minutos
**Dificultad:** Media
**Resultado:** Cada push a `develop` o `main` actualiza automáticamente tu servidor local

---

### PARTE A: Configurar GitHub Actions para self-hosted

**PASO 1: Crear el directorio de workflows**

1. En tu Mac, asegurate de estar en el proyecto:

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
```

2. Creá el directorio:

```bash
mkdir -p .github/workflows
```

**PASO 2: Crear el workflow de CI**

1. Creá `.github/workflows/ci.yml`:

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
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

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
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: cd apps/api && npx prisma migrate deploy && npx prisma generate
        env:
          DATABASE_URL: postgresql://postgres:***@localhost:5432/vendy_test
      - run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:***@localhost:5432/vendy_test
          REDIS_URL: redis://localhost:***@localhost:5432/vendy_test
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:packages
      - run: pnpm --filter api build
      - run: pnpm --filter mini-app build
```

3. Guardá el archivo

**PASO 3: Crear el workflow de CD (Deploy al servidor local)**

1. Creá `.github/workflows/cd-self-hosted.yml`:

```yaml
name: CD Self-Hosted

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    name: Deploy to Self-Hosted Server
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to server via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          password: ${{ secrets.SSH_PASSWORD }}
          script: |
            cd ~/vendy
            
            # Backup antes de deploy
            echo "Creating backup..."
            docker compose exec -T postgres pg_dump -U postgres vendy > ~/backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql
            
            # Pull latest code
            echo "Pulling latest code..."
            git fetch origin
            git reset --hard origin/${{ github.ref_name }}
            
            # Update environment variables if needed
            # cp ~/vendy/.env ~/vendy/.env.backup
            
            # Rebuild and restart containers
            echo "Rebuilding containers..."
            docker compose down
            docker compose pull
            docker compose up -d --build
            
            # Run migrations
            echo "Running migrations..."
            docker compose exec -T api npx prisma migrate deploy
            
            # Cleanup old images
            echo "Cleaning up..."
            docker system prune -f
            
            echo "Deploy completed!"

      - name: Health check
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          password: ${{ secrets.SSH_PASSWORD }}
          script: |
            sleep 10
            curl -f http://localhost:3001/health || exit 1
            echo "Health check passed!"
```

2. Guardá el archivo

**PASO 4: Configurar secrets en GitHub**

1. Andá a tu repo en GitHub → Settings → Secrets → Actions
2. Agregá estos secrets:

| Name | Value | Cómo obtener |
|------|-------|-------------|
| `SSH_HOST` | IP pública de tu casa o `vendy.duckdns.org` | DuckDNS |
| `SSH_USER` | `vendy` | El usuario que creaste en Ubuntu |
| `SSH_PASSWORD` | Contraseña de `vendy` | La que creaste en la instalación |

Verificación: Los secrets aparecen en la lista de GitHub Secrets

**PASO 5: Configurar SSH en la Dell para GitHub Actions**

1. En la Dell, asegurate de que SSH esté accesible desde fuera:

```bash
# Verificar que SSH está corriendo
sudo systemctl status ssh

# Si no está corriendo, iniciarlo
sudo systemctl enable ssh
sudo systemctl start ssh
```

2. Configurá el router para forward del puerto SSH (opcional, para seguridad):

> **Nota:** Para mayor seguridad, considerá usar una VPN (WireGuard) en lugar de exponer SSH directamente.

Verificación: Desde tu Mac, podés conectarte: `ssh vendy@vendy.duckdns.org`

**PASO 6: Commitear y probar**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add .github/workflows/
git commit -m "ci: add GitHub Actions for self-hosted CI/CD"
git push origin develop
```

Verificación: En GitHub Actions, ves el workflow "CI" ejecutándose y pasando

---

### PARTE B: Configurar webhook manual (alternativa a SSH)

**PASO 7: Crear script de deploy en la Dell**

1. En la Dell, creá `~/deploy.sh`:

```bash
#!/bin/bash
# ==========================================
# MANUAL DEPLOY SCRIPT
# ==========================================

cd ~/vendy

echo "=========================================="
echo "  Deploying Vendy"
echo "  $(date)"
echo "=========================================="

# Backup
echo "[1/5] Creating backup..."
mkdir -p ~/backups
docker compose exec -T postgres pg_dump -U postgres vendy > ~/backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql 2>/dev/null || echo "Backup skipped (DB not running)"

# Pull latest code
echo "[2/5] Pulling latest code..."
git fetch origin
git reset --hard origin/main

# Rebuild
echo "[3/5] Rebuilding containers..."
docker compose down
docker compose up -d --build

# Migrations
echo "[4/5] Running migrations..."
sleep 5
docker compose exec -T api npx prisma migrate deploy

# Cleanup
echo "[5/5] Cleaning up..."
docker system prune -f

# Health check
echo ""
echo "Checking health..."
sleep 5
curl -f http://localhost:3001/health && echo "✅ API is healthy" || echo "❌ API health check failed"

echo ""
echo "✅ Deploy completed!"
```

2. Hacelo ejecutable:

```bash
chmod +x ~/deploy.sh
```

Verificación: `ls -la ~/deploy.sh` muestra permisos de ejecución

---

## TICKET 3: CHECKLIST DE VERIFICACIÓN

- [ ] `.github/workflows/ci.yml` creado
- [ ] `.github/workflows/cd-self-hosted.yml` creado
- [ ] Secrets de SSH configurados en GitHub
- [ ] SSH accesible en la Dell (localmente)
- [ ] CI se ejecuta y pasa en GitHub Actions
- [ ] Script `~/deploy.sh` creado en la Dell
- [ ] Todo commiteado y subido a GitHub

---

---

## TICKET 4: Scripts de Utilidad + Backup Automatizado

**Tiempo estimado:** 45-60 minutos
**Dificultad:** Media
**Resultado:** Scripts para deploy, backup, restore, logs, y health checks funcionando

---

### PARTE A: Crear scripts de utilidad

**PASO 1: Crear script de deploy mejorado**

1. En tu Mac, creá `scripts/deploy.sh`:

```bash
#!/bin/bash
# ==========================================
# DEPLOY SCRIPT
# ==========================================
# Uso: ./scripts/deploy.sh [local|remote]

set -e

ENVIRONMENT="${1:-local}"

echo "=========================================="
echo "  Vendy Deploy"
echo "  Environment: $ENVIRONMENT"
echo "  $(date)"
echo "=========================================="

if [ "$ENVIRONMENT" == "local" ]; then
    echo "Deploying to local Docker..."
    cd /Users/marcelo/Desktop/Proyectos/Vendy/infra/docker
    docker compose -f docker-compose.yml up -d --build
    echo "✅ Local deploy complete"
    
elif [ "$ENVIRONMENT" == "remote" ]; then
    echo "Deploying to remote server..."
    
    # Verificar que tenemos las variables necesarias
    if [ -z "$SSH_HOST" ]; then
        echo "❌ Error: Set SSH_HOST environment variable"
        exit 1
    fi
    
    ssh vendy@$SSH_HOST "bash ~/deploy.sh"
    echo "✅ Remote deploy complete"
    
else
    echo "❌ Usage: $0 [local|remote]"
    exit 1
fi
```

2. Hacelo ejecutable:

```bash
chmod +x /Users/marcelo/Desktop/Proyectos/Vendy/scripts/deploy.sh
```

**PASO 2: Crear script de backup**

1. En tu Mac, actualizá `scripts/backup-db.sh` (ya existe del Sprint 10):

```bash
#!/bin/bash
# ==========================================
# BACKUP SCRIPT - Self-hosted + Cloud-ready
# ==========================================
# Uso: ./scripts/backup-db.sh [local|remote]

set -e

ENVIRONMENT="${1:-local}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"

echo "=========================================="
echo "  Database Backup"
echo "  Environment: $ENVIRONMENT"
echo "  $(date)"
echo "=========================================="

mkdir -p "$BACKUP_DIR"

if [ "$ENVIRONMENT" == "local" ]; then
    echo "Backing up local database..."
    
    # Verificar que PostgreSQL está corriendo
    if ! docker compose -f infra/docker/docker-compose.yml ps | grep -q "postgres"; then
        echo "❌ PostgreSQL is not running locally"
        exit 1
    fi
    
    docker compose -f infra/docker/docker-compose.yml exec -T postgres pg_dump -U postgres vendy | gzip > "$BACKUP_DIR/$BACKUP_NAME.sql.gz"
    
elif [ "$ENVIRONMENT" == "remote" ]; then
    echo "Backing up remote database..."
    
    if [ -z "$SSH_HOST" ]; then
        echo "❌ Error: Set SSH_HOST environment variable"
        exit 1
    fi
    
    ssh vendy@$SSH_HOST "docker compose exec -T postgres pg_dump -U postgres vendy" | gzip > "$BACKUP_DIR/$BACKUP_NAME.sql.gz"
    
else
    echo "❌ Usage: $0 [local|remote]"
    exit 1
fi

# Verificar backup
if [ -f "$BACKUP_DIR/$BACKUP_NAME.sql.gz" ]; then
    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.sql.gz" | cut -f1)
    echo "✅ Backup created: $BACKUP_DIR/$BACKUP_NAME.sql.gz ($SIZE)"
else
    echo "❌ Backup failed"
    exit 1
fi

# Cleanup old backups (keep last 30 days)
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete

echo "✅ Backup complete"
```

2. Hacelo ejecutable:

```bash
chmod +x /Users/marcelo/Desktop/Proyectos/Vendy/scripts/backup-db.sh
```

**PASO 3: Crear script de restore**

1. En tu Mac, actualizá `scripts/restore-db.sh`:

```bash
#!/bin/bash
# ==========================================
# RESTORE SCRIPT - Self-hosted + Cloud-ready
# ==========================================
# Uso: ./scripts/restore-db.sh [local|remote] backup_file.sql.gz

set -e

ENVIRONMENT="${1:-local}"
BACKUP_FILE="$2"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Usage: $0 [local|remote] backup_file.sql.gz"
    echo "   Available backups:"
    ls -1 ./backups/*.sql.gz 2>/dev/null || echo "   (none)"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "=========================================="
echo "  Database Restore"
echo "  Environment: $ENVIRONMENT"
echo "  Backup: $BACKUP_FILE"
echo "  $(date)"
echo "=========================================="

echo "⚠️  WARNING: This will overwrite the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

if [ "$ENVIRONMENT" == "local" ]; then
    echo "Restoring local database..."
    
    gunzip -c "$BACKUP_FILE" | docker compose -f infra/docker/docker-compose.yml exec -T postgres psql -U postgres -d vendy
    
elif [ "$ENVIRONMENT" == "remote" ]; then
    echo "Restoring remote database..."
    
    if [ -z "$SSH_HOST" ]; then
        echo "❌ Error: Set SSH_HOST environment variable"
        exit 1
    fi
    
    gunzip -c "$BACKUP_FILE" | ssh vendy@$SSH_HOST "docker compose exec -T postgres psql -U postgres -d vendy"
    
else
    echo "❌ Usage: $0 [local|remote] backup_file.sql.gz"
    exit 1
fi

echo "✅ Restore complete"
```

2. Hacelo ejecutable:

```bash
chmod +x /Users/marcelo/Desktop/Proyectos/Vendy/scripts/restore-db.sh
```

**PASO 4: Crear script de health check**

1. En tu Mac, actualizá `scripts/health-check.sh`:

```bash
#!/bin/bash
# ==========================================
# HEALTH CHECK SCRIPT
# ==========================================
# Uso: ./scripts/health-check.sh [local|remote]

set -e

ENVIRONMENT="${1:-local}"
HOST="${HOST:-localhost}"
API_PORT="${API_PORT:-3001}"

echo "=========================================="
echo "  Health Check"
echo "  Environment: $ENVIRONMENT"
echo "  $(date)"
echo "=========================================="

if [ "$ENVIRONMENT" == "remote" ]; then
    HOST="${SSH_HOST:-api.vendy.app}"
fi

echo ""
echo "Checking API health..."
if curl -f -s "http://$HOST:$API_PORT/health" > /dev/null; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    exit 1
fi

echo ""
echo "Checking database health..."
if curl -f -s "http://$HOST:$API_PORT/health/db" > /dev/null; then
    echo "✅ Database is healthy"
else
    echo "❌ Database health check failed"
fi

echo ""
echo "Checking Redis health..."
if curl -f -s "http://$HOST:$API_PORT/health/redis" > /dev/null; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
fi

echo ""
echo "Checking SSL certificate..."
if echo | openssl s_client -servername api.vendy.app -connect api.vendy.app:443 2>/dev/null | openssl x509 -noout -dates > /dev/null; then
    echo "✅ SSL certificate is valid"
else
    echo "❌ SSL certificate check failed"
fi

echo ""
echo "=========================================="
echo "  Health check complete"
echo "=========================================="
```

2. Hacelo ejecutable:

```bash
chmod +x /Users/marcelo/Desktop/Proyectos/Vendy/scripts/health-check.sh
```

**PASO 5: Crear script de logs**

1. En tu Mac, creá `scripts/logs.sh`:

```bash
#!/bin/bash
# ==========================================
# LOGS SCRIPT
# ==========================================
# Uso: ./scripts/logs.sh [api|bot-parent|bot-child|mini-app|traefik|postgres|redis|all] [local|remote]

SERVICE="${1:-api}"
ENVIRONMENT="${2:-local}"

echo "=========================================="
echo "  Logs: $SERVICE ($ENVIRONMENT)"
echo "=========================================="

if [ "$ENVIRONMENT" == "local" ]; then
    if [ "$SERVICE" == "all" ]; then
        docker compose -f infra/docker/docker-compose.yml logs -f
    else
        docker compose -f infra/docker/docker-compose.yml logs -f "$SERVICE"
    fi
else
    if [ -z "$SSH_HOST" ]; then
        echo "❌ Error: Set SSH_HOST environment variable"
        exit 1
    fi
    
    if [ "$SERVICE" == "all" ]; then
        ssh vendy@$SSH_HOST "docker compose logs -f"
    else
        ssh vendy@$SSH_HOST "docker compose logs -f $SERVICE"
    fi
fi
```

2. Hacelo ejecutable:

```bash
chmod +x /Users/marcelo/Desktop/Proyectos/Vendy/scripts/logs.sh
```

---

### PARTE B: Configurar backup automático en la Dell

**PASO 6: Crear script de backup en la Dell**

1. En la Dell, creá `~/backup.sh`:

```bash
#!/bin/bash
# ==========================================
# AUTOMATED BACKUP SCRIPT
# ==========================================
# Runs daily via cron

set -e

BACKUP_DIR="$HOME/backups"
DB_NAME="vendy"
DB_USER="postgres"
RETENTION_DAYS=30

echo "[$(date)] Starting backup..."

mkdir -p "$BACKUP_DIR"

# Create backup
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"
docker compose -f ~/vendy/docker-compose.yml exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verify
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Backup created: $BACKUP_FILE ($SIZE)"
else
    echo "[$(date)] Backup failed!"
    exit 1
fi

# Cleanup old backups
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup complete"
```

2. Hacelo ejecutable:

```bash
chmod +x ~/backup.sh
```

**PASO 7: Configurar cron para backups diarios**

```bash
crontab -e
```

Agregá esta línea:

```
0 2 * * * ~/backup.sh >> ~/backup.log 2>&1
```

Guardá y salí.

Verificación: `crontab -l` muestra la línea agregada

---

### PARTE C: Commitear todo

**PASO 8: Subir scripts a GitHub**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add scripts/
git commit -m "chore: add deployment and utility scripts for self-hosted"
git push origin develop
```

---

## TICKET 4: CHECKLIST DE VERIFICACIÓN

- [ ] `scripts/deploy.sh` existe y es ejecutable
- [ ] `scripts/backup-db.sh` existe y es ejecutable
- [ ] `scripts/restore-db.sh` existe y es ejecutable
- [ ] `scripts/health-check.sh` existe y es ejecutable
- [ ] `scripts/logs.sh` existe y es ejecutable
- [ ] `~/backup.sh` existe en la Dell
- [ ] Cron configurado para backups diarios
- [ ] Probar `./scripts/health-check.sh local`
- [ ] Todo commiteado y subido a GitHub

---

---

## TICKET 5: Documentación de Infraestructura + Guía de Migración a la Nube

**Tiempo estimado:** 30-45 minutos
**Dificultad:** Baja
**Resultado:** Documentación completa de la infraestructura self-hosted + guía paso a paso para migrar a la nube cuando crezcas

---

### PARTE A: Documentar infraestructura actual

**PASO 1: Crear `docs/deployment/self-hosted.md`**

1. En tu Mac, creá el archivo:

```markdown
# Infraestructura Self-Hosted

## Diagrama de Arquitectura

```
Internet
    │
    ▼
Cloudflare (DNS + SSL + CDN + DDoS)
    │
    ├── api.vendy.app ──► Router ──► Dell Optiplex 3060
    │                                         │
    │                                         ├── Traefik (Reverse Proxy + SSL)
    │                                         │       ├── api.vendy.app:3001
    │                                         │       └── app.vendy.app:80
    │                                         ├── API (Fastify + Prisma)
    │                                         ├── Bot Parent (grammy)
    │                                         ├── Bot Child (grammy)
    │                                         ├── Mini-App (Nginx + React)
    │                                         ├── PostgreSQL
    │                                         └── Redis
    │
    └── app.vendy.app ──► Router ──► Dell Optiplex 3060
```

## Hardware

| Componente | Especificación |
|------------|---------------|
| Servidor | Dell Optiplex 3060 |
| CPU | Intel i5-6500 (4 cores, 4 threads) |
| RAM | 8GB DDR4 |
| Storage | 1TB SSD NVMe (OS + Apps) + 1TB HDD (Backups) |
| OS | Ubuntu Server 22.04 LTS |
| Network | Gigabit Ethernet |

## Software Stack

| Servicio | Tecnología | Puerto |
|----------|-----------|--------|
| Reverse Proxy | Traefik v3 | 80, 443, 8080 |
| API | Fastify + Node.js 18 | 3001 (interno) |
| Mini-App | React + Vite + Nginx | 80 (interno) |
| Bot Parent | grammy (Node.js) | — |
| Bot Child | grammy (Node.js) | — |
| Database | PostgreSQL 15 | 5432 (interno) |
| Cache | Redis 7 | 6379 (interno) |
| Auto-update | Watchtower | — |

## Redes Docker

| Red | Tipo | Servicios |
|-----|------|-----------|
| vendy-internal | Internal | postgres, redis, api, bots |
| vendy-public | Bridge | traefik, api, bots, mini-app |

## Volumes

| Volume | Uso | Backup |
|--------|-----|--------|
| postgres_data | Datos de PostgreSQL | Sí (daily) |
| redis_data | Datos de Redis | No (cache) |
| letsencrypt | Certificados SSL | Sí (manual) |

## Accesos

| Servicio | URL Local | URL Pública |
|----------|-----------|-------------|
| API | http://localhost:3001 | https://api.vendy.app |
| Mini-App | http://localhost | https://app.vendy.app |
| Traefik Dashboard | http://localhost:8080 | — |
| PostgreSQL | localhost:5432 | — (no expuesto) |
| Redis | localhost:6379 | — (no expuesto) |

## Comandos Útiles

```bash
# Ver estado de todos los servicios
docker compose ps

# Ver logs de un servicio
docker compose logs -f api

# Rebuild y restart
docker compose up -d --build

# Backup manual
docker compose exec -T postgres pg_dump -U postgres vendy | gzip > backup.sql.gz

# Restore
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U postgres -d vendy

# Actualizar imágenes
docker compose pull && docker compose up -d
```
```

2. Guardá el archivo

**PASO 2: Crear `docs/deployment/migration-to-cloud.md`**

1. Creá el archivo:

```markdown
# Guía de Migración a la Nube

> Cuando tu PC ya no de más (~500+ clientes), seguí esta guía para migrar a la nube sin perder datos.

## Cuándo Migrar

| Métrica | Umbral | Acción |
|---------|--------|--------|
| RAM usada | > 70% consistentemente | Migrar |
| CPU usada | > 90% consistentemente | Migrar |
| Clientes | > 500 | Planificar migración |
| Uptime requerido | > 99.9% | Migrar |

## Plan de Migración (Zero Downtime)

### Fase 1: Preparación (1 semana antes)

1. **Crear cuenta en Railway**
   - Andá a https://railway.app/
   - Sign up with GitHub
   - Elegí plan Pro ($20/mes)

2. **Crear cuenta en Vercel**
   - Andá a https://vercel.com/
   - Sign up with GitHub
   - Elegí plan Pro ($20/mes)

3. **Configurar variables de entorno**
   - Copiar todas las variables de `.env` a Railway y Vercel
   - Generar nuevos JWT secrets
   - Actualizar `MINI_APP_URL` y `API_URL`

### Fase 2: Migración de Base de Datos (Día 1)

1. **Crear PostgreSQL en Railway**
   - Railway Dashboard → New → Database → PostgreSQL
   - Anotar la `DATABASE_URL`

2. **Backup de la DB local**
   ```bash
   # En la Dell
   docker compose exec -T postgres pg_dump -U postgres vendy > migration_backup.sql
   ```

3. **Restaurar en Railway**
   ```bash
   # En tu Mac
   psql $RAILWAY_DATABASE_URL < migration_backup.sql
   ```

4. **Verificar datos**
   ```bash
   psql $RAILWAY_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   ```

### Fase 3: Migración del Mini-App (Día 1)

1. **Importar repo en Vercel**
   - Vercel Dashboard → Add New Project
   - Importar `vendy` desde GitHub
   - Root Directory: `apps/mini-app`
   - Build Command: `pnpm build`
   - Output Directory: `dist`

2. **Configurar variables**
   - `VITE_API_URL` = `https://api.vendy.app`

3. **Deploy**
   - Vercel hace deploy automático

### Fase 4: Migración de la API (Día 2)

1. **Crear servicio en Railway**
   - Railway Dashboard → New → GitHub Repo
   - Seleccionar `vendy`
   - Root Directory: `apps/api`
   - Start Command: `node dist/index.js`

2. **Configurar variables**
   - Todas las variables de `.env`
   - `DATABASE_URL` = la de Railway PostgreSQL
   - `REDIS_URL` = crear Redis en Railway y copiar URL

3. **Deploy**
   - Railway hace deploy automático

4. **Run migrations**
   ```bash
   railway run npx prisma migrate deploy
   ```

### Fase 5: Cambiar DNS (Día 2)

1. **En Cloudflare**, actualizar registros:
   - `api.vendy.app` → CNAME a Railway
   - `app.vendy.app` → CNAME a Vercel

2. **Esperar propagación** (5 min - 1 hora)

3. **Verificar**
   ```bash
   curl https://api.vendy.app/health
   curl https://app.vendy.app
   ```

### Fase 6: Apagar local (Día 3)

1. **Verificar que todo funciona en la nube**
   - Tests de integración
   - Health checks
   - Logs en Railway/Vercel

2. **Apagar la Dell**
   ```bash
   docker compose down
   sudo shutdown -h now
   ```

3. **Guardar backups locales** por si acaso

## Costos Post-Migración

| Servicio | Plan | Costo/mes |
|----------|------|-----------|
| Railway Pro | Pro | $20 |
| Railway PostgreSQL | Pro | $10 |
| Railway Redis | Pro | $5 |
| Vercel Pro | Pro | $20 |
| Cloudflare | Free | $0 |
| Dominio | — | $1 |
| **Total** | | **$56/mes** |

## Rollback Plan

Si algo falla en la nube:

1. Cambiar DNS de vuelta a la IP de la Dell
2. Prender la Dell
3. `docker compose up -d`
4. Verificar que todo funciona

## Checklist de Migración

- [ ] Railway cuenta creada y proyecto configurado
- [ ] Vercel cuenta creada y proyecto configurado
- [ ] PostgreSQL migrada y datos verificados
- [ ] Redis configurado en Railway
- [ ] API deployada y funcionando
- [ ] Mini-App deployada y funcionando
- [ ] DNS actualizado
- [ ] SSL funcionando
- [ ] Tests pasando
- [ ] Monitoreo configurado
- [ ] Backups configurados en la nube
- [ ] Dell apagada y guardada
```

2. Guardá el archivo

**PASO 3: Crear `docs/deployment/cloudflare-setup.md`**

1. Creá el archivo:

```markdown
# Configuración de Cloudflare

## Registros DNS

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | `@` | `[IP de tu Dell]` | DNS only | Auto |
| A | `api` | `[IP de tu Dell]` | DNS only | Auto |
| A | `app` | `[IP de tu Dell]` | DNS only | Auto |
| CNAME | `www` | `vendy.app` | DNS only | Auto |

## SSL/TLS

- Mode: Full (strict)
- Always Use HTTPS: ON
- Automatic HTTPS Rewrites: ON
- HSTS: ON (max-age: 31536000)

## Security

- Security Level: High
- Bot Fight Mode: ON
- DDoS protection: ON (automático)

## Speed

- Auto Minify: JS, CSS, HTML
- Brotli: ON
- Rocket Loader: OFF (puede romper React)

## Page Rules

1. `www.vendy.app/*` → Forwarding URL → `https://app.vendy.app/$1` (301)
2. `vendy.app/*` → Forwarding URL → `https://app.vendy.app/$1` (301)
```

2. Guardá el archivo

---

### PARTE B: Commitear documentación

**PASO 4: Subir todo a GitHub**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add docs/deployment/
git commit -m "docs: add self-hosted infrastructure docs and cloud migration guide"
git push origin develop
```

---

## TICKET 5: CHECKLIST DE VERIFICACIÓN

- [ ] `docs/deployment/self-hosted.md` creado con diagrama completo
- [ ] `docs/deployment/migration-to-cloud.md` creado con plan paso a paso
- [ ] `docs/deployment/cloudflare-setup.md` creado
- [ ] Documentación commiteada y subida a GitHub

---

---

## SPRINT 11: CHECKLIST FINAL

Antes de decir "Sprint 11 completado", verificá que:

### Ticket 1: Servidor + GitHub + Cloudflare
- [ ] Ubuntu Server instalado en la Dell
- [ ] Docker funcionando en la Dell
- [ ] GitHub repo creado y código subido
- [ ] Cloudflare configurado con DNS
- [ ] DuckDNS configurado para IP dinámica
- [ ] UFW activado
- [ ] Port forwarding configurado en el router

### Ticket 2: Docker + Traefik
- [ ] 4 Dockerfiles creados y funcionando
- [ ] `docker-compose.yml` con Traefik
- [ ] `.env` configurado
- [ ] Servicios levantados en la Dell
- [ ] API responde en localhost:3001
- [ ] Mini-App responde en localhost:80
- [ ] Traefik dashboard accesible

### Ticket 3: GitHub Actions + Auto-Deploy
- [ ] CI workflow creado
- [ ] CD workflow creado para self-hosted
- [ ] Secrets configurados en GitHub
- [ ] Script `~/deploy.sh` en la Dell

### Ticket 4: Scripts + Backup
- [ ] Scripts de deploy, backup, restore, health, logs creados
- [ ] Backup automático configurado con cron
- [ ] Scripts probados y funcionando

### Ticket 5: Documentación
- [ ] Documentación de infraestructura self-hosted
- [ ] Guía de migración a la nube
- [ ] Documentación de Cloudflare

---

## COSTOS MENSUALES DEL SPRINT 11

| Servicio | Costo | Notas |
|----------|-------|-------|
| Electricidad (Dell 24/7) | ~$15/mes | 150W promedio |
| Internet | $0 | Ya lo pagás |
| DuckDNS | $0 | Gratis |
| Cloudflare | $0 | Plan Free |
| Dominio | ~$1/mes | ~$12/año |
| GitHub | $0 | Plan Free |
| **Total** | **~$16/mes** | |

---

## PRÓXIMOS PASOS

Una vez completado el Sprint 11, tu infraestructura estará lista para:

- **Sprint 12**: Monitoreo (Grafana + Prometheus), alertas, métricas
- **Sprint 13**: Documentación de usuario, onboarding, go-live

**¿Listo para continuar?** Decidí si querés que proceda con el Sprint 12 o si querés ejecutar el Sprint 11 primero.

---

---

## TICKET 6: Configuración Telegram Production (BotFather + Webhooks + initData)

**Tiempo estimado:** 60-90 minutos
**Dificultad:** Media-Alta
**Resultado:** Bots de Telegram funcionando en producción con webhooks, Mini-App validando initData, menú configurado

---

### PARTE A: Configurar @BotFather para Producción

**PASO 1: Crear/obtener tokens de bots**

1. Abrí Telegram en tu teléfono o desktop
2. Buscá `@BotFather` y abrilo
3. Si ya tenés bots creados (del Sprint 5), escribí `/mybots`
4. Seleccioná tu bot padre (`@vendy_bot` o similar)
5. Tocá "API Token"
6. **Copiá el token** (largo, empieza con números)
7. Repetí para el bot hijo si tenés uno

Si no tenés bots creados:
1. Escribí `/newbot` a @BotFather
2. Elegí nombre: `Vendy`
3. Elegí username: `vendy_bot` (debe terminar en _bot)
4. **Guardá el token**
5. Repetí para el bot hijo: `vendy_shop_bot`

Verificación: Tenés 2 tokens guardados en un archivo de texto seguro

> **IMPORTANTE:** El `PARENT_BOT_TOKEN` y `CHILD_BOT_TOKEN` son los que usás en el `.env` de tu API. Guardá estos tokens en un lugar seguro (1Password, Keychain, etc.).

> **DIFERENCIA CON DESARROLLO:** En desarrollo usás `PARENT_BOT_TOKEN` con long polling (el bot escucha mensajes directamente). En producción self-hosted, el bot usa webhooks (Telegram envía mensajes a tu servidor). El token es el mismo, pero la forma de recibir mensajes cambia.

**PASO 2: Configurar descripción y about**

1. En @BotFather, seleccioná tu bot padre
2. Tocá "Edit Bot" → "Edit Description"
3. Escribí:

```
🛒 Vendy - Tu tienda en Telegram

Crea tu tienda online en minutos. Vende productos, acepta pagos y gestiona órdenes sin salir de Telegram.

✅ Gratis para empezar
✅ Pagos con tarjeta y transferencia
✅ Sin apps extra

👉 Toca "Abrir App" para comenzar
```

4. Tocá "Edit About"
5. Escribí:

```
Vendy es la plataforma de e-commerce más simple para Telegram. Crea tu tienda, agrega productos y empieza a vender hoy.

Desarrollado por @tu_usuario
```

6. Tocá "Edit Description Picture" y subí una foto (logo de Vendy)

Verificación: Tu bot muestra la descripción cuando alguien lo busca

**PASO 3: Configurar comandos del bot**

1. En @BotFather, seleccioná tu bot
2. Tocá "Edit Commands"
3. Elegí "Edit commands" (no "Edit admin commands")
4. Escribí los comandos:

```
start - Iniciar Vendy y abrir la app
help - Obtener ayuda y soporte
catalog - Ver catálogo de productos
cart - Ver mi carrito de compras
orders - Ver mis órdenes
language - Cambiar idioma
```

5. Tocá "Save"

Verificación: Escribí `/` en el chat con tu bot y ves la lista de comandos

**PASO 4: Configurar menú button (botón para abrir Mini-App)**

1. En @BotFather, seleccioná tu bot
2. Tocá "Edit Bot" → "Menu Button"
3. Elegí "Configure menu button"
4. Elegí "Configure menu button URL"
5. Escribí la URL de tu Mini-App:

```
https://app.vendy.app
```

> Si aún no tenés el dominio configurado, usá tu DuckDNS:
> `https://app.vendy.duckdns.org`

6. Tocá "Save"

Verificación: Abrí el chat con tu bot y ves un botón "Abrir App" o "Menu" al lado del campo de texto

**PASO 5: Configurar dominio permitido para Mini-App**

1. En @BotFather, seleccioná tu bot
2. Tocá "Edit Bot" → "Bot Settings"
3. Tocá "Configure Mini App"
4. Tocá "Configure Mini App URL"
5. Escribí la URL de tu Mini-App:

```
https://app.vendy.app
```

6. Tocá "Save"

> **IMPORTANTE:** Si no configurás esto, Telegram bloquea la Mini-App con error "Bot domain not configured"

Verificación: La URL se guarda sin errores

**PASO 6: Configurar webhook en BotFather (opcional)**

> Nota: Esto lo hacemos por código, pero verificá que el bot esté en modo webhook:

1. En @BotFather, seleccioná tu bot
2. Tocá "Bot Settings" → "Webhook"
3. Si dice "Webhook is set", está bien
4. Si dice "Webhook is not set", lo configuraremos por código en el Paso 8

---

### PARTE B: Configurar Webhooks en la API

**PASO 7: Agregar configuración de webhook al .env**

1. En tu Mac, editá `.env` en la raíz del proyecto:

```bash
# ==========================================
# TELEGRAM BOT CONFIGURATION
# ==========================================

# Bot Tokens (obtenidos de @BotFather)
PARENT_BOT_TOKEN=1234567890:ABC...XYZ
CHILD_BOT_TOKEN=1234567890:DEF...UVW

# Webhook configuration
WEBHOOK_URL=https://api.vendy.app/webhook
WEBHOOK_SECRET=tu_webhook_secret_generado

# Para self-hosted con DuckDNS (alternativa)
# WEBHOOK_URL=https://api.vendy.duckdns.org/webhook
```

2. Generá un webhook secret:

```bash
openssl rand -base64 32
```

3. Copiá el resultado en `WEBHOOK_SECRET`

4. Guardá el archivo

**PASO 8: Crear endpoint de webhook en la API**

1. En tu Mac, creá `apps/api/src/routes/webhook.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { Telegraf } from 'telegraf';

export default async function webhookRoutes(app: FastifyInstance) {
  const bot = new Telegraf(process.env.PARENT_BOT_TOKEN!);

  // Webhook endpoint para Telegram
  app.post('/webhook', async (request, reply) => {
    const secretToken = request.headers['x-telegram-bot-api-secret-token'];
    
    // Validar webhook secret
    if (secretToken !== process.env.WEBHOOK_SECRET) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const update = request.body as any;
    
    // Procesar update
    await bot.handleUpdate(update);
    
    return { ok: true };
  });

  // Endpoint para setear webhook (llamar una vez al deployar)
  app.post('/webhook/set', async (request, reply) => {
    const { url } = request.body as any;
    
    try {
      await bot.telegram.setWebhook(url, {
        secret_token: process.env.WEBHOOK_SECRET,
        allowed_updates: ['message', 'callback_query', 'pre_checkout_query', 'inline_query']
      });
      
      return { ok: true, message: 'Webhook set successfully' };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to set webhook', details: error });
    }
  });

  // Endpoint para verificar webhook
  app.get('/webhook/info', async (request, reply) => {
    try {
      const info = await bot.telegram.getWebhookInfo();
      return { ok: true, webhook: info };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to get webhook info' });
    }
  });

  // Endpoint para eliminar webhook (usar con cuidado)
  app.post('/webhook/delete', async (request, reply) => {
    try {
      await bot.telegram.deleteWebhook();
      return { ok: true, message: 'Webhook deleted' };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to delete webhook' });
    }
  });
}
```

2. Registrá la ruta en `apps/api/src/index.ts`:

```typescript
import webhookRoutes from './routes/webhook';

// ... después de registrar otras rutas
app.register(webhookRoutes, { prefix: '/api' });
```

3. Guardá todo

**PASO 9: Configurar manejo de comandos del bot**

1. Creá `apps/api/src/services/bot.ts`:

```typescript
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.PARENT_BOT_TOKEN!);

// Comando /start
bot.start((ctx) => {
  const startParam = ctx.payload; // Parámetro de referido
  
  ctx.reply(
    `🎉 ¡Bienvenido a Vendy!\n\n` +
    `Tu tienda online dentro de Telegram.\n\n` +
    `👉 Tocá "Abrir App" para comenzar`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { 
              text: '🚀 Abrir Vendy', 
              web_app: { url: `https://app.vendy.app?ref=${startParam}` } 
            }
          ],
          [
            { text: '📖 Ayuda', callback_data: 'help' },
            { text: '💬 Soporte', url: 'https://t.me/vendy_soporte' }
          ]
        ]
      }
    }
  );
});

// Comando /help
bot.help((ctx) => {
  ctx.reply(
    `📖 Comandos disponibles:\n\n` +
    `/start - Iniciar Vendy\n` +
    `/catalog - Ver catálogo\n` +
    `/cart - Ver carrito\n` +
    `/orders - Mis órdenes\n` +
    `/language - Cambiar idioma\n\n` +
    `¿Necesitás ayuda? Escribinos a soporte@vendy.app`
  );
});

// Manejar callback queries
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  
  if (data === 'help') {
    await ctx.answerCbQuery('¿En qué podemos ayudarte?');
    await ctx.reply('Escribí tu consulta y te responderemos pronto.');
  }
});

// Manejar pre-checkout (pagos)
bot.on('pre_checkout_query', async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

// Manejar pagos exitosos
bot.on('successful_payment', async (ctx) => {
  const payment = ctx.message.successful_payment;
  
  await ctx.reply(
    `✅ ¡Pago recibido!\n\n` +
    `Orden: ${payment.invoice_payload}\n` +
    `Monto: ${payment.total_amount / 100} ${payment.currency}\n\n` +
    `Gracias por tu compra 🎉`
  );
  
  // Notificar al vendedor
  // await notifySeller(payment.invoice_payload);
});

export { bot };
```

2. Guardá el archivo

**PASO 10: Actualizar docker-compose.yml para exponer webhooks**

1. Editá `docker-compose.yml` y asegurate de que el servicio `api` tenga:

```yaml
  api:
    # ... configuración existente ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.vendy.app`) || Host(`api.vendy.duckdns.org`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=3001"
      # Ruta específica para webhooks (sin autenticación)
      - "traefik.http.routers.api-webhook.rule=Host(`api.vendy.app`) && Path(`/webhook`)"
      - "traefik.http.routers.api-webhook.entrypoints=websecure"
      - "traefik.http.routers.api-webhook.tls.certresolver=letsencrypt"
    networks:
      - vendy-internal
      - vendy-public
    depends_on:
      - postgres
      - redis
```

2. Guardá el archivo

---

### PARTE C: Configurar initData Validation

**PASO 11: Crear utilidad de validación de initData**

1. En tu Mac, creá `apps/api/src/lib/initData.ts`:

```typescript
import crypto from 'crypto';

export interface WebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

export interface InitDataValidationResult {
  valid: boolean;
  user: WebAppUser | null;
  error?: string;
}

/**
 * Valida el initData de Telegram usando HMAC-SHA256
 */
export function validateInitData(
  initData: string, 
  botToken: string,
  maxAgeSeconds: number = 86400
): InitDataValidationResult {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return { valid: false, user: null, error: 'Missing hash' };
    }

    // Validar auth_date (prevenir replay attacks)
    const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    
    if ((now - authDate) > maxAgeSeconds) {
      return { valid: false, user: null, error: 'initData expired' };
    }

    // Remover hash para calcular
    urlParams.delete('hash');
    
    // Ordenar parámetros alfabéticamente
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Crear secret key: HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    // Calcular hash: HMAC-SHA256(secretKey, dataCheckString)
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    if (calculatedHash !== hash) {
      return { valid: false, user: null, error: 'Invalid hash' };
    }

    // Extraer usuario
    const userJson = urlParams.get('user');
    const user = userJson ? JSON.parse(decodeURIComponent(userJson)) : null;

    return { valid: true, user };
  } catch (error) {
    return { valid: false, user: null, error: 'Validation error: ' + error };
  }
}

/**
 * Extrae el usuario de initData sin validar
 * Útil para debugging, NO usar en producción
 */
export function getUserFromInitData(initData: string): WebAppUser | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    return userJson ? JSON.parse(decodeURIComponent(userJson)) : null;
  } catch {
    return null;
  }
}

/**
 * Middleware de Fastify para validar initData
 */
export async function authenticateTelegram(request: any, reply: any) {
  const initData = request.headers['x-telegram-init-data'];
  
  if (!initData) {
    return reply.status(401).send({ 
      error: 'Unauthorized', 
      message: 'Missing X-Telegram-Init-Data header' 
    });
  }
  
  const botToken = process.env.PARENT_BOT_TOKEN;
  if (!botToken) {
    return reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Bot token not configured' 
    });
  }
  
  const result = validateInitData(initData, botToken);
  
  if (!result.valid) {
    return reply.status(401).send({ 
      error: 'Unauthorized', 
      message: result.error || 'Invalid initData' 
    });
  }
  
  request.user = result.user;
}
```

2. Guardá el archivo

**PASO 12: Crear tests para initData**

1. Creá `apps/api/src/lib/initData.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateInitData, getUserFromInitData } from './initData';

describe('initData validation', () => {
  const botToken = '1234567890:ABC...XYZ';

  it('rejects missing hash', () => {
    const result = validateInitData('user=%7B%22id%22%3A123%7D', botToken);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing hash');
  });

  it('rejects expired initData', () => {
    const oldInitData = 'user=%7B%22id%22%3A123%7D&auth_date=1&hash=abc';
    const result = validateInitData(oldInitData, botToken);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('initData expired');
  });

  it('rejects invalid hash', () => {
    const initData = 'user=%7B%22id%22%3A123%7D&auth_date=9999999999&hash=invalid';
    const result = validateInitData(initData, botToken);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid hash');
  });

  it('extracts user from initData', () => {
    const initData = 'user=%7B%22id%22%3A123%2C%22first_name%22%3A%22John%22%7D';
    const user = getUserFromInitData(initData);
    expect(user).toEqual({ id: 123, first_name: 'John' });
  });
});
```

2. Guardá el archivo

**PASO 13: Aplicar middleware de initData a rutas protegidas**

1. Editá `apps/api/src/routes/analytics.ts` (o cualquier ruta protegida):

```typescript
import { FastifyInstance } from 'fastify';
import { authenticateTelegram } from '../lib/initData';

export default async function analyticsRoutes(app: FastifyInstance) {
  // Todas las rutas requieren initData válido
  app.addHook('preHandler', authenticateTelegram);

  app.post('/analytics/track', async (request, reply) => {
    const { shopId, eventType, properties } = request.body as any;
    const user = (request as any).user;

    // Guardar evento con telegram_id del usuario
    await prisma.analyticsEvent.create({
      data: {
        shopId,
        eventType,
        userId: user.id.toString(),
        properties: properties || {},
      },
    });

    return { success: true };
  });
}
```

2. Guardá el archivo

---

### PARTE D: Configurar Mini-App para enviar initData

**PASO 14: Actualizar el frontend para enviar initData**

1. En tu Mac, editá `apps/mini-app/src/lib/api.ts`:

```typescript
// Cliente API que envía initData en cada request
const API_URL = import.meta.env.VITE_API_URL || 'https://api.vendy.app';

class ApiClient {
  private baseUrl: string;
  private initData: string;

  constructor() {
    this.baseUrl = API_URL;
    this.initData = window.Telegram?.WebApp?.initData || '';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.initData && { 'X-Telegram-Init-Data': this.initData }),
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export const api = new ApiClient();
```

2. Guardá el archivo

**PASO 15: Verificar que initData se envía correctamente**

1. Abrí tu Mini-App en Telegram
2. Abrí las DevTools del navegador (F12)
3. Andá a la pestaña "Network"
4. Hacé cualquier acción (ej: ver catálogo)
5. Verificá que el request tenga el header:

```
X-Telegram-Init-Data: user=%7B%22id%22%3A123...%7D&auth_date=...
```

Verificación: El header está presente en cada request

---

### PARTE E: Testing en Telegram

**PASO 16: Usar @testbot para testing**

1. En Telegram, buscá `@testbot`
2. Abrilo y escribí `/start`
3. Elegí "Create a new bot"
4. Seguí las instrucciones para crear un bot de test
5. Este bot te permite probar sin afectar tu bot principal

Verificación: Tenés un bot de test funcionando

**PASO 17: Activar debug mode en la Mini-App**

1. En tu Mini-App, agregá esto al inicio de tu app:

```typescript
// apps/mini-app/src/main.tsx
import { initMiniApp } from '@twa-dev/sdk';

// Inicializar con debug mode en desarrollo
if (import.meta.env.DEV) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
  
  // Log initData para debugging
  console.log('initData:', window.Telegram.WebApp.initData);
  console.log('initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe);
  console.log('user:', window.Telegram.WebApp.initDataUnsafe?.user);
}
```

2. Guardá el archivo

**PASO 18: Probar el flujo completo**

1. Abrí tu bot en Telegram
2. Tocá "Start" o escribí `/start`
3. Tocá el botón "Abrir Vendy"
4. Verificá que la Mini-App se abra sin errores
5. Hacé una acción (ej: ver productos)
6. Verificá en los logs de la API que initData se recibió:

```bash
# En la Dell
docker compose logs -f api | grep "initData"
```

Verificación: Los logs muestran requests con initData válido

---

## TICKET 6: CHECKLIST DE VERIFICACIÓN

- [ ] Tokens de bots obtenidos de @BotFather
- [ ] Descripción y about configurados en @BotFather
- [ ] Comandos `/start`, `/help`, etc. configurados
- [ ] Menú button ("Abrir App") configurado
- [ ] Dominio de Mini-App permitido en BotFather
- [ ] Webhook endpoint creado en la API
- [ ] Webhook secret configurado
- [ ] Webhook seteado en Telegram (`/webhook/set`)
- [ ] Comandos del bot funcionando (`/start`, `/help`)
- [ ] initData validation implementado en la API
- [ ] Middleware de autenticación aplicado a rutas protegidas
- [ ] Tests de initData pasando
- [ ] Mini-App envía initData en cada request
- [ ] Flujo completo probado (bot → Mini-App → API)

---

## SPRINT 11: CHECKLIST FINAL ACTUALIZADO

### Ticket 1: Servidor + GitHub + Cloudflare
- [ ] Ubuntu Server instalado en la Dell
- [ ] Docker funcionando en la Dell
- [ ] GitHub repo creado y código subido
- [ ] Cloudflare configurado con DNS
- [ ] DuckDNS configurado para IP dinámica
- [ ] UFW activado
- [ ] Port forwarding configurado en el router

### Ticket 2: Docker + Traefik
- [ ] 4 Dockerfiles creados y funcionando
- [ ] `docker-compose.yml` con Traefik
- [ ] `.env` configurado
- [ ] Servicios levantados en la Dell
- [ ] API responde en localhost:3001
- [ ] Mini-App responde en localhost:80
- [ ] Traefik dashboard accesible

### Ticket 3: GitHub Actions + Auto-Deploy
- [ ] CI workflow creado
- [ ] CD workflow creado para self-hosted
- [ ] Secrets configurados en GitHub
- [ ] Script `~/deploy.sh` en la Dell

### Ticket 4: Scripts + Backup
- [ ] Scripts de deploy, backup, restore, health, logs creados
- [ ] Backup automático configurado con cron
- [ ] Scripts probados y funcionando

### Ticket 5: Documentación
- [ ] Documentación de infraestructura self-hosted
- [ ] Guía de migración a la nube
- [ ] Documentación de Cloudflare

### Ticket 6: Telegram Production (NUEVO)
- [ ] Tokens de bots configurados
- [ ] @BotFather configurado (descripción, comandos, menú, dominio)
- [ ] Webhooks funcionando en producción
- [ ] initData validation implementado
- [ ] Mini-App envía initData correctamente
- [ ] Flujo completo bot → Mini-App → API probado
