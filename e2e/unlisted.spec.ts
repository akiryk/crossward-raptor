import { test, expect, type Locator, type Page } from '@playwright/test';
import { createGrid, withLetter, type Grid } from '../src/engine/grid';
import { deserializeGrid, type SerializedGrid } from '../src/lib/puzzle-storage';
import { currentBuilderId, seedOtherBuilder } from './helpers/ownership';
import { readPlaySessions, seedPlayPuzzle, seedPlaySession } from './helpers/play-route';
import { seedPuzzle } from './helpers/seed-puzzle';
import { signInSeededUser } from './helpers/seed-session';
import { waitForEditorReady } from './helpers/wait-for-ready';

// 16-S1 acceptance. The suite shares one database, so rows are found by their
// unique titles, never by position or count.

/** Entries for seedPlayPuzzle's 3×3 fixture: one letter typed, the rest blank. */
const partial: SerializedGrid = {
  cols: 3, rows: 3,
  cells: [
    [{ kind: 'active', letter: 'C' }, { kind: 'active', letter: null }, { kind: 'active', letter: null }],
    [{ kind: 'active', letter: null }, { kind: 'black' }, { kind: 'active', letter: null }],
    [{ kind: 'active', letter: null }, { kind: 'active', letter: null }, { kind: 'active', letter: null }],
  ],
};

