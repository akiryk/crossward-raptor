import { test, expect } from '@playwright/test';
import { createGrid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

async function seedPuzzleForRename(title?: string) {
  return seedPuzzle(
    { grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' },
    title
  );
}

// The title save is debounced (500ms), same as saveGrid/saveHints. Wait on the
// real Server Action response rather than a fixed duration -- a reload can
// otherwise abort the in-flight write (see e2e reload-race fixes).
function waitForSave(page: import('@playwright/test').Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.request().headers()['next-action'] !== undefined
  );
}

// --- M1-2: rename flow ---
test.describe('M1-2 rename', () => {
  test('the title renders as an input carrying the current title', async ({ page }) => {
    const { id } = await seedPuzzleForRename('Seeded Test Puzzle');
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await expect(page.getByTestId('puzzle-title')).toHaveValue('Seeded Test Puzzle');
  });

  test('a renamed puzzle keeps its new title across a reload', async ({ page }) => {
    const { id } = await seedPuzzleForRename();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const saved = waitForSave(page);
    await page.getByTestId('puzzle-title').fill('Monday Puzzle');
    await saved;

    await page.reload();

    await expect(page.getByTestId('puzzle-title')).toHaveValue('Monday Puzzle');
  });

  test('the new title appears on the puzzle list', async ({ page }) => {
    const { id } = await seedPuzzleForRename();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const saved = waitForSave(page);
    await page.getByTestId('puzzle-title').fill('Listed Under This Name');
    await saved;

    await page.goto('/puzzles');

    await expect(page.getByTestId('puzzle-list')).toContainText('Listed Under This Name');
  });

  test('clearing the title falls back to the default', async ({ page }) => {
    const { id } = await seedPuzzleForRename('Has A Name');
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const saved = waitForSave(page);
    await page.getByTestId('puzzle-title').fill('');
    await saved;

    await page.reload();

    await expect(page.getByTestId('puzzle-title')).toHaveValue('Untitled Puzzle');
  });

  test('typing in the title does not write letters into the grid', async ({ page }) => {
    const { id } = await seedPuzzleForRename();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('puzzle-title').fill('CAT');

    // every cell must still be empty -- the window keydown listener must not
    // treat typing in a text input as grid input
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        await expect(page.locator(`[data-coord="${col},${row}"]`)).toHaveText('');
      }
    }
  });

  test('grid editing still works after editing the title', async ({ page }) => {
    const { id } = await seedPuzzleForRename();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('puzzle-title').fill('Some Title');

    await page.locator('[data-coord="1,1"]').click();
    await page.keyboard.press('x');

    await expect(page.locator('[data-coord="1,1"]')).toContainText('X');
  });
});
