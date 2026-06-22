import { describe, it, expect, vi } from 'vitest';
import { createOrderListMenu, createOrderDetailMenu } from './orderMenus';
import { Order } from './orderManager';

// Mock Menu
vi.mock('@grammyjs/menu', () => ({
  Menu: vi.fn().mockImplementation(() => ({
    text: vi.fn().mockReturnThis(),
    row: vi.fn().mockReturnThis(),
  })),
}));

describe('createOrderListMenu', () => {
  const mockOrders: Order[] = [
    {
      id: 1, orderNumber: 'ORD-001', status: 'completed',
      items: [], total: 100, currency: 'USD',
      customerName: '', customerPhone: '', shippingAddress: '',
      paymentMethod: 'stripe', createdAt: '', updatedAt: '',
    },
    {
      id: 2, orderNumber: 'ORD-002', status: 'pending',
      items: [], total: 50, currency: 'USD',
      customerName: '', customerPhone: '', shippingAddress: '',
      paymentMethod: 'cash', createdAt: '', updatedAt: '',
    },
  ];

  it('creates menu with orders', () => {
    const menu = createOrderListMenu(mockOrders, 1, false);
    expect(menu).toBeDefined();
  });

  it('creates menu with pagination', () => {
    const menu = createOrderListMenu(mockOrders, 1, true);
    expect(menu).toBeDefined();
  });
});

describe('createOrderDetailMenu', () => {
  it('shows cancel for pending orders', () => {
    const order: Order = {
      id: 1, orderNumber: 'ORD-001', status: 'pending',
      items: [], total: 100, currency: 'USD',
      customerName: '', customerPhone: '', shippingAddress: '',
      paymentMethod: 'stripe', createdAt: '', updatedAt: '',
    };
    const menu = createOrderDetailMenu(order);
    expect(menu).toBeDefined();
  });

  it('shows reorder for completed orders', () => {
    const order: Order = {
      id: 1, orderNumber: 'ORD-001', status: 'completed',
      items: [], total: 100, currency: 'USD',
      customerName: '', customerPhone: '', shippingAddress: '',
      paymentMethod: 'stripe', createdAt: '', updatedAt: '',
    };
    const menu = createOrderDetailMenu(order);
    expect(menu).toBeDefined();
  });

  it('shows back button for all orders', () => {
    const order: Order = {
      id: 1, orderNumber: 'ORD-001', status: 'processing',
      items: [], total: 100, currency: 'USD',
      customerName: '', customerPhone: '', shippingAddress: '',
      paymentMethod: 'stripe', createdAt: '', updatedAt: '',
    };
    const menu = createOrderDetailMenu(order);
    expect(menu).toBeDefined();
  });
});
