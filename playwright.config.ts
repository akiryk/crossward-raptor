import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.local' });

// Story A3: specs that must run signed out (they exercise sign-in itself,
// or only assert layout that renders on the public front door). Everything
// else needs a session, since every other route now redirects without one.
const PUBLIC_SPECS = [
  '**/magic-link.spec.ts',
  '**/front-door.spec.ts',
  '**/route-protection.spec.ts',
  '**/session-validation.spec.ts',
  '**/smoke.spec.ts',
  '**/shell.spec.ts',
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
  },
  projects: [
    {
      name: 'public',
      testMatch: PUBLIC_SPECS,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'authenticated',
      testIgnore: PUBLIC_SPECS,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
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
