import { test, expect, type Locator, type Page } from '@playwright/test';
import { clearLetters, withLetter } from '../src/engine/grid';
import { seedBuilderEditPuzzle } from './helpers/builder-edits';
import { addJay, collaboratorContext } from './helpers/collaborators';
import { currentBuilderId } from './helpers/ownership';
import { isAction, journalEntries, readSaved } from './helpers/operations';
import { readPlaySessions, seedPlayPuzzle, seedPlaySession } from './helpers/play-route';
import { waitForEditorReady } from './helpers/wait-for-ready';

// FROZEN 17-S12 acceptance, human approved 2026-11-15; no runtime authorization.
// Persistence is established through the database and acknowledgement hooks,
// never the absence of visible success text or an arbitrary delay.
const status = (page: Page) => page.getByTestId('save-status');
const playStatus = (page: Page) => page.getByTestId('play-save-status');
const cell = (page: Page, coord: string) => page.locator(`[data-coord="${coord}"]`);
const visible = (locator: Locator) => locator.filter({ visible: true });

async function box(locator: Locator) {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error('Expected a visible layout box');
  return { ...bounds, right: bounds.x + bounds.width, bottom: bounds.y + bounds.height };
}

async function silentSuccess(page: Page, hook: Locator) {
  await expect(visible(page.getByText('Saved', { exact: true }))).toHaveCount(0);
  expect(await page.locator('body').ariaSnapshot(), 'no announced success message')
    .not.toMatch(/\bSaved\b/);
  // Retaining a hook is permitted, but it must consume neither width nor height.
  // display:none, display:contents and a genuinely zero-size box all qualify.
  const bounds = await hook.boundingBox();
  if (bounds) {
    expect(bounds.width, 'idle status reserves no width').toBe(0);
    expect(bounds.height, 'idle status reserves no height').toBe(0);
  }
}

async function builderSaved(page: Page, id: string) {
  await expect(status(page)).toHaveAttribute('data-state', 'saved');
  await expect.poll(() => journalEntries(page, id)).toHaveLength(0);
}

async function openEditor(page: Page, id: string) {
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
}

async function openPlay(page: Page, id: string) {
  await page.goto(`/puzzles/${id}/play`);
  await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
  await expect(page.getByTestId('play-grid-region')).toHaveAttribute('data-ready', 'true');
}

async function compactPlay(page: Page) {
  const title = await box(page.getByTestId('play-title'));
  const hint = await box(page.getByTestId('prominent-hint'));
  const grid = await box(page.getByTestId('puzzle-grid'));
  expect(Math.abs(hint.y - title.bottom - 32), 'title to hint: no empty controls row').toBeLessThanOrEqual(1);
  expect(Math.abs(grid.y - hint.bottom - 16), 'hint to grid').toBeLessThanOrEqual(1);
  expect(Math.abs(hint.height - 52), 'short hint minimum height').toBeLessThanOrEqual(1);
  expect(Math.abs(grid.y - title.bottom - 100), 'title to grid with a short hint').toBeLessThanOrEqual(1);
}

async function shownLetter(page: Page, coord: string) {
  return cell(page, coord).evaluate((element) => {
    const copy = element.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('[data-testid="cell-number"]').forEach((number) => number.remove());
    return copy.textContent?.trim() ?? '';
  });
}

function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

