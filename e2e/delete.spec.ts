import { test, expect } from '@playwright/test';
import { createGrid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// Other spec files seed puzzles concurrently against the same test database, so
// assertions here key on a title unique to this run rather than on list counts
// (see the count-based race that had to be removed from persistence.spec.ts).
function uniqueTitle(label: string) {
  return `M2 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function seedForDelete(title: string) {
  return seedPuzzle(
    { grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' },
    title
  );
}

// --- M2-1: delete flow ---
test.describe('M2-1 delete', () => {
  test('the detail page offers a delete action, with no confirmation showing initially', async ({
    page,
  }) => {
    const { id } = await seedForDelete(uniqueTitle('offers'));
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await expect(page.getByTestId('delete-puzzle-button')).toBeVisible();
    await expect(page.getByTestId('delete-confirmation')).toHaveCount(0);
  });

  test('the confirmation states that deletion cannot be undone', async ({ page }) => {
    const { id } = await seedForDelete(uniqueTitle('warns'));
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('delete-puzzle-button').click();

    const confirmation = page.getByTestId('delete-confirmation');
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText('cannot be undone');
  });

  test('cancelling leaves the puzzle intact', async ({ page }) => {
    const title = uniqueTitle('cancelled');
    const { id } = await seedForDelete(title);
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('delete-puzzle-button').click();
    await page.getByTestId('delete-cancel-button').click();

    await expect(page.getByTestId('delete-confirmation')).toHaveCount(0);
    await expect(page.getByTestId('delete-puzzle-button')).toBeVisible();

    await page.reload();
    await expect(page.getByTestId('puzzle-title')).toHaveValue(title);
  });

  test('confirming deletes the puzzle and returns to the list without it', async ({ page }) => {
    const title = uniqueTitle('deleted');
    const { id } = await seedForDelete(title);
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('delete-puzzle-button').click();
    await page.getByTestId('delete-confirm-button').click();

    await page.waitForURL('**/puzzles');
    await expect(page.getByTestId('puzzle-list')).not.toContainText(title);
  });

  test('the deleted puzzle URL renders the not-found state afterward', async ({ page }) => {
    const { id } = await seedForDelete(uniqueTitle('gone'));
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('delete-puzzle-button').click();
    await page.getByTestId('delete-confirm-button').click();
    await page.waitForURL('**/puzzles');

    const response = await page.goto(`/puzzles/${id}`);

    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('puzzle-not-found')).toBeVisible();
  });
});
