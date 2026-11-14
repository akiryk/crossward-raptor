import { test as setup } from '@playwright/test';
import { signInSeededCollaborator, signInSeededUser } from './helpers/seed-session';

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

/**
 * Epic 24 (24-S5): the second seeded account, "Jay", for two-user tests
 * (`e2e/helpers/collaborators.ts`). Specs make Jay a collaborator by writing
 * the membership directly.
 */
setup('authenticate the collaborator', async ({ page }) => {
  await signInSeededCollaborator(page);
  await page.context().storageState({ path: 'e2e/.auth/collaborator.json' });
});
