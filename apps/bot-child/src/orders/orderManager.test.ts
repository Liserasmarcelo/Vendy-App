import { describe, it, expect, vi } from 'vitest';
import {
  Order,
  formatOrderStatus,
  formatOrderDate,
  formatOrderMessage,
  fetchCustomerOrders,
  fetchOrderDetails,
  cancelOrder,
  reorder,
} from './orderManager';

// Mock fetch
vi.stubGlobal('fetch', vi.fn());

describe('formatOrderStatus', () => {
  it('formats pending', () => {
    const result = formatOrderStatus('pending');
    expect(result.emoji).toBe('⏳');
    expect(result.label).toBe('Pendiente');
  });

  it('formats processing', () => {
    const result = formatOrderStatus('processing');
    expect(result.emoji).toBe('📦');
    expect(result.label).toBe('Procesando');
  });

  it('formats completed', () => {
    const result = formatOrderStatus('completed');
    expect(result.emoji).toBe('✅');
    expect(result.label).toBe('Completada');
  });

  it('formats cancelled', () => {
    const result = formatOrderStatus('cancelled');
    expect(result.emoji).toBe('❌');
    expect(result.label).toBe('Cancelada');
  });

  it('handles unknown status', () => {
    const result = formatOrderStatus('unknown' as any);
    expect(result.emoji).toBe('❓');
    expect(result.label).toBe('unknown');
  });
});

describe('formatOrderDate', () => {
  it('formats ISO date', () => {
    const result = formatOrderDate('2024-06-15T10:30:00Z');
    expect(result).toContain('15');
    expect(result).toContain('jun');
    expect(result).toContain('2024');
  });
});

describe('formatOrderMessage', () => {
  const mockOrder: Order = {
    id: 1,
    orderNumber: 'ORD-001',
    status: 'completed',
    items: [
      { id: 1, productId: 1, name: 'iPhone', price: 999, quantity: 1 },
    ],
    total: 999,
    currency: 'USD',
    customerName: 'Juan',
    customerPhone: '+595',
    shippingAddress: 'Av. España',
    paymentMethod: 'stripe',
    createdAt: '2024-06-15T10:30:00Z',
    updatedAt: '2024-06-15T14:20:00Z',
  };

  it('includes order number', () => {
    const message = formatOrderMessage(mockOrder);
    expect(message).toContain('ORD-001');
  });

  it('includes status', () => {
    const message = formatOrderMessage(mockOrder);
    expect(message).toContain('Completada');
  });

  it('includes items', () => {
    const message = formatOrderMessage(mockOrder);
    expect(message).toContain('iPhone');
    expect(message).toContain('999');
  });

  it('includes total', () => {
    const message = formatOrderMessage(mockOrder);
    expect(message).toContain('$999');
  });

  it('includes customer info', () => {
    const message = formatOrderMessage(mockOrder);
    expect(message).toContain('Juan');
    expect(message).toContain('+595');
    expect(message).toContain('Av. España');
  });

  it('includes payment method', () => {
    const message = formatOrderMessage(mockOrder);
    expect(message).toContain('Tarjeta');
  });
});

describe('fetchCustomerOrders', () => {
  it('returns mock orders on error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    const result = await fetchCustomerOrders(123);
    expect(result.orders).toHaveLength(3);
    expect(result.total).toBe(3);
  });
});

describe('fetchOrderDetails', () => {
  it('returns mock order on error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    const result = await fetchOrderDetails(1);
    expect(result).toBeTruthy();
    expect(result?.orderNumber).toBe('ORD-001');
  });
});

describe('cancelOrder', () => {
  it('returns true on success', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    const result = await cancelOrder(1, 123);
    expect(result).toBe(true);
  });

  it('returns mock true on error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    const result = await cancelOrder(1, 123);
    expect(result).toBe(true);
  });
});

describe('reorder', () => {
  it('returns success on API call', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ orderId: 123 }),
    } as Response);
    const result = await reorder(1, 123);
    expect(result.success).toBe(true);
    expect(result.orderId).toBe(123);
  });

  it('returns mock success on error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    const result = await reorder(1, 123);
    expect(result.success).toBe(true);
  });
});
