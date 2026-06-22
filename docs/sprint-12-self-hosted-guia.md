# SPRINT 12: Monitoreo, Alertas y Métricas (Self-Hosted)

> **Guía paso a paso para monitorear tu infraestructura local y recibir alertas**
> **Optimizado para migración a la nube sin fricciones**
>
> **Regla:** Seguí cada paso exactamente como está escrito. No saltear ninguno.

---

## ANTES DE EMPEZAR

### Requisitos Previos

| Requisito | Verificación | Si no lo tenés...
|-----------|-------------|-------------------|
| Sprint 11 completado | `docker compose ps` en la Dell muestra servicios | Completá el Sprint 11 primero |
| Grafana | `https://grafana.com/` | Vamos a instalarlo |
| UptimeRobot | `https://uptimerobot.com/` | Creá cuenta gratis |
| Telegram Bot para alertas | @BotFather | Creá un bot |

---

## TICKET 1: Grafana + Prometheus (Monitoreo Local)

**Tiempo estimado:** 60-90 minutos
**Dificultad:** Media-Alta
**Resultado:** Dashboards en tiempo real de tu servidor, base de datos, API y bots

---

### PARTE A: Instalar Prometheus + Grafana en Docker

**PASO 1: Agregar Prometheus y Grafana al docker-compose.yml**

1. En tu Mac, abrí el proyecto
2. Editá `docker-compose.yml` en la raíz
3. Agregá estos servicios al final (antes de `volumes:`):

```yaml
  # ==========================================
  # PROMETHEUS - Métricas
  # ==========================================
  prometheus:
    image: prom/prometheus:latest
    container_name: vendy-prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - vendy-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.prometheus.rule=Host(`prometheus.vendy.app`)"
      - "traefik.http.routers.prometheus.entrypoints=websecure"
      - "traefik.http.routers.prometheus.tls.certresolver=letsencrypt"
      - "traefik.http.services.prometheus.loadbalancer.server.port=9090"

  # ==========================================
  # GRAFANA - Dashboards
  # ==========================================
  grafana:
    image: grafana/grafana:latest
    container_name: vendy-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - vendy-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`grafana.vendy.app`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"
      - "traefik.http.routers.grafana.tls.certresolver=letsencrypt"
      - "traefik.http.services.grafana.loadbalancer.server.port=3000"
```

4. Agregá los volumes nuevos:

```yaml
volumes:
  postgres_data:
  redis_data:
  letsencrypt:
  prometheus_data:
  grafana_data:
```

5. Guardá el archivo

**PASO 2: Crear configuración de Prometheus**

1. En tu Mac, creá el directorio:

```bash
mkdir -p monitoring
```

2. Creá `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'api'
    static_configs:
      - targets: ['api:3001']
    metrics_path: /metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
```

3. Guardá el archivo

**PASO 3: Crear datasources de Grafana**

1. Creá el directorio:

```bash
mkdir -p monitoring/grafana/datasources
```

2. Creá `monitoring/grafana/datasources/datasources.yml`:

```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

3. Guardá el archivo

**PASO 4: Crear dashboards de Grafana**

1. Creá el directorio:

```bash
mkdir -p monitoring/grafana/dashboards
```

2. Creá `monitoring/grafana/dashboards/dashboards.yml`:

```yaml
apiVersion: 1
providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /etc/grafana/provisioning/dashboards
```

3. Descargá dashboards pre-configurados:

```bash
# Dashboard de Node Exporter (servidor)
curl -L https://raw.githubusercontent.com/rfmoz/grafana-dashboards/master/prometheus/node-exporter-full.json -o monitoring/grafana/dashboards/node-exporter.json

# Dashboard de PostgreSQL
curl -L https://raw.githubusercontent.com/prometheus-community/postgres_exporter/master/postgres_mixin/dashboards/postgres-overview.json -o monitoring/grafana/dashboards/postgres.json

