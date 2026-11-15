import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { currentBuilderId, ownershipTestClient } from './helpers/ownership';
import { playPuzzleFixture, seedPlayPuzzle, seedPlaySession } from './helpers/play-route';

test.use({ viewport: { width: 1440, height: 900 } });
const BLUE = 'rgb(207, 238, 255)'; // current clue #CFEEFF
const PALE = 'rgb(232, 247, 255)'; // referenced clue #E8F7FF
const row = (page: Page, key: string) => page.locator(`[data-testid="play-clue"][data-clue-key="${key}"]`);
const cell = (page: Page, coord: string) => page.locator(`[data-testid="grid-cell"][data-coord="${coord}"]`);

async function open(page: Page, hints: Record<string, string>, complete = false) {
  const owner = await currentBuilderId(page);
  const base = playPuzzleFixture();
  const puzzle = { ...base, hints: { ...base.hints, ...hints } };
  const { id } = await seedPlayPuzzle({ builderId: owner, puzzle });
  if (complete) {
    const sessionId = await seedPlaySession(owner, id, puzzle.grid);
    const client = ownershipTestClient();
    try {
      await client.playSession.update({ where: { id: sessionId }, data: { completedAt: new Date('2026-01-04T00:00:00Z') } });
    } finally { await client.$disconnect(); }
  }
  await page.goto(`/puzzles/${id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
}

async function fills(page: Page, selected: string | null, linked: string | null) {
  // Every row, both colors: catches extra secondary or primary backgrounds.
  for (const [color, key] of [[BLUE, selected], [PALE, linked]] as const) {
    await expect.poll(() => page.getByTestId('play-clue').evaluateAll((rows, color) => rows
      .filter((el) => getComputedStyle(el).backgroundColor === color)
      .map((el) => el.getAttribute('data-clue-key')), color)).toEqual(key ? [key] : []);
  }
  if (selected) await expect(row(page, selected)).toHaveAttribute('data-active', 'true');
  if (linked) {
    await expect(row(page, linked)).not.toHaveAttribute('data-active', 'true');
    // Text inherits the full-row fill, with no keyword-specific element.
    expect(await row(page, linked).getByTestId('play-clue-text').evaluate((el) => el.childElementCount)).toBe(0);
  }
  await expect(page.getByTestId('linked-clue-with')).toHaveCount(0);
}
async function paleCells(page: Page, coords: string[]) {
  await expect.poll(() => page.getByTestId('grid-cell').evaluateAll((cells) => cells
    .filter((el) => getComputedStyle(el).backgroundColor === 'rgb(232, 247, 255)')
    .map((el) => el.getAttribute('data-coord')).sort())).toEqual([...coords].sort());
}

test('26-S3-2 reciprocal across clues: With or See selects both full rows and referenced cells', async ({ page }) => {
  await open(page, { '1-across': 'With 3-Across, x', '3-across': 'See 1-across' });
  await fills(page, '1-across', '3-across');
  await paleCells(page, ['0,2', '1,2', '2,2']);
  await row(page, '3-across').click();
  await fills(page, '3-across', '1-across');
  await paleCells(page, ['0,0', '1,0', '2,0']);
  await expect(cell(page, '0,2')).toHaveCSS('background-color', 'rgb(252, 255, 77)');
  for (const coord of ['1,2', '2,2']) await expect(cell(page, coord)).toHaveCSS('background-color', BLUE);
  await row(page, '1-across').click();
  await fills(page, '1-across', '3-across');
  // Selecting a word in the grid works too.
  await cell(page, '1,2').click();
  await fills(page, '3-across', '1-across');
  await row(page, '2-down').click();
  await fills(page, '2-down', null);
  await paleCells(page, []);
});

test('26-S3-3 cross-direction mixed case: crossing keeps its look and focus loss clears both fills', async ({ page }) => {
  await open(page, { '1-across': 'wItH 1-dOwN, x', '1-down': 'sEe 1-aCrOsS' });
  await fills(page, '1-across', '1-down');
  await paleCells(page, ['0,1', '0,2']);
  await row(page, '1-down').click();
  await fills(page, '1-down', '1-across');
  await paleCells(page, ['1,0', '2,0']);
  await expect(cell(page, '0,0')).toHaveCSS('background-color', 'rgb(252, 255, 77)');
  await page.getByTestId('play-title').click();
  await fills(page, null, null);
  await paleCells(page, []);
});

test('26-S3-4 invalid, nonexistent and self references do not add a secondary row or cells', async ({ page }) => {
  await open(page, { '1-across': 'See 82-Across', '3-across': 'See 3-Across', '1-down': 'See 1 Across' });
  for (const key of ['1-across', '3-across', '1-down']) {
    await row(page, key).click();
    await fills(page, key, null);
    await paleCells(page, []);
  }
});

test('26-S3-5 a completed locked game has neither clue-row nor grid linking', async ({ page }) => {
  await open(page, { '1-across': 'With 3-Across, x', '3-across': 'See 1-Across' }, true);
  await fills(page, null, null);
  await row(page, '3-across').click();
  await fills(page, null, null);
  await paleCells(page, []);
});
