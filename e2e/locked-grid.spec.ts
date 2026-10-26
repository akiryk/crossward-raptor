import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

/** A 3x3 word square, CAT / ARE / TEA -- every cell active and lettered,
 *  which is what a grid always looks like after the hints transition. */
function wordSquare(): Grid {
  const rows = [
    ['C', 'A', 'T'],
    ['A', 'R', 'E'],
    ['T', 'E', 'A'],
  ];
  let grid = createGrid({ cols: 3, rows: 3 });
  rows.forEach((letters, row) => {
    letters.forEach((letter, col) => {
      grid = withLetter(grid, { col, row }, letter);
    });
  });
  return grid;
}

async function openPuzzle(page: Page, phase: 'grid' | 'hints' = 'hints') {
  const { id } = await seedPuzzle({ grid: wordSquare(), hints: {}, phase });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  return id;
}

const cell = (page: Page, coord: string) => page.locator(`[data-coord="${coord}"]`);
// 14-S4: the edit-grid toggle became the numbered buttons: 1 Edit the Grid
// turns EDIT GRID on (and is then the selected button), 2 Create Hints
// turns it off.
const step = (page: Page, id: 'build' | 'hints') =>
  page.locator(`[data-testid="builder-steps"] [data-step-id="${id}"]`);
const grid = (page: Page) => page.getByTestId('puzzle-grid');

test.describe('H4-2 the locked grid', () => {
  test('hints phase reports its own grid mode and locked cells', async ({ page }) => {
    await openPuzzle(page);

    await expect(grid(page)).toHaveAttribute('data-grid-mode', 'hints');
    await expect(cell(page, '0,0')).toHaveAttribute('data-cell-state', 'locked-letter');
  });

  test('the preview toggle is replaced by the Edit the Grid button', async ({ page }) => {
    await openPuzzle(page);

    await expect(page.getByTestId('preview-toggle')).toHaveCount(0);
    await expect(step(page, 'build')).toHaveText(/Edit the Grid/);
  });

  test('build phase is unaffected', async ({ page }) => {
    await openPuzzle(page, 'grid');

    await expect(grid(page)).toHaveAttribute('data-grid-mode', 'build');
    await expect(page.getByTestId('preview-toggle')).toBeVisible();
    await expect(step(page, 'build')).toHaveText(/Build the Grid/);
  });

  test('typing a letter does nothing while locked', async ({ page }) => {
    await openPuzzle(page);

    await cell(page, '0,0').click();
    await page.keyboard.press('z');

    await expect(cell(page, '0,0')).toContainText('C');
  });

  test('Backspace does nothing while locked', async ({ page }) => {
    await openPuzzle(page);

    await cell(page, '0,0').click();
    await page.keyboard.press('Backspace');

    await expect(cell(page, '0,0')).toContainText('C');
  });

  test('clicking a cell selects nothing while locked', async ({ page }) => {
    await openPuzzle(page);

    await cell(page, '1,1').click();

    await expect(cell(page, '1,1')).not.toHaveAttribute('data-selected', 'true');
    await expect(cell(page, '1,1')).toHaveAttribute('data-cell-state', 'locked-letter');
  });
});

test.describe('H4-2 EDIT GRID mode', () => {
  async function enterEditMode(page: Page) {
    await step(page, 'build').click();
    await expect(grid(page)).toHaveAttribute('data-grid-mode', 'hints-editing');
  }

  test('Edit the Grid opens edit mode and becomes the selected button', async ({ page }) => {
    await openPuzzle(page);
    await enterEditMode(page);

    await expect(step(page, 'build')).toHaveAttribute('aria-current', 'true');
    await expect(cell(page, '0,0')).toHaveAttribute('data-cell-state', 'editable-letter');
  });

  test('clue inputs are disabled while editing the grid', async ({ page }) => {
    await openPuzzle(page);
    await expect(page.getByTestId('hint-input').first()).toBeEnabled();

    await enterEditMode(page);

    await expect(page.getByTestId('hint-input').first()).toBeDisabled();
  });

  test('typing replaces a letter in edit mode', async ({ page }) => {
    await openPuzzle(page);
    await enterEditMode(page);

    await cell(page, '0,0').click();
    await page.keyboard.press('b');

    await expect(cell(page, '0,0')).toContainText('B');
  });

  test('Backspace still does nothing in edit mode', async ({ page }) => {
    await openPuzzle(page);
    await enterEditMode(page);

    await cell(page, '0,0').click();
    await page.keyboard.press('Backspace');

    await expect(cell(page, '0,0')).toContainText('C');
  });

  test('toggling back locks the grid and re-enables the clue inputs', async ({ page }) => {
    await openPuzzle(page);
    await enterEditMode(page);

    await step(page, 'hints').click();

    await expect(grid(page)).toHaveAttribute('data-grid-mode', 'hints');
    await expect(step(page, 'hints')).toHaveAttribute('aria-current', 'true');
    await expect(page.getByTestId('hint-input').first()).toBeEnabled();
  });

  test('edit mode does not survive a reload', async ({ page }) => {
    await openPuzzle(page);
    await enterEditMode(page);

    await page.reload();
    await waitForEditorReady(page);

    await expect(grid(page)).toHaveAttribute('data-grid-mode', 'hints');
  });
});
