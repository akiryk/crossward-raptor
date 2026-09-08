import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

function uniqueTitle(label: string) {
  return `D2 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 *   C A T
 *   A . .
 *   T . .
 *
 * Letters so the grid survives the hints transition with active cells.
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

async function seedForControls(title = uniqueTitle('controls')) {
  return seedPuzzle({ grid: letteredGrid(), hints: {}, phase: 'grid' }, title);
}

const TRANSPARENT = ['rgba(0, 0, 0, 0)', 'transparent'];

function styleOf(locator: ReturnType<Page['locator']>, props: string[]) {
  return locator.evaluate((el, keys) => {
    const s = getComputedStyle(el);
    return keys.map((k) => s.getPropertyValue(k)).join('|');
  }, props);
}

// --- D2-1: buttons ---
test.describe('D2-1 buttons', () => {
  test('buttons report a pointer cursor and a non-transparent background', async ({ page }) => {
    const { id } = await seedForControls();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    for (const testid of [
      'clear-letters-button',
      'enter-hints-button',
      'delete-puzzle-button',
    ]) {
      const button = page.getByTestId(testid);
      const cursor = await button.evaluate((el) => getComputedStyle(el).cursor);
      const bg = await button.evaluate((el) => getComputedStyle(el).backgroundColor);

      expect(cursor, `${testid} cursor`).toBe('pointer');
      expect(TRANSPARENT, `${testid} background`).not.toContain(bg);
    }
  });

  test('the danger button looks different from the primary button', async ({ page }) => {
    await page.goto('/puzzles');
    const primaryBg = await page
      .getByTestId('new-puzzle-button')
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    const { id } = await seedForControls();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);
    const dangerBg = await page
      .getByTestId('delete-puzzle-button')
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(dangerBg).not.toBe(primaryBg);
  });

  test('hovering the new-puzzle button changes its background', async ({ page }) => {
    await page.goto('/puzzles');

    const button = page.getByTestId('new-puzzle-button');
    const before = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
    await button.hover();
    const after = await button.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(after).not.toBe(before);
  });
});

// --- D2-2: the puzzles list ---
test.describe('D2-2 puzzles list', () => {
  test('the page heading renders as a heading, larger than a list row', async ({ page }) => {
    await seedForControls();
    await page.goto('/puzzles');

    const heading = page.getByTestId('page-heading');
    await expect(heading).toBeVisible();

    const tag = await heading.evaluate((el) => el.tagName.toLowerCase());
    expect(['h1', 'h2']).toContain(tag);

    const headingSize = await heading.evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize)
    );
    const rowSize = await page
      .getByTestId('puzzle-list-item')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    expect(headingSize).toBeGreaterThan(rowSize);
  });

  test('list rows are interactive and respond to hover', async ({ page }) => {
    await seedForControls();
    await page.goto('/puzzles');

    const row = page.getByTestId('puzzle-list-item').first();
    expect(await row.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');

    const before = await styleOf(row, ['background-color', 'color', 'text-decoration-line']);
    await row.hover();
    const after = await styleOf(row, ['background-color', 'color', 'text-decoration-line']);

    expect(after).not.toBe(before);
  });
});

// --- D2-3: inputs ---
test.describe('D2-3 inputs', () => {
  test('the title input has a visible border and an accessible name', async ({ page }) => {
    const { id } = await seedForControls();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const title = page.getByTestId('puzzle-title');
    const border = await title.evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.borderTopWidth, color: s.borderTopColor };
    });

    expect(border.width).not.toBe('0px');
    expect(TRANSPARENT).not.toContain(border.color);

    const name = await title.evaluate(
      (el) => el.getAttribute('aria-label') ?? el.getAttribute('title') ?? ''
    );
    expect(name.length).toBeGreaterThan(0);
  });

  test('focusing the title input changes its appearance', async ({ page }) => {
    const { id } = await seedForControls();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const title = page.getByTestId('puzzle-title');
    const before = await styleOf(title, ['border-top-color', 'box-shadow', 'outline-width']);
    await title.focus();
    const after = await styleOf(title, ['border-top-color', 'box-shadow', 'outline-width']);

    expect(after).not.toBe(before);
  });

  test('hint inputs have visible borders and accessible names', async ({ page }) => {
    const { id } = await seedPuzzle(
      { grid: letteredGrid(), hints: {}, phase: 'hints' },
      uniqueTitle('hints')
    );
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const input = page.getByTestId('hint-input').first();
    const border = await input.evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.borderTopWidth, color: s.borderTopColor };
    });

    expect(border.width).not.toBe('0px');
    expect(TRANSPARENT).not.toContain(border.color);

    const name = await input.evaluate((el) => el.getAttribute('aria-label') ?? '');
    expect(name.length).toBeGreaterThan(0);
  });
});

// --- D2-4: delete is separated ---
test.describe('D2-4 delete separation', () => {
  test('delete lives in a danger zone, apart from the editor controls', async ({ page }) => {
    const { id } = await seedForControls();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const dangerZone = page.getByTestId('danger-zone');
    await expect(dangerZone).toBeVisible();
    await expect(dangerZone.getByTestId('delete-puzzle-button')).toBeVisible();

    const editorActions = page.getByTestId('editor-actions');
    await expect(editorActions).toBeVisible();
    await expect(editorActions.getByTestId('clear-letters-button')).toBeVisible();
    await expect(editorActions.getByTestId('delete-puzzle-button')).toHaveCount(0);
  });

  test('editor controls do not sit flush against each other', async ({ page }) => {
    const { id } = await seedForControls();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const gap = await page.getByTestId('editor-actions').evaluate((el) => {
      const s = getComputedStyle(el);
      return parseFloat(s.columnGap || s.gap || '0');
    });

    expect(gap).toBeGreaterThan(0);
  });
});
