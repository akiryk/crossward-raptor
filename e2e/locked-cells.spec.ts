import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// Story 21-S3 — locked cells hold.
//
// A protected cell is a letter of a locked word or one of its end cells
// (the empty cells just before and after it). Typing on one changes
// nothing, and the cursor moves on as if it had typed. Backspace never
// clears one: on one, the cursor moves back a cell and clears nothing;
// moving back onto one lands there and clears nothing. Rebus (the link and
// Escape) is disabled on one. With Preview on they are still protected.
// Unlocked, the keys work as before.
//
// Words are locked through the button beside them (21-S2). Do not edit
// this file to match an implementation.

test.use({ viewport: { width: 1440, height: 1000 } });

/** A daily with KOOKABURRA across row 3, columns 2–11. Its second K is
 *  (5,3); its end cells are (1,3) and (12,3). */
function birdGrid(): Grid {
  let grid = createGrid({ cols: 15, rows: 15 });
  [...'KOOKABURRA'].forEach((letter, i) => (grid = withLetter(grid, { col: 2 + i, row: 3 }, letter)));
  return grid;
}

const KOOKABURRA = [...'KOOKABURRA'].map((_, i) => `${2 + i},3`);
const SECOND_K = '5,3';
const EMPTY = '7,10';

const cell = (page: Page, coord: string) => page.locator(`[data-coord="${coord}"]`);
const lockButton = (page: Page) => page.getByRole('button', { name: /^(Lock|Unlock) word$/ });
const rebusControl = (page: Page) => page.getByTestId('rebus-control').filter({ visible: true });
const rebusEntry = (page: Page) => page.getByTestId('rebus-entry');

/** A cell's letters, without its number or an open rebus entry. */
function cellText(page: Page, coord: string) {
  return cell(page, coord).evaluate((element) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-testid="cell-number"]').forEach((number) => number.remove());
    clone.querySelectorAll('[data-testid="rebus-entry"]').forEach((open) => open.remove());
    return clone.textContent?.trim() ?? '';
  });
}

async function expectText(page: Page, coord: string, text: string) {
  await expect.poll(() => cellText(page, coord), { message: `cell ${coord}` }).toBe(text);
}

/** Each coord holds the matching letter of `letters` ('.' for empty). */
async function expectLetters(page: Page, coords: string[], letters: string) {
  for (const [i, coord] of coords.entries()) {
    await expectText(page, coord, letters[i] === '.' ? '' : letters[i]);
  }
}

async function expectSelected(page: Page, coord: string) {
  await expect(page.locator('[data-selected="true"]')).toHaveCount(1);
  await expect(cell(page, coord)).toHaveAttribute('data-selected', 'true');
}

async function select(page: Page, coord: string) {
  await cell(page, coord).click();
  await expectSelected(page, coord);
}

/** The cursor on a cell, Down. ArrowDown turns an Across cursor in place. */
async function selectDown(page: Page, coord: string) {
  await select(page, coord);
  await page.keyboard.press('ArrowDown');
  await expectSelected(page, coord);
}

/** The cursor on a cell, Across. ArrowRight turns a Down cursor in place. */
async function selectAcross(page: Page, coord: string) {
  await select(page, coord);
  await page.keyboard.press('ArrowRight');
  await expectSelected(page, coord);
}

/** KOOKABURRA locked through its button, then the cursor left on an empty
 *  cell (Across), the button gone. */
async function openLocked(page: Page) {
  const { id } = await seedPuzzle({ grid: birdGrid(), hints: {}, phase: 'grid' });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  await select(page, '6,3');
  await expect(lockButton(page)).toHaveAccessibleName('Lock word');
  await lockButton(page).click();
  await expect(lockButton(page)).toHaveAccessibleName('Unlock word');
  await leave(page);
  return id;
}

async function leave(page: Page) {
  await select(page, EMPTY);
  await expect(lockButton(page)).toBeHidden();
}

const DOWN_FROM_K = ['5,2', '5,3', '5,4', '5,5', '5,6', '5,7'];

test.describe('21-S3-3 KIND and MIND down from a locked K', () => {
  test('typing KIND gives K-I-N-D, the cursor past the D', async ({ page }) => {
    await openLocked(page);
    await selectDown(page, SECOND_K);
    await page.keyboard.type('kind');
    await expectSelected(page, '5,7');
    await expectLetters(page, DOWN_FROM_K, '.KIND.');
    await expectLetters(page, KOOKABURRA, 'KOOKABURRA');
  });

  test('typing MIND gives K-I-N-D too: the K is unchanged', async ({ page }) => {
    await openLocked(page);
    await selectDown(page, SECOND_K);
    await page.keyboard.type('m');
    await expectSelected(page, '5,4');
    await expectText(page, SECOND_K, 'K');
    await page.keyboard.type('ind');
    await expectSelected(page, '5,7');
    await expectLetters(page, DOWN_FROM_K, '.KIND.');
    await expectLetters(page, KOOKABURRA, 'KOOKABURRA');
  });
});

