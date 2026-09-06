import { test, expect } from '@playwright/test';
import { createGrid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';

// Other spec files seed against the same test database concurrently, so every
// assertion here keys on a title unique to this run and on relative ordering --
// never on absolute list positions or counts.
function uniqueTitle(label: string) {
  return `M3 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const ALL_KEYS = ['1-across', '4-across', '5-across', '1-down', '2-down', '3-down'];

function allHints(): Record<string, string> {
  return Object.fromEntries(ALL_KEYS.map((key) => [key, `Clue for ${key}`]));
}

function row(page: import('@playwright/test').Page, title: string) {
  return page.locator('[data-testid="puzzle-list-item"]', { hasText: title });
}

// --- M3-2: list metadata ---
test.describe('M3-2 list metadata', () => {
  test('a grid-phase puzzle shows its phase and no hint-completeness text', async ({
    page,
  }) => {
    const title = uniqueTitle('gridphase');
    await seedPuzzle(
      { grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' },
      title
    );

    await page.goto('/puzzles');

    const item = row(page, title);
    await expect(item).toHaveAttribute('data-phase', 'grid');
    await expect(item).toContainText('Grid');
    await expect(item).not.toContainText('Hints');
  });

  test('a hints-phase puzzle with all hints authored reads as complete', async ({ page }) => {
    const title = uniqueTitle('complete');
    await seedPuzzle(
      { grid: createGrid({ cols: 3, rows: 3 }), hints: allHints(), phase: 'hints' },
      title
    );

    await page.goto('/puzzles');

    const item = row(page, title);
    await expect(item).toHaveAttribute('data-phase', 'hints');
    await expect(item).toHaveAttribute('data-hints-complete', 'true');
    await expect(item).toContainText('complete');
  });

  test('a hints-phase puzzle with a blank hint reads as incomplete', async ({ page }) => {
    const title = uniqueTitle('incomplete');
    const hints = { ...allHints(), '2-down': '' };
    await seedPuzzle(
      { grid: createGrid({ cols: 3, rows: 3 }), hints, phase: 'hints' },
      title
    );

    await page.goto('/puzzles');

    const item = row(page, title);
    await expect(item).toHaveAttribute('data-hints-complete', 'false');
    await expect(item).toContainText('incomplete');
  });

  test('every row carries a non-empty updated-at timestamp', async ({ page }) => {
    const title = uniqueTitle('timestamp');
    await seedPuzzle(
      { grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' },
      title
    );

    await page.goto('/puzzles');

    const updatedAt = await row(page, title).getAttribute('data-updated-at');
    expect(updatedAt).toBeTruthy();
    expect(Number.isNaN(Date.parse(updatedAt ?? ''))).toBe(false);
  });

  test('a more recently created puzzle appears before an older one', async ({ page }) => {
    const olderTitle = uniqueTitle('older');
    const newerTitle = uniqueTitle('newer');

    await seedPuzzle(
      { grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' },
      olderTitle
    );
    // ensure a distinct updatedAt rather than relying on insert order
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await seedPuzzle(
      { grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' },
      newerTitle
    );

    await page.goto('/puzzles');

    const titles = await page.getByTestId('puzzle-list-item').allTextContents();
    const olderIndex = titles.findIndex((text) => text.includes(olderTitle));
    const newerIndex = titles.findIndex((text) => text.includes(newerTitle));

    expect(olderIndex).toBeGreaterThan(-1);
    expect(newerIndex).toBeGreaterThan(-1);
    expect(newerIndex).toBeLessThan(olderIndex);
  });
});
