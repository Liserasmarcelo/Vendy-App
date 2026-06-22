import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { useTelegram } from '../context/TelegramContext';
import { CheckoutFormData, PaymentMethod, CreateOrderInput, OrderConfirmation } from '../types/checkout';
import { validateCheckoutForm } from '../utils/validation';
import { CartItem } from './useCart';

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'stripe',
    type: 'stripe',
    name: 'Tarjeta de Crédito/Débito',
    description: 'Pago seguro con Stripe',
    icon: '💳',
    enabled: true,
  },
  {
    id: 'cash',
    type: 'cash',
    name: 'Efectivo',
    description: 'Pagá al recibir tu pedido',
    icon: '💵',
    enabled: true,
  },
  {
    id: 'transfer',
    type: 'transfer',
    name: 'Transferencia Bancaria',
    description: 'Transferí a nuestra cuenta',
    icon: '🏦',
    enabled: true,
  },
  {
    id: 'crypto',
    type: 'crypto',
    name: 'Crypto (USDT)',
    description: 'Pagá con USDT en red TRC20',
    icon: '₿',
    enabled: false, // Disabled by default
  },
];

export function useCheckout() {
  const { request } = useApi();
  const { haptic, mainButton } = useTelegram();
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    notes: '',
  });
  const [selectedPayment, setSelectedPayment] = useState('stripe');
  const [errors, setErrors] = useState<ReturnType<typeof validateCheckoutForm>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  const updateField = useCallback((field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const selectPayment = useCallback((methodId: string) => {
    haptic.impact('light');
    setSelectedPayment(methodId);
  }, [haptic]);

  const validate = useCallback(() => {
    const validationErrors = validateCheckoutForm(formData);
    setErrors(validationErrors);
    return validationErrors.length === 0;
  }, [formData]);

  const submitOrder = useCallback(async (cartItems: CartItem[], summary: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
  }, shopId: number, currency: string) => {
    if (!validate()) {
      haptic.notification('error');
      return { success: false, error: 'Por favor, corregí los errores en el formulario' };
    }

    setIsSubmitting(true);
    haptic.impact('medium');

    try {
      const orderData: CreateOrderInput = {
        shopId,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          variants: item.variants?.reduce((acc, v) => ({ ...acc, [v.name]: v.value }), {}),
        })),
        customer: formData,
        paymentMethod: selectedPayment,
        shippingCost: summary.shipping,
        subtotal: summary.subtotal,
        discount: summary.discount,
        tax: summary.tax,
        total: summary.total,
        currency,
      };

      // In production, this would be a real API call
      // const response = await request<OrderConfirmation>('/orders', {
      //   method: 'POST',
      //   body: orderData,
      // });

      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockConfirmation: OrderConfirmation = {
        orderId: Math.floor(Math.random() * 100000),
        orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}`,
        status: selectedPayment === 'stripe' ? 'pending' : 'completed',
        paymentUrl: selectedPayment === 'stripe' ? 'https://stripe.com/pay/mock' : undefined,
        instructions: selectedPayment === 'transfer' 
          ? 'Transferí el total a: Banco Itaú, Cuenta: 123456789, Titular: Vendy S.A.'
          : selectedPayment === 'cash'
          ? 'Pagá al recibir tu pedido. El delivery te contactará.'
          : undefined,
        estimatedDelivery: '3-5 días hábiles',
      };

      setConfirmation(mockConfirmation);
      haptic.notification('success');
      
      // Show main button if in Telegram
      if (selectedPayment === 'stripe' && mockConfirmation.paymentUrl) {
        mainButton.setText('💳 Pagar ahora');
        mainButton.show();
      }

      return { success: true, confirmation: mockConfirmation };
    } catch (err) {
      haptic.notification('error');
      return { success: false, error: (err as Error).message };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedPayment, validate, haptic, request, mainButton]);

  return {
    formData,
    updateField,
    selectedPayment,
    selectPayment,
    paymentMethods: PAYMENT_METHODS,
    errors,
    isSubmitting,
    confirmation,
    submitOrder,
    validate,
  };
}
