import { test, expect, type Locator, type Page } from '@playwright/test';
import { deserializeGrid, type SerializedGrid } from '../src/lib/puzzle-storage';
import { currentBuilderId, ownershipTestClient, seedOtherBuilder } from './helpers/ownership';
import { readPlaySessions, seedPlayPuzzle, seedPlaySession } from './helpers/play-route';

// P5 acceptance uses literal expectations rather than the library implementation.
const correct: SerializedGrid = {
  cols: 3, rows: 3,
  cells: [
    [{ kind: 'active', letter: 'C' }, { kind: 'active', letter: 'A' }, { kind: 'active', letter: 'T' }],
    [{ kind: 'active', letter: 'A' }, { kind: 'black' }, { kind: 'active', letter: 'A' }],
    [{ kind: 'active', letter: 'T' }, { kind: 'active', letter: 'E' }, { kind: 'active', letter: 'N' }],
  ],
};
type Attempt = 'none' | 'blank' | 'partial' | 'incorrect' | 'complete' | 'solved-unstamped';
function entries(state: Exclude<Attempt, 'none'> = 'partial'): SerializedGrid {
  const value = structuredClone(correct);
  if (state === 'blank') {
    for (const row of value.cells) for (const cell of row) if (cell.kind === 'active') cell.letter = null;
  } else if (state === 'partial' || state === 'incorrect') {
    value.cells[0][0] = { kind: 'active', letter: 'Z' };
    if (state === 'partial') value.cells[2][2] = { kind: 'active', letter: null };
  }
  return value;
}
function key(id: string) { return `crossward:play-draft:v1:${id}`; }

