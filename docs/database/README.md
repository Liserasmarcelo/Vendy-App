# Documentación de Base de Datos

> **PostgreSQL** — Esquema, relaciones, índices y optimizaciones de Vendy.

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Diagrama ERD](#diagrama-erd)
3. [Tablas Principales](#tablas-principales)
4. [Relaciones](#relaciones)
5. [Índices](#índices)
6. [Migraciones](#migraciones)
7. [Seed Data](#seed-data)
8. [Optimizaciones](#optimizaciones)
9. [Comandos Prisma](#comandos-prisma)
10. [Backup y Restore](#backup-y-restore)

---

## Visión General

| Propiedad | Valor |
|-----------|-------|
| **Motor** | PostgreSQL 15+ |
| **ORM** | Prisma 5.x |
| **Multi-tenancy** | Row-level (`shop_id`) |
| **Encoding** | UTF-8 |
| **Timezone** | UTC (aplicación convierte a local) |
| **Máximo conexiones** | 100 (configurable) |

### Convenciones de Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Tablas | snake_case, plural | `users`, `order_items` |
| Columnas | snake_case | `created_at`, `shop_id` |
| Claves primarias | `id` (serial o UUID) | `id` |
| Claves foráneas | `{tabla}_id` | `shop_id`, `user_id` |
| Timestamps | `created_at`, `updated_at` | — |
| Soft delete | `deleted_at` (nullable) | — |
| Índices | `idx_{tabla}_{columnas}` | `idx_orders_shop_status` |

---

## Diagrama ERD

```mermaid
erDiagram
    USER ||--o{ SHOP : owns
    USER ||--o{ NOTIFICATION : receives
    SHOP ||--o{ PRODUCT : has
    SHOP ||--o{ ORDER : receives
    SHOP ||--o{ CUSTOMER : has
    SHOP ||--o{ TICKET : has
    SHOP ||--o{ ANALYTICS_EVENT : generates
    SHOP ||--o{ HELP_ARTICLE : owns
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--o| PAYMENT : has
    ORDER ||--o| SHIPPING : has
    CUSTOMER ||--o{ ORDER : places
    TICKET ||--o{ TICKET_MESSAGE : contains
    PRODUCT ||--o{ ORDER_ITEM : appears_in
    
    USER {
        int id PK
        string email UK
        string password_hash
        string telegram_id UK
        string first_name
        string last_name
        string username
        string phone
        string language
        enum role
        timestamp created_at
        timestamp updated_at
    }
    
    SHOP {
        int id PK
        int owner_id FK
        string name
        string slug UK
        string description
        string currency
        string timezone
        enum status
        enum plan
        decimal commission_rate
        boolean white_label_enabled
        jsonb settings
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCT {
        int id PK
        int shop_id FK
        string name
        string description
        decimal price
        int stock
        string category
        string sku UK
        string barcode
        jsonb images
        jsonb variants
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    ORDER {
        int id PK
        int shop_id FK
        string customer_id FK
        enum status
        decimal total
        decimal subtotal
        decimal shipping
        decimal tax
        decimal discount
        enum payment_status
        string tracking_number
        jsonb shipping_address
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    ORDER_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        string product_name
        int quantity
        decimal unit_price
        decimal total_price
        timestamp created_at
    }
    
    PAYMENT {
        int id PK
        int order_id FK UK
        enum method
        enum status
        decimal amount
        string currency
        string transaction_id UK
        string receipt_url
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    CUSTOMER {
        string id PK
        int shop_id FK
        string telegram_id UK
        string first_name
        string last_name
        string username
        string phone
        string email
        string language
        jsonb preferences
        timestamp created_at
        timestamp updated_at
    }
    
    TICKET {
        string id PK
        int shop_id FK
        string customer_id FK
        string subject
        text description
        enum status
        enum priority
        enum category
        string assigned_to FK
        timestamp resolved_at
        timestamp created_at
        timestamp updated_at
    }
    
    TICKET_MESSAGE {
        string id PK
        string ticket_id FK
        string sender_id
        enum sender_type
        text content
        jsonb attachments
        timestamp created_at
    }
    
    NOTIFICATION {
        string id PK
        string user_id FK
        int shop_id FK
        enum type
        string title
        text body
        jsonb data
        enum channel
        enum status
        timestamp sent_at
        timestamp read_at
        timestamp created_at
    }
    
    ANALYTICS_EVENT {
        int id PK
        int shop_id FK
        string event_type
        string user_id
        jsonb properties
        timestamp created_at
    }
    
    HELP_ARTICLE {
        string id PK
        string title
        text content
        string category
        jsonb tags
        int helpful_count
        int not_helpful_count
        int view_count
        boolean is_published
        timestamp created_at
        timestamp updated_at
    }
    
    FAQ {
        string id PK
        string question
        text answer
        string category
        int helpful_count
        int not_helpful_count
        boolean is_published
        timestamp created_at
    }
```

---

## Tablas Principales

### `users`

Usuarios administradores del sistema.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | SERIAL | PK | ID autoincremental |
| `email` | VARCHAR(255) | UK, NOT NULL | Email único |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash bcrypt |
| `telegram_id` | VARCHAR(50) | UK | ID de Telegram |
| `first_name` | VARCHAR(100) | | Nombre |
| `last_name` | VARCHAR(100) | | Apellido |
| `username` | VARCHAR(50) | | Username de Telegram |
| `phone` | VARCHAR(20) | | Teléfono |
| `language` | VARCHAR(10) | DEFAULT 'es' | Idioma preferido |
| `role` | ENUM | DEFAULT 'user' | admin, user, support |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Actualización |

### `shops`

Tiendas creadas por los usuarios.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | SERIAL | PK | ID autoincremental |
| `owner_id` | INTEGER | FK → users.id | Dueño de la tienda |
| `name` | VARCHAR(255) | NOT NULL | Nombre de la tienda |
| `slug` | VARCHAR(100) | UK, NOT NULL | URL-friendly |
| `description` | TEXT | | Descripción |
| `currency` | VARCHAR(3) | DEFAULT 'USD' | Moneda |
| `timezone` | VARCHAR(50) | DEFAULT 'UTC' | Zona horaria |
| `status` | ENUM | DEFAULT 'active' | active, inactive, suspended |
| `plan` | ENUM | DEFAULT 'inicial' | inicial, crecimiento, pro |
| `commission_rate` | DECIMAL(5,4) | DEFAULT 0.03 | Tasa de comisión |
| `white_label_enabled` | BOOLEAN | DEFAULT FALSE | White label activo |
| `settings` | JSONB | DEFAULT '{}' | Configuración flexible |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Actualización |

### `products`

Productos de cada tienda.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | SERIAL | PK | ID autoincremental |
| `shop_id` | INTEGER | FK → shops.id, NOT NULL | Tienda |
| `name` | VARCHAR(255) | NOT NULL | Nombre del producto |
| `description` | TEXT | | Descripción |
| `price` | DECIMAL(10,2) | NOT NULL | Precio |
| `stock` | INTEGER | DEFAULT 0 | Stock disponible |
| `category` | VARCHAR(100) | | Categoría |
| `sku` | VARCHAR(100) | UK | SKU único |
| `barcode` | VARCHAR(50) | | Código de barras |
| `images` | JSONB | DEFAULT '[]' | URLs de imágenes |
| `variants` | JSONB | DEFAULT '[]' | Variantes (talla, color) |
| `is_active` | BOOLEAN | DEFAULT TRUE | Activo |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Actualización |

### `orders`

Órdenes de compra.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | SERIAL | PK | ID autoincremental |
| `shop_id` | INTEGER | FK → shops.id, NOT NULL | Tienda |
| `customer_id` | VARCHAR(50) | FK → customers.id | Cliente |
| `status` | ENUM | DEFAULT 'pending' | pending, processing, shipped, delivered, cancelled, refunded |
| `total` | DECIMAL(10,2) | NOT NULL | Total |
| `subtotal` | DECIMAL(10,2) | NOT NULL | Subtotal |
| `shipping` | DECIMAL(10,2) | DEFAULT 0 | Envío |
| `tax` | DECIMAL(10,2) | DEFAULT 0 | Impuestos |
| `discount` | DECIMAL(10,2) | DEFAULT 0 | Descuento |
| `payment_status` | ENUM | DEFAULT 'pending' | pending, paid, failed, refunded |
| `tracking_number` | VARCHAR(100) | | Número de tracking |
| `shipping_address` | JSONB | | Dirección de envío |
| `metadata` | JSONB | DEFAULT '{}' | Metadata adicional |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Actualización |

### `order_items`

Items dentro de cada orden.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | SERIAL | PK | ID autoincremental |
| `order_id` | INTEGER | FK → orders.id, NOT NULL | Orden |
| `product_id` | INTEGER | FK → products.id | Producto |
| `product_name` | VARCHAR(255) | NOT NULL | Nombre (snapshot) |
| `quantity` | INTEGER | NOT NULL | Cantidad |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Precio unitario |
| `total_price` | DECIMAL(10,2) | NOT NULL | Precio total |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |

### `payments`

Pagos asociados a órdenes.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | SERIAL | PK | ID autoincremental |
| `order_id` | INTEGER | FK → orders.id, UK | Orden (1:1) |
| `method` | ENUM | NOT NULL | stripe, telegram_stars, transfer, cash |
| `status` | ENUM | DEFAULT 'pending' | pending, paid, failed, refunded |
| `amount` | DECIMAL(10,2) | NOT NULL | Monto |
| `currency` | VARCHAR(3) | NOT NULL | Moneda |
| `transaction_id` | VARCHAR(255) | UK | ID de transacción externo |
| `receipt_url` | TEXT | | URL del recibo |
| `metadata` | JSONB | DEFAULT '{}' | Metadata |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Actualización |

### `customers`

Clientes de cada tienda.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | VARCHAR(50) | PK | ID (telegram_id o UUID) |
| `shop_id` | INTEGER | FK → shops.id, NOT NULL | Tienda |
| `telegram_id` | VARCHAR(50) | UK | ID de Telegram |
| `first_name` | VARCHAR(100) | | Nombre |
| `last_name` | VARCHAR(100) | | Apellido |
| `username` | VARCHAR(50) | | Username |
| `phone` | VARCHAR(20) | | Teléfono |
| `email` | VARCHAR(255) | | Email |
| `language` | VARCHAR(10) | DEFAULT 'es' | Idioma |
| `preferences` | JSONB | DEFAULT '{}' | Preferencias |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Actualización |

### `tickets`

Tickets de soporte.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | VARCHAR(50) | PK | ID (ticket_ + timestamp) |
| `shop_id` | INTEGER | FK → shops.id, NOT NULL | Tienda |
| `customer_id` | VARCHAR(50) | FK → customers.id | Cliente |
| `subject` | VARCHAR(255) | NOT NULL | Asunto |
| `description` | TEXT | NOT NULL | Descripción |
| `status` | ENUM | DEFAULT 'open' | open, in_progress, resolved, closed |
| `priority` | ENUM | DEFAULT 'medium' | low, medium, high, urgent |
| `category` | ENUM | DEFAULT 'general' | general, billing, technical, feature_request, bug |
| `assigned_to` | VARCHAR(50) | FK → users.id | Agente asignado |
| `resolved_at` | TIMESTAMP | | Fecha de resolución |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Actualización |

### `ticket_messages`

Mensajes dentro de tickets.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | VARCHAR(50) | PK | ID (msg_ + timestamp) |
| `ticket_id` | VARCHAR(50) | FK → tickets.id, NOT NULL | Ticket |
| `sender_id` | VARCHAR(50) | NOT NULL | ID del remitente |
| `sender_type` | ENUM | NOT NULL | customer, agent, system |
| `content` | TEXT | NOT NULL | Contenido |
| `attachments` | JSONB | DEFAULT '[]' | Archivos adjuntos |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |

### `notifications`

Notificaciones enviadas.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | VARCHAR(50) | PK | ID (notif_ + timestamp) |
| `user_id` | VARCHAR(50) | FK → users.id | Usuario destino |
| `shop_id` | INTEGER | FK → shops.id | Tienda |
| `type` | ENUM | NOT NULL | order_created, payment_received, etc. |
| `title` | VARCHAR(255) | NOT NULL | Título |
| `body` | TEXT | NOT NULL | Cuerpo |
| `data` | JSONB | DEFAULT '{}' | Datos adicionales |
| `channel` | ENUM | NOT NULL | push, email, sms, in_app |
| `status` | ENUM | DEFAULT 'pending' | pending, sent, failed, read |
| `sent_at` | TIMESTAMP | | Fecha de envío |
| `read_at` | TIMESTAMP | | Fecha de lectura |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |

### `analytics_events`

Eventos para analytics.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | BIGSERIAL | PK | ID autoincremental grande |
| `shop_id` | INTEGER | FK → shops.id | Tienda |
| `event_type` | VARCHAR(100) | NOT NULL | Tipo de evento |
| `user_id` | VARCHAR(50) | | ID de usuario |
| `properties` | JSONB | DEFAULT '{}' | Propiedades |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |

### `help_articles`

Artículos del centro de ayuda.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | VARCHAR(50) | PK | ID (article_ + timestamp) |
| `title` | VARCHAR(255) | NOT NULL | Título |
| `content` | TEXT | NOT NULL | Contenido |
| `category` | VARCHAR(100) | NOT NULL | Categoría |
| `tags` | JSONB | DEFAULT '[]' | Tags |
| `helpful_count` | INTEGER | DEFAULT 0 | Votos útiles |
| `not_helpful_count` | INTEGER | DEFAULT 0 | Votos no útiles |
| `view_count` | INTEGER | DEFAULT 0 | Vistas |
| `is_published` | BOOLEAN | DEFAULT TRUE | Publicado |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Actualización |

### `faqs`

Preguntas frecuentes.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | VARCHAR(50) | PK | ID (faq_ + timestamp) |
| `question` | VARCHAR(500) | NOT NULL | Pregunta |
| `answer` | TEXT | NOT NULL | Respuesta |
| `category` | VARCHAR(100) | NOT NULL | Categoría |
| `helpful_count` | INTEGER | DEFAULT 0 | Votos útiles |
| `not_helpful_count` | INTEGER | DEFAULT 0 | Votos no útiles |
| `is_published` | BOOLEAN | DEFAULT TRUE | Publicado |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |

---

## Relaciones

### Relaciones 1:N

| Padre | Hijo | Campo FK |
|-------|------|----------|
| users | shops | `shops.owner_id` |
| users | notifications | `notifications.user_id` |
| shops | products | `products.shop_id` |
| shops | orders | `orders.shop_id` |
| shops | customers | `customers.shop_id` |
| shops | tickets | `tickets.shop_id` |
| shops | analytics_events | `analytics_events.shop_id` |
| shops | help_articles | `help_articles.shop_id` |
| orders | order_items | `order_items.order_id` |
| tickets | ticket_messages | `ticket_messages.ticket_id` |
| customers | orders | `orders.customer_id` |

### Relaciones 1:1

| Tabla A | Tabla B | Campo FK |
|---------|---------|----------|
| orders | payments | `payments.order_id` (UK) |

### Relaciones N:M (implícitas)

| Tabla A | Tabla B | Vía |
|---------|---------|-----|
| customers | products | `orders` + `order_items` |
| users | customers | `shops` (owner) |

---

## Índices

### Índices por Defecto (Prisma)

Prisma crea automáticamente índices para:
- Claves primarias (`id`)
- Claves únicas (`email`, `slug`, `sku`)
- Claves foráneas (`shop_id`, `customer_id`)

### Índices Personalizados

```sql
-- Órdenes por tienda y estado (dashboard principal)
CREATE INDEX idx_orders_shop_status ON orders(shop_id, status);

-- Órdenes por fecha (reportes)
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Productos por tienda y categoría (filtrado)
CREATE INDEX idx_products_shop_category ON products(shop_id, category);

-- Productos activos (catálogo)
CREATE INDEX idx_products_shop_active ON products(shop_id, is_active) WHERE is_active = true;

-- Clientes por tienda (búsqueda)
CREATE INDEX idx_customers_shop ON customers(shop_id);

-- Tickets por tienda y estado (panel de soporte)
CREATE INDEX idx_tickets_shop_status ON tickets(shop_id, status);

-- Tickets por prioridad (escalación)
CREATE INDEX idx_tickets_priority ON tickets(priority) WHERE status IN ('open', 'in_progress');

-- Notificaciones por usuario y estado (inbox)
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);

-- Eventos por tipo y fecha (analytics)
CREATE INDEX idx_analytics_events_type_date ON analytics_events(event_type, created_at);

-- Artículos de ayuda por categoría
CREATE INDEX idx_help_articles_category ON help_articles(category) WHERE is_published = true;

-- Full-text search en productos
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('spanish', name || ' ' || coalesce(description, '')));

-- Full-text search en artículos de ayuda
CREATE INDEX idx_help_articles_search ON help_articles USING gin(to_tsvector('spanish', title || ' ' || content));
```

---

## Migraciones

### Crear una Migración

```bash
cd apps/api

# Desarrollo (interactivo)
npx prisma migrate dev --name nombre_descriptivo

# Producción (sin interacción)
npx prisma migrate deploy
```

### Flujo de Migración

```
1. Modificar schema.prisma
2. prisma migrate dev --name descripcion
3. Revisar archivo SQL generado
4. Aplicar migración
5. Generar Prisma Client (automático)
6. Commit del archivo de migración
```

### Ejemplo de Migración

```prisma
// schema.prisma
model Product {
  id          Int      @id @default(autoincrement())
  shopId      Int      @map("shop_id")
  name        String   @db.VarChar(255)
  description String?  @db.Text
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  category    String?  @db.VarChar(100)
  sku         String?  @unique @db.VarChar(100)
  barcode     String?  @db.VarChar(50)
  images      Json     @default("[]")
  variants    Json     @default("[]")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  shop        Shop     @relation(fields: [shopId], references: [id])
  orderItems  OrderItem[]

  @@index([shopId, category])
  @@index([shopId, isActive])
  @@map("products")
}
```

### Comandos de Migración

| Comando | Descripción | Uso |
|---------|-------------|-----|
| `migrate dev` | Crear y aplicar migración | Desarrollo local |
| `migrate deploy` | Aplicar migraciones pendientes | Producción/Staging |
| `migrate reset` | Resetear DB y reaplicar | Desarrollo (⚠️ borra datos) |
| `migrate status` | Ver estado de migraciones | Debugging |
| `migrate resolve` | Marcar migración como aplicada | Recovery |

---

## Seed Data

### Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Usuario admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@vendy.app',
      passwordHash: '$2b$10$...', // bcrypt de 'admin123'
      firstName: 'Admin',
      lastName: 'Vendy',
      role: 'admin',
    },
  });

  // Tienda de ejemplo
  const shop = await prisma.shop.create({
    data: {
      ownerId: admin.id,
      name: 'Tienda de Ejemplo',
      slug: 'tienda-ejemplo',
      description: 'Una tienda de ejemplo para probar Vendy',
      currency: 'USD',
      timezone: 'America/Asuncion',
      plan: 'crecimiento',
      commissionRate: 0.02,
    },
  });

  // Productos de ejemplo
  await prisma.product.createMany({
    data: [
      {
        shopId: shop.id,
        name: 'Camiseta Vendy',
        description: 'Camiseta oficial de Vendy',
        price: 29.99,
        stock: 100,
        category: 'ropa',
        sku: 'VEN-001',
        images: JSON.stringify(['https://cdn.vendy.app/camiseta.jpg']),
      },
      {
        shopId: shop.id,
        name: 'Taza Vendy',
        description: 'Taza oficial de Vendy',
        price: 14.99,
        stock: 50,
        category: 'hogar',
        sku: 'VEN-002',
        images: JSON.stringify(['https://cdn.vendy.app/taza.jpg']),
      },
    ],
  });

  console.log('✅ Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Ejecutar Seed

```bash
cd apps/api
npx prisma db seed
```

---

## Optimizaciones

### Query Optimization

```typescript
// ✅ Bien: Usar include/select
const order = await prisma.order.findUnique({
  where: { id: 1 },
  include: {
    items: {
      include: {
        product: {
          select: { name: true, images: true },
        },
      },
    },
    customer: {
      select: { firstName: true, telegramId: true },
    },
  },
});

// ❌ Mal: N+1 queries
const order = await prisma.order.findUnique({ where: { id: 1 } });
const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
for (const item of items) {
  const product = await prisma.product.findUnique({ where: { id: item.productId } });
}
```

### Connection Pooling

```env
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=10"
```

### Read Replicas (futuro)

```typescript
// prisma/schema.prisma (futuro)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // directUrl = env("DIRECT_URL") // para migrations
}
```

### Partitioning (futuro)

```sql
-- Particionar analytics_events por mes
CREATE TABLE analytics_events_2024_06 PARTITION OF analytics_events
FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
```

---

## Comandos Prisma

### Comandos Esenciales

```bash
# Generar Prisma Client (después de cambiar schema)
npx prisma generate

# Crear migración (desarrollo)
npx prisma migrate dev --name descripcion

# Aplicar migraciones (producción)
npx prisma migrate deploy

# Resetear base de datos (⚠️ borra datos)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status

# Seed de datos
npx prisma db seed

# Abrir Prisma Studio (UI web)
npx prisma studio

# Formatear schema
npx prisma format

# Validar schema
npx prisma validate

# Introspect DB existente
npx prisma db pull

# Push schema (sin migraciones)
npx prisma db push
```

### Prisma Studio

```bash
npx prisma studio
# Abre http://localhost:5555
```

---

## Backup y Restore

### Backup

```bash
# Backup completo
pg_dump -h localhost -U postgres -d vendy > backup_$(date +%Y%m%d).sql

# Backup solo schema
pg_dump -h localhost -U postgres -d vendy --schema-only > schema.sql

# Backup solo datos
pg_dump -h localhost -U postgres -d vendy --data-only > data.sql

# Backup comprimido
pg_dump -h localhost -U postgres -d vendy | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore

```bash
# Restore completo
psql -h localhost -U postgres -d vendy < backup_20240615.sql

# Restore desde comprimido
gunzip -c backup_20240615.sql.gz | psql -h localhost -U postgres -d vendy

# Restore schema primero, luego datos
psql -h localhost -U postgres -d vendy < schema.sql
psql -h localhost -U postgres -d vendy < data.sql
```

### Backup Automatizado (Docker)

```bash
# Backup diario con cron
0 2 * * * docker exec vendy-postgres pg_dump -U postgres vendy | gzip > /backups/vendy_$(date +\%Y\%m\%d).sql.gz

# Retención: eliminar backups de más de 7 días
0 3 * * * find /backups -name "vendy_*.sql.gz" -mtime +7 -delete
```

---

## Troubleshooting

### Error: "Migration lock timeout"

```bash
# Verificar migraciones bloqueadas
docker exec vendy-postgres psql -U postgres -d vendy -c "SELECT * FROM _prisma_migrations WHERE started_at IS NOT NULL AND finished_at IS NULL;"

# Liberar bloqueo
docker exec vendy-postgres psql -U postgres -d vendy -c "UPDATE _prisma_migrations SET finished_at = NOW() WHERE id = '...';"
```

### Error: "Database connection failed"

```bash
# Verificar PostgreSQL
docker compose ps postgres
docker compose logs postgres

# Verificar conectividad
docker compose exec postgres pg_isready -U postgres

# Resetear conexiones
docker compose restart postgres
```

### Error: "Prisma Client is not generated"

```bash
cd apps/api
npx prisma generate
```

---

## Referencias

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/15/indexes-types.html)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/15/textsearch.html)
