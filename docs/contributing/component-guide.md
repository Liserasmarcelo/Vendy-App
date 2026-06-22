# Guía de Componentes React

> Estándares y patrones para componentes React en el Mini-App.

---

## Estructura de un Componente

```tsx
// 1. Imports
import React from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import type { Product } from '@vendy/shared-types';

// 2. Types/Interfaces
interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  className?: string;
}

// 3. Componente
export function ProductCard({
  product,
  onAddToCart,
  className,
}: ProductCardProps) {
  // 4. State
  const [isLoading, setIsLoading] = React.useState(false);
  
  // 5. Handlers
  const handleAddToCart = async () => {
    if (!onAddToCart) return;
    
    setIsLoading(true);
    try {
      await onAddToCart(product);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 6. Render
  return (
    <div className={cn('product-card', className)}>
      {/* ... */}
    </div>
  );
}

// 7. Default export (opcional)
export default ProductCard;
```

---

## Reglas de Componentes

### 1. Un componente por archivo

```tsx
// ✅ Bien
// ProductCard.tsx
export function ProductCard(props: ProductCardProps) { ... }

// ProductList.tsx
export function ProductList(props: ProductListProps) { ... }

// ❌ Mal
// Components.tsx
export function ProductCard() { ... }
export function ProductList() { ... }
export function ProductItem() { ... }
```

### 2. Props siempre tipadas

```tsx
// ✅ Bien
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

// ❌ Mal
function Button(props: any) { ... }
```

### 3. Valores por defecto

```tsx
// ✅ Bien
function Button({
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps) { ... }

// ❌ Mal
function Button(props) {
  const variant = props.variant || 'primary'  // en el body
}
```

### 4. Event handlers con useCallback

```tsx
// ✅ Bien
const handleClick = React.useCallback(() => {
  onClick?.();
}, [onClick]);

// ❌ Mal
function handleClick() {
  onClick();
}
```

### 5. Efectos con cleanup

```tsx
// ✅ Bien
useEffect(() => {
  const controller = new AbortController();
  
  fetchData({ signal: controller.signal });
  
  return () => {
    controller.abort();
  };
}, [id]);

// ❌ Mal
useEffect(() => {
  fetchData();
}, []);
```

---

## Patrones de Componentes

### Compound Components

```tsx
// ✅ Bien
<Tabs>
  <Tabs.List>
    <Tabs.Trigger value="products">Productos</Tabs.Trigger>
    <Tabs.Trigger value="orders">Órdenes</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="products">...</Tabs.Content>
  <Tabs.Content value="orders">...</Tabs.Content>
</Tabs>
```

### Render Props

```tsx
// ✅ Bien
<DataTable
  data={products}
  renderRow={(product) => (
    <ProductRow key={product.id} product={product} />
  )}
/>
```

### Higher-Order Components (evitar)

```tsx
// ❌ Evitar HOCs
const withAuth = (Component) => {
  return (props) => {
    if (!isAuthenticated) return <Login />;
    return <Component {...props} />;
  };
};

// ✅ Usar hooks en su lugar
function useAuth() {
  const [user] = useState(null);
  return { user, isAuthenticated: !!user };
}

function Dashboard() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Login />;
  return <DashboardContent />;
}
```

---

## Estilos

### Tailwind CSS

```tsx
// ✅ Bien
function Button({ variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg px-4 py-2 font-medium transition-colors',
        variant === 'primary' && 'bg-orange-500 text-white hover:bg-orange-600',
        variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        variant === 'danger' && 'bg-red-500 text-white hover:bg-red-600',
      )}
    >
      {children}
    </button>
  );
}

// ❌ Mal
function Button() {
  return <button className="btn btn-primary">{children}</button>
}
```

### CSS Modules (evitar)

```tsx
// ❌ Evitar CSS Modules
import styles from './Button.module.css';

function Button() {
  return <button className={styles.button}>{children}</button>;
}

// ✅ Usar Tailwind + cn()
import { cn } from '@/utils/cn';

function Button({ className }: ButtonProps) {
  return <button className={cn('btn', className)}>{children}</button>;
}
```

---

## Accesibilidad

### ARIA

```tsx
// ✅ Bien
function Dialog({ isOpen, onClose, title }: DialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className={cn('dialog', isOpen && 'dialog--open')}
    >
      <h2 id="dialog-title">{title}</h2>
      <button
        onClick={onClose}
        aria-label="Cerrar diálogo"
      >
        ✕
      </button>
    </div>
  );
}
```

### Keyboard Navigation

```tsx
// ✅ Bien
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <button
      ref={buttonRef}
      onClick={() => setIsOpen(!isOpen)}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      Opciones
    </button>
  );
}
```

---

## Testing

### Component Tests

```tsx
// ✅ Bien
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: 'Camiseta',
    price: 29.99,
    images: ['https://example.com/img.jpg'],
  };

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Camiseta')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('calls onAddToCart when clicked', () => {
    const handleAddToCart = vi.fn();
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={handleAddToCart}
      />
    );
    
    fireEvent.click(screen.getByText('Agregar'));
    expect(handleAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('shows loading state', () => {
    render(<ProductCard product={mockProduct} loading />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});
```

---

## Directorio de Componentes

```
components/
├── ui/                    # Componentes base (Button, Input, Card)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Dialog.tsx
│   ├── Tabs.tsx
│   └── index.ts           # Re-exports
├── forms/                 # Formularios
│   ├── ProductForm.tsx
│   ├── OrderForm.tsx
│   └── LoginForm.tsx
├── layout/                # Layouts
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
├── pages/                 # Páginas
│   ├── Dashboard.tsx
│   ├── ProductsPage.tsx
│   └── OrdersPage.tsx
└── shared/                # Componentes compartidos
    ├── Loading.tsx
    ├── ErrorBoundary.tsx
    └── EmptyState.tsx
```
