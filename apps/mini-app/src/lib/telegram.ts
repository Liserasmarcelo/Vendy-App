/**
 * Telegram WebApp helpers for Vendy Mini App.
 *
 * Provides typed wrappers around the Telegram WebApp API for:
 * - Reading initData and user information
 * - Haptic feedback (vibration patterns)
 * - MainButton / BackButton control
 * - Theme parameters (colors from Telegram)
 * - Viewport and expand behavior
 * - Closing the Mini App
 * - CloudStorage (key-value persistence)
 * - Biometric authentication (when available)
 * - QR code scanner
 * - Share functionality
 *
 * All functions are safe to call outside Telegram (they return null/false gracefully).
 *
 * @see https://core.telegram.org/bots/webapps#initializing-web-apps
 * @see https://core.telegram.org/bots/webapps#themeparams
 * @see https://core.telegram.org/bots/webapps#hapticfeedback
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types (based on Telegram WebApp API)
// ─────────────────────────────────────────────────────────────────────────────

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

export interface TelegramInitData {
  query_id?: string;
  user?: TelegramUser;
  receiver?: TelegramUser;
  chat?: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    photo_url?: string;
  };
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  can_send_after?: number;
  auth_date: number;
  hash: string;
}

export type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type HapticNotificationType = 'error' | 'success' | 'warning';

export type BiometricAuthRequest = 'access_requested' | 'access_granted' | 'access_denied';
export type BiometricTokenUpdate = 'updated' | 'removed' | 'not_updated';

// ─────────────────────────────────────────────────────────────────────────────
// WebApp instance access
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the Telegram WebApp instance.
 * Returns null if not running inside Telegram WebApp.
 */