test.describe('21-S3-4 Backspace through', () => {
  test('after KIND, Backspace x5 clears D, N and I, keeps the K and ends above it', async ({ page }) => {
    await openLocked(page);
    await selectDown(page, SECOND_K);
    await page.keyboard.type('kind');
    await expectSelected(page, '5,7');

    const steps: [coord: string, letters: string][] = [
      ['5,6', '.KIN..'],
      ['5,5', '.KI...'],
      ['5,4', '.K....'],
      ['5,3', '.K....'], // rests on the K
      ['5,2', '.K....'], // and walks back past it
    ];
    for (const [coord, letters] of steps) {
      await page.keyboard.press('Backspace');
      await expectSelected(page, coord);
      await expectLetters(page, DOWN_FROM_K, letters);
    }
    await expectLetters(page, KOOKABURRA, 'KOOKABURRA');
  });

  test('Backspace across a locked word moves back and clears nothing', async ({ page }) => {
    await openLocked(page);
    await select(page, '8,3');
    for (const coord of ['7,3', '6,3', '5,3']) {
      await page.keyboard.press('Backspace');
      await expectSelected(page, coord);
    }
    await expectLetters(page, KOOKABURRA, 'KOOKABURRA');
  });
});

test.describe('21-S3-5 end cells', () => {
  test('typing across into an end cell leaves it empty; the cursor moves on', async ({ page }) => {
    await openLocked(page);
    await select(page, '12,3');
    await page.keyboard.type('st');
    await expectSelected(page, '14,3');
    await expectText(page, '12,3', '');
    await expectText(page, '13,3', 'T');

    await select(page, '0,3');
    await page.keyboard.type('xy');
    await expectSelected(page, '2,3');
    await expectText(page, '0,3', 'X');
    await expectText(page, '1,3', '');
    await expectLetters(page, KOOKABURRA, 'KOOKABURRA');
  });

  test('typing down through an end cell leaves it empty; the word does not grow', async ({ page }) => {
    await openLocked(page);
    await selectDown(page, '12,2');
    await page.keyboard.type('abc');
    await expectSelected(page, '12,5');
    await expectLetters(page, ['12,2', '12,3', '12,4'], 'A.C');

    // KOOKABURRA is still the locked word, with its end cells empty.
    await selectAcross(page, '6,3');
    await expect(lockButton(page)).toHaveAccessibleName('Unlock word');
    await expectLetters(page, ['1,3', ...KOOKABURRA, '12,3'], '.KOOKABURRA.');
  });

  test('Backspace on an end cell moves back and clears nothing', async ({ page }) => {
    await openLocked(page);
    await selectDown(page, '1,2');
    await page.keyboard.type('a');
    await expectSelected(page, '1,3');
    await expectText(page, '1,2', 'A');

    // On the end cell, Down: back onto the A, which stays.
    await page.keyboard.press('Backspace');
    await expectSelected(page, '1,2');
    await expectText(page, '1,2', 'A');
  });
});

test.describe('21-S3-6 Rebus', () => {
  test('on a locked letter or an end cell the Rebus link is disabled and Escape opens nothing', async ({ page }) => {
    await openLocked(page);
    await expect(rebusControl(page)).toBeEnabled();

    for (const coord of ['6,3', '12,3']) {
      // From an empty cell, so the button beside KOOKABURRA isn't over (12,3).
      await leave(page);
      await select(page, coord);
      await expect(rebusControl(page)).toBeDisabled();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await expect(rebusEntry(page)).toHaveCount(0);
      await expectSelected(page, coord);
    }
    await expectText(page, '6,3', 'A');
    await expectText(page, '12,3', '');

    // Off the word, Rebus works as before.
    await select(page, EMPTY);
    await expect(rebusControl(page)).toBeEnabled();
    await page.keyboard.press('Escape');
    await expect(rebusEntry(page)).toHaveCount(1);
  });
});

test.describe('21-S3-7 Preview', () => {
  test('with Preview on, typing on and backspacing through a locked letter change nothing', async ({ page }) => {
    await openLocked(page);
    await page.getByTestId('preview-toggle').locator('input').click({ force: true });
    await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'preview');

    await select(page, '8,3');
    await page.keyboard.type('x');
    await expectSelected(page, '9,3');
    await expectText(page, '8,3', 'U');

    for (const coord of ['8,3', '7,3']) {
      await page.keyboard.press('Backspace');
      await expectSelected(page, coord);
    }
    await expectLetters(page, KOOKABURRA, 'KOOKABURRA');
  });
});

test.describe('21-S3-8 unlocked again', () => {
  test('after unlocking, the same keys change the letters as before', async ({ page }) => {
    await openLocked(page);
    await select(page, '6,3');
    await expect(lockButton(page)).toHaveAccessibleName('Unlock word');
    await lockButton(page).click();
    await expect(lockButton(page)).toHaveAccessibleName('Lock word');
    await leave(page);

    await selectDown(page, SECOND_K);
    await page.keyboard.type('m');
    await expectSelected(page, '5,4');
    await expectText(page, SECOND_K, 'M');
    await page.keyboard.press('Backspace');
    await expectSelected(page, SECOND_K);
    await expectText(page, SECOND_K, '');

    await select(page, '12,3');
    await page.keyboard.type('s');
    await expectText(page, '12,3', 'S');

    await select(page, '7,3');
    await page.keyboard.press('Backspace');
    await expectSelected(page, '7,3');
    await expectText(page, '7,3', '');
  });
});
