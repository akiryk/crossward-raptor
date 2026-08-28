import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.development.local' });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    // Always false, unlike the usual !process.env.CI pattern: this
    // webServer always needs the DATABASE_URL override below, so reusing
    // an already-running dev server (started with the real DATABASE_URL)
    // is never correct here. A stale server would otherwise silently query
    // the wrong database instead of failing loudly with "port in use".
    reuseExistingServer: false,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
    },
  },
});
