/**
 * API Client for Vendy Mini App.
 *
 * Handles all HTTP communication between the Telegram Mini App and the backend API.
 * Automatically includes Telegram initData for authentication on every request.
 *
 * Features:
 * - Reads initData from window.Telegram.WebApp
 * - Sends X-Telegram-Init-Data header on every request
 * - Handles 401 errors (invalid/expired initData) by prompting re-authentication
 * - JSON request/response handling
 * - Request timeout and error handling
 * - Base URL configuration via environment
 *
 * Usage:
 * ```typescript
 * import { apiClient } from './api';
 *
 * // GET request
 * const products = await apiClient.get('/products');
 *
 * // POST request
 * const order = await apiClient.post('/orders', { items: [...] });
 *
 * // PUT request
 * const updated = await apiClient.put('/cart/123', { quantity: 2 });
 *
 * // DELETE request
 * await apiClient.delete('/cart/123');
 * ```
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
  retries: number;
}

interface ApiError {
  status: number;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

interface RequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

function getConfig(): ApiConfig {
  // In production, API is on same domain or configured via env
  // In development, use localhost or configured endpoint
  const baseUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:3001' : 'https://api.vendy.app');

  return {
    baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
    timeoutMs: 30000, // 30 seconds default
    retries: 1, // 1 retry for transient failures
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Telegram WebApp helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the Telegram initData from the WebApp context.
 * Returns null if not running inside Telegram WebApp.
 */
