import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

function fillAll(grid: Grid, letter = 'A'): Grid {
  let filled = grid;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (grid.at(col, row).kind === 'active') {
        filled = withLetter(filled, { col, row }, letter);
      }
    }
  }
  return filled;
}

const ALL_HINTS: Record<string, string> = {
  '1-across': 'a',
  '4-across': 'b',
  '5-across': 'c',
  '1-down': 'd',
  '2-down': 'e',
  '3-down': 'f',
};

const cell = (page: Page, coord: string) => page.locator(`[data-coord="${coord}"]`);

async function openEditor(page: Page, id: string) {
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
}

async function seedHintsPhase() {
  return seedPuzzle({
    grid: fillAll(createGrid({ cols: 3, rows: 3 })),
    hints: ALL_HINTS,
    phase: 'hints',
  });
}

// 14-S4: publishing goes through 3 Publish and the Publish dialog, and a
// published puzzle shows "Published" instead of an Unpublish button.
async function publish(page: Page) {
  await page.locator('[data-testid="builder-steps"] [data-step-id="publish"]').click();
  await page.getByTestId('publish-dialog').getByTestId('modal-confirm').click();
  await expect(page.getByTestId('publish-state')).toHaveText('Published');
}

// --- PB4-1: the lock ---
test.describe('PB4-1 a published puzzle is read-only', () => {
  // 14-S4: "Published" replaces the explaining message, and the numbered
  // buttons (Edit the Grid among them) are gone rather than disabled.
  test('controls are disabled and the puzzle shows as published', async ({ page }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);
    await publish(page);

    await expect(page.getByTestId('published-lock-message')).toHaveCount(0);
    await expect(page.getByTestId('publish-state')).toHaveText('Published');

    await expect(page.getByTestId('puzzle-title')).toBeDisabled();
    await expect(page.getByTestId('hint-input').first()).toBeDisabled();
    await expect(page.getByTestId('clear-letters-button')).toHaveCount(0);
    await expect(page.locator('[data-step-id]')).toHaveCount(0);
  });

  test('typing a letter changes nothing', async ({ page }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);
    await publish(page);

    await cell(page, '1,1').click();
    await page.keyboard.press('z');

    await expect(cell(page, '1,1')).toContainText('A');
    await expect(cell(page, '1,1')).not.toContainText('Z');
  });

  test('Backspace changes nothing', async ({ page }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);
    await publish(page);

    await cell(page, '1,1').click();
    await page.keyboard.press('Backspace');

    await expect(cell(page, '1,1')).toContainText('A');
  });

  // 14-S5 retired "a geometry toggle is rejected by the existing hints-phase
  // path": '.' does nothing and the geometry-locked message is gone.

});

// --- PB4-2: retired by 14-S4 (publishing is final; there is no Unpublish) ---

// --- PB4-3: an unpublished puzzle is unaffected ---
test.describe('PB4-3 an unpublished puzzle is unaffected', () => {
  test('no lock message, and editing works as before', async ({ page }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);

    await expect(page.getByTestId('publish-state')).toHaveCount(0);
    await expect(page.getByTestId('puzzle-title')).toBeEnabled();
    await expect(page.getByTestId('hint-input').first()).toBeEnabled();

    // Story H4: hints phase locks the grid, so typing goes through EDIT
    // GRID mode. Nothing about being unpublished changes that. 14-S4: Clear
    // all letters is removed; 1 Edit the Grid replaced the toggle.
    await page.locator('[data-testid="builder-steps"] [data-step-id="build"]').click();
    await cell(page, '1,1').click();
    await page.keyboard.press('z');
    await expect(cell(page, '1,1')).toContainText('Z');
  });

  test('hint text can still be edited', async ({ page }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);

    const input = page.locator('[data-hint-key="1-across"] [data-testid="hint-input"]');
    await input.fill('A brand new clue');

    await expect(input).toHaveValue('A brand new clue');
  });
});
