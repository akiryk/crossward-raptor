import { test, expect, type Page } from '@playwright/test';
import { deserializeGrid, type SerializedGrid } from '../src/lib/puzzle-storage';
import { currentBuilderId, ownershipTestClient, seedOtherBuilder } from './helpers/ownership';
import { readPlayPuzzle, readPlaySessions, seedPlayPuzzle, seedPlaySession } from './helpers/play-route';

// P4 acceptance uses literal expectations rather than the reset implementation.
const correct: SerializedGrid = {
  cols: 3, rows: 3,
  cells: [
    [{ kind: 'active', letter: 'C' }, { kind: 'active', letter: 'A' }, { kind: 'active', letter: 'T' }],
    [{ kind: 'active', letter: 'A' }, { kind: 'black' }, { kind: 'active', letter: 'A' }],
    [{ kind: 'active', letter: 'T' }, { kind: 'active', letter: 'E' }, { kind: 'active', letter: 'N' }],
  ],
};
function entries(state: 'empty' | 'partial' | 'incorrect' | 'complete' = 'partial'): SerializedGrid {
  const value = structuredClone(correct);
  if (state === 'empty') {
    for (const row of value.cells) for (const cell of row) if (cell.kind === 'active') cell.letter = null;
  } else if (state !== 'complete') {
    value.cells[0][0] = { kind: 'active', letter: 'Z' };
    if (state === 'partial') value.cells[2][2] = { kind: 'active', letter: null };
  }
  return value;
}
function key(id: string) { return `crossward:play-draft:v1:${id}`; }
async function draft(page: Page, id: string) {
  return page.evaluate((key) => localStorage.getItem(key), key(id));
}
async function seed(page: Page, state: Parameters<typeof entries>[0] = 'partial', builderId?: string) {
  const playerId = await currentBuilderId(page);
  const fixture = await seedPlayPuzzle({ builderId: builderId ?? playerId, visibility: 'private' });
  const sessionId = await seedPlaySession(playerId, fixture.id, deserializeGrid(entries(state)));
  if (state === 'complete') {
    const client = ownershipTestClient();
    try {
      await client.playSession.update({ where: { id: sessionId }, data: { completedAt: new Date('2026-01-04T04:05:06Z') } });
    } finally { await client.$disconnect(); }
  }
  return { ...fixture, sessionId, playerId };
}
async function open(page: Page, id: string) {
  await page.goto(`/puzzles/${id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
}
async function pauseClock(page: Page) {
  await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));
}
async function openReset(page: Page, via: 'button' | 'option' = 'button') {
  if (via === 'option') await page.getByTestId('play-options').click();
  await page.getByTestId(`play-reset-${via}`).click();
  await expect(page.getByTestId('play-reset-dialog')).toBeVisible();
}
async function reset(page: Page) { await page.getByTestId('play-reset-confirm').click(); }
type Fixture = Awaited<ReturnType<typeof seed>>;
function opener(via: 'button' | 'option') { return via === 'button' ? 'play-reset-button' : 'play-options'; }
async function ownRows(fixture: Fixture) {
  return (await readPlaySessions(fixture.id)).filter((row) => row.userId === fixture.playerId);
}
/** Reset finished in place: same URL, dialog closed, one fresh blank attempt saved and shown. */
async function expectFresh(page: Page, fixture: Fixture) {
  await expect(page.getByTestId('play-reset-dialog')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/puzzles/${fixture.id}/play$`));
  await expect.poll(async () => (await ownRows(fixture)).map((row) => row.id !== fixture.sessionId)).toEqual([true]);
  const [fresh] = await ownRows(fixture);
  expect(fresh.entries).toEqual(entries('empty')); expect(fresh.completedAt).toBeNull();
  expect(fresh.startedAt.getTime()).toBeGreaterThan(new Date('2026-01-03T04:05:06Z').getTime());
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
  await expectEntries(page, entries('empty'));
  await expect(page.getByTestId('play-lock-message')).toHaveCount(0);
  await expect(page.getByTestId('play-completed-mark')).toHaveCount(0);
  await expect(page.getByTestId('play-confetti')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  return fresh;
}
async function expectEntries(page: Page, expected: SerializedGrid) {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cell = expected.cells[row][col];
      if (cell.kind === 'active') {
        await expect.poll(() => page.locator(`[data-coord="${col},${row}"]`).evaluate((element) => {
          const clone = element.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('[data-testid="cell-number"]').forEach((number) => number.remove());
          return clone.textContent?.trim() ?? '';
        })).toBe(cell.letter ?? '');
      }
    }
  }
}
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

