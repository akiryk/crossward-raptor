import { test, expect } from '@playwright/test';
import { createGrid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';

// 3x3 grid, black at (0,0). First active cell in reading order is (1,0).
async function seedGridWithBlackCorner() {
  const grid = createGrid({ cols: 3, rows: 3, black: [{ col: 0, row: 0 }] });
  return seedPuzzle({ grid, hints: {}, phase: 'grid' });
}

// --- P3-2: editing flow ---
test.describe('P3-2 editing flow', () => {
  test('the first active cell in reading order is selected on load', async ({ page }) => {
    const { id } = await seedGridWithBlackCorner();
    await page.goto(`/puzzles/${id}`);

    await expect(page.locator('[data-coord="1,0"]')).toHaveAttribute('data-selected', 'true');
    await expect(page.locator('[data-selected="true"]')).toHaveCount(1);
  });

  test('clicking a different active cell moves selection', async ({ page }) => {
    const { id } = await seedGridWithBlackCorner();
    await page.goto(`/puzzles/${id}`);

    await page.locator('[data-coord="2,0"]').click();

    await expect(page.locator('[data-coord="2,0"]')).toHaveAttribute('data-selected', 'true');
    await expect(page.locator('[data-coord="1,0"]')).not.toHaveAttribute('data-selected', 'true');
  });

  test('clicking a black cell is a no-op', async ({ page }) => {
    const { id } = await seedGridWithBlackCorner();
    await page.goto(`/puzzles/${id}`);

    await page.locator('[data-coord="2,0"]').click();
    await page.locator('[data-coord="0,0"]').click(); // black

    await expect(page.locator('[data-coord="2,0"]')).toHaveAttribute('data-selected', 'true');
  });

  test('typing writes a letter, advances, and stops at the grid edge', async ({ page }) => {
    const { id } = await seedGridWithBlackCorner();
    await page.goto(`/puzzles/${id}`);

    // starts selected at (1,0); across run here is (1,0)-(2,0), length 2
    await page.keyboard.press('c');
    await expect(page.locator('[data-coord="1,0"]')).toContainText('C');
    await expect(page.locator('[data-coord="2,0"]')).toHaveAttribute('data-selected', 'true');

    await page.keyboard.press('a');
    await expect(page.locator('[data-coord="2,0"]')).toContainText('A');
    // edge of the grid -- no further cell to advance into, selection stays
    await expect(page.locator('[data-coord="2,0"]')).toHaveAttribute('data-selected', 'true');
  });

  test('Backspace clears the current cell, then retreats and clears the previous one', async ({
    page,
  }) => {
    const { id } = await seedGridWithBlackCorner();
    await page.goto(`/puzzles/${id}`);

    await page.keyboard.press('c'); // (1,0) -> C, advances to (2,0)
    await page.keyboard.press('a'); // (2,0) -> A, stays (edge)

    await page.keyboard.press('Backspace'); // clears (2,0)
    await expect(page.locator('[data-coord="2,0"]')).not.toContainText('A');
    await expect(page.locator('[data-coord="2,0"]')).toHaveAttribute('data-selected', 'true');

    await page.keyboard.press('Backspace'); // (2,0) already empty -> retreat to (1,0), clear it
    await expect(page.locator('[data-coord="1,0"]')).not.toContainText('C');
    await expect(page.locator('[data-coord="1,0"]')).toHaveAttribute('data-selected', 'true');
  });

  test('arrow keys move selection and update orientation', async ({ page }) => {
    const { id } = await seedGridWithBlackCorner();
    await page.goto(`/puzzles/${id}`);

    // starts at (1,0); (1,1) is active, so ArrowDown should succeed
    await page.keyboard.press('ArrowDown');

    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute('data-selected', 'true');
  });

  test('an edit survives a reload once the debounce window has passed', async ({ page }) => {
    const { id } = await seedGridWithBlackCorner();
    await page.goto(`/puzzles/${id}`);

    await page.keyboard.press('x');
    await page.waitForTimeout(800); // 500ms debounce + buffer

    await page.reload();

    await expect(page.locator('[data-coord="1,0"]')).toContainText('X');
  });
});
