import { test } from '@playwright/test';
import fs from 'fs';

const SHOT_DIR = 'screenshots';
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

// Capture the branded full-screen Loader by seeding a persisted session and
// delaying the /verify response so the "Verifying" state stays on screen.
test('loading screen screenshot', async ({ page }) => {
  // Delay the token verification so the loader is visible long enough to shoot.
  await page.route('**/api/auth/verify', async (route) => {
    await new Promise((r) => setTimeout(r, 3000));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ valid: true }),
    });
  });

  // Seed redux-persist auth state so ProtectedRoute treats us as logged in.
  await page.addInitScript(() => {
    const auth = JSON.stringify({
      user: { _id: '1', email: 'demo@chatflow.com', firstName: 'Demo' },
      token: 'seed-token',
      isAuthenticated: true,
      loading: false,
      error: null,
    });
    localStorage.setItem(
      'persist:root',
      JSON.stringify({ auth, _persist: '{"version":-1,"rehydrated":true}' })
    );
  });

  await page.goto('http://localhost:3000/chat');
  await page.waitForTimeout(700); // let the loader paint
  await page.screenshot({ path: `${SHOT_DIR}/loading-screen.png`, fullPage: false });
});
