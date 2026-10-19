import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { deserializeGrid, type SerializedGrid } from '../src/lib/puzzle-storage';
import { currentBuilderId, ownershipTestClient, seedOtherBuilder } from './helpers/ownership';
import {
  playPuzzleFixture,
  readPlayPuzzle,
  readPlaySessions,
  seedPlayPuzzle,
  seedPlaySession,
} from './helpers/play-route';

// P3 acceptance uses literal entries rather than the completion implementation.
const correct: SerializedGrid = {
  cols: 3, rows: 3,
  cells: [
    [{ kind: 'active', letter: 'C' }, { kind: 'active', letter: 'A' }, { kind: 'active', letter: 'T' }],
    [{ kind: 'active', letter: 'A' }, { kind: 'black' }, { kind: 'active', letter: 'A' }],
    [{ kind: 'active', letter: 'T' }, { kind: 'active', letter: 'E' }, { kind: 'active', letter: 'N' }],
  ],
};

function entries(options: { wrong?: boolean; lastBlank?: boolean } = {}): SerializedGrid {
  const value = structuredClone(correct);
  if (options.wrong) value.cells[0][0] = { kind: 'active', letter: 'Z' };
  if (options.lastBlank) value.cells[2][2] = { kind: 'active', letter: null };
  return value;
}

async function seed(page: Page, initial: SerializedGrid, options: {
  builderId?: string;
  completedAt?: Date;
  visibility?: 'public' | 'private';
} = {}) {
  const playerId = await currentBuilderId(page);
  const fixture = await seedPlayPuzzle({
    builderId: options.builderId ?? playerId,
    visibility: options.visibility,
  });
  const sessionId = await seedPlaySession(playerId, fixture.id, deserializeGrid(initial));
  if (options.completedAt) {
    // Editable setup changes only the synthetic row this test just created.
    const client = ownershipTestClient();
    try {
      await client.playSession.update({ where: { id: sessionId }, data: { completedAt: options.completedAt } });
    } finally {
      await client.$disconnect();
    }
  }
  return { ...fixture, sessionId, playerId };
}

