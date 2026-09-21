import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady, waitForNewPuzzleReady } from './helpers/wait-for-ready';

/** CAT across the top row of a 3x3; every other cell active but empty. */
function catGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3 });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  return grid;
}

const cluesStep = (page: Page) =>
  page.locator('[data-testid="step"][data-step-id="clues"]');

async function openHintsDialog(page: Page) {
  const { id } = await seedPuzzle({ grid: catGrid(), hints: {}, phase: 'grid' });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  await cluesStep(page).click();
  await expect(page.getByTestId('enter-hints-dialog')).toBeVisible();
}

async function openNewPuzzleDialog(page: Page) {
  await page.goto('/puzzles');
  await waitForNewPuzzleReady(page);
  await page.getByTestId('new-puzzle-button').click();
  await expect(page.getByTestId('new-puzzle-dialog')).toBeVisible();
}

/** The testid of whatever currently has focus, or its tag if it has none. */
function focusedId(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    return el?.getAttribute('data-testid') ?? el?.tagName.toLowerCase() ?? '';
  });
}

/** Whether focus is currently inside the element carrying this testid. */
function focusIsInside(page: Page, testId: string) {
  return page.evaluate((id) => {
    const panel = document.querySelector(`[data-testid="${id}"]`);
    return !!panel && !!document.activeElement && panel.contains(document.activeElement);
  }, testId);
}

test.describe('M2-1 dialog semantics', () => {
  test('the panel is a named, modal dialog', async ({ page }) => {
    await openHintsDialog(page);

    const panel = page.getByTestId('enter-hints-dialog');
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-modal', 'true');

    const labelledBy = await panel.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const labelText = await page.evaluate(
      (id) => document.getElementById(id as string)?.textContent?.trim() ?? '',
      labelledBy
    );
    expect(labelText).toBe((await page.getByTestId('modal-title').textContent())?.trim());
  });

  test('the new-puzzle testid lands on the dialog panel too', async ({ page }) => {
    await openNewPuzzleDialog(page);

    await expect(page.getByTestId('new-puzzle-dialog')).toHaveAttribute('role', 'dialog');
    await expect(page.getByTestId('new-puzzle-dialog')).toHaveAttribute('aria-modal', 'true');
  });

  test('the modal is rendered straight into the body', async ({ page }) => {
    await openHintsDialog(page);

    const parentIsBody = await page
      .getByTestId('modal')
      .evaluate((el) => el.parentElement === document.body);
    expect(parentIsBody).toBe(true);
  });

  test('an open dialog is a single overlay, containing its panel', async ({ page }) => {
    await openNewPuzzleDialog(page);

    await expect(page.getByTestId('modal')).toHaveCount(1);
    await expect(page.getByTestId('modal').getByTestId('new-puzzle-dialog')).toHaveCount(1);

    // no second full-screen fixed layer wrapping the dialog
    const fixedFullScreen = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('body *')).filter((el) => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return (
            s.position === 'fixed' &&
            r.width >= window.innerWidth - 1 &&
            r.height >= window.innerHeight - 1
          );
        }).length
    );
    expect(fixedFullScreen).toBe(1);
  });
});

test.describe('M2-1 focus', () => {
  test('the hints dialog does not pre-focus close or confirm', async ({ page }) => {
    await openHintsDialog(page);

    expect(await focusIsInside(page, 'enter-hints-dialog')).toBe(true);
    const id = await focusedId(page);
    expect(id).not.toBe('modal-close');
    expect(id).not.toBe('modal-confirm');
  });

  test('the new-puzzle dialog focuses its name field', async ({ page }) => {
    await openNewPuzzleDialog(page);

    expect(await focusedId(page)).toBe('new-puzzle-name');
  });

  test('Tab never leaves the dialog', async ({ page }) => {
    await openHintsDialog(page);

    for (let i = 0; i < 10; i += 1) {
      await page.keyboard.press('Tab');
      expect(await focusIsInside(page, 'enter-hints-dialog'), `after Tab ${i + 1}`).toBe(true);
    }
  });

  test('Shift+Tab never leaves the dialog', async ({ page }) => {
    await openHintsDialog(page);

    for (let i = 0; i < 10; i += 1) {
      await page.keyboard.press('Shift+Tab');
      expect(await focusIsInside(page, 'enter-hints-dialog'), `after Shift+Tab ${i + 1}`).toBe(
        true
      );
    }
  });

  test('a disabled button is never a Tab stop', async ({ page }) => {
    await openNewPuzzleDialog(page);
    await expect(page.getByTestId('new-puzzle-create')).toBeDisabled();

    const visited = new Set<string>();
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      visited.add(await focusedId(page));
      expect(await focusIsInside(page, 'new-puzzle-dialog'), `after Tab ${i + 1}`).toBe(true);
    }
    expect(visited.has('new-puzzle-create')).toBe(false);
  });

  test('closing the new-puzzle dialog returns focus to its button', async ({ page }) => {
    await openNewPuzzleDialog(page);

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('new-puzzle-dialog')).toHaveCount(0);
    expect(await focusedId(page)).toBe('new-puzzle-button');
  });

  test('closing the hints dialog returns focus to the clues step', async ({ page }) => {
    await openHintsDialog(page);

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('enter-hints-dialog')).toHaveCount(0);
    const stepId = await page.evaluate(
      () => document.activeElement?.getAttribute('data-step-id') ?? ''
    );
    expect(stepId).toBe('clues');
  });
});

test.describe('M2-1 scroll lock', () => {
  test('the body cannot scroll while a dialog is open, and is restored after', async ({
    page,
  }) => {
    await page.goto('/puzzles');
    await waitForNewPuzzleReady(page);

    const before = await page.evaluate(() => document.body.style.overflow);

    await page.getByTestId('new-puzzle-button').click();
    await expect(page.getByTestId('new-puzzle-dialog')).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('new-puzzle-dialog')).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(before);
  });

  test('a previously-set body overflow survives a dialog opening and closing', async ({
    page,
  }) => {
    await page.goto('/puzzles');
    await waitForNewPuzzleReady(page);
    await page.evaluate(() => {
      document.body.style.overflow = 'scroll';
    });

    await page.getByTestId('new-puzzle-button').click();
    await expect(page.getByTestId('new-puzzle-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('new-puzzle-dialog')).toHaveCount(0);

    expect(await page.evaluate(() => document.body.style.overflow)).toBe('scroll');
  });
});
