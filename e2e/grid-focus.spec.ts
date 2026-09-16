import { test, expect } from '@playwright/test';
import { createGrid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// The grid used to hold a "virtual" cursor regardless of real DOM focus:
// clicking a button or the title never blurred it, so the selected cell
// stayed highlighted forever and a stray keypress after clicking a button
// would still land in the grid. Fixed by giving the grid real focus
// (tabIndex + onKeyDown scoped to it) and gating the selected/slot
// highlight on whether it (or a hint input) actually has focus.
async function seedGrid() {
  return seedPuzzle({ grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' });
}

test.describe('grid focus', () => {
  test('clicking a button blurs the grid: no selected cell, and typing does nothing', async ({
    page,
  }) => {
    const { id } = await seedGrid();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await expect(page.locator('[data-selected="true"]')).toHaveCount(1);

    await page.getByTestId('preview-toggle').click();

    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);

    await page.keyboard.press('z');
    await expect(page.locator('[data-coord="0,0"]')).not.toContainText('Z');
  });

  test('clicking a cell after a button click refocuses the grid', async ({ page }) => {
    const { id } = await seedGrid();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('preview-toggle').click();
    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);

    await page.locator('[data-coord="0,0"]').click();
    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute('data-selected', 'true');

    await page.keyboard.press('z');
    await expect(page.locator('[data-coord="0,0"]')).toContainText('Z');
  });

  test('clicking the title blurs the grid', async ({ page }) => {
    const { id } = await seedGrid();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('puzzle-title').click();

    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
  });
});
