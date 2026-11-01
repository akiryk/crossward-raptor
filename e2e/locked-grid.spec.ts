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
// 14-S4: the edit-grid toggle became the numbered buttons. 14-S12: there
// is no EDIT GRID mode; in the hints phase 1 is done (disabled, its label
// "Build the Grid" faded behind a check), Lock Grid Letters takes
// Preview's place, and the grid takes letters
// (e2e/hints-grid-editing.spec.ts).
const step = (page: Page, id: 'build' | 'hints') =>
  page.locator(`[data-testid="builder-steps"] [data-step-id="${id}"]`);
const grid = (page: Page) => page.getByTestId('puzzle-grid');

test.describe('H4-2 the locked grid', () => {
  test('hints phase reports its own grid mode and locked cells', async ({ page }) => {
    await openPuzzle(page);

    await expect(grid(page)).toHaveAttribute('data-grid-mode', 'hints');
    await expect(cell(page, '0,0')).toHaveAttribute('data-cell-state', 'locked-letter');
  });

  // 17-S8: was "… and 1 is done": the hints phase has no 1, its current
  // step is the "2 Create Hints" label.
  test('the preview toggle is replaced by Lock Grid Letters and 2 is the current step', async ({ page }) => {
    await openPuzzle(page);

    await expect(page.getByTestId('preview-toggle')).toHaveCount(0);
    await expect(page.getByTestId('lock-letters-toggle')).toBeVisible();
    await expect(step(page, 'hints')).toHaveText(/Create Hints/);
    await expect(step(page, 'hints')).toHaveAttribute('aria-current', 'true');
    await expect(step(page, 'build')).toHaveCount(0);
  });

  test('build phase is unaffected', async ({ page }) => {
    await openPuzzle(page, 'grid');

    await expect(grid(page)).toHaveAttribute('data-grid-mode', 'build');
    await expect(page.getByTestId('preview-toggle')).toBeVisible();
    await expect(step(page, 'build')).toHaveText(/Build the Grid/);
  });

  // 14-S12 retired "typing a letter does nothing while locked": the
  // hints-phase grid takes letters. Replaced by 14-S12-4.

  test('Backspace does nothing while locked', async ({ page }) => {
    await openPuzzle(page);

    await cell(page, '0,0').click();
    await page.keyboard.press('Backspace');

    await expect(cell(page, '0,0')).toContainText('C');
  });

  // 14-S12 retired "clicking a cell selects nothing while locked": a click
  // focuses the grid and selects the cell. Replaced by 14-S12-4.
});

// 14-S12 retired "H4-2 EDIT GRID mode" (six cases): there is no EDIT GRID
// mode. Letters overtype and Backspace does nothing in the hints phase
// itself (14-S12-4, and "Backspace does nothing while locked" above); the
// hint inputs stay enabled (14-S12-4, 14-S12-6); 1 is done (14-S12-1).
