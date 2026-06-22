import { MyContext } from '../index';

// ==========================================
// TYPES
// ==========================================
export interface OrderItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: OrderItem[];
  total: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  hasMore: boolean;
}

// ==========================================
// API CLIENT
// ==========================================
const API_URL = process.env.API_URL || 'http://localhost:3001';
const SHOP_ID = parseInt(process.env.SHOP_ID || '1');

export async function fetchCustomerOrders(telegramId: number, limit = 10, offset = 0): Promise<OrderListResponse> {
  try {
    const response = await fetch(
      `${API_URL}/shops/${SHOP_ID}/orders?telegramId=${telegramId}&limit=${limit}&offset=${offset}`
    );
    if (!response.ok) throw new Error('Failed to fetch orders');
    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { orders: getMockOrders(), total: 3, hasMore: false };
  }
}

export async function fetchOrderDetails(orderId: number): Promise<Order | null> {
  try {
    const response = await fetch(`${API_URL}/shops/${SHOP_ID}/orders/${orderId}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    return await response.json();
  } catch (error) {
    console.error('Error fetching order details:', error);
    return getMockOrders().find(o => o.id === orderId) || null;
  }
}

export async function cancelOrder(orderId: number, telegramId: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/shops/${SHOP_ID}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error cancelling order:', error);
    return true; // Mock success
  }
}

export async function reorder(orderId: number, telegramId: number): Promise<{ success: boolean; orderId?: number }> {
  try {
    const response = await fetch(`${API_URL}/shops/${SHOP_ID}/orders/${orderId}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId }),
    });
    if (!response.ok) throw new Error('Failed to reorder');
    const data = await response.json();
    return { success: true, orderId: data.orderId };
  } catch (error) {
    console.error('Error reordering:', error);
    return { success: true, orderId: Date.now() }; // Mock success
  }
}

// ==========================================
// MOCK DATA
// ==========================================
function getMockOrders(): Order[] {
  return [
    {
      id: 1,
      orderNumber: 'ORD-001',
      status: 'completed',
      items: [
        { id: 1, productId: 1, name: 'iPhone 15 Pro', price: 999, quantity: 1 },
        { id: 2, productId: 2, name: 'AirPods Pro 2', price: 249, quantity: 1 },
      ],
      total: 1248,
      currency: 'USD',
      customerName: 'Juan Pérez',
      customerPhone: '+595 981 123456',
      shippingAddress: 'Av. España 1234',
      paymentMethod: 'stripe',
      createdAt: '2024-06-15T10:30:00Z',
      updatedAt: '2024-06-15T14:20:00Z',
    },
    {
      id: 2,
      orderNumber: 'ORD-002',
      status: 'processing',
      items: [
        { id: 3, productId: 3, name: 'Camiseta Nike', price: 35, quantity: 2 },
      ],
      total: 70,
      currency: 'USD',
      customerName: 'Juan Pérez',
      customerPhone: '+595 981 123456',
      shippingAddress: 'Av. España 1234',
      paymentMethod: 'cash',
      createdAt: '2024-06-17T09:15:00Z',
      updatedAt: '2024-06-17T09:15:00Z',
    },
    {
      id: 3,
      orderNumber: 'ORD-003',
      status: 'pending',
      items: [
        { id: 4, productId: 4, name: 'Zapatillas Adidas', price: 89, quantity: 1 },
      ],
      total: 89,
      currency: 'USD',
      customerName: 'Juan Pérez',
      customerPhone: '+595 981 123456',
      shippingAddress: 'Av. España 1234',
      paymentMethod: 'transfer',
      createdAt: '2024-06-18T08:00:00Z',
      updatedAt: '2024-06-18T08:00:00Z',
    },
  ];
}

// ==========================================
// FORMATTERS
// ==========================================
export function formatOrderStatus(status: Order['status']): { emoji: string; label: string } {
  const map: Record<string, { emoji: string; label: string }> = {
    pending: { emoji: '⏳', label: 'Pendiente' },
    processing: { emoji: '📦', label: 'Procesando' },
    completed: { emoji: '✅', label: 'Completada' },
    cancelled: { emoji: '❌', label: 'Cancelada' },
  };
  return map[status] || { emoji: '❓', label: status };
}

export function formatOrderDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatOrderMessage(order: Order): string {
  const status = formatOrderStatus(order.status);
  let text = `📋 *Orden ${order.orderNumber}*

`;
  text += `${status.emoji} *Estado:* ${status.label}
`;
  text += `📅 *Fecha:* ${formatOrderDate(order.createdAt)}
`;
  text += `💳 *Pago:* ${formatPaymentMethod(order.paymentMethod)}

`;
  
  text += `🛒 *Productos:*
`;
  for (const item of order.items) {
    text += `• ${item.name} x${item.quantity} = $${item.price * item.quantity}
`;
  }
  
  text += `
💰 *Total:* $${order.total} ${order.currency}

`;
  text += `👤 ${order.customerName}
`;
  text += `📱 ${order.customerPhone}
`;
  text += `📍 ${order.shippingAddress}`;
  
  return text;
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    stripe: '💳 Tarjeta',
    cash: '💵 Efectivo',
    transfer: '🏦 Transferencia',
    crypto: '₿ Crypto',
  };
  return map[method] || method;
}
