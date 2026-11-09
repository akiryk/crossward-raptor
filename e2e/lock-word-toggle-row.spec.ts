import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { readPuzzleRow } from './helpers/read-puzzle-row';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// Story 21-S5 — Lock Word in the toggle row.
//
// Whenever the grid is narrower than its full width (a daily's 620px, was
// 700px), a text button in the toggle row replaces S2's button beside the
// word; at the full width only
// S2's button is used, never both. The button sits left of Rebus with 20px
// between them, in Rebus's `text-label` style. It reads "Lock Word" or
// "Unlock Word" for the word under the cursor and is enabled and blue
// (Rebus's `link-muted`) at once, with no 1-second wait, when the cursor is
// in a lockable (3+ letters) or locked word. Otherwise it's disabled, muted
// gray (`subtle`, gray-600) and reads "Lock Word". The outline still follows
// S2's rule (1 second for an unlocked word, always for a locked one), as do
// the ticks and gray letters. A tap toggles the lock and leaves the grid
// focused. No tooltip. Hidden with Preview on; absent in the hints phase.
//
// Hooks (delegated details): the button is [data-testid="lock-word-control"],
// a <button> in [data-testid="toggle-row"] named by its text, disabled
// (`aria-disabled`, still a Tab stop) when disabled. S2's button is found by its name "Lock word" / "Unlock
// word" (lower-case w), the outline [data-testid="word-outline"], the tick
// [data-testid="lock-tick"].
//
// Widths: the page has 8px of padding each side below 748px, so a daily's
// grid is the full 620px from a 636px window and 619px at 635px (21-S9;
// was 700px, 716px and 715px). 635px is "just below full"; 375px is a
// phone. Amended by 21-S9: the daily's full width is 620px, so 21-S5-1's
// widths are 636px and 635px; what each case checks is unchanged.
//
// Amended by 21-S16: the button beside a word waits 3 seconds (was 1);
// every wait timed against it is 2000ms longer.
//
// Amended by 22-S6: the button beside a word waits 2 seconds (was 3);
// 21-S5-2's outline "not yet" is at 1500ms (was 2500ms). The other waits,
// longer than 2 seconds, are unchanged.
//
// Amended by 22-S2: with Preview on in a daily or Sunday, Rebus leaves the
// row too (the build progress takes its place); 21-S5-4 checks it's gone.
//
// Colors and sizes are the human's values, written out here. Do not edit
// this file to match an implementation.

const GRID_FULL_PX = 620;
const WIDE = { width: 1440, height: 1000 };
// 21-S12 amended this from 636px: the button beside the word also needs
// 36px left of the grid, which a 620px grid has from a 692px window.
const NARROWEST_FULL = { width: 692, height: 1000 };
const JUST_BELOW_FULL = { width: 635, height: 1000 };
const PHONE = { width: 375, height: 800 };

const GRAY_500 = 'rgb(139, 144, 154)'; // #8b909a, locked letters
const GRAY_600 = 'rgb(117, 117, 117)'; // #757575, `subtle`
const LINK_MUTED = 'rgb(86, 179, 229)'; // #56b3e5, Rebus's blue
const BUTTON_HOVER = 'rgb(33, 145, 205)'; // #2191cd, Rebus's hover
const BLACK = 'rgb(0, 0, 0)';

const GAP_TO_REBUS_PX = 20;
const AT_ONCE_MS = 300;

const run = (from: number, word: string) => [...word].map((_, i) => from + i);
const across = (row: number, cols: number[]) => cols.map((col) => `${col},${row}`);

/** A daily: TANGENT across row 3 (3–9); AT across row 8 (3–4), 2 letters. */
function lockGrid(): Grid {
  let grid = createGrid({ cols: 15, rows: 15 });
  const put = (cells: string[], letters: string) =>
    cells.forEach((coord, i) => {
      const [col, row] = coord.split(',').map(Number);
      grid = withLetter(grid, { col, row }, letters[i]);
    });
  put(TANGENT, 'TANGENT');
  put(AT, 'AT');
  return grid;
}

