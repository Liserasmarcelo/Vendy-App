# Ejemplos de API

> Ejemplos prácticos de uso de la API con curl.

---

## Autenticación

### Login

```bash
curl -X POST http://localhost:3001/auth/login   -H "Content-Type: application/json"   -d '{
    "email": "admin@vendy.app",
    "password": "tu-password"
  }'
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@vendy.app",
    "name": "Admin"
  }
}
```

### Login con Telegram

```bash
curl -X POST http://localhost:3001/auth/telegram   -H "Content-Type: application/json"   -d '{
    "initData": "query_id=AA..."
  }'
```

---

## Tiendas

### Crear tienda

```bash
curl -X POST http://localhost:3001/shops   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{
    "name": "Mi Tienda",
    "description": "La mejor tienda de ejemplo",
    "currency": "USD",
    "timezone": "America/Asuncion"
  }'
```

### Listar tiendas

```bash
curl http://localhost:3001/shops   -H "Authorization: Bearer <token>"
```

### Actualizar tienda

```bash
curl -X PATCH http://localhost:3001/shops/1   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{
    "name": "Mi Tienda Actualizada",
    "plan": "crecimiento"
  }'
```

---

## Productos

### Crear producto

```bash
curl -X POST http://localhost:3001/shops/1/products   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{
    "name": "Camiseta Vendy",
    "description": "Camiseta oficial",
    "price": 29.99,
    "stock": 100,
    "category": "ropa",
    "sku": "VEN-001"
  }'
```

### Listar productos con filtros

```bash
curl "http://localhost:3001/shops/1/products?category=ropa&minPrice=10&maxPrice=50&inStock=true"   -H "Authorization: Bearer <token>"
```

### Actualizar stock

```bash
curl -X PATCH http://localhost:3001/products/1   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{
    "stock": 50
  }'
```

---

## Órdenes

### Crear orden

```bash
curl -X POST http://localhost:3001/shops/1/orders   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{
    "customerId": "123456789",
    "items": [
      {
        "productId": 1,
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "street": "Av. Example 123",
      "city": "Asunción",
      "country": "PY"
    }
  }'
```

### Actualizar estado de orden

```bash
curl -X PATCH http://localhost:3001/orders/1/status   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{
    "status": "shipped",
    "trackingNumber": "ABC123456"
  }'
```

---

## Pagos

### Crear intent de pago (Stripe)

```bash
curl -X POST http://localhost:3001/payments/intent   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{
    "orderId": 1,
    "method": "stripe",
    "amount": 59.99,
    "currency": "USD"
  }'
```

### Webhook de Stripe

```bash
curl -X POST http://localhost:3001/payments/webhook   -H "Stripe-Signature: <signature>"   -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_1234567890",
        "amount": 5999,
        "status": "succeeded"
      }
    }
  }'
```

---

## Soporte

### Crear ticket

```bash
curl -X POST http://localhost:3001/tickets   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{
    "shopId": 1,
    "subject": "Problema con pago",
    "description": "No puedo completar el pago con tarjeta",
    "priority": "high",
    "category": "billing"
  }'
```

### Agregar mensaje

```bash
curl -X POST http://localhost:3001/tickets/1/messages   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{
    "senderId": "123456789",
    "senderType": "customer",
    "content": "Adjunto captura de pantalla del error"
  }'
```

---

## Centro de Ayuda

### Buscar artículos

```bash
curl "http://localhost:3001/help/search?q=cómo+pagar"   -H "Authorization: Bearer <token>"
```

### Dar feedback a artículo

```bash
curl -X POST http://localhost:3001/help/articles/1/feedback   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{
    "helpful": true
  }'
```

---

## Notificaciones

### Obtener notificaciones

```bash
curl "http://localhost:3001/notifications?limit=10&status=sent"   -H "Authorization: Bearer <token>"
```

### Marcar todas como leídas

```bash
curl -X POST http://localhost:3001/notifications/read-all   -H "Authorization: Bearer <token>"
```

### Actualizar preferencias

```bash
curl -X PATCH http://localhost:3001/notifications/preferences   -H "Authorization: Bearer <token>"   -H "Content-Type: application/json"   -d '{
    "channels": {
      "order_created": ["push", "email"],
      "payment_received": ["push", "in_app"]
    },
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00"
    }
  }'
```

---

## Webhooks

### Verificar webhook de Telegram

```bash
curl -X POST http://localhost:3001/webhooks/telegram   -H "Content-Type: application/json"   -d '{
    "update_id": 123456789,
    "message": {
      "message_id": 1,
      "from": {
        "id": 123456789,
        "is_bot": false,
        "first_name": "Juan"
      },
      "chat": {
        "id": 123456789,
        "type": "private"
      },
      "date": 1718476800,
      "text": "/start"
    }
  }'
```

---

## Health Checks

### Verificar estado general

```bash
curl http://localhost:3001/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2024-06-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Verificar base de datos

```bash
curl http://localhost:3001/health/db
```

### Verificar Redis

```bash
curl http://localhost:3001/health/redis
```

---

## Scripts de utilidad

### Script para obtener token y hacer requests

```bash
#!/bin/bash
# api-client.sh

BASE_URL="http://localhost:3001"
EMAIL="admin@vendy.app"
PASSWORD="tu-password"

# Login y obtener token
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login"   -H "Content-Type: application/json"   -d "{"email":"$EMAIL","password":"$PASSWORD"}"   | jq -r '.token')

echo "Token: $TOKEN"

# Hacer request autenticado
curl -s "$BASE_URL/shops"   -H "Authorization: Bearer $TOKEN"   | jq '.'
```

### Script para crear productos en bulk

```bash
#!/bin/bash
# bulk-products.sh

BASE_URL="http://localhost:3001"
TOKEN="<tu-token>"
SHOP_ID=1

for i in {1..10}; do
  curl -X POST "$BASE_URL/shops/$SHOP_ID/products"     -H "Authorization: Bearer $TOKEN"     -H "Content-Type: application/json"     -d "{
      "name": "Producto $i",
      "description": "Descripción del producto $i",
      "price": $((10 + i)),
      "stock": 100,
      "category": "general",
      "sku": "PROD-$i"
    }"
done
```
