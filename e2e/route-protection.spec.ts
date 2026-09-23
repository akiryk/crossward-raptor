import { test, expect } from '@playwright/test';
import { signInSeededUser } from './helpers/seed-session';
import { getSession } from './helpers/auth';
import { waitForNewPuzzleReady } from './helpers/wait-for-ready';

// Story A3 — everything except `/` requires a session.
//
// A signed-out visitor to any app route is redirected to the front door; a
// signed-in one reaches it; signing out returns them to the front door and
// clears the session.
//
// This spec runs in the "public" Playwright project (no default storageState),
// so each test starts signed out and authenticates explicitly, via the
// seeded-user helper, only when it needs to. The ~250 builder specs get their
// signed-in state a different way — a storageState seeded once per run (see
// the story); that mechanism isn't exercised here, the redirect rule is. Do
// not edit this file to match an implementation.

test.describe('A3 — route protection', () => {
  test('a signed-out visitor to a protected route is redirected to /', async ({
    page,
  }) => {
    await page.goto('/puzzles');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('front-door')).toBeVisible();

    // Not just /puzzles: the rule is "everything except /".
    await page.goto('/style-guide');
    await expect(page).toHaveURL(/\/$/);
  });

  test('a signed-in visitor reaches the protected route', async ({ page }) => {
    await signInSeededUser(page);

    await page.goto('/puzzles');
    await expect(page).toHaveURL(/\/puzzles(\/|$|\?)/);
    // The list itself, not a redirect to the front door.
    await expect(page.getByTestId('new-puzzle')).toBeVisible();
  });

  test('signing out returns to / and clears the session', async ({ page }) => {
    await signInSeededUser(page);
    await page.goto('/puzzles');
    await waitForNewPuzzleReady(page); // the page (and the sign-out control) has hydrated

    await page.getByTestId('sign-out').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('front-door')).toBeVisible();
    expect(await getSession(page)).toBeNull();
  });
});
