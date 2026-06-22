import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';

describe('useCart', () => {
  it('initializes with empty cart', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toEqual([]);
    expect(result.current.summary.itemCount).toBe(0);
    expect(result.current.summary.total).toBe(0);
  });

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({
        productId: 1,
        name: 'Test Product',
        price: 100,
        currency: 'USD',
      });
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.summary.itemCount).toBe(1);
  });

  it('increments quantity when adding existing item', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD' });
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD' });
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('respects max stock', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD', maxStock: 2 });
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD', maxStock: 2 });
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD', maxStock: 2 });
    });
    
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('removes item', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD' });
      result.current.removeItem(1);
    });
    
    expect(result.current.items).toHaveLength(0);
  });

  it('updates quantity', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD' });
      result.current.updateQuantity(1, 5);
    });
    
    expect(result.current.items[0].quantity).toBe(5);
  });

  it('removes item when quantity set to 0', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD' });
      result.current.updateQuantity(1, 0);
    });
    
    expect(result.current.items).toHaveLength(0);
  });

  it('calculates subtotal correctly', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'A', price: 100, currency: 'USD' });
      result.current.addItem({ productId: 2, name: 'B', price: 50, currency: 'USD' });
      result.current.updateQuantity(2, 3);
    });
    
    expect(result.current.summary.subtotal).toBe(250); // 100 + 50*3
    expect(result.current.summary.itemCount).toBe(4); // 1 + 3
  });

  it('applies percentage coupon', async () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD' });
    });
    
    await act(async () => {
      await result.current.applyCoupon('WELCOME10');
    });
    
    expect(result.current.coupon).toBeTruthy();
    expect(result.current.summary.discount).toBe(10); // 10% of 100
  });

  it('applies fixed coupon', async () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD' });
    });
    
    await act(async () => {
      await result.current.applyCoupon('FLAT20');
    });
    
    expect(result.current.summary.discount).toBe(20);
  });

  it('rejects invalid coupon', async () => {
    const { result } = renderHook(() => useCart());
    
    let response;
    await act(async () => {
      response = await result.current.applyCoupon('INVALID');
    });
    
    expect(response.success).toBe(false);
    expect(result.current.coupon).toBeNull();
  });

  it('removes coupon', async () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD' });
    });
    
    await act(async () => {
      await result.current.applyCoupon('WELCOME10');
    });
    
    act(() => {
      result.current.removeCoupon();
    });
    
    expect(result.current.coupon).toBeNull();
    expect(result.current.summary.discount).toBe(0);
  });

  it('calculates shipping', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.calculateShipping('PY', '');
    });
    
    expect(result.current.summary.shipping).toBe(15);
  });

  it('calculates total with all components', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD' });
      result.current.calculateShipping('PY', '');
    });
    
    // subtotal: 100, discount: 0, shipping: 15, tax: 5.75 (5% of 100), total: 120.75
    expect(result.current.summary.subtotal).toBe(100);
    expect(result.current.summary.tax).toBe(5);
    expect(result.current.summary.total).toBe(120);
  });

  it('clears cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD' });
      result.current.clearCart();
    });
    
    expect(result.current.items).toHaveLength(0);
    expect(result.current.coupon).toBeNull();
  });

  it('handles variants', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({
        productId: 1,
        name: 'Shirt',
        price: 50,
        currency: 'USD',
        variants: [{ name: 'Size', value: 'M' }],
      });
      result.current.addItem({
        productId: 1,
        name: 'Shirt',
        price: 50,
        currency: 'USD',
        variants: [{ name: 'Size', value: 'L' }],
      });
    });
    
    // Should be 2 separate items because variants differ
    expect(result.current.items).toHaveLength(2);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ productId: 1, name: 'Test', price: 100, currency: 'USD' });
    });
    
    const stored = localStorage.getItem('vendy_cart');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toHaveLength(1);
  });
});
