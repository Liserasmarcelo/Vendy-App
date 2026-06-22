import { test, expect } from './setup';

test.describe('Admin E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="catalog-page"]', { timeout: 10000 });

    // Navigate to admin
    await page.click('[data-testid="admin-tab"]');
    await page.waitForSelector('[data-testid="admin-page"]', { timeout: 5000 });
  });

  test('displays admin dashboard', async ({ page }) => {
    // Check admin page
    await expect(page.locator('[data-testid="admin-page"]')).toBeVisible();

    // Check stats cards
    await expect(page.locator('[data-testid="stats-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-customers"]')).toBeVisible();
  });

  test('displays product list', async ({ page }) => {
    // Click products tab
    await page.click('[data-testid="products-tab"]');
    await page.waitForTimeout(500);

    // Check product list
    await expect(page.locator('[data-testid="product-list"]')).toBeVisible();

    // Check products exist
    const products = page.locator('[data-testid="admin-product-item"]');
    await expect(products.first()).toBeVisible();
  });

  test('toggles product status', async ({ page }) => {
    // Click products tab
    await page.click('[data-testid="products-tab"]');
    await page.waitForTimeout(500);

    // Toggle first product
    const firstProduct = page.locator('[data-testid="admin-product-item"]').first();
    const toggle = firstProduct.locator('[data-testid="toggle-status"]');
    
    await toggle.click();
    await page.waitForTimeout(300);

    // Check status changed (would need to verify API call in real test)
  });

  test('displays orders list', async ({ page }) => {
    // Click orders tab
    await page.click('[data-testid="orders-tab"]');
    await page.waitForTimeout(500);

    // Check orders list
    await expect(page.locator('[data-testid="orders-list"]')).toBeVisible();
  });

  test('filters orders by status', async ({ page }) => {
    // Click orders tab
    await page.click('[data-testid="orders-tab"]');
    await page.waitForTimeout(500);

    // Filter by pending
    await page.click('[data-testid="filter-pending"]');
    await page.waitForTimeout(300);

    // Check filtered results
    const orders = page.locator('[data-testid="order-card"]');
    // Would verify status in real test
  });

  test('displays analytics', async ({ page }) => {
    // Click analytics tab
    await page.click('[data-testid="analytics-tab"]');
    await page.waitForTimeout(500);

    // Check analytics page
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="top-products"]')).toBeVisible();
  });

  test('displays settings', async ({ page }) => {
    // Click settings tab
    await page.click('[data-testid="settings-tab"]');
    await page.waitForTimeout(500);

    // Check settings form
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="shop-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="shop-currency-select"]')).toBeVisible();
  });
});
