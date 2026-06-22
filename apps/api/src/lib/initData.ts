import crypto from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Represents a Telegram WebApp user extracted from initData.
 * Based on Telegram WebApp API documentation.
 * @see https://core.telegram.org/bots/webapps#webappuser
 */
export interface WebAppUser {
  /** Unique user identifier */
  id: number;
  /** First name */
  first_name: string;
  /** Last name (optional) */
  last_name?: string;
  /** Username (optional) */
  username?: string;
  /** IETF language tag of the user's language (optional) */
  language_code?: string;
  /** True, if this user is a Telegram Premium user (optional) */
  is_premium?: boolean;
  /** True, if this user added the bot to the attachment menu (optional) */
  added_to_attachment_menu?: boolean;
  /** True, if this user allowed the bot to message them (optional) */
  allows_write_to_pm?: boolean;
  /** URL of the user's profile photo (optional) */
  photo_url?: string;
}

/**
 * Result of initData validation.
 */
export interface InitDataValidationResult {
  /** Whether the initData is valid */
  valid: boolean;
  /** The parsed user object if valid, null otherwise */
  user: WebAppUser | null;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Validates Telegram WebApp initData using HMAC-SHA256.
 * 
 * Algorithm:
 * 1. Extract the hash parameter from initData
 * 2. Remove the hash parameter
 * 3. Sort remaining parameters alphabetically by key
 * 4. Join as key=value pairs separated by newlines
 * 5. Create secret key: HMAC-SHA256("WebAppData", botToken)
 * 6. Calculate hash: HMAC-SHA256(secretKey, dataCheckString)
 * 7. Compare calculated hash with received hash
 * 8. Validate auth_date to prevent replay attacks
 * 
 * @param initData - The raw initData query string from Telegram WebApp
 * @param botToken - The bot token from @BotFather
 * @param maxAgeSeconds - Maximum age of initData in seconds (default: 86400 = 24h)
 * @returns InitDataValidationResult with validation status and user info
 * 
 * @example
 * ```typescript
 * const result = validateInitData(
 *   'user=%7B%22id%22%3A123%7D&auth_date=1699123456&hash=abc...',
 *   '1234567890:ABC...XYZ'
 * );
 * if (result.valid) {
 *   console.log('User:', result.user?.first_name);
 * }
 * ```
 */
export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number = 86400
): InitDataValidationResult {
  try {
    // Parse the initData query string
    const urlParams = new URLSearchParams(initData);
    
    // Extract the hash parameter
    const hash = urlParams.get('hash');
    if (!hash) {
      return { valid: false, user: null, error: 'Missing hash parameter' };
    }

    // Validate auth_date to prevent replay attacks
    const authDateStr = urlParams.get('auth_date');
    if (!authDateStr) {
      return { valid: false, user: null, error: 'Missing auth_date parameter' };
    }

    const authDate = parseInt(authDateStr, 10);
    if (isNaN(authDate)) {
      return { valid: false, user: null, error: 'Invalid auth_date format' };
    }

    const now = Math.floor(Date.now() / 1000);
    if ((now - authDate) > maxAgeSeconds) {
      return { 
        valid: false, 
        user: null, 
        error: `initData expired (age: ${now - authDate}s, max: ${maxAgeSeconds}s)` 
      };
    }

    // Remove the hash parameter for data check string calculation
    urlParams.delete('hash');

    // Sort parameters alphabetically by key and join as key=value pairs
    const sortedParams = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    // Build data check string: key=value\nkey=value...
    const dataCheckString = sortedParams
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key: HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash: HMAC-SHA256(secretKey, dataCheckString)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare calculated hash with received hash (timing-safe comparison)
    if (!timingSafeEqual(calculatedHash, hash)) {
      return { valid: false, user: null, error: 'Invalid hash signature' };
    }

    // Extract user information
    const userJson = urlParams.get('user');
    if (!userJson) {
      return { valid: false, user: null, error: 'Missing user parameter' };
    }

    let user: WebAppUser;
    try {
      user = JSON.parse(decodeURIComponent(userJson)) as WebAppUser;
    } catch (parseError) {
      return { valid: false, user: null, error: 'Invalid user JSON format' };
    }

    // Validate required user fields
    if (!user.id || typeof user.id !== 'number') {
      return { valid: false, user: null, error: 'Invalid user id' };
    }
    if (!user.first_name || typeof user.first_name !== 'string') {
      return { valid: false, user: null, error: 'Invalid user first_name' };
    }

    return { valid: true, user };

  } catch (error) {
    return { 
      valid: false, 
      user: null, 
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still perform comparison to avoid timing leaks
    // but return false regardless
    try {
      crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b.padEnd(a.length, '0')));
    } catch {
      // Ignore errors from length mismatch
    }
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Extracts user information from initData without validating the signature.
 * 
 * ⚠️ WARNING: This function does NOT validate the initData signature.
 * Only use for debugging or non-critical operations.
 * For production, always use validateInitData() first.
 * 
 * @param initData - The raw initData query string
 * @returns WebAppUser object or null if parsing fails
 */
export function getUserFromInitData(initData: string): WebAppUser | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    if (!userJson) return null;
    
    return JSON.parse(decodeURIComponent(userJson)) as WebAppUser;
  } catch {
    return null;
  }
}

/**
 * Extracts the start parameter (referral code) from initData.
 * This is used for deep linking and referral tracking.
 * 
 * @param initData - The raw initData query string
 * @returns The start parameter string or null if not present
 * 
 * @example
 * ```typescript
 * // User opened bot with: t.me/vendy_bot?start=shop_123
 * const startParam = getStartParam(initData); // "shop_123"
 * ```
 */
