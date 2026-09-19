import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

/** CAT across the top row of a 3x3; every other cell active but empty. */
function catGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3 });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  return grid;
}

async function openPuzzle(page: Page) {
  const { id } = await seedPuzzle({ grid: catGrid(), hints: {}, phase: 'grid' });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  return id;
}

const step = (page: Page, id: string) =>
  page.locator(`[data-testid="step"][data-step-id="${id}"]`);

/** The hints confirmation is the modal's only consumer, so it stands in
 *  for "a dialog" throughout -- these tests are about the shell, not the
 *  transition. enter-hints.spec.ts covers the transition itself. */
async function openDialog(page: Page) {
  await step(page, 'clues').click();
  await expect(page.getByTestId('enter-hints-dialog')).toBeVisible();
}

async function expectDismissedWithoutTransition(page: Page) {
  await expect(page.getByTestId('modal')).toHaveCount(0);
  await expect(step(page, 'build')).toHaveAttribute('data-step-status', 'current');
  await expect(page.getByTestId('hints-region')).toHaveCount(0);
}

test.describe('M1-1 modal shell', () => {
  test('renders its title and the footer it was given', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);

    const title = page.getByTestId('modal-title');
    await expect(title).toBeVisible();
    expect((await title.textContent())?.trim().length ?? 0).toBeGreaterThan(0);

    await expect(page.getByTestId('modal-cancel')).toBeVisible();
    await expect(page.getByTestId('modal-confirm')).toBeVisible();
  });

  test('renders a close control with an accessible name', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);

    const close = page.getByTestId('modal-close');
    await expect(close).toBeVisible();

    const name = await close.evaluate(
      (el) => el.getAttribute('aria-label') ?? el.textContent?.trim() ?? ''
    );
    expect(name.length).toBeGreaterThan(0);
  });

  test('the close control dismisses without confirming', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);

    await page.getByTestId('modal-close').click();

    await expectDismissedWithoutTransition(page);
  });

  test('Escape still dismisses after the refactor', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);

    await page.keyboard.press('Escape');

    await expectDismissedWithoutTransition(page);
  });

  test('the backdrop still dismisses after the refactor', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);

    await page.getByTestId('modal-backdrop').click({ position: { x: 5, y: 5 } });

    await expectDismissedWithoutTransition(page);
  });

  test('the injected footer is really wired to the caller', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);

    await page.getByTestId('modal-confirm').click();

    await expect(page.getByTestId('modal')).toHaveCount(0);
    await expect(page.getByTestId('hints-region')).toBeVisible();
  });
});
