import { test, expect } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

/**
 *   C A T
 *   A . .
 *   T . .
 *
 * Five lettered cells; four empty cells that the transition should blacken.
 */
function letteredGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3 });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  grid = withLetter(grid, { col: 0, row: 1 }, 'A');
  grid = withLetter(grid, { col: 0, row: 2 }, 'T');
  return grid;
}

const EMPTY_COORDS = ['1,1', '2,1', '1,2', '2,2'];
const LETTERED = [
  { coord: '0,0', letter: 'C' },
  { coord: '1,0', letter: 'A' },
  { coord: '2,0', letter: 'T' },
  { coord: '0,1', letter: 'A' },
  { coord: '0,2', letter: 'T' },
];

async function seedLettered() {
  return seedPuzzle({ grid: letteredGrid(), hints: {}, phase: 'grid' });
}

// --- PB1a-2: hints-transition conversion flow ---
test.describe('PB1a-2 entering hints phase converts empty cells', () => {
  test('the confirmation warns it cannot be undone and states the count', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('enter-hints-button').click();

    const confirmation = page.getByTestId('enter-hints-confirmation');
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText('cannot be undone');
    await expect(confirmation).toContainText('4');

    // still in grid phase until confirmed
    await expect(page.getByTestId('phase-badge')).toContainText('grid');
  });

  test('cancelling leaves the puzzle in grid phase, unchanged', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('enter-hints-button').click();
    await page.getByTestId('enter-hints-cancel-button').click();

    await expect(page.getByTestId('enter-hints-confirmation')).toHaveCount(0);
    await expect(page.getByTestId('phase-badge')).toContainText('grid');
    for (const coord of EMPTY_COORDS) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toHaveAttribute(
        'data-kind',
        'active'
      );
    }
  });

  test('confirming blackens exactly the empty cells', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('enter-hints-button').click();
    await page.getByTestId('enter-hints-confirm-button').click();
    await expect(page.getByTestId('phase-badge')).toContainText('hints');

    for (const coord of EMPTY_COORDS) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toHaveAttribute(
        'data-kind',
        'black'
      );
    }
    await expect(page.locator('[data-testid="grid-cell"][data-kind="black"]')).toHaveCount(4);
  });

  test('lettered cells survive the conversion with their letters', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('enter-hints-button').click();
    await page.getByTestId('enter-hints-confirm-button').click();
    await expect(page.getByTestId('phase-badge')).toContainText('hints');

    for (const { coord, letter } of LETTERED) {
      const cell = page.locator(`[data-coord="${coord}"]`);
      await expect(cell).toHaveAttribute('data-kind', 'active');
      await expect(cell).toContainText(letter);
    }
  });

  test('the converted grid survives a reload', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.request().headers()['next-action'] !== undefined
    );
    await page.getByTestId('enter-hints-button').click();
    await page.getByTestId('enter-hints-confirm-button').click();
    await saved;

    await page.reload();
    await waitForEditorReady(page);

    // proves grid was persisted, not just applied in local state
    for (const coord of EMPTY_COORDS) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toHaveAttribute(
        'data-kind',
        'black'
      );
    }
    await expect(page.locator('[data-coord="0,0"]')).toContainText('C');
  });

  test('the hints panel lists only the two slots the converted grid leaves', async ({ page }) => {
    const { id } = await seedLettered();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('enter-hints-button').click();
    await page.getByTestId('enter-hints-confirm-button').click();
    await expect(page.getByTestId('phase-badge')).toContainText('hints');

    // hints derive from the converted geometry: one across run, one down run
    await expect(page.getByTestId('hint-row')).toHaveCount(2);
    await expect(page.locator('[data-hint-key="1-across"]')).toBeVisible();
    await expect(page.locator('[data-hint-key="1-down"]')).toBeVisible();
  });
});