# Dashboard de Redis
curl -L https://raw.githubusercontent.com/oliver006/redis_exporter/master/contrib/redis-mixin/dashboards/redis-overview.json -o monitoring/grafana/dashboards/redis.json
```

4. Guardá todo

**PASO 5: Agregar exporters al docker-compose**

1. Editá `docker-compose.yml` y agregá estos servicios:

```yaml
  # ==========================================
  # NODE EXPORTER - Métricas del servidor
  # ==========================================
  node-exporter:
    image: prom/node-exporter:latest
    container_name: vendy-node-exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - vendy-public

  # ==========================================
  # POSTGRES EXPORTER - Métricas de PostgreSQL
  # ==========================================
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: vendy-postgres-exporter
    restart: unless-stopped
    environment:
      DATA_SOURCE_NAME: postgresql://postgres:postgres@vendy-postgres:5432/vendy?sslmode=disable
    networks:
      - vendy-public
    depends_on:
      - postgres

  # ==========================================
  # REDIS EXPORTER - Métricas de Redis
  # ==========================================
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: vendy-redis-exporter
    restart: unless-stopped
    environment:
      REDIS_ADDR: redis://vendy-redis:6379
      REDIS_PASSWORD: redis
    networks:
      - vendy-public
    depends_on:
      - redis
```

2. Guardá el archivo

---

### PARTE B: Exponer métricas desde la API

**PASO 6: Instalar métricas en Fastify**

1. En tu Mac, andá a `apps/api/`
2. Instalá el plugin de métricas:

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy/apps/api
pnpm add fastify-metrics prom-client
```

3. Editá `apps/api/src/index.ts` (o el archivo principal de la API) y agregá:

```typescript
import fastifyMetrics from 'fastify-metrics';

// Después de crear la instancia de Fastify
app.register(fastifyMetrics, {
  endpoint: '/metrics',
});
```

4. Guardá el archivo

**PASO 7: Commitear y subir**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add .
git commit -m "feat: add Prometheus metrics to API"
git push origin develop
```

---

### PARTE C: Levantar monitoreo

**PASO 8: Actualizar la Dell**

1. En la Dell:

```bash
cd ~/vendy
git pull origin develop
```

2. Recrear los containers:

```bash
docker compose down
docker compose up -d
```

3. Verificá que todo esté corriendo:

```bash
docker compose ps
```

Verificación: Ves `prometheus`, `grafana`, `node-exporter`, `postgres-exporter`, `redis-exporter` como "Up"

**PASO 9: Acceder a Grafana**

1. Abrí tu navegador en tu Mac
2. Andá a `https://grafana.vendy.app`
3. Logueate con:
   - Username: `admin`
   - Password: `admin123`

Verificación: Ves el dashboard de Grafana

**PASO 10: Configurar dashboards**

1. En Grafana, andá a "Dashboards" → "Browse"
2. Deberías ver dashboards de:
   - Node Exporter (servidor)
   - PostgreSQL
   - Redis
3. Hacé click en cada uno para ver las métricas

Verificación: Los dashboards muestran datos en tiempo real

---

## TICKET 1: CHECKLIST DE VERIFICACIÓN

- [ ] Prometheus agregado al docker-compose.yml
- [ ] Grafana agregado al docker-compose.yml
- [ ] Exporters (node, postgres, redis) agregados
- [ ] `monitoring/prometheus.yml` creado
- [ ] Datasources de Grafana configurados
- [ ] Dashboards descargados
- [ ] Métricas agregadas a la API (fastify-metrics)
- [ ] Servicios levantados en la Dell
- [ ] Grafana accesible en `https://grafana.vendy.app`
- [ ] Dashboards muestran datos

---

---

## TICKET 2: Alertas (UptimeRobot + Telegram)

**Tiempo estimado:** 30-45 minutos
**Dificultad:** Baja
**Resultado:** Recibís alertas en Telegram si algo se cae

---

### PARTE A: Configurar UptimeRobot

**PASO 1: Crear cuenta en UptimeRobot**

1. En tu Mac, andá a https://uptimerobot.com/
2. Hacé click en "Sign Up" (plan gratuito)
3. Verificá tu email

Verificación: Estás en el dashboard de UptimeRobot

**PASO 2: Crear monitores**

1. En UptimeRobot, hacé click en "Add New Monitor"
2. Configurá estos monitores:

| Monitor | Type | URL | Interval |
|---------|------|-----|----------|
| API Health | HTTP(s) | `https://api.vendy.app/health` | 5 min |
| Mini-App | HTTP(s) | `https://app.vendy.app` | 5 min |
| Grafana | HTTP(s) | `https://grafana.vendy.app` | 5 min |