const TANGENT = across(3, run(3, 'TANGENT'));
const TANGENT_ENDS = ['2,3', '10,3'];
const AT = across(8, run(3, 'AT'));
const EMPTY = '7,6';

async function open(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  const { id } = await seedPuzzle({ grid: lockGrid(), hints: {}, phase: 'grid' });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  return id;
}

const cell = (page: Page, coord: string) => page.locator(`[data-coord="${coord}"]`);
const control = (page: Page) => page.getByTestId('lock-word-control');
const shownControl = (page: Page) => control(page).filter({ visible: true });
const besideButton = (page: Page) => page.getByRole('button', { name: /^(Lock|Unlock) word$/ });
const rebus = (page: Page) => page.getByTestId('rebus-control').filter({ visible: true });
const row = (page: Page) => page.getByTestId('toggle-row');
const gridRegion = (page: Page) => page.getByTestId('grid-region');
const outlines = (page: Page) => page.getByTestId('word-outline');
const ticks = (page: Page) => page.getByTestId('lock-tick');

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('no bounding box');
  return box;
}

function near(a: number, b: number, tolerance = 1) {
  return Math.abs(a - b) <= tolerance;
}

const css = (locator: Locator, property: string) =>
  locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

async function gridWidth(page: Page) {
  return (await boxOf(gridRegion(page))).width;
}

async function select(page: Page, coord: string) {
  await cell(page, coord).click();
  await expect(cell(page, coord)).toHaveAttribute('data-selected', 'true');
}

/** Disabled, muted gray at full strength, reading "Lock Word". */
async function expectDisabled(page: Page) {
  await expect(control(page)).toBeVisible();
  await expect(control(page)).toBeDisabled({ timeout: AT_ONCE_MS });
  await expect(control(page)).toHaveText('Lock Word');
  expect(await css(control(page), 'color')).toBe(GRAY_600);
  expect(await css(control(page), 'opacity')).toBe('1');
}

/** Enabled at once and blue, like Rebus, reading the given text. */
async function expectEnabled(page: Page, text: 'Lock Word' | 'Unlock Word') {
  await expect(control(page)).toBeVisible();
  await expect(control(page)).toBeEnabled({ timeout: AT_ONCE_MS });
  await expect(control(page)).toHaveText(text, { timeout: AT_ONCE_MS });
  await expect.poll(() => css(control(page), 'color'), { timeout: AT_ONCE_MS }).toBe(LINK_MUTED);
}

