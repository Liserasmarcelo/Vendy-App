# Sprints 10-13: Documentación, Despliegue y Operaciones

> **Fecha:** Junio 2026
> **Proyecto:** Vendy — Store-as-a-Service para Telegram
> **Sprints anteriores:** 0-9 completados (52/52 tickets)
> **Sprints siguientes:** 10-13 (documentación, despliegue, operaciones)

---

## Visión General

Tras completar el desarrollo funcional del MVP (Sprints 0-9), los Sprints 10-13 se enfocan en:

1. **Documentación exhaustiva** (técnica + usuario + API + arquitectura)
2. **Configuración de despliegue** (CI/CD, Docker, infraestructura cloud)
3. **Operaciones y monitoreo** (logs, métricas, alertas, backups)
4. **Go-live y post-launch** (checklist de lanzamiento, rollback, soporte)

---

## Sprint 10: Documentación Técnica y API

### Objetivo
Crear documentación completa para desarrolladores, DevOps y contribuidores.

### TICKET 1: README raíz + guía de instalación local

**Backend:**
- `README.md` raíz del monorepo (actualizar el existente)
- Guía paso a paso de instalación local
- Requisitos del sistema (Node.js, pnpm, Docker)
- Configuración de variables de entorno
- Scripts disponibles (`pnpm dev`, `pnpm build`, `pnpm test`)
- Estructura de directorios explicada
- Troubleshooting de instalación común

**Mini-App:**
- Guía de desarrollo local
- Cómo correr el mini-app contra backend local
- Configuración de ngrok para webhooks de Telegram

**Tests:**
- Verificar que las instrucciones funcionan en un entorno limpio

---

### TICKET 2: Documentación de API (OpenAPI/Swagger)

**Backend:**
- Generar especificación OpenAPI 3.0 de todos los endpoints
- Documentar schemas de request/response
- Documentar códigos de error y mensajes
- Tags por dominio: Auth, Shop, Product, Order, Payment, Support, Help, Notifications
- Ejemplos de requests con curl
- Autenticación: Bearer token + initData

**Herramientas:**
- `@fastify/swagger` para generación automática
- `@fastify/swagger-ui` para UI interactiva
- Exportar a `docs/api/openapi.json`

**Tests:**
- Validar que la spec es válida OpenAPI 3.0
- Verificar que todos los endpoints están documentados

---

### TICKET 3: Documentación de arquitectura

**Backend:**
- `docs/architecture/README.md`
- Diagrama de arquitectura (C4 Model: Context, Container, Component)
- Flujo de datos: Bot → API → DB → Webhooks
- Decisiones de arquitectura (ADR - Architecture Decision Records)
  - Por qué Fastify vs Express
  - Por qué Prisma vs Drizzle
  - Por qué grammy vs telegraf
  - Por qué PostgreSQL vs MongoDB
  - Por qué Railway vs AWS
- Diagrama de base de datos (ERD)
- Diagrama de flujo de autenticación
- Diagrama de flujo de pagos

**Herramientas:**
- Mermaid diagrams en markdown
- PlantUML opcional

**Tests:**
- Validar que los diagramas renderizan correctamente

---

### TICKET 4: Guía de contribución + código de conducta

**Backend:**
- `CONTRIBUTING.md`
  - Cómo reportar bugs
  - Cómo proponer features
  - Cómo hacer PRs (branch naming, commits, reviews)
  - Estándares de código (ESLint, Prettier)
  - Convenciones de commits (Conventional Commits)
- `CODE_OF_CONDUCT.md`
- `LICENSE` (MIT o similar)
- `SECURITY.md` (cómo reportar vulnerabilidades)

**Mini-App:**
- Guía de estilo de componentes
- Convenciones de naming (PascalCase componentes, camelCase hooks)

**Tests:**
- Verificar que los templates de PR/issue funcionan

---

### TICKET 5: Documentación de base de datos

**Backend:**
- `docs/database/README.md`
- Schema completo documentado
- Relaciones entre tablas
- Índices y optimizaciones
- Migraciones: cómo crear y aplicar
- Seed data para desarrollo
- Diagrama ERD (auto-generado de Prisma)

**Herramientas:**
- `prisma generate` para ERD
- `prisma db seed` para datos de desarrollo

