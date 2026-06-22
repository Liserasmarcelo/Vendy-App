export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  stock: number;
  variants?: Record<string, string[]>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  variants?: Record<string, string>;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: OrderItem[];
  total: number;
  currency: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress?: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Shop {
  id: number;
  name: string;
  description?: string;
  category: string;
  country: string;
  currency: string;
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  plan: 'starter' | 'growth' | 'pro';
  primaryColor: string;
  logo?: string;
  banner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode: string;
  photoUrl?: string;
  isPremium: boolean;
  createdAt: string;
}
