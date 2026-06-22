import { test, expect } from './setup';

test.describe('Catalog E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Wait for app to load
    await page.waitForSelector('[data-testid="catalog-page"]', { timeout: 10000 });
  });

  test('displays product catalog', async ({ page }) => {
    // Check catalog page is visible
    await expect(page.locator('[data-testid="catalog-page"]')).toBeVisible();

    // Check products are loaded
    const products = page.locator('[data-testid="product-card"]');
    await expect(products.first()).toBeVisible({ timeout: 5000 });

    // Check product has required elements
    const firstProduct = products.first();
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();
  });

  test('filters products by category', async ({ page }) => {
    // Click category filter
    await page.click('[data-testid="category-filter"]');
    await page.click('[data-testid="category-electronics"]');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Check filtered products
    const products = page.locator('[data-testid="product-card"]');
    const count = await products.count();
    expect(count).toBeGreaterThan(0);
  });

  test('searches products', async ({ page }) => {
    // Type in search
    await page.fill('[data-testid="search-input"]', 'iPhone');
    await page.press('[data-testid="search-input"]', 'Enter');

    // Wait for search results
    await page.waitForTimeout(500);

    // Check search results
    const products = page.locator('[data-testid="product-card"]');
    await expect(products.first()).toBeVisible();
  });

  test('adds product to cart', async ({ page }) => {
    // Find first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    
    // Click add to cart
    await firstProduct.locator('[data-testid="add-to-cart"]').click();

    // Check cart badge updated
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1');

    // Check haptic feedback (mocked)
    // In real test, would verify haptic was called
  });

  test('navigates to product detail', async ({ page }) => {
    // Click first product
    await page.click('[data-testid="product-card"]:first-child');

    // Check product detail page
    await expect(page.locator('[data-testid="product-detail-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-detail-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-detail-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-detail-description"]')).toBeVisible();
  });
});