**Tests:**
- Verificar que el ERD se genera correctamente
- Validar que seed data funciona

---

## Sprint 11: Configuración de Despliegue (CI/CD + Infra)

### Objetivo
Configurar pipelines de CI/CD, contenedores Docker y despliegue en cloud.

### TICKET 1: GitHub Actions CI/CD completo

**Backend:**
- `.github/workflows/ci.yml` (actualizar el existente)
  - Lint (ESLint + Prettier)
  - Type checking (tsc --noEmit)
  - Tests unitarios (vitest)
  - Tests de integración
  - Build verification
  - Coverage reporting (Codecov o similar)
- `.github/workflows/cd-staging.yml`
  - Deploy automático a staging en push a `develop`
  - Database migrations en staging
  - Health check post-deploy
- `.github/workflows/cd-production.yml`
  - Deploy manual (workflow_dispatch) a producción
  - Database migrations con backup previo
  - Smoke tests post-deploy
  - Rollback automático si health check falla

**Mini-App:**
- `.github/workflows/deploy-miniapp.yml`
  - Build y deploy a Vercel
  - Preview deployments en PRs

**Tests:**
- Verificar que los workflows se ejecutan correctamente
- Validar que los checks fallan cuando hay errores

---

### TICKET 2: Dockerización completa

**Backend:**
- `Dockerfile.api` (actualizar el existente)
  - Multi-stage build optimizado
  - Layer caching para dependencias
  - Health check
  - Non-root user
- `Dockerfile.bot-parent`
- `Dockerfile.bot-child`
- `Dockerfile.mini-app` (nginx static)
- `docker-compose.yml` (actualizar el existente)
  - PostgreSQL + Redis + API + Bots + Mini-App
  - Volumes para persistencia
  - Networks internas
  - Environment variables
