import { test, expect } from '@playwright/test';
import { signInSeededUser } from './helpers/seed-session';
import { invalidateSession, countPuzzlesNamed } from './helpers/session-validation';
import { seedPuzzle } from './helpers/seed-puzzle';
import { createBlankPuzzle } from '../src/lib/puzzle-storage';
import { waitForNewPuzzleReady } from './helpers/wait-for-ready';

// Supplemental security regressions: cookie presence alone must not authorize
// a route or a Server Action. Every test starts without the suite's shared user.
test.describe('A3 authoritative session validation', () => {
  for (const mode of ['invalid cookie', 'expired', 'revoked'] as const) {
    for (const route of ['list', 'detail', 'style guide'] as const) {
      test(`${mode} cannot access the ${route}`, async ({ page }) => {
        const { id } = await seedPuzzle(createBlankPuzzle('mini'));
        const { email } = await signInSeededUser(page);
        if (mode === 'invalid cookie') {
          const sessionCookie = (await page.context().cookies()).find((cookie) => cookie.name.endsWith('.session_token'));
          expect(sessionCookie).toBeDefined();
          await page.context().addCookies([{ ...sessionCookie!, value: 'invalid.signature' }]);
        } else {
          await invalidateSession(email, mode);
        }

        const path = route === 'list' ? '/puzzles' : route === 'detail' ? `/puzzles/${id}` : '/style-guide';
        await page.goto(path);

        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByTestId('front-door')).toBeVisible();
        await expect(page.getByTestId('sign-out')).toHaveCount(0);
      });
    }
  }

  for (const mode of ['expired', 'revoked'] as const) {
    test(`an ${mode} session cannot create from an already loaded page`, async ({ page }) => {
      const { email } = await signInSeededUser(page);
      await page.goto('/puzzles');
      await waitForNewPuzzleReady(page);
      await page.getByTestId('new-puzzle-button').click();
      const title = `A3 denied ${mode} ${Date.now()}-${Math.random()}`;
      await page.getByTestId('new-puzzle-name').fill(title);
      expect(await countPuzzlesNamed(title)).toBe(0);
      await invalidateSession(email, mode);

      await page.getByTestId('new-puzzle-create').click();

      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByTestId('front-door')).toBeVisible();
      expect(await countPuzzlesNamed(title)).toBe(0);
    });
  }
});
