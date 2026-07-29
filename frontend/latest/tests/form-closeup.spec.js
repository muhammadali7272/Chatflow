import { test } from '@playwright/test';
import fs from 'fs';

const SHOT_DIR = 'screenshots';
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

test('login form closeup', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.fill('#login-email', 'muhammadali@example.com');
  await page.fill('#login-password', 'secret12');
  await page.waitForTimeout(400);
  const card = page.locator('form').first();
  await card.screenshot({ path: `${SHOT_DIR}/login-closeup.png` });
});

test('register form closeup', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1100 });
  await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
  await page.fill('#reg-firstname', 'Muhammadali');
  await page.fill('#reg-email', 'test@example.com');
  await page.waitForTimeout(400);
  const card = page.locator('form').first();
  await card.screenshot({ path: `${SHOT_DIR}/register-closeup.png` });
});
