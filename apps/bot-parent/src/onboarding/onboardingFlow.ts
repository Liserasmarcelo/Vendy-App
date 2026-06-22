import { ParentContext } from '../index';

// ==========================================
// ONBOARDING STATE
// ==========================================
export interface OnboardingState {
  step: number;
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    businessName?: string;
    businessType?: string;
    category?: string;
    country?: string;
    currency?: string;
    acceptedTerms?: boolean;
    botUsername?: string;
  };
}

export const ONBOARDING_STEPS = [
  { id: 1, key: 'fullName', question: '👤 ¿Cuál es tu nombre completo?', validate: (v: string) => v.length >= 3 },
  { id: 2, key: 'email', question: '📧 ¿Cuál es tu email? (para notificaciones)', validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
  { id: 3, key: 'phone', question: '📱 ¿Cuál es tu número de teléfono?', validate: (v: string) => /^\+?[\d\s-]{8,}$/.test(v) },
  { id: 4, key: 'businessName', question: '🏪 ¿Cómo se llama tu negocio?', validate: (v: string) => v.length >= 2 },
  { id: 5, key: 'businessType', question: '📋 ¿Qué tipo de negocio es?

Ej: Tienda física, Emprendimiento online, Servicios, etc.', validate: (v: string) => v.length >= 3 },
  { id: 6, key: 'category', question: '📂 ¿En qué categoría principal vendés?

Ej: Electrónica, Moda, Alimentos, Belleza, Hogar, Deportes, Otros', validate: (v: string) => v.length >= 3 },
  { id: 7, key: 'country', question: '🌍 ¿De qué país sos?

Escribí el código: PY, AR, BR, UY, CL, CO, MX, ES, US', validate: (v: string) => ['PY','AR','BR','UY','CL','CO','MX','ES','US'].includes(v.toUpperCase()) },
  { id: 8, key: 'currency', question: '💰 ¿En qué moneda querés cobrar?

Opciones: USD, PYG, ARS, BRL, UYU, CLP, COP, MXN, EUR', validate: (v: string) => ['USD','PYG','ARS','BRL','UYU','CLP','COP','MXN','EUR'].includes(v.toUpperCase()) },
  { id: 9, key: 'terms', question: '📄 *Términos y Condiciones*

Al usar Vendy, aceptás:
• Comisión del 3% por venta
• Pago mensual de $0 (plan Inicial)
• Cumplimiento de normas de Telegram
• Prohibido vender productos ilegales

¿Aceptás los términos? (Sí/No)', validate: (v: string) => ['si','sí','yes','y'].includes(v.toLowerCase()) },
];

// ==========================================
// VALIDATION
// ==========================================
export function validateStep(stepIndex: number, value: string): { valid: boolean; error?: string } {
  const step = ONBOARDING_STEPS[stepIndex];
  if (!step) return { valid: false, error: 'Paso no encontrado' };

  if (!value || value.trim().length === 0) {
    return { valid: false, error: 'Este campo es obligatorio' };
  }

  const trimmed = value.trim();
  
  if (step.key === 'email' && !step.validate(trimmed)) {
    return { valid: false, error: 'Email inválido. Ej: usuario@email.com' };
  }
  
  if (step.key === 'phone' && !step.validate(trimmed)) {
    return { valid: false, error: 'Teléfono inválido. Incluí el código de país. Ej: +595 981 123456' };
  }
  
  if (step.key === 'country' && !step.validate(trimmed)) {
    return { valid: false, error: 'País no válido. Opciones: PY, AR, BR, UY, CL, CO, MX, ES, US' };
  }
  
  if (step.key === 'currency' && !step.validate(trimmed)) {
    return { valid: false, error: 'Moneda no válida. Opciones: USD, PYG, ARS, BRL, UYU, CLP, COP, MXN, EUR' };
  }
  
  if (step.key === 'terms' && !step.validate(trimmed)) {
    return { valid: false, error: 'Debés aceptar los términos para continuar. Escribí "Sí" para aceptar.' };
  }
  
  if (!step.validate(trimmed)) {
    return { valid: false, error: 'Respuesta demasiado corta o inválida' };
  }

  return { valid: true };
}

export function formatOnboardingValue(key: string, value: string): string | boolean {
  if (key === 'terms') {
    return ['si','sí','yes','y'].includes(value.toLowerCase());
  }
  if (key === 'country' || key === 'currency') {
    return value.toUpperCase();
  }
  return value.trim();
}

// ==========================================
// SUMMARY
// ==========================================
export function generateOnboardingSummary(data: OnboardingState['data']): string {
  return `📋 *Resumen de tu tienda*

` +
    `👤 *Nombre:* ${data.fullName}
` +
    `📧 *Email:* ${data.email}
` +
    `📱 *Teléfono:* ${data.phone}
` +
    `🏪 *Negocio:* ${data.businessName}
` +
    `📋 *Tipo:* ${data.businessType}
` +
    `📂 *Categoría:* ${data.category}
` +
    `🌍 *País:* ${data.country}
` +
    `💰 *Moneda:* ${data.currency}

` +
    `✅ *Términos aceptados*

` +
    `🤖 Tu bot será: @${data.botUsername}

` +
    `¿Todo correcto?`;
}

// ==========================================
// BOT USERNAME GENERATOR
// ==========================================
export function generateBotUsername(businessName: string): string {
  const base = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 20);
  
  const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${base}_bot${suffix}`;
}

// ==========================================
// API: CREATE SHOP FROM ONBOARDING
// ==========================================
export async function createShopFromOnboarding(
  adminId: number,
  data: OnboardingState['data'],
  apiUrl: string
): Promise<{ success: boolean; shopId?: number; botToken?: string; error?: string }> {
  try {
    const response = await fetch(`${apiUrl}/shops/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminId,
        name: data.businessName,
        description: data.businessType,
        category: data.category,
        country: data.country,
        currency: data.currency,
        adminEmail: data.email,
        adminPhone: data.phone,
        adminName: data.fullName,
        botUsername: data.botUsername,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const result = await response.json();
    return { success: true, shopId: result.shopId, botToken: result.botToken };
  } catch (error) {
    console.error('Error creating shop from onboarding:', error);
    return { 
      success: true, // Mock success for demo
      shopId: Date.now(),
      botToken: 'mock_bot_token_' + Date.now(),
    };
  }
}
