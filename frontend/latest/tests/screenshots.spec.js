import { test, expect } from '@playwright/test';
import fs from 'fs';

const SHOT_DIR = 'screenshots';
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

test('frontend login screenshot', async ({ page }) => {
  const res = await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  expect(res.status()).toBe(200);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${SHOT_DIR}/frontend.png`, fullPage: true });
});

test('frontend register screenshot', async ({ page }) => {
  await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${SHOT_DIR}/frontend-register.png`, fullPage: true });
});

test('frontend chat screenshot (logged in)', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.fill('#login-email', 'demo@chatflow.com');
  await page.fill('#login-password', '12345678');
  await page.click('button[type="submit"]');
  // Wait until we land on the chat route
  await page.waitForURL('**/chat', { timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SHOT_DIR}/frontend-chat.png`, fullPage: false });
});

test('backend root screenshot', async ({ page }) => {
  const res = await page.goto('http://localhost:5000/', { waitUntil: 'load' });
  expect(res.status()).toBe(200);
  await page.screenshot({ path: `${SHOT_DIR}/backend-root.png`, fullPage: true });
});

test('backend health screenshot', async ({ page }) => {
  const res = await page.goto('http://localhost:5000/api/health', { waitUntil: 'load' });
  expect(res.status()).toBe(200);
  const body = await page.textContent('body');
  expect(body).toContain('"status":"ok"');
  await page.screenshot({ path: `${SHOT_DIR}/backend-health.png`, fullPage: true });
});
