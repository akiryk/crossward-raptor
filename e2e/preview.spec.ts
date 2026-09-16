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

/**
 * MA in the top-left of a 3x3, isolated as a clean length-2 across slot;
 * every other cell is black except its symmetric counterpart (bottom-right,
 * per symmetricCounterpart: col' = 2-col, row' = 2-row), which is also a
 * clean, empty length-2 across slot. Used for the two-letter highlighting
 * tests (Story D6): both ends should render as "recommended" in preview,
 * with or without letters.
 */
function twoLetterGrid(): Grid {
  const grid = createGrid({
    cols: 3,
    rows: 3,
    black: [
      { col: 2, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
      { col: 0, row: 2 },
    ],
  });
  let g = withLetter(grid, { col: 0, row: 0 }, 'M');
  g = withLetter(g, { col: 1, row: 0 }, 'A');
  return g;
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

async function openPuzzle(
  page: Page,
  phase: 'grid' | 'hints' = 'grid',
  grid: Grid = catGrid()
) {
  const { id } = await seedPuzzle({ grid, hints: {}, phase });
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

// --- D6: two-letter slot highlighting ---
test.describe('D6 two-letter highlighting', () => {
  test('flags a standalone 2-letter word and its empty symmetric counterpart, overriding required', async ({
    page,
  }) => {
    await openPuzzle(page, 'grid', twoLetterGrid());
    await page.getByTestId('preview-toggle').click();

    for (const coord of ['0,0', '1,0', '1,2', '2,2']) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toHaveAttribute(
        'data-cell-state',
        'recommended'
      );
    }

    const recommended = await bgOf(page, '0,0');
    expect(recommended).not.toBe(await bgOf(page, '1,1')); // vs black
  });

  test('recommended is visually distinct from required', async ({ page }) => {
    await openPuzzle(page); // catGrid: has required cells at (0,2)/(1,2)/(2,2)
    await page.getByTestId('preview-toggle').click();
    const required = await bgOf(page, '0,2');

    await openPuzzle(page, 'grid', twoLetterGrid());
    await page.getByTestId('preview-toggle').click();
    const recommended = await bgOf(page, '1,2');

    expect(recommended).not.toBe(required);
  });

  test('does not flag a 3-letter word', async ({ page }) => {
    await openPuzzle(page); // catGrid
    await page.getByTestId('preview-toggle').click();

    for (const coord of ['0,0', '1,0', '2,0']) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toHaveAttribute(
        'data-cell-state',
        'letter'
      );
    }
  });

  test('build mode never shows the recommended state', async ({ page }) => {
    await openPuzzle(page, 'grid', twoLetterGrid());
    // still in build mode -- no toggle click

    for (const coord of ['0,0', '1,0', '1,2', '2,2']) {
      const state = await page.locator(`[data-coord="${coord}"]`).getAttribute('data-cell-state');
      expect(state).not.toBe('recommended');
    }
  });
});

/**
 * "AS" in the top-left of a 3x3, with no black cells placed at all —
 * relying entirely on Preview's "effective grid" conversion
 * (convertEmptyCellsToBlack) to bound it, the way an in-progress
 * builder grid actually looks before any black squares have been
 * committed. Regression coverage for D6r: D6 as shipped checked the raw
 * grid only, so a trailing undecided run like this one wasn't flagged
 * even though it reads as a bounded two-letter word in Preview.
 */
function undecidedTwoLetterGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3 });
  grid = withLetter(grid, { col: 0, row: 0 }, 'A');
  grid = withLetter(grid, { col: 1, row: 0 }, 'S');
  return grid;
}

// --- D6r: two-letter highlighting against the effective grid ---
test.describe('D6r effective-grid two-letter highlighting', () => {
  test('flags an undecided two-letter word once trailing cells convert to black', async ({
    page,
  }) => {
    await openPuzzle(page, 'grid', undecidedTwoLetterGrid());
    await page.getByTestId('preview-toggle').click();

    for (const coord of ['0,0', '1,0']) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toHaveAttribute(
        'data-cell-state',
        'recommended'
      );
    }
  });

  test('flags the undecided word\'s symmetric counterpart the same way', async ({ page }) => {
    await openPuzzle(page, 'grid', undecidedTwoLetterGrid());
    await page.getByTestId('preview-toggle').click();

    // counterpart of (0,0)/(1,0) on a 3x3, per symmetricCounterpart
    for (const coord of ['1,2', '2,2']) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toHaveAttribute(
        'data-cell-state',
        'recommended'
      );
    }
  });

  test('D6\'s explicitly-bounded case still passes unchanged', async ({ page }) => {
    await openPuzzle(page, 'grid', twoLetterGrid());
    await page.getByTestId('preview-toggle').click();

    for (const coord of ['0,0', '1,0', '1,2', '2,2']) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toHaveAttribute(
        'data-cell-state',
        'recommended'
      );
    }
  });
});
