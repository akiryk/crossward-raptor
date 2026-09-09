import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

const TOLERANCE = 0.5;
const LAPTOP = { width: 1280, height: 800 };
const SMALL_LAPTOP = { width: 1024, height: 768 };
const PHONE = { width: 375, height: 667 };

function tokenValue(page: Page, name: string) {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name
  );
}

/**
 * A realistic 15x15: letters down column 0 and across row 0, so the grid
 * survives the hints transition with real slots and a long hint list.
 */
function fifteen(): Grid {
  let grid = createGrid({ cols: 15, rows: 15 });
  for (let i = 0; i < 15; i++) {
    grid = withLetter(grid, { col: i, row: 0 }, 'A');
    grid = withLetter(grid, { col: 0, row: i }, 'B');
    grid = withLetter(grid, { col: i, row: 7 }, 'C');
    grid = withLetter(grid, { col: 7, row: i }, 'D');
  }
  return grid;
}

async function open(page: Page, phase: 'grid' | 'hints', viewport: typeof LAPTOP) {
  await page.setViewportSize(viewport);
  const { id } = await seedPuzzle({ grid: fifteen(), hints: {}, phase });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  return id;
}

function rectOf(page: Page, testid: string) {
  return page.getByTestId(testid).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height };
  });
}

async function measureCells(page: Page) {
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

// --- D5a-1: the grid fits ---
test.describe('D5a-1 the grid fits the viewport', () => {
  for (const viewport of [LAPTOP, SMALL_LAPTOP]) {
    test(`a 15x15 fits at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await open(page, 'grid', viewport);

      const grid = await rectOf(page, 'puzzle-grid');
      expect(grid.bottom, 'grid bottom within viewport').toBeLessThanOrEqual(
        viewport.height + TOLERANCE
      );
      expect(grid.right, 'grid right within viewport').toBeLessThanOrEqual(
        viewport.width + TOLERANCE
      );
    });
  }

  test('no horizontal overflow at phone width', async ({ page }) => {
    await open(page, 'grid', PHONE);

    const grid = await rectOf(page, 'puzzle-grid');
    expect(grid.w).toBeLessThanOrEqual(PHONE.width + TOLERANCE);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });
});

// --- D5a-2: grid and hints together ---
test.describe('D5a-2 grid and hints are visible together', () => {
  test('both regions render and a hint is visible alongside the whole grid', async ({
    page,
  }) => {
    await open(page, 'hints', LAPTOP);

    await expect(page.getByTestId('grid-region')).toBeVisible();
    await expect(page.getByTestId('hints-region')).toBeVisible();

    const grid = await rectOf(page, 'puzzle-grid');
    expect(grid.bottom).toBeLessThanOrEqual(LAPTOP.height + TOLERANCE);

    const firstHint = await page.getByTestId('hint-row').first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    });
    expect(firstHint.top).toBeLessThan(LAPTOP.height);
    expect(firstHint.bottom).toBeGreaterThan(0);
  });

  test('hints sit beside the grid on a laptop', async ({ page }) => {
    await open(page, 'hints', LAPTOP);

    const gridRegion = await rectOf(page, 'grid-region');
    const hintsRegion = await rectOf(page, 'hints-region');

    expect(hintsRegion.left).toBeGreaterThanOrEqual(gridRegion.right - TOLERANCE);
  });

  test('hints stack below the grid on a phone', async ({ page }) => {
    await open(page, 'hints', PHONE);

    const gridRegion = await rectOf(page, 'grid-region');
    const hintsRegion = await rectOf(page, 'hints-region');

    expect(hintsRegion.top).toBeGreaterThanOrEqual(gridRegion.bottom - TOLERANCE);
  });
});

// --- D5a-3: the grid leaves room ---
test.describe('D5a-3 the grid leaves room for hints', () => {
  test('the grid takes no more than 60% of viewport width on a laptop', async ({ page }) => {
    await open(page, 'hints', LAPTOP);

    const grid = await rectOf(page, 'puzzle-grid');
    expect(grid.w).toBeLessThanOrEqual(LAPTOP.width * 0.6);
  });
});

// --- D5a-4: the hints panel scrolls itself ---
test.describe('D5a-4 hints panel contains its own scrolling', () => {
  test('the hints region does not exceed the viewport height', async ({ page }) => {
    await open(page, 'hints', LAPTOP);

    // a 15x15 with this fill has far more hints than fit on screen
    const rowCount = await page.getByTestId('hint-row').count();
    expect(rowCount).toBeGreaterThan(10);

    const hints = await rectOf(page, 'hints-region');
    expect(hints.h).toBeLessThanOrEqual(LAPTOP.height + TOLERANCE);
  });
});

// --- D5a-5: geometry still holds ---
test.describe('D5a-5 cell geometry survives resizing', () => {
  for (const viewport of [LAPTOP, PHONE]) {
    test(`cells stay square and hairlined at ${viewport.width}px`, async ({ page }) => {
      await open(page, 'grid', viewport);

      const line = parseFloat(await tokenValue(page, '--grid-line-width'));
      const { container, cells } = await measureCells(page);
      expect(cells.length).toBe(225);

      for (const cell of cells) {
        expect(cell.w).toBeCloseTo(cell.h, 0);
        expect(cell.w).toBeCloseTo(cells[0].w, 0);
      }

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
        }
      }
      expect(adjacencies).toBeGreaterThan(0);

      expect(Math.min(...cells.map((c) => c.left)) - container.left).toBeCloseTo(line, 0);
      expect(container.bottom - Math.max(...cells.map((c) => c.bottom))).toBeCloseTo(line, 0);
    });
  }
});