async function seed(page: Page, attempt: Attempt = 'partial', options: {
  builderId?: string; visibility?: 'public' | 'private'; published?: boolean;
} = {}) {
  const playerId = await currentBuilderId(page);
  const fixture = await seedPlayPuzzle({
    builderId: options.builderId ?? playerId,
    visibility: options.visibility ?? 'private',
    published: options.published,
  });
  if (attempt === 'none') return { ...fixture, playerId, sessionId: null };
  const sessionId = await seedPlaySession(playerId, fixture.id, deserializeGrid(entries(attempt)));
  if (attempt === 'complete') await stamp(sessionId);
  return { ...fixture, playerId, sessionId };
}
type Fixture = Awaited<ReturnType<typeof seed>>;
async function stamp(sessionId: string) {
  const client = ownershipTestClient();
  try {
    await client.playSession.update({ where: { id: sessionId }, data: { completedAt: new Date('2026-01-04T04:05:06Z') } });
  } finally { await client.$disconnect(); }
}
/** Pins recency explicitly; raw SQL bypasses Prisma's automatic updatedAt. */
async function setUpdatedAt(puzzleId: string, at: Date) {
  const client = ownershipTestClient();
  try {
    await client.$executeRaw`UPDATE "Puzzle" SET "updatedAt" = ${at} WHERE "id" = ${puzzleId}`;
  } finally { await client.$disconnect(); }
}
async function replaceAttempt(fixture: Fixture, state: Exclude<Attempt, 'none'>) {
  const client = ownershipTestClient();
  try {
    await client.playSession.delete({ where: { id: fixture.sessionId! } });
  } finally { await client.$disconnect(); }
  return seedPlaySession(fixture.playerId, fixture.id, deserializeGrid(entries(state)));
}
async function ownRows(fixture: Fixture) {
  return (await readPlaySessions(fixture.id)).filter((row) => row.userId === fixture.playerId);
}
function row(page: Page, title: string): Locator {
  return page.getByTestId('puzzle-list-item').filter({ hasText: title });
}
async function library(page: Page) {
  await page.goto('/puzzles');
  await page.waitForSelector('[data-testid="puzzle-library"][data-ready="true"]');
}
/** 14-S2: published puzzles are played from the library's Play view; Build lists the caller's own. */
async function showView(page: Page, view: 'Build' | 'Play') {
  const option = page.getByTestId('library-view').getByRole('radio', { name: view, exact: true });
  await option.check();
  await expect(option).toBeChecked();
}
async function playLibrary(page: Page) {
  await library(page);
  await showView(page, 'Play');
}
async function titlesInOrder(page: Page, titles: string[]) {
  const all = await page.getByTestId('puzzle-list-item').allTextContents();
  return titles.map((title) => all.findIndex((text) => text.includes(title)));
}
async function expectState(item: Locator, state: 'untouched' | 'in-progress' | 'completed') {
  await expect(item).toHaveAttribute('data-play-state', state);
  const cue = item.getByTestId('puzzle-play-state');
  const reset = item.getByTestId('puzzle-reset-button');
  if (state === 'untouched') {
    await expect(cue).toHaveCount(0);
    await expect(reset).toHaveCount(0);
    return;
  }
  await expect(cue).toBeVisible();
  // 14-S2: the title's bracketed marker; only a completed row offers Reset.
  if (state === 'in-progress') {
    await expect(cue).toHaveText('[in-play]');
    await expect(reset).toHaveCount(0);
    return;
  }
  await expect(cue).toHaveText('[complete]');
  await expect(reset).toBeVisible();
  await expect(reset).toHaveAccessibleName('Reset');
}
async function openReset(item: Locator) {
  await item.getByTestId('puzzle-reset-button').click();
  await expect(item.page().getByTestId('play-reset-dialog')).toBeVisible();
}
async function expectPlayCell(page: Page, col: number, row: number, letter: string) {
  await expect.poll(() => page.locator(`[data-coord="${col},${row}"]`).evaluate((element) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-testid="cell-number"]').forEach((number) => number.remove());
    return clone.textContent?.trim() ?? '';
  })).toBe(letter);
}
/** Library reset finished in place: one fresh blank row, an untouched row, focus on Play. */
async function expectLibraryFresh(page: Page, fixture: Fixture) {
  await expect(page.getByTestId('play-reset-dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/puzzles$/);
  await expect.poll(async () => (await ownRows(fixture)).map((r) => r.id !== fixture.sessionId)).toEqual([true]);
  const [fresh] = await ownRows(fixture);
  expect(fresh.entries).toEqual(entries('blank'));
  expect(fresh.completedAt).toBeNull();
  const item = row(page, fixture.title);
  await expectState(item, 'untouched');
  await expect(item.getByTestId('puzzle-play-link')).toBeFocused();
  return fresh;
}
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

test.describe('P5 — the library learns about play', () => {
  test('every published row offers Play to every player; unpublished rows do not', async ({ page }) => {
    const ownPublic = await seed(page, 'none', { visibility: 'public' });
    const othersPrivate = await seed(page, 'none', { builderId: await seedOtherBuilder() });
    const unpublished = await seed(page, 'partial', { published: false });
    await playLibrary(page);

    for (const fixture of [ownPublic, othersPrivate]) {
      const item = row(page, fixture.title);
      const play = item.getByTestId('puzzle-play-link');
      await expect(play).toBeVisible();
      // 14-S2: the link wraps the title and its marker; an untouched row has none.
      await expect(play).toHaveAccessibleName(fixture.title);
      expect(await play.evaluate((el) => el.tagName.toLowerCase())).toBe('a');
      expect(await play.getAttribute('href')).toMatch(new RegExp(`/puzzles/${fixture.id}/play$`));
      await expectState(item, 'untouched');
      await expect(item.getByTestId('puzzle-edit-link')).toHaveCount(0);
    }
    // 14-S2: drafts are only in Build, and only the caller's own.
    await expect(row(page, unpublished.title)).toHaveCount(0);

    await showView(page, 'Build');
    const manage = row(page, ownPublic.title).getByTestId('puzzle-edit-link');
    await expect(manage).toBeVisible();
    await expect(manage).toHaveAccessibleName(`${ownPublic.title} [published]`);
    expect(await manage.getAttribute('href')).toMatch(new RegExp(`/puzzles/${ownPublic.id}$`));
    await expect(row(page, othersPrivate.title)).toHaveCount(0);

    const draft = row(page, unpublished.title);
    await expect(draft.getByTestId('puzzle-edit-link')).toBeVisible();
    await expect(draft.getByTestId('puzzle-edit-link')).toHaveAccessibleName(`${unpublished.title} [hint]`);
    await expect(draft.getByTestId('puzzle-play-link')).toHaveCount(0);
    await expect(draft.getByTestId('puzzle-play-state')).toHaveCount(0);
    await expect(draft.getByTestId('puzzle-reset-button')).toHaveCount(0);
    await expect(draft).not.toHaveAttribute('data-play-state', /.*/);

    await showView(page, 'Play');
    await row(page, othersPrivate.title).getByTestId('puzzle-play-link').click();
    await expect(page).toHaveURL(new RegExp(`/puzzles/${othersPrivate.id}/play$`));
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    // Opening started a blank attempt, which still reads as untouched.
    expect(await ownRows(othersPrivate)).toHaveLength(1);
    await playLibrary(page);
    await expectState(row(page, othersPrivate.title), 'untouched');
  });

  test('clicking anywhere on a row follows its primary action; secondary controls act alone', async ({ page }) => {
    // 14-S2: completed, since only a completed row has a secondary control (Reset).
    const ownPublished = await seed(page, 'complete');
    const ownDraft = await seed(page, 'none', { published: false });
    const other = await seedOtherBuilder();
    const foreignPublished = await seed(page, 'none', { builderId: other });
    const foreignDraft = await seed(page, 'none', { builderId: other, published: false });
    /** The element a pointer would hit at the centre of `target`, inside the given row. */
    async function hit(target: Locator) {
      await target.scrollIntoViewIfNeeded();
      return target.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        const link = top?.closest('a');
        return { href: link?.getAttribute('href') ?? null, cursor: top ? getComputedStyle(top).cursor : null };
      });
    }
    /** A real pointer click at the centre: the row's overlay link receives it, by design. */
    async function pointAndClick(target: Locator) {
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      expect(box).not.toBeNull();
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    }
    // 14-S2: Play rows open play; Build rows (the caller's own) open the editor.
    for (const [view, rows] of [
      ['Play', [
        [ownPublished, `/puzzles/${ownPublished.id}/play`],
        [foreignPublished, `/puzzles/${foreignPublished.id}/play`],
      ]],
      ['Build', [
        [ownPublished, `/puzzles/${ownPublished.id}`],
        [ownDraft, `/puzzles/${ownDraft.id}`],
      ]],
    ] as const) {
      await library(page);
      await showView(page, view);
      for (const [fixture, href] of rows) {
        const item = row(page, fixture.title);
        expect(await item.evaluate((el) => el.tagName.toLowerCase())).toBe('li');
        await expect(item).not.toHaveAttribute('tabindex', /.*/);
        await expect(item).not.toHaveAttribute('role', /.*/);
        for (const part of ['puzzle-list-title', 'puzzle-icon', 'puzzle-list-updated']) {
          expect(await hit(item.getByTestId(part))).toEqual({ href, cursor: 'pointer' });
        }
      }
      // Another builder's draft is listed in neither view.
      await expect(row(page, foreignDraft.title)).toHaveCount(0);
    }

    await playLibrary(page);
    await pointAndClick(row(page, foreignPublished.title).getByTestId('puzzle-list-title'));
    await expect(page).toHaveURL(new RegExp(`/puzzles/${foreignPublished.id}/play$`));
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await playLibrary(page);
    await pointAndClick(row(page, ownPublished.title).getByTestId('puzzle-icon'));
    await expect(page).toHaveURL(new RegExp(`/puzzles/${ownPublished.id}/play$`));
    await library(page);
    await showView(page, 'Build');
    await pointAndClick(row(page, ownDraft.title).getByTestId('puzzle-list-title'));
    await expect(page).toHaveURL(new RegExp(`/puzzles/${ownDraft.id}$`));
    await library(page);
    await showView(page, 'Build');
    await row(page, ownPublished.title).getByTestId('puzzle-edit-link').click();
    await expect(page).toHaveURL(new RegExp(`/puzzles/${ownPublished.id}$`));
    await expect(page.getByTestId('puzzle-editor')).toBeVisible();
    await playLibrary(page);
    await openReset(row(page, ownPublished.title));
    await expect(page).toHaveURL(/\/puzzles$/);
    await page.keyboard.press('Escape');
    await expectState(row(page, ownPublished.title), 'completed');
  });

  test('each attempt shows its state, and only completed rows offer reset', async ({ page }) => {
    const cases = [
      ['none', 'untouched'], ['blank', 'untouched'], ['partial', 'in-progress'],
      ['incorrect', 'in-progress'], ['complete', 'completed'], ['solved-unstamped', 'completed'],
    ] as const;
    const fixtures = [];
    for (const [attempt] of cases) fixtures.push(await seed(page, attempt));
    await playLibrary(page);

    for (const [index, [, state]] of cases.entries()) {
      await expectState(row(page, fixtures[index].title), state);
    }
  });

  test("another player's attempt never shows on the caller's row", async ({ page }) => {
    const fixture = await seed(page, 'none');
    const otherPlayer = await seedOtherBuilder();
    const theirs = await seedPlaySession(otherPlayer, fixture.id, deserializeGrid(entries('complete')));
    await stamp(theirs);
    await playLibrary(page);

    await expectState(row(page, fixture.title), 'untouched');
  });

  test('completed puzzles sort last within their size group, and leave it when reset', async ({ page }) => {
    const draft = await seed(page, 'none', { published: false });
    const untouched = await seed(page, 'none');
    const inProgress = await seed(page, 'partial');
    const completed = await seed(page, 'complete');
    await setUpdatedAt(draft.id, new Date('2031-01-01T00:00:00Z'));
    await setUpdatedAt(untouched.id, new Date('2031-01-02T00:00:00Z'));
    await setUpdatedAt(inProgress.id, new Date('2031-01-03T00:00:00Z'));
    // The most recently updated puzzle still sorts after every unfinished one.
    await setUpdatedAt(completed.id, new Date('2031-01-04T00:00:00Z'));
    await playLibrary(page);

    // 14-S2: Play lists the published rows; the draft is only in Build.
    await expect(row(page, draft.title)).toHaveCount(0);
    const group = page.getByTestId('puzzle-group').filter({ has: row(page, completed.title) });
    for (const fixture of [untouched, inProgress]) {
      await expect(group.getByTestId('puzzle-list-item').filter({ hasText: fixture.title })).toHaveCount(1);
    }
    const [u, p, c] = await titlesInOrder(page, [untouched.title, inProgress.title, completed.title]);
    expect(Math.min(u, p, c)).toBeGreaterThan(-1);
    expect(p).toBeLessThan(u);
    expect(u).toBeLessThan(c);

    await openReset(row(page, completed.title));
    await page.getByTestId('play-reset-confirm').click();
    await expectLibraryFresh(page, completed);
    const [c2, p2] = await titlesInOrder(page, [completed.title, inProgress.title]);
    expect(c2).toBeGreaterThan(-1);
    expect(c2).toBeLessThan(p2);
  });

  test('the library confirmation uses Modal semantics and names the puzzle', async ({ page }) => {
    const fixture = await seed(page, 'complete');
    await playLibrary(page);
    const item = row(page, fixture.title);
    await openReset(item);
    const dialog = page.getByTestId('play-reset-dialog');
    await expect(dialog).toHaveAttribute('role', 'dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleName('Reset puzzle?');
    await expect(dialog).toBeFocused();
    await expect(dialog).toContainText(fixture.title);
    await expect(dialog).toContainText(/cannot be undone/i);
    await expect(dialog).toContainText(/completion/i);
    await expect(page.getByTestId('play-reset-confirm')).toHaveAccessibleName('Reset puzzle');
    await expect(page.getByTestId('play-reset-cancel')).toHaveAccessibleName('Cancel');
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
    for (const direction of ['Tab', 'Shift+Tab']) {
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press(direction);
        expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
      }
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(item.getByTestId('puzzle-reset-button')).toBeFocused();
  });

  for (const dismissal of ['Cancel', 'Escape', 'backdrop', 'Close'] as const) {
    test(`${dismissal} leaves the attempt and the row unchanged`, async ({ page }) => {
      const fixture = await seed(page, 'complete');
      const before = await readPlaySessions(fixture.id);
      await playLibrary(page);
      const item = row(page, fixture.title);
      await openReset(item);
      if (dismissal === 'Cancel') await page.getByTestId('play-reset-cancel').click();
      else if (dismissal === 'Escape') await page.keyboard.press('Escape');
      else if (dismissal === 'backdrop') await page.getByTestId('modal-backdrop').click({ position: { x: 2, y: 2 } });
      else await page.getByTestId('play-reset-dialog').getByTestId('modal-close').click();
      await expect(page.getByTestId('play-reset-dialog')).toHaveCount(0);
      await expect(item.getByTestId('puzzle-reset-button')).toBeFocused();
      await expectState(item, 'completed');
      expect(await readPlaySessions(fixture.id)).toEqual(before);
    });
  }

  // 14-S2: the partial variant is retired; only a completed row offers Reset in the library.
  for (const attempt of ['complete'] as const) {
    test(`resetting a ${attempt} attempt from the library replaces only that row, in place`, async ({ page }) => {
      const fixture = await seed(page, attempt);
      const otherPlayer = await seedOtherBuilder();
      const theirs = await seedPlaySession(otherPlayer, fixture.id, deserializeGrid(entries('partial')));
      const elsewhere = await seed(page, 'partial');
      const untouchedRows = [
        ...(await readPlaySessions(fixture.id)).filter((r) => r.id === theirs),
        ...(await readPlaySessions(elsewhere.id)),
      ];
      await playLibrary(page);
      await page.evaluate(({ old }) => {
        localStorage.setItem(old, 'old-draft');
        localStorage.setItem('crossward:play-draft:v1:unrelated-attempt', 'keep-draft');
        localStorage.setItem('p5-unrelated-preference', 'keep-preference');
      }, { old: key(fixture.sessionId!) });

      await openReset(row(page, fixture.title));
      await page.getByTestId('play-reset-confirm').click();
      const fresh = await expectLibraryFresh(page, fixture);

      expect(fresh.startedAt.getTime()).toBeGreaterThan(new Date('2026-01-03T04:05:06Z').getTime());
      expect([
        ...(await readPlaySessions(fixture.id)).filter((r) => r.id === theirs),
        ...(await readPlaySessions(elsewhere.id)),
      ]).toEqual(untouchedRows);
      await expectState(row(page, elsewhere.title), 'in-progress');
      expect(await page.evaluate((k) => localStorage.getItem(k), key(fixture.sessionId!))).toBeNull();
      expect(await page.evaluate(() => localStorage.getItem('crossward:play-draft:v1:unrelated-attempt'))).toBe('keep-draft');
      expect(await page.evaluate(() => localStorage.getItem('p5-unrelated-preference'))).toBe('keep-preference');

      await page.reload();
      await expectState(row(page, fixture.title), 'untouched');
      expect(await ownRows(fixture)).toEqual([fresh]);
      await row(page, fixture.title).getByTestId('puzzle-play-link').click();
      await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
      await expectPlayCell(page, 0, 0, '');
      await expectPlayCell(page, 2, 2, '');
      await expect(page.getByTestId('play-lock-message')).toHaveCount(0);
      await expect(page.getByTestId('play-completed-mark')).toHaveCount(0);
      expect(await ownRows(fixture)).toEqual([fresh]);
    });
  }

  test('blocked local draft cleanup cannot fail a library reset', async ({ page }) => {
    const fixture = await seed(page, 'complete');
    await playLibrary(page);
    await page.evaluate((draftKey) => {
      localStorage.setItem(draftKey, 'old-draft');
      const original = Storage.prototype.removeItem;
      Storage.prototype.removeItem = function (k: string) {
        if (k === draftKey) throw new DOMException('Blocked by P5 fixture', 'SecurityError');
        return original.call(this, k);
      };
    }, key(fixture.sessionId!));
    await openReset(row(page, fixture.title));
    await page.getByTestId('play-reset-confirm').click();
    await expectLibraryFresh(page, fixture);
    await expect(page.getByTestId('play-reset-error')).toHaveCount(0);
  });

  test('a pending library reset disables confirmation and every dismissal', async ({ page }) => {
    const fixture = await seed(page, 'complete');
    await playLibrary(page);
    await openReset(row(page, fixture.title));
    const before = await readPlaySessions(fixture.id);
    const held = gate(); let requests = 0;
    await page.route('**/puzzles', async (route) => {
      if (route.request().headers()['next-action']) { requests++; await held.promise; }
      await route.continue();
    });
    try {
      await page.getByTestId('play-reset-confirm').click();
      await expect.poll(() => requests).toBe(1);
      await expect(page.getByTestId('play-reset-pending')).toBeVisible();
      await expect(page.getByTestId('play-reset-confirm')).toBeDisabled();
      await expect(page.getByTestId('play-reset-cancel')).toBeDisabled();
      await expect(page.getByTestId('play-reset-dialog').getByTestId('modal-close')).toBeDisabled();
      await page.keyboard.press('Escape');
      await page.getByTestId('modal-backdrop').click({ position: { x: 2, y: 2 } });
      await expect(page.getByTestId('play-reset-dialog')).toBeVisible();
      await expectState(row(page, fixture.title), 'completed');
      expect(await readPlaySessions(fixture.id)).toEqual(before);
      expect(requests).toBe(1);
    } finally { held.release(); }
    await expectLibraryFresh(page, fixture);
    expect(requests).toBe(1);
  });

  for (const committed of [false, true]) {
    test(`${committed ? 'a lost acknowledgement' : 'a failed library reset'} keeps the dialog and retries idempotently`, async ({ page }) => {
      const fixture = await seed(page, 'complete');
      const beforeRows = await readPlaySessions(fixture.id);
      await playLibrary(page);
      let attempts = 0;
      await page.route('**/puzzles', async (route) => {
        if (route.request().headers()['next-action'] && ++attempts === 1) {
          if (committed) { const response = await route.fetch(); expect(response.ok()).toBe(true); }
          await route.abort('failed');
        } else await route.continue();
      });
      await openReset(row(page, fixture.title));
      await page.getByTestId('play-reset-confirm').click();
      await expect(page.getByTestId('play-reset-error')).toBeVisible();
      await expect(page.getByTestId('play-reset-dialog')).toBeVisible();
      await expect(page.getByTestId('play-reset-confirm')).toBeEnabled();
      await expect(page.getByTestId('play-reset-cancel')).toBeEnabled();
      const afterFailure = await ownRows(fixture);
      if (committed) {
        expect(afterFailure).toHaveLength(1);
        expect(afterFailure[0].id).not.toBe(fixture.sessionId);
        expect(afterFailure[0].entries).toEqual(entries('blank'));
      } else expect(await readPlaySessions(fixture.id)).toEqual(beforeRows);

      await page.getByTestId('play-reset-confirm').click();
      const fresh = await expectLibraryFresh(page, fixture);
      if (committed) expect(fresh).toEqual(afterFailure[0]);
      expect(attempts).toBe(2);
    });
  }

  test('a stale library row cannot reset an attempt that replaced it', async ({ page }) => {
    // 14-S2: the stale row is completed, since only a completed row offers Reset.
    const fixture = await seed(page, 'complete');
    await playLibrary(page);
    await expectState(row(page, fixture.title), 'completed');
    const newer = await replaceAttempt(fixture, 'incorrect');
    const before = await ownRows(fixture);
    expect(before.map((r) => r.id)).toEqual([newer]);

    await openReset(row(page, fixture.title));
    await page.getByTestId('play-reset-confirm').click();
    await expect(page.getByTestId('play-reset-dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/puzzles$/);
    expect(await ownRows(fixture)).toEqual(before);
    // The row refreshes to the surviving newer attempt, not the stale one.
    await expectState(row(page, fixture.title), 'in-progress');
  });

  test('going Back to the library after playing shows the saved and completed state', async ({ page }) => {
    const fixture = await seed(page, 'none');
    await playLibrary(page);
    await expectState(row(page, fixture.title), 'untouched');

    await row(page, fixture.title).getByTestId('puzzle-play-link').click();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.type('c');
    await expect.poll(async () => (await ownRows(fixture))[0]?.entries.cells[0][0]).toEqual({ kind: 'active', letter: 'C' });
    await expect(page.getByTestId('play-save-status')).toHaveAttribute('data-save-state', 'saved');
    await page.goBack();
    await expect(page).toHaveURL(/\/puzzles$/);
    await expectState(row(page, fixture.title), 'in-progress');

    await row(page, fixture.title).getByTestId('puzzle-play-link').click();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    for (const [rowIndex, letters] of ['CAT', 'A#A', 'TEN'].entries()) {
      for (const [col, letter] of [...letters].entries()) {
        if (letter === '#' || (rowIndex === 0 && col === 0)) continue;
        await page.locator(`[data-coord="${col},${rowIndex}"]`).click();
        await page.keyboard.type(letter.toLowerCase());
      }
    }
    await expect(page.getByTestId('play-completed-mark')).toBeVisible();
    await expect.poll(async () => (await ownRows(fixture))[0]?.completedAt).not.toBeNull();
    await page.goBack();
    await expect(page).toHaveURL(/\/puzzles$/);
    await expectState(row(page, fixture.title), 'completed');
  });
});
