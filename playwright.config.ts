import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.development.local' });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // A dedicated port, distinct from npm run dev's default 3000, so this
    // suite's own server never collides with a manually-run dev server.
    command: 'next dev -p 3100',
    url: 'http://localhost:3100',
    // Still false, unlike the usual !process.env.CI pattern: this
    // webServer always needs the DATABASE_URL override below, so reusing
    // an already-running dev server (started with the real DATABASE_URL)
    // is never correct here. The dedicated port above stops accidental
    // collisions with a manual dev server; this stops a stale leftover
    // Playwright-spawned server (e.g. from a killed previous run) from
    // being silently reused with the wrong database.
    reuseExistingServer: false,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
    },
  },
});
