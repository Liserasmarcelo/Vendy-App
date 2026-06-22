import { test, expect } from './setup';

test.describe('Cart E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="catalog-page"]', { timeout: 10000 });

    // Add product to cart
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]');
    await page.waitForTimeout(300);
  });

  test('displays cart with items', async ({ page }) => {
    // Navigate to cart
    await page.click('[data-testid="cart-tab"]');

    // Check cart page
    await expect(page.locator('[data-testid="cart-page"]')).toBeVisible();

    // Check cart items
    const items = page.locator('[data-testid="cart-item"]');
    await expect(items.first()).toBeVisible();

    // Check cart total
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
  });

  test('updates item quantity', async ({ page }) => {
    // Navigate to cart
    await page.click('[data-testid="cart-tab"]');
    await page.waitForSelector('[data-testid="cart-page"]');

    // Increase quantity
    await page.click('[data-testid="increase-quantity"]');
    await page.waitForTimeout(300);

    // Check quantity updated
    await expect(page.locator('[data-testid="item-quantity"]')).toHaveText('2');

    // Check total updated
    const total = await page.locator('[data-testid="cart-total"]').textContent();
    expect(total).toBeTruthy();
  });

  test('removes item from cart', async ({ page }) => {
    // Navigate to cart
    await page.click('[data-testid="cart-tab"]');
    await page.waitForSelector('[data-testid="cart-page"]');

    // Remove item
    await page.click('[data-testid="remove-item"]');
    await page.waitForTimeout(300);

    // Check cart is empty
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible();
  });

  test('applies coupon', async ({ page }) => {
    // Navigate to cart
    await page.click('[data-testid="cart-tab"]');
    await page.waitForSelector('[data-testid="cart-page"]');

    // Add more items for coupon threshold
    await page.click('[data-testid="increase-quantity"]');
    await page.click('[data-testid="increase-quantity"]');
    await page.waitForTimeout(300);

    // Apply coupon
    await page.fill('[data-testid="coupon-input"]', 'DESCUENTO10');
    await page.click('[data-testid="apply-coupon"]');
    await page.waitForTimeout(500);

    // Check discount applied
    await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible();
  });

  test('proceeds to checkout', async ({ page }) => {
    // Navigate to cart
    await page.click('[data-testid="cart-tab"]');
    await page.waitForSelector('[data-testid="cart-page"]');

    // Click checkout
    await page.click('[data-testid="checkout-button"]');

    // Check checkout page
    await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();
  });
});
