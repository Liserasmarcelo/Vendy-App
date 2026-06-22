import { test, expect } from './setup';

test.describe('Checkout E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="catalog-page"]', { timeout: 10000 });

    // Add product and go to checkout
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="cart-tab"]');
    await page.waitForSelector('[data-testid="cart-page"]');
    await page.click('[data-testid="checkout-button"]');
    await page.waitForSelector('[data-testid="checkout-page"]');
  });

  test('displays checkout form', async ({ page }) => {
    // Check checkout page elements
    await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible();
  });

  test('fills shipping information', async ({ page }) => {
    // Fill shipping form
    await page.fill('[data-testid="shipping-name"]', 'Juan Pérez');
    await page.fill('[data-testid="shipping-phone"]', '+595 981 123456');
    await page.fill('[data-testid="shipping-address"]', 'Calle 123, Asunción');

    // Check form is filled
    await expect(page.locator('[data-testid="shipping-name"]')).toHaveValue('Juan Pérez');
    await expect(page.locator('[data-testid="shipping-phone"]')).toHaveValue('+595 981 123456');
  });

  test('selects payment method', async ({ page }) => {
    // Select Stripe
    await page.click('[data-testid="payment-stripe"]');
    await expect(page.locator('[data-testid="payment-stripe"]')).toHaveAttribute('data-selected', 'true');

    // Select transfer
    await page.click('[data-testid="payment-transfer"]');
    await expect(page.locator('[data-testid="payment-transfer"]')).toHaveAttribute('data-selected', 'true');

    // Select cash
    await page.click('[data-testid="payment-cash"]');
    await expect(page.locator('[data-testid="payment-cash"]')).toHaveAttribute('data-selected', 'true');
  });

  test('completes checkout with Stripe', async ({ page }) => {
    // Fill shipping
    await page.fill('[data-testid="shipping-name"]', 'Juan Pérez');
    await page.fill('[data-testid="shipping-phone"]', '+595 981 123456');
    await page.fill('[data-testid="shipping-address"]', 'Calle 123, Asunción');

    // Select Stripe
    await page.click('[data-testid="payment-stripe"]');

    // Submit order
    await page.click('[data-testid="place-order"]');
    await page.waitForTimeout(1000);

    // Check confirmation page
    await expect(page.locator('[data-testid="confirmation-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });

  test('validates required fields', async ({ page }) => {
    // Try to submit without filling form
    await page.click('[data-testid="place-order"]');
    await page.waitForTimeout(300);

    // Check validation errors
    await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-phone"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-address"]')).toBeVisible();
  });
});
