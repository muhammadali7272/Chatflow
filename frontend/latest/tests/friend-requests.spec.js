import { test, expect } from '@playwright/test';
import fs from 'fs';

const SHOT_DIR = 'screenshots';
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

test('Friend Requests page: Discovery + Requests tabs render without errors', async ({ page }) => {
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForSelector('#login-email');
  await page.fill('#login-email', 'admin@chatflow.com');
  await page.fill('#login-password', '2008');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/chat', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Navigate via the sidebar's Friend Requests entry point
  await page.locator('button:has-text("Friend Requests")').click();
  await page.waitForURL('**/friends', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOT_DIR}/friends-discovery.png` });

  const discoveryTab = page.getByRole('button', { name: 'Discovery', exact: true });
  const requestsTab = page.getByRole('button', { name: 'Requests', exact: true });
  await expect(discoveryTab).toBeVisible();
  await expect(requestsTab).toBeVisible();

  // Switch to Requests tab — must actually change content, not just be visible
  await requestsTab.click();
  await page.waitForURL('**tab=requests**', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOT_DIR}/friends-requests.png` });
  // Discovery-only content (Add buttons) must be gone once on the Requests tab
  await expect(page.getByText('Add', { exact: true }).first()).not.toBeVisible();

  console.log('pageerrors:', errs.slice(0, 10));
  expect(errs.length, `Console page errors: ${errs.join('; ')}`).toBe(0);
});
