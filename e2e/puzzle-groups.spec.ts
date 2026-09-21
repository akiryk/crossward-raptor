import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Coord, Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// Other specs seed against the same test database concurrently, so every
// assertion keys on a title unique to this run and on relative order --
// never on absolute positions or on how many puzzles a group holds.
function uniqueTitle(label: string) {
  return `L3 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Every active cell lettered, so the grid survives publishing. */
function filled(cols: number, rows: number, black: Coord[] = []): Grid {
  let grid = createGrid({ cols, rows, black });
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (grid.at(col, row).kind === 'active') {
        grid = withLetter(grid, { col, row }, 'A');
      }
    }
  }
  return grid;
}

/** A fully active 5x5 has 1,6,7,8,9 across and 1,2,3,4,5 down. */
const MINI_HINTS: Record<string, string> = Object.fromEntries(
  [
    '1-across',
    '6-across',
    '7-across',
    '8-across',
    '9-across',
    '1-down',
    '2-down',
    '3-down',
    '4-down',
    '5-down',
  ].map((key) => [key, `Clue for ${key}`])
);

const group = (page: Page, size: string) =>
  page.locator(`[data-testid="puzzle-group"][data-size="${size}"]`);

const row = (page: Page, title: string) =>
  page.locator('[data-testid="puzzle-list-item"]', { hasText: title });

async function seedBlank(cols: number, rows: number, title: string) {
  return seedPuzzle({ grid: createGrid({ cols, rows }), hints: {}, phase: 'grid' }, title);
}

async function publish(page: Page, id: string) {
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  await page.locator('[data-testid="step"][data-step-id="publish"]').click();
  await page.getByTestId('publish-button').click();
  await expect(page.getByTestId('unpublish-button')).toBeVisible();
}

test.describe('L3-2 grouped library', () => {
  test('a mini puzzle sits in the mini group, headed by its size', async ({ page }) => {
    const title = uniqueTitle('mini');
    await seedBlank(5, 5, title);
    await page.goto('/puzzles');

    const mini = group(page, 'mini');
    await expect(mini.getByTestId('puzzle-group-heading')).toHaveText('Mini');
    await expect(mini.getByTestId('puzzle-group-dimensions')).toHaveText('5 \u00d7 5');
    await expect(mini.locator('[data-testid="puzzle-list-item"]', { hasText: title })).toHaveCount(
      1
    );
  });

  test('a daily puzzle sits in the daily group, headed by its size', async ({ page }) => {
    const title = uniqueTitle('daily');
    await seedBlank(15, 15, title);
    await page.goto('/puzzles');

    const daily = group(page, 'daily');
    await expect(daily.getByTestId('puzzle-group-heading')).toHaveText('Daily');
    await expect(daily.getByTestId('puzzle-group-dimensions')).toHaveText('15 \u00d7 15');
    await expect(daily.locator('[data-testid="puzzle-list-item"]', { hasText: title })).toHaveCount(
      1
    );
  });

  test('smaller sizes come before larger ones', async ({ page }) => {
    await seedBlank(5, 5, uniqueTitle('order-mini'));
    await seedBlank(15, 15, uniqueTitle('order-daily'));
    await page.goto('/puzzles');

    const sizes = await page
      .getByTestId('puzzle-group')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-size')));

    expect(sizes.indexOf('mini')).toBeGreaterThan(-1);
    expect(sizes.indexOf('daily')).toBeGreaterThan(sizes.indexOf('mini'));
  });

  test('a grid matching no standard size lands in other sizes, last', async ({ page }) => {
    const title = uniqueTitle('other');
    await seedBlank(3, 3, title);
    await page.goto('/puzzles');

    const other = group(page, 'other');
    await expect(other.getByTestId('puzzle-group-heading')).toHaveText('Other sizes');
    await expect(other.locator('[data-testid="puzzle-list-item"]', { hasText: title })).toHaveCount(
      1
    );

    const sizes = await page
      .getByTestId('puzzle-group')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-size')));
    expect(sizes[sizes.length - 1]).toBe('other');
  });

  test('work in progress sits above a published puzzle, even a newer one', async ({ page }) => {
    const inProgress = uniqueTitle('inprogress');
    const published = uniqueTitle('published');

    await seedBlank(5, 5, inProgress);
    // seeded second, then published, so it is the more recently updated
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const { id } = await seedPuzzle(
      { grid: filled(5, 5), hints: MINI_HINTS, phase: 'hints' },
      published
    );
    await publish(page, id);

    await page.goto('/puzzles');

    const titles = await group(page, 'mini')
      .getByTestId('puzzle-list-item')
      .allTextContents();
    const inProgressIndex = titles.findIndex((t) => t.includes(inProgress));
    const publishedIndex = titles.findIndex((t) => t.includes(published));

    expect(inProgressIndex).toBeGreaterThan(-1);
    expect(publishedIndex).toBeGreaterThan(-1);
    expect(inProgressIndex).toBeLessThan(publishedIndex);
  });

  test('the thumbnail draws the puzzle\'s actual black squares', async ({ page }) => {
    const title = uniqueTitle('thumb');
    await seedPuzzle(
      {
        grid: createGrid({
          cols: 5,
          rows: 5,
          black: [
            { col: 0, row: 0 },
            { col: 4, row: 4 },
          ],
        }),
        hints: {},
        phase: 'grid',
      },
      title
    );
    await page.goto('/puzzles');

    const thumbnail = row(page, title).getByTestId('puzzle-thumbnail');
    await expect(thumbnail).toBeVisible();

    const cells = thumbnail.locator('[data-black]');
    await expect(cells).toHaveCount(25);
    await expect(thumbnail.locator('[data-black="true"]')).toHaveCount(2);
  });

  test('edit sits beside its title, not across the window', async ({ page }) => {
    await page.setViewportSize({ width: 2400, height: 900 });
    const title = uniqueTitle('measure');
    await seedBlank(15, 15, title);
    await page.goto('/puzzles');

    const item = row(page, title);
    const titleBox = await item.getByTestId('puzzle-list-title').boundingBox();
    const editBox = await item.getByTestId('puzzle-edit-link').boundingBox();

    expect(titleBox).not.toBeNull();
    expect(editBox).not.toBeNull();
    // max-w-3xl is 768px; anything beyond ~900px means the row is
    // spanning the window again
    expect(editBox!.x + editBox!.width - titleBox!.x).toBeLessThan(900);
  });
});