for (const width of [1440, 390]) {
  for (const role of ['owner', 'collaborator'] as const) {
    for (const phase of ['grid', 'hints'] as const) {
      test(`17-S12-1 ${role}, ${phase}, ${width}px: acknowledged edits and title persist silently`, async ({ page, browser }) => {
        const fixture = await seedBuilderEditPuzzle('Quiet builder', await currentBuilderId(page), phase);
        const jay = role === 'collaborator' ? await collaboratorContext(browser) : null;
        const editor = jay?.page ?? page;
        try {
          if (jay) await addJay(fixture.id);
          await editor.setViewportSize({ width, height: 1000 });
          await openEditor(editor, fixture.id);
          await silentSuccess(editor, status(editor));
          if (phase === 'grid') {
            await cell(editor, '0,0').click();
            await editor.keyboard.type('z');
            await editor.getByTestId('puzzle-title').click(); // flush the actual grid burst
            await expect.poll(async () => (await readSaved(fixture.id)).grid.cells[0][0])
              .toEqual({ kind: 'active', letter: 'Z' });
          } else {
            await cell(editor, '0,0').click();
            const input = width >= 1140
              ? editor.locator('[data-hint-key="1-across"] [data-testid="hint-input"]')
              : editor.getByTestId('hint-box-input');
            await input.fill('A quiet hint');
            await editor.getByTestId('puzzle-title').click();
            await expect.poll(async () => (await readSaved(fixture.id)).hints['1-across']).toBe('A quiet hint');
          }
          await builderSaved(editor, fixture.id);
          await silentSuccess(editor, status(editor));
          const title = `Quiet ${role} ${phase} ${width}`;
          await editor.getByTestId('puzzle-title').fill(title);
          await editor.getByTestId('builder-step-current').click();
          await expect.poll(async () => (await readSaved(fixture.id)).title).toBe(title);
          await builderSaved(editor, fixture.id);
          await silentSuccess(editor, status(editor));
          await editor.reload();
          await waitForEditorReady(editor);
          await expect(editor.getByTestId('puzzle-title')).toHaveValue(title);
          if (phase === 'grid') {
            await expect.poll(() => shownLetter(editor, '0,0')).toBe('Z');
          } else {
            await cell(editor, '0,0').click();
            const input = width >= 1140
              ? editor.locator('[data-hint-key="1-across"] [data-testid="hint-input"]')
              : editor.getByTestId('hint-box-input');
            await expect(input).toHaveValue('A quiet hint');
          }
          await silentSuccess(editor, status(editor));
          await expect(editor.getByTestId('editor-collaborators')).toHaveCount(role === 'owner' ? 1 : 0);
          await expect(editor.getByTestId('start-over')).toHaveCount(role === 'owner' && phase === 'grid' ? 1 : 0);
          if (phase === 'hints') {
            await expect(editor.locator('[data-testid="builder-steps"] [data-step-id="publish"]'))
              .toHaveCount(role === 'owner' ? 1 : 0);
          } else {
            await expect(editor.locator('[data-testid="builder-steps"] [data-step-id="hints"]')).toBeVisible();
          }
        } finally {
          await jay?.context.close();
        }
      });
    }
  }
}

for (const mode of ['fresh', 'resumed', 'reset'] as const) {
  test(`17-S12-2 wide ${mode} unfinished play is silent and compact`, async ({ page }) => {
    const player = await currentBuilderId(page);
    const fixture = await seedPlayPuzzle({ builderId: player });
    if (mode !== 'fresh') {
      const entries = mode === 'reset' ? fixture.puzzle.grid
        : withLetter(clearLetters(fixture.puzzle.grid), { col: 0, row: 0 }, 'Z');
      await seedPlaySession(player, fixture.id, entries);
    }
    await openPlay(page, fixture.id);
    if (mode === 'reset') {
      await expect(page.getByTestId('play-lock-message')).toHaveText('The puzzle is complete.');
      await page.getByTestId('play-reset-link').click();
      await page.getByTestId('play-reset-confirm').click();
      await expect(page.getByTestId('play-reset-dialog')).toHaveCount(0);
      await expect(page.getByTestId('play-lock-message')).toHaveCount(0);
      const sessions = await readPlaySessions(fixture.id);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].completedAt).toBeNull();
      for (const row of sessions[0].entries.cells) {
        for (const value of row) if (value.kind === 'active') expect(value.letter).toBeNull();
      }
      await expect(page.getByTestId('play-grid-region')).toBeFocused();
      await expect(cell(page, '0,0')).toHaveAttribute('data-selected', 'true');
    }
    await expect(playStatus(page)).toHaveAttribute('data-save-state', 'saved');
    await compactPlay(page);
    await silentSuccess(page, playStatus(page));
    await expect(page.getByTestId('play-reset-link')).toHaveCount(0);
  });
}

