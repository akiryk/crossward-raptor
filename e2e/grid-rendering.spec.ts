import { test, expect } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';

function smallSeededGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3, black: [{ col: 2, row: 2 }] });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  grid = withLetter(grid, { col: 0, row: 1 }, 'A');
  grid = withLetter(grid, { col: 0, row: 2 }, 'T');
  return grid;
}

// --- P2-2: grid rendering ---
test.describe('P2-2 grid rendering', () => {
  test('a seeded grid with a black cell, letters, and numbers renders correctly', async ({
    page,
  }) => {
    const { id } = await seedPuzzle({ grid: smallSeededGrid(), hints: {}, phase: 'grid' });

    await page.goto(`/puzzles/${id}`);

    await expect(page.getByTestId('grid-cell')).toHaveCount(9);

    const blackCells = page.locator('[data-testid="grid-cell"][data-kind="black"]');
    await expect(blackCells).toHaveCount(1);
    await expect(page.locator('[data-coord="2,2"]')).toHaveAttribute('data-kind', 'black');

    await expect(page.locator('[data-coord="0,0"]')).toContainText('C');
    await expect(page.locator('[data-coord="1,0"]')).toContainText('A');
    await expect(page.locator('[data-coord="2,0"]')).toContainText('T');

    await expect(page.getByTestId('cell-number')).toHaveCount(5);
    await expect(
      page.locator('[data-coord="0,0"]').getByTestId('cell-number')
    ).toContainText('1');
    await expect(
      page.locator('[data-coord="1,0"]').getByTestId('cell-number')
    ).toContainText('2');
    await expect(
      page.locator('[data-coord="2,0"]').getByTestId('cell-number')
    ).toContainText('3');
    await expect(
      page.locator('[data-coord="0,1"]').getByTestId('cell-number')
    ).toContainText('4');
    await expect(
      page.locator('[data-coord="0,2"]').getByTestId('cell-number')
    ).toContainText('5');
  });

  test('a blank default-shaped puzzle renders 225 active cells, zero black', async ({
    page,
  }) => {
    const { id } = await seedPuzzle({
      grid: createGrid({ cols: 15, rows: 15 }),
      hints: {},
      phase: 'grid',
    });

    await page.goto(`/puzzles/${id}`);

    await expect(page.getByTestId('grid-cell')).toHaveCount(225);
    await expect(page.locator('[data-testid="grid-cell"][data-kind="black"]')).toHaveCount(0);
  });

  test('no horizontal overflow at a phone-width viewport', async ({ page }) => {
    const { id } = await seedPuzzle({
      grid: createGrid({ cols: 15, rows: 15 }),
      hints: {},
      phase: 'grid',
    });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/puzzles/${id}`);

    await expect(page.getByTestId('grid-cell').first()).toBeVisible();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test('no horizontal overflow at a laptop-width viewport', async ({ page }) => {
    const { id } = await seedPuzzle({
      grid: createGrid({ cols: 15, rows: 15 }),
      hints: {},
      phase: 'grid',
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/puzzles/${id}`);

    await expect(page.getByTestId('grid-cell').first()).toBeVisible();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });
});
