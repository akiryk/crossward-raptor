import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { clearLetters, createGrid, withLetter } from '../src/engine/grid';
import { serializeGrid, type SerializedGrid } from '../src/lib/puzzle-storage';
import { currentBuilderId, seedOtherBuilder } from './helpers/ownership';
import { signInSeededUser } from './helpers/seed-session';
import {
  playPuzzleFixture,
  readPlayPuzzle,
  readPlaySessions,
  seedPlayPuzzle,
  seedPlaySession,
} from './helpers/play-route';

// Selects (0,0) across. Play opens on the first empty cell, across, with the
// grid focused (17-S2); clicking (0,0) when it is already the cursor would
// toggle to down, so the click is only made when it isn't.
async function openPlay(page: Page, id: string, options: { select?: boolean } = {}) {
  await page.goto(`/puzzles/${id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
  await expect(page.getByTestId('play-grid-region')).toHaveAttribute('data-ready', 'true');
  if (options.select === false) return;
  if (await page.locator('[data-coord="0,0"]').getAttribute('data-selected') !== 'true') {
    await page.locator('[data-coord="0,0"]').click();
  }
}

async function expectSelected(page: Page, coord: string) {
  await expect(page.locator('[data-selected="true"]')).toHaveCount(1);
  await expect(page.locator(`[data-coord="${coord}"]`)).toHaveAttribute('data-selected', 'true');
}

async function cellLetter(page: Page, coord: string) {
  return page.locator(`[data-coord="${coord}"]`).evaluate((element) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-testid="cell-number"]').forEach((number) => number.remove());
    return clone.textContent?.trim() ?? '';
  });
}

async function expectLetters(page: Page, expected: Record<string, string>) {
  for (const [coord, letter] of Object.entries(expected)) {
    await expect.poll(() => cellLetter(page, coord)).toBe(letter);
  }
}

async function expectSaved(page: Page) {
  await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'saved');
}

async function expectSavedEntries(page: Page, id: string, entries: SerializedGrid, userId?: string) {
  await expect.poll(async () => {
    const sessions = await readPlaySessions(id);
    return (userId ? sessions.find((session) => session.userId === userId) : sessions[0])?.entries;
  }).toEqual(entries);
  await expectSaved(page);
}

// Control only the browser's debounce clock. Database reads and route gates
// stay on the runner's real clock, so negative timing assertions are bounded
// by exact elapsed app time instead of competing with a slow machine.
async function pauseBrowserClock(page: Page) {
  await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));
}

function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

function blankEntries(): SerializedGrid {
  return {
    cols: 3,
    rows: 3,
    cells: [
      [{ kind: 'active', letter: null }, { kind: 'active', letter: null }, { kind: 'active', letter: null }],
      [{ kind: 'active', letter: null }, { kind: 'black' }, { kind: 'active', letter: null }],
      [{ kind: 'active', letter: null }, { kind: 'active', letter: null }, { kind: 'active', letter: null }],
    ],
  };
}

function draftKey(sessionId: string) {
  return `crossward:play-draft:v1:${sessionId}`;
}

async function readDraft(page: Page, sessionId: string) {
  return page.evaluate((key) => {
    const value = localStorage.getItem(key);
    return value === null ? null : JSON.parse(value);
  }, draftKey(sessionId));
}

async function storeDraft(page: Page, sessionId: string, value: string) {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: draftKey(sessionId), value });
}

test.describe('P2 — typing and resuming', () => {
  // 17-S2 retired "opening and reopening leave the puzzle unselected until
  // the player clicks an active cell": play now opens on the first empty
  // cell (e2e/play-opening.spec.ts).

  test('typing after selection uses uppercase guesses, advances across, overtypes, and preserves white numbered geometry', async ({ page }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    await openPlay(page, fixture.id);

    await expect(page.getByTestId('play-grid-region')).toBeFocused();
    await expectSelected(page, '0,0');
    await page.keyboard.type('abc');
    await expectLetters(page, { '0,0': 'A', '1,0': 'B', '2,0': 'C' });
    await expectSelected(page, '2,0');
    await page.keyboard.type('d');
    await expectLetters(page, { '0,0': 'A', '1,0': 'B', '2,0': 'D' });
    await expectSelected(page, '2,0');

    for (const [coord, number] of [['0,0', '1'], ['2,0', '2'], ['0,2', '3']]) {
      await expect(page.locator(`[data-coord="${coord}"]`).getByTestId('cell-number')).toHaveText(number);
    }
    await expect(page.getByTestId('cell-number')).toHaveCount(3);
    // 14-S7: active cells outside the selected word stay white.
    for (const coord of ['0,1', '2,1', '0,2', '1,2', '2,2']) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    }
    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute('data-kind', 'black');
    await expect(page.locator('[data-coord="1,1"]')).toHaveCSS('background-color', 'rgb(20, 21, 27)');
    await expect(page.locator('[data-cell-state="required"], [data-cell-state="recommended"], [data-cell-state="symmetric-hint"]')).toHaveCount(0);
    // A data attribute alone is insufficient: focused selection must paint an
    // actual indicator. 14-S7: the cursor cell is play-cell-selected-cell
    // (yellow-bright) and the rest of its word play-cell-selected-row
    // (blue-medium), in place of the inset rings.
    await expect(page.locator('[data-coord="2,0"]')).toHaveCSS('background-color', 'rgb(252, 255, 77)');
    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute('data-highlight', 'slot');
    await expect(page.locator('[data-coord="1,0"]')).toHaveAttribute('data-highlight', 'slot');
    for (const coord of ['0,0', '1,0']) {
      await expect(page.locator(`[data-coord="${coord}"]`)).toHaveCSS('background-color', 'rgb(207, 238, 255)');
    }
  });

  test('arrows, space and cell clicks use the existing one-action cursor rules', async ({ page }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    await openPlay(page, fixture.id);

    await page.keyboard.press('ArrowDown');
    await expectSelected(page, '0,0');
    await expect(page.locator('[data-coord="0,1"]')).toHaveAttribute('data-highlight', 'slot');
    await page.keyboard.press('ArrowDown');
    await expectSelected(page, '0,1');
    await page.keyboard.press('ArrowDown');
    await expectSelected(page, '0,2');
    await page.keyboard.press('ArrowDown');
    await expectSelected(page, '0,2');
    await page.keyboard.press('ArrowRight');
    await expectSelected(page, '0,2');
    await page.keyboard.press('ArrowRight');
    await expectSelected(page, '1,2');
    await page.keyboard.press('ArrowRight');
    await expectSelected(page, '2,2');
    await page.keyboard.press('ArrowRight');
    await expectSelected(page, '2,2');
    await page.keyboard.press('ArrowLeft');
    await expectSelected(page, '1,2');
    await page.keyboard.press('ArrowUp');
    await expectSelected(page, '1,2');
    await page.keyboard.press('ArrowUp');
    await expectSelected(page, '1,2'); // black (1,1) blocks an along-axis move
    await page.keyboard.press('Space');
    await page.locator('[data-coord="2,0"]').click();
    await expectSelected(page, '2,0');
    await page.keyboard.type('x');
    await expectSelected(page, '2,0'); // different-cell click preserved across
    await page.locator('[data-coord="2,0"]').click();
    await page.keyboard.type('z');
    await expectSelected(page, '2,1'); // same-cell click switched to down
    await page.locator('[data-coord="1,1"]').click();
    await expectSelected(page, '2,1');
    await page.keyboard.type('y');
    await expectSelected(page, '2,2');
    await page.keyboard.press('ArrowUp');
    await expectSelected(page, '2,1');
    await expectLetters(page, { '2,0': 'Z', '2,1': 'Y', '2,2': '' });
  });

  test('Backspace clears before retreating and never crosses black cells or the grid edge', async ({ page }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    await openPlay(page, fixture.id);
    await page.keyboard.type('abc');
    await page.keyboard.press('Backspace');
    await expectSelected(page, '2,0');
    await expectLetters(page, { '0,0': 'A', '1,0': 'B', '2,0': '' });
    await page.keyboard.press('Backspace');
    await expectSelected(page, '1,0');
    await expectLetters(page, { '0,0': 'A', '1,0': '', '2,0': '' });
    await page.keyboard.press('Backspace');
    await expectSelected(page, '0,0');
    await page.keyboard.press('Backspace');
    await expectSelected(page, '0,0');
    await expectLetters(page, { '0,0': '' });

    // (2,1) has no Across word, so the click selects it Down (17-S6), and a
    // black cell can't be behind it Across; a word's start stops Backspace
    // as the grid's edge does, above.
    await page.locator('[data-coord="2,1"]').click();
    await page.keyboard.type('q');
    await expectSelected(page, '2,2');
    await page.keyboard.press('Backspace');
    await expectSelected(page, '2,1');
    await expectLetters(page, { '2,1': '', '2,2': '' });
  });

  test('unsupported keys, modifiers and composition do nothing; real focus scopes typing and selection', async ({ page }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    await openPlay(page, fixture.id);
    const before = await readPlaySessions(fixture.id);
    let saves = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action']) saves++;
      await route.continue();
    });
    await pauseBrowserClock(page);

    for (const key of ['Delete', '.', '1', ',', '/', 'Enter', 'Escape']) await page.keyboard.press(key);
    const region = page.getByTestId('play-grid-region');
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
      await region.dispatchEvent('keydown', { key: 'x', [modifier]: true });
      await region.dispatchEvent('keydown', { key: 'Backspace', [modifier]: true });
      await region.dispatchEvent('keydown', { key: 'ArrowDown', [modifier]: true });
    }
    await region.dispatchEvent('keydown', { key: 'x', isComposing: true });
    await page.keyboard.insertText('REBUS');
    await expectSelected(page, '0,0');
    await expectLetters(page, { '0,0': '', '1,0': '', '2,0': '' });
    await page.clock.runFor(1_000);
    expect(saves).toBe(0);
    expect(await readPlaySessions(fixture.id)).toEqual(before);

    await page.keyboard.press('Tab');
    await expect(region).not.toBeFocused();
    await expect(page.locator('[data-selected="true"], [data-highlight="slot"]')).toHaveCount(0);
    await page.keyboard.type('z');
    await expectLetters(page, { '0,0': '' });
    await page.getByRole('link', { name: 'Crossward', exact: true }).focus();
    await page.keyboard.type('q');
    await expectLetters(page, { '0,0': '' });
    await page.clock.runFor(1_000);
    expect(saves).toBe(0);
    await page.locator('[data-coord="2,2"]').click();
    await expect(region).toBeFocused();
    await expectSelected(page, '2,2');
    await page.keyboard.type('a');
    await expectLetters(page, { '2,2': 'A' });
  });

  test('pending and failed starts cannot type or select; Retry enables the successful session', async ({ page }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    const pending = gate();
    let starts = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action'] && ++starts === 1) {
        await pending.promise;
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });
    try {
      await page.goto(`/puzzles/${fixture.id}/play`);
      await expect.poll(() => starts).toBe(1);
      await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'starting');
      await expect(page.getByTestId('play-grid-region')).toHaveAttribute('data-ready', 'false');
      await page.locator('[data-coord="2,2"]').click();
      await page.keyboard.type('z');
      await page.keyboard.press('Backspace');
      await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
      await expectLetters(page, { '0,0': '', '2,2': '' });
      expect(await readPlaySessions(fixture.id)).toEqual([]);
      pending.release();
      await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'error');
      await page.locator('[data-coord="2,2"]').click();
      await page.keyboard.type('q');
      await expectLetters(page, { '2,2': '' });
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
      // 17-S2: the successful session opens on its first empty cell, focused.
      await expectSelected(page, '0,0');
      await expect(page.getByTestId('play-grid-region')).toBeFocused();
      await page.keyboard.type('a');
      await expectLetters(page, { '0,0': 'A' });
    } finally {
      pending.release();
    }
  });

  test('500ms debounce restarts after each edit, saves the whole latest burst, and ignores cursor-only changes', async ({ page }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    await openPlay(page, fixture.id);
    const before = await readPlaySessions(fixture.id);
    const puzzleBefore = await readPlayPuzzle(fixture.id);
    let saves = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action']) saves++;
      await route.continue();
    });
    await pauseBrowserClock(page);
    await page.keyboard.type('a');
    await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'pending');
    await page.clock.runFor(300);
    expect(saves).toBe(0);
    await page.keyboard.type('b');
    await page.clock.runFor(499);
    expect(saves).toBe(0);
    expect(await readPlaySessions(fixture.id)).toEqual(before);
    await page.clock.runFor(1);
    const expected = blankEntries();
    expected.cells[0][0] = { kind: 'active', letter: 'A' };
    expected.cells[0][1] = { kind: 'active', letter: 'B' };
    await expectSavedEntries(page, fixture.id, expected);
    expect(saves).toBe(1);
    expect((await readPlaySessions(fixture.id))[0]).toEqual({ ...before[0], entries: expected });
    expect(await readPlayPuzzle(fixture.id)).toEqual(puzzleBefore);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Space');
    await page.locator('[data-coord="0,2"]').click();
    await page.clock.runFor(1_000);
    expect(saves).toBe(1);
  });

  test('an in-flight acknowledgement cannot erase newer local edits and later writes wait for it', async ({ page }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    await openPlay(page, fixture.id);
    const held = gate();
    const secondHeld = gate();
    const sessionId = (await readPlaySessions(fixture.id))[0].id;
    let saves = 0;
    const bodies: string[] = [];
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (!route.request().headers()['next-action']) return route.continue();
      const index = ++saves;
      // Read upstream before forwarding, avoiding Chromium 568852319's
      // discarded no-store DevTools bodies (the frozen P1 capture pattern).
      const response = await route.fetch();
      bodies.push(await response.text());
      if (index === 1) await held.promise;
      if (index === 2) await secondHeld.promise;
      await route.fulfill({ response });
    });
    await pauseBrowserClock(page);
    try {
      await page.keyboard.type('a');
      await page.clock.runFor(500);
      await expect.poll(() => bodies.length).toBe(1);
      await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'saving');
      const first = blankEntries();
      first.cells[0][0] = { kind: 'active', letter: 'A' };
      expect((await readPlaySessions(fixture.id))[0].entries).toEqual(first);
      await page.keyboard.type('b');
      await page.clock.runFor(500);
      await expectLetters(page, { '0,0': 'A', '1,0': 'B' });
      expect(saves).toBe(1); // the second debounce elapsed while response 1 is held
      expect((await readPlaySessions(fixture.id))[0].entries).toEqual(first);
      const latest = blankEntries();
      latest.cells[0][0] = { kind: 'active', letter: 'A' };
      latest.cells[0][1] = { kind: 'active', letter: 'B' };
      expect(await readDraft(page, sessionId)).toEqual(latest);
      held.release();
      await expect.poll(() => bodies.length).toBe(2);
      // ACK 1 has been processed, but ACK 2 is still held. The obsolete A
      // acknowledgement must not remove the newer AB recovery snapshot.
      expect(await readDraft(page, sessionId)).toEqual(latest);
      await expectLetters(page, { '0,0': 'A', '1,0': 'B' });
      secondHeld.release();
      await expectSavedEntries(page, fixture.id, latest);
      await expect.poll(() => readDraft(page, sessionId)).toBeNull();
      expect((await readPlaySessions(fixture.id))[0].entries).toEqual(latest);
      expect(bodies).toHaveLength(2);
      for (const body of bodies) expect(body.length).toBeGreaterThan(0);
    } finally {
      held.release();
      secondHeld.release();
    }
  });

  test('a failed save stays unsaved, preserves typing, and Retry saves the newest local snapshot', async ({ page }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    await openPlay(page, fixture.id);
    const before = await readPlaySessions(fixture.id);
    let saves = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action'] && ++saves === 1) await route.abort('failed');
      else await route.continue();
    });
    await pauseBrowserClock(page);
    await page.keyboard.type('a');
    await page.clock.runFor(500);
    await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'error');
    await expect(page.getByTestId('play-puzzle').getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expectLetters(page, { '0,0': 'A' });
    expect(await readPlaySessions(fixture.id)).toEqual(before);
    const failedDraft = blankEntries();
    failedDraft.cells[0][0] = { kind: 'active', letter: 'A' };
    expect(await readDraft(page, before[0].id)).toEqual(failedDraft);
    await page.keyboard.type('b');
    await expectLetters(page, { '0,0': 'A', '1,0': 'B' });
    const expected = blankEntries();
    expected.cells[0][0] = { kind: 'active', letter: 'A' };
    expected.cells[0][1] = { kind: 'active', letter: 'B' };
    expect(await readDraft(page, before[0].id)).toEqual(expected);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expectSavedEntries(page, fixture.id, expected);
    await expect.poll(() => readDraft(page, before[0].id)).toBeNull();
    expect((await readPlaySessions(fixture.id))[0]).toEqual({ ...before[0], entries: expected });
    expect(saves).toBe(2);
    await page.clock.runFor(1_000);
    expect(saves).toBe(2); // retry cancels an obsolete queued debounce
  });

  test('reopening preserves wrong and rebus strings, and saves new letters and deletion without changing untouched entries', async ({ page }) => {
    const player = await currentBuilderId(page);
    const fixture = await seedPlayPuzzle({ builderId: player });
    let entries = clearLetters(fixture.puzzle.grid);
    entries = withLetter(entries, { col: 0, row: 0 }, 'Z');
    entries = withLetter(entries, { col: 1, row: 0 }, 'HEART');
    entries = withLetter(entries, { col: 0, row: 2 }, 'M');
    await seedPlaySession(player, fixture.id, entries);
    const before = await readPlaySessions(fixture.id);
    await openPlay(page, fixture.id);
    await expectLetters(page, { '0,0': 'Z', '1,0': 'HEART', '2,0': '', '0,2': 'M' });
    await page.locator('[data-coord="2,0"]').click();
    await page.keyboard.type('q');
    await page.locator('[data-coord="0,2"]').click();
    await page.keyboard.press('Backspace');
    const expected = serializeGrid(withLetter(withLetter(entries, { col: 2, row: 0 }, 'Q'), { col: 0, row: 2 }, null));
    await expectSavedEntries(page, fixture.id, expected);
    expect((await readPlaySessions(fixture.id))[0]).toEqual({ ...before[0], entries: expected });
    await page.reload();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expectLetters(page, { '0,0': 'Z', '1,0': 'HEART', '2,0': 'Q', '0,2': '' });
    expect((await readPlaySessions(fixture.id))[0]).toEqual({ ...before[0], entries: expected });
    await page.locator('[data-coord="1,0"]').click();
    await page.keyboard.type('r');
    const overtyped = structuredClone(expected);
    overtyped.cells[0][1] = { kind: 'active', letter: 'R' };
    await expectSavedEntries(page, fixture.id, overtyped);
    await expectLetters(page, { '1,0': 'R' });
    expect((await readPlaySessions(fixture.id))[0].entries.cells[0][1]).toEqual({ kind: 'active', letter: 'R' });
  });

  test('actual browser saves isolate players and puzzles, including a builder playing their own private puzzle', async ({ page, browser }) => {
    const player = await currentBuilderId(page);
    const target = await seedPlayPuzzle({ builderId: await seedOtherBuilder() });
    const own = await seedPlayPuzzle({ builderId: player, visibility: 'private' });
    const targetBefore = await readPlayPuzzle(target.id);
    const ownBefore = await readPlayPuzzle(own.id);
    await openPlay(page, target.id);
    const firstSession = (await readPlaySessions(target.id))[0];
    await page.keyboard.type('a');
    const firstEntries = blankEntries();
    firstEntries.cells[0][0] = { kind: 'active', letter: 'A' };
    await expectSavedEntries(page, target.id, firstEntries);
    const firstSaved = (await readPlaySessions(target.id))[0];
    expect(firstSaved).toEqual({ ...firstSession, entries: firstEntries });
    await openPlay(page, own.id);
    await page.keyboard.type('b');
    const ownEntries = blankEntries();
    ownEntries.cells[0][0] = { kind: 'active', letter: 'B' };
    await expectSavedEntries(page, own.id, ownEntries);
    const ownSaved = await readPlaySessions(own.id);
    expect(ownSaved[0].entries.cells[0][0]).toEqual({ kind: 'active', letter: 'B' });

    const otherContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    try {
      const otherPage = await otherContext.newPage();
      await signInSeededUser(otherPage);
      const otherPlayer = await currentBuilderId(otherPage);
      await openPlay(otherPage, target.id);
      await expectLetters(otherPage, { '0,0': '' });
      await otherPage.keyboard.type('z');
      const otherEntries = blankEntries();
      otherEntries.cells[0][0] = { kind: 'active', letter: 'Z' };
      await expectSavedEntries(otherPage, target.id, otherEntries, otherPlayer);
      const sessions = await readPlaySessions(target.id);
      expect(sessions).toHaveLength(2);
      expect(sessions.find((session) => session.userId === player)).toEqual(firstSaved);
      expect(sessions.find((session) => session.userId === otherPlayer)?.entries.cells[0][0]).toEqual({ kind: 'active', letter: 'Z' });
      expect(await readPlaySessions(own.id)).toEqual(ownSaved);
      expect(await readPlayPuzzle(target.id)).toEqual(targetBefore);
      expect(await readPlayPuzzle(own.id)).toEqual(ownBefore);
    } finally {
      await otherContext.close();
    }
  });

  for (const departure of ['reload', 'close tab', 'in-app navigation'] as const) {
    test(`pending letters and deletion survive immediate ${departure} without a close warning`, async ({ page, context }) => {
      const player = await currentBuilderId(page);
      const fixture = await seedPlayPuzzle({ builderId: player });
      const original = withLetter(clearLetters(fixture.puzzle.grid), { col: 0, row: 0 }, 'R');
      const sessionId = await seedPlaySession(player, fixture.id, original);
      await openPlay(page, fixture.id);
      const before = await readPlaySessions(fixture.id);
      await pauseBrowserClock(page);
      const dialogs: string[] = [];
      page.on('dialog', async (dialog) => {
        dialogs.push(dialog.type());
        await dialog.accept();
      });
      await page.keyboard.press('Backspace');
      await page.locator('[data-coord="1,0"]').click();
      await page.keyboard.type('q');
      const pending = blankEntries();
      pending.cells[0][1] = { kind: 'active', letter: 'Q' };
      // App time has not advanced: neither the deletion nor letter can have
      // reached its debounce. The exact grid is already durable locally.
      expect(await readDraft(page, sessionId)).toEqual(pending);
      expect(await readPlaySessions(fixture.id)).toEqual(before);
      let reopened = page;
      if (departure === 'reload') {
        await page.reload();
      } else if (departure === 'close tab') {
        await page.close({ runBeforeUnload: true });
        await expect.poll(() => page.isClosed()).toBe(true);
        reopened = await context.newPage();
        await pauseBrowserClock(reopened);
        await openPlay(reopened, fixture.id, { select: false });
      } else {
        await page.getByTestId('home-link').click();
        await expect(page).not.toHaveURL(new RegExp(`/puzzles/${fixture.id}/play$`));
        await openPlay(page, fixture.id, { select: false });
      }
      await expect(reopened.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
      await expectLetters(reopened, { '0,0': '', '1,0': 'Q' });
      // 17-S2: the reopened puzzle opens on its first empty cell, focused.
      await expectSelected(reopened, '0,0');
      await expect(reopened.getByTestId('play-grid-region')).toBeFocused();
      expect(dialogs).toEqual([]);
      await reopened.clock.runFor(500);
      await expectSavedEntries(reopened, fixture.id, pending);
      await expect.poll(() => readDraft(reopened, sessionId)).toBeNull();
      expect((await readPlaySessions(fixture.id))[0]).toEqual({ ...before[0], entries: pending });
    });
  }

  test('local recovery waits for successful authenticated start and remains unavailable after a failed start', async ({ page }) => {
    const player = await currentBuilderId(page);
    const fixture = await seedPlayPuzzle({ builderId: player });
    const sessionId = await seedPlaySession(player, fixture.id, clearLetters(fixture.puzzle.grid));
    const pending = blankEntries();
    pending.cells[0][0] = { kind: 'active', letter: 'Z' };
    await page.goto('/puzzles');
    await storeDraft(page, sessionId, JSON.stringify(pending));
    await page.addInitScript((key) => {
      const state = window as typeof window & { __playDraftReads: number };
      state.__playDraftReads = 0;
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = function (candidate) {
        if (candidate === key) state.__playDraftReads++;
        return original.call(this, candidate);
      };
    }, draftKey(sessionId));
    const held = gate();
    let starts = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (!route.request().headers()['next-action']) return route.continue();
      if (++starts === 1) {
        await held.promise;
        await route.abort('failed');
      } else await route.continue();
    });
    try {
      await page.goto(`/puzzles/${fixture.id}/play`);
      await expect.poll(() => starts).toBe(1);
      await pauseBrowserClock(page);
      await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'starting');
      expect(await page.evaluate(() => (window as typeof window & { __playDraftReads: number }).__playDraftReads)).toBe(0);
      await expectLetters(page, { '0,0': '' });
      held.release();
      await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'error');
      expect(await page.evaluate(() => (window as typeof window & { __playDraftReads: number }).__playDraftReads)).toBe(0);
      await expectLetters(page, { '0,0': '' });
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
      await expectLetters(page, { '0,0': 'Z' });
      expect(await page.evaluate(() => (window as typeof window & { __playDraftReads: number }).__playDraftReads)).toBeGreaterThan(0);
      // 17-S2: it opens on the first cell the recovered draft leaves empty.
      await expectSelected(page, '1,0');
      expect((await readPlaySessions(fixture.id))[0].entries).toEqual(blankEntries());
      await page.clock.runFor(500);
      await expectSavedEntries(page, fixture.id, pending);
      await expect.poll(() => readDraft(page, sessionId)).toBeNull();
    } finally {
      held.release();
    }
  });

  for (const cacheCase of ['malformed JSON', 'wrong dimensions', 'changed black geometry', 'ragged rows', 'empty letter', 'equal server snapshot'] as const) {
    test(`${cacheCase} does not create a recovery write or replace the server view`, async ({ page }) => {
      const player = await currentBuilderId(page);
      const fixture = await seedPlayPuzzle({ builderId: player });
      const serverGrid = withLetter(clearLetters(fixture.puzzle.grid), { col: 0, row: 0 }, 'S');
      const sessionId = await seedPlaySession(player, fixture.id, serverGrid);
      const server = serializeGrid(serverGrid);
      const cached = blankEntries();
      cached.cells[0][0] = { kind: 'active', letter: 'Z' };
      if (cacheCase === 'wrong dimensions') cached.cols = 4;
      if (cacheCase === 'changed black geometry') cached.cells[1][1] = { kind: 'active', letter: 'Q' };
      if (cacheCase === 'ragged rows') cached.cells[0].pop();
      if (cacheCase === 'empty letter') cached.cells[0][0] = { kind: 'active', letter: '' };
      const value = cacheCase === 'malformed JSON' ? '{invalid' : JSON.stringify(cacheCase === 'equal server snapshot' ? server : cached);
      await page.goto('/puzzles');
      await storeDraft(page, sessionId, value);
      const before = await readPlaySessions(fixture.id);
      let actions = 0;
      await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
        if (route.request().headers()['next-action']) actions++;
        await route.continue();
      });
      await pauseBrowserClock(page);
      await openPlay(page, fixture.id, { select: false });
      await expectLetters(page, { '0,0': 'S', '1,0': '' });
      await expectSaved(page);
      await page.clock.runFor(1_000);
      expect(actions).toBe(1); // authenticated start only; no progress save
      expect(await readPlaySessions(fixture.id)).toEqual(before);
    });
  }

  test('draft recovery uses only the authenticated session and never another player or puzzle in the same browser storage', async ({ page }) => {
    const firstPlayer = await currentBuilderId(page);
    const target = await seedPlayPuzzle({ builderId: firstPlayer });
    const other = await seedPlayPuzzle({ builderId: firstPlayer });
    const originalGrid = clearLetters(target.puzzle.grid);
    const firstSession = await seedPlaySession(firstPlayer, target.id, originalGrid);
    const otherSession = await seedPlaySession(firstPlayer, other.id, originalGrid);
    const firstDraft = blankEntries();
    firstDraft.cells[0][0] = { kind: 'active', letter: 'A' };
    const otherDraft = blankEntries();
    otherDraft.cells[0][0] = { kind: 'active', letter: 'M' };
    await page.goto('/puzzles');
    await storeDraft(page, firstSession, JSON.stringify(firstDraft));
    await storeDraft(page, otherSession, JSON.stringify(otherDraft));
    await signInSeededUser(page);
    const secondPlayer = await currentBuilderId(page);
    expect(secondPlayer).not.toBe(firstPlayer);
    await openPlay(page, target.id, { select: false });
    await expectLetters(page, { '0,0': '' });
    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.type('z');
    const secondEntries = blankEntries();
    secondEntries.cells[0][0] = { kind: 'active', letter: 'Z' };
    await expectSavedEntries(page, target.id, secondEntries, secondPlayer);
    await openPlay(page, other.id, { select: false });
    await expectLetters(page, { '0,0': '' });
    expect(await readDraft(page, firstSession)).toEqual(firstDraft);
    expect(await readDraft(page, otherSession)).toEqual(otherDraft);
    const targetSessions = await readPlaySessions(target.id);
    expect(targetSessions.find((session) => session.id === firstSession)?.entries).toEqual(blankEntries());
    expect((await readPlaySessions(other.id)).find((session) => session.id === otherSession)?.entries).toEqual(blankEntries());
    expect((await readPlaySessions(other.id)).find((session) => session.userId === secondPlayer)?.entries).toEqual(blankEntries());
  });

  for (const unavailableMethod of ['getItem', 'setItem'] as const) {
    test(`localStorage ${unavailableMethod} failure warns without blocking edits or server saving`, async ({ page }) => {
      const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
      await page.addInitScript((method) => {
        if (method === 'getItem') {
          const original = Storage.prototype.getItem;
          Storage.prototype.getItem = function (key) {
            if (key.startsWith('crossward:play-draft:v1:')) throw new DOMException('Storage unavailable', 'SecurityError');
            return original.call(this, key);
          };
        } else {
          const original = Storage.prototype.setItem;
          Storage.prototype.setItem = function (key, value) {
            if (key.startsWith('crossward:play-draft:v1:')) throw new DOMException('Storage full', 'QuotaExceededError');
            return original.call(this, key, value);
          };
        }
      }, unavailableMethod);
      await openPlay(page, fixture.id);
      await page.keyboard.type('q');
      await expectLetters(page, { '0,0': 'Q' });
      await expect(page.getByTestId('play-local-save-warning')).toBeVisible();
      const saved = blankEntries();
      saved.cells[0][0] = { kind: 'active', letter: 'Q' };
      await expectSavedEntries(page, fixture.id, saved);
      await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
      await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
    });
  }

  test('a newer failed local write invalidates its older draft so server-confirmed edits cannot be undone on reopen', async ({ page }) => {
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    await openPlay(page, fixture.id);
    const sessionId = (await readPlaySessions(fixture.id))[0].id;
    await pauseBrowserClock(page);
    await page.keyboard.type('a');
    const older = blankEntries();
    older.cells[0][0] = { kind: 'active', letter: 'A' };
    expect(await readDraft(page, sessionId)).toEqual(older);
    // Reading/removing still works. Only the newer local write fails, leaving
    // an actual stale A snapshot unless the implementation invalidates it.
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith('crossward:play-draft:v1:')) throw new DOMException('Storage full', 'QuotaExceededError');
        return original.call(this, key, value);
      };
    });
    await page.keyboard.type('b');
    await expect(page.getByTestId('play-local-save-warning')).toBeVisible();
    expect(await readDraft(page, sessionId)).toBeNull();
    const latest = blankEntries();
    latest.cells[0][0] = { kind: 'active', letter: 'A' };
    latest.cells[0][1] = { kind: 'active', letter: 'B' };
    await page.clock.runFor(500);
    await expectSavedEntries(page, fixture.id, latest);
    await page.reload();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expectLetters(page, { '0,0': 'A', '1,0': 'B' });
    await page.clock.runFor(1_000);
    expect((await readPlaySessions(fixture.id))[0].entries).toEqual(latest);
  });

  test('save responses never disclose the solution or checking information', async ({ page }) => {
    const secret = `P2_SOLUTION_ONLY_${randomUUID()}`;
    const puzzle = playPuzzleFixture();
    const fixture = await seedPlayPuzzle({
      builderId: await currentBuilderId(page),
      puzzle: { ...puzzle, grid: withLetter(puzzle.grid, { col: 0, row: 0 }, secret) },
    });
    await openPlay(page, fixture.id);
    const bodies: string[] = [];
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      const response = await route.fetch();
      if (route.request().headers()['next-action']) bodies.push(await response.text());
      await route.fulfill({ response });
    });
    await page.keyboard.type('z');
    await expect.poll(() => bodies.length).toBe(1);
    await expectSaved(page);
    expect(bodies).toHaveLength(1);
    expect(bodies[0].length).toBeGreaterThan(0);
    expect(bodies[0]).not.toContain(secret);
    expect(await page.content()).not.toContain(secret);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('hint-answer')).toHaveCount(0);
  });

  test('a stored published grid without active cells stays ready, has no cursor, and cannot save edits', async ({ page }) => {
    const fixture = await seedPlayPuzzle({
      builderId: await currentBuilderId(page),
      puzzle: { grid: createGrid({ cols: 1, rows: 1, black: [{ col: 0, row: 0 }] }), phase: 'hints', hints: {} },
    });
    await openPlay(page, fixture.id, { select: false });
    const before = await readPlaySessions(fixture.id);
    let saves = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action']) saves++;
      await route.continue();
    });
    await pauseBrowserClock(page);
    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.type('a');
    for (const key of ['Backspace', 'ArrowRight', 'ArrowDown', 'Space']) await page.keyboard.press(key);
    await page.clock.runFor(1_000);
    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
    await expect(page.getByTestId('play-clue')).toHaveCount(0);
    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute('data-kind', 'black');
    expect(saves).toBe(0);
    expect(await readPlaySessions(fixture.id)).toEqual(before);
  });
});
