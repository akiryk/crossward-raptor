import { test, expect } from '@playwright/test';
import { waitForEditorReady } from './helpers/wait-for-ready';

function uniqueTitle(label: string) {
  return `D6 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Follow-up to Story D6's review: Create must not be clickable a second
// time while the first submission is still in flight.
test('rapid double-click on Create does not create two puzzles', async ({ page }) => {
  const title = uniqueTitle('dblclick');
  await page.goto('/puzzles');
  await page.getByTestId('new-puzzle-button').click();
  await expect(page.getByTestId('new-puzzle-dialog')).toBeVisible();
  await page.getByTestId('new-puzzle-name').fill(title);

  // Dispatched directly on the element, bypassing Playwright's own
  // actionability retries, so both clicks land before React can
  // re-render the button as disabled -- the race this guards against.
  await page.getByTestId('new-puzzle-create').evaluate((el) => {
    (el as HTMLButtonElement).click();
    (el as HTMLButtonElement).click();
  });

  await page.waitForURL(/\/puzzles\/[^/]+$/);
  await waitForEditorReady(page);

  await page.goto('/puzzles');
  await expect(page.getByTestId('puzzle-list-item').filter({ hasText: title })).toHaveCount(1);
});
