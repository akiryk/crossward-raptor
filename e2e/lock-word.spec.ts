import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { readPuzzleRow } from './helpers/read-puzzle-row';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// Story 21-S2 — lock and unlock a word.
//
// In the build phase with Preview off, a button appears beside a word of 3
// or more letters once the cursor has stayed in it for 3 seconds (21-S16
// amended this from 1 second, and every wait timed against it by 2s; at
// once in a locked word). It is a square 2/3 of a cell, at most 32px, just
// before the first letter: left of it and vertically centered across,
// above it and horizontally centered down (21-S12 amended this from "just
// past the last letter"). Its near corners are square and its far
// corners rounded 4px; gray-500 at rest, gray-700 on hover, with a white
// padlock, open on an unlocked word and closed on a locked one. It's named
// "Lock word" / "Unlock word" and toggles the lock, the grid keeping
// focus. A 1px gray-500 outline goes around the word and its end cells
// (the empty cells just before and after it) while the button shows, and
// always for a locked word. A locked word's end cells have a gray-500
// tick in their top-right corner, its sides 1/4 of the cell, and its
// letters are gray-500. Locks are saved with the puzzle. Preview and the
// hints phase show none of it.
//
// Hooks: the outline is [data-testid="word-outline"], the tick
// [data-testid="lock-tick"], the icon an <svg> in the button with
// data-icon "lock-open" or "lock-closed".
//
// Colors and sizes are the human's values, written out here. Do not edit
// this file to match an implementation.

test.use({ viewport: { width: 1440, height: 1000 } });

const GRAY_500 = 'rgb(139, 144, 154)'; // #8b909a
const GRAY_700 = 'rgb(20, 21, 27)'; // #14151b
const WHITE = 'rgb(255, 255, 255)';
const BLACK = 'rgb(0, 0, 0)'; // text-primary

const run = (from: number, word: string) => [...word].map((_, i) => from + i);
const across = (row: number, cols: number[]) => cols.map((col) => `${col},${row}`);
const down = (col: number, rows: number[]) => rows.map((row) => `${col},${row}`);

/** A daily: TANGENT across row 3 (3–9); ONE down column 5 (2–4), sharing
 *  its N (5,3); AT across row 8 (3–4), 2 letters; ABRAHAM across row 12
 *  (0–6), from the left edge. (Amended by 21-S8: row 11 made TANGENT's
 *  end cell (10,3) Preview-red.) */
function lockGrid(): Grid {
  let grid = createGrid({ cols: 15, rows: 15 });
  const put = (cells: string[], letters: string) =>
    cells.forEach((coord, i) => {
      const [col, row] = coord.split(',').map(Number);
      grid = withLetter(grid, { col, row }, letters[i]);
    });
  put(TANGENT, 'TANGENT');
  put(down(5, [2, 4]), 'OE');
  put(across(8, run(3, 'AT')), 'AT');
  put(ABRAHAM, 'ABRAHAM');
  return grid;
}

const TANGENT = across(3, run(3, 'TANGENT'));
const TANGENT_ENDS = ['2,3', '10,3'];
const ONE = down(5, run(2, 'ONE'));
const ONE_ENDS = ['5,1', '5,5'];
const ABRAHAM = across(12, run(0, 'ABRAHAM'));
const ABRAHAM_ENDS = ['7,12'];
const EMPTY = '7,6';

async function open(page: Page) {
  const { id } = await seedPuzzle({ grid: lockGrid(), hints: {}, phase: 'grid' });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  return id;
}

const cell = (page: Page, coord: string) => page.locator(`[data-coord="${coord}"]`);
const lockButton = (page: Page) => page.getByRole('button', { name: /^(Lock|Unlock) word$/ });
const outlines = (page: Page) => page.getByTestId('word-outline');
const ticks = (page: Page) => page.getByTestId('lock-tick');

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('no bounding box');
  return box;
}

