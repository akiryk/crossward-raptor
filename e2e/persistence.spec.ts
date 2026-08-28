import { test, expect } from '@playwright/test';

// --- P1-2: persistence flow ---
test.describe('P1-2 persistence', () => {
  test('creating a new puzzle navigates to its detail page with correct defaults', async ({
    page,
  }) => {
    await page.goto('/puzzles');

    await page.getByTestId('new-puzzle-button').click();
    await page.waitForURL(/\/puzzles\/[^/]+$/);

    await expect(page.getByTestId('puzzle-title')).toContainText('Untitled Puzzle');
    await expect(page.getByTestId('puzzle-phase')).toContainText('grid');
  });

  test('reloading the detail page shows the same puzzle (persisted, not in-memory)', async ({
    page,
  }) => {
    await page.goto('/puzzles');
    await page.getByTestId('new-puzzle-button').click();
    await page.waitForURL(/\/puzzles\/[^/]+$/);
    const url = page.url();

    await page.reload();

    await expect(page).toHaveURL(url);
    await expect(page.getByTestId('puzzle-title')).toContainText('Untitled Puzzle');
    await expect(page.getByTestId('puzzle-phase')).toContainText('grid');
  });

  test('creating a puzzle increases the list length by exactly one', async ({ page }) => {
    await page.goto('/puzzles');
    const before = await page.getByTestId('puzzle-list-item').count();

    await page.getByTestId('new-puzzle-button').click();
    await page.waitForURL(/\/puzzles\/[^/]+$/);

    await page.goto('/puzzles');
    const after = await page.getByTestId('puzzle-list-item').count();

    expect(after).toBe(before + 1);
  });

  test('visiting a nonexistent puzzle id shows a clear not-found state', async ({ page }) => {
    const response = await page.goto('/puzzles/does-not-exist-12345');

    // Next.js notFound() renders with a 404 status
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('puzzle-not-found')).toBeVisible();
  });
});
