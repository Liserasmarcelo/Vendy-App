# Guía de Estilo de Código

> Estándares de código para el proyecto Vendy.

---

## TypeScript

### Nomenclatura

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Variables | camelCase | `userName`, `totalAmount` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Funciones | camelCase | `getUserById()` |
| Clases | PascalCase | `OrderManager` |
| Interfaces | PascalCase | `User`, `OrderPayload` |
| Tipos | PascalCase | `OrderStatus` |
| Enums | PascalCase | `OrderStatusEnum` |
| Archivos | kebab-case | `order-manager.ts` |
| Directorios | kebab-case | `order-manager/` |

### Reglas Generales

```typescript
// ✅ Bien
const MAX_RETRY_COUNT = 3;

interface User {
  id: string;
  email: string;
  name: string;
}

function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

class OrderManager {
  constructor(private prisma: PrismaClient) {}

  async createOrder(data: CreateOrderInput): Promise<Order> {
    return this.prisma.order.create({ data });
  }
}

// ❌ Mal
const maxRetryCount = 3;  // constante en camelCase

interface user {  // interface en minúscula
  id: string
  email: string
}

function get_user(id) {  // snake_case, sin tipos
  return prisma.user.findUnique({where:{id}})
}
```

### Imports

```typescript
// ✅ Bien
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getUserById } from './user-manager';
import type { User } from '@vendy/shared-types';

// ❌ Mal
import * as fastify from 'fastify'  // import * innecesario
import {getUserById} from './user-manager'  // espacios faltantes
```

### Funciones

```typescript
// ✅ Bien
async function processPayment(orderId: number): Promise<PaymentResult> {
  const order = await getOrderById(orderId);
  
  if (!order) {
    throw new OrderNotFoundError(orderId);
  }
  
  if (order.status !== 'pending') {
    throw new InvalidOrderStatusError(order.status);
  }
  
  return await paymentProvider.charge(order);
}

// ❌ Mal
async function processPayment(orderId) {  // sin tipos
  const order = await getOrderById(orderId)
  if (!order) throw new Error('not found')  // error genérico
  if (order.status != 'pending') throw new Error('invalid')  // != en lugar de !==
  return paymentProvider.charge(order)  // sin await
}
```

### Manejo de Errores

```typescript
// ✅ Bien
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn('Validation failed', { error: error.message });
    throw new BadRequestError(error.message);
  }
  
  if (error instanceof DatabaseError) {
    logger.error('Database error', { error: error.message });
    throw new InternalServerError('Database operation failed');
  }
  
  logger.error('Unexpected error', { error });
  throw new InternalServerError('An unexpected error occurred');
}

// ❌ Mal
try {
  return await riskyOperation();
} catch (e) {
  console.log(e);  // console.log en lugar de logger
  throw e;  // relanza error sin procesar
}
```

---

## React / Mini-App

### Componentes

```typescript
// ✅ Bien
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  return (
    <button
      className={cn('btn', `btn--${variant}`, className)}
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  );
}

// ❌ Mal
function Button(props) {  // sin tipos
  return (
    <button onClick={props.onClick}>  // sin type, sin disabled
      {props.children}
    </button>
  )
}
```

### Hooks

```typescript
// ✅ Bien
export function useOrders(shopId: number) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      try {
        setLoading(true);
        const data = await api.getOrders(shopId);
        if (!cancelled) {
          setOrders(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchOrders();

    return () => { cancelled = true; };
  }, [shopId]);

  return { orders, loading, error, refetch: fetchOrders };
}

// ❌ Mal
function useOrders(shopId) {  // sin tipos
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchOrders()  // sin cleanup
  }, [])  // sin dependencias

  async function fetchOrders() {
    const data = await api.getOrders(shopId)
    setOrders(data)
  }

  return { orders, loading }
}
```

### JSX

```tsx
// ✅ Bien
export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="product-card">
      <img
        src={product.images[0]}
        alt={product.name}
        className="product-card__image"
        loading="lazy"
      />
      <div className="product-card__content">
        <h3 className="product-card__title">{product.name}</h3>
        <p className="product-card__price">
          ${product.price.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// ❌ Mal
function ProductCard(props) {
  return <div>
    <img src={props.product.image} />  {/* sin alt, sin className */}
    <h3>{props.product.name}</h3>
    <p>${props.product.price}</p>  {/* sin toFixed */}
  </div>
}
```

---

## Fastify / Backend

### Rutas

```typescript
// ✅ Bien
export async function registerProductRoutes(fastify: FastifyInstance) {
  fastify.post('/products', {
    schema: {
      body: createProductSchema,
      response: {
        201: { $ref: 'Product#' },
        400: { $ref: 'Error#' },
        401: { $ref: 'Error#' },
      },
    },
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const data = createProductSchema.parse(request.body);
      const product = await fastify.productManager.createProduct(data);
      reply.status(201).send(product);
    },
  });
}

// ❌ Mal
fastify.post('/products', async (req, res) => {
  const product = await createProduct(req.body)  // sin validación
  res.send(product)  // sin status code
})
```

### Managers

```typescript
// ✅ Bien
export class ProductManager {
  constructor(private prisma: PrismaClient) {}

  async createProduct(data: CreateProductInput): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  async getProductById(id: number): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async updateProduct(id: number, data: UpdateProductInput): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async deleteProduct(id: number): Promise<Product> {
    return this.prisma.product.delete({ where: { id } });
  }
}

// ❌ Mal
class ProductManager {  // sin export
  constructor(prisma) {  // sin tipos
    this.prisma = prisma
  }

  async create(data) {  // sin tipos
    return this.prisma.product.create({ data })
  }
}
```

---

## ESLint Configuration

```javascript
// eslint.config.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    
    // React
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // General
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

---

## Prettier Configuration

```javascript
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

---

## Git

### Branches

```
main                    # Producción
├── develop             # Desarrollo
│   ├── feature/123-xxx # Features
│   ├── bugfix/123-xxx  # Bug fixes
│   └── docs/123-xxx    # Documentación
├── hotfix/123-xxx      # Hotfixes urgentes
└── release/1.0.0       # Releases
```

### Commits

```
feat(scope): description

[optional body]

[optional footer]
```

Ejemplos:
```
feat(auth): agrega login con Telegram
fix(payments): corrige webhook de Stripe
docs(api): actualiza ejemplos de curl
refactor(orders): simplifica lógica de cálculo
test(support): agrega tests para TicketManager
```