/** An outline goes around exactly these cells: 1px, gray-500. */
async function expectOutline(page: Page, coords: string[], timeout = 5000) {
  const boxes = await Promise.all(coords.map((coord) => boxOf(cell(page, coord))));
  const want = {
    left: Math.min(...boxes.map((b) => b.x)),
    top: Math.min(...boxes.map((b) => b.y)),
    right: Math.max(...boxes.map((b) => b.x + b.width)),
    bottom: Math.max(...boxes.map((b) => b.y + b.height)),
  };
  await expect
    .poll(
      async () => {
        for (const outline of await outlines(page).all()) {
          const b = await boxOf(outline);
          if (near(b.x, want.left, 2) && near(b.y, want.top, 2) && near(b.x + b.width, want.right, 2) && near(b.y + b.height, want.bottom, 2)) {
            return outline.evaluate((el) => `${getComputedStyle(el).borderTopWidth} ${getComputedStyle(el).borderTopColor}`);
          }
        }
        return 'no outline around the cells';
      },
      { message: `an outline around ${coords.join(' ')}`, timeout }
    )
    .toBe(`1px ${GRAY_500}`);
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

/** At the full width: S2's button beside the word, never the row's. */
async function expectBesideOnly(page: Page, name: 'Lock word' | 'Unlock word') {
  await expect(besideButton(page)).toBeVisible({ timeout: 3500 });
  await expect(besideButton(page)).toHaveAccessibleName(name);
  await expect(shownControl(page)).toHaveCount(0);
}

/** Narrower: the row's button, and S2's never, even after a second. */
async function expectRowOnly(page: Page, text: 'Lock Word' | 'Unlock Word') {
  await expectEnabled(page, text);
  await page.waitForTimeout(3500);
  await expect(besideButton(page)).toHaveCount(0);
  await expectEnabled(page, text);
}

async function lockTangentInRow(page: Page) {
  await select(page, '6,3');
  await expectEnabled(page, 'Lock Word');
  await control(page).click();
  // A click leaves the pointer on it, showing Rebus's hover color; move it
  // off to see the resting blue (correction, 21-S5).
  await page.mouse.move(0, 0);
  await expectEnabled(page, 'Unlock Word');
}

test.describe('21-S5-1 which one', () => {
  test('1440px: only the button beside the word', async ({ page }) => {
    await open(page, WIDE);
    expect(await gridWidth(page)).toBe(GRID_FULL_PX);
    await select(page, '6,3');
    await expectBesideOnly(page, 'Lock word');
  });

  test('375px: only the toggle-row button, 20px left of Rebus, in its style', async ({ page }) => {
    await open(page, PHONE);
    expect(await gridWidth(page), 'the grid has shrunk').toBeLessThan(GRID_FULL_PX);
    await select(page, '6,3');
    await expectRowOnly(page, 'Lock Word');

    await expect(row(page).getByTestId('lock-word-control')).toHaveCount(1);
    await expect(control(page)).toHaveRole('button');
    await expect(control(page)).toHaveAccessibleName('Lock Word');

    const at = await boxOf(control(page));
    const r = await boxOf(rebus(page));
    expect(near(r.x - (at.x + at.width), GAP_TO_REBUS_PX), `gap to Rebus ${r.x - (at.x + at.width)}`).toBe(true);
    expect(near(at.y + at.height / 2, r.y + r.height / 2), 'centered on Rebus').toBe(true);
    for (const property of ['font-size', 'font-weight', 'line-height', 'font-family']) {
      expect(await css(control(page), property), property).toBe(await css(rebus(page), property));
    }

    // Rebus and Preview keep their places: 12px in from the row's ends.
    const panel = await boxOf(row(page));
    expect(near(panel.x + panel.width - (r.x + r.width), 12), 'Rebus at the right end').toBe(true);
    const preview = await boxOf(page.getByTestId('preview-toggle'));
    expect(near(preview.x - panel.x, 12), 'Preview at the left end').toBe(true);
  });

  test('692px, the grid at its full 620px, 36px in: only the button beside the word', async ({ page }) => {
    await open(page, NARROWEST_FULL);
    expect(await gridWidth(page)).toBe(GRID_FULL_PX);
    await select(page, '6,3');
    await expectBesideOnly(page, 'Lock word');
  });

  test('635px, the grid just under 620px: only the toggle-row button', async ({ page }) => {
    await open(page, JUST_BELOW_FULL);
    expect(await gridWidth(page), 'the grid has shrunk').toBeLessThan(GRID_FULL_PX);
    await select(page, '6,3');
    await expectRowOnly(page, 'Lock Word');
  });

  test('resizing across the boundary swaps them, never both', async ({ page }) => {
    await open(page, WIDE);
    await select(page, '6,3');
    await expect(besideButton(page)).toBeVisible({ timeout: 3500 });
    await besideButton(page).click();
    await expectBesideOnly(page, 'Unlock word');

    await page.setViewportSize(JUST_BELOW_FULL);
    await expect(besideButton(page)).toHaveCount(0);
    await expectEnabled(page, 'Unlock Word');

    await page.setViewportSize(WIDE);
    await expectBesideOnly(page, 'Unlock word');
  });
});

test.describe('21-S5-2 states (375px)', () => {
  test('an empty cell or a 2-letter run: disabled, gray, "Lock Word"', async ({ page }) => {
    await open(page, PHONE);
    await select(page, EMPTY);
    await expectDisabled(page);

    await select(page, '4,8');
    await expect(cell(page, '3,8')).toHaveAttribute('data-highlight', 'slot');
    await expectDisabled(page);
    await page.waitForTimeout(3500);
    await expectDisabled(page);
  });

  test('on opening, the cursor on the empty first cell: disabled', async ({ page }) => {
    await open(page, PHONE);
    await expectDisabled(page);
  });

  test('a 3+ letter word: enabled at once and blue; the outline still waits a second', async ({ page }) => {
    await open(page, PHONE);
    await select(page, '6,3');
    await expectEnabled(page, 'Lock Word');

    await page.waitForTimeout(1500); // 22-S6: was 2500
    await expect(outlines(page)).toHaveCount(0);
    await expectOutline(page, [...TANGENT_ENDS, ...TANGENT], 1500);
    await expect(outlines(page)).toHaveCount(1);
    await expect(ticks(page)).toHaveCount(0);

    // Leaving the word: disabled again at once, the outline gone.
    await select(page, EMPTY);
    await expectDisabled(page);
    await expect(outlines(page)).toHaveCount(0);
  });

  test('a locked word: "Unlock Word" at once, and its outline always', async ({ page }) => {
    await open(page, PHONE);
    await lockTangentInRow(page);
    await select(page, EMPTY);
    await expectDisabled(page);
    await expectOutline(page, [...TANGENT, ...TANGENT_ENDS]);

    await select(page, '4,3');
    await expectEnabled(page, 'Unlock Word');
  });

  test('the grid losing focus: disabled, as no word is selected', async ({ page }) => {
    await open(page, PHONE);
    await select(page, '6,3');
    await expectEnabled(page, 'Lock Word');
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expectDisabled(page);
  });

  test('hovered, enabled: Rebus\'s hover color', async ({ page }) => {
    await open(page, PHONE);
    await select(page, '6,3');
    await expectEnabled(page, 'Lock Word');
    await control(page).hover();
    await expect.poll(() => css(control(page), 'color')).toBe(BUTTON_HOVER);
  });
});

test.describe('21-S5-3 toggling (375px)', () => {
  test('a click locks and unlocks; the grid keeps focus; no tooltip', async ({ page }) => {
    const id = await open(page, PHONE);
    await lockTangentInRow(page);

    await expect(gridRegion(page)).toBeFocused();
    await expectLetters(page, TANGENT, GRAY_500);
    await expectOutline(page, [...TANGENT, ...TANGENT_ENDS], 1000);
    await expect(ticks(page)).toHaveCount(2);
    await expect(besideButton(page)).toHaveCount(0);
    await expect
      .poll(async () => JSON.stringify((await readPuzzleRow(id)).grid), { timeout: 10_000 })
      .toContain('lockedWords');

    // The grid still takes keys.
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, '7,3')).toHaveAttribute('data-selected', 'true');

    // No tooltip after a long hover.
    await control(page).hover();
    await page.waitForTimeout(3500);
    await expect(page.getByRole('tooltip')).toHaveCount(0);

    await control(page).click();
    await page.mouse.move(0, 0);
    await expectEnabled(page, 'Lock Word');
    await expect(gridRegion(page)).toBeFocused();
    await expectLetters(page, TANGENT, BLACK);

    await select(page, EMPTY);
    await expect(outlines(page)).toHaveCount(0);
    await expect(ticks(page)).toHaveCount(0);
    await expectLetters(page, TANGENT, BLACK);
  });
});

