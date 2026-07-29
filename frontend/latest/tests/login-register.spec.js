import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear persisted auth state to avoid redirect to /chat
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      // Clear redux-persist storage
      for (const key in localStorage) {
        if (key.startsWith('persist:') || key.includes('redux') || key.includes('persist')) {
          localStorage.removeItem(key);
        }
      }
    });
    // Reload after clearing
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display login form by default', async ({ page }) => {
    await expect(page.locator('text=Welcome Back')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await emailInput.fill('invalid-email');

    // Fill a password too so button is enabled
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');

    // Click Sign In button
    await page.locator('button:has-text("Sign In")').click();

    // Wait a bit for React to process the validation
    await page.waitForTimeout(500);

    // Error should appear
    await expect(page.getByText('Please enter a valid email address').first()).toBeVisible({ timeout: 5000 });
  });

  // Login intentionally skips password-length validation (see Login.jsx:
  // legacy/short passwords must be able to sign in; length is enforced at
  // registration only), so a short password must NOT be blocked client-side.
  test('should not block short/legacy passwords with a length error', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await emailInput.fill('testuser@gmail.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('123');

    // Click Sign In button
    await page.locator('button:has-text("Sign In")').click();

    // Wait for validation
    await page.waitForTimeout(500);

    // No client-side length validation error may appear on login
    await expect(page.getByText('8 characters')).toHaveCount(0);
  });

  test('should enable submit with valid inputs', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await emailInput.fill('testuser@gmail.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');

    const submitBtn = page.locator('button:has-text("Sign In")');
    await expect(submitBtn).toBeEnabled();
  });

  test('should have working link to register page', async ({ page }) => {
    // Ensure we're on login page
    await expect(page.locator('text=Welcome Back')).toBeVisible({ timeout: 8000 });

    // Verify the link exists and points to /register
    const createAccountLink = page.locator('a[href="/register"]');
    await expect(createAccountLink).toBeVisible();
    await expect(createAccountLink).toHaveText('Create one');
  });
});

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      for (const key in localStorage) {
        if (key.startsWith('persist:') || key.includes('redux') || key.includes('persist')) {
          localStorage.removeItem(key);
        }
      }
    });
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  });

  test('should display register form with all fields', async ({ page }) => {
    await expect(page.locator('h1:has-text("Create Account")')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[id="reg-firstname"]')).toBeVisible();
    await expect(page.locator('input[id="reg-lastname"]')).toBeVisible();
    await expect(page.locator('input[id="reg-age"]')).toBeVisible();
    await expect(page.locator('input[id="reg-email"]')).toBeVisible();
    await expect(page.locator('input[id="reg-password"]')).toBeVisible();
    await expect(page.locator('input[id="reg-confirm-password"]')).toBeVisible();
  });

  test('should have Create Account button visible when form is empty', async ({ page }) => {
    const createBtn = page.locator('button:has-text("Create Account")');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toBeEnabled();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.locator('button:has-text("Create Account")').click({ force: true });
    await page.waitForTimeout(500);

    // Should show validation errors
    await expect(page.getByText('required').first()).toBeVisible({ timeout: 3000 });
  });

  test('should show password mismatch error', async ({ page }) => {
    await page.locator('input[id="reg-firstname"]').fill('John');
    await page.locator('input[id="reg-lastname"]').fill('Doe');
    await page.locator('input[id="reg-age"]').fill('25');
    await page.locator('input[id="reg-email"]').fill('testuser@gmail.com');
    await page.locator('input[id="reg-password"]').fill('password123');
    await page.locator('input[id="reg-confirm-password"]').fill('differentpassword');

    await page.locator('button:has-text("Create Account")').click({ force: true });
    await page.waitForTimeout(500);

    await expect(page.getByText('Passwords do not match')).toBeVisible({ timeout: 3000 });
  });

  test('should have working link back to login page', async ({ page }) => {
    const signInLink = page.locator('a[href="/login"]');
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveText('Sign in');
  });
});