/** The box around the given cells. */
async function unionBox(page: Page, coords: string[]): Promise<Box> {
  const boxes = await Promise.all(coords.map((coord) => boxOf(cell(page, coord))));
  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function near(a: number, b: number, tolerance = 2) {
  return Math.abs(a - b) <= tolerance;
}

/** An outline goes around exactly these cells: 1px, gray-500. */
async function expectOutline(page: Page, coords: string[]) {
  const want = await unionBox(page, coords);
  await expect
    .poll(async () => {
      for (const outline of await outlines(page).all()) {
        const box = await boxOf(outline);
        if (
          near(box.x, want.x) &&
          near(box.y, want.y) &&
          near(box.x + box.width, want.x + want.width) &&
          near(box.y + box.height, want.y + want.height)
        ) {
          return outline.evaluate((el) => {
            const style = getComputedStyle(el);
            return `${style.borderTopWidth} ${style.borderTopColor}`;
          });
        }
      }
      return 'no outline around the cells';
    }, { message: `an outline around ${coords.join(' ')}` })
    .toBe(`1px ${GRAY_500}`);
}

/** The tick is gray-500: its background, or its own or its shape's fill. */
async function tickPaint(tick: Locator) {
  return tick.evaluate((el) => {
    const bg = getComputedStyle(el).backgroundColor;
    if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    const shape = el.matches('svg, path, polygon') ? el : el.querySelector('path, polygon, rect');
    return shape ? getComputedStyle(shape).fill : 'unpainted';
  });
}

/** Ticks in exactly these cells' top-right corners, 1/4 of the cell. */
async function expectTicks(page: Page, coords: string[]) {
  await expect(ticks(page)).toHaveCount(coords.length);
  const found = await Promise.all((await ticks(page).all()).map(boxOf));
  for (const coord of coords) {
    const c = await boxOf(cell(page, coord));
    const index = found.findIndex(
      (t) =>
        near(t.x + t.width, c.x + c.width, 1.5) &&
        near(t.y, c.y, 1.5) &&
        near(t.width, c.width / 4, 1.5) &&
        near(t.height, c.height / 4, 1.5)
    );
    expect(index, `a tick in ${coord}'s top-right corner, 1/4 of the cell`).toBeGreaterThanOrEqual(0);
    expect(await tickPaint(ticks(page).nth(index)), `${coord}'s tick`).toBe(GRAY_500);
  }
}

/** The color of the cell's letter itself (not its number). */
async function letterColor(page: Page, coord: string) {
  return cell(page, coord).evaluate((root) => {
    const elements = [root, ...root.querySelectorAll('*')];
    const holder = elements.find((el) =>
      [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && /^[A-Z]+$/i.test(n.textContent!.trim()))
    );
    return holder ? getComputedStyle(holder).color : 'no letter';
  });
}

async function expectLetters(page: Page, coords: string[], color: string) {
  for (const coord of coords) expect(await letterColor(page, coord), `${coord}'s letter`).toBe(color);
}

const css = (locator: Locator, property: string) =>
  locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

/** The cursor in TANGENT, across, and its button shown. */
async function inTangent(page: Page, coord = '6,3') {
  await cell(page, coord).click();
  await expect(cell(page, coord)).toHaveAttribute('data-selected', 'true');
  await expect(lockButton(page)).toBeVisible();
}

/** The cursor in ONE, down, and its button shown. */
async function inOne(page: Page) {
  await cell(page, '5,2').click();
  await page.keyboard.press('ArrowDown');
  await expect(cell(page, '5,3')).toHaveAttribute('data-highlight', 'slot');
  await expect(lockButton(page)).toBeVisible();
}

async function lockTangent(page: Page) {
  await inTangent(page);
  await expect(lockButton(page)).toHaveAccessibleName('Lock word');
  await lockButton(page).click();
  await expect(lockButton(page)).toHaveAccessibleName('Unlock word');
}

async function leave(page: Page) {
  await cell(page, EMPTY).click();
  await expect(cell(page, EMPTY)).toHaveAttribute('data-selected', 'true');
  await expect(lockButton(page)).toBeHidden();
}

test.describe('21-S2-3 the button appears after a second', () => {
  // 21-S16: three seconds.
  test('after a second in a 3+ letter word, restarted by a move', async ({ page }) => {
    await open(page);
    await cell(page, '6,3').click();
    await page.waitForTimeout(2500);
    await expect(lockButton(page)).toBeHidden();
    await expect(outlines(page)).toHaveCount(0);

    // A move within the word starts the second again.
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(2600);
    await expect(lockButton(page)).toBeHidden();
    await expect(outlines(page)).toHaveCount(0);

    await expect(lockButton(page)).toBeVisible({ timeout: 1500 });
    await expect(lockButton(page)).toHaveAccessibleName('Lock word');
    await expectOutline(page, [...TANGENT, ...TANGENT_ENDS]);
    await expect(outlines(page)).toHaveCount(1);
    await expect(ticks(page)).toHaveCount(0);
  });

  test('it goes when the cursor leaves the word or the grid loses focus', async ({ page }) => {
    await open(page);
    await inTangent(page);
    await cell(page, EMPTY).click();
    await expect(lockButton(page)).toBeHidden({ timeout: 300 });
    await expect(outlines(page)).toHaveCount(0);

    await inTangent(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect(lockButton(page)).toBeHidden({ timeout: 300 });
    await expect(outlines(page)).toHaveCount(0);
  });

  test('none for a 2-letter word or an empty cell', async ({ page }) => {
    await open(page);
    await cell(page, '4,8').click();
    await expect(cell(page, '3,8')).toHaveAttribute('data-highlight', 'slot');
    await page.waitForTimeout(3500);
    await expect(lockButton(page)).toBeHidden();
    await expect(outlines(page)).toHaveCount(0);

    await cell(page, EMPTY).click();
    await page.waitForTimeout(3500);
    await expect(lockButton(page)).toBeHidden();
    await expect(outlines(page)).toHaveCount(0);
  });
});

test.describe('21-S2-4 placement and look', () => {
  // 21-S12 amended the three placement cases: before the first letter,
  // the far (rounded) corners on the side away from the word.
  test('across: left of the first letter, vertically centered, far corners rounded', async ({ page }) => {
    await open(page);
    await inTangent(page);
    const first = await boxOf(cell(page, '3,3'));
    const button = await boxOf(lockButton(page));

    expect(near(button.width, (first.width * 2) / 3, 1), `width ${button.width}`).toBe(true);
    expect(near(button.height, (first.height * 2) / 3, 1), `height ${button.height}`).toBe(true);
    expect(near(button.x + button.width, first.x), `right ${button.x + button.width}`).toBe(true);
    expect(near(button.y + button.height / 2, first.y + first.height / 2, 1), 'vertically centered').toBe(true);

    expect(await css(lockButton(page), 'border-top-right-radius')).toBe('0px');
    expect(await css(lockButton(page), 'border-bottom-right-radius')).toBe('0px');
    expect(await css(lockButton(page), 'border-top-left-radius')).toBe('4px');
    expect(await css(lockButton(page), 'border-bottom-left-radius')).toBe('4px');
  });

  test('down: above the first letter, horizontally centered, far corners rounded', async ({ page }) => {
    await open(page);
    await inOne(page);
    const first = await boxOf(cell(page, '5,2'));
    const button = await boxOf(lockButton(page));

    expect(near(button.width, (first.width * 2) / 3, 1), `width ${button.width}`).toBe(true);
    expect(near(button.height, (first.height * 2) / 3, 1), `height ${button.height}`).toBe(true);
    expect(near(button.y + button.height, first.y), `bottom ${button.y + button.height}`).toBe(true);
    expect(near(button.x + button.width / 2, first.x + first.width / 2, 1), 'horizontally centered').toBe(true);

    expect(await css(lockButton(page), 'border-bottom-left-radius')).toBe('0px');
    expect(await css(lockButton(page), 'border-bottom-right-radius')).toBe('0px');
    expect(await css(lockButton(page), 'border-top-left-radius')).toBe('4px');
    expect(await css(lockButton(page), 'border-top-right-radius')).toBe('4px');
    await expectOutline(page, [...ONE_ENDS, ...ONE]);
  });

  test('on a mini: capped at 32px, still beside the first letter', async ({ page }) => {
    let grid = createGrid({ cols: 5, rows: 5 });
    [...'CAT'].forEach((letter, i) => (grid = withLetter(grid, { col: 1 + i, row: 2 }, letter)));
    const { id } = await seedPuzzle({ grid, hints: {}, phase: 'grid' });
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);
    await cell(page, '2,2').click();
    await expect(lockButton(page)).toBeVisible();

    const first = await boxOf(cell(page, '1,2'));
    const button = await boxOf(lockButton(page));
    expect(first.width, 'a mini cell is wider than 48px').toBeGreaterThan(48);
    expect(near(button.width, 32, 1), `width ${button.width}`).toBe(true);
    expect(near(button.height, 32, 1), `height ${button.height}`).toBe(true);
    expect(near(button.x + button.width, first.x), `right ${button.x + button.width}`).toBe(true);
    expect(near(button.y + button.height / 2, first.y + first.height / 2, 1), 'vertically centered').toBe(true);
  });

  test('gray-500 at rest, gray-700 on hover, a white open padlock', async ({ page }) => {
    await open(page);
    await inTangent(page);
    const icon = lockButton(page).locator('svg');

    await expect(icon).toHaveAttribute('data-icon', 'lock-open');
    expect(await css(lockButton(page), 'background-color')).toBe(GRAY_500);
    expect(await css(icon, 'fill')).toBe(WHITE);

    await lockButton(page).hover();
    await expect.poll(() => css(lockButton(page), 'background-color')).toBe(GRAY_700);
    expect(await css(icon, 'fill')).toBe(WHITE);
  });
});

test.describe('21-S2-5 lock', () => {
  test('a click locks: gray letters, a lasting outline, ticks, the grid keeps focus', async ({ page }) => {
    await open(page);
    await lockTangent(page);

    await expect(page.getByTestId('grid-region')).toBeFocused();
    await expect(lockButton(page)).toBeVisible();
    await expect(lockButton(page).locator('svg')).toHaveAttribute('data-icon', 'lock-closed');
    // Gray inside the highlight, the cursor's cell included.
    await expectLetters(page, TANGENT, GRAY_500);

    await leave(page);
    await expectOutline(page, [...TANGENT_ENDS, ...TANGENT]);
    await expect(outlines(page)).toHaveCount(1);
    await expectTicks(page, TANGENT_ENDS);
    await expectLetters(page, TANGENT, GRAY_500);
    await expectLetters(page, ['5,2', '5,4', ...ABRAHAM], BLACK);

    // Back in the word, the closed padlock shows at once.
    await cell(page, '4,3').click();
    await expect(lockButton(page)).toBeVisible({ timeout: 400 });
    await expect(lockButton(page)).toHaveAccessibleName('Unlock word');
    await expect(lockButton(page).locator('svg')).toHaveAttribute('data-icon', 'lock-closed');
  });

  test("a word at the grid's edge has one end cell", async ({ page }) => {
    await open(page);
    await cell(page, '3,12').click();
    await expect(lockButton(page)).toBeVisible();
    await lockButton(page).click();
    await expect(lockButton(page)).toHaveAccessibleName('Unlock word');

    await leave(page);
    await expectOutline(page, [...ABRAHAM, ...ABRAHAM_ENDS]);
    await expectTicks(page, ABRAHAM_ENDS);
    await expectLetters(page, ABRAHAM, GRAY_500);
  });
});

test.describe('21-S2-6 unlock', () => {
  test('clicking again unlocks: letters back to normal, no outline or ticks once left', async ({ page }) => {
    await open(page);
    await lockTangent(page);

    await lockButton(page).click();
    await expect(lockButton(page)).toHaveAccessibleName('Lock word');
    await expect(lockButton(page).locator('svg')).toHaveAttribute('data-icon', 'lock-open');
    await expect(page.getByTestId('grid-region')).toBeFocused();
    await expectLetters(page, TANGENT, BLACK);

    await leave(page);
    await expect(outlines(page)).toHaveCount(0);
    await expect(ticks(page)).toHaveCount(0);
    await expectLetters(page, TANGENT, BLACK);
  });
});

test.describe('21-S2-7 keyboard', () => {
  test('Tab from the grid reaches the button; Enter and Space toggle it', async ({ page }) => {
    await open(page);
    await inTangent(page);

    await page.keyboard.press('Tab');
    await expect(lockButton(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(lockButton(page)).toHaveAccessibleName('Unlock word');
    await expect(lockButton(page)).toBeVisible();
    await expectLetters(page, TANGENT, GRAY_500);

    await page.keyboard.press('Space');
    await expect(lockButton(page)).toHaveAccessibleName('Lock word');
    await expectLetters(page, TANGENT, BLACK);
  });
});

test.describe('21-S2-8 crossing words', () => {
  test('unlocking one of two crossing words keeps the shared letter locked', async ({ page }) => {
    await open(page);
    await lockTangent(page);
    await inOne(page);
    await lockButton(page).click();
    await expect(lockButton(page)).toHaveAccessibleName('Unlock word');

    // Back to TANGENT, across, on its G: unlock it.
    await cell(page, '6,3').click();
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, '9,3')).toHaveAttribute('data-highlight', 'slot');
    await expect(lockButton(page)).toHaveAccessibleName('Unlock word');
    await lockButton(page).click();
    await expect(lockButton(page)).toHaveAccessibleName('Lock word');

    await leave(page);
    await expectLetters(page, ONE, GRAY_500);
    await expectLetters(page, TANGENT.filter((c) => c !== '5,3'), BLACK);
    await expectOutline(page, [...ONE_ENDS, ...ONE]);
    await expect(outlines(page)).toHaveCount(1);
    await expectTicks(page, ONE_ENDS);
  });
});

test.describe('21-S2-9 saved', () => {
  test('after a reload the lock, outline and ticks are back', async ({ page }) => {
    const id = await open(page);
    await lockTangent(page);
    await expect
      .poll(async () => JSON.stringify((await readPuzzleRow(id)).grid), { timeout: 10_000 })
      .toContain('lockedWords');

    await page.reload();
    await waitForEditorReady(page);
    await expectOutline(page, [...TANGENT, ...TANGENT_ENDS]);
    await expectTicks(page, TANGENT_ENDS);
    await expectLetters(page, TANGENT, GRAY_500);

    await cell(page, '4,3').click();
    await expect(lockButton(page)).toBeVisible({ timeout: 400 });
    await expect(lockButton(page)).toHaveAccessibleName('Unlock word');
  });
});

test.describe('21-S2-10 Preview and the hints phase', () => {
  test('with Preview on: no button, outline or ticks, and black letters', async ({ page }) => {
    await open(page);
    await lockTangent(page);

    await page.getByTestId('preview-toggle').locator('input').click({ force: true });
    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'preview');
    await cell(page, '6,3').click();
    await expect(cell(page, '6,3')).toHaveAttribute('data-selected', 'true');
    await page.waitForTimeout(3500);
    await expect(lockButton(page)).toBeHidden();
    await expect(outlines(page)).toHaveCount(0);
    await expect(ticks(page)).toHaveCount(0);
    await expectLetters(page, TANGENT, BLACK);

    // Preview off, the lock shows again.
    await page.getByTestId('preview-toggle').locator('input').click({ force: true });
    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'build');
    await expectTicks(page, TANGENT_ENDS);
  });

  test('in the hints phase: no button, outline or ticks, and black letters', async ({ page }) => {
    const id = await open(page);
    await lockTangent(page);
    await expect
      .poll(async () => JSON.stringify((await readPuzzleRow(id)).grid), { timeout: 10_000 })
      .toContain('lockedWords');

    await page.locator('[data-testid="builder-steps"] [data-step-id="hints"]').click();
    await page.getByTestId('modal-confirm').click();
    await expect(page.getByTestId('hints-region')).toBeVisible();

    await cell(page, '6,3').click();
    await expect(cell(page, '6,3')).toHaveAttribute('data-selected', 'true');
    await page.waitForTimeout(3500);
    await expect(lockButton(page)).toBeHidden();
    await expect(outlines(page)).toHaveCount(0);
    await expect(ticks(page)).toHaveCount(0);
    await expectLetters(page, TANGENT, BLACK);
  });
});
