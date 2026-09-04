import { test, expect } from '@playwright/test';
import { createGrid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// Same 3x3-black-at-(2,2) shape used in hint-lookup.test.ts:
// keys 1-across, 1-down, 2-down, 3-down, 4-across, 5-across.
function smallGrid() {
  return createGrid({ cols: 3, rows: 3, black: [{ col: 2, row: 2 }] });
}

async function seedHintsPhasePuzzle(hints: Record<string, string> = {}) {
  return seedPuzzle({ grid: smallGrid(), hints, phase: 'hints' });
}

// --- P5-2: hints panel ---
test.describe('P5-2 hints panel', () => {
  test('renders one row per required hint, with correct completeness', async ({ page }) => {
    const { id } = await seedHintsPhasePuzzle({ '1-across': 'Clue A', '2-down': 'Clue B' });
    await page.goto(`/puzzles/${id}`);

    await expect(page.getByTestId('hint-row')).toHaveCount(6);

    await expect(page.locator('[data-hint-key="1-across"]')).toHaveAttribute(
      'data-complete',
      'true'
    );
    await expect(page.locator('[data-hint-key="2-down"]')).toHaveAttribute(
      'data-complete',
      'true'
    );
    await expect(page.locator('[data-hint-key="1-down"]')).toHaveAttribute(
      'data-complete',
      'false'
    );
    await expect(page.locator('[data-hint-key="4-across"]')).toHaveAttribute(
      'data-complete',
      'false'
    );
  });

  test('on load, the initial cursor position marks its slot active', async ({ page }) => {
    const { id } = await seedHintsPhasePuzzle();
    await page.goto(`/puzzles/${id}`);

    // initial cursor: first active cell (0,0), default orientation 'across'
    await expect(page.locator('[data-hint-key="1-across"]')).toHaveAttribute(
      'data-active',
      'true'
    );
  });

  test('arrow key navigation updates the active hint row', async ({ page }) => {
    const { id } = await seedHintsPhasePuzzle();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.keyboard.press('ArrowDown'); // (0,0) -> (0,1), orientation 'down'

    await expect(page.locator('[data-hint-key="1-down"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-hint-key="1-across"]')).not.toHaveAttribute(
      'data-active',
      'true'
    );
  });

  test('typing highlights the exact cursor cell and the rest of its slot', async ({ page }) => {
    const { id } = await seedHintsPhasePuzzle();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.keyboard.press('ArrowDown'); // now at (0,1), orientation 'down'
    await page.keyboard.press('x'); // writes at (0,1), advances to (0,2)

    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute('data-highlight', 'slot');
    await expect(page.locator('[data-coord="0,1"]')).toHaveAttribute('data-highlight', 'slot');
    await expect(page.locator('[data-coord="0,2"]')).toHaveAttribute(
      'data-highlight',
      'selected'
    );
  });

  test("clicking into a hint input moves the grid cursor to that slot's start", async ({
    page,
  }) => {
    const { id } = await seedHintsPhasePuzzle();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.locator('[data-hint-key="1-across"] [data-testid="hint-input"]').click();

    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute(
      'data-highlight',
      'selected'
    );
    await expect(page.locator('[data-hint-key="1-across"]')).toHaveAttribute(
      'data-active',
      'true'
    );
  });

  test('editing hint text survives a reload once the debounce window has passed', async ({
    page,
  }) => {
    const { id } = await seedHintsPhasePuzzle();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const input = page.locator('[data-hint-key="1-across"] [data-testid="hint-input"]');
    await input.click();

    // saveHints fires 500ms after the hints state change (debounced), via a
    // Server Action POST — set up the listener before triggering that change
    // so we can't miss it, and wait for the real completion signal rather
    // than a guessed duration. A reload before this lands would abort the
    // in-flight request and the write would never persist.
    const saveHintsRequest = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.request().headers()['next-action'] !== undefined
    );
    await input.fill('A brand new clue');
    await saveHintsRequest;

    await page.reload();

    await expect(
      page.locator('[data-hint-key="1-across"] [data-testid="hint-input"]')
    ).toHaveValue('A brand new clue');
  });

  test('the panel does not render at all in grid phase', async ({ page }) => {
    const { id } = await seedPuzzle({ grid: smallGrid(), hints: {}, phase: 'grid' });
    await page.goto(`/puzzles/${id}`);

    await expect(page.getByTestId('hint-row')).toHaveCount(0);
  });
});
