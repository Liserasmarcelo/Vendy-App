// Checkout types

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  notes?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'stripe' | 'cash' | 'transfer' | 'crypto';
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface OrderItemInput {
  productId: number;
  quantity: number;
  price: number;
  variants?: Record<string, string>;
}

export interface CreateOrderInput {
  shopId: number;
  items: OrderItemInput[];
  customer: CheckoutFormData;
  paymentMethod: string;
  couponCode?: string;
  shippingCost: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
}

export interface OrderConfirmation {
  orderId: number;
  orderNumber: string;
  status: 'pending' | 'completed' | 'failed';
  paymentUrl?: string;
  qrCode?: string;
  instructions?: string;
  estimatedDelivery?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}
