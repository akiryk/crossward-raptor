import { test, expect } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

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
  // 14-S5 retired the four '.' cases here (toggling a cell black and back;
  // the hints-phase rejection message and its dismissal): building has only
  // on and off cells, and '.' does nothing (e2e/build-grid-design.spec.ts).

  test('letter editing still works normally in hints phase', async ({ page }) => {
    const { id } = await seedFullyLetteredHints3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    // The focusing click must land on a cell the cursor isn't already on
    // -- the cursor starts at (0,0), and moveTo toggles orientation
    // rather than moving when you click the current cell (Story F2r) --
    // so click (1,1) instead.
    // 14-S12: no EDIT GRID mode to turn on first; the grid takes letters.
    await page.locator('[data-coord="1,1"]').click();
    await page.keyboard.press('x');

    await expect(page.locator('[data-coord="1,1"]')).toContainText('X');
  });
});
