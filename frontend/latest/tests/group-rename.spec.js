import { test, expect } from '@playwright/test';

test('group rename syncs end-to-end (revertible)', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForSelector('#login-email');
  await page.fill('#login-email', 'admin@chatflow.com');
  await page.fill('#login-password', '2008');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/chat', { timeout: 15000 });
  await page.waitForTimeout(2500);

  // Open group + group info
  await page.locator('text=/members —/').first().click();
  await page.waitForTimeout(1200);
  await page.locator('button[title="Group Info"]').first().click();
  await page.waitForTimeout(800);

  const nameInput = page.locator('input:not([placeholder])').first();
  const original = await nameInput.inputValue();

  // Rename → save → header reflects new name (real-time via socket → DB → redux)
  await nameInput.fill(original + ' ✓');
  await page.getByRole('button', { name: /Save changes/ }).click();
  await page.waitForTimeout(1500);
  await expect(page.locator('h2', { hasText: original + ' ✓' }).first()).toBeVisible();

  // Revert back to the original name
  await nameInput.fill(original);
  await page.getByRole('button', { name: /Save changes/ }).click();
  await page.waitForTimeout(1500);
  await expect(page.locator('h2', { hasText: original }).first()).toBeVisible();
});