3. Para cada monitor:
   - En "Alert Contact", seleccioná "Email" (tu email)
   - Hacé click en "Create Monitor"

Verificación: Los 3 monitores aparecen en la lista con status "Up"

---

### PARTE B: Configurar alertas por Telegram

**PASO 3: Crear bot de alertas**

1. En Telegram, buscá @BotFather
2. Escribí `/newbot`
3. Elegí un nombre: `Vendy Alerts`
4. Elegí un username: `vendy_alerts_bot`
5. BotFather te da un token. **Anotalo**

Verificación: Tenés un bot llamado `@vendy_alerts_bot`

**PASO 4: Obtener tu chat ID**

1. Buscá tu bot en Telegram y hacé `/start`
2. Abrí tu navegador y andá a:

```
https://api.telegram.org/botTU_TOKEN/getUpdates
```

> Reemplazá `TU_TOKEN` con el token que anotaste

3. Buscá el campo `"chat":{"id":12345678` — ese número es tu chat ID
4. **Anotalo**

Verificación: Tenés el chat ID (número largo)

**PASO 5: Configurar UptimeRobot para Telegram**

1. En UptimeRobot, andá a "My Settings" → "Alert Contacts"
2. Hacé click en "Add Alert Contact"
3. En "Alert Contact Type", seleccioná "Telegram"
4. En "Telegram Chat ID", pegá tu chat ID
5. En "Friendly Name", escribí: `Vendy Telegram`
6. Hacé click en "Save Changes"

Verificación: El contacto aparece en la lista

**PASO 6: Agregar Telegram a los monitores**

1. En UptimeRobot, andá a "Dashboard"
2. Hacé click en el lapiz (editar) de cada monitor
3. En "Alert Contact", marcá "Vendy Telegram"
4. Hacé click en "Save Changes"

Verificación: Cada monitor tiene el contacto de Telegram marcado

---

### PARTE C: Crear script de alertas locales

**PASO 7: Crear script de alertas en la Dell**

1. En la Dell, creá `~/alert.sh`:

```bash
#!/bin/bash
# ==========================================
# ALERT SCRIPT - Local checks
# ==========================================

TELEGRAM_BOT_TOKEN="TU_TOKEN"
TELEGRAM_CHAT_ID="TU_CHAT_ID"
API_URL="http://localhost:3001/health"

send_telegram() {
    local message="$1"
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d "chat_id=$TELEGRAM_CHAT_ID" \
        -d "text=$message" \
        -d "parse_mode=HTML"
}

# Check API
if ! curl -f -s "$API_URL" > /dev/null; then
    send_telegram "🚨 <b>ALERTA</b>\n\nLa API de Vendy no responde.\n\nHora: $(date)"
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    send_telegram "⚠️ <b>ALERTA</b>\n\nDisco casi lleno: ${DISK_USAGE}%\n\nHora: $(date)"
fi

# Check memory
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    send_telegram "⚠️ <b>ALERTA</b>\n\nRAM casi llena: ${MEMORY_USAGE}%\n\nHora: $(date)"
fi
```

> Reemplazá `TU_TOKEN` y `TU_CHAT_ID` con tus valores reales

2. Hacelo ejecutable:

```bash
chmod +x ~/alert.sh
```

**PASO 8: Configurar cron para alertas cada 5 minutos**

```bash
crontab -e
```

Agregá esta línea:

```
*/5 * * * * ~/alert.sh >/dev/null 2>&1
```

Guardá y salí.

---

## TICKET 2: CHECKLIST DE VERIFICACIÓN

- [ ] UptimeRobot cuenta creada
- [ ] 3 monitores configurados (API, Mini-App, Grafana)
- [ ] Bot de Telegram creado
- [ ] Chat ID obtenido
- [ ] Telegram configurado en UptimeRobot
- [ ] Script `~/alert.sh` creado en la Dell
- [ ] Cron configurado para alertas cada 5 minutos

---

---

## TICKET 3: Métricas de Negocio (Analytics)

**Tiempo estimado:** 45-60 minutos
**Dificultad:** Media
**Resultado:** Dashboards de negocio: ventas, usuarios, conversiones

---

