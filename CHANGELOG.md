# Changelog

Todos los cambios notables de este proyecto serán documentados acá.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Sistema de onboarding conversacional para nuevos vendedores
- Panel de estadísticas con comparativas y gráficos
- Gestión de tiendas (CRUD completo)
- Sistema de alertas con auto-checks
- Métricas Prometheus
- Logger estructurado con Pino
- Docker Compose para desarrollo local
- CI/CD con GitHub Actions
- Scripts de deploy y rollback

### Changed
- Mejorada la estructura del monorepo
- Optimizado el build de Docker

### Fixed
- Corrección de rate limiting en webhooks
- Fix de memoria en bot hijo

## [1.0.0] - 2024-06-20

### Added
- Bot Padre con comandos admin y gestión de tiendas
- Bot Hijo con catálogo inline, carrito y checkout
- Mini App con catálogo, carrito, checkout y panel admin
- API REST con Fastify, Prisma y PostgreSQL
- Sistema de pagos: Stripe, transferencia, efectivo
- Webhooks para notificaciones de pagos
- Sistema de notificaciones push vía Telegram
- Internacionalización (español/inglés)
- Rate limiting y seguridad JWT
- Health checks y monitoreo
- Tests unitarios e integración
- Documentación completa

### Security
- Validación HMAC-SHA256 para Telegram initData
- Rate limiting en todos los endpoints
- Sanitización de inputs
- Headers de seguridad (CSP, HSTS, etc.)
