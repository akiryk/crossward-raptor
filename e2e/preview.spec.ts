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

/** CAT across the top row of a 3x3; everything else empty. */
function catGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3 });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  return grid;
}

function bgOf(page: Page, coord: string) {
  return page
    .locator(`[data-coord="${coord}"]`)
    .evaluate((el) => getComputedStyle(el).backgroundColor);
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

async function openPuzzle(page: Page, phase: 'grid' | 'hints' = 'grid') {
  const { id } = await seedPuzzle({ grid: catGrid(), hints: {}, phase });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  return id;
}

// --- D4-2: preview flow ---
test.describe('D4-2 preview', () => {
  test('grid phase starts in build mode with a preview toggle', async ({ page }) => {
    await openPuzzle(page);

    await expect(page.getByTestId('preview-toggle')).toBeVisible();
    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'build');
  });

  test('toggling shows empty cells as black', async ({ page }) => {
    await openPuzzle(page);

    // (1,1) is empty and not a symmetric counterpart of any letter
    const buildBg = await bgOf(page, '1,1');
    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute(
      'data-cell-state',
      'empty'
    );

    await page.getByTestId('preview-toggle').click();

    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'preview');
    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute(
      'data-cell-state',
      'black'
    );
    expect(await bgOf(page, '1,1')).not.toBe(buildBg);
  });

  test('unfilled symmetric counterparts show as required', async ({ page }) => {
    await openPuzzle(page);
    await page.getByTestId('preview-toggle').click();

    // CAT at row 0 makes (2,2), (1,2), (0,2) symmetric counterparts
    for (const coord of ['0,2', '1,2', '2,2']) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toHaveAttribute(
        'data-cell-state',
        'required'
      );
    }

    const required = await bgOf(page, '0,2');
    expect(required).not.toBe(await bgOf(page, '1,1')); // vs black
    expect(required).not.toBe(await bgOf(page, '0,0')); // vs lettered
  });

  test('lettered cells keep their letters and stay distinct from black', async ({ page }) => {
    await openPuzzle(page);
    await page.getByTestId('preview-toggle').click();

    await expect(page.locator('[data-coord="0,0"]')).toContainText('C');
    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute(
      'data-cell-state',
      'letter'
    );
    expect(await bgOf(page, '0,0')).not.toBe(await bgOf(page, '1,1'));
  });

  test('toggling again returns to build appearance', async ({ page }) => {
    await openPuzzle(page);

    await page.getByTestId('preview-toggle').click();
    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'preview');

    await page.getByTestId('preview-toggle').click();
    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'build');
    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute(
      'data-cell-state',
      'empty'
    );
  });

  test('preview is not persisted across a reload', async ({ page }) => {
    await openPuzzle(page);

    await page.getByTestId('preview-toggle').click();
    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'preview');

    await page.reload();
    await waitForEditorReady(page);

    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'build');
  });

  test('hairline geometry still holds in preview', async ({ page }) => {
    await openPuzzle(page);
    await page.getByTestId('preview-toggle').click();
    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'preview');

    const line = parseFloat(await tokenValue(page, '--grid-line-width'));
    const { container, cells } = await measureGrid(page);

    let adjacencies = 0;
    for (const a of cells) {
      for (const b of cells) {
        if (Math.abs(a.top - b.top) < TOLERANCE && b.left > a.right - TOLERANCE) {
          const distance = b.left - a.right;
          if (distance < line * 4) {
            expect(distance).toBeCloseTo(line, 0);
            adjacencies++;
          }
        }
        if (Math.abs(a.left - b.left) < TOLERANCE && b.top > a.bottom - TOLERANCE) {
          const distance = b.top - a.bottom;
          if (distance < line * 4) {
            expect(distance).toBeCloseTo(line, 0);
            adjacencies++;
          }
        }
      }
    }
    expect(adjacencies).toBeGreaterThan(0);

    expect(Math.min(...cells.map((c) => c.left)) - container.left).toBeCloseTo(line, 0);
    expect(container.bottom - Math.max(...cells.map((c) => c.bottom))).toBeCloseTo(line, 0);

    for (const cell of cells) {
      expect(cell.w).toBeCloseTo(cell.h, 0);
      expect(cell.w).toBeCloseTo(cells[0].w, 0);
    }
  });

  test('the toggle is not rendered in hints phase', async ({ page }) => {
    await openPuzzle(page, 'hints');

    await expect(page.getByTestId('preview-toggle')).toHaveCount(0);
  });
});