async function open(page: Page, id: string) {
  await page.goto(`/puzzles/${id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
}

async function typeAt(page: Page, coord: string, value: string) {
  await page.locator(`[data-coord="${coord}"]`).click();
  await page.keyboard.type(value);
}

async function saved(page: Page) {
  await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'saved');
}

async function letter(page: Page, coord: string) {
  return page.locator(`[data-coord="${coord}"]`).evaluate((element) => {
    const copy = element.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('[data-testid="cell-number"]').forEach((number) => number.remove());
    return copy.textContent?.trim() ?? '';
  });
}

async function expectEntries(page: Page, expected: SerializedGrid) {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cell = expected.cells[row][col];
      if (cell.kind === 'active') await expect.poll(() => letter(page, `${col},${row}`)).toBe(cell.letter ?? '');
    }
  }
}

async function expectComplete(page: Page, id: string) {
  await expect(page.getByTestId('play-completed-mark')).toBeVisible();
  await expect(page.getByTestId('play-lock-message')).toBeVisible();
  await expect.poll(async () => (await readPlaySessions(id))[0]?.completedAt).toBeInstanceOf(Date);
  await expectEntries(page, correct);
}

function draftKey(sessionId: string) {
  return `crossward:play-draft:v1:${sessionId}`;
}

async function storeDraft(page: Page, sessionId: string, value: SerializedGrid) {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: draftKey(sessionId), value,
  });
}

async function readDraft(page: Page, sessionId: string) {
  return page.evaluate((key) => {
    const value = localStorage.getItem(key);
    return value === null ? null : JSON.parse(value);
  }, draftKey(sessionId));
}

async function pauseClock(page: Page) {
  await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));
}

test.describe('P3 — finishing a puzzle', () => {
  test('an incomplete grid stays silent, editable and unstamped', async ({ page }) => {
    const fixture = await seed(page, entries({ lastBlank: true }));
    const before = await readPlaySessions(fixture.id);
    await open(page, fixture.id);
    let actions = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action']) actions++;
      await route.continue();
    });
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('play-completed-mark')).toHaveCount(0);
    await expect(page.getByTestId('play-lock-message')).toHaveCount(0);
    await typeAt(page, '0,0', 'z');
    await saved(page);
    await expect.poll(async () => (await readPlaySessions(fixture.id))[0].entries).toEqual(entries({ wrong: true, lastBlank: true }));
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect((await readPlaySessions(fixture.id))[0].completedAt).toBe(before[0].completedAt);
    expect(actions).toBe(1); // Partial saves never request correctness.
  });

  test('empty to full wrong shows only generic feedback and preserves the guesses', async ({ page }) => {
    const initial = entries({ wrong: true, lastBlank: true });
    const fixture = await seed(page, initial);
    const puzzleBefore = await readPlayPuzzle(fixture.id);
    await open(page, fixture.id);
    await typeAt(page, '2,2', 'n');
    const dialog = page.getByTestId('play-incorrect-dialog');
    await expect(dialog).toHaveRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog.getByRole('heading')).toHaveText(/so close/i);
    await expect(dialog).toContainText(/incorrect|wrong/i);
    await expectEntries(page, entries({ wrong: true }));
    await expect(page.getByTestId('play-completed-mark')).toHaveCount(0);
    await expect(page.getByTestId('play-confetti')).toHaveCount(0);
    await expect(page.locator('[data-correct], [data-incorrect], [data-cell-state="incorrect"], [data-cell-state="correct"]')).toHaveCount(0);
    await expect(page.getByTestId('hint-answer')).toHaveCount(0);
    await saved(page);
    expect((await readPlaySessions(fixture.id))[0].completedAt).toBeNull();
    expect(await readPlayPuzzle(fixture.id)).toEqual(puzzleBefore);
  });

  test('the full wrong dialog dismisses through Escape, Close and backdrop and restores editing', async ({ page }) => {
    for (const dismissal of ['Escape', 'Close', 'backdrop'] as const) {
      const fixture = await seed(page, entries({ wrong: true, lastBlank: true }));
      await open(page, fixture.id);
      await typeAt(page, '2,2', 'n');
      const dialog = page.getByTestId('play-incorrect-dialog');
      await expect(dialog).toBeVisible();
      if (dismissal === 'Escape') await page.keyboard.press('Escape');
      if (dismissal === 'Close') await dialog.getByRole('button', { name: 'Close', exact: true }).click();
      if (dismissal === 'backdrop') await page.getByTestId('modal-backdrop').click({ position: { x: 5, y: 5 } });
      await expect(dialog).toHaveCount(0);
      await typeAt(page, '0,0', 'q');
      await expect.poll(() => letter(page, '0,0')).toBe('Q');
      await saved(page);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      expect((await readPlaySessions(fixture.id))[0].completedAt).toBeNull();
    }
  });

  test('full wrong replacements do not repeat feedback; erasing and refilling does', async ({ page }) => {
    const fixture = await seed(page, entries({ wrong: true, lastBlank: true }));
    await open(page, fixture.id);
    await typeAt(page, '2,2', 'n');
    await expect(page.getByTestId('play-incorrect-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await typeAt(page, '0,0', 'q');
    await saved(page);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.locator('[data-coord="2,2"]').click();
    await page.keyboard.press('Backspace');
    await expect.poll(() => letter(page, '2,2')).toBe('');
    await page.keyboard.type('n');
    await expect(page.getByTestId('play-incorrect-dialog')).toBeVisible();
    expect((await readPlaySessions(fixture.id))[0].completedAt).toBeNull();
  });

  test('erasing and refilling an already-saved full wrong grid re-arms feedback without rewriting it', async ({ page }) => {
    const fixture = await seed(page, entries({ wrong: true }));
    await open(page, fixture.id);
    await pauseClock(page);
    let actions = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action']) actions++;
      await route.continue();
    });
    await page.locator('[data-coord="2,2"]').click();
    await page.keyboard.press('Backspace');
    await expect.poll(() => letter(page, '2,2')).toBe('');
    await page.keyboard.type('n');
    await page.clock.runFor(500);
    await expect(page.getByTestId('play-incorrect-dialog')).toBeVisible();
    await saved(page);
    expect(actions).toBe(1); // Inspect the unchanged saved grid; do not rewrite it.
    expect((await readPlaySessions(fixture.id))[0].entries).toEqual(entries({ wrong: true }));
    expect((await readPlaySessions(fixture.id))[0].completedAt).toBeNull();
  });

  // P3's approved full-snapshot pending-input behavior.
  for (const heldAction of ['save', 'inspection'] as const) {
    test(`a full grid pauses editing during ${heldAction} and keeps its recoverable snapshot`, async ({ page }) => {
      const fixture = await seed(page, entries({ lastBlank: true }));
      await open(page, fixture.id);
      let actions = 0;
      let held = false;
      let release!: () => void;
      const gate = new Promise<void>((resolve) => { release = resolve; });
      await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
        if (route.request().headers()['next-action']) {
          actions++;
          if (actions === (heldAction === 'save' ? 1 : 2)) {
            held = true;
            await gate;
          }
        }
        await route.continue();
      });
      try {
        await typeAt(page, '2,2', 'n');
        await expect.poll(() => held).toBe(true);
        await typeAt(page, '0,0', 'z');
        await page.keyboard.press('Backspace');
        await expectEntries(page, correct);
        expect(await readDraft(page, fixture.sessionId)).toEqual(correct);
        await expect(page.getByTestId('play-completion-dialog')).toHaveCount(0);
        await expect(page.getByTestId('play-completed-mark')).toHaveCount(0);
        expect(actions).toBe(heldAction === 'save' ? 1 : 2);
      } finally {
        release();
      }
      await expect(page.getByTestId('play-completion-dialog')).toBeVisible();
      await expectComplete(page, fixture.id);
      await saved(page);
      await expect.poll(() => readDraft(page, fixture.sessionId)).toBeNull();
    });
  }

  test('a failed full save resumes editing and Retry saves the latest recoverable entries', async ({ page }) => {
    const fixture = await seed(page, entries({ lastBlank: true }));
    await open(page, fixture.id);
    let actions = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action'] && ++actions === 1) await route.abort('failed');
      else await route.continue();
    });
    await typeAt(page, '2,2', 'n');
    await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'error');
    await expect(page.getByTestId('play-completion-dialog')).toHaveCount(0);
    await expect(page.getByTestId('play-completed-mark')).toHaveCount(0);
    expect((await readPlaySessions(fixture.id))[0].entries).toEqual(entries({ lastBlank: true }));
    expect(await readDraft(page, fixture.sessionId)).toEqual(correct);
    await page.locator('[data-coord="2,2"]').click();
    await page.keyboard.press('Backspace');
    await expect.poll(() => letter(page, '2,2')).toBe('');
    await typeAt(page, '0,0', 'z');
    const latest = entries({ wrong: true, lastBlank: true });
    await expectEntries(page, latest);
    expect(await readDraft(page, fixture.sessionId)).toEqual(latest);
    await page.getByTestId('play-puzzle').getByRole('button', { name: 'Retry', exact: true }).click();
    await saved(page);
    await expect.poll(async () => (await readPlaySessions(fixture.id))[0].entries).toEqual(latest);
    await expect.poll(() => readDraft(page, fixture.sessionId)).toBeNull();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect((await readPlaySessions(fixture.id))[0].completedAt).toBeNull();
  });

  test('Retry reconciles a committed full save whose response was lost, even after local editing resumes', async ({ page }) => {
    const fixture = await seed(page, entries({ lastBlank: true }));
    await open(page, fixture.id);
    let actions = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action'] && ++actions === 1) {
        const response = await route.fetch();
        expect(response.ok()).toBe(true);
        await route.abort('failed'); // Commit succeeded; acknowledgement never arrives.
      } else await route.continue();
    });
    await typeAt(page, '2,2', 'n');
    await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'error');
    expect((await readPlaySessions(fixture.id))[0].entries).toEqual(correct);
    expect((await readPlaySessions(fixture.id))[0].completedAt).toBeNull();
    await expect(page.getByTestId('play-completed-mark')).toHaveCount(0);
    await typeAt(page, '0,0', 'z');
    await expectEntries(page, entries({ wrong: true }));
    expect(await readDraft(page, fixture.sessionId)).toEqual(entries({ wrong: true }));
    await page.getByTestId('play-puzzle').getByRole('button', { name: 'Retry', exact: true }).click();
    await expectComplete(page, fixture.id);
    await saved(page);
    await expect.poll(() => readDraft(page, fixture.sessionId)).toBeNull();
    expect(actions).toBe(2); // Inspect first and accept the canonical solved grid.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('play-lock-message')).toBeVisible();
    await expect(page.getByTestId('play-completed-mark')).toBeVisible();
    await typeAt(page, '0,0', 'q');
    await expectEntries(page, correct);
    await page.reload();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expectComplete(page, fixture.id);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('a failed initial inspection blocks editing and draft recovery until Retry confirms the solved grid', async ({ page }) => {
    const fixture = await seed(page, entries());
    await page.goto('/puzzles');
    const staleDraft = entries({ wrong: true, lastBlank: true });
    await storeDraft(page, fixture.sessionId, staleDraft);
    let actions = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action'] && ++actions === 2) await route.abort('failed');
      else await route.continue();
    });
    await page.goto(`/puzzles/${fixture.id}/play`);
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'error');
    await expect(page.getByTestId('play-grid-region')).toHaveAttribute('data-ready', 'false');
    await typeAt(page, '0,0', 'z');
    await page.keyboard.press('Backspace');
    await expectEntries(page, correct);
    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
    await expect(page.getByTestId('play-completed-mark')).toHaveCount(0);
    expect(await readDraft(page, fixture.sessionId)).toEqual(staleDraft);
    expect((await readPlaySessions(fixture.id))[0].completedAt).toBeNull();
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expectComplete(page, fixture.id);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('play-confetti')).toHaveCount(0);
    expect((await readPlaySessions(fixture.id))[0].entries).toEqual(correct);
  });

  test('correcting a full wrong grid celebrates once, stamps completion and locks', async ({ page }) => {
    const fixture = await seed(page, entries({ wrong: true }));
    const puzzleBefore = await readPlayPuzzle(fixture.id);
    const sessionBefore = (await readPlaySessions(fixture.id))[0];
    await open(page, fixture.id);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const editedAt = Date.now();
    await typeAt(page, '0,0', 'c');
    await expect(page.getByTestId('play-completion-dialog')).toBeVisible();
    await expect(page.getByTestId('play-completion-dialog').getByRole('heading')).toHaveText(/congratulations/i);
    await expect(page.getByTestId('play-confetti')).toBeVisible();
    await expect(page.getByTestId('play-confetti')).toHaveAttribute('aria-hidden', 'true');
    await expectComplete(page, fixture.id);
    const completed = (await readPlaySessions(fixture.id))[0];
    expect(completed).toMatchObject({
      id: sessionBefore.id, userId: fixture.playerId, puzzleId: fixture.id,
      startedAt: sessionBefore.startedAt, entries: correct,
    });
    expect(completed.completedAt!.getTime()).toBeGreaterThanOrEqual(editedAt - 1_000);
    expect(completed.completedAt!.getTime()).toBeLessThanOrEqual(Date.now() + 1_000);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('play-completion-dialog')).toHaveCount(0);
    await saved(page);
    await pauseClock(page);
    let lockedActions = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action']) lockedActions++;
      await route.continue();
    });
    await typeAt(page, '0,0', 'z');
    for (const key of ['Backspace', 'ArrowRight', 'ArrowDown', 'Space']) await page.keyboard.press(key);
    await page.clock.runFor(1_000);
    await expectEntries(page, correct);
    await expect(page.locator('[data-selected="true"], [data-highlight="slot"]')).toHaveCount(0);
    expect(lockedActions).toBe(0);
    expect(await readPlaySessions(fixture.id)).toEqual([completed]);
    expect(await readPlayPuzzle(fixture.id)).toEqual(puzzleBefore);
    await page.reload();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expectComplete(page, fixture.id);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('play-confetti')).toHaveCount(0);
    expect(await readPlaySessions(fixture.id)).toEqual([completed]);
  });

  test('filling the final correct cell celebrates and saves the complete entries', async ({ page }) => {
    const fixture = await seed(page, entries({ lastBlank: true }));
    await open(page, fixture.id);
    await typeAt(page, '2,2', 'n');
    await expect(page.getByTestId('play-completion-dialog')).toBeVisible();
    await expect(page.getByTestId('play-confetti')).toBeVisible();
    await expectComplete(page, fixture.id);
    await saved(page);
    await expect.poll(() => readDraft(page, fixture.sessionId)).toBeNull();
  });

  for (const metadata of ['null', 'existing'] as const) {
    test(`reopening correct entries with ${metadata} completion timestamp locks without celebration`, async ({ page }) => {
      const timestamp = new Date('2026-02-03T04:05:06Z');
      const fixture = await seed(page, entries(), { completedAt: metadata === 'existing' ? timestamp : undefined });
      const before = (await readPlaySessions(fixture.id))[0];
      await open(page, fixture.id);
      await expectComplete(page, fixture.id);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByTestId('play-confetti')).toHaveCount(0);
      await expect(page.locator('[data-selected="true"], [data-highlight="slot"]')).toHaveCount(0);
      await pauseClock(page);
      let lockedActions = 0;
      await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
        if (route.request().headers()['next-action']) lockedActions++;
        await route.continue();
      });
      await typeAt(page, '2,2', 'z');
      await page.keyboard.press('Backspace');
      await page.clock.runFor(1_000);
      await expectEntries(page, correct);
      expect(lockedActions).toBe(0);
      const after = (await readPlaySessions(fixture.id))[0];
      expect({ ...after, completedAt: before.completedAt }).toEqual(before);
      if (metadata === 'existing') expect(after.completedAt).toEqual(timestamp);
    });
  }

  test('a completion timestamp alone does not lock a wrong grid', async ({ page }) => {
    const timestamp = new Date('2026-02-03T04:05:06Z');
    const fixture = await seed(page, entries({ wrong: true }), { completedAt: timestamp });
    await open(page, fixture.id);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('play-completed-mark')).toHaveCount(0);
    await expect(page.getByTestId('play-lock-message')).toHaveCount(0);
    await typeAt(page, '0,0', 'q');
    await saved(page);
    await expect.poll(() => letter(page, '0,0')).toBe('Q');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect((await readPlaySessions(fixture.id))[0].completedAt).toEqual(timestamp);
  });

  test('reopening full wrong entries stays silent and editable', async ({ page }) => {
    const fixture = await seed(page, entries({ wrong: true }));
    await open(page, fixture.id);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expectEntries(page, entries({ wrong: true }));
    await typeAt(page, '2,2', 'q');
    await saved(page);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('play-lock-message')).toHaveCount(0);
    expect((await readPlaySessions(fixture.id))[0].completedAt).toBeNull();
  });

  test('solved server entries take precedence over a stale local draft', async ({ page }) => {
    const fixture = await seed(page, entries());
    await page.goto('/puzzles');
    await storeDraft(page, fixture.sessionId, entries({ wrong: true, lastBlank: true }));
    await open(page, fixture.id);
    await expectComplete(page, fixture.id);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('play-confetti')).toHaveCount(0);
    await saved(page);
    expect((await readPlaySessions(fixture.id))[0].entries).toEqual(correct);
    await page.reload();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expectEntries(page, correct);
  });

  for (const final of ['correct', 'wrong'] as const) {
    test(`closing with pending full ${final} entries recovers them without replaying wrong feedback`, async ({ page, context }) => {
      const fixture = await seed(page, entries({ wrong: final === 'wrong', lastBlank: true }));
      await open(page, fixture.id);
      await pauseClock(page);
      await typeAt(page, '2,2', 'n');
      const expected = entries({ wrong: final === 'wrong' });
      expect(await readDraft(page, fixture.sessionId)).toEqual(expected);
      expect((await readPlaySessions(fixture.id))[0].entries.cells[2][2]).toEqual({ kind: 'active', letter: null });
      await page.close();
      const returned = await context.newPage();
      await open(returned, fixture.id);
      await expectEntries(returned, expected);
      await returned.clock.runFor(500);
      await saved(returned);
      await expect.poll(async () => (await readPlaySessions(fixture.id))[0].entries).toEqual(expected);
      await expect(returned.getByTestId('play-incorrect-dialog')).toHaveCount(0);
      if (final === 'correct') await expectComplete(returned, fixture.id);
      else {
        await expect(returned.getByRole('dialog')).toHaveCount(0);
        expect((await readPlaySessions(fixture.id))[0].completedAt).toBeNull();
      }
    });
  }

  test('a failed completion inspection preserves the draft, reports failure and retries without false success', async ({ page }) => {
    const fixture = await seed(page, entries({ lastBlank: true }));
    await open(page, fixture.id);
    let actions = 0;
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      if (route.request().headers()['next-action'] && ++actions === 2) await route.abort('failed');
      else await route.continue();
    });
    await typeAt(page, '2,2', 'n');
    const error = page.getByTestId('play-completion-error');
    await expect(error).toBeVisible();
    await expect(error).toHaveRole('alert');
    await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'error');
    await expectEntries(page, correct);
    await expect(page.getByTestId('play-completion-dialog')).toHaveCount(0);
    await expect(page.getByTestId('play-confetti')).toHaveCount(0);
    await expect(page.getByTestId('play-completed-mark')).toHaveCount(0);
    expect((await readPlaySessions(fixture.id))[0].completedAt).toBeNull();
    expect(await readDraft(page, fixture.sessionId)).toEqual(correct);
    // A saved correct grid is server-locked even before its timestamp is set.
    // Keep the failed verification snapshot until Retry confirms its outcome.
    await typeAt(page, '0,0', 'z');
    await page.keyboard.press('Backspace');
    await expectEntries(page, correct);
    expect(await readDraft(page, fixture.sessionId)).toEqual(correct);
    expect(actions).toBe(2);
    await page.getByTestId('play-puzzle').getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByTestId('play-completion-dialog')).toBeVisible();
    await expectComplete(page, fixture.id);
    await saved(page);
    await expect.poll(() => readDraft(page, fixture.sessionId)).toBeNull();
    expect(actions).toBe(3); // Retry inspection only; the save already succeeded.
  });

  test('full incorrect inspection responses and feedback never disclose answer strings or coordinates', async ({ page }) => {
    const secret = `P3_SOLUTION_ONLY_${randomUUID()}`;
    const puzzle = playPuzzleFixture();
    const answer = {
      ...correct,
      cells: correct.cells.map((row) => row.map((cell) => ({ ...cell }))),
    };
    answer.cells[0][0] = { kind: 'active', letter: secret };
    const fixture = await seedPlayPuzzle({
      builderId: await currentBuilderId(page),
      puzzle: { ...puzzle, grid: deserializeGrid(answer) },
    });
    await seedPlaySession(await currentBuilderId(page), fixture.id, deserializeGrid(entries({ lastBlank: true })));
    await open(page, fixture.id);
    const actionBodies: string[] = [];
    await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
      const response = await route.fetch();
      if (route.request().headers()['next-action']) actionBodies.push(await response.text());
      await route.fulfill({ response });
    });
    await typeAt(page, '2,2', 'n');
    const dialog = page.getByTestId('play-incorrect-dialog');
    await expect(dialog).toBeVisible();
    expect(actionBodies.length).toBeGreaterThanOrEqual(2);
    for (const body of actionBodies) {
      expect(body.length).toBeGreaterThan(0);
      expect(body).not.toContain(secret);
      expect(body).not.toMatch(/"(?:incorrectCells|wrongCells|correctCells|solution|answers)"\s*:/);
    }
    expect(await page.content()).not.toContain(secret);
    await expect(dialog).not.toContainText('0,0');
    await expect(page.getByTestId('hint-answer')).toHaveCount(0);
  });

  for (const ownership of ['builder', 'another builder'] as const) {
    test(`completion for a private puzzle by ${ownership} affects only the authenticated pair`, async ({ page }) => {
      const builderId = ownership === 'builder' ? await currentBuilderId(page) : await seedOtherBuilder();
      const fixture = await seed(page, entries({ lastBlank: true }), { builderId, visibility: 'private' });
      const otherPlayer = await seedOtherBuilder();
      await seedPlaySession(otherPlayer, fixture.id, deserializeGrid(entries({ wrong: true, lastBlank: true })));
      const unrelated = await seed(page, entries({ wrong: true, lastBlank: true }));
      const otherBefore = (await readPlaySessions(fixture.id)).find((row) => row.userId === otherPlayer);
      const unrelatedBefore = await readPlaySessions(unrelated.id);
      const puzzleBefore = await readPlayPuzzle(fixture.id);
      await open(page, fixture.id);
      await typeAt(page, '2,2', 'n');
      await expect(page.getByTestId('play-completion-dialog')).toBeVisible();
      await expect(page.getByTestId('play-lock-message')).toBeVisible();
      await expect.poll(async () => (await readPlaySessions(fixture.id)).find((row) => row.userId === fixture.playerId)?.entries).toEqual(correct);
      const rows = await readPlaySessions(fixture.id);
      expect(rows.find((row) => row.userId === fixture.playerId)?.completedAt).not.toBeNull();
      expect(rows.find((row) => row.userId === otherPlayer)).toEqual(otherBefore);
      expect(await readPlaySessions(unrelated.id)).toEqual(unrelatedBefore);
      expect(await readPlayPuzzle(fixture.id)).toEqual(puzzleBefore);
    });
  }
});
