import { test as setup } from '@playwright/test';
import { signInSeededUser } from './helpers/seed-session';

const authFile = 'e2e/.auth/user.json';

/**
 * Runs once per suite run (the "setup" project, ahead of "authenticated"'s
 * dependency on it): seeds one signed-in user via signInSeededUser and
 * saves the resulting storageState for every "authenticated" spec to load.
 * A single shared user is fine here — see the story's seeding decision.
 */
setup('authenticate', async ({ page }) => {
  await signInSeededUser(page);
  await page.context().storageState({ path: authFile });
});
