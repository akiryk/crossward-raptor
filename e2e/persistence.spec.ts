import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { waitForEditorReady } from './helpers/wait-for-ready';

// Since Story D6, creating a puzzle goes through a dialog that requires a
// name and a size. These tests still verify persistence -- they just take
// the one extra step the real flow now has.
function uniqueTitle(label: string) {
  return `P1 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createViaDialog(page: Page, title: string) {
  await page.getByTestId('new-puzzle-button').click();
  await expect(page.getByTestId('new-puzzle-dialog')).toBeVisible();
  await page.getByTestId('new-puzzle-name').fill(title);
  await page.getByTestId('new-puzzle-create').click();
  await page.waitForURL(/\/puzzles\/[^/]+$/);
  await waitForEditorReady(page);
}

// --- P1-2: persistence ---
test.describe('P1-2 persistence', () => {
  test('creating a new puzzle navigates to its detail page with correct defaults', async ({
    page,
  }) => {
    const title = uniqueTitle('defaults');
    await page.goto('/puzzles');

    await createViaDialog(page, title);

    await expect(page.getByTestId('puzzle-title')).toHaveValue(title);
    await expect(page.getByTestId('puzzle-phase')).toContainText('grid');
  });

  test('reloading the detail page shows the same puzzle (persisted, not in-memory)', async ({
    page,
  }) => {
    const title = uniqueTitle('reload');
    await page.goto('/puzzles');

    await createViaDialog(page, title);
    const url = page.url();

    await page.reload();
    await waitForEditorReady(page);

    await expect(page).toHaveURL(url);
    await expect(page.getByTestId('puzzle-title')).toHaveValue(title);
    await expect(page.getByTestId('puzzle-phase')).toContainText('grid');
  });

  test('a created puzzle appears in the list', async ({ page }) => {
    const title = uniqueTitle('listed');
    await page.goto('/puzzles');

    await createViaDialog(page, title);

    await page.goto('/puzzles');
    await expect(page.getByTestId('puzzle-list')).toContainText(title);
  });

  test('visiting a nonexistent puzzle id shows a clear not-found state', async ({ page }) => {
    const response = await page.goto('/puzzles/does-not-exist-12345');

    // Next.js notFound() renders with a 404 status
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('puzzle-not-found')).toBeVisible();
  });
});
