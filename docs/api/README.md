# Documentación de la API

> **Vendy API v1.0.0** — Store-as-a-Service para Telegram

---

## URL Base

| Entorno | URL |
|---------|-----|
| Desarrollo local | `http://localhost:3001` |
| Staging | `https://api-staging.vendy.app` |
| Producción | `https://api.vendy.app` |

---

## Autenticación

La API soporta dos métodos de autenticación:

### 1. Bearer Token (JWT)

Para endpoints que requieren autenticación de usuario/admin:

```bash
curl -H "Authorization: Bearer <tu-jwt-token>"   https://api.vendy.app/shops
```

Obtener token:
```bash
POST /auth/login
{
  "email": "admin@vendy.app",
  "password": "tu-password"
}
```

### 2. Telegram Init Data

Para endpoints llamados desde el Mini-App de Telegram:

```bash
curl -H "X-Telegram-Init-Data: <init-data-de-telegram>"   https://api.vendy.app/shops
```

El `initData` se obtiene automáticamente del SDK de Telegram Web Apps.

---

## Documentación Interactiva

### Swagger UI

La documentación interactiva está disponible en:

```
http://localhost:3001/documentation
```

Desde allí podés:
- Explorar todos los endpoints
- Ver schemas de request/response
- Probar endpoints directamente
- Ver códigos de error

### OpenAPI Spec (JSON)

Para importar en Postman, Insomnia, o generar clientes:

```bash
curl http://localhost:3001/api/openapi.json > vendy-api.json
```

---

## Endpoints por Dominio

### 🔐 Auth

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar nuevo usuario |
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/logout` | Cerrar sesión |
| POST | `/auth/refresh` | Refrescar token JWT |
| POST | `/auth/telegram` | Login con Telegram |
| GET | `/auth/me` | Obtener usuario actual |
| POST | `/auth/forgot-password` | Solicitar reset de password |
| POST | `/auth/reset-password` | Resetear password |

### 🏪 Shops

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/shops` | Listar tiendas |
| POST | `/shops` | Crear tienda |
| GET | `/shops/:id` | Obtener tienda |
| PATCH | `/shops/:id` | Actualizar tienda |
| DELETE | `/shops/:id` | Eliminar tienda |
| GET | `/shops/:id/settings` | Configuración de tienda |
| PATCH | `/shops/:id/settings` | Actualizar configuración |
| GET | `/shops/:id/analytics` | Analytics de tienda |
| POST | `/shops/:id/upgrade` | Mejorar plan |

### 📦 Products

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/shops/:shopId/products` | Listar productos |
| POST | `/shops/:shopId/products` | Crear producto |
| GET | `/products/:id` | Obtener producto |
| PATCH | `/products/:id` | Actualizar producto |
| DELETE | `/products/:id` | Eliminar producto |
| POST | `/products/:id/variants` | Agregar variante |
| GET | `/products/:id/variants` | Listar variantes |
| POST | `/products/:id/images` | Subir imagen |

### 📋 Orders

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/shops/:shopId/orders` | Listar órdenes |
| POST | `/shops/:shopId/orders` | Crear orden |
| GET | `/orders/:id` | Obtener orden |
| PATCH | `/orders/:id/status` | Actualizar estado |
| POST | `/orders/:id/cancel` | Cancelar orden |
| POST | `/orders/:id/refund` | Reembolsar orden |
| GET | `/orders/:id/items` | Items de la orden |

### 💳 Payments

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/payments/intent` | Crear intent de pago |
| POST | `/payments/confirm` | Confirmar pago |
| GET | `/payments/:id` | Obtener pago |
| POST | `/payments/:id/refund` | Reembolsar |
| GET | `/shops/:shopId/payments` | Listar pagos |
| POST | `/payments/webhook` | Webhook de Stripe |

### 👥 Customers

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/shops/:shopId/customers` | Listar clientes |
| GET | `/customers/:id` | Obtener cliente |
| PATCH | `/customers/:id` | Actualizar cliente |
| GET | `/customers/:id/orders` | Órdenes del cliente |

