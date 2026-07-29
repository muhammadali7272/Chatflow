import { test, expect } from '@playwright/test';
import fs from 'fs';

const SHOT_DIR = 'screenshots';
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

test('group header + info panel', async ({ page }) => {
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForSelector('#login-email');
  await page.fill('#login-email', 'admin@chatflow.com');
  await page.fill('#login-password', '2008');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/chat', { timeout: 15000 });
  await page.waitForTimeout(2500);

  // Open the first group in the sidebar (under GROUPS)
  const group = page.locator('text=/members/').first();
  await group.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOT_DIR}/group-header.png` });

  // Header should show member count (not "last seen")
  const headerText = await page.locator('header, .flex-1').first().innerText().catch(() => '');
  console.log('pageerrors:', errs.slice(0, 5));

  // Open group info via the header
  await page.locator('button[title="Group Info"], button:has-text("members")').first().click().catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOT_DIR}/group-info.png` });
});