### PARTE A: Crear tablas de analytics

**PASO 1: Crear migración de analytics**

1. En tu Mac, andá a `apps/api/prisma/`
2. Editá `schema.prisma` y agregá al final:

```prisma
model AnalyticsEvent {
  id          BigInt   @id @default(autoincrement())
  shopId      Int      @map("shop_id")
  eventType   String   @map("event_type") @db.VarChar(100)
  userId      String?  @map("user_id") @db.VarChar(50)
  properties  Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([shopId, eventType])
  @@index([createdAt])
  @@map("analytics_events")
}

model DailyMetrics {
  id            Int      @id @default(autoincrement())
  shopId        Int      @map("shop_id")
  date          DateTime @db.Date
  orders        Int      @default(0)
  revenue       Decimal  @default(0) @db.Decimal(10, 2)
  customers     Int      @default(0)
  visitors      Int      @default(0)
  conversionRate Decimal @default(0) @db.Decimal(5, 4)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@unique([shopId, date])
  @@index([shopId, date])
  @@map("daily_metrics")
}
```

3. Guardá el archivo

**PASO 2: Crear migración**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy/apps/api
npx prisma migrate dev --name add_analytics
```

Verificación: Migración creada exitosamente

---

### PARTE B: Crear endpoints de analytics

**PASO 3: Crear controller de analytics**

1. Creá `apps/api/src/routes/analytics.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function analyticsRoutes(app: FastifyInstance) {
  // Track event
  app.post('/analytics/track', async (request, reply) => {
    const { shopId, eventType, userId, properties } = request.body as any;

    await prisma.analyticsEvent.create({
      data: {
        shopId,
        eventType,
        userId,
        properties: properties || {},
      },
    });

    return { success: true };
  });

  // Get dashboard metrics
  app.get('/analytics/dashboard/:shopId', async (request, reply) => {
    const { shopId } = request.params as any;
    const { days = 30 } = request.query as any;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [orders, revenue, customers, events] = await Promise.all([
      prisma.order.count({
        where: {
          shopId: parseInt(shopId),
          createdAt: { gte: startDate },
        },
      }),
      prisma.order.aggregate({
        where: {
          shopId: parseInt(shopId),
          createdAt: { gte: startDate },
        },
        _sum: { total: true },
      }),
      prisma.customer.count({
        where: {
          shopId: parseInt(shopId),
          createdAt: { gte: startDate },
        },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: {
          shopId: parseInt(shopId),
          createdAt: { gte: startDate },
        },
        _count: { eventType: true },
      }),
    ]);

    return {
      orders,
      revenue: revenue._sum.total || 0,
      customers,
      events: events.map(e => ({
        type: e.eventType,
        count: e._count.eventType,
      })),
    };
  });
}
```

2. Guardá el archivo

**PASO 4: Registrar la ruta**

1. Editá `apps/api/src/index.ts` (o donde registres rutas)
2. Agregá:

```typescript
import analyticsRoutes from './routes/analytics';

// ...
app.register(analyticsRoutes, { prefix: '/api' });
```

3. Guardá el archivo

**PASO 5: Commitear y subir**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add .
git commit -m "feat: add analytics tracking and dashboard endpoints"
git push origin develop
```

---

### PARTE C: Actualizar la Dell

**PASO 6: Pull y rebuild**

```bash
# En la Dell
cd ~/vendy
git pull origin develop
docker compose up -d --build
```

Verificación: API levantada con nuevos endpoints

---

## TICKET 3: CHECKLIST DE VERIFICACIÓN

- [ ] Tablas `AnalyticsEvent` y `DailyMetrics` creadas en Prisma
- [ ] Migración aplicada
- [ ] Endpoints de analytics creados
- [ ] Ruta registrada en la API
- [ ] Código commiteado y subido
- [ ] API rebuildada en la Dell

---

---

## TICKET 4: Documentación de Monitoreo

**Tiempo estimado:** 20-30 minutos
**Dificultad:** Baja
**Resultado:** Documentación completa del sistema de monitoreo

---

### PARTE A: Crear documentación

**PASO 1: Crear `docs/monitoring/README.md`**

