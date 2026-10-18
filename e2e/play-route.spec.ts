import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { clearLetters, createGrid, withLetter } from '../src/engine/grid';
import { serializeGrid } from '../src/lib/puzzle-storage';
import { currentBuilderId, seedOtherBuilder } from './helpers/ownership';
import { signInSeededUser } from './helpers/seed-session';
import {
  deletePlayFixture,
  deletePlayFixtureUser,
  playPuzzleFixture,
  readPlayPuzzle,
  readPlaySessions,
  seedPlayPuzzle,
  seedPlaySession,
} from './helpers/play-route';

// P1 acceptance baseline. Subsequent typing/completion stories may extend play;
// these examples concern access, passive loading, fixed geometry, and isolation.
async function openPlay(page: Page, id: string) {
  await page.goto(`/puzzles/${id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
}

async function expectFixedNumbers(page: Page) {
  await expect(page.getByTestId('cell-number')).toHaveCount(3);
  for (const [coord, number] of [['0,0', '1'], ['2,0', '2'], ['0,2', '3']]) {
    await expect(page.locator(`[data-coord="${coord}"]`).getByTestId('cell-number')).toHaveText(number);
  }
  await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute('data-kind', 'black');
  await expect(page.locator('[data-coord="1,1"]')).toHaveCSS('background-color', 'rgb(20, 21, 27)');
  await expect(page.locator('[data-coord="1,1"]').getByTestId('cell-number')).toHaveCount(0);
}

async function cellLetter(page: Page, coord: string) {
  return page.locator(`[data-coord="${coord}"]`).evaluate((element) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-testid="cell-number"]').forEach((number) => number.remove());
    return clone.textContent?.trim() ?? '';
  });
}

test.describe('P1 — a play route', () => {
  for (const owner of ['own', 'another builder'] as const) {
    for (const visibility of ['public', 'private'] as const) {
      test(`signed-in players can open ${owner} published ${visibility} puzzles`, async ({ page }) => {
        const player = await currentBuilderId(page);
        const builderId = owner === 'own' ? player : await seedOtherBuilder();
        const fixture = await seedPlayPuzzle({ builderId, visibility });

        await openPlay(page, fixture.id);

        await expect(page.getByTestId('play-title')).toHaveText(fixture.title);
        await expect(page.getByTestId('puzzle-grid')).toHaveAttribute('data-grid-mode', 'play');
        await expect.poll(async () => (await readPlaySessions(fixture.id)).map((row) => row.userId)).toEqual([player]);
      });
    }
  }

  for (const visitor of ['signed out', 'invalid cookie'] as const) {
    test(`${visitor} visitors return to the front door without starting play`, async ({ page, browser }) => {
      const player = await currentBuilderId(page);
      const fixture = await seedPlayPuzzle({ builderId: player });
      const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
      try {
        if (visitor === 'invalid cookie') {
          const cookie = (await page.context().cookies()).find((item) => item.name.endsWith('.session_token'));
          expect(cookie).toBeDefined();
          await context.addCookies([{ ...cookie!, value: 'invalid.signature' }]);
        }
        const visitorPage = await context.newPage();
        await visitorPage.goto(`/puzzles/${fixture.id}/play`);
        await expect(visitorPage).toHaveURL(/\/$/);
        await expect(visitorPage.getByTestId('front-door')).toBeVisible();
        await expect(visitorPage.getByTestId('play-puzzle')).toHaveCount(0);
        expect(await readPlaySessions(fixture.id)).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }

  test('drafts and missing puzzles are not found, even when a draft has an existing session', async ({ page }) => {
    const player = await currentBuilderId(page);
    const own = await seedPlayPuzzle({ builderId: player, published: false });
    const foreign = await seedPlayPuzzle({ builderId: await seedOtherBuilder(), published: false });
    await seedPlaySession(player, foreign.id, clearLetters(foreign.puzzle.grid));
    const before = await readPlaySessions(foreign.id);

    for (const id of [own.id, foreign.id, `missing-p1-${randomUUID()}`]) {
      await page.goto(`/puzzles/${id}/play`);
      await expect(page.getByTestId('puzzle-not-found')).toBeVisible();
      await expect(page.getByTestId('play-puzzle')).toHaveCount(0);
    }
    expect(await readPlaySessions(own.id)).toEqual([]);
    expect(await readPlaySessions(foreign.id)).toEqual(before);
  });

  test('actual browser opening creates one blank session with fixed black geometry and numbering', async ({ page }) => {
    const player = await currentBuilderId(page);
    const fixture = await seedPlayPuzzle({ builderId: player });
    const before = await readPlayPuzzle(fixture.id);
    const openedAt = Date.now();

    await openPlay(page, fixture.id);

    await expect(page.getByTestId('grid-cell')).toHaveCount(9);
    await expect(page.locator('[data-testid="grid-cell"][data-kind="active"]')).toHaveCount(8);
    await expect(page.locator('[data-testid="grid-cell"][data-kind="black"]')).toHaveCount(1);
    await expectFixedNumbers(page);
    for (const coord of ['0,0', '1,0', '2,0', '0,1', '2,1', '0,2', '1,2', '2,2']) {
      expect(await cellLetter(page, coord)).toBe('');
      expect(await page.locator(`[data-coord="${coord}"]`).evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
    }
    const rows = await readPlaySessions(fixture.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].entries).toEqual(serializeGrid(clearLetters(fixture.puzzle.grid)));
    expect(rows[0].userId).toBe(player);
    expect(rows[0].puzzleId).toBe(fixture.id);
    expect(rows[0].startedAt.getTime()).toBeGreaterThanOrEqual(openedAt - 1_000);
    expect(rows[0].startedAt.getTime()).toBeLessThanOrEqual(Date.now() + 1_000);
    expect(rows[0].completedAt).toBeNull();
    expect(await readPlayPuzzle(fixture.id)).toEqual(before);
  });

  test('static numbered clues and title omit builder editing controls and answer labels', async ({ page }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    await openPlay(page, fixture.id);

    const clues = page.getByTestId('play-clues');
    await expect(clues.getByTestId('play-clue-column')).toHaveCount(2);
    for (const [orientation, expected] of [
      ['across', ['1 Feline', '3 Twice five']],
      ['down', ['1 A pet that purrs', '2 A shade of brown']],
    ] as const) {
      const column = clues.locator(`[data-testid="play-clue-column"][data-orientation="${orientation}"]`);
      await expect(column.getByRole('heading', { name: orientation === 'across' ? 'Across' : 'Down', exact: true })).toBeVisible();
      await expect(column.getByTestId('play-clue')).toHaveText([...expected]);
    }
    for (const [key, text] of Object.entries(fixture.puzzle.hints)) {
      await expect(clues.locator(`[data-testid="play-clue"][data-clue-key="${key}"]`)).toContainText(text);
    }
    await expect(clues.locator('input, textarea, [contenteditable="true"]')).toHaveCount(0);
    await expect(page.getByTestId('hint-answer')).toHaveCount(0);
    await expect(page.getByTestId('play-title').locator('input, textarea, [contenteditable="true"]')).toHaveCount(0);
    await expect(page.getByTestId('puzzle-editor')).toHaveCount(0);
    for (const testId of ['preview-toggle', 'edit-grid-toggle', 'new-puzzle-button', 'clear-letters-button', 'publish-controls']) {
      await expect(page.getByTestId(testId)).toHaveCount(0);
    }
  });

  test('wrong and rebus entries retain their contents, white blanks, fixed numbers, and timestamps when reopened', async ({ page }) => {
    const player = await currentBuilderId(page);
    const fixture = await seedPlayPuzzle({ builderId: player });
    let entries = clearLetters(fixture.puzzle.grid);
    entries = withLetter(entries, { col: 0, row: 0 }, 'Z');
    entries = withLetter(entries, { col: 1, row: 0 }, 'HEART');
    entries = withLetter(entries, { col: 0, row: 2 }, 'M');
    await seedPlaySession(player, fixture.id, entries);
    const sessionsBefore = await readPlaySessions(fixture.id);
    const puzzleBefore = await readPlayPuzzle(fixture.id);

    await openPlay(page, fixture.id);
    await page.reload();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');

    await expectFixedNumbers(page);
    expect(await cellLetter(page, '0,0')).toBe('Z');
    expect(await cellLetter(page, '1,0')).toBe('HEART');
    expect(await cellLetter(page, '0,2')).toBe('M');
    expect(await cellLetter(page, '2,0')).toBe('');
    expect(await page.locator('[data-coord="2,0"]').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
    await expect(page.locator('[data-cell-state="symmetric-hint"], [data-cell-state="required"], [data-cell-state="recommended"], [data-cell-state="locked-letter"]')).toHaveCount(0);
    expect(await readPlaySessions(fixture.id)).toEqual(sessionsBefore);
    expect(await readPlayPuzzle(fixture.id)).toEqual(puzzleBefore);
  });

  test('two-cell words do not inherit builder recommendation colors in play', async ({ page }) => {
    let grid = createGrid({ cols: 2, rows: 2 });
    for (const [row, letters] of ['AB', 'CD'].entries()) {
      for (const [col, letter] of [...letters].entries()) grid = withLetter(grid, { col, row }, letter);
    }
    const fixture = await seedPlayPuzzle({
      builderId: await currentBuilderId(page),
      puzzle: { grid, phase: 'hints', hints: { '1-across': 'First', '3-across': 'Second', '1-down': 'Third', '2-down': 'Fourth' } },
    });
    await openPlay(page, fixture.id);

    await expect(page.getByTestId('grid-cell')).toHaveCount(4);
    await expect(page.locator('[data-cell-state="recommended"], [data-cell-state="required"], [data-cell-state="symmetric-hint"]')).toHaveCount(0);
    for (const cell of await page.getByTestId('grid-cell').all()) {
      expect(await cell.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
    }
  });

  test('HTTP GET and prefetch read without creating a session; browser mount then starts one', async ({ page }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    const before = await readPlayPuzzle(fixture.id);
    const path = `/puzzles/${fixture.id}/play`;

    const get = await page.request.get(path);
    expect(get.ok()).toBe(true);
    const prefetch = await page.request.get(path, { headers: { 'Next-Router-Prefetch': '1', Purpose: 'prefetch' } });
    expect(prefetch.ok()).toBe(true);
    expect(await readPlaySessions(fixture.id)).toEqual([]);
    expect(await readPlayPuzzle(fixture.id)).toEqual(before);

    await openPlay(page, fixture.id);
    await expect.poll(async () => (await readPlaySessions(fixture.id)).length).toBe(1);
  });

  test('concurrent first openings and reload reuse one session without changing its start time', async ({ page, context }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    const second = await context.newPage();
    try {
      await Promise.all([openPlay(page, fixture.id), openPlay(second, fixture.id)]);
      const before = await readPlaySessions(fixture.id);
      expect(before).toHaveLength(1);
      await page.reload();
      await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
      expect(await readPlaySessions(fixture.id)).toEqual(before);
    } finally {
      await second.close();
    }
  });

  test('the database rejects a second session for the same player and puzzle', async ({ page }) => {
    const player = await currentBuilderId(page);
    const fixture = await seedPlayPuzzle({ builderId: player });
    await openPlay(page, fixture.id);
    const before = await readPlaySessions(fixture.id);
    expect(before).toHaveLength(1);

    await expect(seedPlaySession(player, fixture.id, clearLetters(fixture.puzzle.grid))).rejects.toThrow(/unique constraint/i);

    expect(await readPlaySessions(fixture.id)).toEqual(before);
  });

  test('two players receive independent entries for the same published puzzle', async ({ page, browser }) => {
    const firstPlayer = await currentBuilderId(page);
    const fixture = await seedPlayPuzzle({ builderId: firstPlayer });
    const entries = withLetter(clearLetters(fixture.puzzle.grid), { col: 0, row: 0 }, 'Z');
    await seedPlaySession(firstPlayer, fixture.id, entries);
    const firstSession = (await readPlaySessions(fixture.id))[0];
    await openPlay(page, fixture.id);
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    try {
      const otherPage = await context.newPage();
      await signInSeededUser(otherPage);
      const secondPlayer = await currentBuilderId(otherPage);
      expect(secondPlayer).not.toBe(firstPlayer);
      await openPlay(otherPage, fixture.id);

      expect(await cellLetter(page, '0,0')).toBe('Z');
      expect(await cellLetter(otherPage, '0,0')).toBe('');
      const rows = await readPlaySessions(fixture.id);
      expect(rows).toHaveLength(2);
      expect(rows.find((row) => row.userId === firstPlayer)).toEqual(firstSession);
      expect(rows.find((row) => row.userId === secondPlayer)?.entries).toEqual(serializeGrid(clearLetters(fixture.puzzle.grid)));
    } finally {
      await context.close();
    }
  });

  test('answer strings remain server-side in both initial HTML and session-start responses', async ({ page }) => {
    const secret = `P1_SOLUTION_ONLY_${randomUUID()}`;
    const puzzle = playPuzzleFixture();
    const fixture = await seedPlayPuzzle({
      builderId: await currentBuilderId(page),
      puzzle: { ...puzzle, grid: withLetter(puzzle.grid, { col: 0, row: 0 }, secret) },
    });
    const htmlBodies: Array<Promise<string>> = [];
    const actionBodies: Array<Promise<string>> = [];
    page.on('response', (response) => {
      if (new URL(response.url()).pathname !== `/puzzles/${fixture.id}/play`) return;
      const request = response.request();
      if (request.method() === 'GET' && request.resourceType() === 'document') htmlBodies.push(response.text());
      if (request.headers()['next-action']) actionBodies.push(response.text());
    });

    await openPlay(page, fixture.id);

    expect(htmlBodies.length).toBeGreaterThan(0);
    expect(actionBodies.length).toBeGreaterThan(0);
    for (const body of await Promise.all([...htmlBodies, ...actionBodies])) expect(body).not.toContain(secret);
    expect(await page.content()).not.toContain(secret);
    expect(await cellLetter(page, '0,0')).toBe('');
  });

  test('deleting one synthetic puzzle cascades its sessions and retains another puzzle and session', async ({ page }) => {
    const player = await currentBuilderId(page);
    const removed = await seedPlayPuzzle({ builderId: player });
    const retained = await seedPlayPuzzle({ builderId: player });
    await openPlay(page, removed.id);
    await openPlay(page, retained.id);
    const retainedSessions = await readPlaySessions(retained.id);
    const retainedPuzzle = await readPlayPuzzle(retained.id);
    expect(await readPlaySessions(removed.id)).toHaveLength(1);

    await deletePlayFixture(removed.id);

    expect(await readPlaySessions(removed.id)).toEqual([]);
    expect(await readPlaySessions(retained.id)).toEqual(retainedSessions);
    expect(await readPlayPuzzle(retained.id)).toEqual(retainedPuzzle);
  });

  test('deleting a synthetic session user cascades only their sessions and retains the puzzle', async ({ page }) => {
    const owner = await currentBuilderId(page);
    const removedPlayer = await seedOtherBuilder();
    const fixture = await seedPlayPuzzle({ builderId: owner });
    await openPlay(page, fixture.id);
    const ownerSessions = await readPlaySessions(fixture.id);
    const puzzleBefore = await readPlayPuzzle(fixture.id);
    await seedPlaySession(removedPlayer, fixture.id, clearLetters(fixture.puzzle.grid));
    expect(await readPlaySessions(fixture.id)).toHaveLength(2);

    await deletePlayFixtureUser(removedPlayer);

    expect(await readPlaySessions(fixture.id)).toEqual(ownerSessions);
    expect(await readPlayPuzzle(fixture.id)).toEqual(puzzleBefore);
  });
});