test.describe('21-S5-3 toggling on a touch screen (375px)', () => {
  test.use({ hasTouch: true });

  test('a tap locks and unlocks; the grid keeps focus', async ({ page }) => {
    await open(page, PHONE);
    await cell(page, '6,3').tap();
    await expect(cell(page, '6,3')).toHaveAttribute('data-selected', 'true');
    await expectEnabled(page, 'Lock Word');

    await control(page).tap();
    await expectEnabled(page, 'Unlock Word');
    await expect(gridRegion(page)).toBeFocused();
    await expectLetters(page, TANGENT, GRAY_500);
    await expect(ticks(page)).toHaveCount(2);

    await control(page).tap();
    await expectEnabled(page, 'Lock Word');
    await expect(gridRegion(page)).toBeFocused();
    await expectLetters(page, TANGENT, BLACK);
  });
});

test.describe('21-S5-4 Preview and the hints phase (375px)', () => {
  test('hidden with Preview on, back with Preview off', async ({ page }) => {
    await open(page, PHONE);
    await lockTangentInRow(page);

    await page.getByTestId('preview-toggle').locator('input').click({ force: true });
    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'preview');
    await select(page, '6,3');
    await page.waitForTimeout(3500);
    await expect(shownControl(page)).toHaveCount(0);
    await expect(besideButton(page)).toHaveCount(0);
    // Amended by 22-S2: in a daily with Preview on, the build progress takes
    // Rebus's place, so Rebus isn't shown either (was toHaveCount(1)).
    await expect(rebus(page)).toHaveCount(0);

    await page.getByTestId('preview-toggle').locator('input').click({ force: true });
    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'build');
    await select(page, '6,3');
    await expectEnabled(page, 'Unlock Word');
  });

  test('absent in the hints phase', async ({ page }) => {
    await open(page, PHONE);
    await page.locator('[data-testid="builder-steps"] [data-step-id="hints"]').click();
    await page.getByTestId('modal-confirm').click();
    await expect(page.getByTestId('lock-letters-toggle')).toBeVisible();

    await select(page, '6,3');
    await page.waitForTimeout(3500);
    await expect(control(page)).toHaveCount(0);
    await expect(besideButton(page)).toHaveCount(0);
  });
});

