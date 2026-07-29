import { test, expect } from '@playwright/test';
import fs from 'fs';

const SHOT_DIR = 'screenshots';
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

async function login(page) {
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForSelector('#login-email');
  await page.fill('#login-email', 'admin@chatflow.com');
  await page.fill('#login-password', '2008');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/chat', { timeout: 15000 });
  await page.waitForTimeout(2000);
}

test('theme + language switch end-to-end', async ({ page }) => {
  await login(page);

  // Dark chat
  await page.screenshot({ path: `${SHOT_DIR}/tl-1-dark.png` });
  const themeStart = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(themeStart).toBe('dark');

  // Open account drawer (sidebar header profile button) → Settings
  await page.getByRole('button', { name: /Muhammadali/ }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /^Settings$/ }).click();
  await page.waitForTimeout(400);

  // Toggle theme → light
  await page.locator('button.w-12.h-6').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOT_DIR}/tl-2-light.png` });
  const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(themeAfter).toBe('light');

  // Change language → Uzbek
  await page.locator('select').selectOption('uz');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOT_DIR}/tl-3-light-uz.png` });

  // Persistence
  const stored = await page.evaluate(() => ({
    theme: localStorage.getItem('theme'),
    lang: localStorage.getItem('lang'),
  }));
  expect(stored.theme).toBe('light');
  expect(stored.lang).toBe('uz');

  // Reload → theme + language restored (no flash to dark/english)
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const afterReload = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(afterReload).toBe('light');
  await page.screenshot({ path: `${SHOT_DIR}/tl-4-reload-light-uz.png` });
});