export function getWebApp(): TelegramWebApp | null {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      return window.Telegram.WebApp as TelegramWebApp;
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
  return getWebApp() !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// InitData helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the raw initData string from Telegram.
 * This is the signed query string used for authentication.
 */
export function getInitData(): string | null {
  const webApp = getWebApp();
  return webApp?.initData || null;
}

/**
 * Get the parsed initDataUnsafe object.
 * ⚠️ WARNING: This is NOT validated. For production auth, send to backend.
 */
export function getInitDataUnsafe(): TelegramInitData | null {
  const webApp = getWebApp();
  return webApp?.initDataUnsafe || null;
}

/**
 * Get the user from initData (unsafe, not validated).
 * For validated user data, use the backend API response.
 */
export function getUser(): TelegramUser | null {
  return getInitDataUnsafe()?.user || null;
}

/**
 * Get the start parameter (referral code) from initData.
 * e.g., "shop_123" from t.me/bot?start=shop_123
 */
export function getStartParam(): string | null {
  return getInitDataUnsafe()?.start_param || null;
}

/**
 * Get the chat instance from initData.
 */
export function getChatInstance(): string | null {
  return getInitDataUnsafe()?.chat_instance || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme parameters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all theme parameters from Telegram.
 * Use these colors to match the Telegram app theme.
 */
export function getThemeParams(): TelegramThemeParams {
  const webApp = getWebApp();
  return webApp?.themeParams || {};
}

/**
 * Get a specific theme color.
 * Returns a CSS color string or a fallback value.
 *
 * @example
 * ```typescript
 * const bgColor = getThemeColor('bg_color', '#ffffff');
 * const textColor = getThemeColor('text_color', '#000000');
 * ```
 */
export function getThemeColor(
  key: keyof TelegramThemeParams,
  fallback: string = '#000000'
): string {
  const theme = getThemeParams();
  return theme[key] || fallback;
}

/**
 * Apply Telegram theme colors to CSS variables.
 * Call this once on app initialization.
 *
 * @example
 * ```typescript
 * applyThemeToDocument();
 * // Now CSS can use: var(--tg-bg-color), var(--tg-text-color), etc.
 * ```
 */
export function applyThemeToDocument(): void {
  if (typeof document === 'undefined') return;

  const theme = getThemeParams();
  const root = document.documentElement;

  const colorMap: Record<string, keyof TelegramThemeParams> = {
    '--tg-bg-color': 'bg_color',
    '--tg-text-color': 'text_color',
    '--tg-hint-color': 'hint_color',
    '--tg-link-color': 'link_color',
    '--tg-button-color': 'button_color',
    '--tg-button-text-color': 'button_text_color',
    '--tg-secondary-bg-color': 'secondary_bg_color',
    '--tg-header-bg-color': 'header_bg_color',
    '--tg-accent-text-color': 'accent_text_color',
    '--tg-section-bg-color': 'section_bg_color',
    '--tg-section-header-text-color': 'section_header_text_color',
    '--tg-subtitle-text-color': 'subtitle_text_color',
    '--tg-destructive-text-color': 'destructive_text_color',
  };

  Object.entries(colorMap).forEach(([cssVar, themeKey]) => {
    const value = theme[themeKey];
    if (value) {
      root.style.setProperty(cssVar, value);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Haptic feedback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trigger haptic feedback (vibration) on the device.
 *
 * @param type - Type of feedback: 'impact', 'notification', 'selection_change'
 * @param style - Style for impact/notification (optional)
 *
 * @example
 * ```typescript
 * // Light tap when pressing a button
 * hapticFeedback('impact', 'light');
 *
 * // Success vibration after completing an action
 * hapticFeedback('notification', 'success');
 *
 * // Selection change when scrolling through items
 * hapticFeedback('selection_change');
 * ```
 */
export function hapticFeedback(
  type: 'impact' | 'notification' | 'selection_change',
  style?: HapticImpactStyle | HapticNotificationType
): void {
  const webApp = getWebApp();
  if (!webApp?.HapticFeedback) return;

  try {
    switch (type) {
      case 'impact':
        if (style) {
          webApp.HapticFeedback.impactOccurred(style as HapticImpactStyle);
        }
        break;
      case 'notification':
        if (style) {
          webApp.HapticFeedback.notificationOccurred(style as HapticNotificationType);
        }
        break;
      case 'selection_change':
        webApp.HapticFeedback.selectionChanged();
        break;
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Convenience: Light impact feedback (button press).
 */
export function hapticLight(): void {
  hapticFeedback('impact', 'light');
}

/**
 * Convenience: Medium impact feedback (important action).
 */
export function hapticMedium(): void {
  hapticFeedback('impact', 'medium');
}

/**
 * Convenience: Success notification feedback.
 */
export function hapticSuccess(): void {
  hapticFeedback('notification', 'success');
}

/**
 * Convenience: Error notification feedback.
 */
export function hapticError(): void {
  hapticFeedback('notification', 'error');
}

// ─────────────────────────────────────────────────────────────────────────────
// MainButton control
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Show and configure the MainButton (bottom button in Telegram).
 *
 * @param text - Button text
 * @param onClick - Callback when button is clicked
 * @param options - Optional: color, textColor, isVisible, isActive
 *
 * @example
 * ```typescript
 * showMainButton('Checkout $50', () => {
 *   hapticMedium();
 *   navigate('/checkout');
 * }, { color: '#FF7403' });
 * ```
 */
export function showMainButton(
  text: string,
  onClick: () => void,
  options?: {
    color?: string;
    textColor?: string;
    isActive?: boolean;
  }
): void {
  const webApp = getWebApp();
  if (!webApp?.MainButton) return;

  const mainButton = webApp.MainButton;

  mainButton.setText(text);

  if (options?.color) {
    mainButton.setParams({ color: options.color });
  }
  if (options?.textColor) {
    mainButton.setParams({ text_color: options.textColor });
  }
  if (options?.isActive !== undefined) {
    mainButton.setParams({ is_active: options.isActive });
  }

  // Remove previous listeners to avoid duplicates
  mainButton.onClick(onClick);

  mainButton.show();
}

/**
 * Hide the MainButton.
 */
export function hideMainButton(): void {
  const webApp = getWebApp();
  webApp?.MainButton?.hide();
}

/**
 * Enable the MainButton (clickable).
 */
export function enableMainButton(): void {
  const webApp = getWebApp();
  webApp?.MainButton?.enable();
}

/**
 * Disable the MainButton (not clickable, grayed out).
 */
export function disableMainButton(): void {
  const webApp = getWebApp();
  webApp?.MainButton?.disable();
}

/**
 * Set MainButton loading state (spinner).
 */
export function setMainButtonLoading(isLoading: boolean): void {
  const webApp = getWebApp();
  if (!webApp?.MainButton) return;

  if (isLoading) {
    webApp.MainButton.showProgress(false);
  } else {
    webApp.MainButton.hideProgress();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BackButton control
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Show the BackButton and set its click handler.
 *
 * @param onClick - Callback when back button is clicked
 *
 * @example
 * ```typescript
 * showBackButton(() => {
 *   hapticLight();
 *   navigate(-1);
 * });
 * ```
 */
export function showBackButton(onClick: () => void): void {
  const webApp = getWebApp();
  if (!webApp?.BackButton) return;

  webApp.BackButton.onClick(onClick);
  webApp.BackButton.show();
}

/**
 * Hide the BackButton.
 */
export function hideBackButton(): void {
  const webApp = getWebApp();
  webApp?.BackButton?.hide();
}

// ─────────────────────────────────────────────────────────────────────────────
// Viewport and expand
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expand the Mini App to full height.
 */
export function expandApp(): void {
  const webApp = getWebApp();
  webApp?.expand();
}

/**
 * Check if the Mini App is expanded.
 */
export function isExpanded(): boolean {
  const webApp = getWebApp();
  return webApp?.isExpanded || false;
}

/**
 * Get the current viewport height.
 */
export function getViewportHeight(): number | null {
  const webApp = getWebApp();
  return webApp?.viewportHeight || null;
}

/**
 * Get the current viewport stable height (accounts for keyboard).
 */
export function getViewportStableHeight(): number | null {
  const webApp = getWebApp();
  return webApp?.viewportStableHeight || null;
}

/**
 * Set the header color (top bar in Telegram).
 * @param color - 'bg_color', 'secondary_bg_color', or hex color
 */
export function setHeaderColor(color: string): void {
  const webApp = getWebApp();
  webApp?.setHeaderColor(color);
}

/**
 * Set the background color.
 * @param color - 'bg_color', 'secondary_bg_color', or hex color
 */
export function setBackgroundColor(color: string): void {
  const webApp = getWebApp();
  webApp?.setBackgroundColor(color);
}

// ─────────────────────────────────────────────────────────────────────────────
// App lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Close the Mini App.
 */
export function closeApp(): void {
  const webApp = getWebApp();
  webApp?.close();
}

/**
 * Signal that the app is ready to be displayed.
 * Call this after initial render to hide the loading screen.
 */
export function ready(): void {
  const webApp = getWebApp();
  webApp?.ready();
}

/**
 * Signal that the app needs to be resized.
 * Call after dynamic content changes that affect height.
 */
export function expand(): void {
  const webApp = getWebApp();
  webApp?.expand();
}

// ─────────────────────────────────────────────────────────────────────────────
// CloudStorage (key-value persistence)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save data to Telegram CloudStorage.
 * Data persists across sessions and is tied to the user.
 *
 * @param key - Storage key
 * @param value - Value to store (string)
 * @returns Promise that resolves when stored
 *
 * @example
 * ```typescript
 * await cloudStorageSet('cart', JSON.stringify(cartItems));
 * ```
 */
export function cloudStorageSet(key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const webApp = getWebApp();
    if (!webApp?.CloudStorage) {
      reject(new Error('CloudStorage not available'));
      return;
    }

    webApp.CloudStorage.setItem(key, value, (error: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get data from Telegram CloudStorage.
 *
 * @param key - Storage key
 * @returns Promise with the stored value or null
 *
 * @example
 * ```typescript
 * const cartJson = await cloudStorageGet('cart');
 * const cart = cartJson ? JSON.parse(cartJson) : [];
 * ```
 */
export function cloudStorageGet(key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const webApp = getWebApp();
    if (!webApp?.CloudStorage) {
      reject(new Error('CloudStorage not available'));
      return;
    }

    webApp.CloudStorage.getItem(key, (error: Error | null, value: string | null) => {
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    });
  });
}

/**
 * Remove data from Telegram CloudStorage.
 *
 * @param key - Storage key to remove
 */
export function cloudStorageRemove(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const webApp = getWebApp();
    if (!webApp?.CloudStorage) {
      reject(new Error('CloudStorage not available'));
      return;
    }

    webApp.CloudStorage.removeItem(key, (error: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get all keys from Telegram CloudStorage.
 */
export function cloudStorageGetKeys(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const webApp = getWebApp();
    if (!webApp?.CloudStorage) {
      reject(new Error('CloudStorage not available'));
      return;
    }

    webApp.CloudStorage.getKeys((error: Error | null, keys: string[] | null) => {
      if (error) {
        reject(error);
      } else {
        resolve(keys || []);
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Biometric authentication
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if biometric authentication is available on the device.
 */
export function isBiometricAvailable(): boolean {
  const webApp = getWebApp();
  return webApp?.BiometricManager?.isBiometricAvailable || false;
}

/**
 * Request access to biometric authentication.
 *
 * @param params - Request parameters
 * @returns Promise with access status
 */
export function requestBiometricAccess(params?: {
  reason?: string;
}): Promise<BiometricAuthRequest> {
  return new Promise((resolve, reject) => {
    const webApp = getWebApp();
    if (!webApp?.BiometricManager) {
      reject(new Error('BiometricManager not available'));
      return;
    }

    webApp.BiometricManager.requestAccess(params, (status: BiometricAuthRequest) => {
      resolve(status);
    });
  });
}

/**
 * Authenticate using biometric.
 *
 * @param params - Authentication parameters
 * @returns Promise with authentication result
 */
export function authenticateBiometric(params?: {
  reason?: string;
}): Promise<{
  authenticated: boolean;
  token?: string;
}> {
  return new Promise((resolve, reject) => {
    const webApp = getWebApp();
    if (!webApp?.BiometricManager) {
      reject(new Error('BiometricManager not available'));
      return;
    }

    webApp.BiometricManager.authenticate(params, (authenticated: boolean, token?: string) => {
      resolve({ authenticated, token });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// QR code scanner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Open QR code scanner.
 *
 * @param text - Optional text to display above scanner
 * @returns Promise with scanned QR code data or null if cancelled
 *
 * @example
 * ```typescript
 * const qrData = await scanQR('Scan product QR code');
 * if (qrData) {
 *   navigate(`/product/${qrData}`);
 * }
 * ```
 */
export function scanQR(text?: string): Promise<string | null> {
  return new Promise((resolve) => {
    const webApp = getWebApp();
    if (!webApp?.showScanQrPopup) {
      resolve(null);
      return;
    }

    webApp.showScanQrPopup({ text }, (data: string) => {
      resolve(data);
      return true; // Close popup after scan
    });
  });
}

/**
 * Close QR code scanner popup.
 */
export function closeQRScanner(): void {
  const webApp = getWebApp();
  webApp?.closeScanQrPopup();
}

// ─────────────────────────────────────────────────────────────────────────────
// Share and clipboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Share URL via Telegram's native share dialog.
 *
 * @param url - URL to share
 * @param text - Optional text to accompany the URL
 */
export function shareURL(url: string, text?: string): void {
  const webApp = getWebApp();
  webApp?.openTelegramLink?.(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text || '')}`);
}

/**
 * Copy text to clipboard.
 *
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 */
export function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const webApp = getWebApp();
    if (!webApp?.readTextFromClipboard) {
      // Fallback to native clipboard API
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(resolve).catch(reject);
      } else {
        reject(new Error('Clipboard not available'));
      }
      return;
    }

    // Telegram's clipboard API is read-only, use native for write
    navigator.clipboard.writeText(text).then(resolve).catch(reject);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform info
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the platform the user is on.
 * Returns: 'ios', 'android', 'macos', 'web', 'weba', 'tdesktop', 'unknown'
 */
export function getPlatform(): string {
  const webApp = getWebApp();
  return webApp?.platform || 'unknown';
}

/**
 * Get the Telegram app version.
 */
export function getTelegramVersion(): string | null {
  const webApp = getWebApp();
  return webApp?.version || null;
}

/**
 * Check if the current version supports a specific feature.
 *
 * @param feature - Feature name (e.g., '6.0', '6.1', '6.2')
 */
export function isVersionAtLeast(version: string): boolean {
  const webApp = getWebApp();
  return webApp?.isVersionAtLeast(version) || false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Event listeners
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Listen for theme changes (when user switches between light/dark mode).
 *
 * @param callback - Function called when theme changes
 * @returns Cleanup function to remove listener
 *
 * @example
 * ```typescript
 * useEffect(() => {
 *   const cleanup = onThemeChange(() => {
 *     applyThemeToDocument();
 *   });
 *   return cleanup;
 * }, []);
 * ```
 */
export function onThemeChange(callback: () => void): () => void {
  const webApp = getWebApp();
  if (!webApp) return () => {};

  webApp.onEvent('themeChanged', callback);
  return () => webApp.offEvent('themeChanged', callback);
}

/**
 * Listen for viewport changes (when keyboard opens/closes).
 *
 * @param callback - Function called when viewport changes
 * @returns Cleanup function to remove listener
 */
export function onViewportChange(callback: () => void): () => void {
  const webApp = getWebApp();
  if (!webApp) return () => {};

  webApp.onEvent('viewportChanged', callback);
  return () => webApp.offEvent('viewportChanged', callback);
}

/**
 * Listen for main button clicks.
 *
 * @param callback - Function called when main button is clicked
 * @returns Cleanup function to remove listener
 */
export function onMainButtonClick(callback: () => void): () => void {
  const webApp = getWebApp();
  if (!webApp) return () => {};

  webApp.onEvent('mainButtonClicked', callback);
  return () => webApp.offEvent('mainButtonClicked', callback);
}

/**
 * Listen for back button clicks.
 *
 * @param callback - Function called when back button is clicked
 * @returns Cleanup function to remove listener
 */
export function onBackButtonClick(callback: () => void): () => void {
  const webApp = getWebApp();
  if (!webApp) return () => {};

  webApp.onEvent('backButtonClicked', callback);
  return () => webApp.offEvent('backButtonClicked', callback);
}

// ─────────────────────────────────────────────────────────────────────────────
// Type augmentation for window
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/**
 * Simplified Telegram WebApp interface for TypeScript.
 * Full interface available at @twa-dev/sdk.
 */
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramInitData;
  version: string;
  platform: string;
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    setParams: (params: Record<string, unknown>) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: HapticImpactStyle) => void;
    notificationOccurred: (type: HapticNotificationType) => void;
    selectionChanged: () => void;
  };
  CloudStorage: {
    setItem: (key: string, value: string, callback: (error: Error | null) => void) => void;
    getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void;
    removeItem: (key: string, callback: (error: Error | null) => void) => void;
    getKeys: (callback: (error: Error | null, keys: string[] | null) => void) => void;
  };
  BiometricManager: {
    isBiometricAvailable: boolean;
    requestAccess: (params: unknown, callback: (status: BiometricAuthRequest) => void) => void;
    authenticate: (params: unknown, callback: (authenticated: boolean, token?: string) => void) => void;
  };
  showScanQrPopup: (params: { text?: string }, callback: (data: string) => boolean) => void;
  closeScanQrPopup: () => void;
  openTelegramLink: (url: string) => void;
  readTextFromClipboard: (callback: (text: string) => void) => void;
  expand: () => void;
  close: () => void;
  ready: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  isVersionAtLeast: (version: string) => boolean;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
}

export default {
  // InitData
  getInitData,
  getInitDataUnsafe,
  getUser,
  getStartParam,
  getChatInstance,
  // Theme
  getThemeParams,
  getThemeColor,
  applyThemeToDocument,
  // Haptic
  hapticFeedback,
  hapticLight,
  hapticMedium,
  hapticSuccess,
  hapticError,
  // MainButton
  showMainButton,
  hideMainButton,
  enableMainButton,
  disableMainButton,
  setMainButtonLoading,
  // BackButton
  showBackButton,
  hideBackButton,
  // Viewport
  expandApp,
  isExpanded,
  getViewportHeight,
  getViewportStableHeight,
  setHeaderColor,
  setBackgroundColor,
  // Lifecycle
  closeApp,
  ready,
  expand,
  // CloudStorage
  cloudStorageSet,
  cloudStorageGet,
  cloudStorageRemove,
  cloudStorageGetKeys,
  // Biometric
  isBiometricAvailable,
  requestBiometricAccess,
  authenticateBiometric,
  // QR
  scanQR,
  closeQRScanner,
  // Share
  shareURL,
  copyToClipboard,
  // Platform
  getPlatform,
  getTelegramVersion,
  isVersionAtLeast,
  // Events
  onThemeChange,
  onViewportChange,
  onMainButtonClick,
  onBackButtonClick,
  // Checks
  getWebApp,
  isTelegramWebApp,
};
