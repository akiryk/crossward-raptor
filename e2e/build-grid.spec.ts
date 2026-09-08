import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

const TOLERANCE = 0.5;

function tokenValue(page: Page, name: string) {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name
  );
}

/** CAT across the top row of a 3x3; every other cell empty. */
function catGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3 });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  return grid;
}

async function measureGrid(page: Page) {
  return page.evaluate(() => {
    const container = document.querySelector('[data-testid="puzzle-grid"]');
    if (!container) throw new Error('no puzzle-grid');
    const cells = Array.from(
      container.querySelectorAll('[data-testid="grid-cell"]')
    ) as HTMLElement[];

    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        w: r.width,
        h: r.height,
      };
    };

    return { container: box(container), cells: cells.map(box) };
  });
}

function bgOf(page: Page, coord: string) {
  return page
    .locator(`[data-coord="${coord}"]`)
    .evaluate((el) => getComputedStyle(el).backgroundColor);
}

// --- D3-2: build grid rendering ---
test.describe('D3-2 build grid', () => {
  test('adjacent cells are exactly one hairline apart, both axes', async ({ page }) => {
    const { id } = await seedPuzzle({ grid: catGrid(), hints: {}, phase: 'grid' });
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const line = parseFloat(await tokenValue(page, '--grid-line-width'));
    const { cells } = await measureGrid(page);
    expect(cells.length).toBe(9);

    let horizontal = 0;
    let vertical = 0;

    for (const a of cells) {
      for (const b of cells) {
        if (Math.abs(a.top - b.top) < TOLERANCE && b.left > a.right - TOLERANCE) {
          const distance = b.left - a.right;
          if (distance < line * 4) {
            expect(distance, 'column gap').toBeCloseTo(line, 0);
            horizontal++;
          }
        }
        if (Math.abs(a.left - b.left) < TOLERANCE && b.top > a.bottom - TOLERANCE) {
          const distance = b.top - a.bottom;
          if (distance < line * 4) {
            expect(distance, 'row gap').toBeCloseTo(line, 0);
            vertical++;
          }
        }
      }
    }

    expect(horizontal, 'horizontally adjacent pairs').toBeGreaterThan(0);
    expect(vertical, 'vertically adjacent pairs').toBeGreaterThan(0);
  });

  test('the same hairline surrounds the outside', async ({ page }) => {
    const { id } = await seedPuzzle({ grid: catGrid(), hints: {}, phase: 'grid' });
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const line = parseFloat(await tokenValue(page, '--grid-line-width'));
    const { container, cells } = await measureGrid(page);

    expect(Math.min(...cells.map((c) => c.left)) - container.left, 'left').toBeCloseTo(line, 0);
    expect(Math.min(...cells.map((c) => c.top)) - container.top, 'top').toBeCloseTo(line, 0);
    expect(container.right - Math.max(...cells.map((c) => c.right)), 'right').toBeCloseTo(
      line,
      0
    );
    expect(container.bottom - Math.max(...cells.map((c) => c.bottom)), 'bottom').toBeCloseTo(
      line,
      0
    );
  });

  test('every cell is square and uniformly sized, letters or not', async ({ page }) => {
    const { id } = await seedPuzzle({ grid: catGrid(), hints: {}, phase: 'grid' });
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const { cells } = await measureGrid(page);

    for (const cell of cells) {
      expect(cell.w).toBeCloseTo(cell.h, 0);
      expect(cell.w).toBeCloseTo(cells[0].w, 0);
      expect(cell.h).toBeCloseTo(cells[0].h, 0);
    }
  });

  test('empty and lettered cells are visually distinct', async ({ page }) => {
    const { id } = await seedPuzzle({ grid: catGrid(), hints: {}, phase: 'grid' });
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    // (1,1) is empty and is not a symmetric counterpart of any letter;
    // (2,0) holds T. Neither is selected: the cursor starts at (0,0).
    expect(await bgOf(page, '1,1')).not.toBe(await bgOf(page, '2,0'));
  });

  test('a symmetric-hint cell is distinct from a plain empty cell', async ({ page }) => {
    const { id } = await seedPuzzle({ grid: catGrid(), hints: {}, phase: 'grid' });
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    // CAT at (0,0),(1,0),(2,0) makes (2,2),(1,2),(0,2) symmetric hints.
    await expect(page.locator('[data-coord="0,2"]')).toHaveAttribute(
      'data-cell-state',
      'symmetric-hint'
    );
    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute('data-cell-state', 'empty');

    expect(await bgOf(page, '0,2')).not.toBe(await bgOf(page, '1,1'));
  });

  test('numbers reflect the effective geometry, not the raw grid', async ({ page }) => {
    const { id } = await seedPuzzle({ grid: catGrid(), hints: {}, phase: 'grid' });
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    // Treating empty cells as black leaves one across run (CAT) and no down
    // run longer than a single cell -- so exactly one number, at (0,0).
    await expect(page.getByTestId('cell-number')).toHaveCount(1);
    await expect(
      page.locator('[data-coord="0,0"]').getByTestId('cell-number')
    ).toContainText('1');
  });

  test('existing kind and highlight attributes still behave', async ({ page }) => {
    const grid = createGrid({ cols: 3, rows: 3, black: [{ col: 2, row: 2 }] });
    const { id } = await seedPuzzle({ grid, hints: {}, phase: 'grid' });
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await expect(page.locator('[data-coord="2,2"]')).toHaveAttribute('data-kind', 'black');
    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute('data-kind', 'active');
    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute(
      'data-highlight',
      'selected'
    );
  });
});