test.describe('21-S5-5 no overflow (375px)', () => {
  test('Preview, "Unlock Word" and Rebus fit the row on one line', async ({ page }) => {
    await open(page, PHONE);
    await lockTangentInRow(page);

    const panel = await boxOf(row(page));
    const preview = await boxOf(page.getByTestId('preview-toggle'));
    const at = await boxOf(control(page));
    const r = await boxOf(rebus(page));

    expect(panel.height, 'the row keeps its 40px').toBe(40);
    expect(preview.x + preview.width, 'Preview ends before the button').toBeLessThanOrEqual(at.x);
    expect(at.x + at.width, 'the button ends before Rebus').toBeLessThanOrEqual(r.x);
    expect(r.x + r.width, 'Rebus inside the row').toBeLessThanOrEqual(panel.x + panel.width);
    for (const b of [preview, at, r]) {
      expect(near(b.y + b.height / 2, panel.y + panel.height / 2, 1.5), 'one line, centered').toBe(true);
    }
    expect(await control(page).evaluate((el) => el.scrollWidth <= el.clientWidth), 'its text fits').toBe(true);
    expect(await row(page).evaluate((el) => el.scrollWidth <= el.clientWidth), 'the row does not overflow').toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      'the page does not overflow'
    ).toBe(true);
  });
});

test.describe('21-S5-6 keyboard (375px)', () => {
  test('Shift+Tab from the grid, past Rebus, reaches it; Enter locks and Space unlocks', async ({ page }) => {
    await open(page, PHONE);
    await select(page, '6,3');
    await expectEnabled(page, 'Lock Word');

    // The row comes before the grid, and Rebus is between them.
    await page.keyboard.press('Shift+Tab');
    await expect(rebus(page)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(control(page)).toBeFocused();

    // Focused, it keeps the cursor's word as its target.
    await expectEnabled(page, 'Lock Word');
    await expect(cell(page, '6,3')).toHaveAttribute('data-selected', 'true');

    await page.keyboard.press('Enter');
    await expectEnabled(page, 'Unlock Word');
    await expect(control(page)).toBeFocused();
    await expectLetters(page, TANGENT, GRAY_500);
    await expect(ticks(page)).toHaveCount(2);

    await page.keyboard.press('Space');
    await expectEnabled(page, 'Lock Word');
    await expect(control(page)).toBeFocused();
    await expectLetters(page, TANGENT, BLACK);
  });
});
