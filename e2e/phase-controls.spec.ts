import { test, expect } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

async function seedFullyActive3x3() {
  return seedPuzzle({ grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' });
}

/**
 * Fully lettered so it needs no conversion to be a valid hints-phase grid --
 * seedPuzzle writes phase/grid exactly as given, bypassing enterHintsPhase
 * entirely (there's no UI path to it since visual-polish-02 removed the
 * enter-hints button; see docs/handoffs/06-HANDOFF-visual-polish.md).
 */
function fullyLetteredGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3 });
  const letters = 'CATASOTOR';
  let i = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      grid = withLetter(grid, { col, row }, letters[i]!);
      i++;
    }
  }
  return grid;
}

async function seedFullyLetteredHints3x3() {
  return seedPuzzle({ grid: fullyLetteredGrid(), hints: {}, phase: 'hints' });
}

// --- P4-2: phase controls and geometry toggling ---
test.describe('P4-2 phase controls and geometry toggling', () => {
  test('toggling a cell black also blackens its symmetric counterpart', async ({ page }) => {
    const { id } = await seedFullyActive3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.press('.');

    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute('data-kind', 'black');
    await expect(page.locator('[data-coord="2,2"]')).toHaveAttribute('data-kind', 'black');
  });

  test('toggling the same cell again turns it back active', async ({ page }) => {
    const { id } = await seedFullyActive3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.locator('[data-coord="1,1"]').click();
    await page.keyboard.press('.');
    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute('data-kind', 'black');

    await page.keyboard.press('.');
    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute('data-kind', 'active');
  });

  test('geometry edits are rejected in hints phase, with a visible message', async ({ page }) => {
    const { id } = await seedFullyLetteredHints3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.press('.');

    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute('data-kind', 'active');
    await expect(page.getByTestId('geometry-locked-message')).toBeVisible();
  });

  test('the rejection message auto-dismisses', async ({ page }) => {
    const { id } = await seedFullyLetteredHints3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.press('.');

    await expect(page.getByTestId('geometry-locked-message')).toBeVisible();
    await expect(page.getByTestId('geometry-locked-message')).toBeHidden({ timeout: 4000 });
  });

  test('letter editing still works normally in hints phase', async ({ page }) => {
    const { id } = await seedFullyLetteredHints3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    // Typing in hints phase requires EDIT GRID mode since Story H4. The
    // refocusing click must land on a cell the cursor isn't already on
    // -- the cursor starts at (0,0), and moveTo toggles orientation
    // rather than moving when you click the current cell (Story F2r) --
    // so click (1,1) instead.
    await page.getByTestId('edit-grid-toggle').click();
    await page.locator('[data-coord="1,1"]').click();
    await page.keyboard.press('x');

    await expect(page.locator('[data-coord="1,1"]')).toContainText('X');
  });
});
