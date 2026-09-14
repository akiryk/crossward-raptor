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

async function openPublishStep(page: Page, id: string) {
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  await page.locator('[data-testid="step"][data-step-id="publish"]').click();
}

async function seedReady(hints: Record<string, string> = ALL_HINTS) {
  return seedPuzzle({
    grid: fillAll(createGrid({ cols: 3, rows: 3 })),
    hints,
    phase: 'hints',
  });
}

// --- PB3-2: publishing ---
test.describe('PB3-2 publish and unpublish', () => {
  test('an unpublished puzzle offers publishing, private by default', async ({ page }) => {
    const { id } = await seedReady();
    await openPublishStep(page, id);

    await expect(page.getByTestId('publish-button')).toBeVisible();
    await expect(page.getByTestId('private-checkbox')).toBeChecked();
    await expect(page.getByTestId('unpublish-button')).toHaveCount(0);

    const state = page.getByTestId('publish-state');
    await expect(state).toBeVisible();
    expect((await state.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
  });

  test('publishing with the box checked stores it private', async ({ page }) => {
    const { id } = await seedReady();
    await openPublishStep(page, id);

    await page.getByTestId('publish-button').click();

    const state = page.getByTestId('publish-state');
    await expect(state).toContainText(/published/i);
    await expect(state).toContainText(/private/i);

    await expect(page.getByTestId('publish-button')).toHaveCount(0);
    await expect(page.getByTestId('private-checkbox')).toHaveCount(0);
    await expect(page.getByTestId('unpublish-button')).toBeVisible();
  });

  test('the published state survives a reload', async ({ page }) => {
    const { id } = await seedReady();
    await openPublishStep(page, id);
    await page.getByTestId('publish-button').click();
    await expect(page.getByTestId('publish-state')).toContainText(/private/i);

    await page.reload();
    await waitForEditorReady(page);
    await page.locator('[data-testid="step"][data-step-id="publish"]').click();

    await expect(page.getByTestId('publish-state')).toContainText(/private/i);
    await expect(page.getByTestId('unpublish-button')).toBeVisible();
  });

  test('unchecking the box publishes it public', async ({ page }) => {
    const { id } = await seedReady();
    await openPublishStep(page, id);

    await page.getByTestId('private-checkbox').uncheck();
    await page.getByTestId('publish-button').click();

    await expect(page.getByTestId('publish-state')).toContainText(/public/i);
  });

  test('unpublishing returns it to the unpublished state, and that persists', async ({
    page,
  }) => {
    const { id } = await seedReady();
    await openPublishStep(page, id);
    await page.getByTestId('publish-button').click();
    await expect(page.getByTestId('unpublish-button')).toBeVisible();

    await page.getByTestId('unpublish-button').click();

    await expect(page.getByTestId('publish-button')).toBeVisible();
    await expect(page.getByTestId('private-checkbox')).toBeChecked();

    await page.reload();
    await waitForEditorReady(page);
    await page.locator('[data-testid="step"][data-step-id="publish"]').click();

    await expect(page.getByTestId('publish-button')).toBeVisible();
    await expect(page.getByTestId('unpublish-button')).toHaveCount(0);
  });

  test('a grid-phase puzzle cannot be published', async ({ page }) => {
    const { id } = await seedPuzzle({
      grid: fillAll(createGrid({ cols: 3, rows: 3 })),
      hints: {},
      phase: 'grid',
    });
    await openPublishStep(page, id);

    await expect(
      page.locator('[data-testid="step"][data-step-id="publish"]')
    ).toHaveAttribute('data-step-status', 'unavailable');
    await expect(page.getByTestId('publish-button')).toHaveCount(0);
  });

  test('outstanding readiness findings do not block publishing', async ({ page }) => {
    // no hints authored at all -- the panel will report it
    const { id } = await seedReady({});
    await openPublishStep(page, id);

    await expect(
      page.locator('[data-testid="finding"][data-finding-kind="unwritten-hints"]')
    ).toBeVisible();

    await page.getByTestId('publish-button').click();

    await expect(page.getByTestId('publish-state')).toContainText(/published/i);
  });
});
