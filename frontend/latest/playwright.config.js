import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx vite --port 3000',
    port: 3000,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
