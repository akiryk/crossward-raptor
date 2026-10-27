import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

function tokenValue(page: Page, name: string) {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name
  );
}

/** Resolves a CSS length token (e.g. "1.75rem") to the px value the browser reports. */
function asPx(page: Page, raw: string) {
  return page.evaluate((value) => {
    const probe = document.createElement('div');
    probe.style.fontSize = value;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).fontSize;
    probe.remove();
    return resolved;
  }, raw);
}

function fontSizeOf(locator: ReturnType<Page['locator']>) {
  return locator.evaluate((el) => getComputedStyle(el).fontSize);
}

/**
 *   C A T
 *   A . .
 *   T . .
 */
function letteredGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3 });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  grid = withLetter(grid, { col: 0, row: 1 }, 'A');
  grid = withLetter(grid, { col: 0, row: 2 }, 'T');
  return grid;
}

// --- D9-1: tokens ---
test.describe('D9-1 type tokens', () => {
  test('the scale resolves and the old eyebrow token is gone', async ({ page }) => {
    await page.goto('/puzzles');

    // 14-S8 deleted the old type and weight tokens; e2e/old-tokens.spec.ts
    // checks they're gone. The label style remains.
    for (const token of ['--text-label']) {
      expect(await tokenValue(page, token), `expected ${token}`).not.toBe('');
    }

    expect(await tokenValue(page, '--text-eyebrow')).toBe('');
  });
});

// --- D9-3: the app reads the scale ---
// 14-S2 retired "the page heading uses the headline size and bold weight",
// "a list row uses the body size" and "the app reads the token rather than a
// copied value": the library now uses the redesign's text styles
// (e2e/puzzle-library.spec.ts). The old-token checks elsewhere stay for S8.
test.describe('D9-3 the app uses the type scale', () => {
  // 14-S5 retired "help text uses the help size and secondary ink": its
  // stand-in, the geometry-locked message, is gone, and no help text is left.

  test('a hint-row label uses the label size', async ({ page }) => {
    const { id } = await seedPuzzle({ grid: letteredGrid(), hints: {}, phase: 'hints' });
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const row = page.getByTestId('hint-row').first();
    await expect(row).toBeVisible();

    // the key label sits alongside the input; find the element carrying the
    // label text rather than the row wrapper or the input itself
    const label = row.locator('[data-testid="hint-label"]');
    await expect(label).toBeVisible();

    expect(await fontSizeOf(label)).toBe(
      await asPx(page, await tokenValue(page, '--text-label'))
    );
  });
});
