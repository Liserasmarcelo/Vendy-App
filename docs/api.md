# API Documentation

Base URL: `https://api.vendy.app/v1`

## Autenticación

Todas las requests deben incluir un header de autenticación:

```
Authorization: Bearer <token>
```

O para Telegram Mini Apps:

```
X-Telegram-Init-Data: <initData>
```

## Endpoints

### Productos

#### Listar productos

```http
GET /products?shopId=1&category=Electrónica&search=iPhone&page=1&limit=20
```

**Response:**

```json
{
  "products": [
    {
      "id": 1,
      "name": "iPhone 15 Pro",
      "description": "El mejor iPhone",
      "price": 999,
      "currency": "USD",
      "category": "Electrónica",
      "stock": 10,
      "images": ["https://cdn.vendy.app/1.jpg"],
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Crear producto

```http
POST /products
Content-Type: application/json

{
  "shopId": 1,
  "name": "iPhone 15 Pro",
  "description": "El mejor iPhone",
  "price": 999,
  "currency": "USD",
  "category": "Electrónica",
  "stock": 10,
  "images": ["https://cdn.vendy.app/1.jpg"]
}
```

### Órdenes

#### Crear orden

```http
POST /orders
Content-Type: application/json

{
  "shopId": 1,
  "customerId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "variant": { "color": "negro", "size": "128GB" }
    }
  ],
  "total": 1998,
  "paymentMethod": "stripe",
  "shippingAddress": {
    "name": "Juan Pérez",
    "phone": "+595 981 123456",
    "address": "Calle 123"
  }
}
```

#### Actualizar estado

```http
PATCH /orders/123/status
Content-Type: application/json

{
  "status": "completed",
  "adminId": 1
}
```

### Tiendas

#### Crear tienda

```http
POST /shops
Content-Type: application/json

{
  "adminId": 123456,
  "name": "TechStore PY",
  "description": "Venta de productos tecnológicos",
  "category": "Electrónica",
  "country": "PY",
  "currency": "USD"
}
```

#### Onboarding

```http
POST /shops/onboarding
Content-Type: application/json

{
  "adminId": 123456,
  "name": "TechStore PY",
  "description": "Venta de productos tecnológicos",
  "category": "Electrónica",
  "country": "PY",
  "currency": "USD",
  "adminEmail": "admin@techstore.com",
  "adminPhone": "+595 981 123456",
  "adminName": "Juan Pérez",
  "botUsername": "techstore_py_bot"
}
```

### Admin

#### Estadísticas globales

```http
GET /admin/123456/stats
```

**Response:**

```json
{
  "totalShops": 3,
  "activeShops": 2,
  "totalOrders": 57,
  "totalRevenue": 15900,
  "totalCustomers": 89,
  "avgOrderValue": 279,
  "newShopsThisMonth": 1,
  "newOrdersThisMonth": 23,
  "revenueThisMonth": 6500,
  "growthRate": 15.5,
  "topShops": [
    {
      "name": "TechStore PY",
      "revenue": 12500,
      "orders": 45
    }
  ]
}
```

#### Estadísticas por tienda

```http
GET /shops/1/stats
```

#### Comparativa

```http
GET /shops/1/stats/compare?period=month
```

### Webhooks

#### Stripe

```http
POST /webhooks/stripe
Stripe-Signature: <signature>

{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_123",
      "amount": 199800,
      "metadata": {
        "orderId": "123",
        "shopId": "1"
      }
    }
  }
}
```

#### Transferencia

```http
POST /webhooks/transfer/submitted
X-Webhook-Secret: <secret>

{
  "orderId": "123",
  "telegramId": "123456",
  "reference": "TRF-001",
  "bank": "Banco Itaú",
  "amount": 1998,
  "screenshotUrl": "https://cdn.vendy.app/proof.jpg"
}
```

## Códigos de error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Rate Limiting

- General: 100 requests/minute
- Auth: 1000 requests/minute
- Webhooks: 1000 requests/minute

## Health Checks

| Endpoint | Descripción |
|----------|-------------|
| `GET /health/live` | Liveness probe |
| `GET /health/ready` | Readiness probe |
| `GET /health` | Health detallado |
| `GET /metrics` | Métricas Prometheus |
