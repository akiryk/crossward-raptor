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

function asRgb(page: Page, raw: string) {
  return page.evaluate((value) => {
    const probe = document.createElement('div');
    probe.style.color = value;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
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

    for (const token of [
      '--text-headline',
      '--text-body',
      '--text-help',
      '--text-label',
      '--weight-normal',
      '--weight-bold',
    ]) {
      expect(await tokenValue(page, token), `expected ${token}`).not.toBe('');
    }

    expect(await tokenValue(page, '--text-eyebrow')).toBe('');
  });
});

// --- D9-3: the app reads the scale ---
test.describe('D9-3 the app uses the type scale', () => {
  test('the page heading uses the headline size and bold weight', async ({ page }) => {
    await seedPuzzle({ grid: letteredGrid(), hints: {}, phase: 'grid' });
    await page.goto('/puzzles');

    const heading = page.getByTestId('page-heading');
    expect(await fontSizeOf(heading)).toBe(
      await asPx(page, await tokenValue(page, '--text-headline'))
    );

    const weight = await heading.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(weight).toBe((await tokenValue(page, '--weight-bold')).trim());
  });

  test('a list row uses the body size', async ({ page }) => {
    await seedPuzzle({ grid: letteredGrid(), hints: {}, phase: 'grid' });
    await page.goto('/puzzles');

    const row = page.getByTestId('puzzle-list-item').first();
    expect(await fontSizeOf(row)).toBe(
      await asPx(page, await tokenValue(page, '--text-body'))
    );
  });

  test('help text uses the help size and secondary ink', async ({ page }) => {
    const { id } = await seedPuzzle({ grid: letteredGrid(), hints: {}, phase: 'grid' });
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    // clicking an unavailable step reveals its reason -- the canonical help text
    await page.locator('[data-testid="step"][data-step-id="publish"]').click();
    const reason = page.getByTestId('step-reason');
    await expect(reason).toBeVisible();

    expect(await fontSizeOf(reason)).toBe(
      await asPx(page, await tokenValue(page, '--text-help'))
    );

    const color = await reason.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe(await asRgb(page, await tokenValue(page, '--color-ink-2')));
  });

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

  test('the app reads the token rather than a copied value', async ({ page }) => {
    await seedPuzzle({ grid: letteredGrid(), hints: {}, phase: 'grid' });
    await page.goto('/puzzles');

    const row = page.getByTestId('puzzle-list-item').first();
    const before = await fontSizeOf(row);

    await page.evaluate(() =>
      document.documentElement.style.setProperty('--text-body', '2.5rem')
    );

    const after = await fontSizeOf(row);
    expect(after).not.toBe(before);
    expect(after).toBe(await asPx(page, '2.5rem'));
  });
});
