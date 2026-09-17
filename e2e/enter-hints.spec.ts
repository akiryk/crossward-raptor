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

const step = (page: Page, id: string) =>
  page.locator(`[data-testid="step"][data-step-id="${id}"]`);

async function openDialog(page: Page) {
  await step(page, 'clues').click();
  await expect(page.getByTestId('enter-hints-dialog')).toBeVisible();
}

async function expectStillGridPhase(page: Page) {
  await expect(step(page, 'build')).toHaveAttribute('data-step-status', 'current');
  await expect(page.getByTestId('hints-region')).toHaveCount(0);
}

test.describe('H1-1 entering hints phase', () => {
  test('grid phase offers the clues step with no dialog showing', async ({ page }) => {
    await openPuzzle(page);

    await expect(step(page, 'clues')).toHaveAttribute('data-step-status', 'available');
    await expect(page.getByTestId('enter-hints-dialog')).toHaveCount(0);
  });

  test('clicking the clues step opens the dialog without transitioning', async ({ page }) => {
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
    await expect(step(page, 'clues')).toHaveAttribute('data-step-status', 'current');
    await expect(step(page, 'build')).toHaveAttribute('data-step-status', 'unavailable');
  });

  test('the transition survives a reload', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);
    await page.getByTestId('modal-confirm').click();
    await expect(page.getByTestId('hints-region')).toBeVisible();

    await page.reload();
    await waitForEditorReady(page);

    await expect(page.getByTestId('hints-region')).toBeVisible();
    await expect(step(page, 'build')).toHaveAttribute('data-step-status', 'unavailable');
  });

  test('the build step cannot take you back afterward', async ({ page }) => {
    await openPuzzle(page);
    await openDialog(page);
    await page.getByTestId('modal-confirm').click();
    await expect(page.getByTestId('hints-region')).toBeVisible();

    await step(page, 'build').click();

    await expect(page.getByTestId('step-reason')).toBeVisible();
    await expect(page.getByTestId('hints-region')).toBeVisible();
    await expect(step(page, 'build')).toHaveAttribute('data-step-status', 'unavailable');
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
