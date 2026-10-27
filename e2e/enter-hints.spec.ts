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

async function openPuzzle(page: Page, grid: Grid = catGrid()) {
  const { id } = await seedPuzzle({ grid, hints: {}, phase: 'grid' });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  return id;
}

// 14-S4: the stepper became the builder's numbered buttons; 2 Create Hints
// (data-step-id "hints") opens the dialog, and the selected button carries
// aria-current. 14-S12: once the grid is locked, 1 still reads "Build the
// Grid" and is disabled.
const step = (page: Page, id: string) =>
  page.locator(`[data-testid="builder-steps"] [data-step-id="${id}"]`);

async function openDialog(page: Page) {
  await step(page, 'hints').click();
  await expect(page.getByTestId('enter-hints-dialog')).toBeVisible();
}

async function expectStillGridPhase(page: Page) {
  await expect(step(page, 'build')).toHaveAttribute('aria-current', 'true');
  await expect(step(page, 'build')).toContainText('Build the Grid');
  await expect(page.getByTestId('hints-region')).toHaveCount(0);
}

test.describe('H1-1 entering hints phase', () => {
  test('grid phase offers the hints step with no dialog showing', async ({ page }) => {
    await openPuzzle(page);

    await expect(step(page, 'hints')).toBeEnabled();
    await expect(step(page, 'hints')).not.toHaveAttribute('aria-current', 'true');
    await expect(page.getByTestId('enter-hints-dialog')).toHaveCount(0);
  });

  test('clicking the hints step opens the dialog without transitioning', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);

    await expectStillGridPhase(page);
  });

  test('cancelling closes the dialog and stays in grid phase', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);

    await page.getByTestId('modal-cancel').click();

    await expect(page.getByTestId('enter-hints-dialog')).toHaveCount(0);
    await expectStillGridPhase(page);
  });

  test('Escape closes the dialog and stays in grid phase', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('enter-hints-dialog')).toHaveCount(0);
    await expectStillGridPhase(page);
  });

  test('a backdrop click closes the dialog and stays in grid phase', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);

    await page.getByTestId('modal-backdrop').click({ position: { x: 5, y: 5 } });

    await expect(page.getByTestId('enter-hints-dialog')).toHaveCount(0);
    await expectStillGridPhase(page);
  });

  test('confirming moves the puzzle into hints phase', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);

    await page.getByTestId('modal-confirm').click();

    await expect(page.getByTestId('enter-hints-dialog')).toHaveCount(0);
    await expect(page.getByTestId('hints-region')).toBeVisible();
    await expect(step(page, 'hints')).toHaveAttribute('aria-current', 'true');
    await expect(step(page, 'build')).toBeDisabled();
  });

  test('the transition survives a reload', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);
    await page.getByTestId('modal-confirm').click();
    await expect(page.getByTestId('hints-region')).toBeVisible();

    await page.reload();
    await waitForEditorReady(page);

    await expect(page.getByTestId('hints-region')).toBeVisible();
    await expect(step(page, 'build')).toBeDisabled();
  });

  test('the build step cannot take you back afterward', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);
    await page.getByTestId('modal-confirm').click();
    await expect(page.getByTestId('hints-region')).toBeVisible();

    // 14-S12: 1 is disabled in the hints phase, so a click does nothing;
    // the grid's shape stays locked and the puzzle stays in hints phase.
    await expect(step(page, 'build')).toBeDisabled();
    await step(page, 'build').click({ force: true });

    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'hints');
    await expect(page.getByTestId('hints-region')).toBeVisible();
    await expect(step(page, 'build')).toHaveText(/Build the Grid/);
    await page.reload();
    await waitForEditorReady(page);
    await expect(page.getByTestId('hints-region')).toBeVisible();
  });

  test('empty cells become black at the transition', async ({ page }) => {
    await openPuzzle(page);
    // (1,1) is empty in grid phase
    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute('data-kind', 'active');

    await openDialog(page);
    await page.getByTestId('modal-confirm').click();
    await expect(page.getByTestId('hints-region')).toBeVisible();

    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute('data-kind', 'black');
  });
});