```markdown
# Monitoreo de Vendy

## Sistema de Monitoreo

### Componentes

| Componente | Tecnología | URL | Propósito |
|------------|-----------|-----|-----------|
| Prometheus | prometheus/prometheus | https://prometheus.vendy.app | Recolecta métricas |
| Grafana | grafana/grafana | https://grafana.vendy.app | Dashboards visuales |
| UptimeRobot | UptimeRobot | https://uptimerobot.com | Alertas externas |
| Telegram Bot | @vendy_alerts_bot | Telegram | Notificaciones |

### Métricas Disponibles

#### Sistema (Node Exporter)
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- System load

#### Base de Datos (PostgreSQL Exporter)
- Queries per second
- Active connections
- Cache hit ratio
- Table sizes
- Index usage

#### Caché (Redis Exporter)
- Memory usage
- Hit/miss ratio
- Connected clients
- Commands per second

#### Aplicación (Fastify Metrics)
- Request duration
- Request rate
- Error rate
- Active connections

### Dashboards de Grafana

1. **Node Exporter Full** - Métricas del servidor
2. **PostgreSQL Overview** - Métricas de la base de datos
3. **Redis Overview** - Métricas de Redis
4. **Vendy Business** - Métricas de negocio (custom)

### Alertas Configuradas

| Condición | Severidad | Notificación |
|-----------|-----------|-------------|
| API no responde | CRITICAL | Telegram + Email |
| Mini-App no responde | CRITICAL | Telegram + Email |
| Grafana no responde | WARNING | Email |
| Disco > 90% | WARNING | Telegram |
| RAM > 90% | WARNING | Telegram |
| CPU > 90% | WARNING | Telegram |

### Comandos Útiles

```bash
# Ver logs de monitoreo
docker compose logs -f prometheus
docker compose logs -f grafana

# Recargar configuración de Prometheus
curl -X POST http://localhost:9090/-/reload

# Ver métricas de la API
curl http://localhost:3001/metrics
```
```

2. Guardá el archivo

**PASO 2: Subir a GitHub**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add docs/monitoring/
git commit -m "docs: add monitoring documentation"
git push origin develop
```

---

## TICKET 4: CHECKLIST DE VERIFICACIÓN

- [ ] `docs/monitoring/README.md` creado
- [ ] Documentación commiteada y subida

---

---

## SPRINT 12: CHECKLIST FINAL

- [ ] Prometheus funcionando en `https://prometheus.vendy.app`
- [ ] Grafana funcionando en `https://grafana.vendy.app`
- [ ] Exporters recolectando métricas
- [ ] API exponiendo métricas en `/metrics`
- [ ] Dashboards de Grafana configurados
- [ ] UptimeRobot monitoreando 3 URLs
- [ ] Alertas por Telegram configuradas
- [ ] Script de alertas locales en la Dell
- [ ] Tablas de analytics creadas
- [ ] Endpoints de analytics funcionando
- [ ] Documentación de monitoreo creada

---

## COSTOS ADICIONALES DEL SPRINT 12

| Servicio | Costo | Notas |
|----------|-------|-------|
| UptimeRobot | $0 | Plan gratuito (50 monitores) |
| Telegram Bot | $0 | Gratis |
| Prometheus/Grafana | $0 | Open source, corre en tu servidor |
| **Total adicional** | **$0** | |

---

## PRÓXIMOS PASOS

Una vez completado el Sprint 12, tendrás:
- Monitoreo completo de tu infraestructura
- Alertas en tiempo real
- Métricas de negocio

**Siguiente:** Sprint 13 - Documentación de usuario, onboarding y go-live.

---

---

## TICKET 4: Métricas de Bots de Telegram (NUEVO)

**Tiempo estimado:** 30-45 minutos
**Dificultad:** Media
**Resultado:** Monitoreo de mensajes, usuarios y performance de los bots

---

### PARTE A: Agregar métricas de bots a Prometheus

**PASO 1: Crear métricas de bots**

1. En tu Mac, editá `apps/api/src/lib/metrics.ts` y agregá:

