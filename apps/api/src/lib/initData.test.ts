import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import {
  validateInitData,
  getUserFromInitData,
  getStartParam,
  getChatInstance,
  generateTestInitData,
  debugInitData,
  type WebAppUser,
  type InitDataValidationResult,
} from './initData';

/**
 * Test utilities for generating valid/invalid initData signatures.
 * Uses the same algorithm as the production code to create test fixtures.
 */

const TEST_BOT_TOKEN = '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789';

function createValidInitData(user: WebAppUser, options?: {
  authDate?: number;
  startParam?: string;
  chatInstance?: string;
}): string {
  const authDate = options?.authDate ?? Math.floor(Date.now() / 1000);
  
  const params = new URLSearchParams();
  params.set('user', encodeURIComponent(JSON.stringify(user)));
  params.set('auth_date', authDate.toString());
  
  if (options?.startParam) {
    params.set('start_param', options.startParam);
  }
  if (options?.chatInstance) {
    params.set('chat_instance', options.chatInstance);
  }

  // Sort and build data check string
  const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = sortedParams.map(([k, v]) => `${k}=${v}`).join('\n');

  // Sign with HMAC-SHA256
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TEST_BOT_TOKEN).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  params.set('hash', hash);
  return params.toString();
}

function createExpiredInitData(user: WebAppUser, secondsAgo: number): string {
  const authDate = Math.floor(Date.now() / 1000) - secondsAgo;
  return createValidInitData(user, { authDate });
}

function createTamperedInitData(user: WebAppUser): string {
  const initData = createValidInitData(user);
  // Tamper by changing the user ID
  return initData.replace(/"id":\d+/, '"id":999999');
}

function createInitDataWithWrongHash(user: WebAppUser): string {
  const params = new URLSearchParams();
  params.set('user', encodeURIComponent(JSON.stringify(user)));
  params.set('auth_date', Math.floor(Date.now() / 1000).toString());
  params.set('hash', 'invalidhash1234567890abcdef');
  return params.toString();
}

const TEST_USER: WebAppUser = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  language_code: 'en',
};

const MINIMAL_USER: WebAppUser = {
  id: 987654321,
  first_name: 'Minimal',
};

// ─────────────────────────────────────────────────────────────────────────────
// validateInitData
// ─────────────────────────────────────────────────────────────────────────────

