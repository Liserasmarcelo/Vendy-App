# Guía de Contribución

> **¡Gracias por tu interés en contribuir a Vendy!** 🎉

---

## Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [Cómo Contribuir](#cómo-contribuir)
3. [Reportar Bugs](#reportar-bugs)
4. [Proponer Features](#proponer-features)
5. [Pull Requests](#pull-requests)
6. [Estándares de Código](#estándares-de-código)
7. [Convenciones de Commits](#convenciones-de-commits)
8. [Estructura de Commits](#estructura-de-commits)
9. [Review Process](#review-process)
10. [Configuración de Desarrollo](#configuración-de-desarrollo)
11. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Código de Conducta

Este proyecto y todos los participantes están gobernados por nuestro [Código de Conducta](CODE_OF_CONDUCT.md). Al participar, se espera que cumplas con estas normas.

**Resumen:**
- Sé respetuoso y constructivo
- Acepta críticas constructivas
- Enfócate en lo que es mejor para la comunidad
- Muestra empatía hacia otros miembros

---

## Cómo Contribuir

### Tipos de Contribuciones

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| 🐛 Bug Fix | Corregir un error | "Fix: corrige cálculo de comisiones" |
| ✨ Feature | Nueva funcionalidad | "Feat: agrega soporte para cupones" |
| 📚 Docs | Documentación | "Docs: actualiza guía de instalación" |
| ♻️ Refactor | Mejora de código | "Refactor: simplifica lógica de pagos" |
| 🧪 Test | Tests | "Test: agrega tests para auth" |
| ⚡ Performance | Optimización | "Perf: reduce queries N+1" |
| 🔧 Config | Configuración | "Config: actualiza ESLint rules" |

### Flujo de Trabajo

```
1. Fork del repositorio
2. Clonar tu fork
3. Crear branch (feature/bugfix/docs)
4. Hacer cambios
5. Ejecutar tests
6. Commit con mensaje descriptivo
7. Push a tu fork
8. Crear Pull Request
9. Code review
10. Merge
```

---

## Reportar Bugs

### Antes de Reportar

- [ ] Buscar en [issues existentes](https://github.com/vendy/vendy/issues)
- [ ] Verificar que es un bug real (no configuración incorrecta)
- [ ] Probar en la última versión

### Template de Bug Report

```markdown
## Descripción
Descripción clara y concisa del bug.

## Pasos para Reproducir
1. Ir a '...'
2. Click en '...'
3. Scroll hasta '...'
4. Ver error

## Comportamiento Esperado
Qué debería pasar.

## Comportamiento Actual
Qué pasa en realidad.

## Screenshots
Si aplica, agregar screenshots.

## Entorno
- OS: [ej. macOS 14]
- Node.js: [ej. 18.17.0]
- Browser: [ej. Chrome 120]
- Versión: [ej. 1.0.0]

## Logs
```
Pegar logs relevantes aquí
```

## Contexto Adicional
Cualquier información adicional.
```

### Severidad

| Label | Descripción | Ejemplo |
|-------|-------------|---------|
| `critical` | Sistema caído, datos corruptos | Pagos no procesan |
| `high` | Feature roto, workaround difícil | Login no funciona |
| `medium` | Feature roto, workaround existe | Filtro de búsqueda falla |
| `low` | Cosmético, no afecta funcionalidad | Typo en mensaje |

---

## Proponer Features

### Template de Feature Request

```markdown
## Resumen
Breve descripción de la feature.

## Motivación
¿Por qué es necesaria? ¿Qué problema resuelve?

## Descripción Detallada
Descripción técnica de la implementación propuesta.

## Alternativas Consideradas
Otras opciones que se consideraron.

## Impacto
¿Qué partes del sistema se verían afectadas?

## Mockups / Diseño
Si aplica, agregar diseños o mockups.

## Tareas
- [ ] Tarea 1
- [ ] Tarea 2
- [ ] Tarea 3
```

---

## Pull Requests

### Antes de Crear un PR

- [ ] Tests pasan: `pnpm test`
- [ ] Linting pasa: `pnpm lint`
- [ ] Type checking pasa: `pnpm typecheck`
- [ ] Documentación actualizada (si aplica)
- [ ] CHANGELOG.md actualizado (si aplica)
- [ ] Commit messages siguen convenciones
- [ ] Branch está actualizada con `main`

### Naming de Branches

```
feature/123-nombre-descriptivo     # Nueva feature
bugfix/123-nombre-descriptivo      # Fix de bug
hotfix/123-nombre-descriptivo      # Fix urgente en producción
docs/123-nombre-descriptivo        # Documentación
refactor/123-nombre-descriptivo    # Refactor
chore/123-nombre-descriptivo       # Tareas de mantenimiento
```

### Template de PR

```markdown
## Descripción
Breve descripción de los cambios.

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación
- [ ] Refactor

## Issues Relacionados
Fixes #123
Relates to #456

## Cambios
- Cambio 1
- Cambio 2
- Cambio 3

## Testing
- [ ] Tests unitarios agregados/actualizados
- [ ] Tests de integración agregados/actualizados
- [ ] Testeado manualmente

## Screenshots
Si aplica, agregar screenshots.

## Checklist
- [ ] Código sigue estándares del proyecto
- [ ] Documentación actualizada
- [ ] Tests pasan
- [ ] No hay console.logs olvidados
- [ ] No hay dependencias nuevas sin justificar
```

### Tamaño de PRs

| Tamaño | Líneas de cambio | Descripción |
|--------|-----------------|-------------|
| Small | < 50 | Fix simple, typo |
| Medium | 50-200 | Feature pequeña, refactor |
| Large | 200-500 | Feature grande, cambio de arquitectura |
| X-Large | > 500 | Debe dividirse en PRs más pequeños |

**Regla:** Si un PR tiene más de 500 líneas de cambio, dividirlo.

---

## Estándares de Código

### TypeScript

#### Nomenclatura

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Variables | camelCase | `userName`, `totalAmount` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Funciones | camelCase | `getUserById()`, `processPayment()` |
| Clases | PascalCase | `OrderManager`, `PaymentService` |
| Interfaces | PascalCase | `User`, `OrderPayload` |
| Tipos | PascalCase | `OrderStatus`, `PaymentMethod` |
| Enums | PascalCase | `OrderStatusEnum` |
| Archivos | kebab-case | `order-manager.ts`, `payment-service.ts` |
| Directorios | kebab-case | `order-manager/`, `payment-service/` |

#### Estilo de Código

```typescript
// ✅ Bien
function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// ❌ Mal
function get_user(id) {
  return prisma.user.findUnique({where:{id}})
}
```

#### Reglas Importantes

1. **Siempre tipar retornos de funciones públicas**
2. **No usar `any`** — usar `unknown` si es necesario
3. **Preferir `const` sobre `let`**
4. **Usar async/await, no callbacks**
5. **Manejar errores con try/catch**
6. **No usar `console.log` en producción** — usar logger

### React / Mini-App

#### Componentes

```typescript
// ✅ Bien
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
}: ButtonProps) {
  return (
    <button
      className={cn('btn', `btn--${variant}`)}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

// ❌ Mal
function Button(props) {
  return <button onClick={props.onClick}>{props.children}</button>
}
```

#### Hooks

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
```

#### Reglas de React

1. **Un componente por archivo** (excepto componentes muy pequeños relacionados)
2. **Props interfaces siempre definidas**
3. **useEffect con cleanup**
4. **No usar useMemo/useCallback innecesariamente**
5. **Key props siempre en listas**
6. **No mutar estado directamente**

### Fastify / Backend

#### Estructura de Rutas

```typescript
// ✅ Bien
// routes/products.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  stock: z.number().int().min(0),
});

export async function registerProductRoutes(fastify: FastifyInstance) {
  fastify.post('/products', {
    schema: {
      body: createProductSchema,
      response: {
        201: { $ref: 'Product#' },
      },
    },
    handler: async (request, reply) => {
      const data = createProductSchema.parse(request.body);
      const product = await fastify.productManager.createProduct(data);
      reply.status(201).send(product);
    },
  });
}
```

#### Managers

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
}

// Singleton
let productManager: ProductManager | null = null;

export function getProductManager(prisma: PrismaClient): ProductManager {
  if (!productManager) {
    productManager = new ProductManager(prisma);
  }
  return productManager;
}
```

---

## Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/).

### Formato

```
type(scope): description

[optional body]

[optional footer]
```

### Tipos

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva feature | `feat(auth): agrega login con Telegram` |
| `fix` | Bug fix | `fix(payments): corrige cálculo de comisiones` |
| `docs` | Documentación | `docs(api): actualiza ejemplos de curl` |
| `style` | Formato (sin cambio de código) | `style(lint): corrige espacios` |
| `refactor` | Refactor | `refactor(orders): simplifica lógica` |
| `perf` | Performance | `perf(db): agrega índice en orders` |
| `test` | Tests | `test(auth): agrega tests de login` |
| `chore` | Tareas | `chore(deps): actualiza prisma` |
| `ci` | CI/CD | `ci(github): agrega workflow de deploy` |
| `build` | Build | `build(docker): optimiza Dockerfile` |
| `revert` | Revert | `revert: revierte "feat: X"` |

### Scopes

| Scope | Descripción |
|-------|-------------|
| `api` | Backend API |
| `bot` | Bots de Telegram |
| `mini-app` | Mini-App React |
| `auth` | Autenticación |
| `payments` | Pagos |
| `orders` | Órdenes |
| `products` | Productos |
| `shops` | Tiendas |
| `support` | Soporte |
| `help` | Centro de ayuda |
| `notifications` | Notificaciones |
| `analytics` | Analytics |
| `docs` | Documentación |
| `config` | Configuración |
| `deps` | Dependencias |

### Ejemplos

```bash
# Feature
feat(auth): agrega refresh token rotation

# Bug fix
fix(payments): corrige webhook de Stripe en modo test

# Documentación
docs(api): agrega ejemplos de paginación

# Refactor
refactor(orders): extrae lógica de cálculo de totales

# Test
test(support): agrega tests para TicketManager

# Performance
perf(db): agrega índice compuesto en orders(shop_id, status)

# Con breaking change
feat(api): cambia respuesta de GET /orders

BREAKING CHANGE: la respuesta ahora incluye pagination object
```

---

## Review Process

### Checklist del Reviewer

- [ ] El código cumple con los estándares
- [ ] Los tests pasan
- [ ] Hay tests para nueva funcionalidad
- [ ] La documentación está actualizada
- [ ] No hay código comentado olvidado
- [ ] No hay console.logs
- [ ] Los nombres son descriptivos
- [ ] No hay duplicación de código
- [ ] El manejo de errores es adecuado
- [ ] No hay problemas de seguridad obvios

### Comentarios de Review

**Constructivos:**
```
❌ "Esto está mal"
✅ "¿Podríamos usar un early return aquí para reducir nesting?"

❌ "No entiendo"
✅ "¿Podrías agregar un comentario explicando por qué usamos este approach?"

❌ "Fix this"
✅ "Considera usar el patrón Strategy aquí para mejor testabilidad"
```

### Aprobaciones

- **1 approval** para PRs pequeños (< 50 líneas)
- **2 approvals** para PRs medianos (50-200 líneas)
- **3 approvals** para PRs grandes (> 200 líneas) o breaking changes

---

## Configuración de Desarrollo

### Instalación

Ver [docs/installation/README.md](docs/installation/README.md)

### Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar todo el stack
pnpm dev:api          # Solo API
pnpm dev:mini-app     # Solo Mini-App
pnpm dev:bot-parent   # Solo Bot Padre
pnpm dev:bot-child    # Solo Bot Hijo

# Build
pnpm build            # Build de todo
pnpm build:packages   # Build de paquetes internos

# Tests
pnpm test             # Tests de todo
pnpm test:watch       # Tests en watch mode
pnpm test:coverage    # Tests con coverage

# Linting
pnpm lint             # ESLint
pnpm lint:fix         # ESLint con fix
pnpm format           # Prettier
pnpm format:check     # Prettier check

# Type checking
pnpm typecheck        # TypeScript sin emit

# Database
pnpm db:migrate       # Ejecutar migraciones
pnpm db:generate      # Generar Prisma Client
pnpm db:seed          # Seed de datos
pnpm db:studio        # Prisma Studio

# Docker
pnpm docker:up        # Levantar infraestructura
pnpm docker:down      # Bajar infraestructura
pnpm docker:logs      # Ver logs
```

### Pre-commit Hooks

```bash
# Instalar hooks
git config core.hooksPath .githooks

# O usar husky
npx husky install
```

Hooks configurados:
- `pre-commit`: lint-staged (ESLint + Prettier)
- `commit-msg`: validación de conventional commits

---

## Preguntas Frecuentes

### ¿Cómo empiezo?

1. Lee la [documentación de arquitectura](docs/architecture/README.md)
2. Configura tu entorno local (docs/installation/README.md)
3. Busca un issue con label `good-first-issue`
4. Comenta en el issue para que te lo asignen

### ¿Qué necesito saber?

- TypeScript (intermedio)
- React (intermedio)
- Node.js (intermedio)
- SQL básico
- Git (intermedio)

### ¿Cómo encuentro qué hacer?

- [Issues abiertos](https://github.com/vendy/vendy/issues)
- Labels: `good-first-issue`, `help-wanted`, `bug`, `feature`
- [Roadmap](docs/roadmap/README.md)

### ¿Cómo obtengo ayuda?

- [GitHub Discussions](https://github.com/vendy/vendy/discussions)
- [Telegram: @vendydev](https://t.me/vendydev)
- Email: dev@vendy.app

### ¿Cómo reporto una vulnerabilidad de seguridad?

Ver [SECURITY.md](SECURITY.md). **No reportes vulnerabilidades en issues públicos.**

---

## Reconocimientos

Los contribuidores serán reconocidos en:

- [README.md](README.md) — Contribuidores principales
- [CHANGELOG.md](CHANGELOG.md) — Por release
- [GitHub Contributors](https://github.com/vendy/vendy/graphs/contributors)

---

## Licencia

Al contribuir, aceptás que tus contribuciones serán licenciadas bajo la [Licencia MIT](LICENSE).
