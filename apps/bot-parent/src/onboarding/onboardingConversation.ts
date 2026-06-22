import { createConversation } from '@grammyjs/conversations';
import { ParentContext } from '../index';
import {
  OnboardingState,
  ONBOARDING_STEPS,
  validateStep,
  formatOnboardingValue,
  generateOnboardingSummary,
  generateBotUsername,
  createShopFromOnboarding,
} from './onboardingFlow';

const CONFIG = {
  apiUrl: process.env.API_URL || 'http://localhost:3001',
};

export async function onboardingConversation(conversation: any, ctx: ParentContext) {
  const state: OnboardingState = {
    step: 0,
    data: {},
  };

  await ctx.reply(
    '👋 *¡Bienvenido a Vendy!*

' +
    'Vamos a crear tu tienda en Telegram paso a paso.

' +
    'Este proceso toma menos de 5 minutos.

' +
    '¿Empezamos?'
  );

  // Process each step
  for (let i = 0; i < ONBOARDING_STEPS.length; i++) {
    const step = ONBOARDING_STEPS[i];
    state.step = i;

    // Ask question
    await ctx.reply(step.question, { parse_mode: 'Markdown' });

    // Wait for response with validation loop
    let valid = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!valid && attempts < maxAttempts) {
      const response = await conversation.waitFor(':text');
      const value = response.msg.text;
      attempts++;

      const validation = validateStep(i, value);

      if (!validation.valid) {
        if (attempts >= maxAttempts) {
          await ctx.reply(
            `❌ *Demasiados intentos fallidos.*

` +
            `Podés reiniciar el proceso con /start

` +
            `O contactá a soporte: @vendy_support`
          );
          return;
        }
        await ctx.reply(
          `⚠️ ${validation.error}

` +
          `Intento ${attempts}/${maxAttempts}. Probá de nuevo:`
        );
        continue;
      }

      valid = true;
      const formatted = formatOnboardingValue(step.key, value);
      
      // Store in state
      if (step.key === 'terms') {
        state.data.acceptedTerms = formatted as boolean;
      } else {
        (state.data as any)[step.key] = formatted;
      }

      // Show progress
      const progress = Math.round(((i + 1) / ONBOARDING_STEPS.length) * 100);
      await ctx.reply(`✅ ${progress}% completado`);
    }

    if (!valid) return; // User failed validation too many times
  }

  // Generate bot username
  state.data.botUsername = generateBotUsername(state.data.businessName || 'mi_tienda');

  // Show summary
  const summary = generateOnboardingSummary(state.data);
  await ctx.reply(summary, { parse_mode: 'Markdown' });

  // Confirm
  await ctx.reply(
    '¿Confirmás la creación de tu tienda?

' +
    'Escribí *Confirmar* para continuar o *Cancelar* para descartar.'
  );

  const confirmResponse = await conversation.waitFor(':text');
  const confirmText = confirmResponse.msg.text.toLowerCase().trim();

  if (!['confirmar', 'confirm', 'si', 'sí', 'yes'].includes(confirmText)) {
    await ctx.reply(
      '❌ *Proceso cancelado.*

' +
      'Tu información no fue guardada.

' +
      'Para reiniciar, usá /start'
    );
    return;
  }

  // Create shop
  await ctx.reply('⏳ *Creando tu tienda...*

Esto puede tomar unos segundos.');

  const adminId = ctx.from?.id;
  if (!adminId) {
    await ctx.reply('❌ Error: No se pudo identificar tu usuario.');
    return;
  }

  const result = await createShopFromOnboarding(adminId, state.data, CONFIG.apiUrl);

  if (result.success) {
    await ctx.reply(
      '🎉 *¡Tu tienda fue creada exitosamente!*

' +
      `🏪 *${state.data.businessName}*
` +
      `🤖 Bot: @${state.data.botUsername}
` +
      `📊 Panel: https://vendy.app/dashboard/${result.shopId}

` +
      `*Próximos pasos:*
` +
      `1. Agregá productos desde el panel
` +
      `2. Configurá métodos de pago
` +
      `3. Compartí tu bot con clientes

` +
      `¿Necesitás ayuda? Contactá a @vendy_support`
    );

    // Set admin in session
    ctx.session.isAdmin = true;
    ctx.session.adminId = adminId;
  } else {
    await ctx.reply(
      '❌ *Error al crear la tienda*

' +
      `${result.error || 'Error desconocido'}

` +
      `Por favor, intentá nuevamente más tarde o contactá a soporte.`
    );
  }
}

export const onboardingConversationMiddleware = createConversation(onboardingConversation);
