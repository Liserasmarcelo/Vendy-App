import { test as base } from '@playwright/test';

// ==========================================
// E2E TEST SETUP
// ==========================================
export const test = base.extend({
  page: async ({ page }, use) => {
    // Mock Telegram WebApp
    await page.addInitScript(() => {
      window.Telegram = {
        WebApp: {
          initData: 'mock_init_data',
          initDataUnsafe: {
            user: {
              id: 123456,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              language_code: 'es',
            },
            query_id: 'test_query_id',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'mock_hash',
          },
          ready: () => {},
          expand: () => {},
          close: () => {},
          MainButton: {
            show: () => {},
            hide: () => {},
            setText: () => {},
            onClick: () => {},
          },
          BackButton: {
            show: () => {},
            hide: () => {},
            onClick: () => {},
          },
          HapticFeedback: {
            impactOccurred: () => {},
            notificationOccurred: () => {},
            selectionChanged: () => {},
          },
          themeParams: {
            bg_color: '#ffffff',
            text_color: '#000000',
            hint_color: '#999999',
            link_color: '#FF7403',
            button_color: '#FF7403',
            button_text_color: '#ffffff',
          },
          colorScheme: 'light',
          viewportHeight: 600,
          viewportStableHeight: 600,
          isExpanded: true,
        },
      };
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