- `docker-compose.prod.yml`
  - Optimizado para producción
  - Reverse proxy (Traefik o nginx)
  - SSL/TLS automático (Let's Encrypt)
  - Rate limiting

**Tests:**
- `docker build` exitoso para todos los servicios
- `docker-compose up` levanta todo el stack
- Health checks pasan

---

### TICKET 3: Configuración de infraestructura cloud

**Backend:**
- `infra/terraform/` (opcional, para AWS/GCP)
- `infra/railway/` configuración
  - Variables de entorno por servicio
  - Scaling rules
  - Health checks
  - Custom domains
- `infra/vercel/` configuración
  - `vercel.json` con rewrites, headers, redirects
  - Environment variables
  - Preview deployments

**Documentación:**
- `docs/deployment/railway.md`
- `docs/deployment/vercel.md`
- `docs/deployment/environment-variables.md`

**Tests:**
- Verificar que las configs son válidas
- Validar que las variables de entorno están documentadas

---

### TICKET 4: Scripts de despliegue y utilidades

**Backend:**
- `scripts/deploy.sh` — Deploy manual con verificaciones
- `scripts/rollback.sh` — Rollback a versión anterior
- `scripts/backup-db.sh` — Backup de PostgreSQL
- `scripts/restore-db.sh` — Restore desde backup
- `scripts/migrate.sh` — Ejecutar migraciones con verificación
- `scripts/health-check.sh` — Verificar salud del sistema
- `scripts/setup-local.sh` — Setup de desarrollo local

**Mini-App:**
- `scripts/build-and-deploy.sh`

**Tests:**
- Verificar que los scripts son ejecutables
- Validar que los scripts funcionan en entorno de prueba

---

### TICKET 5: Configuración de dominios y SSL

**Backend:**
- Configuración de dominios custom
- SSL/TLS con Let's Encrypt
- CDN (Cloudflare) para assets estáticos
- DNS records necesarios
- Subdominios: `api.vendy.app`, `app.vendy.app`, `bot.vendy.app`

**Documentación:**
- `docs/deployment/domains.md`
- `docs/deployment/ssl.md`

**Tests:**
- Verificar que SSL funciona
- Validar que los dominios resuelven correctamente

---

## Sprint 12: Operaciones, Monitoreo y Mantenimiento

### Objetivo
Configurar monitoreo, logging, alertas y procedimientos operativos.

### TICKET 1: Logging estructurado y centralizado

**Backend:**
- Configurar `pino` (ya en Fastify) con formato JSON
- Correlation IDs para trazabilidad de requests
- Log levels configurables por entorno
- Sanitización de datos sensibles (PII, tokens)
- Rotación de logs en producción
- Integración con servicio de logs (Datadog, Logtail, o self-hosted)

**Mini-App:**
- Error tracking con Sentry
- Performance monitoring
- User session tracking (anonymized)

**Documentación:**
- `docs/operations/logging.md`
- Cómo leer logs
- Cómo buscar errores
- Cómo correlacionar requests

**Tests:**
- Verificar que los logs contienen correlation IDs
- Validar que PII no se loguea

---

### TICKET 2: Métricas y dashboards

**Backend:**
- Prometheus metrics endpoint (`/metrics`)
- Métricas clave:
  - Request rate, latency, error rate (RED)
  - Database connection pool
  - Queue depths (Redis)
  - Business metrics: orders/min, revenue/hour
- Grafana dashboards:
  - System health
  - API performance
  - Business KPIs
  - Error rates

**Mini-App:**
- Web Vitals (Core Web Vitals)
- User engagement metrics
- Conversion funnel

**Documentación:**
- `docs/operations/metrics.md`
- `docs/operations/dashboards.md`

**Tests:**
- Verificar que `/metrics` expone datos
- Validar que las métricas son coherentes

---

### TICKET 3: Alertas y notificaciones operativas

**Backend:**
- Alertmanager configuración
- Alertas por:
  - Error rate > 1%
  - P95 latency > 500ms
  - Database connections > 80%
  - Disk usage > 80%
  - Memory usage > 85%
  - Bot webhook failures
  - Payment processor errors
- Canales: Email, Slack, PagerDuty (opcional)
- Runbooks: qué hacer cuando suena cada alerta

**Documentación:**
- `docs/operations/alerts.md`
- `docs/operations/runbooks/` (uno por alerta)

**Tests:**
- Simular condición de alerta
- Verificar que se envía la notificación

---

### TICKET 4: Backups y disaster recovery

**Backend:**
- Backups automáticos de PostgreSQL (daily)
- Backups de Redis (snapshots)
- Backups de archivos (R2/S3)
- Retención: 7 días daily, 4 semanas weekly, 12 meses monthly
- Test de restore mensual
- Documentación de RTO/RPO
- Plan de disaster recovery paso a paso

**Documentación:**
- `docs/operations/backups.md`
- `docs/operations/disaster-recovery.md`

**Tests:**
- Ejecutar backup manual
- Ejecutar restore en entorno de prueba
- Verificar integridad de datos restaurados

---

### TICKET 5: Seguridad y compliance

**Backend:**
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting por IP y por usuario
- CORS configuración
- Input validation y sanitization
- SQL injection prevention (Prisma ya lo hace)
- XSS prevention
- CSRF tokens
- Secret rotation (API keys, JWT secrets)
- Dependency scanning (Dependabot, Snyk)
- Penetration testing checklist
- GDPR compliance:
  - Data retention policies
  - Right to be forgotten
  - Data export
  - Consent management

**Documentación:**
- `docs/security/README.md`
- `docs/security/checklist.md`
- `docs/security/gdpr.md`

**Tests:**
- Verificar security headers
- Validar rate limiting
- Ejecutar dependency scan

---

## Sprint 13: Go-Live, Post-Launch y Soporte

### Objetivo
Preparar el lanzamiento, documentar el soporte y establecer procesos post-launch.

### TICKET 1: Checklist de lanzamiento (Go-Live)

**Documentación:**
- `docs/launch/README.md`
- Checklist pre-launch:
  - [ ] Tests pasan (unit + integration + e2e)
  - [ ] Performance tests aceptables
  - [ ] Security audit completa
  - [ ] Documentación actualizada
  - [ ] Variables de entorno configuradas
  - [ ] SSL certificates válidos
  - [ ] Domains configurados
  - [ ] Backups configurados
  - [ ] Monitoreo activo
  - [ ] Alertas configuradas
  - [ ] Runbooks accesibles
  - [ ] Equipo de soporte entrenado
  - [ ] Plan de rollback listo
- Checklist launch day:
  - [ ] Deploy a producción
  - [ ] Smoke tests
  - [ ] Monitoreo intensivo (primeras 24h)
  - [ ] Comunicación a usuarios
- Post-launch:
  - [ ] Retrospectiva
  - [ ] Documentar lecciones aprendidas

**Tests:**
- Ejecutar checklist en staging
- Validar que todos los items son verificables

---

### TICKET 2: Guías de usuario final

**Documentación:**
- `docs/user-guides/README.md`
- Guías paso a paso con screenshots:
  - Cómo crear una tienda
  - Cómo agregar productos
  - Cómo configurar pagos
  - Cómo ver órdenes
  - Cómo usar el bot de Telegram
  - Cómo usar el mini-app
  - Cómo configurar notificaciones
  - Cómo contactar soporte
- Videos tutoriales (scripts, no videos reales)
- FAQ de usuario
- Troubleshooting para usuarios

**Formato:**
- Markdown para web
- PDF para descarga
- In-app tours (componentes React)

**Tests:**
- Verificar que las guías son claras
- Validar que los pasos funcionan

---

### TICKET 3: Documentación de soporte técnico

**Documentación:**
- `docs/support/README.md`
- Categorías de issues y cómo escalar
- Matriz de responsabilidades (RACI)
- SLAs:
  - P1 (crítico): 15 min respuesta, 2h resolución
  - P2 (alto): 1h respuesta, 8h resolución
  - P3 (medio): 4h respuesta, 24h resolución
  - P4 (bajo): 24h respuesta, 72h resolución
- Escalation paths
- Contactos de emergencia
- Vendor contacts (Stripe, Telegram, Railway, etc.)
- Known issues y workarounds

**Tests:**
- Verificar que los contactos están actualizados
- Validar que los SLAs son realistas

---

### TICKET 4: Onboarding de nuevos desarrolladores

**Documentación:**
- `docs/onboarding/README.md`
- Día 1: Setup de entorno (2-4 horas)
- Día 2: Arquitectura y codebase (4-6 horas)
- Día 3: Primer ticket (pair programming)
- Recursos:
  - Videos de arquitectura
  - Diagramas explicativos
  - Glosario de términos del negocio
  - Glosario técnico
- Checklist de onboarding:
  - [ ] Cuentas creadas (GitHub, Railway, etc.)
  - [ ] Entorno local funcionando
  - [ ] Primer PR mergeado
  - [ ] Documentación leída

**Tests:**
- Verificar que un nuevo dev puede seguir la guía
- Validar que el tiempo estimado es realista

---

### TICKET 5: Roadmap y plan de mantenimiento

**Documentación:**
- `docs/roadmap/README.md`
- Roadmap Q3-Q4 2026:
  - Features planificadas
  - Mejoras técnicas (deuda técnica)
  - Migraciones planificadas
- Plan de mantenimiento:
  - Dependencias: revisar mensualmente
  - Security patches: aplicar dentro de 48h
  - Major updates: planificar con 2 semanas
  - Database maintenance: ventana mensual
- Deprecación de features:
  - Política de deprecación
  - Timeline de comunicación
  - Migration guides
- Changelog template y proceso

**Tests:**
- Verificar que el roadmap es coherente con el codebase
- Validar que las dependencias están actualizadas

---

## Resumen de Sprints 10-13

| Sprint | Tickets | Enfoque |
|--------|---------|---------|
| **10** | 5 | Documentación técnica y API |
| **11** | 5 | CI/CD, Docker, infraestructura cloud |
| **12** | 5 | Operaciones, monitoreo, backups, seguridad |
| **13** | 5 | Go-live, guías de usuario, soporte, onboarding |

**Total:** 20 tickets adicionales

**Entregables principales:**
- 15+ documentos markdown
- 3 workflows de GitHub Actions
- 5 Dockerfiles + 2 docker-compose
- 10+ scripts de utilidad
- Dashboards de Grafana
- Sistema de alertas
- Plan de disaster recovery
- Guías de usuario
- Proceso de onboarding
- Roadmap y plan de mantenimiento

---

## Notas para el Desarrollo

- Cada ticket debe seguir el patrón ticket-por-ticket con aprobación explícita
- Los tests deben verificar que la documentación es correcta y funcional
- Los scripts deben ser ejecutables y probados
- Los diagramas deben usar Mermaid para mantenerlos versionables
- La documentación debe ser revisable en GitHub (markdown nativo)
