import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { currentBuilderId } from './helpers/ownership';
import { playPuzzleFixture, seedPlayPuzzle } from './helpers/play-route';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// 26-S2: scan every background so unexpected pale cells fail too.
// Colors are literal acceptance values. Do not change after freeze.
test.use({ viewport: { width: 1440, height: 900 } });
const PALE = 'rgb(232, 247, 255)'; // #E8F7FF
const BLUE = 'rgb(207, 238, 255)'; // #CFEEFF
const YELLOW = 'rgb(252, 255, 77)'; // #FCFF4D
const LINKED = 'With 1-Across, x';
const cell = (page: Page, coord: string) => page.locator(`[data-testid="grid-cell"][data-coord="${coord}"]`);
const input = (page: Page, key: string) => page.locator(`[data-hint-key="${key}"]`).getByTestId('hint-input');
const clue = (page: Page, key: string) => page.locator(`[data-testid="play-clue"][data-clue-key="${key}"]`);

function fixture() {
  const base = playPuzzleFixture();
  // CAT / A#A / TEN: 1A top, 3A bottom, 1D left, 2D right.
  return { ...base, hints: { ...base.hints, '1-down': LINKED, '2-down': 'With 3-Across, x' } };
}

async function openBuilder(page: Page, phase: 'grid' | 'hints' = 'hints') {
  const { id } = await seedPuzzle({ ...fixture(), phase });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
}

async function openPlay(page: Page) {
  const { id } = await seedPlayPuzzle({ builderId: await currentBuilderId(page), puzzle: fixture() });
  await page.goto(`/puzzles/${id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
}

async function expectLinked(page: Page, coords: string[]) {
  await expect.poll(() => page.getByTestId('grid-cell').evaluateAll(
    (cells, pale) => cells.filter((el) => getComputedStyle(el).backgroundColor === pale)
      .map((el) => el.getAttribute('data-coord')).sort(), PALE,
  )).toEqual([...coords].sort());
  const marked = page.locator('[data-testid="grid-cell"][data-linked="true"]');
  expect(await marked.evaluateAll((cells) => cells.map((el) => el.getAttribute('data-coord')).sort()))
    .toEqual([...coords].sort());
  for (const coord of coords) {
    await expect(cell(page, coord)).not.toHaveAttribute('data-highlight', /.+/);
  }
}

async function expectDownSelection(page: Page, hintFocused = false) {
  await expect(cell(page, '0,0')).toHaveAttribute('data-highlight', 'selected');
  await expect(cell(page, '0,0')).toHaveCSS('background-color', hintFocused ? BLUE : YELLOW);
  for (const coord of ['0,1', '0,2']) {
    await expect(cell(page, coord)).toHaveAttribute('data-highlight', 'slot');
    await expect(cell(page, coord)).toHaveCSS('background-color', BLUE);
  }
}

async function builderDown(page: Page) {
  await input(page, '1-down').click();
  // Enter the grid at another cell so clicking the current cell does not
  // toggle its direction, then move back to the crossing.
  await cell(page, '0,1').click();
  await page.keyboard.press('ArrowUp');
  await expectDownSelection(page);
}

test('26-S2-2 builder: linked entry, crossing precedence and unchanged letters/states', async ({ page }) => {
  await openBuilder(page);
  await builderDown(page);
  await expectLinked(page, ['1,0', '2,0']);
  await expectDownSelection(page);
  for (const [coord, letter] of [['1,0', 'A'], ['2,0', 'T']]) {
    await expect(cell(page, coord)).toHaveAttribute('data-cell-state', 'locked-letter');
    await expect(cell(page, coord)).toContainText(letter);
    await expect(cell(page, coord).locator('div').first()).toHaveCSS('color', 'rgb(0, 0, 0)');
  }
  // Same reference with a focused hint, including Lock Grid Letters.
  await input(page, '1-down').click();
  await expectLinked(page, ['1,0', '2,0']);
  await expectDownSelection(page, true);
  await page.getByTestId('lock-letters-toggle').click();
  await input(page, '1-down').click();
  await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'hints-locked');
  await expectLinked(page, ['1,0', '2,0']);
  await expectDownSelection(page, true);
});

test('26-S2-3 builder: moving to ordinary and another linked clue moves the fill', async ({ page }) => {
  await openBuilder(page);
  await input(page, '1-down').click();
  await expectLinked(page, ['1,0', '2,0']);
  await page.keyboard.press('Tab');
  await expect(input(page, '2-down')).toBeFocused();
  await expectLinked(page, ['0,2', '1,2']);
  await input(page, '3-across').click();
  await expectLinked(page, []);
});

test('26-S2-4 builder: editing a valid reference to 82 and back updates immediately', async ({ page }) => {
  await openBuilder(page);
  const field = input(page, '1-down');
  await field.click();
  await expectLinked(page, ['1,0', '2,0']);
  await field.fill('With 82-Across, x');
  await expectLinked(page, []);
  await field.fill(LINKED);
  await expectLinked(page, ['1,0', '2,0']);
  await expectDownSelection(page, true);
});

test('26-S2-5 play: word and clue selection move the highlight without changing current colors', async ({ page }) => {
  await openPlay(page);
  // First click on the already selected origin switches to Down.
  await cell(page, '0,0').click();
  await expectDownSelection(page);
  await expectLinked(page, ['1,0', '2,0']);
  for (const coord of ['1,0', '2,0']) {
    await expect(cell(page, coord)).toHaveAttribute('data-cell-state', 'letter');
  }
  await cell(page, '1,2').click();
  await expectLinked(page, []);
  await clue(page, '1-down').click();
  await expectLinked(page, ['1,0', '2,0']);
  await expectDownSelection(page);
  await clue(page, '3-across').click();
  await expectLinked(page, []);
  await clue(page, '1-down').click();
  await expectLinked(page, ['1,0', '2,0']);
  await page.getByTestId('play-title').click();
  await expectLinked(page, []);
});

test('26-S2-6 none: build and Preview keep their behavior; focus elsewhere clears linked cells', async ({ page }) => {
  await openBuilder(page, 'grid');
  await cell(page, '1,0').click();
  await expect(page.locator('[data-linked="true"]')).toHaveCount(0);
  await expect.poll(() => page.getByTestId('grid-cell').evaluateAll(
    (cells, pale) => cells.filter((el) => getComputedStyle(el).backgroundColor === pale)
      .map((el) => el.getAttribute('data-coord')).sort(), PALE,
  )).toEqual(['0,2', '1,2', '2,2']);
  await page.getByTestId('preview-toggle').click();
  await expectLinked(page, []);

  await openBuilder(page);
  await input(page, '1-down').click();
  await expectLinked(page, ['1,0', '2,0']);
  await page.getByRole('heading', { name: 'Across', exact: true }).click();
  await expectLinked(page, []);
});
