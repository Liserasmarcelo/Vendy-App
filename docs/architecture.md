# Architecture

## Overview

Vendy es una plataforma de ecommerce multi-tenant que permite a vendedores crear tiendas dentro de Telegram.

## Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        Telegram                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Bot Padre   │  │  Bot Hijo 1  │  │  Bot Hijo N  │   │
│  │  (Gestión)   │  │  (Tienda 1)  │  │  (Tienda N)  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │             │
│         └─────────────────┴─────────────────┘             │
│                           │                               │
│                    ┌──────┴──────┐                        │
│                    │  Mini App   │                        │
│                    │  (React)    │                        │
│                    └──────┬──────┘                        │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                           │                                 │
│                    ┌────────┴────────┐                       │
│                    │   API (Fastify) │                       │
│                    │                 │                       │
│                    │  ┌───────────┐  │                       │
│                    │  │  Routes   │  │                       │
│                    │  │  Auth     │  │                       │
│                    │  │  Products │  │                       │
│                    │  │  Orders   │  │                       │
│                    │  │  Shops    │  │                       │
│                    │  │  Webhooks │  │                       │
│                    │  └─────┬─────┘  │                       │
│                    └────────┼────────┘                       │
│                             │                                 │
│                    ┌────────┴────────┐                       │
│                    │    Prisma ORM   │                       │
│                    └────────┬────────┘                       │
│                             │                                 │
│         ┌───────────────────┼───────────────────┐             │
│         │                   │                   │             │
│    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐          │
│    │PostgreSQL│       │  Redis  │       │  Stripe │          │
│    │         │       │         │       │         │          │
│    └─────────┘       └─────────┘       └─────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Flujo de datos

### 1. Onboarding

```
Vendedor → Bot Padre → API → PostgreSQL
                ↓
         Bot Hijo creado
```

### 2. Compra

```
Cliente → Bot Hijo / Mini App → API → PostgreSQL
                              ↓
                        Stripe / Transfer / Cash
                              ↓
                        Webhook → API → Notificación
```

### 3. Admin

```
Vendedor → Bot Padre / Mini App → API → PostgreSQL
                              ↓
                        Estadísticas
```

## Multi-tenancy

Cada tienda es un tenant aislado mediante `shop_id`:

- **Row-level security**: Todas las queries filtran por `shop_id`
- **Bot hijo**: Un bot por tienda, token único
- **Base de datos**: Misma DB, tablas con `shop_id`

## Seguridad

- **JWT**: Tokens con expiración
- **HMAC-SHA256**: Validación de Telegram initData
- **Rate limiting**: 100 req/min general
- **CORS**: Configurado para Mini App
- **Webhooks**: Firma verificada (Stripe, custom)

## Escalabilidad

- **Stateless**: API sin estado, escala horizontal
- **Redis**: Cache y sessions distribuidas
- **PostgreSQL**: Conexiones pool (Prisma)
- **Docker**: Contenedores para cada servicio
