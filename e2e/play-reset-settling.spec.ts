import { test, expect, type Page } from '@playwright/test';
import { deserializeGrid, type SerializedGrid } from '../src/lib/puzzle-storage';
import { currentBuilderId, ownershipTestClient } from './helpers/ownership';
import { readPlaySessions, seedPlayPuzzle, seedPlaySession } from './helpers/play-route';

// P6 acceptance: a reset that returns a full (stale-ID) attempt stays pending
// in its dialog until that attempt is ready, so no keystroke lands in limbo.
const correct: SerializedGrid = {
  cols: 3, rows: 3,
  cells: [
    [{ kind: 'active', letter: 'C' }, { kind: 'active', letter: 'A' }, { kind: 'active', letter: 'T' }],
    [{ kind: 'active', letter: 'A' }, { kind: 'black' }, { kind: 'active', letter: 'A' }],
    [{ kind: 'active', letter: 'T' }, { kind: 'active', letter: 'E' }, { kind: 'active', letter: 'N' }],
  ],
};
function entries(state: 'partial' | 'incorrect' | 'complete'): SerializedGrid {
  const value = structuredClone(correct);
  if (state !== 'complete') {
    value.cells[0][0] = { kind: 'active', letter: 'Z' };
    if (state === 'partial') value.cells[2][2] = { kind: 'active', letter: null };
  }
  return value;
}
const completedAt = new Date('2026-01-04T04:05:06Z');

/** The page loads attempt A; another tab then replaces it with a full attempt B. */
async function staleFixture(page: Page, replacement: 'incorrect' | 'complete') {
  const playerId = await currentBuilderId(page);
  const fixture = await seedPlayPuzzle({ builderId: playerId, visibility: 'private' });
  const sessionId = await seedPlaySession(playerId, fixture.id, deserializeGrid(entries('partial')));
  await page.goto(`/puzzles/${fixture.id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
  const client = ownershipTestClient();
  let replacementId: string;
  try {
    await client.playSession.delete({ where: { id: sessionId } });
    replacementId = await seedPlaySession(playerId, fixture.id, deserializeGrid(entries(replacement)));
    if (replacement === 'complete') {
      await client.playSession.update({ where: { id: replacementId }, data: { completedAt } });
    }
  } finally { await client.$disconnect(); }
  const [row] = await readPlaySessions(fixture.id);
  return { ...fixture, sessionId, replacementId, replacement: row };
}
type Fixture = Awaited<ReturnType<typeof staleFixture>>;

/** Holds the first server action after the reset request: the returned attempt's completion check. */
async function holdCheckAfterReset(page: Page, fixture: Fixture, outcome: 'continue' | 'abort' = 'continue') {
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  const state = { resetSent: false, checking: false, laterActions: 0 };
  await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
    if (!route.request().headers()['next-action']) { await route.continue(); return; }
    if (route.request().postData()?.includes(fixture.sessionId)) {
      state.resetSent = true; await route.continue(); return;
    }
    if (state.resetSent && !state.checking) {
      state.checking = true; await held;
      if (outcome === 'abort') await route.abort('failed'); else await route.continue();
      return;
    }
    if (state.checking) state.laterActions++;
    await route.continue();
  });
  return { state, release };
}
async function openReset(page: Page, via: 'button' | 'option') {
  if (via === 'option') await page.getByTestId('play-options').click();
  await page.getByTestId(`play-reset-${via}`).click();
  await expect(page.getByTestId('play-reset-dialog')).toBeVisible();
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
/** While the returned attempt's check is held, the reset flow is still pending and modal. */
async function expectStillPending(page: Page) {
  const dialog = page.getByTestId('play-reset-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('play-reset-pending')).toBeVisible();
  await expect(page.getByTestId('play-reset-confirm')).toBeDisabled();
  await expect(page.getByTestId('play-reset-cancel')).toBeDisabled();
  await expect(dialog.getByTestId('modal-close')).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.getByTestId('modal-backdrop').click({ position: { x: 2, y: 2 } });
  await page.keyboard.type('x');
  await expect(dialog).toBeVisible();
  await expect(page.locator('[data-coord="0,0"]')).not.toContainText('X');
  await expect(page.getByRole('dialog')).toHaveCount(1);
}

test.describe('P6 — reset settles before closing', () => {
  test('a stale-ID reset returning a full incorrect attempt stays pending until it is shown editable', async ({ page }) => {
    const fixture = await staleFixture(page, 'incorrect');
    const check = await holdCheckAfterReset(page, fixture);
    try {
      await openReset(page, 'button');
      await page.getByTestId('play-reset-confirm').click();
      await expect.poll(() => check.state.checking).toBe(true);
      await expectStillPending(page);
    } finally { check.release(); }
    await expect(page.getByTestId('play-reset-dialog')).toHaveCount(0);
    await expect(page.getByTestId('play-reset-button')).toBeFocused();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expectEntries(page, entries('incorrect'));
    await expect(page.getByTestId('play-lock-message')).toHaveCount(0);
    await expect(page.getByTestId('play-incorrect-dialog')).toHaveCount(0);
    expect(await readPlaySessions(fixture.id)).toEqual([fixture.replacement]);

    // The first keystroke after the dialog closes edits and saves the returned attempt.
    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.press('Backspace');
    const edited = entries('incorrect'); edited.cells[0][0] = { kind: 'active', letter: null };
    await expectEntries(page, edited);
    await expect.poll(async () => (await readPlaySessions(fixture.id)).map((row) => [row.id, row.entries]))
      .toEqual([[fixture.replacementId, edited]]);
    await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'saved');
  });

  test('a stale-ID reset returning a completed attempt stays pending, then shows it locked without celebrating', async ({ page }) => {
    const fixture = await staleFixture(page, 'complete');
    const check = await holdCheckAfterReset(page, fixture);
    try {
      await openReset(page, 'option');
      await page.getByTestId('play-reset-confirm').click();
      await expect.poll(() => check.state.checking).toBe(true);
      await expectStillPending(page);
    } finally { check.release(); }
    await expect(page.getByTestId('play-reset-dialog')).toHaveCount(0);
    await expect(page.getByTestId('play-options')).toBeFocused();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expectEntries(page, correct);
    await expect(page.getByTestId('play-lock-message')).toBeVisible();
    await expect(page.getByTestId('play-completed-mark')).toBeVisible();
    await expect(page.getByTestId('play-confetti')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await readPlaySessions(fixture.id)).toEqual([fixture.replacement]);
    expect(check.state.laterActions).toBe(0);
  });

  test('a failed check of the returned attempt ends the reset flow at the start error, and Retry shows that attempt', async ({ page }) => {
    const fixture = await staleFixture(page, 'incorrect');
    await page.evaluate((key) => localStorage.setItem(key, '{}'), `crossward:play-draft:v1:${fixture.sessionId}`);
    const check = await holdCheckAfterReset(page, fixture, 'abort');
    try {
      await openReset(page, 'button');
      await page.getByTestId('play-reset-confirm').click();
      await expect.poll(() => check.state.checking).toBe(true);
    } finally { check.release(); }
    await expect(page.getByTestId('play-reset-dialog')).toHaveCount(0);
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'error');
    await expect(page.getByTestId('play-reset-button')).toBeDisabled();
    expect(await page.evaluate((key) => localStorage.getItem(key), `crossward:play-draft:v1:${fixture.sessionId}`))
      .toBeNull();
    expect(await readPlaySessions(fixture.id)).toEqual([fixture.replacement]);
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expectEntries(page, entries('incorrect'));
    expect(await readPlaySessions(fixture.id)).toEqual([fixture.replacement]);
  });
});
