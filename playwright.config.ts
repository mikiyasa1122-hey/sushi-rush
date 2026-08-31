import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: { command: 'pnpm dev --host 127.0.0.1 --port 4187', url: 'http://127.0.0.1:4187', reuseExistingServer: false },
  use: { baseURL: 'http://127.0.0.1:4187', trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], channel: 'chrome' } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
});
