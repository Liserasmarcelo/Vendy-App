# Deployment Guide

## Requisitos

- Cuenta en Railway (API)
- Cuenta en Vercel (Mini App)
- Cuenta en GitHub (CI/CD)
- Docker (opcional)

## Variables de entorno

### Producción

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
PARENT_BOT_TOKEN=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
WEBHOOK_URL=https://api.vendy.app
SENTRY_DSN=...
```

## Deploy manual

### API

```bash
# Build
docker build -t vendy-api -f infra/docker/Dockerfile.api .

# Push
railway up --service vendy-api
```

### Mini App

```bash
# Build
pnpm --filter @vendy/mini-app build

# Deploy
vercel --prod
```

### Bots

```bash
# Build
docker build -t vendy-bot-parent -f infra/docker/Dockerfile.bot-parent .
docker build -t vendy-bot-child -f infra/docker/Dockerfile.bot-child .

# Deploy
railway up --service vendy-bot-parent
railway up --service vendy-bot-child
```

## CI/CD Automático

El proyecto incluye GitHub Actions para deploy automático:

- **CI**: Lint + Test + Build en cada PR
- **Deploy API**: Automático en push a main (apps/api)
- **Deploy Mini App**: Automático en push a main (apps/mini-app)

## Rollback

```bash
# Rollback completo
./scripts/rollback.sh production

# Rollback servicio específico
./scripts/rollback.sh production api
```

## Monitoreo

- Health checks: `/health`, `/health/live`, `/health/ready`
- Métricas: `/metrics` (Prometheus)
- Logs: Railway dashboard
- Alertas: Configurar Slack webhook en `SLACK_WEBHOOK_URL`

## Troubleshooting

### API no responde

```bash
# Verificar health
curl https://api.vendy.app/health/live

# Verificar logs
railway logs --service vendy-api
```

### Database connection failed

1. Verificar `DATABASE_URL`
2. Verificar que PostgreSQL esté running
3. Verificar network policies

### Bot no responde

1. Verificar `PARENT_BOT_TOKEN` / `BOT_TOKEN`
2. Verificar webhook URL
3. Verificar logs: `railway logs --service vendy-bot-parent`
