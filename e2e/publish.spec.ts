import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';
import { builderEditSnapshot } from './helpers/builder-edits';

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

// 14-S4: 3 Publish opens the Publish dialog (or a too-early dialog), whose
// Private/Public radio replaces the "Keep private" checkbox. A published
// puzzle shows "Published", with no Unpublish, so visibility is read from
// the database.
const publishStep = (page: Page) =>
  page.locator('[data-testid="builder-steps"] [data-step-id="publish"]');
const dialog = (page: Page) => page.getByTestId('publish-dialog');

async function openPublishStep(page: Page, id: string) {
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  await publishStep(page).click();
}

async function seedReady(hints: Record<string, string> = ALL_HINTS) {
  return seedPuzzle({
    grid: fillAll(createGrid({ cols: 3, rows: 3 })),
    hints,
    phase: 'hints',
  });
}

// --- PB3-2: publishing ---
test.describe('PB3-2 publish', () => {
  test('an unpublished puzzle offers publishing, unlisted by default', async ({ page }) => {
    const { id } = await seedReady();
    await openPublishStep(page, id);

    await expect(dialog(page).getByTestId('modal-confirm')).toBeVisible();
    // 16-S1: the stored 'private' reads Unlisted.
    await expect(dialog(page).getByRole('radio', { name: 'Unlisted' })).toBeChecked();
    await expect(page.getByTestId('unpublish-button')).toHaveCount(0);
    await expect(page.getByTestId('publish-state')).toHaveCount(0);
  });

  test('publishing with Private chosen stores it private', async ({ page }) => {
    const { id } = await seedReady();
    await openPublishStep(page, id);

    await dialog(page).getByTestId('modal-confirm').click();

    await expect(page.getByTestId('publish-state')).toHaveText('Published');
    await expect(dialog(page)).toHaveCount(0);
    await expect(publishStep(page)).toHaveCount(0);
    await expect(page.getByTestId('unpublish-button')).toHaveCount(0);
    const stored = await builderEditSnapshot(id);
    expect(stored.publishedAt).toBeInstanceOf(Date);
    expect(stored.visibility).toBe('private');
  });

  test('the published state survives a reload', async ({ page }) => {
    const { id } = await seedReady();
    await openPublishStep(page, id);
    await dialog(page).getByTestId('modal-confirm').click();
    await expect(page.getByTestId('publish-state')).toHaveText('Published');

    await page.reload();
    await waitForEditorReady(page);

    await expect(page.getByTestId('publish-state')).toHaveText('Published');
    await expect(publishStep(page)).toHaveCount(0);
    expect((await builderEditSnapshot(id)).visibility).toBe('private');
  });

  test('choosing Public publishes it public', async ({ page }) => {
    const { id } = await seedReady();
    await openPublishStep(page, id);

    await dialog(page).getByRole('radio', { name: 'Public' }).check();
    await dialog(page).getByTestId('modal-confirm').click();

    await expect(page.getByTestId('publish-state')).toHaveText('Published');
    expect((await builderEditSnapshot(id)).visibility).toBe('public');
  });

  // 14-S4: "unpublishing returns it to the unpublished state" is retired,
  // since there is no Unpublish; "outstanding readiness findings do not
  // block publishing" is retired, since a blank hint now blocks it
  // (builder-controls.spec.ts covers both rules).

  // 17-S8: the build phase has no 3 Publish (it opened "Lol." or "Nope.").
  test('a grid-phase puzzle cannot be published', async ({ page }) => {
    const { id } = await seedPuzzle({
      grid: fillAll(createGrid({ cols: 3, rows: 3 })),
      hints: {},
      phase: 'grid',
    });
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await expect(publishStep(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /publish/i })).toHaveCount(0);
    await expect(dialog(page)).toHaveCount(0);
    expect((await builderEditSnapshot(id)).publishedAt).toBeNull();
  });
});
