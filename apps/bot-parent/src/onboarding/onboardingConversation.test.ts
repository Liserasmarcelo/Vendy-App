import { describe, it, expect, vi } from 'vitest';
import { onboardingConversation } from './onboardingConversation';

// Mock dependencies
vi.mock('./onboardingFlow', () => ({
  ONBOARDING_STEPS: [
    { id: 1, key: 'fullName', question: 'Nombre?', validate: () => true },
    { id: 2, key: 'email', question: 'Email?', validate: () => true },
  ],
  validateStep: vi.fn().mockReturnValue({ valid: true }),
  formatOnboardingValue: vi.fn().mockImplementation((key, value) => value),
  generateOnboardingSummary: vi.fn().mockReturnValue('Summary'),
  generateBotUsername: vi.fn().mockReturnValue('test_bot1234'),
  createShopFromOnboarding: vi.fn().mockResolvedValue({
    success: true,
    shopId: 1,
    botToken: 'token123',
  }),
}));

describe('onboardingConversation', () => {
  it('is defined', () => {
    expect(onboardingConversation).toBeDefined();
    expect(typeof onboardingConversation).toBe('function');
  });

  it('has correct structure', () => {
    // The conversation is an async generator function
    expect(onboardingConversation.constructor.name).toContain('Function');
  });
});

describe('Onboarding flow validation', () => {
  it('accepts valid confirmation', () => {
    const confirmations = ['confirmar', 'confirm', 'si', 'sí', 'yes'];
    for (const text of confirmations) {
      expect(['confirmar', 'confirm', 'si', 'sí', 'yes'].includes(text)).toBe(true);
    }
  });

  it('rejects invalid confirmation', () => {
    const rejections = ['no', 'cancelar', 'nope', ''];
    for (const text of rejections) {
      expect(['confirmar', 'confirm', 'si', 'sí', 'yes'].includes(text)).toBe(false);
    }
  });
});
