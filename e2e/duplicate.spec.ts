import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

function uniqueTitle(label: string) {
  return `M4 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Waits for navigation to a puzzle that ISN'T the one we started on.
 *
 * A plain /\/puzzles\/[^/]+$/ pattern would match the URL we're already on and
 * resolve immediately, without waiting for any navigation at all -- the wait
 * has to discriminate between the before- and after-state to be a wait.
 */
function waitForCopy(page: Page, sourceId: string) {
  return page.waitForURL(
    (url) =>
      /\/puzzles\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith(`/${sourceId}`)
  );
}

// 3x3 with a black corner at (2,2) and letters in the top row / left column.
function letteredGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3, black: [{ col: 2, row: 2 }] });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  grid = withLetter(grid, { col: 0, row: 1 }, 'A');
  grid = withLetter(grid, { col: 0, row: 2 }, 'T');
  return grid;
}

const LETTERED = [
  { coord: '0,0', letter: 'C' },
  { coord: '1,0', letter: 'A' },
  { coord: '2,0', letter: 'T' },
  { coord: '0,1', letter: 'A' },
  { coord: '0,2', letter: 'T' },
];

// --- M4-2: duplicate flow ---
test.describe('M4-2 duplicate', () => {
  test('duplicating navigates to a different puzzle', async ({ page }) => {
    const { id } = await seedPuzzle(
      { grid: letteredGrid(), hints: {}, phase: 'grid' },
      uniqueTitle('navigates')
    );
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('duplicate-puzzle-button').click();
    await waitForCopy(page, id);

    expect(page.url()).not.toContain(id);
  });

  test('the copy is titled "Copy of" the original', async ({ page }) => {
    const title = uniqueTitle('titled');
    const { id } = await seedPuzzle(
      { grid: letteredGrid(), hints: {}, phase: 'grid' },
      title
    );
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('duplicate-puzzle-button').click();
    await waitForCopy(page, id);
    await waitForEditorReady(page);

    await expect(page.getByTestId('puzzle-title')).toHaveValue(`Copy of ${title}`);
  });

  test('the copy has the same letters and the same black cells', async ({ page }) => {
    const { id } = await seedPuzzle(
      { grid: letteredGrid(), hints: {}, phase: 'grid' },
      uniqueTitle('fidelity')
    );
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('duplicate-puzzle-button').click();
    await waitForCopy(page, id);
    await waitForEditorReady(page);

    for (const { coord, letter } of LETTERED) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toContainText(letter);
    }
    await expect(page.locator('[data-coord="2,2"]')).toHaveAttribute('data-kind', 'black');
    await expect(page.locator('[data-testid="grid-cell"][data-kind="black"]')).toHaveCount(1);
  });

  test('duplicating a hints-phase puzzle copies its phase and hint text', async ({ page }) => {
    const hints = { '1-across': 'Feline, familiarly', '1-down': 'A downward clue' };
    const { id } = await seedPuzzle(
      { grid: letteredGrid(), hints, phase: 'hints' },
      uniqueTitle('hints')
    );
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('duplicate-puzzle-button').click();
    await waitForCopy(page, id);
    await waitForEditorReady(page);

    await expect(page.getByTestId('phase-badge')).toContainText('hints');
    await expect(
      page.locator('[data-hint-key="1-across"] [data-testid="hint-input"]')
    ).toHaveValue('Feline, familiarly');
    await expect(
      page.locator('[data-hint-key="1-down"] [data-testid="hint-input"]')
    ).toHaveValue('A downward clue');
  });

  test('the original survives unchanged', async ({ page }) => {
    const title = uniqueTitle('original');
    const { id } = await seedPuzzle(
      { grid: letteredGrid(), hints: {}, phase: 'grid' },
      title
    );
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('duplicate-puzzle-button').click();
    await waitForCopy(page, id);

    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await expect(page.getByTestId('puzzle-title')).toHaveValue(title);
    for (const { coord, letter } of LETTERED) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toContainText(letter);
    }
  });

  test('both the original and the copy appear in the list', async ({ page }) => {
    const title = uniqueTitle('listed');
    const { id } = await seedPuzzle(
      { grid: letteredGrid(), hints: {}, phase: 'grid' },
      title
    );
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('duplicate-puzzle-button').click();
    await waitForCopy(page, id);

    await page.goto('/puzzles');

    const list = page.getByTestId('puzzle-list');
    await expect(list).toContainText(title);
    await expect(list).toContainText(`Copy of ${title}`);
  });
});
