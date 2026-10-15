import { test, expect, type Page } from '@playwright/test';
import { signInSeededUser } from './helpers/seed-session';
import { ageSession, renewThroughAuthEndpoint, sessionSnapshot } from './helpers/session-renewal';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady, waitForNewPuzzleReady } from './helpers/wait-for-ready';
import { createBlankPuzzle } from '../src/lib/puzzle-storage';

const DAY = 86_400_000;
test.use({ storageState: { cookies: [], origins: [] } });

async function expectRenewed(page: Page, email: string, startedAt: number) {
  await expect.poll(async () => {
    const snapshot = await sessionSnapshot(page, email);
    return snapshot.databaseExpiry >= startedAt + 30 * DAY - 5000 &&
      snapshot.cookieExpiry >= startedAt + 30 * DAY - 5000 &&
      Math.abs(snapshot.databaseExpiry - snapshot.cookieExpiry) < 5000 &&
      snapshot.databaseExpiry <= Date.now() + 30 * DAY + 5000;
  }).toBe(true);
}

test.describe('A4 sessions renew through ordinary browser activity', () => {
  for (const path of ['/puzzles', '/', '/style-guide']) {
    test(`visiting ${path} renews database and browser expiry together`, async ({ page }) => {
      const { email } = await signInSeededUser(page);
      // Stop the sign-in landing page before aging so its unfinished effects
      // cannot renew the session on behalf of the navigation under test.
      await page.goto('about:blank');
      await ageSession(page, email);
      const before = await sessionSnapshot(page, email);
      const startedAt = Date.now();

      await page.goto(path);

      await expectRenewed(page, email, startedAt);
      await expect(page.getByTestId('sign-out')).toBeVisible();
      expect((await sessionSnapshot(page, email)).cookieValue).toBe(before.cookieValue);
      await expect(page).toHaveURL(path === '/style-guide' ? /\/style-guide$/ : /\/puzzles$/);
    });
  }

  test('client navigation renews a session that became eligible after mount', async ({ page }) => {
    const { email } = await signInSeededUser(page);
    await waitForNewPuzzleReady(page);
    await page.waitForLoadState('networkidle');
    await ageSession(page, email);
    // Cross a reasonable browser activity throttle without changing server or
    // browser-cookie clocks. The session itself remains valid in real time.
    await page.clock.setFixedTime(Date.now() + 120_000);
    const startedAt = Date.now();

    await page.getByTestId('home-link').click();

    await expect(page).toHaveURL(/\/puzzles$/);
    await expectRenewed(page, email, startedAt);
    await expect(page.getByTestId('sign-out')).toBeVisible();
  });

  test('activity in an already-open editor renews without navigation', async ({ page }) => {
    const { email } = await signInSeededUser(page);
    const { id } = await seedPuzzle(createBlankPuzzle('mini'));
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);
    await page.waitForLoadState('networkidle');
    await ageSession(page, email);
    await page.clock.setFixedTime(Date.now() + 120_000);
    const startedAt = Date.now();

    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.press('ArrowRight');

    await expectRenewed(page, email, startedAt);
    await expect(page.getByTestId('sign-out')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/puzzles/${id}$`));
  });

  test('the real auth endpoint renews both expiries as a protocol control', async ({ page }) => {
    const { email } = await signInSeededUser(page);
    await page.goto('about:blank');
    await ageSession(page, email);
    const startedAt = Date.now();

    expect(await renewThroughAuthEndpoint(page)).toBe(email);

    await expectRenewed(page, email, startedAt);
  });

  test('activity does not slide a fresh session before the one-day update age', async ({ page }) => {
    const { email } = await signInSeededUser(page);
    await page.goto('about:blank');
    const before = await sessionSnapshot(page, email);

    await page.goto('/puzzles');
    await waitForNewPuzzleReady(page);
    await page.waitForLoadState('networkidle');

    expect(await sessionSnapshot(page, email)).toEqual(before);
    await expect(page.getByTestId('sign-out')).toBeVisible();
  });
});
