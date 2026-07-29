import { test, expect } from '@playwright/test';
import fs from 'fs';

const SHOT_DIR = 'screenshots';
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

test('realtime validation shows errors on login', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // Invalid email → blur → error appears
  await page.fill('#login-email', 'not-an-email');
  await page.locator('#login-email').blur();
  await expect(page.getByText('Please enter a valid email address')).toBeVisible();

  // Empty password → blur → "required" error (login enforces presence only,
  // not length — short/legacy passwords like the admin account can sign in)
  await page.locator('#login-password').click();
  await page.locator('#login-password').blur();
  await expect(page.getByText('Password is required')).toBeVisible();

  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOT_DIR}/validation.png`, fullPage: true });

  // Fix email live (field already touched) → error clears
  await page.fill('#login-email', 'demo@chatflow.com');
  await expect(page.getByText('Please enter a valid email address')).toHaveCount(0);
});
