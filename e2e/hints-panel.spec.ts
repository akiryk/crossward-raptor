import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
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

    // ArrowDown from (0,0) 'across' is perpendicular: orientation flips to
    // 'down', cursor stays at (0,0) (Story F2r). Typing 'x' then writes
    // there and advances to (0,1).
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('x'); // writes at (0,0), advances to (0,1)

    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute('data-highlight', 'slot');
    await expect(page.locator('[data-coord="0,1"]')).toHaveAttribute(
      'data-highlight',
      'selected'
    );
    await expect(page.locator('[data-coord="0,2"]')).toHaveAttribute('data-highlight', 'slot');
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

/**
 * A 3x3 word square, CAT / ARE / TEA, seeded straight into hints phase.
 * Same six hint keys as smallGrid above, but every cell lettered, so each
 * row has a real answer to show.
 * Across: 1 CAT, 4 ARE, 5 TEA. Down: 1 CAT, 2 ARE, 3 TEA.
 */
function wordSquare(): Grid {
  const rows = [
    ['C', 'A', 'T'],
    ['A', 'R', 'E'],
    ['T', 'E', 'A'],
  ];
  let grid = createGrid({ cols: 3, rows: 3 });
  rows.forEach((letters, row) => {
    letters.forEach((letter, col) => {
      grid = withLetter(grid, { col, row }, letter);
    });
  });
  return grid;
}

async function openWordSquare(page: Page) {
  const { id } = await seedPuzzle({ grid: wordSquare(), hints: {}, phase: 'hints' });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  await expect(page.getByTestId('hints-region')).toBeVisible();
  return id;
}

const column = (page: Page, orientation: 'across' | 'down') =>
  page.locator(`[data-testid="hint-column"][data-orientation="${orientation}"]`);

const row = (page: Page, key: string) => page.locator(`[data-hint-key="${key}"]`);

// --- H3-2: columns, labels and answers ---
test.describe('H3-2 clue panel', () => {
  test('renders one column per orientation, each with its own heading', async ({ page }) => {
    await openWordSquare(page);

    await expect(page.getByTestId('hint-column')).toHaveCount(2);
    await expect(column(page, 'across').getByTestId('hint-column-heading')).toHaveText('Across');
    await expect(column(page, 'down').getByTestId('hint-column-heading')).toHaveText('Down');
  });

  test('puts every across slot in the across column', async ({ page }) => {
    await openWordSquare(page);

    const across = column(page, 'across');
    await expect(across.locator('[data-testid="hint-row"]')).toHaveCount(3);
    for (const key of ['1-across', '4-across', '5-across']) {
      await expect(across.locator(`[data-hint-key="${key}"]`)).toHaveCount(1);
    }
    await expect(across.locator('[data-hint-key="1-down"]')).toHaveCount(0);
  });

  test('puts every down slot in the down column', async ({ page }) => {
    await openWordSquare(page);

    const down = column(page, 'down');
    await expect(down.locator('[data-testid="hint-row"]')).toHaveCount(3);
    for (const key of ['1-down', '2-down', '3-down']) {
      await expect(down.locator(`[data-hint-key="${key}"]`)).toHaveCount(1);
    }
    await expect(down.locator('[data-hint-key="1-across"]')).toHaveCount(0);
  });

  test('labels a row with its number alone, without the orientation', async ({ page }) => {
    await openWordSquare(page);

    await expect(row(page, '4-across').getByTestId('hint-label')).toHaveText('4');
    await expect(row(page, '2-down').getByTestId('hint-label')).toHaveText('2');
  });

  test('shows each across row its own answer', async ({ page }) => {
    await openWordSquare(page);

    await expect(row(page, '1-across').getByTestId('hint-answer')).toHaveText('CAT');
    await expect(row(page, '4-across').getByTestId('hint-answer')).toHaveText('ARE');
    await expect(row(page, '5-across').getByTestId('hint-answer')).toHaveText('TEA');
  });

  test("reads a down row's answer down the grid", async ({ page }) => {
    await openWordSquare(page);

    await expect(row(page, '2-down').getByTestId('hint-answer')).toHaveText('ARE');
    await expect(row(page, '3-down').getByTestId('hint-answer')).toHaveText('TEA');
  });

  test('writes an underscore per unfilled cell in an answer', async ({ page }) => {
    const { id } = await seedHintsPhasePuzzle();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    // smallGrid has no letters at all, so every answer is all underscores.
    await expect(row(page, '1-across').getByTestId('hint-answer')).toHaveText('___');
    await expect(row(page, '5-across').getByTestId('hint-answer')).toHaveText('__');
  });
});