function row(page: Page, title: string): Locator {
  return page.getByTestId('puzzle-list-item').filter({ hasText: title });
}
async function library(page: Page) {
  await page.goto('/puzzles');
  await page.waitForSelector('[data-testid="puzzle-library"][data-ready="true"]');
}
async function showView(page: Page, view: 'Build' | 'Play') {
  const option = page.getByTestId('library-view').getByRole('radio', { name: view, exact: true });
  await option.check();
  await expect(option).toBeChecked();
}
async function openPlay(page: Page, id: string) {
  await page.goto(`/puzzles/${id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
}

function fillAll(grid: Grid): Grid {
  let filled = grid;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (grid.at(c, r).kind === 'active') filled = withLetter(filled, { col: c, row: r }, 'A');
    }
  }
  return filled;
}

test.describe('16-S1 Unlisted', () => {
  test('16-S1-1 Play lists own puzzles, others’ public ones and others’ unlisted ones the player has started, across a reload', async ({ page }) => {
    const me = await currentBuilderId(page);
    const other = await seedOtherBuilder();
    const someoneElse = await seedOtherBuilder();
    const ownUnlisted = await seedPlayPuzzle({ builderId: me, visibility: 'private' });
    const ownPublic = await seedPlayPuzzle({ builderId: me, visibility: 'public' });
    const foreignPublic = await seedPlayPuzzle({ builderId: other, visibility: 'public' });
    const foreignStarted = await seedPlayPuzzle({ builderId: other, visibility: 'private' });
    await seedPlaySession(me, foreignStarted.id, deserializeGrid(partial));
    const foreignUnplayed = await seedPlayPuzzle({ builderId: other, visibility: 'private' });
    const playedBySomeoneElse = await seedPlayPuzzle({ builderId: other, visibility: 'private' });
    await seedPlaySession(someoneElse, playedBySomeoneElse.id, deserializeGrid(partial));

    await library(page);
    for (let visit = 0; visit < 2; visit++) {
      if (visit) {
        await page.reload();
        await page.waitForSelector('[data-testid="puzzle-library"][data-ready="true"]');
      }
      await showView(page, 'Play');
      for (const listed of [ownUnlisted, ownPublic, foreignPublic, foreignStarted]) {
        const item = row(page, listed.title);
        await expect(item).toBeVisible();
        await expect(item.getByTestId('puzzle-play-link')).toHaveAttribute('href', `/puzzles/${listed.id}/play`);
      }
      await expect(row(page, foreignStarted.title)).toHaveAttribute('data-play-state', 'in-progress');
      await expect(row(page, foreignStarted.title).getByTestId('puzzle-play-state')).toHaveText('[in-play]');
      for (const hidden of [foreignUnplayed, playedBySomeoneElse]) {
        await expect(row(page, hidden.title)).toHaveCount(0);
      }

      await showView(page, 'Build');
      for (const own of [ownUnlisted, ownPublic]) await expect(row(page, own.title)).toBeVisible();
      for (const foreign of [foreignPublic, foreignStarted, foreignUnplayed, playedBySomeoneElse]) {
        await expect(row(page, foreign.title)).toHaveCount(0);
      }
    }
  });

  test('16-S1-2 the link opens another builder’s unlisted puzzle, and from then on it is listed in Play', async ({ page }) => {
    const me = await currentBuilderId(page);
    const unlisted = await seedPlayPuzzle({ builderId: await seedOtherBuilder(), visibility: 'private' });

    await library(page);
    await showView(page, 'Play');
    await expect(row(page, unlisted.title)).toHaveCount(0);

    await openPlay(page, unlisted.id);
    await expect(page.getByTestId('play-puzzle')).toBeVisible();
    // Opening the link starts the player's attempt, as for any published puzzle.
    expect((await readPlaySessions(unlisted.id)).map((s) => s.userId)).toEqual([me]);

    await library(page);
    await showView(page, 'Play');
    const item = row(page, unlisted.title);
    await expect(item).toBeVisible();
    await expect(item).toHaveAttribute('data-play-state', 'untouched');
    await showView(page, 'Build');
    await expect(row(page, unlisted.title)).toHaveCount(0);
  });

  test('16-S1-3 a puzzle published Unlisted is listed for its builder, hidden from another player until they open its link', async ({ page, browser }) => {
    const title = `16-S1 unlisted ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { id } = await seedPuzzle(
      { grid: fillAll(createGrid({ cols: 3, rows: 3 })), hints: {
        '1-across': 'a', '4-across': 'b', '5-across': 'c', '1-down': 'd', '2-down': 'e', '3-down': 'f',
      }, phase: 'hints' },
      title
    );
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);
    await page.locator('[data-testid="builder-steps"] [data-step-id="publish"]').click();
    const dialog = page.getByTestId('publish-dialog');
    await expect(dialog.getByRole('radio', { name: 'Unlisted' })).toBeChecked();
    await dialog.getByTestId('modal-confirm').click();
    await expect(page.getByTestId('publish-state')).toHaveText('Published');

    await library(page);
    await expect(row(page, title)).toHaveAttribute('data-visibility', 'private');
    await showView(page, 'Play');
    await expect(row(page, title)).toBeVisible();

    const otherContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    try {
      const other = await otherContext.newPage();
      await signInSeededUser(other);
      await library(other);
      await showView(other, 'Play');
      await expect(row(other, title)).toHaveCount(0);

      await openPlay(other, id);
      await library(other);
      await showView(other, 'Play');
      await expect(row(other, title)).toBeVisible();
    } finally {
      await otherContext.close();
    }
  });

  test('16-S1-4 the Publish dialog reads Unlisted and Public, and never Private', async ({ page }) => {
    const { id } = await seedPuzzle(
      { grid: fillAll(createGrid({ cols: 3, rows: 3 })), hints: {
        '1-across': 'a', '4-across': 'b', '5-across': 'c', '1-down': 'd', '2-down': 'e', '3-down': 'f',
      }, phase: 'hints' },
      `16-S1 labels ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    );
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);
    await page.locator('[data-testid="builder-steps"] [data-step-id="publish"]').click();
    const dialog = page.getByTestId('publish-dialog');
    const radio = dialog.getByRole('radiogroup', { name: 'Who can play it?' });
    const names = await radio.getByRole('radio').evaluateAll((inputs) =>
      inputs.map((input) => input.closest('label')?.textContent?.trim()));
    expect(names).toEqual(['Unlisted', 'Public']);
    await expect(dialog).not.toContainText(/private/i);
  });
});