```typescript
// Métricas de bots de Telegram
export const telegramMessagesTotal = new client.Counter({
  name: 'vendy_telegram_messages_total',
  help: 'Total Telegram messages received',
  labelNames: ['bot_type', 'command'],
});

export const telegramUsersActive = new client.Gauge({
  name: 'vendy_telegram_users_active',
  help: 'Active Telegram users',
  labelNames: ['bot_type'],
});

export const telegramWebhookLatency = new client.Histogram({
  name: 'vendy_telegram_webhook_latency_seconds',
  help: 'Webhook processing latency',
  labelNames: ['bot_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const telegramErrorsTotal = new client.Counter({
  name: 'vendy_telegram_errors_total',
  help: 'Total Telegram bot errors',
  labelNames: ['bot_type', 'error_type'],
});

// Registrar
register.registerMetric(telegramMessagesTotal);
register.registerMetric(telegramUsersActive);
register.registerMetric(telegramWebhookLatency);
register.registerMetric(telegramErrorsTotal);
```

2. Guardá el archivo

**PASO 2: Instrumentar el bot padre**

1. Editá `apps/api/src/services/bot.ts`:

```typescript
import { telegramMessagesTotal, telegramUsersActive, telegramWebhookLatency, telegramErrorsTotal } from '../lib/metrics';

// Al inicio de cada comando
bot.start((ctx) => {
  const startTime = Date.now();
  
  // Incrementar contador de mensajes
  telegramMessagesTotal.inc({ bot_type: 'parent', command: 'start' });
  
  // Trackear usuario activo
  telegramUsersActive.set({ bot_type: 'parent' }, ctx.from?.id || 0);
  
  try {
    // ... lógica existente ...
    
    // Registrar latencia
    const latency = (Date.now() - startTime) / 1000;
    telegramWebhookLatency.observe({ bot_type: 'parent' }, latency);
  } catch (error) {
    telegramErrorsTotal.inc({ bot_type: 'parent', error_type: 'command_failed' });
    throw error;
  }
});
```

2. Guardá el archivo

**PASO 3: Crear dashboard de bots en Grafana**

1. Abrí Grafana en `https://grafana.vendy.app`
2. Andá a "Dashboards" → "New" → "New Dashboard"
3. Hacé click en "Add visualization"
4. En "Query", seleccioná "Prometheus"
5. Agregá estas queries:

```promql
# Mensajes por minuto
rate(vendy_telegram_messages_total[5m])

# Usuarios activos
vendy_telegram_users_active

# Latencia promedio de webhooks
histogram_quantile(0.95, rate(vendy_telegram_webhook_latency_seconds_bucket[5m]))

# Errores por minuto
rate(vendy_telegram_errors_total[5m])
```

6. Guardá el dashboard como "Telegram Bots"

Verificación: El dashboard muestra métricas de bots en tiempo real

---

## TICKET 4: CHECKLIST DE VERIFICACIÓN

- [ ] Métricas de bots creadas (mensajes, usuarios, latencia, errores)
- [ ] Bot padre instrumentado con métricas
- [ ] Dashboard de bots creado en Grafana
- [ ] Queries de Prometheus funcionando

---

---

## SPRINT 12: CHECKLIST FINAL ACTUALIZADO

- [ ] Prometheus funcionando en `https://prometheus.vendy.app`
- [ ] Grafana funcionando en `https://grafana.vendy.app`
- [ ] Exporters recolectando métricas
- [ ] API exponiendo métricas en `/metrics`
- [ ] Dashboards de Grafana configurados
- [ ] Métricas de bots de Telegram en Grafana (NUEVO)
- [ ] UptimeRobot monitoreando 3 URLs
- [ ] Alertas por Telegram configuradas
- [ ] Script de alertas locales en la Dell
- [ ] Tablas de analytics creadas
- [ ] Endpoints de analytics funcionando
- [ ] Documentación de monitoreo creada

---

## COSTOS ADICIONALES DEL SPRINT 12

| Servicio | Costo | Notas |
|----------|-------|-------|
| UptimeRobot | $0 | Plan gratuito (50 monitores) |
| Telegram Bot | $0 | Gratis |
| Prometheus/Grafana | $0 | Open source, corre en tu servidor |
| **Total adicional** | **$0** | |

---

## PRÓXIMOS PASOS

Una vez completado el Sprint 12, tendrás:
- Monitoreo completo de tu infraestructura
- Métricas de bots de Telegram
- Alertas en tiempo real
- Métricas de negocio

**Siguiente:** Sprint 13 - Documentación de usuario, onboarding y go-live.
