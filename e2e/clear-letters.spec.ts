import { test, expect } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import type { Phase } from '../src/engine/puzzle';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// 3x3 with a black corner at (2,2), letters in the top row and left column.
function letteredGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3, black: [{ col: 2, row: 2 }] });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  grid = withLetter(grid, { col: 0, row: 1 }, 'A');
  grid = withLetter(grid, { col: 0, row: 2 }, 'T');
  return grid;
}

async function seedLettered(phase: Phase = 'grid') {
  return seedPuzzle({ grid: letteredGrid(), hints: {}, phase });
}

function waitForSave(page: import('@playwright/test').Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.request().headers()['next-action'] !== undefined
  );
}

const LETTERED = [
  { coord: '0,0', letter: 'C' },
  { coord: '1,0', letter: 'A' },
  { coord: '2,0', letter: 'T' },
  { coord: '0,1', letter: 'A' },
  { coord: '0,2', letter: 'T' },
];

// --- M5-2: clear flow ---
test.describe('M5-2 clear all letters', () => {
  test('offers a clear action, with no confirmation showing initially', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await expect(page.getByTestId('clear-letters-button')).toBeVisible();
    await expect(page.getByTestId('clear-letters-confirmation')).toHaveCount(0);
  });

  test('the confirmation states that clearing cannot be undone', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('clear-letters-button').click();

    const confirmation = page.getByTestId('clear-letters-confirmation');
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText('cannot be undone');
  });

  test('cancelling leaves every letter in place', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('clear-letters-button').click();
    await page.getByTestId('clear-letters-cancel-button').click();

    await expect(page.getByTestId('clear-letters-confirmation')).toHaveCount(0);
    for (const { coord, letter } of LETTERED) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toContainText(letter);
    }
  });

  test('confirming empties every lettered cell', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('clear-letters-button').click();
    await page.getByTestId('clear-letters-confirm-button').click();

    for (const { coord, letter } of LETTERED) {
      await expect(page.locator(`[data-coord="${coord}"]`)).not.toContainText(letter);
    }
  });

  test('black cells stay black after clearing', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('clear-letters-button').click();
    await page.getByTestId('clear-letters-confirm-button').click();

    await expect(page.locator('[data-coord="2,2"]')).toHaveAttribute('data-kind', 'black');
    await expect(page.locator('[data-testid="grid-cell"][data-kind="black"]')).toHaveCount(1);
  });

  test('the cleared grid survives a reload', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const saved = waitForSave(page);
    await page.getByTestId('clear-letters-button').click();
    await page.getByTestId('clear-letters-confirm-button').click();
    await saved;

    await page.reload();
    await waitForEditorReady(page);

    for (const { coord, letter } of LETTERED) {
      await expect(page.locator(`[data-coord="${coord}"]`)).not.toContainText(letter);
    }
  });

  test('clearing works the same way in hints phase', async ({ page }) => {
    const { id } = await seedLettered('hints');
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('clear-letters-button').click();
    await page.getByTestId('clear-letters-confirm-button').click();

    for (const { coord, letter } of LETTERED) {
      await expect(page.locator(`[data-coord="${coord}"]`)).not.toContainText(letter);
    }
    await expect(page.getByTestId('phase-badge')).toContainText('hints');
  });
});
