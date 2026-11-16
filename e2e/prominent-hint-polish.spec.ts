import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { currentBuilderId } from './helpers/ownership';
import { playPuzzleFixture, seedPlayPuzzle } from './helpers/play-route';

// FROZEN 17-S13 acceptance, human approved 2026-11-15. Ordinary assertions
// deliberately discriminate current prefix/empty-fill behavior. S12 owns
// title-to-hint spacing; these tests do not depend on that implementation.
const BLUE = 'rgb(207, 238, 255)';
const FAINT = 'rgb(241, 248, 252)';
const PRIMARY = 'rgb(0, 0, 0)';
const bar = (page: Page) => page.getByTestId('prominent-hint').filter({ visible: true });
const clue = (page: Page, key: string) => page.locator(`[data-testid="play-clue"][data-clue-key="${key}"]`);
const cell = (page: Page, coord: string) => page.locator(`[data-testid="grid-cell"][data-coord="${coord}"]`);

async function rect(locator: Locator) {
  const result = await locator.boundingBox();
  expect(result, 'rendered geometry').not.toBeNull();
  return result!;
}

async function openPlay(page: Page, hints: Record<string, string> = {}) {
  const base = playPuzzleFixture();
  const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page),
    puzzle: { ...base, hints: { ...base.hints, ...hints } } });
  await page.goto(`/puzzles/${fixture.id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
  await expect(page.getByTestId('play-grid-region')).toBeFocused();
  return fixture;
}

async function hintOnly(page: Page, value: string) {
  await expect(bar(page)).toHaveText(value);
  await expect(bar(page).getByTestId('prominent-hint-label')).toHaveCount(0);
  const text = bar(page).getByTestId('prominent-hint-text');
  expect(await text.textContent(), 'verbatim authored text').toBe(value);
  await expect(text).toHaveCSS('font-size', '18px');
  await expect(text).toHaveCSS('line-height', '24px');
  await expect(text).toHaveCSS('font-weight', '600');
  await expect(text).toHaveCSS('color', PRIMARY);
  expect(await text.evaluate((el) => el.childElementCount), 'plain text').toBe(0);
  const left = await text.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect().left;
  });
  expect(Math.abs(left - (await rect(bar(page))).x - 16), 'no label column').toBeLessThanOrEqual(1);
}

async function frame(page: Page) {
  const b = await rect(bar(page));
  const g = await rect(page.getByTestId('puzzle-grid'));
  expect(Math.abs(b.width - g.width), 'grid width').toBeLessThanOrEqual(1);
  expect(Math.abs(b.x - g.x), 'grid left edge').toBeLessThanOrEqual(1);
  expect(Math.abs(g.y - b.y - b.height - 16), 'hint to grid').toBeLessThanOrEqual(1);
  await expect(bar(page)).toHaveCSS('padding', '12px 16px');
  await expect(bar(page)).toHaveCSS('border-top-left-radius', '10px');
  await expect(bar(page)).toHaveCSS('min-height', '52px');
  return { bar: b, grid: g };
}

async function linkedCells(page: Page, coords: string[]) {
  await expect.poll(() => page.getByTestId('grid-cell').evaluateAll((cells) => cells
    .filter((el) => getComputedStyle(el).backgroundColor === 'rgb(232, 247, 255)')
    .map((el) => el.getAttribute('data-coord')).sort())).toEqual([...coords].sort());
}

test.describe('17-S13 wide Prominent Hint', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('17-S13-1 opening, Across and Down show full hint alone; other numbering remains', async ({ page }) => {
    await openPlay(page);
    await hintOnly(page, 'Feline');
    await expect(bar(page)).toHaveCSS('background-color', BLUE);
    await expect(cell(page, '0,0')).toHaveAttribute('data-selected', 'true');
    await expect(cell(page, '0,0')).toHaveCSS('background-color', 'rgb(252, 255, 77)');
    await expect(cell(page, '1,0')).toHaveCSS('background-color', BLUE);
    for (const [key, number] of [['1-across', '1'], ['3-across', '3'], ['1-down', '1'], ['2-down', '2']]) {
      await expect(clue(page, key).getByTestId('play-clue-number')).toHaveText(number);
    }
    await expect(cell(page, '0,0').getByTestId('cell-number')).toHaveText('1');
    await page.keyboard.press('Space');
    await hintOnly(page, 'A pet that purrs');
    await expect(clue(page, '1-down')).toHaveCSS('background-color', BLUE);
    await clue(page, '3-across').click();
    await hintOnly(page, 'Twice five');
    await expect(page.getByTestId('play-grid-region')).toBeFocused();
    await expect(cell(page, '0,2')).toHaveAttribute('data-selected', 'true');
  });

  test('17-S13-2 blur is faint and stable; refocus restores the blue hint', async ({ page }) => {
    await openPlay(page);
    const before = await frame(page);
    expect(before.bar.height).toBe(52);
    await page.getByTestId('play-title').click();
    await expect(bar(page)).toHaveText('');
    await expect(bar(page)).toHaveCSS('background-color', FAINT);
    const after = await frame(page);
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(Math.abs(after.bar[key] - before.bar[key]), `bar ${key}`).toBeLessThanOrEqual(1);
      expect(Math.abs(after.grid[key] - before.grid[key]), `grid ${key}`).toBeLessThanOrEqual(1);
    }
    await page.getByTestId('play-grid-region').focus();
    await hintOnly(page, 'Feline');
    await expect(bar(page)).toHaveCSS('background-color', BLUE);
    expect(Math.abs((await rect(page.getByTestId('puzzle-grid'))).y - before.grid.y)).toBeLessThanOrEqual(1);
  });

  for (const [kind, value] of [['empty', ''], ['whitespace', ' \t  ']]) {
    test(`17-S13-3 selected ${kind} hint is faint and keeps the short bar`, async ({ page }) => {
      await openPlay(page, { '1-across': value });
      await expect(cell(page, '0,0')).toHaveAttribute('data-selected', 'true');
      await expect(bar(page)).toHaveText('');
      await expect(bar(page).getByTestId('prominent-hint-label')).toHaveCount(0);
      await expect(bar(page)).toHaveCSS('background-color', FAINT);
      expect((await frame(page)).bar.height).toBe(52);
      await page.keyboard.press('Space');
      await hintOnly(page, 'A pet that purrs');
      await expect(bar(page)).toHaveCSS('background-color', BLUE);
    });
  }

  test('17-S13-3 long authored hint wraps with all released width, without clipping', async ({ page }) => {
    const value = '  12 musicians, with 1-Down: ' + 'a long authored hint with every word preserved, '.repeat(9) + 'the end  ';
    await openPlay(page, { '1-across': value });
    // Leading authored whitespace belongs in textContent. CSS collapses it
    // normally; the text box still starts at the original 16px padding.
    const text = bar(page).getByTestId('prominent-hint-text');
    expect(await text.textContent()).toBe(value);
    await expect(bar(page).getByTestId('prominent-hint-label')).toHaveCount(0);
    await expect(bar(page)).toHaveCSS('background-color', BLUE);
    const b = (await frame(page)).bar;
    const t = await rect(text);
    expect(b.height).toBeGreaterThan(52);
    expect(Math.abs(t.x - b.x - 16)).toBeLessThanOrEqual(1);
    expect(Math.abs(t.width - (b.width - 32)), 'released label width').toBeLessThanOrEqual(1);
    expect(t.y).toBeGreaterThanOrEqual(b.y + 12);
    expect(t.y + t.height).toBeLessThanOrEqual(b.y + b.height - 11);
    expect(await text.evaluate((el) => el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    await expect(text).toHaveCSS('text-overflow', 'clip');
    await expect(text).toHaveCSS('white-space', 'normal');
    await expect(text).toHaveCSS('font-size', '18px');
  });

  test('17-S13-4 numeric and With/See text stays plain; linked cells and list rows remain', async ({ page }) => {
    await openPlay(page, { '1-across': 'With 1-Down, 12 musicians', '1-down': 'See 1-Across' });
    await hintOnly(page, 'With 1-Down, 12 musicians');
    await linkedCells(page, ['0,1', '0,2']);
    await expect(clue(page, '1-across')).toHaveCSS('background-color', BLUE);
    await expect(clue(page, '1-down')).toHaveCSS('background-color', 'rgb(232, 247, 255)');
    await clue(page, '1-down').click();
    await hintOnly(page, 'See 1-Across');
    await linkedCells(page, ['1,0', '2,0']);
    await expect(clue(page, '1-down')).toHaveCSS('background-color', BLUE);
    await expect(clue(page, '1-across')).toHaveCSS('background-color', 'rgb(232, 247, 255)');
    await expect(clue(page, '1-across').getByTestId('play-clue-number')).toHaveText('1');
    await expect(page.getByTestId('linked-clue-with')).toHaveCount(0);
  });
});

test('17-S13-4 390px keeps the narrow hint bar and word navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openPlay(page, { '1-across': 'With 1-Down, 12 musicians', '1-down': 'See 1-Across' });
  await expect(bar(page)).toHaveCount(0);
  const narrow = page.getByTestId('play-hint-bar');
  const text = narrow.getByTestId('play-hint-bar-text');
  await expect(text).toHaveText('With 1-Down, 12 musicians');
  await expect(narrow).toHaveCSS('background-color', BLUE);
  await expect(narrow.getByTestId('prominent-hint-label')).toHaveCount(0);
  await narrow.getByRole('button', { name: 'Next word' }).click();
  await expect(text).toHaveText('Twice five');
  await narrow.getByRole('button', { name: 'Next word' }).click();
  await expect(text).toHaveText('See 1-Across');
  await linkedCells(page, ['1,0', '2,0']);
  await narrow.getByRole('button', { name: 'Previous word' }).click();
  await expect(text).toHaveText('Twice five');
});

test('17-S13-5 catalog and live palette show populated and empty semantic samples', async ({ page }) => {
  await page.goto('/style-guide');
  const sample = page.getByTestId('sg-grid-play');
  const filled = sample.getByTestId('prominent-hint');
  const selected = sample.locator('[data-testid="play-clue"][data-active="true"]');
  await expect(filled).toHaveText(await selected.getByTestId('play-clue-text').innerText());
  await expect(filled.getByTestId('prominent-hint-label')).toHaveCount(0);
  await expect(filled).toHaveCSS('background-color', BLUE);
  // Proposed public sample hook; runtime sample is intentionally absent today.
  const empty = page.getByTestId('sg-prominent-hint-empty').getByTestId('prominent-hint');
  await expect(empty).toBeVisible();
  await expect(empty).toHaveText('');
  await expect(empty).toHaveCSS('background-color', FAINT);
  const style = page.locator('[data-testid="sg-color-style"][data-style="prominent-hint-empty"]');
  await expect(style).toContainText('interactive-faint');
  await expect(style.getByTestId('sg-swatch')).toHaveCSS('background-color', FAINT);
  await page.evaluate(() => document.documentElement.style.setProperty('--palette-interactive-faint', '#123456'));
  await expect(empty).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await expect(style.getByTestId('sg-swatch')).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await expect(filled).toHaveCSS('background-color', BLUE);
  await expect(selected).toHaveCSS('background-color', BLUE);
  await page.evaluate(() => document.documentElement.style.removeProperty('--palette-interactive-faint'));
  await expect(empty).toHaveCSS('background-color', FAINT);
});
