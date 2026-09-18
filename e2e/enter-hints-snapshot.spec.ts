import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import type { SerializedCell, SerializedGrid } from '../src/lib/puzzle-storage';
import { seedPuzzle } from './helpers/seed-puzzle';
import { readPuzzleRow } from './helpers/read-puzzle-row';
import { waitForEditorReady } from './helpers/wait-for-ready';

/**
 * A 3x3 with CAT across the top row and one deliberately blackened cell
 * at (0,1). That leaves (1,1), (2,1) and all of row 2 active but empty --
 * exactly the cells the transition will blacken, and therefore the ones
 * the snapshot has to still show as active.
 */
function catGridWithBlack(): Grid {
  let grid = createGrid({ cols: 3, rows: 3, black: [{ col: 0, row: 1 }] });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  return grid;
}

const cellAt = (grid: SerializedGrid, col: number, row: number): SerializedCell =>
  grid.cells[row][col];

async function openPuzzle(page: Page) {
  const { id } = await seedPuzzle({ grid: catGridWithBlack(), hints: {}, phase: 'grid' });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  return id;
}

async function transition(page: Page) {
  await page.locator('[data-testid="step"][data-step-id="clues"]').click();
  await expect(page.getByTestId('enter-hints-dialog')).toBeVisible();
  await page.getByTestId('modal-confirm').click();
  await expect(page.getByTestId('hints-region')).toBeVisible();
}

test.describe('H2-1 pre-lock grid snapshot', () => {
  test('is null while the puzzle is still in grid phase', async ({ page }) => {
    const id = await openPuzzle(page);

    const row = await readPuzzleRow(id);
    expect(row.phase).toBe('grid');
    expect(row.gridBeforeHints).toBeNull();
  });

  test('is written at the transition, with the same dimensions as the grid', async ({
    page,
  }) => {
    const id = await openPuzzle(page);
    await transition(page);

    const row = await readPuzzleRow(id);
    expect(row.phase).toBe('hints');
    expect(row.gridBeforeHints).not.toBeNull();
    expect(row.gridBeforeHints!.cols).toBe(row.grid.cols);
    expect(row.gridBeforeHints!.rows).toBe(row.grid.rows);
  });

  test('keeps a converted cell active, proving it is the pre-conversion grid', async ({
    page,
  }) => {
    const id = await openPuzzle(page);
    await transition(page);

    const row = await readPuzzleRow(id);
    // (1,1) was active and empty before; the transition blackens it.
    expect(cellAt(row.grid, 1, 1).kind).toBe('black');
    expect(cellAt(row.gridBeforeHints!, 1, 1).kind).toBe('active');
  });

  test('keeps a deliberately blackened cell black in both', async ({ page }) => {
    const id = await openPuzzle(page);
    await transition(page);

    const row = await readPuzzleRow(id);
    expect(cellAt(row.grid, 0, 1).kind).toBe('black');
    expect(cellAt(row.gridBeforeHints!, 0, 1).kind).toBe('black');
  });

  test('preserves the letters that were already on the grid', async ({ page }) => {
    const id = await openPuzzle(page);
    await transition(page);

    const snapshot = (await readPuzzleRow(id)).gridBeforeHints!;
    expect(cellAt(snapshot, 0, 0)).toEqual({ kind: 'active', letter: 'C' });
    expect(cellAt(snapshot, 1, 0)).toEqual({ kind: 'active', letter: 'A' });
    expect(cellAt(snapshot, 2, 0)).toEqual({ kind: 'active', letter: 'T' });
  });
});
