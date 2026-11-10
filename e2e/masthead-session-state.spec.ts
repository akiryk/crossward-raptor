import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { getSession } from './helpers/auth';
import { waitForNewPuzzleReady } from './helpers/wait-for-ready';
import { createAccount, signInByLink, uniqueEmail } from './helpers/username-step';

// Epic 23 closeout — the masthead follows the session without a reload.
//
// The human's visual check (2026-11-09) found the masthead, which the root
// layout renders, stale after two in-app navigations: saving the username
// step went on to /puzzles still without Account, and Sign out returned to
// the sign-in form still showing Account and Sign out (Account still opening
// Account details). Each navigation here is the app's own, with no reload:
// right after it the masthead matches the new session state (EPIC Decisions:
// Account for an account with a username; signed out, neither).

test.use({ storageState: { cookies: [], origins: [] } });

function masthead(page: Page) {
  const header = page.getByTestId('app-header');
  return {
    account: header.getByTestId('account'),
    divider: header.getByTestId('masthead-divider'),
    signOut: header.getByTestId('sign-out'),
  };
}

/** Marks the window, so a full reload (which drops the marker) is detectable. */
async function markWindow(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __noReload?: boolean }).__noReload = true;
  });
}

async function wasReloaded(page: Page) {
  return page.evaluate(() => !(window as unknown as { __noReload?: boolean }).__noReload);
}

test.describe('23-C1 the masthead follows the session', () => {
  test('saving the username step shows Account and the divider on /puzzles without a reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signInByLink(page, uniqueEmail('c1-step'));
    await expect(page.locator('[data-testid="username-step"][data-ready="true"]')).toBeVisible();
    const m = masthead(page);
    await expect(m.account).toHaveCount(0);
    const name = await page.getByTestId('username-input').inputValue();

    await markWindow(page);
    await page.getByTestId('username-submit').click();
    await expect(page).toHaveURL((url) => url.pathname === '/puzzles');
    await expect(m.account).toBeVisible();
    await expect(m.divider).toBeVisible();
    await expect(m.signOut).toBeVisible();
    expect(await wasReloaded(page), 'no full reload').toBe(false);

    await m.account.click();
    const dialog = page.getByRole('dialog', { name: 'Account details' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId('account-username')).toHaveValue(name);
  });

  test('Sign out from /puzzles leaves no Account, divider or Sign out on the sign-in form', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const email = uniqueEmail('c1-out');
    await createAccount(email, { displayName: 'Lil Orange Fox' });
    await signInByLink(page, email);
    await expect(page).toHaveURL((url) => url.pathname === '/puzzles');
    await waitForNewPuzzleReady(page);
    const m = masthead(page);
    await expect(m.account).toBeVisible();

    await m.signOut.click();
    await expect(page.locator('[data-testid="sign-in-form"][data-ready="true"]')).toBeVisible();
    await expect(m.account).toHaveCount(0);
    await expect(m.divider).toHaveCount(0);
    await expect(m.signOut).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await getSession(page)).toBeNull();
  });

  test('Sign out from the username step leaves no Sign out on the sign-in form', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signInByLink(page, uniqueEmail('c1-step-out'));
    await expect(page.locator('[data-testid="username-step"][data-ready="true"]')).toBeVisible();
    const m = masthead(page);

    await m.signOut.click();
    await expect(page.locator('[data-testid="sign-in-form"][data-ready="true"]')).toBeVisible();
    await expect(m.signOut).toHaveCount(0);
    await expect(m.account).toHaveCount(0);
    expect(await getSession(page)).toBeNull();
  });
});
