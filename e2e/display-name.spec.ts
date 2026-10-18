import { test, expect, type Page } from '@playwright/test';
import { signOut } from './helpers/auth';
import { displayNameSnapshot, signInDisplayNameUser } from './helpers/display-name';
import { waitForEditorReady, waitForNewPuzzleReady } from './helpers/wait-for-ready';

test.use({ storageState: { cookies: [], origins: [] } });

async function openFlow(page: Page) {
  await waitForNewPuzzleReady(page);
  await page.getByTestId('new-puzzle-button').click();
  await expect(page.getByTestId('new-puzzle-dialog')).toBeVisible();
}

async function expectNameStep(page: Page) {
  await expect(page.getByTestId('display-name-step')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Builder name', exact: true })).toBeFocused();
  await expect(page.getByTestId('new-puzzle-name')).toHaveCount(0);
}

async function expectTitleStep(page: Page) {
  await expect(page.getByTestId('display-name-step')).toHaveCount(0);
  await expect(page.getByTestId('new-puzzle-name')).toBeFocused();
  await expect(page.locator('[data-testid="new-puzzle-size"] [data-size="daily"]')).toBeChecked();
}

test.describe('O2 builder name capture', () => {
  for (const dismissal of ['Cancel', 'Close', 'Escape', 'backdrop'] as const) {
    test(`${dismissal} discards an idle name, creates nothing, and asks again`, async ({ page }) => {
      const { userId } = await signInDisplayNameUser(page);
      const before = await displayNameSnapshot(userId);
      expect(before.user.displayName).toBeNull();
      expect(before.puzzles).toEqual([]);
      await expect(page.getByTestId('puzzle-list')).toBeVisible();
      await openFlow(page);
      await expectNameStep(page);
      await expect(page.getByTestId('display-name-input')).toHaveValue('');
      await page.getByTestId('display-name-input').fill('Unsaved builder');
      if (dismissal === 'Cancel') await page.getByTestId('display-name-cancel').click();
      if (dismissal === 'Close') await page.getByRole('button', { name: 'Close', exact: true }).click();
      if (dismissal === 'Escape') await page.keyboard.press('Escape');
      if (dismissal === 'backdrop') await page.getByTestId('modal-backdrop').click({ position: { x: 2, y: 2 } });
      await expect(page.getByTestId('new-puzzle-dialog')).toHaveCount(0);
      await expect(page.getByTestId('new-puzzle-button')).toBeFocused();
      expect(await displayNameSnapshot(userId)).toEqual(before);
      await openFlow(page);
      await expectNameStep(page);
      await expect(page.getByTestId('display-name-input')).toHaveValue('');
    });
  }

  test('validates trimmed Unicode code points and captures before creating anything', async ({ page }) => {
    const { userId, email } = await signInDisplayNameUser(page);
    const before = await displayNameSnapshot(userId);
    await openFlow(page);
    await expectNameStep(page);
    const input = page.getByTestId('display-name-input');
    const save = page.getByTestId('display-name-save');
    await expect(save).toBeDisabled();
    await input.fill(' \t ');
    await expect(save).toBeDisabled();
    await expect(page.getByTestId('display-name-step')).toContainText(/name|character/i);
    await input.fill('🦖'.repeat(81));
    await expect(input).toHaveValue('🦖'.repeat(81));
    await expect(save).toBeDisabled();
    await expect(page.getByTestId('display-name-step')).toContainText(/80/);
    expect(await displayNameSnapshot(userId)).toEqual(before);

    const name = '山田 🦖 & Co.';
    await input.fill(`  ${name}  `);
    await expect(save).toBeEnabled();
    await input.press('Enter');
    await expectTitleStep(page);
    const after = await displayNameSnapshot(userId);
    expect(after).toEqual({ user: { ...before.user, displayName: name }, puzzles: [] });
    await page.getByTestId('new-puzzle-cancel').click();
    await expect(page.getByTestId('new-puzzle-button')).toBeFocused();
    await openFlow(page);
    await expectTitleStep(page);
    await page.getByTestId('new-puzzle-cancel').click();
    await page.reload();
    await openFlow(page);
    await expectTitleStep(page);
    await page.getByTestId('new-puzzle-cancel').click();
    await signOut(page);
    await signInDisplayNameUser(page, email);
    await openFlow(page);
    await expectTitleStep(page);
    expect(await displayNameSnapshot(userId)).toEqual(after);
  });

  test('an 80-code-point astral name saves by click and normal mini creation belongs to that user', async ({ page }) => {
    const { userId } = await signInDisplayNameUser(page);
    const name = '🦖'.repeat(80);
    await openFlow(page);
    await page.getByTestId('display-name-input').fill(name);
    await expect(page.getByTestId('display-name-save')).toBeEnabled();
    await page.getByTestId('display-name-save').click();
    await expectTitleStep(page);
    expect((await displayNameSnapshot(userId)).puzzles).toEqual([]);
    const title = `O2 mini ${userId}`;
    await page.getByTestId('new-puzzle-name').fill(`  ${title}  `);
    await page.locator('[data-testid="new-puzzle-size"] [data-size="mini"]').click();
    await page.getByTestId('new-puzzle-create').click();
    await page.waitForURL(/\/puzzles\/[^/]+$/);
    await waitForEditorReady(page);
    await expect(page.getByTestId('puzzle-title')).toHaveValue(title);
    await expect(page.getByTestId('grid-cell')).toHaveCount(25);
    const snapshot = await displayNameSnapshot(userId);
    expect(snapshot.user.displayName).toBe(name);
    expect(snapshot.puzzles).toHaveLength(1);
    expect(snapshot.puzzles[0]).toMatchObject({ title, builderId: userId, grid: { rows: 5, cols: 5 } });
    await page.goto('/puzzles');
    await openFlow(page);
    await expectTitleStep(page);
    expect((await displayNameSnapshot(userId)).user.displayName).toBe(name);
  });

  test('a failed real action retains input, exposes a retryable error, and releases dismissal', async ({ page }) => {
    const { userId } = await signInDisplayNameUser(page);
    await openFlow(page);
    const input = page.getByTestId('display-name-input');
    await input.fill('Retry 🦖');
    let attempts = 0;
    await page.route('**/puzzles', async (route) => {
      if (route.request().method() === 'POST' && route.request().headers()['next-action']) {
        attempts += 1;
        if (attempts === 1) { await route.abort('failed'); return; }
      }
      await route.continue();
    });
    await page.getByTestId('display-name-save').click();
    await expect(page.getByTestId('display-name-step').getByRole('alert')).toContainText(/\S/);
    await expect(input).toHaveValue('Retry 🦖');
    await expect(input).toBeEnabled();
    await expect(page.getByTestId('display-name-save')).toBeEnabled();
    await expect(page.getByTestId('display-name-cancel')).toBeEnabled();
    expect((await displayNameSnapshot(userId)).user.displayName).toBeNull();
    expect((await displayNameSnapshot(userId)).puzzles).toEqual([]);
    // A failed attempt also returns Escape dismissal to its normal idle state.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('new-puzzle-dialog')).toHaveCount(0);
    await openFlow(page);
    await input.fill('Retry 🦖');
    await page.getByTestId('display-name-save').click();
    await expectTitleStep(page);
    expect(attempts).toBe(2);
    expect((await displayNameSnapshot(userId)).user.displayName).toBe('Retry 🦖');
    expect((await displayNameSnapshot(userId)).puzzles).toEqual([]);
  });

  test('a delayed save blocks duplicate keyboard/click submissions and every dismissal path', async ({ page }) => {
    const { userId } = await signInDisplayNameUser(page);
    await openFlow(page);
    await page.getByTestId('display-name-input').fill('Pending builder');
    let release!: () => void;
    let intercepted!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const started = new Promise<void>((resolve) => { intercepted = resolve; });
    let requests = 0;
    await page.route('**/puzzles', async (route) => {
      if (route.request().method() === 'POST' && route.request().headers()['next-action']) {
        requests += 1;
        intercepted();
        await gate;
      }
      await route.continue();
    });
    try {
      // Enter's form-submit path and a click fire in one browser task, before
      // disabled state commits. The earlier test also exercises real Enter.
      await page.getByTestId('display-name-input').evaluate((el) => {
        const keyboardSubmit = () => {
          const form = el.closest('form');
          if (form) form.requestSubmit();
          else el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        };
        keyboardSubmit();
        document.querySelector<HTMLButtonElement>('[data-testid="display-name-save"]')!.click();
        keyboardSubmit();
      });
      await started;
      await expect(page.getByTestId('display-name-input')).toBeDisabled();
      await expect(page.getByTestId('display-name-save')).toBeDisabled();
      await expect(page.getByTestId('display-name-cancel')).toBeDisabled();
      await page.getByTestId('display-name-cancel').evaluate((el) => (el as HTMLButtonElement).click());
      await expect(page.getByTestId('display-name-step')).toBeVisible();
      await page.getByRole('button', { name: 'Close', exact: true }).evaluate((el) => (el as HTMLButtonElement).click());
      await expect(page.getByTestId('display-name-step')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('display-name-step')).toBeVisible();
      await page.getByTestId('modal-backdrop').click({ position: { x: 2, y: 2 } });
      await expect(page.getByTestId('display-name-step')).toBeVisible();
      expect((await displayNameSnapshot(userId)).user.displayName).toBeNull();
      expect((await displayNameSnapshot(userId)).puzzles).toEqual([]);
      expect(requests).toBe(1);
    } finally {
      release();
    }
    await expectTitleStep(page);
    expect(requests).toBe(1);
    expect((await displayNameSnapshot(userId)).user.displayName).toBe('Pending builder');
    expect((await displayNameSnapshot(userId)).puzzles).toEqual([]);
  });
});