export function getStartParam(initData: string): string | null {
  try {
    const urlParams = new URLSearchParams(initData);
    return urlParams.get('start_param');
  } catch {
    return null;
  }
}

/**
 * Extracts the chat instance from initData.
 * Used for identifying the chat context in Mini App.
 * 
 * @param initData - The raw initData query string
 * @returns The chat instance string or null if not present
 */
export function getChatInstance(initData: string): string | null {
  try {
    const urlParams = new URLSearchParams(initData);
    return urlParams.get('chat_instance');
  } catch {
    return null;
  }
}

/**
 * Fastify middleware/hook to authenticate requests using Telegram initData.
 * 
 * This middleware:
 * 1. Extracts X-Telegram-Init-Data header from the request
 * 2. Validates the initData signature using HMAC-SHA256
 * 3. Attaches the user object to the request for downstream handlers
 * 4. Returns 401 if validation fails
 * 
 * Usage:
 * ```typescript
 * // Apply to all routes in a plugin
 * app.addHook('preHandler', authenticateTelegram);
 * 
 * // Or apply to specific routes
 * app.get('/protected', { preHandler: [authenticateTelegram] }, handler);
 * ```
 */
export async function authenticateTelegram(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Extract initData from header
  const initData = request.headers['x-telegram-init-data'] as string | undefined;

  if (!initData) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing X-Telegram-Init-Data header'
    });
    return;
  }

  // Get bot token from environment
  const botToken = process.env.PARENT_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!botToken) {
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Bot token not configured'
    });
    return;
  }

  // Validate initData
  const result = validateInitData(initData, botToken);

  if (!result.valid) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: result.error || 'Invalid initData'
    });
    return;
  }

  // Attach user to request for downstream handlers
  (request as any).user = result.user;
}

/**
 * Optional: Less strict authentication that allows requests without initData.
 * Useful for public endpoints that work both inside and outside Telegram.
 * 
 * If initData is present and valid, attaches user to request.
 * If initData is missing or invalid, continues without user (request.user will be null).
 */
export async function authenticateTelegramOptional(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const initData = request.headers['x-telegram-init-data'] as string | undefined;

  if (!initData) {
    // No initData, continue as anonymous
    (request as any).user = null;
    return;
  }

  const botToken = process.env.PARENT_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!botToken) {
    // No bot token configured, continue as anonymous
    (request as any).user = null;
    return;
  }

  const result = validateInitData(initData, botToken);

  if (result.valid) {
    (request as any).user = result.user;
  } else {
    // Invalid initData, continue as anonymous
    (request as any).user = null;
  }
}

/**
 * Type guard to check if a request has an authenticated Telegram user.
 * 
 * @param request - Fastify request object
 * @returns True if the request has a valid user attached
 */
export function hasTelegramUser(request: FastifyRequest): boolean {
  return !!(request as any).user;
}

/**
 * Gets the authenticated Telegram user from a request.
 * Must be called after authenticateTelegram middleware.
 * 
 * @param request - Fastify request object
 * @returns WebAppUser or null if not authenticated
 */
export function getTelegramUser(request: FastifyRequest): WebAppUser | null {
  return (request as any).user || null;
}

/**
 * Generates a test initData string for development/testing.
 * 
 * ⚠️ WARNING: This should only be used in development/testing.
 * Never use in production as it requires the bot token.
 * 
 * @param user - User object to encode
 * @param botToken - Bot token for signing
 * @param startParam - Optional start parameter (referral code)
 * @returns Signed initData string ready for testing
 */
export function generateTestInitData(
  user: WebAppUser,
  botToken: string,
  startParam?: string
): string {
  const authDate = Math.floor(Date.now() / 1000);
  
  const params = new URLSearchParams();
  params.set('user', encodeURIComponent(JSON.stringify(user)));
  params.set('auth_date', authDate.toString());
  
  if (startParam) {
    params.set('start_param', startParam);
  }

  // Build data check string (sorted alphabetically)
  const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = sortedParams
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Create secret key
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  // Calculate hash
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Return complete initData with hash
  params.set('hash', hash);
  return params.toString();
}

/**
 * Debug helper: Logs initData validation details without throwing.
 * Useful for troubleshooting authentication issues in development.
 * 
 * @param initData - The raw initData query string
 * @param botToken - The bot token for validation
 * @returns Object with validation result and debug info
 */
export function debugInitData(
  initData: string,
  botToken: string
): { valid: boolean; error?: string; debug: Record<string, unknown> } {
  const debug: Record<string, unknown> = {
    initDataLength: initData.length,
    hasHash: initData.includes('hash='),
    hasAuthDate: initData.includes('auth_date='),
    hasUser: initData.includes('user='),
  };

  try {
    const urlParams = new URLSearchParams(initData);
    
    const authDate = urlParams.get('auth_date');
    debug.authDate = authDate;
    debug.authDateParsed = authDate ? parseInt(authDate, 10) : null;
    
    const userJson = urlParams.get('user');
    if (userJson) {
      try {
        debug.userParsed = JSON.parse(decodeURIComponent(userJson));
      } catch (e) {
        debug.userParseError = (e as Error).message;
      }
    }

    const result = validateInitData(initData, botToken);
    debug.validationResult = result.valid;
    if (result.error) {
      debug.validationError = result.error;
    }

    return {
      valid: result.valid,
      error: result.error,
      debug
    };
  } catch (error) {
    debug.exception = error instanceof Error ? error.message : 'Unknown error';
    return {
      valid: false,
      error: `Debug exception: ${debug.exception}`,
      debug
    };
  }
}