export function getTelegramInitData(): string | null {
  try {
    if (
      typeof window !== 'undefined' &&
      window.Telegram?.WebApp?.initData
    ) {
      return window.Telegram.WebApp.initData;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if running inside Telegram WebApp.
 */
export function isTelegramWebApp(): boolean {
  return getTelegramInitData() !== null;
}

/**
 * Get Telegram user info from initData (without validation).
 * For validated user data, use the API response after authentication.
 */
export function getTelegramUserUnsafe(): {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
} | null {
  const initData = getTelegramInitData();
  if (!initData) return null;

  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    if (!userJson) return null;

    return JSON.parse(decodeURIComponent(userJson));
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────────────────────────────────────

class ApiClientError extends Error {
  status: number;
  data?: ApiError;

  constructor(message: string, status: number, data?: ApiError) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Handle 401 Unauthorized - initData is invalid or expired.
 * Shows Telegram native alert and suggests reopening the app.
 */
function handleUnauthorized(): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert(
      'Your session has expired. Please close and reopen the app.',
      () => {
        // Optional: Close the Mini App
        window.Telegram.WebApp?.close();
      }
    );
  } else {
    // Fallback for browser development
    alert('Session expired. Please reload the page.');
  }
}

/**
 * Handle network errors (offline, timeout, etc.).
 */
function handleNetworkError(error: Error): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert(
      'Connection failed. Please check your internet and try again.'
    );
  }
  console.error('Network error:', error);
}

// ─────────────────────────────────────────────────────────────────────────────
// Core request function
// ─────────────────────────────────────────────────────────────────────────────

async function makeRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const config = getConfig();
  const url = `${config.baseUrl}${endpoint}`;

  // Get initData for authentication
  const initData = getTelegramInitData();

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options?.headers,
  };

  // Add Telegram initData if available
  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }

  // Determine timeout
  const timeoutMs = options?.timeoutMs ?? config.timeoutMs;
  const retries = options?.retries ?? config.retries;

  // Make request with retry logic
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized - initData invalid/expired
      if (response.status === 401) {
        handleUnauthorized();
        throw new ApiClientError(
          'Authentication failed - initData invalid or expired',
          401,
          { status: 401, message: 'Unauthorized' }
        );
      }

      // Handle other error status codes
      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            status: response.status,
            message: response.statusText || 'Unknown error',
          };
        }

        throw new ApiClientError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      // Parse successful response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return (await response.json()) as T;
      }

      return (await response.text()) as unknown as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on 401 (auth error) or 4xx client errors
      if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Don't retry if aborted (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiClientError(
          'Request timeout - please try again',
          408,
          { status: 408, message: 'Request timeout' }
        );
      }

      // Retry on network errors (5xx, fetch failures)
      if (attempt < retries) {
        console.warn(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying...`, error);
        await delay(1000 * (attempt + 1)); // Exponential backoff: 1s, 2s
        continue;
      }

      // All retries exhausted
      if (error instanceof TypeError && error.message.includes('fetch')) {
        handleNetworkError(error);
        throw new ApiClientError(
          'Network error - please check your connection',
          0,
          { status: 0, message: 'Network error' }
        );
      }

      throw error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new ApiClientError('Unknown error', 500);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API methods
// ─────────────────────────────────────────────────────────────────────────────

/**
 * API Client for Vendy Mini App.
 *
 * All methods automatically include X-Telegram-Init-Data header
 * when running inside Telegram WebApp.
 */
export const apiClient = {
  /**
   * GET request.
   *
   * @param endpoint - API endpoint (e.g., '/products')
   * @param options - Optional request configuration
   * @returns Parsed JSON response
   *
   * @example
   * ```typescript
   * const products = await apiClient.get<Product[]>('/products');
   * ```
   */
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return makeRequest<T>('GET', endpoint, undefined, options);
  },

  /**
   * POST request.
   *
   * @param endpoint - API endpoint (e.g., '/orders')
   * @param body - Request body object
   * @param options - Optional request configuration
   * @returns Parsed JSON response
   *
   * @example
   * ```typescript
   * const order = await apiClient.post<Order>('/orders', {
   *   items: [{ productId: '123', quantity: 2 }]
   * });
   * ```
   */
  post<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
    return makeRequest<T>('POST', endpoint, body, options);
  },

  /**
   * PUT request.
   *
   * @param endpoint - API endpoint (e.g., '/cart/123')
   * @param body - Request body object
   * @param options - Optional request configuration
   * @returns Parsed JSON response
   *
   * @example
   * ```typescript
   * const updated = await apiClient.put<CartItem>('/cart/123', {
   *   quantity: 3
   * });
   * ```
   */
  put<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
    return makeRequest<T>('PUT', endpoint, body, options);
  },

  /**
   * PATCH request.
   *
   * @param endpoint - API endpoint
   * @param body - Request body object (partial update)
   * @param options - Optional request configuration
   * @returns Parsed JSON response
   *
   * @example
   * ```typescript
   * const updated = await apiClient.patch<Order>('/orders/123', {
   *   status: 'SHIPPED'
   * });
   * ```
   */
  patch<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
    return makeRequest<T>('PATCH', endpoint, body, options);
  },

  /**
   * DELETE request.
   *
   * @param endpoint - API endpoint (e.g., '/cart/123')
   * @param options - Optional request configuration
   * @returns Parsed JSON response (often empty or success message)
   *
   * @example
   * ```typescript
   * await apiClient.delete('/cart/123');
   * ```
   */
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return makeRequest<T>('DELETE', endpoint, undefined, options);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Convenience methods for common operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get products for a shop.
 */
export async function getProducts(shopId?: string): Promise<unknown[]> {
  const endpoint = shopId ? `/shops/${shopId}/products` : '/products';
  return apiClient.get<unknown[]>(endpoint);
}

/**
 * Get a single product by ID.
 */
export async function getProduct(productId: string): Promise<unknown> {
  return apiClient.get<unknown>(`/products/${productId}`);
}

/**
 * Get current user's cart.
 */
export async function getCart(): Promise<unknown> {
  return apiClient.get<unknown>('/cart');
}

/**
 * Add item to cart.
 */
export async function addToCart(
  productId: string,
  quantity: number,
  variants?: Record<string, string>
): Promise<unknown> {
  return apiClient.post<unknown>('/cart/items', {
    productId,
    quantity,
    variants,
  });
}

/**
 * Update cart item quantity.
 */
export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<unknown> {
  return apiClient.put<unknown>(`/cart/items/${itemId}`, { quantity });
}

/**
 * Remove item from cart.
 */
export async function removeCartItem(itemId: string): Promise<void> {
  await apiClient.delete(`/cart/items/${itemId}`);
}

/**
 * Create a new order from current cart.
 */
export async function createOrder(
  shippingAddress: Record<string, string>,
  paymentMethod: string
): Promise<unknown> {
  return apiClient.post<unknown>('/orders', {
    shippingAddress,
    paymentMethod,
  });
}

/**
 * Get current user's orders.
 */
export async function getOrders(): Promise<unknown[]> {
  return apiClient.get<unknown[]>('/orders');
}

/**
 * Get order details by ID.
 */
export async function getOrder(orderId: string): Promise<unknown> {
  return apiClient.get<unknown>(`/orders/${orderId}`);
}

/**
 * Get current authenticated user info.
 * Returns user data validated by the backend (not from initData directly).
 */
export async function getCurrentUser(): Promise<unknown> {
  return apiClient.get<unknown>('/auth/me');
}

/**
 * Get shop info by ID or slug.
 */
export async function getShop(shopId: string): Promise<unknown> {
  return apiClient.get<unknown>(`/shops/${shopId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Export types
// ─────────────────────────────────────────────────────────────────────────────

export type { ApiConfig, ApiError, RequestOptions };
export { ApiClientError };

export default apiClient;
