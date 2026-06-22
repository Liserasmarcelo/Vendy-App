import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';

export interface CartItemVariant {
  name: string;
  value: string;
}

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  originalPrice?: number;
  currency: string;
  quantity: number;
  image?: string;
  variants?: CartItemVariant[];
  maxStock?: number;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder?: number;
}

const CART_STORAGE_KEY = 'vendy_cart';

export function useCart() {
  const { request } = useApi();
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [taxRate] = useState(0.05); // 5% tax

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Omit<CartItem, 'quantity' | 'id'>) => {
    setItems(prev => {
      // Generate unique id based on product + variants
      const variantKey = product.variants?.map(v => `${v.name}:${v.value}`).join('|') || '';
      const itemId = product.productId + (variantKey ? `-${variantKey}` : '');
      
      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        // Check max stock
        const newQuantity = Math.min(
          existing.quantity + 1,
          product.maxStock || Infinity
        );
        if (newQuantity === existing.quantity) return prev; // No change
        
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      return [...prev, { ...product, id: itemId, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: number | string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        // Respect max stock
        const maxQty = item.maxStock || Infinity;
        return { ...item, quantity: Math.min(quantity, maxQty) };
      })
    );
  }, [removeItem]);

  const updateVariants = useCallback((id: number | string, variants: CartItemVariant[]) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, variants } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCoupon(null);
    setShippingCost(0);
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    // In real app, validate via API
    // const response = await request<{ coupon: Coupon }>(`/coupons/validate`, {
    //   method: 'POST',
    //   body: { code },
    // });
    
    // Mock validation
    const mockCoupons: Record<string, Coupon> = {
      'WELCOME10': { code: 'WELCOME10', type: 'percentage', value: 10, minOrder: 50 },
      'FLAT20': { code: 'FLAT20', type: 'fixed', value: 20 },
    };
    
    const found = mockCoupons[code.toUpperCase()];
    if (found) {
      setCoupon(found);
      return { success: true, coupon: found };
    }
    return { success: false, error: 'Cupón inválido o expirado' };
  }, []);

  const removeCoupon = useCallback(() => {
    setCoupon(null);
  }, []);

  const calculateShipping = useCallback((country: string, city: string) => {
    // Mock shipping calculation
    const baseRate = 15;
    const countryMultiplier: Record<string, number> = {
      'PY': 1, 'AR': 1.2, 'BR': 1.5, 'UY': 1.3, 'CL': 1.4,
      'CO': 1.3, 'MX': 1.6, 'ES': 2, 'US': 2, 'OTHER': 2.5,
    };
    const cost = baseRate * (countryMultiplier[country] || 2.5);
    setShippingCost(cost);
    return cost;
  }, []);

  // Computed summary
  const summary: CartSummary = (() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate discount
    let discount = 0;
    if (coupon) {
      if (coupon.minOrder && subtotal < coupon.minOrder) {
        // Coupon doesn't apply
      } else if (coupon.type === 'percentage') {
        discount = subtotal * (coupon.value / 100);
      } else {
        discount = Math.min(coupon.value, subtotal);
      }
    }
    
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * taxRate;
    const total = afterDiscount + tax + shippingCost;
    
    return { subtotal, discount, shipping: shippingCost, tax, total, itemCount };
  })();

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateVariants,
    clearCart,
    coupon,
    applyCoupon,
    removeCoupon,
    calculateShipping,
    summary,
  };
}