for (const width of [1440, 390]) {
  test(`17-S12-3 ${width}px: a player entry persists through reload and returns to quiet idle`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
    await openPlay(page, fixture.id);
    const before = await box(page.getByTestId('puzzle-grid'));
    await page.keyboard.type('z');
    await expect.poll(async () => (await readPlaySessions(fixture.id))[0]?.entries.cells[0][0])
      .toEqual({ kind: 'active', letter: 'Z' });
    await expect(playStatus(page)).toHaveAttribute('data-save-state', 'saved');
    await silentSuccess(page, playStatus(page));
    const after = await box(page.getByTestId('puzzle-grid'));
    expect(Math.abs(after.y - before.y), 'idle save adds no vertical gap').toBeLessThanOrEqual(1);
    if (width === 1440) await compactPlay(page);
    else {
      await expect(page.getByTestId('play-title')).not.toBeVisible();
      await expect(page.getByTestId('play-hint-bar')).toBeVisible();
      await expect(visible(page.getByText(/^(Saved|Saving…|Waiting to save…)$/))).toHaveCount(0);
    }
    await page.reload();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expect.poll(() => shownLetter(page, '0,0')).toBe('Z');
    await expect(playStatus(page)).toHaveAttribute('data-save-state', 'saved');
    await silentSuccess(page, playStatus(page));
    if (width === 1440) await compactPlay(page);
    else expect(Math.abs((await box(page.getByTestId('puzzle-grid'))).y - before.y)).toBeLessThanOrEqual(1);
  });
}

test('17-S12-4 editor failure remains readable and retries without losing the journaled entry', async ({ page }) => {
  const fixture = await seedBuilderEditPuzzle('Retry editor', await currentBuilderId(page), 'grid');
  await openEditor(page, fixture.id);
  let fail = true;
  await page.route(`**/puzzles/${fixture.id}`, (route) =>
    fail && isAction(route.request()) ? route.abort('failed') : route.continue());
  await cell(page, '0,0').click();
  await page.keyboard.type('z');
  await page.getByTestId('puzzle-title').click();
  await expect(status(page)).toHaveText('Not saved — retrying');
  await expect(status(page)).toBeVisible();
  await expect(status(page)).toHaveCSS('color', 'rgb(226, 101, 95)');
  expect((await box(status(page))).height).toBeGreaterThan(0);
  expect(await journalEntries(page, fixture.id)).toHaveLength(1);
  expect((await readSaved(fixture.id)).version).toBe(0);
  fail = false;
  await expect.poll(async () => (await readSaved(fixture.id)).grid.cells[0][0], { timeout: 20_000 })
    .toEqual({ kind: 'active', letter: 'Z' });
  await builderSaved(page, fixture.id);
  await silentSuccess(page, status(page));
  await expect(page.getByText('Not saved — retrying', { exact: true })).toHaveCount(0);
  await page.reload();
  await waitForEditorReady(page);
  await expect.poll(() => shownLetter(page, '0,0')).toBe('Z');
});

test('17-S12-4 player pending, in-flight and failed saves retain their feedback; Retry restores compact idle', async ({ page }) => {
  const fixture = await seedPlayPuzzle({ builderId: await currentBuilderId(page) });
  await openPlay(page, fixture.id);
  await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));
  const held = gate();
  let sends = 0;
  await page.route(`**/puzzles/${fixture.id}/play`, async (route) => {
    if (!isAction(route.request())) return route.continue();
    if (++sends === 1) {
      await held.promise;
      return route.abort('failed');
    }
    return route.continue();
  });
  try {
    await page.keyboard.type('z');
    await expect(playStatus(page)).toHaveAttribute('data-save-state', 'pending');
    await expect(playStatus(page)).toHaveText('Waiting to save…');
    await expect(playStatus(page)).toBeVisible();
    await page.clock.runFor(500);
    await expect(playStatus(page)).toHaveAttribute('data-save-state', 'saving');
    await expect(playStatus(page)).toHaveText('Saving…');
    await expect(playStatus(page)).toBeVisible();
    held.release();
    await expect(playStatus(page)).toHaveAttribute('data-save-state', 'error');
    await expect(playStatus(page)).toContainText('We couldn’t save your entries.');
    await expect(playStatus(page)).toHaveAttribute('role', 'alert');
    await expect(playStatus(page)).toBeVisible();
    await expect(playStatus(page).getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
    const [failed] = await readPlaySessions(fixture.id);
    expect(failed.entries.cells[0][0]).toEqual({ kind: 'active', letter: null });
    const key = `crossward:play-draft:v1:${failed.id}`;
    const draft = await page.evaluate((draftKey) => localStorage.getItem(draftKey), key);
    expect(draft).not.toBeNull();
    expect(JSON.parse(draft!).cells[0][0]).toEqual({ kind: 'active', letter: 'Z' });
    await playStatus(page).getByRole('button', { name: 'Retry', exact: true }).click();
    await expect.poll(async () => (await readPlaySessions(fixture.id))[0]?.entries.cells[0][0])
      .toEqual({ kind: 'active', letter: 'Z' });
    await expect(playStatus(page)).toHaveAttribute('data-save-state', 'saved');
    await expect.poll(() => page.evaluate((draftKey) => localStorage.getItem(draftKey), key)).toBeNull();
    await silentSuccess(page, playStatus(page));
    await expect(page.getByText('We couldn’t save your entries.', { exact: false })).toHaveCount(0);
    await compactPlay(page);
    expect(sends).toBe(2);
    await page.reload();
    await expect(page.getByTestId('play-puzzle')).toHaveAttribute('data-session-state', 'ready');
    await expect.poll(() => shownLetter(page, '0,0')).toBe('Z');
  } finally {
    held.release();
  }
});

