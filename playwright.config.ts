import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.development.local' });

export default defineConfig({
  testDir: './e2e',
  // Persistence specs share e2e-test database state across tests in the
  // same file (e.g. asserting a list grows by exactly one); fullyParallel
  // would race those tests against each other within a file.
  fullyParallel: false,
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
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
    },
  },
});
