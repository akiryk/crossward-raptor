import { test, expect, type Locator, type Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { currentBuilderId } from './helpers/ownership';
import { seedPlayPuzzle } from './helpers/play-route';
import { waitForEditorReady } from './helpers/wait-for-ready';

// 17-S11: frozen after independent specification review. Change only through
// the repository's acceptance amendment procedure.
function filled(cols = 5, rows = cols) {
  let grid = createGrid({ cols, rows });
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) grid = withLetter(grid, { col, row }, 'A');
  }
  return grid;
}

async function openEditor(page: Page, phase: 'grid' | 'hints', cols = 5, rows = cols) {
  const { id } = await seedPuzzle({ grid: filled(cols, rows), phase, hints: {} });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('Expected a visible bounding box');
  return rect;
}

async function expectMini(page: Page, expectedWidth: number) {
  const region = page.getByTestId('grid-region');
  const grid = await box(page.getByTestId('puzzle-grid'));
  const focus = await box(region);
  const column = await box(region.locator('..'));
  expect(grid.width, 'mini width').toBeCloseTo(expectedWidth, 0);
  expect(grid.height, 'square').toBeCloseTo(expectedWidth, 0);
  expect(grid.x - column.x, 'equal horizontal margins')
    .toBeCloseTo(column.x + column.width - grid.x - grid.width, 0);
  expect(focus.x, 'focus region starts at the grid').toBeCloseTo(grid.x, 0);
  expect(focus.width, 'focus region fits the grid').toBeCloseTo(grid.width, 0);
  return { grid, column };
}

test.describe('17-S11-1 mini editor sizing', () => {
  for (const phase of ['grid', 'hints'] as const) {
    for (const width of [1440, 1000, 600, 375]) {
      test(`${phase} at ${width}px: capped and centered inside the existing column`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await openEditor(page, phase);
        const { grid, column } = await expectMini(page, Math.min(500, width - 16));
        if (width === 1440) {
          expect(column.width, 'existing grid column').toBeCloseTo(620, 0);
          expect(grid.x - column.x, '60px left margin').toBeCloseTo(60, 0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth))
          .toBeLessThanOrEqual(width);
      });
    }
  }
});

test.describe('17-S11-2 previews', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });
  test('build Preview keeps the capped, centered grid', async ({ page }) => {
    await openEditor(page, 'grid');
    await page.getByTestId('preview-toggle').locator('input').click({ force: true });
    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'preview');
    await expectMini(page, 500);
  });

  test('Preview Hints keeps the capped grid editable', async ({ page }) => {
    await openEditor(page, 'hints');
    await page.getByTestId('preview-hints-toggle').locator('input').click({ force: true });
    await expectMini(page, 500);
    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.press('B');
    await expect(page.locator('[data-coord="0,0"]')).toContainText('B');
  });
});

test.describe('17-S11-3 other dimensions', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });
  for (const [cols, rows, width] of [[9, 9, 620], [15, 15, 620], [21, 21, 700], [5, 9, 620]]) {
    test(`${cols}×${rows} keeps its ${width}px width`, async ({ page }) => {
      await openEditor(page, 'grid', cols, rows);
      expect((await box(page.getByTestId('puzzle-grid'))).width).toBeCloseTo(width, 0);
      expect((await box(page.getByTestId('grid-region'))).width).toBeCloseTo(width, 0);
    });
  }
});

test('17-S11-4 the mini player retains its 620px grid', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const { id } = await seedPlayPuzzle({
    builderId: await currentBuilderId(page),
    puzzle: { grid: filled(), phase: 'hints', hints: {} },
  });
  await page.goto(`/puzzles/${id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
  expect((await box(page.getByTestId('puzzle-grid'))).width).toBeCloseTo(620, 0);
});