test.describe('P4 — reset', () => {
  test('every player has options; only the authenticated builder has the quiet visible shortcut', async ({ page }) => {
    const own = await seed(page);
    await open(page, own.id);
    await expect(page.getByTestId('play-options')).toHaveAccessibleName('Puzzle options');
    await expect(page.getByTestId('play-reset-button')).toBeVisible();
    await expect(page.getByTestId('play-reset-button')).toHaveAccessibleName('Reset puzzle');
    await expect(page.getByTestId('play-reset-option')).not.toBeVisible();
    await openReset(page, 'option');
    await expect(page.getByRole('dialog', { name: 'Reset puzzle?', exact: true })).toBeVisible();
    await expect(page.getByTestId('play-reset-option')).not.toBeVisible();
    await page.keyboard.press('Escape');
    await openReset(page);
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    const other = await seed(page, 'partial', await seedOtherBuilder());
    await open(page, other.id);
    await expect(page.getByTestId('play-reset-button')).toHaveCount(0);
    await page.getByTestId('play-options').focus();
    await page.keyboard.press('Enter');
    await page.getByTestId('play-reset-option').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Reset puzzle?', exact: true })).toBeVisible();
    expect((await readPlaySessions(other.id)).map((row) => row.id)).toEqual([other.sessionId]);
    await reset(page);
    await expectFresh(page, other);
    await expect(page.getByTestId('play-options')).toBeFocused();
  });

  test('reset is enabled only after a successful session start', async ({ page }) => {
    const fixture = await seed(page);
    const held = gate(); let starting = false;
    const url = `**/puzzles/${fixture.id}/play`;
    await page.route(url, async (route) => {
      if (route.request().headers()['next-action']) {
        starting = true; await held.promise; await route.abort('failed');
      } else await route.continue();
    });
    const enabledReset = page.locator('[data-testid="play-reset-button"]:enabled, [data-testid="play-reset-option"]:enabled');
    try {
      await page.goto(`/puzzles/${fixture.id}/play`);
      await expect.poll(() => starting).toBe(true);
      await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'starting');
      await expect(enabledReset).toHaveCount(0);
    } finally { held.release(); }
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'error');
    await expect(enabledReset).toHaveCount(0);
    expect((await readPlaySessions(fixture.id)).map((row) => row.id)).toEqual([fixture.sessionId]);
    await page.unroute(url);
    await page.getByRole('alert').getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expect(page.getByTestId('play-reset-button')).toBeEnabled();
    await expect(page.getByTestId('play-options')).toBeEnabled();
  });

  for (const via of ['button', 'option'] as const) {
    test(`the ${via} confirmation uses Modal semantics, traps focus and restores focus to ${opener(via)}`, async ({ page }) => {
      const fixture = await seed(page);
      await open(page, fixture.id);
      await openReset(page, via);
      const dialog = page.getByTestId('play-reset-dialog');
      await expect(dialog).toHaveAttribute('role', 'dialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAccessibleName('Reset puzzle?');
      await expect(dialog).toBeFocused();
      await expect(dialog).toContainText(/cannot be undone/i);
      await expect(dialog).toContainText(/completion/i);
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
      for (const direction of ['Tab', 'Shift+Tab']) {
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press(direction);
          expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
        }
      }
      await page.keyboard.type('x');
      await expect(page.locator('[data-coord="0,0"]')).not.toContainText('X');
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(page.getByTestId(opener(via))).toBeFocused();
      await expect(page.getByTestId('play-reset-option')).not.toBeVisible();
    });
  }

  test('cancelling a completed attempt preserves its timestamp, lock and completed mark', async ({ page }) => {
    const fixture = await seed(page, 'complete');
    await open(page, fixture.id);
    const before = await readPlaySessions(fixture.id);
    expect(before[0].completedAt).toBeInstanceOf(Date);
    await openReset(page, 'option');
    await page.getByTestId('play-reset-cancel').click();
    expect(await readPlaySessions(fixture.id)).toEqual(before);
    await expect(page.getByTestId('play-lock-message')).toBeVisible();
    await expect(page.getByTestId('play-completed-mark')).toBeVisible();
    await expectEntries(page, correct);
  });

  for (const dismissal of ['cancel', 'Escape', 'close', 'backdrop'] as const) {
    test(`${dismissal} preserves saved entries and pending draft`, async ({ page }) => {
      const fixture = await seed(page);
      await open(page, fixture.id);
      await pauseClock(page);
      await page.locator('[data-coord="0,0"]').click();
      await page.keyboard.type('q');
      const beforeRows = await readPlaySessions(fixture.id);
      const beforeDraft = await draft(page, fixture.sessionId);
      expect(beforeDraft).not.toBeNull();
      await openReset(page);
      if (dismissal === 'cancel') await page.getByTestId('play-reset-cancel').click();
      if (dismissal === 'Escape') await page.keyboard.press('Escape');
      if (dismissal === 'close') await page.getByTestId('play-reset-dialog').getByTestId('modal-close').click();
      if (dismissal === 'backdrop') await page.getByTestId('modal-backdrop').click({ position: { x: 2, y: 2 } });
      await expect(page.getByTestId('play-reset-dialog')).toHaveCount(0);
      expect(await readPlaySessions(fixture.id)).toEqual(beforeRows);
      expect(await draft(page, fixture.sessionId)).toBe(beforeDraft);
      await expect(page.getByTestId('play-reset-button')).toBeFocused();
      const pending = entries(); pending.cells[0][0] = { kind: 'active', letter: 'Q' };
      await expectEntries(page, pending);
      await page.clock.runFor(500);
      await expect.poll(async () => (await readPlaySessions(fixture.id))[0].entries).toEqual(pending);
    });
  }

  for (const state of ['empty', 'partial', 'incorrect', 'complete'] as const) {
    test(`reset of a ${state} attempt replaces only that row with a fresh blank attempt in place`, async ({ page }) => {
      const via = state === 'complete' ? 'option' : 'button';
      const fixture = await seed(page, state);
      const otherPlayer = await seedOtherBuilder();
      await seedPlaySession(otherPlayer, fixture.id, deserializeGrid(entries('incorrect')));
      const unrelated = await seed(page);
      const unrelatedBefore = await readPlaySessions(unrelated.id);
      const otherBefore = (await readPlaySessions(fixture.id)).find((row) => row.userId === otherPlayer);
      const puzzleBefore = await readPlayPuzzle(fixture.id);
      await open(page, fixture.id);
      if (state === 'complete') await expect(page.getByTestId('play-lock-message')).toBeVisible();
      const cluesBefore = await page.getByTestId('play-clues').innerText();
      await openReset(page, via);
      await reset(page);
      const fresh = await expectFresh(page, fixture);
      await expect(page.getByTestId(opener(via))).toBeFocused();
      expect((await readPlaySessions(fixture.id)).find((row) => row.userId === otherPlayer)).toEqual(otherBefore);
      expect(await readPlayPuzzle(fixture.id)).toEqual(puzzleBefore);
      expect(await readPlaySessions(unrelated.id)).toEqual(unrelatedBefore);
      expect(await page.getByTestId('play-clues').innerText()).toBe(cluesBefore);
      await expect(page.getByTestId('cell-number')).toHaveCount(3);
      await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute('data-kind', 'black');
      await expect(page.locator('[data-selected="true"], [data-highlight="slot"]')).toHaveCount(0);
      // Reload shows the same fresh attempt; no further row is created.
      await open(page, fixture.id);
      expect(await ownRows(fixture)).toEqual([fresh]);
      await expectEntries(page, entries('empty'));
      await page.locator('[data-coord="0,0"]').click(); await page.keyboard.type('x');
      const typed = entries('empty'); typed.cells[0][0] = { kind: 'active', letter: 'X' };
      await expect.poll(async () => (await ownRows(fixture)).map((row) => [row.id, row.entries])).toEqual([[fresh.id, typed]]);
    });
  }

  test('success cancels a pending debounce and removes only the old draft', async ({ page }) => {
    const fixture = await seed(page); await open(page, fixture.id); await pauseClock(page);
    await page.evaluate(() => {
      localStorage.setItem('crossward:play-draft:v1:unrelated-attempt', 'keep-draft');
      localStorage.setItem('p4-unrelated-preference', 'keep-preference');
    });
    await page.locator('[data-coord="0,0"]').click(); await page.keyboard.type('q');
    expect(await draft(page, fixture.sessionId)).not.toBeNull();
    await openReset(page); await reset(page);
    const fresh = await expectFresh(page, fixture);
    expect(await draft(page, fixture.sessionId)).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('crossward:play-draft:v1:unrelated-attempt'))).toBe('keep-draft');
    expect(await page.evaluate(() => localStorage.getItem('p4-unrelated-preference'))).toBe('keep-preference');
    await page.clock.runFor(1500);
    expect(await ownRows(fixture)).toEqual([fresh]);
    await expectEntries(page, entries('empty'));
  });

  test('pending reset disables duplicate confirmation, every dismissal and editing without claiming success', async ({ page }) => {
    const fixture = await seed(page); await open(page, fixture.id); await openReset(page);
    const before = await readPlaySessions(fixture.id);
    const held = gate(); let requests = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action']) { requests++; await held.promise; }
      await route.continue();
    });
    try {
      await reset(page); await expect.poll(() => requests).toBe(1);
      await expect(page.getByTestId('play-reset-pending')).toBeVisible();
      await expect(page.getByTestId('play-reset-confirm')).toBeDisabled();
      await expect(page.getByTestId('play-reset-cancel')).toBeDisabled();
      await expect(page.getByTestId('play-reset-dialog').getByTestId('modal-close')).toBeDisabled();
      await page.keyboard.press('Escape');
      await page.getByTestId('modal-backdrop').click({ position: { x: 2, y: 2 } });
      await page.keyboard.type('x');
      await expect(page.getByTestId('play-reset-dialog')).toBeVisible();
      await expectEntries(page, entries());
      expect(await readPlaySessions(fixture.id)).toEqual(before); expect(requests).toBe(1);
    } finally { held.release(); }
    await expectFresh(page, fixture);
    expect(requests).toBe(1);
  });

  for (const committed of [false, true]) {
    test(`${committed ? 'lost reset acknowledgement' : 'failed reset'} retains the draft and retries idempotently`, async ({ page }) => {
      const fixture = await seed(page); await open(page, fixture.id); await pauseClock(page);
      await page.locator('[data-coord="0,0"]').click(); await page.keyboard.type('q');
      const beforeDraft = await draft(page, fixture.sessionId);
      const beforeRows = await readPlaySessions(fixture.id);
      let attempts = 0;
      await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
        if (route.request().headers()['next-action'] && ++attempts === 1) {
          if (committed) { const response = await route.fetch(); expect(response.ok()).toBe(true); }
          await route.abort('failed');
        } else await route.continue();
      });
      await openReset(page); await reset(page);
      await expect(page.getByTestId('play-reset-error')).toBeVisible();
      await expect(page.getByTestId('play-reset-confirm')).toBeEnabled();
      await expect(page.getByTestId('play-reset-cancel')).toBeEnabled();
      expect(await draft(page, fixture.sessionId)).toBe(beforeDraft);
      const afterFailure = await ownRows(fixture);
      if (committed) {
        expect(afterFailure).toHaveLength(1);
        expect(afterFailure[0].id).not.toBe(fixture.sessionId);
        expect(afterFailure[0].entries).toEqual(entries('empty'));
      } else expect(await readPlaySessions(fixture.id)).toEqual(beforeRows);
      const pending = entries(); pending.cells[0][0] = { kind: 'active', letter: 'Q' };
      await expectEntries(page, pending);
      await reset(page);
      const fresh = await expectFresh(page, fixture);
      if (committed) expect(fresh).toEqual(afterFailure[0]);
      expect(await draft(page, fixture.sessionId)).toBeNull(); expect(attempts).toBe(2);
      await page.clock.runFor(1500);
      expect(await ownRows(fixture)).toEqual([fresh]);
    });
  }

  test('cancelling after reset failure resumes saving the preserved pending edit', async ({ page }) => {
    const fixture = await seed(page); await open(page, fixture.id); await pauseClock(page);
    await page.locator('[data-coord="0,0"]').click(); await page.keyboard.type('q');
    let aborted = false;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action'] && !aborted) { aborted = true; await route.abort('failed'); }
      else await route.continue();
    });
    await openReset(page); await reset(page);
    await expect(page.getByTestId('play-reset-error')).toBeVisible();
    await page.getByTestId('play-reset-cancel').click();
    await page.clock.runFor(500);
    const pending = entries(); pending.cells[0][0] = { kind: 'active', letter: 'Q' };
    await expect.poll(async () => (await readPlaySessions(fixture.id))[0].entries).toEqual(pending);
    expect((await readPlaySessions(fixture.id))[0].id).toBe(fixture.sessionId);
    await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'saved');
  });

  test('reset failure preserves a completed timestamp and lock until cancelled', async ({ page }) => {
    const fixture = await seed(page, 'complete'); await open(page, fixture.id);
    const before = await readPlaySessions(fixture.id);
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action']) await route.abort('failed');
      else await route.continue();
    });
    await openReset(page); await reset(page);
    await expect(page.getByTestId('play-reset-error')).toBeVisible();
    expect(await readPlaySessions(fixture.id)).toEqual(before);
    expect(before[0].completedAt).toBeInstanceOf(Date);
    await page.getByTestId('play-reset-cancel').click();
    await expect(page.getByTestId('play-lock-message')).toBeVisible();
    await expect(page.getByTestId('play-completed-mark')).toBeVisible();
    await expectEntries(page, correct);
  });

  for (const phase of ['partial save', 'full save', 'inspection'] as const) {
    test(`reset waits out an in-flight ${phase} and ignores its late result`, async ({ page }) => {
      const fixture = await seed(page); await open(page, fixture.id);
      const held = gate(); const heldReset = gate();
      let actions = 0; let waiting = false; let resetting = false;
      await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
        if (!route.request().headers()['next-action']) { await route.continue(); return; }
        actions++;
        if (route.request().postData()?.includes(fixture.sessionId)) {
          resetting = true; await heldReset.promise; await route.continue();
        } else if (actions === (phase === 'inspection' ? 2 : 1)) {
          const response = await route.fetch();
          expect(response.ok()).toBe(true); waiting = true;
          await held.promise; await route.fulfill({ response });
        } else await route.continue();
      });
      try {
        // Correct the first cell while partial, then fill the final cell for full workflows.
        await pauseClock(page);
        await page.locator('[data-coord="0,0"]').click(); await page.keyboard.type('c');
        if (phase !== 'partial save') {
          await page.locator('[data-coord="2,2"]').click(); await page.keyboard.type('n');
        }
        await page.clock.runFor(500); await expect.poll(() => waiting).toBe(true);
        await openReset(page); await reset(page);
        await expect(page.getByTestId('play-reset-pending')).toBeVisible();
        expect((await readPlaySessions(fixture.id)).map((row) => row.id)).toEqual([fixture.sessionId]);
        expect(resetting).toBe(false);
        expect(actions).toBe(phase === 'inspection' ? 2 : 1);
        held.release();
        await expect.poll(() => resetting).toBe(true);
        await expect(page.getByTestId('play-reset-dialog')).toBeVisible();
        await expect(page.getByTestId('play-reset-pending')).toBeVisible();
        await expect(page.getByRole('dialog')).toHaveCount(1);
        await expect(page.getByTestId('play-completion-dialog')).toHaveCount(0);
        await expect(page.getByTestId('play-incorrect-dialog')).toHaveCount(0);
        await expect(page.getByTestId('play-confetti')).toHaveCount(0);
        expect(actions).toBe(phase === 'inspection' ? 3 : 2);
      } finally { held.release(); heldReset.release(); }
      const fresh = await expectFresh(page, fixture);
      await page.clock.runFor(1500);
      expect(await ownRows(fixture)).toEqual([fresh]);
      expect(actions).toBe(phase === 'inspection' ? 3 : 2);
      await expectEntries(page, entries('empty'));
      await expect(page.getByTestId('play-lock-message')).toHaveCount(0);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByTestId('play-confetti')).toHaveCount(0);
    });
  }

  test('reset remains available after a failed entries save', async ({ page }) => {
    const fixture = await seed(page); await open(page, fixture.id);
    let actions = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action'] && ++actions === 1) await route.abort('failed');
      else await route.continue();
    });
    await page.locator('[data-coord="0,0"]').click(); await page.keyboard.type('q');
    await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'error');
    await openReset(page); await reset(page);
    await expectFresh(page, fixture);
  });

  test('blocked local draft cleanup cannot fail reset or recover the old attempt into the fresh one', async ({ page }) => {
    const fixture = await seed(page); await open(page, fixture.id); await pauseClock(page);
    await page.locator('[data-coord="0,0"]').click(); await page.keyboard.type('q');
    const oldDraft = await draft(page, fixture.sessionId); expect(oldDraft).not.toBeNull();
    await page.evaluate((draftKey) => {
      const original = Storage.prototype.removeItem;
      Storage.prototype.removeItem = function (key: string) {
        if (key === draftKey) throw new DOMException('Blocked by P4 fixture', 'SecurityError');
        return original.call(this, key);
      };
    }, key(fixture.sessionId));
    await openReset(page); await reset(page);
    const fresh = await expectFresh(page, fixture);
    expect(await draft(page, fixture.sessionId)).toBe(oldDraft);
    await open(page, fixture.id);
    await expectEntries(page, entries('empty'));
    await page.clock.runFor(500);
    expect(await ownRows(fixture)).toEqual([fresh]);
  });
});
