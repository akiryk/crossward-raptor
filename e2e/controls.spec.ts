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

    // 14-S4: Clear all letters and Delete are gone; the unselected numbered
    // buttons stand in.
    for (const testid of ['hints', 'publish']) {
      const button = page.locator(`[data-testid="builder-steps"] [data-step-id="${testid}"]`);
      const cursor = await button.evaluate((el) => getComputedStyle(el).cursor);
      const bg = await button.evaluate((el) => getComputedStyle(el).backgroundColor);

      expect(cursor, `${testid} cursor`).toBe('pointer');
      expect(TRANSPARENT, `${testid} background`).not.toContain(bg);
    }
  });

  test('hovering the new-puzzle button changes its background', async ({ page }) => {
    await page.goto('/puzzles');

    const button = page.getByTestId('new-puzzle-button');
    const before = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
    await button.hover();
    // Buttons change color over a short transition (story F6's correction,
    // 2026-10-24), so read the settled background.
    const after = await button.evaluate(async (el) => {
      for (let i = 0; i < 10 && el.getAnimations().length > 0; i++) {
        await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined)));
      }
      return getComputedStyle(el).backgroundColor;
    });

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

  // Retargeted (Story L2b): the row itself is no longer the interactive
  // element -- each row now carries an explicit Edit link, and the row
  // is inert. What D2 was protecting is that the list's interactive
  // element looks and behaves interactive; only which element that is
  // has moved.
  test('the list\'s edit control is interactive and responds to hover', async ({ page }) => {
    await seedForControls();
    await page.goto('/puzzles');

    // 14-S2: the link covers its Puzzle Row, and the row shows the hover.
    const item = page
      .getByTestId('puzzle-list-item')
      .filter({ has: page.getByTestId('puzzle-edit-link') })
      .first();
    const edit = item.getByTestId('puzzle-edit-link');
    expect(await edit.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');

    await page.mouse.move(0, 0);
    const before = await styleOf(item, ['background-color']);
    await edit.hover();
    await expect.poll(() => styleOf(item, ['background-color'])).not.toBe(before);
  });
});

// --- D2-3: inputs ---
test.describe('D2-3 inputs', () => {
  // Superseded (visual-polish-02): the title now reads as a page heading,
  // not a form field, until interacted with -- no visible border by
  // default, one on hover, and the normal input look on focus. See
  // docs/handoffs/06-HANDOFF-visual-polish.md.
  test('the title input has no border by default, gets one on hover, and has an accessible name', async ({
    page,
  }) => {
    const { id } = await seedForControls();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    const title = page.getByTestId('puzzle-title');
    const borderColor = await title.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(TRANSPARENT).toContain(borderColor);

    await title.hover();
    const hoveredColor = await title.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(TRANSPARENT).not.toContain(hoveredColor);

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
    // Checked per-edge rather than on border-top alone: since Story H3 the
    // hint input uses TextInput's 'underline' variant, which carries its
    // rule on the bottom edge only. What D2 was protecting is that the
    // affordance is visible by default rather than hover-only (see
    // TextInput's own comment), not which edge carries it -- so this
    // asserts at least one edge has a non-zero, non-transparent border,
    // which still fails if the border disappears or goes invisible.
    const edges = await input.evaluate((el) => {
      const s = getComputedStyle(el);
      return (['top', 'right', 'bottom', 'left'] as const).map((side) => ({
        width: s.getPropertyValue(`border-${side}-width`),
        color: s.getPropertyValue(`border-${side}-color`),
      }));
    });

    const visible = edges.filter(
      (edge) => edge.width !== '0px' && !TRANSPARENT.includes(edge.color)
    );
    expect(visible.length).toBeGreaterThan(0);

    const name = await input.evaluate((el) => el.getAttribute('aria-label') ?? '');
    expect(name.length).toBeGreaterThan(0);
  });
});

// --- D2-4: retired by 14-S4 (the builder's Delete, Clear all letters and
// editor-actions row are removed) ---