describe('validateInitData', () => {
  describe('valid initData', () => {
    it('should validate correctly signed initData with full user', () => {
      const initData = createValidInitData(TEST_USER);
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.user).toEqual(TEST_USER);
    });

    it('should validate minimal user (only id and first_name)', () => {
      const initData = createValidInitData(MINIMAL_USER);
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(true);
      expect(result.user).toEqual(MINIMAL_USER);
    });

    it('should validate initData with start_param', () => {
      const initData = createValidInitData(TEST_USER, { startParam: 'shop_123' });
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(true);
      expect(result.user).toEqual(TEST_USER);
    });

    it('should validate initData with chat_instance', () => {
      const initData = createValidInitData(TEST_USER, { chatInstance: 'abc123def456' });
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(true);
      expect(result.user).toEqual(TEST_USER);
    });

    it('should validate premium user with all fields', () => {
      const premiumUser: WebAppUser = {
        id: 111111,
        first_name: 'Premium',
        last_name: 'User',
        username: 'premiumuser',
        language_code: 'es',
        is_premium: true,
        added_to_attachment_menu: true,
        allows_write_to_pm: true,
        photo_url: 'https://t.me/i/userpic/320/premium.jpg',
      };
      const initData = createValidInitData(premiumUser);
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(true);
      expect(result.user).toEqual(premiumUser);
    });
  });

  describe('invalid initData - missing parameters', () => {
    it('should reject empty string', () => {
      const result = validateInitData('', TEST_BOT_TOKEN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing hash');
      expect(result.user).toBeNull();
    });

    it('should reject missing hash', () => {
      const params = new URLSearchParams();
      params.set('user', encodeURIComponent(JSON.stringify(TEST_USER)));
      params.set('auth_date', Math.floor(Date.now() / 1000).toString());
      
      const result = validateInitData(params.toString(), TEST_BOT_TOKEN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing hash');
    });

    it('should reject missing auth_date', () => {
      const params = new URLSearchParams();
      params.set('user', encodeURIComponent(JSON.stringify(TEST_USER)));
      params.set('hash', 'somehash');
      
      const result = validateInitData(params.toString(), TEST_BOT_TOKEN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing auth_date');
    });

    it('should reject missing user', () => {
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TEST_BOT_TOKEN).digest();
      const authDate = Math.floor(Date.now() / 1000).toString();
      const dataCheckString = `auth_date=${authDate}`;
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      
      const params = new URLSearchParams();
      params.set('auth_date', authDate);
      params.set('hash', hash);
      
      const result = validateInitData(params.toString(), TEST_BOT_TOKEN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing user');
    });
  });

  describe('invalid initData - expired', () => {
    it('should reject initData older than default maxAge (24h)', () => {
      const initData = createExpiredInitData(TEST_USER, 90000); // 25h ago
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should reject initData older than custom maxAge', () => {
      const initData = createExpiredInitData(TEST_USER, 120); // 2min ago
      const result = validateInitData(initData, TEST_BOT_TOKEN, 60); // 1min max

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should accept initData within custom maxAge', () => {
      const initData = createExpiredInitData(TEST_USER, 30); // 30s ago
      const result = validateInitData(initData, TEST_BOT_TOKEN, 300); // 5min max

      expect(result.valid).toBe(true);
      expect(result.user).toEqual(TEST_USER);
    });

    it('should accept fresh initData', () => {
      const initData = createValidInitData(TEST_USER);
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(true);
    });
  });

  describe('invalid initData - tampered', () => {
    it('should reject tampered user data', () => {
      const initData = createTamperedInitData(TEST_USER);
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid hash');
    });

    it('should reject wrong hash signature', () => {
      const initData = createInitDataWithWrongHash(TEST_USER);
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid hash');
    });

    it('should reject initData signed with different bot token', () => {
      const initData = createValidInitData(TEST_USER);
      const wrongToken = '9999999999:ZZZzzzZZZzzzZZZzzzZZZzzzZZZzzzZZZ';
      const result = validateInitData(initData, wrongToken);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid hash');
    });
  });

  describe('invalid initData - malformed', () => {
    it('should reject invalid auth_date format', () => {
      const params = new URLSearchParams();
      params.set('user', encodeURIComponent(JSON.stringify(TEST_USER)));
      params.set('auth_date', 'not-a-number');
      params.set('hash', 'somehash');
      
      const result = validateInitData(params.toString(), TEST_BOT_TOKEN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid auth_date');
    });

    it('should reject invalid user JSON', () => {
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TEST_BOT_TOKEN).digest();
      const authDate = Math.floor(Date.now() / 1000).toString();
      const dataCheckString = `auth_date=${authDate}\nuser=not-valid-json`;
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      
      const params = new URLSearchParams();
      params.set('auth_date', authDate);
      params.set('user', 'not-valid-json');
      params.set('hash', hash);
      
      const result = validateInitData(params.toString(), TEST_BOT_TOKEN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid user JSON');
    });

    it('should reject user with invalid id type', () => {
      const user = { id: 'not-a-number', first_name: 'Test' } as unknown as WebAppUser;
      const initData = createValidInitData(user);
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid user id');
    });

    it('should reject user with missing first_name', () => {
      const user = { id: 123 } as unknown as WebAppUser;
      const initData = createValidInitData(user);
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid user first_name');
    });
  });

  describe('edge cases', () => {
    it('should handle URL-encoded special characters in user data', () => {
      const specialUser: WebAppUser = {
        id: 456,
        first_name: 'José María',
        last_name: 'García López',
        username: 'jose_maria',
      };
      const initData = createValidInitData(specialUser);
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(true);
      expect(result.user?.first_name).toBe('José María');
    });

    it('should handle very large user IDs', () => {
      const bigUser: WebAppUser = {
        id: 999999999999,
        first_name: 'Big',
      };
      const initData = createValidInitData(bigUser);
      const result = validateInitData(initData, TEST_BOT_TOKEN);

      expect(result.valid).toBe(true);
      expect(result.user?.id).toBe(999999999999);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getUserFromInitData
// ─────────────────────────────────────────────────────────────────────────────

describe('getUserFromInitData', () => {
  it('should extract user from valid initData without validation', () => {
    const initData = createValidInitData(TEST_USER);
    const user = getUserFromInitData(initData);

    expect(user).toEqual(TEST_USER);
  });

  it('should extract user even from invalid initData', () => {
    const initData = createTamperedInitData(TEST_USER);
    const user = getUserFromInitData(initData);

    // getUserFromInitData does NOT validate, so it returns the tampered user
    expect(user).not.toBeNull();
    expect(user?.id).toBe(999999); // tampered value
  });

  it('should return null for missing user parameter', () => {
    const params = new URLSearchParams();
    params.set('auth_date', '1234567890');
    params.set('hash', 'somehash');
    
    const user = getUserFromInitData(params.toString());
    expect(user).toBeNull();
  });

  it('should return null for invalid JSON', () => {
    const params = new URLSearchParams();
    params.set('user', 'not-json');
    params.set('auth_date', '1234567890');
    
    const user = getUserFromInitData(params.toString());
    expect(user).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getStartParam
// ─────────────────────────────────────────────────────────────────────────────

describe('getStartParam', () => {
  it('should extract start_param from initData', () => {
    const initData = createValidInitData(TEST_USER, { startParam: 'shop_123' });
    const startParam = getStartParam(initData);

    expect(startParam).toBe('shop_123');
  });

  it('should return null when start_param is missing', () => {
    const initData = createValidInitData(TEST_USER);
    const startParam = getStartParam(initData);

    expect(startParam).toBeNull();
  });

  it('should handle URL-encoded start_param', () => {
    const params = new URLSearchParams();
    params.set('start_param', 'shop_123%26ref=abc');
    
    const startParam = getStartParam(params.toString());
    expect(startParam).toBe('shop_123%26ref=abc');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getChatInstance
// ─────────────────────────────────────────────────────────────────────────────

describe('getChatInstance', () => {
  it('should extract chat_instance from initData', () => {
    const initData = createValidInitData(TEST_USER, { chatInstance: 'abc123def456' });
    const chatInstance = getChatInstance(initData);

    expect(chatInstance).toBe('abc123def456');
  });

  it('should return null when chat_instance is missing', () => {
    const initData = createValidInitData(TEST_USER);
    const chatInstance = getChatInstance(initData);

    expect(chatInstance).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateTestInitData
// ─────────────────────────────────────────────────────────────────────────────

describe('generateTestInitData', () => {
  it('should generate valid initData that passes validation', () => {
    const initData = generateTestInitData(TEST_USER, TEST_BOT_TOKEN);
    const result = validateInitData(initData, TEST_BOT_TOKEN);

    expect(result.valid).toBe(true);
    expect(result.user).toEqual(TEST_USER);
  });

  it('should include start_param when provided', () => {
    const initData = generateTestInitData(TEST_USER, TEST_BOT_TOKEN, 'shop_456');
    
    expect(initData).toContain('start_param=shop_456');
    
    const startParam = getStartParam(initData);
    expect(startParam).toBe('shop_456');
  });

  it('should generate unique initData on each call (different auth_date)', () => {
    const initData1 = generateTestInitData(TEST_USER, TEST_BOT_TOKEN);
    
    // Small delay to ensure different auth_date
    const start = Date.now();
    while (Date.now() - start < 10) { /* busy wait */ }
    
    const initData2 = generateTestInitData(TEST_USER, TEST_BOT_TOKEN);
    
    expect(initData1).not.toBe(initData2);
  });

  it('should generate initData with correct hash format', () => {
    const initData = generateTestInitData(TEST_USER, TEST_BOT_TOKEN);
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    expect(hash).toBeDefined();
    expect(hash).toMatch(/^[a-f0-9]{64}$/); // 64 hex chars = 256 bits
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// debugInitData
// ─────────────────────────────────────────────────────────────────────────────

describe('debugInitData', () => {
  it('should return debug info for valid initData', () => {
    const initData = createValidInitData(TEST_USER);
    const result = debugInitData(initData, TEST_BOT_TOKEN);

    expect(result.valid).toBe(true);
    expect(result.debug).toBeDefined();
    expect(result.debug.initDataLength).toBe(initData.length);
    expect(result.debug.hasHash).toBe(true);
    expect(result.debug.hasAuthDate).toBe(true);
    expect(result.debug.hasUser).toBe(true);
    expect(result.debug.authDate).toBeDefined();
    expect(result.debug.userParsed).toEqual(TEST_USER);
    expect(result.debug.validationResult).toBe(true);
  });

  it('should return debug info for invalid initData', () => {
    const initData = createTamperedInitData(TEST_USER);
    const result = debugInitData(initData, TEST_BOT_TOKEN);

    expect(result.valid).toBe(false);
    expect(result.debug.validationResult).toBe(false);
    expect(result.debug.validationError).toContain('Invalid hash');
  });

  it('should handle malformed initData gracefully', () => {
    const result = debugInitData('not-valid-query-string', TEST_BOT_TOKEN);

    expect(result.valid).toBe(false);
    expect(result.debug).toBeDefined();
    expect(result.debug.hasHash).toBe(false);
    expect(result.debug.hasAuthDate).toBe(false);
  });

  it('should include user parse error for invalid JSON', () => {
    const params = new URLSearchParams();
    params.set('user', 'not-json');
    params.set('auth_date', '1234567890');
    params.set('hash', 'a'.repeat(64));
    
    const result = debugInitData(params.toString(), TEST_BOT_TOKEN);

    expect(result.debug.userParseError).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: Full flow simulation
// ─────────────────────────────────────────────────────────────────────────────

describe('integration: full authentication flow', () => {
  it('should simulate complete Telegram → Mini-App → API flow', () => {
    // Step 1: Telegram generates initData (simulated)
    const telegramUser: WebAppUser = {
      id: 777777777,
      first_name: 'María',
      last_name: 'González',
      username: 'maria_g',
      language_code: 'es',
      is_premium: true,
    };

    // Step 2: Mini-App sends initData to API
    const initData = generateTestInitData(telegramUser, TEST_BOT_TOKEN, 'shop_42');

    // Step 3: API validates initData
    const validationResult = validateInitData(initData, TEST_BOT_TOKEN);
    expect(validationResult.valid).toBe(true);
    expect(validationResult.user).toEqual(telegramUser);

    // Step 4: API extracts referral info
    const startParam = getStartParam(initData);
    expect(startParam).toBe('shop_42');

    // Step 5: API can use user for business logic
    expect(validationResult.user?.id).toBe(777777777);
    expect(validationResult.user?.first_name).toBe('María');
  });

  it('should detect replay attack with old initData', () => {
    // Attacker tries to reuse old initData
    const oldInitData = createExpiredInitData(TEST_USER, 86400 * 2); // 2 days old
    
    const result = validateInitData(oldInitData, TEST_BOT_TOKEN);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('should detect tampered user identity', () => {
    // Attacker tries to impersonate another user
    const attackerInitData = createTamperedInitData(TEST_USER);
    
    const result = validateInitData(attackerInitData, TEST_BOT_TOKEN);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid hash');
  });
});
