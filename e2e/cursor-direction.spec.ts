import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

/**
 * A fully active 3x3 in grid phase. Every row and every column is a slot, so
 * the highlighted slot is an unambiguous readout of the cursor's orientation:
 * across highlights the row, down highlights the column.
 */
async function open(page: Page) {
  const { id } = await seedPuzzle({
    grid: createGrid({ cols: 3, rows: 3 }),
    hints: {},
    phase: 'grid',
  });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  return id;
}

const cell = (page: Page, coord: string) => page.locator(`[data-coord="${coord}"]`);

/** The cursor starts at (0,0) across, so row 0 is highlighted. */
async function expectAcrossAtOrigin(page: Page) {
  await expect(cell(page, '0,0')).toHaveAttribute('data-highlight', 'selected');
  await expect(cell(page, '1,0')).toHaveAttribute('data-highlight', 'slot');
  await expect(cell(page, '2,0')).toHaveAttribute('data-highlight', 'slot');
  await expect(cell(page, '0,1')).not.toHaveAttribute('data-highlight', 'slot');
}

async function expectDownAtOrigin(page: Page) {
  await expect(cell(page, '0,0')).toHaveAttribute('data-highlight', 'selected');
  await expect(cell(page, '0,1')).toHaveAttribute('data-highlight', 'slot');
  await expect(cell(page, '0,2')).toHaveAttribute('data-highlight', 'slot');
  await expect(cell(page, '1,0')).not.toHaveAttribute('data-highlight', 'slot');
}

// --- F2r-4: direction handling in the editor ---
test.describe('F2r-4 cursor direction', () => {
  test('a perpendicular arrow changes direction without moving', async ({ page }) => {
    await open(page);
    await expectAcrossAtOrigin(page);

    await page.keyboard.press('ArrowDown');

    // orientation flipped, selection did not move
    await expectDownAtOrigin(page);
  });

  test('a second perpendicular press then moves', async ({ page }) => {
    await open(page);

    await page.keyboard.press('ArrowDown');
    await expect(cell(page, '0,0')).toHaveAttribute('data-highlight', 'selected');

    await page.keyboard.press('ArrowDown');

    await expect(cell(page, '0,1')).toHaveAttribute('data-highlight', 'selected');
    await expect(cell(page, '0,0')).toHaveAttribute('data-highlight', 'slot');
  });

  test('an arrow along the orientation moves without flipping', async ({ page }) => {
    await open(page);

    await page.keyboard.press('ArrowRight');

    await expect(cell(page, '1,0')).toHaveAttribute('data-highlight', 'selected');
    await expect(cell(page, '2,0')).toHaveAttribute('data-highlight', 'slot');
    await expect(cell(page, '1,1')).not.toHaveAttribute('data-highlight', 'slot');
  });

  test('a blocked move changes nothing at all', async ({ page }) => {
    await open(page);

    // across at (0,0): Left is along the orientation but off the grid
    await page.keyboard.press('ArrowLeft');

    await expectAcrossAtOrigin(page);
  });

  test('space toggles orientation without moving', async ({ page }) => {
    await open(page);
    await expectAcrossAtOrigin(page);

    await page.keyboard.press(' ');
    await expectDownAtOrigin(page);

    await page.keyboard.press(' ');
    await expectAcrossAtOrigin(page);
  });

  test('clicking the already-selected cell toggles orientation', async ({ page }) => {
    await open(page);
    await expectAcrossAtOrigin(page);

    await cell(page, '0,0').click();

    await expectDownAtOrigin(page);
  });

  test('clicking a different cell moves without flipping', async ({ page }) => {
    await open(page);

    await cell(page, '2,2').click();

    await expect(cell(page, '2,2')).toHaveAttribute('data-highlight', 'selected');
    await expect(cell(page, '0,2')).toHaveAttribute('data-highlight', 'slot');
    await expect(cell(page, '2,0')).not.toHaveAttribute('data-highlight', 'slot');
  });

  test('typing still writes and advances along the current orientation', async ({ page }) => {
    await open(page);

    await page.keyboard.press('x');

    await expect(cell(page, '0,0')).toContainText('X');
    await expect(cell(page, '1,0')).toHaveAttribute('data-highlight', 'selected');
  });

  test('typing after a direction change advances the new way', async ({ page }) => {
    await open(page);

    await page.keyboard.press(' '); // now down, still at (0,0)
    await page.keyboard.press('y');

    await expect(cell(page, '0,0')).toContainText('Y');
    await expect(cell(page, '0,1')).toHaveAttribute('data-highlight', 'selected');
  });
});