### 📊 Analytics

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/shops/:shopId/analytics/summary` | Resumen |
| GET | `/shops/:shopId/analytics/revenue` | Ingresos |
| GET | `/shops/:shopId/analytics/orders` | Órdenes |
| GET | `/shops/:shopId/analytics/customers` | Clientes |
| GET | `/shops/:shopId/analytics/products` | Productos |

### 🎫 Support

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/tickets` | Listar tickets |
| POST | `/tickets` | Crear ticket |
| GET | `/tickets/:id` | Obtener ticket |
| PATCH | `/tickets/:id/status` | Cambiar estado |
| POST | `/tickets/:id/assign` | Asignar agente |
| GET | `/tickets/:id/messages` | Mensajes |
| POST | `/tickets/:id/messages` | Agregar mensaje |
| GET | `/tickets/stats` | Estadísticas |

### 📚 Help

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/help/categories` | Categorías |
| GET | `/help/articles` | Artículos |
| GET | `/help/articles/:id` | Artículo |
| POST | `/help/articles/:id/feedback` | Feedback |
| GET | `/help/faqs` | FAQs |
| POST | `/help/faqs/:id/feedback` | FAQ feedback |
| GET | `/help/search` | Búsqueda |
| GET | `/help/popular` | Populares |

### 🔔 Notifications

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/notifications` | Listar notificaciones |
| GET | `/notifications/unread` | Conteo sin leer |
| PATCH | `/notifications/:id/read` | Marcar leída |
| POST | `/notifications/read-all` | Marcar todas |
| GET | `/notifications/preferences` | Preferencias |
| PATCH | `/notifications/preferences` | Actualizar preferencias |
| POST | `/notifications/push-subscribe` | Suscribir push |
| POST | `/notifications/push-unsubscribe` | Desuscribir |

### 🪝 Webhooks

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/webhooks/telegram` | Webhook de Telegram |
| POST | `/webhooks/stripe` | Webhook de Stripe |
| GET | `/webhooks/stripe` | Verificar Stripe |

### ❤️ Health

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Estado general |
| GET | `/health/db` | Base de datos |
| GET | `/health/redis` | Redis |

---

## Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| `400` | Bad Request | Datos de entrada inválidos |
| `401` | Unauthorized | Token JWT inválido o expirado |
| `403` | Forbidden | Sin permisos para el recurso |
| `404` | Not Found | Recurso no existe |
| `409` | Conflict | Conflicto de datos (ej: email duplicado) |
| `422` | Unprocessable Entity | Validación falló |
| `429` | Too Many Requests | Rate limit excedido |
| `500` | Internal Server Error | Error del servidor |
| `503` | Service Unavailable | Servicio temporalmente no disponible |

---

## Paginación

Las respuestas paginadas usan el siguiente formato:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

Parámetros de query:

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Cantidad de items por página |
| `offset` | integer | 0 | Offset desde el inicio |
| `sort` | string | `createdAt` | Campo para ordenar |
| `order` | string | `desc` | `asc` o `desc` |

---

## Rate Limiting

La API tiene límites de rate por IP y por usuario:

| Tipo | Límite | Ventana |
|------|--------|---------|
| General | 100 requests | 1 minuto |
| Auth | 10 requests | 1 minuto |
| Webhooks | 1000 requests | 1 minuto |

Headers de respuesta:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1718476800
```

---

## Versionado

La API usa versionado en la URL:

```
/api/v1/shops
```

Actualmente solo v1 está disponible. Cuando se lance v2, v1 seguirá soportada por 6 meses.

---

## SDKs y Clientes

### Generar cliente TypeScript

```bash
# Instalar openapi-generator
npm install -g @openapitools/openapi-generator-cli

# Generar cliente
openapi-generator-cli generate   -i http://localhost:3001/api/openapi.json   -g typescript-fetch   -o ./client
```

### Postman

1. Importar colección desde `http://localhost:3001/api/openapi.json`
2. Configurar environment con `baseUrl` y `token`

---

## Changelog

### v1.0.0 (2024-06-15)
- Lanzamiento inicial
- Auth, Shops, Products, Orders, Payments
- Support, Help, Notifications
- Webhooks de Telegram y Stripe

---

## Recursos

- [Swagger UI](http://localhost:3001/documentation)
- [OpenAPI JSON](http://localhost:3001/api/openapi.json)
- [GitHub](https://github.com/vendy/vendy)
- [Soporte](https://t.me/vendysupport)
