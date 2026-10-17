import { test, expect } from '@playwright/test';
import { createBlankPuzzle } from '../src/lib/puzzle-storage';
import { seedPuzzle } from './helpers/seed-puzzle';
import { currentBuilderId, readPuzzleBuilderId, seedOtherBuilder } from './helpers/ownership';
import { waitForEditorReady, waitForNewPuzzleReady } from './helpers/wait-for-ready';

function title(label: string) {
  return `O1 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test('O1 UI creation records the actual signed-in builder', async ({ page }) => {
  const builderId = await currentBuilderId(page);
  await page.goto('/puzzles');
  await waitForNewPuzzleReady(page);
  await page.getByTestId('new-puzzle-button').click();
  await page.getByTestId('new-puzzle-name').fill(title('created'));
  await page.locator('[data-testid="new-puzzle-size"] [data-size="mini"]').click();
  await page.getByTestId('new-puzzle-create').click();
  await page.waitForURL(/\/puzzles\/[^/]+$/);
  await waitForEditorReady(page);

  const id = new URL(page.url()).pathname.split('/').at(-1)!;
  expect(await readPuzzleBuilderId(id)).toBe(builderId);
  await expect(page.getByTestId('grid-cell')).toHaveCount(25);
});

test('O1 default puzzle fixtures belong to the suite authenticated user', async ({ page }) => {
  const builderId = await currentBuilderId(page);
  const seeded = await seedPuzzle(createBlankPuzzle('mini'), title('default fixture'));

  expect(await readPuzzleBuilderId(seeded.id)).toBe(builderId);
  await page.goto(`/puzzles/${seeded.id}`);
  await waitForEditorReady(page);
});

test('O1 explicit fixture builders are retained and the library remains unfiltered', async ({ page }) => {
  const current = await currentBuilderId(page);
  const other = await seedOtherBuilder();
  expect(other).not.toBe(current);
  const otherTitle = title('other builder');
  const seeded = await seedPuzzle(createBlankPuzzle('mini'), otherTitle, other);

  expect(await readPuzzleBuilderId(seeded.id)).toBe(other);
  await page.goto('/puzzles');
  await expect(page.getByTestId('puzzle-list')).toContainText(otherTitle);
});
