import { defineConfig, devices } from '@playwright/test';
import { e2eEnvironment } from './scripts/e2e-env.mjs';

// Helpers and every preparation/build/server child use the same isolated URL.
// Set it before helpers can load dotenv, which never overrides explicit values.
const e2eEnv = e2eEnvironment();
Object.assign(process.env, e2eEnv);

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

// Story 14-S9: the suite runs with reduced motion, because a dialog's
// entrance scale would move the boxes frozen tests measure right after it
// opens; reduced motion leaves only its fade. The confetti hides under
// reduced motion, so the specs that check it run with full motion instead.
// modal-entrance.spec.ts sets full motion itself.
const FULL_MOTION_SPECS = [
  '**/play-completion.spec.ts',
  '**/play-reset.spec.ts',
  '**/play-reset-settling.spec.ts',
];

// Story 15-S1: play's narrow layout starts below about 1290px, so the
// default viewport is 1440px wide, wider than Desktop Chrome's 1280×720.
const VIEWPORT = { width: 1440, height: 900 };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    {
      name: 'public',
      testMatch: PUBLIC_SPECS,
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT },
    },
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT },
    },
    {
      name: 'authenticated',
      testIgnore: [...PUBLIC_SPECS, ...FULL_MOTION_SPECS],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORT,
        storageState: 'e2e/.auth/user.json',
      },
    },
    {
      name: 'authenticated-full-motion',
      testMatch: FULL_MOTION_SPECS,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORT,
        storageState: 'e2e/.auth/user.json',
        contextOptions: { reducedMotion: 'no-preference' },
      },
    },
  ],
  webServer: {
    // A dedicated port, distinct from npm run dev's default 3000.
    command: 'node scripts/e2e-server.mjs',
    url: 'http://localhost:3100',
    // Includes a fresh production build; browser/assertion budgets stay intact.
    timeout: 180_000,
    // Let the launcher stop its npm/build/server group before Playwright's
    // fallback kill. The launcher bounds its own cleanup at ten seconds.
    gracefulShutdown: { signal: 'SIGTERM', timeout: 15_000 },
    // Still false, unlike the usual !process.env.CI pattern: this
    // webServer always needs the explicit test environment below, so reusing
    // an already-running server (started with the real DATABASE_URL)
    // is never correct here. The dedicated port above stops accidental
    // collisions with a manual dev server; this stops a stale leftover
    // Playwright-spawned server (e.g. from a killed previous run) from
    // being silently reused with the wrong database.
    reuseExistingServer: false,
    env: e2eEnv,
  },
});