for (const width of [1440, 1000, 390, 320]) {
  for (const phase of ['grid', 'hints'] as const) {
    test(`17-S12-5 ${phase}, ${width}px: controls and the owner's link survive saving to idle without a blank status row`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const fixture = await seedBuilderEditPuzzle('Quiet controls', await currentBuilderId(page), phase);
      await openEditor(page, fixture.id);
      const held = gate();
      let first = true;
      await page.route(`**/puzzles/${fixture.id}`, async (route) => {
        if (first && isAction(route.request())) {
          first = false;
          await held.promise;
        }
        await route.continue();
      });
      const controlsUsable = async () => {
        const steps = page.getByTestId('builder-steps');
        const toggle = page.getByTestId(phase === 'grid' ? 'preview-toggle' : 'lock-letters-toggle');
        const link = page.getByTestId('editor-collaborators');
        const rebus = visible(page.getByTestId('rebus-control'));
        await expect(steps.getByRole('button', { name: phase === 'grid' ? /Create Hints/ : /Publish/ })).toBeEnabled();
        await expect(toggle).toBeEnabled();
        await expect(rebus).toBeEnabled();
        await expect(link).toBeEnabled();
        expect(Math.abs((await box(link)).right - (await box(rebus)).right), 'owner link right-aligned with Rebus').toBeLessThanOrEqual(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal overflow').toBe(true);
        for (const control of [toggle, rebus, link]) {
          const bounds = await box(control);
          expect(bounds.x).toBeGreaterThanOrEqual(0);
          expect(bounds.right).toBeLessThanOrEqual(width);
        }
      };
      try {
        await controlsUsable();
        await cell(page, '0,0').click();
        await page.keyboard.type('z');
        await page.getByTestId('puzzle-title').click();
        await expect(status(page)).toHaveText('Saving…');
        await expect(status(page)).toBeVisible();
        await controlsUsable();
        held.release();
        await expect.poll(async () => (await readSaved(fixture.id)).grid.cells[0][0])
          .toEqual({ kind: 'active', letter: 'Z' });
        await builderSaved(page, fixture.id);
        await silentSuccess(page, status(page));
        await controlsUsable();
        const steps = await box(page.getByTestId('builder-steps'));
        const contentBottoms = await Promise.all([
          page.getByTestId('builder-step-current'),
          page.locator(`[data-testid="builder-steps"] button[data-step-id="${phase === 'grid' ? 'hints' : 'publish'}"]`),
          page.getByTestId('editor-collaborators'),
        ].map(async (control) => (await box(control)).bottom));
        expect(Math.abs(steps.bottom - Math.max(...contentBottoms)), 'no standalone blank status row').toBeLessThanOrEqual(1);
        await page.getByTestId('editor-collaborators').click();
        await expect(page.getByTestId('collaborators-dialog')).toBeVisible();
        await page.getByTestId('collaborators-done').click();
        await expect(page.getByTestId('collaborators-dialog')).toHaveCount(0);
      } finally {
        held.release();
      }
    });
  }
}
