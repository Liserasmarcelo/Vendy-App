import { FastifyRequest, FastifyReply } from 'fastify';

// ==========================================
// LOCALE MIDDLEWARE
// ==========================================
export type SupportedLocale = 'es' | 'en' | 'pt';
export const DEFAULT_LOCALE: SupportedLocale = 'es';
export const SUPPORTED_LOCALES: SupportedLocale[] = ['es', 'en', 'pt'];

export function getLocaleFromRequest(request: FastifyRequest): SupportedLocale {
  // Check query param
  const queryLang = (request.query as any)?.lang;
  if (queryLang && SUPPORTED_LOCALES.includes(queryLang)) {
    return queryLang;
  }

  // Check header
  const headerLang = request.headers['accept-language'];
  if (headerLang) {
    const preferred = headerLang.split(',')[0].split('-')[0].toLowerCase();
    if (SUPPORTED_LOCALES.includes(preferred as SupportedLocale)) {
      return preferred as SupportedLocale;
    }
  }

  // Check user preference
  const user = (request as any).user;
  if (user?.locale && SUPPORTED_LOCALES.includes(user.locale)) {
    return user.locale;
  }

  return DEFAULT_LOCALE;
}

export function localeMiddleware(request: FastifyRequest, reply: FastifyReply, done: () => void) {
  const locale = getLocaleFromRequest(request);
  (request as any).locale = locale;
  done();
}

// Translation helper for backend
export function translate(key: string, locale: SupportedLocale = 'es', params?: Record<string, string>): string {
  // In production, load from JSON files
  const translations: Record<SupportedLocale, Record<string, string>> = {
    es: {
      'order.created': 'Orden creada',
      'order.updated': 'Orden actualizada',
      'payment.received': 'Pago recibido',
      'payment.failed': 'Pago fallido',
      'welcome': 'Bienvenido a Vendy',
    },
    en: {
      'order.created': 'Order created',
      'order.updated': 'Order updated',
      'payment.received': 'Payment received',
      'payment.failed': 'Payment failed',
      'welcome': 'Welcome to Vendy',
    },
    pt: {
      'order.created': 'Pedido criado',
      'order.updated': 'Pedido atualizado',
      'payment.received': 'Pagamento recebido',
      'payment.failed': 'Pagamento falhou',
      'welcome': 'Bem-vindo ao Vendy',
    },
  };

  let text = translations[locale]?.[key] || translations[DEFAULT_LOCALE][key] || key;

  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{{${param}}}`, value);
    });
  }

  return text;
}
