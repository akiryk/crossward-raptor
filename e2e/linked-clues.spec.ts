import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import type { Puzzle } from '../src/engine/puzzle';
import { currentBuilderId } from './helpers/ownership';
import { playPuzzleFixture, seedPlayPuzzle } from './helpers/play-route';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// 26-S3 explicitly supersedes S1's word-level decoration acceptance.
// Preserve native editing/persistence and every display surface, with plain
// text for both With and See. Grid and whole-row recognition are separate.
const WITH = 'With 1-Across, a dish';
const SEE = 'See 1-Across';
const row = (page: Page, key: string) => page.locator(`[data-testid="hint-row"][data-hint-key="${key}"]`);
const input = (page: Page, key: string) => row(page, key).getByTestId('hint-input');
const clueText = (page: Page, key: string) => page.locator(`[data-testid="play-clue"][data-clue-key="${key}"]`).getByTestId('play-clue-text');
const noWordMarks = (page: Page) => expect(page.getByTestId('linked-clue-with')).toHaveCount(0);

function fixture(hints: Record<string, string>): Puzzle {
  const base = playPuzzleFixture();
  return { ...base, hints: { ...base.hints, ...hints } };
}
async function builder(page: Page, hints: Record<string, string> = {}) {
  const { id } = await seedPuzzle(fixture(hints));
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
}
async function play(page: Page) {
  const { id } = await seedPlayPuzzle({ builderId: await currentBuilderId(page),
    puzzle: fixture({ '1-across': 'With 1-Down, x', '1-down': SEE }) });
  await page.goto(`/puzzles/${id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
}
async function plain(text: Locator, value: string) {
  await expect(text).toHaveText(value);
  expect(await text.evaluate((el) => el.childElementCount)).toBe(0);
}

// Literal #E8F7FF, every cell scanned: no unexpected secondary fill.
async function linkedCells(page: Page, coords: string[]) {
  await expect.poll(() => page.getByTestId('grid-cell').evaluateAll((cells) => cells
    .filter((el) => getComputedStyle(el).backgroundColor === 'rgb(232, 247, 255)')
    .map((el) => el.getAttribute('data-coord')).sort())).toEqual([...coords].sort());
}

test.describe('26-S3 amended S1 builder wide', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('26-S1-6 typing With stays plain and saves exactly as typed', async ({ page }) => {
    await builder(page, { '1-down': '' });
    const field = input(page, '1-down');
    await field.click();
    const saved = page.waitForResponse((response) => response.request().method() === 'POST'
      && response.request().headers()['next-action'] !== undefined);
    await page.keyboard.type(WITH);
    await expect(field).toHaveValue(WITH);
    await noWordMarks(page);
    await saved;
    await page.reload();
    await waitForEditorReady(page);
    await expect(input(page, '1-down')).toHaveValue(WITH);
    await noWordMarks(page);
  });
  test('26-S1-7 With and See edits stay plain; recognition remains live in the grid', async ({ page }) => {
    await builder(page, { '1-down': WITH });
    const field = input(page, '1-down');
    await field.click();
    for (const text of [WITH, SEE, 'see 1-across, x']) {
      await field.fill(text);
      await expect(field).toHaveValue(text);
      await linkedCells(page, ['1,0', '2,0']);
      await noWordMarks(page);
    }
    for (const text of ['See 82-Across', 'See 1-Down', 'See 1 Across', 'ordinary']) {
      await field.fill(text);
      await expect(field).toHaveValue(text);
      await linkedCells(page, []);
      await noWordMarks(page);
    }
    await field.fill(SEE);
    await linkedCells(page, ['1,0', '2,0']);
    await noWordMarks(page);
    await page.getByRole('heading', { name: 'Across', exact: true }).click();
    const look = (el: Locator) => el.evaluate((node) => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, image: style.backgroundImage };
    });
    expect(await look(field)).toEqual(await look(input(page, '1-across')));
  });
});

test.describe('26-S3 amended S1 builder narrow', () => {
  test.use({ viewport: { width: 390, height: 900 } });
  test('26-S1-8 Hint Box keeps With and See plain and native', async ({ page }) => {
    await builder(page, { '1-down': WITH });
    const box = page.getByTestId('hint-box');
    const field = box.getByTestId('hint-box-input');
    await box.getByRole('button', { name: 'Next word' }).click();
    await box.getByRole('button', { name: 'Next word' }).click();
    await expect(field).toHaveValue(WITH);
    await noWordMarks(page);
    await field.fill(SEE);
    await expect(field).toHaveValue(SEE);
    await linkedCells(page, ['1,0', '2,0']);
    await noWordMarks(page);
    await field.fill('See 1Across');
    await linkedCells(page, []);
    await noWordMarks(page);
  });
});

test('26-S1-9 wide play: lists and Prominent Hint show With and See as plain text', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await play(page);
  await plain(clueText(page, '1-across'), 'With 1-Down, x');
  await plain(clueText(page, '1-down'), SEE);
  await plain(clueText(page, '3-across'), 'Twice five');
  await plain(page.getByTestId('prominent-hint-text'), 'With 1-Down, x');
  await clueText(page, '1-down').click();
  await plain(page.getByTestId('prominent-hint-text'), SEE);
  await noWordMarks(page);
});

test('26-S1-9 narrow play: hint bar keeps both keywords plain', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await play(page);
  const bar = page.getByTestId('play-hint-bar');
  const text = bar.getByTestId('play-hint-bar-text');
  await plain(text, 'With 1-Down, x');
  await bar.getByRole('button', { name: 'Next word' }).click();
  await plain(text, 'Twice five');
  await bar.getByRole('button', { name: 'Next word' }).click();
  await plain(text, SEE);
  await linkedCells(page, ['1,0', '2,0']);
  await noWordMarks(page);
});

test('26-S1-10 hints Preview: With and See are plain text', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await builder(page, { '1-down': WITH, '2-down': SEE });
  const toggle = page.getByTestId('preview-hints-toggle').filter({ visible: true });
  await toggle.click();
  await expect(toggle.locator('input')).toBeChecked();
  await plain(clueText(page, '1-down'), WITH);
  await plain(clueText(page, '2-down'), SEE);
  await plain(clueText(page, '3-across'), 'Twice five');
  await noWordMarks(page);
});
