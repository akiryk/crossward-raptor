import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

function uniqueTitle(label: string) {
  return `PB5 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

/** Rows are matched by their unique title, never by position. */
function row(page: Page, title: string) {
  return page.locator('[data-testid="puzzle-list-item"]', { hasText: title });
}

async function seedReady(title: string) {
  return seedPuzzle(
    { grid: fillAll(createGrid({ cols: 3, rows: 3 })), hints: ALL_HINTS, phase: 'hints' },
    title
  );
}

/** Publishes through the real UI, so no seeding of published state is needed.
 *  14-S4: through 3 Publish and the Publish dialog's Private/Public choice. */
async function publishVia(page: Page, id: string, visibility: 'private' | 'public') {
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  await page.locator('[data-testid="builder-steps"] [data-step-id="publish"]').click();

  const dialog = page.getByTestId('publish-dialog');
  if (visibility === 'public') {
    await dialog.getByRole('radio', { name: 'Public' }).check();
  }
  await dialog.getByTestId('modal-confirm').click();
  await expect(page.getByTestId('publish-state')).toHaveText('Published');
}

// --- PB5-2: the list ---
test.describe('PB5-2 published status in the list', () => {
  test('an unpublished puzzle reports as unpublished', async ({ page }) => {
    const title = uniqueTitle('unpublished');
    await seedReady(title);

    await page.goto('/puzzles');

    const item = row(page, title);
    await expect(item).toHaveAttribute('data-published', 'false');
    expect(await item.getAttribute('data-published-at')).toBeNull();
  });

  test('a privately published puzzle reports as published and private', async ({ page }) => {
    const title = uniqueTitle('private');
    const { id } = await seedReady(title);
    await publishVia(page, id, 'private');

    await page.goto('/puzzles');

    const item = row(page, title);
    await expect(item).toHaveAttribute('data-published', 'true');
    await expect(item).toHaveAttribute('data-visibility', 'private');
    // 14-S2: the marker reads [published]; visibility stays in data-visibility.
    await expect(item).toContainText('[published]');

    const publishedAt = await item.getAttribute('data-published-at');
    expect(publishedAt).toBeTruthy();
    expect(Number.isNaN(Date.parse(publishedAt ?? ''))).toBe(false);
  });

  test('a publicly published puzzle reports as public', async ({ page }) => {
    const title = uniqueTitle('public');
    const { id } = await seedReady(title);
    await publishVia(page, id, 'public');

    await page.goto('/puzzles');

    const item = row(page, title);
    await expect(item).toHaveAttribute('data-visibility', 'public');
    await expect(item).toContainText('[published]');
  });

  // 14-S4: "unpublishing returns the row to unpublished" is retired, since
  // there is no Unpublish.

  test("Story M3's attributes are still present and correct", async ({ page }) => {
    const title = uniqueTitle('m3');
    await seedReady(title);

    await page.goto('/puzzles');

    const item = row(page, title);
    await expect(item).toHaveAttribute('data-phase', 'hints');
    await expect(item).toHaveAttribute('data-hints-complete', 'true');

    const updatedAt = await item.getAttribute('data-updated-at');
    expect(updatedAt).toBeTruthy();
    expect(Number.isNaN(Date.parse(updatedAt ?? ''))).toBe(false);
  });
});
