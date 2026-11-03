import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { createBlankPuzzle, deserializeGrid, type SerializedGrid } from '../src/lib/puzzle-storage';
import { seedBuilderEditPuzzle, type BuilderEditState } from './helpers/builder-edits';
import { currentBuilderId, ownershipTestClient, seedOtherBuilder } from './helpers/ownership';
import { seedPlayPuzzle, seedPlaySession } from './helpers/play-route';
import { seedPuzzle } from './helpers/seed-puzzle';
import { signInSeededUser } from './helpers/seed-session';
import { waitForEditorReady } from './helpers/wait-for-ready';

// Story 18-S4 — Filters.
//
// One list replaces the Build | Play radio. With no filter checked it lists
// everything the caller can see: their own puzzles in every phase and every
// puzzle they can play, grouped by size and sorted unpublished, then
// published still to finish, then completed. A published row links to play
// and shows the player's marker and, when complete, Reset; an unpublished
// row (always the caller's) links to the builder. The caller's own rows keep
// their menu; a published one's menu adds "Open in builder" after Duplicate.
// On the caller's own completed row, Reset sits 12px left of the menu button.
//
// Filters: Play (Unplayed, Underway, Complete), Create (Build Phase, Hint
// Phase, Unlisted), Size (Mini, Midi, Daily, Sunday), each group a fieldset
// with its legend, each option a native checkbox. Play and Create combine
// with OR; Size narrows. Size groups with no match are hidden; when nothing
// matches the list reads "No puzzles match these filters." Filters apply as
// they are checked, without a reload or a server request, and live in the
// URL's query (`play`, `create`, `size`, comma-separated, canonical order),
// replacing the history entry, so refresh and Back keep them.
//
// Reset shows once any option is checked, right of the "Filters" label,
// title-4 in `link-muted` (the builder's Rebus link), `button-hover` on hover;
// it unchecks everything and focuses the "Filters" label.
//
// Checkbox: a 16px square with 4px corners and a 1px
// `button-alternate-border` outline; checked, it is filled `button-fill`
// with a white check. Its label is body-normal primary, 8px after the box,
// and carries the focus ring on keyboard focus only.
//
// From a 948px window (the 200px left column and the 700px list, plus 24px
// each side) the list column keeps its 700px, its hairline and its place
// 90px under the masthead, and the pair is centered. The left column holds
// Create A Puzzle, level with the list's top (27px below the heading), then
// "Filters" (an h2, title-4 primary) 20px below it and 6px in, then the three
// groups: legends title-4 primary 20px on, options body-normal primary, 14px
// below the legend and 13px apart, groups 26px apart (gaps between boxes,
// measured from the mock). Narrower, one column: 27px below the heading a
// row holds Create A Puzzle and a "Filters" text button ("Filters · 2" with
// two checked), the list 27px below it. The button
// opens a panel 16px below the row, with the groups side by side (wrapping
// when narrow); the panel starts closed and closes with the button or Escape,
// focus returning to the button, the filters staying applied.
//
// The style guide catalogs the Checkbox unchecked and checked.
//
// The suite shares one database, so rows are found by unique titles and
// group/emptiness checks use filters a fresh builder controls. Do not edit
// this file to match an implementation.

test.use({ storageState: { cookies: [], origins: [] } });

const DESKTOP = { width: 1280, height: 800 };
const NARROWEST_TWO_COLUMNS = 948;
const PHONE = { width: 375, height: 667 };
const FOCUS_RING = 'solid 2px rgb(0, 240, 255) offset 0px';
const NO_MATCH = 'No puzzles match these filters.';

const GROUPS = [
  ['Play', ['Unplayed', 'Underway', 'Complete']],
  ['Create', ['Build Phase', 'Hint Phase', 'Unlisted']],
  ['Size', ['Mini', 'Midi', 'Daily', 'Sunday']],
] as const;

type Rgba = { r: number; g: number; b: number; a: number };

function parseColor(value: string): Rgba {
  const rgb = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: alpha(rgb[4]) };
  const srgb = value.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
  if (srgb) {
    return {
      r: Math.round(Number(srgb[1]) * 255),
      g: Math.round(Number(srgb[2]) * 255),
      b: Math.round(Number(srgb[3]) * 255),
      a: alpha(srgb[4]),
    };
  }
  throw new Error(`unparseable colour: "${value}"`);
}

function alpha(raw: string | undefined) {
  if (raw === undefined) return 1;
  return raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw);
}

function expectColor(actual: string, expected: Rgba, label: string) {
  const parsed = parseColor(actual);
  expect({ r: parsed.r, g: parsed.g, b: parsed.b }, label).toEqual({ r: expected.r, g: expected.g, b: expected.b });
  expect(parsed.a, `${label} alpha`).toBeCloseTo(expected.a, 2);
}

/** The colour a color style resolves to on this page. */
async function token(page: Page, style: string) {
  const raw = await page.evaluate((s) => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(--color-${s})`;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return resolved;
  }, style);
  return parseColor(raw);
}

async function expectTextStyle(page: Page, locator: Locator, style: string, label: string) {
  const actual = await locator.evaluate((el) => {
    const c = getComputedStyle(el);
    return { fontSize: c.fontSize, fontWeight: c.fontWeight, lineHeight: c.lineHeight };
  });
  const expected = await page.evaluate((s) => {
    const probe = document.createElement('div');
    probe.style.fontSize = `var(--text-${s})`;
    probe.style.fontWeight = `var(--text-${s}--font-weight)`;
    probe.style.lineHeight = `var(--text-${s}--line-height)`;
    document.body.appendChild(probe);
    const c = getComputedStyle(probe);
    const resolved = { fontSize: c.fontSize, fontWeight: c.fontWeight, lineHeight: c.lineHeight };
    probe.remove();
    return resolved;
  }, style);
  expect(actual, `${label} ${style}`).toEqual(expected);
}

async function expectTextColor(page: Page, locator: Locator, style: string, label: string) {
  expectColor(await locator.evaluate((el) => getComputedStyle(el).color), await token(page, style), label);
}

/** Page-relative box. */
async function box(locator: Locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
  });
}

/** The page y of an element's first-line baseline. */
async function baseline(locator: Locator) {
  return locator.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;margin:0;padding:0;border:0;';
    el.insertBefore(probe, el.firstChild);
    const y = probe.getBoundingClientRect().bottom + window.scrollY;
    probe.remove();
    return y;
  });
}

/** The element's settled outline: "none", or style, width, color and offset. */
function ringOf(locator: Locator) {
  return locator.evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined)));
    const s = getComputedStyle(el);
    const transparent = /rgba\(.*,\s*0\)$|transparent/.test(s.outlineColor);
    if (s.outlineStyle === 'none' || parseFloat(s.outlineWidth) === 0 || transparent) return 'none';
    return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} offset ${s.outlineOffset}`;
  });
}

/** Gives `target` keyboard focus: focus whatever precedes it, then press Tab. */
async function tabTo(page: Page, target: Locator) {
  await target.evaluate((el) => {
    const all = Array.from(document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])'))
      .filter((candidate) => candidate.offsetParent !== null);
    all[all.indexOf(el as HTMLElement) - 1].focus();
  });
  await page.keyboard.press('Tab');
  await expect(target).toBeFocused();
}

function uniqueTitle(label: string) {
  return `S4 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Signs this page in as a brand-new builder, and returns their id. */
async function freshBuilder(page: Page, viewport = DESKTOP) {
  await page.setViewportSize(viewport);
  await signInSeededUser(page);
  return currentBuilderId(page);
}

async function seedOwn(builderId: string, state: BuilderEditState, label: string = state) {
  const title = uniqueTitle(label);
  const { id } = await seedBuilderEditPuzzle(title, builderId, state);
  return { id, title };
}

async function seedDraft(builderId: string, size: 'mini' | 'midi' | 'daily' | 'sunday', label: string) {
  const title = uniqueTitle(label);
  const { id } = await seedPuzzle(createBlankPuzzle(size), title, builderId);
  return { id, title };
}

const solved: SerializedGrid = {
  cols: 3, rows: 3,
  cells: [
    [{ kind: 'active', letter: 'C' }, { kind: 'active', letter: 'A' }, { kind: 'active', letter: 'T' }],
    [{ kind: 'active', letter: 'A' }, { kind: 'black' }, { kind: 'active', letter: 'A' }],
    [{ kind: 'active', letter: 'T' }, { kind: 'active', letter: 'E' }, { kind: 'active', letter: 'N' }],
  ],
};

/** A published 3×3 and the player's attempt at it: none, part-filled, or completed and stamped. */
async function seedPublished(builderId: string, playerId: string, attempt: 'none' | 'in-play' | 'complete', visibility: 'public' | 'private' = 'public') {
  const fixture = await seedPlayPuzzle({ builderId, visibility });
  if (attempt === 'none') return fixture;
  const entries = structuredClone(solved);
  if (attempt === 'in-play') entries.cells[0][0] = { kind: 'active', letter: null };
  const sessionId = await seedPlaySession(playerId, fixture.id, deserializeGrid(entries));
  if (attempt === 'complete') {
    const client = ownershipTestClient();
    try {
      await client.playSession.update({ where: { id: sessionId }, data: { completedAt: new Date('2026-01-04T04:05:06Z') } });
    } finally {
      await client.$disconnect();
    }
  }
  return fixture;
}

async function openLibrary(page: Page, query = '') {
  await page.goto(`/puzzles${query}`);
  await page.waitForSelector('[data-testid="puzzle-library"][data-ready="true"]');
}

function row(page: Page, title: string) {
  return page.getByTestId('puzzle-list-item').filter({ hasText: title });
}

function option(page: Page, name: string) {
  return page.getByRole('checkbox', { name, exact: true });
}

/** The label that wraps an option's checkbox. */
function optionLabel(page: Page, name: string) {
  return page.locator('label').filter({ has: option(page, name) });
}

async function check(page: Page, name: string) {
  await option(page, name).check();
  await expect(option(page, name)).toBeChecked();
}

function sizes(page: Page) {
  return page.getByTestId('puzzle-group').evaluateAll((els) => els.map((el) => el.getAttribute('data-size')));
}

async function indexOf(page: Page, title: string) {
  const all = await page.getByTestId('puzzle-list-item').allTextContents();
  return all.findIndex((text) => text.includes(title));
}

async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

const toggle = (page: Page) => page.getByRole('button', { name: /^Filters/ });
const filtersLabel = (page: Page) => page.getByRole('heading', { name: 'Filters', exact: true });
const reset = (page: Page) => page.getByTestId('puzzle-filters-reset');

test.describe('18-S4-3 one list', () => {
  test('with no filter it lists the caller’s puzzles in every phase and every puzzle they can play, with no Build | Play choice', async ({ page }) => {
    const me = await freshBuilder(page);
    const other = await seedOtherBuilder();
    const own = {
      grid: await seedOwn(me, 'grid'),
      hints: await seedOwn(me, 'hints'),
      unlisted: await seedOwn(me, 'private published', 'unlisted'),
      complete: await seedPublished(me, me, 'complete'),
    };
    const foreign = {
      untouched: await seedPublished(other, me, 'none'),
      inPlay: await seedPublished(other, me, 'in-play'),
      complete: await seedPublished(other, me, 'complete'),
    };
    const foreignDraft = await seedOwn(other, 'hints', 'foreign draft');
    const foreignUnlisted = await seedPublished(other, me, 'none', 'private');
    await openLibrary(page);

    await expect(page.getByRole('radiogroup')).toHaveCount(0);
    await expect(page.getByTestId('library-view')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('crossward:library-view'))).toBeNull();

    for (const [fixture, status] of [[own.grid, 'Build phase'], [own.hints, 'Hint phase']] as const) {
      const item = row(page, fixture.title);
      await expect(item).toHaveCount(1);
      const link = item.getByTestId('puzzle-edit-link');
      await expect(link).toHaveAttribute('href', `/puzzles/${fixture.id}`);
      await expect(link).toHaveAccessibleName(`${fixture.title} ${status}`);
      await expect(item.getByTestId('puzzle-play-link')).toHaveCount(0);
      await expect(item.getByTestId('puzzle-play-state')).toHaveCount(0);
      await expect(item.getByTestId('puzzle-menu-button')).toHaveCount(1);
    }
    // 18-S5: a completed row has no marker; its hidden status reads Complete.
    for (const [fixture, marker, mine, status] of [
      [own.unlisted, null, true, 'Ready to play'],
      [own.complete, null, true, 'Complete'],
      [foreign.untouched, null, false, 'Ready to play'],
      [foreign.inPlay, '[in-play]', false, 'Ready to play'],
      [foreign.complete, null, false, 'Complete'],
    ] as const) {
      const item = row(page, fixture.title);
      await expect(item).toHaveCount(1);
      const link = item.getByTestId('puzzle-play-link');
      await expect(link).toHaveAttribute('href', `/puzzles/${fixture.id}/play`);
      await expect(link).toHaveAccessibleName(marker === null ? `${fixture.title} ${status}` : `${fixture.title} ${status} ${marker}`);
      await expect(item.getByTestId('puzzle-edit-link')).toHaveCount(0);
      await expect(item.getByTestId('puzzle-menu-button'), `${fixture.title} menu`).toHaveCount(mine ? 1 : 0);
      // 19-S3: the caller's own completed row offers Reset in its menu instead.
      await expect(item.getByTestId('puzzle-reset-button')).toHaveCount(status === 'Complete' && !mine ? 1 : 0);
    }
    await expect(row(page, foreignDraft.title)).toHaveCount(0);
    await expect(row(page, foreignUnlisted.title)).toHaveCount(0);

    // One "Other sizes" group, sorted unpublished, then still to finish, then completed.
    const [grid, hints, unlisted, untouched, inPlay, ownComplete, foreignComplete] = await Promise.all(
      [own.grid, own.hints, own.unlisted, foreign.untouched, foreign.inPlay, own.complete, foreign.complete]
        .map((f) => indexOf(page, f.title)),
    );
    expect(Math.min(grid, hints)).toBeGreaterThan(-1);
    for (const unfinished of [unlisted, untouched, inPlay]) {
      expect(Math.max(grid, hints), 'drafts first').toBeLessThan(unfinished);
      expect(unfinished, 'completed last').toBeLessThan(Math.min(ownComplete, foreignComplete));
    }
  });

  // 19-S3: Reset moved into the menu, before Delete.
  test('the caller’s own completed puzzle offers Reset in its menu, and the menu opens it in the builder', async ({ page }) => {
    const me = await freshBuilder(page);
    const own = await seedPublished(me, me, 'complete');
    await openLibrary(page);
    const item = row(page, own.title);
    const menuButton = item.getByTestId('puzzle-menu-button');
    await expect(item.getByTestId('puzzle-reset-button')).toHaveCount(0);

    await menuButton.click();
    await page.getByTestId('puzzle-menu').getByTestId('puzzle-menu-reset').click();
    await expect(page.getByTestId('play-reset-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('play-reset-dialog')).toHaveCount(0);

    await menuButton.click();
    const items = page.getByTestId('puzzle-menu').getByRole('menuitem');
    expect((await items.allTextContents()).map((t) => t.trim())).toEqual(['Duplicate', 'Open in builder', 'Make unlisted', 'Reset', 'Delete']);
    await page.getByTestId('puzzle-menu').getByTestId('puzzle-menu-open-builder').click();
    await expect(page).toHaveURL(new RegExp(`/puzzles/${own.id}$`));
    await waitForEditorReady(page);
    await expect(page.getByTestId('publish-state')).toHaveText('Published');
  });
});

test.describe('18-S4-4 filtering', () => {
  test('three groups of checkboxes; Play and Create show puzzles matching either, Size narrows, empty size groups hide', async ({ page }) => {
    const me = await freshBuilder(page);
    const other = await seedOtherBuilder();
    const mini = await seedDraft(me, 'mini', 'mini draft');
    const daily = await seedDraft(me, 'daily', 'daily draft');
    const hints = await seedOwn(me, 'hints');
    const unlisted = await seedOwn(me, 'private published', 'unlisted');
    const untouched = await seedPublished(other, me, 'none');
    const inPlay = await seedPublished(other, me, 'in-play');
    const complete = await seedPublished(other, me, 'complete');
    await openLibrary(page);

    const groups = page.getByRole('group');
    expect(await groups.evaluateAll((els) => els.map((el) => el.tagName.toLowerCase()))).toEqual(['fieldset', 'fieldset', 'fieldset']);
    for (const [legend, options] of GROUPS) {
      const group = page.getByRole('group', { name: legend, exact: true });
      await expect(group.locator('legend')).toHaveText(legend);
      await expect(group.getByRole('checkbox')).toHaveCount(options.length);
      expect(await group.getByRole('checkbox').evaluateAll((inputs) => inputs.map((i) => (i as HTMLInputElement).labels?.[0]?.textContent?.trim())))
        .toEqual([...options]);
      for (const name of options) {
        await expect(option(page, name)).not.toBeChecked();
        expect(await option(page, name).evaluate((el) => (el as HTMLInputElement).type)).toBe('checkbox');
      }
    }

    await check(page, 'Build Phase');
    expect(await sizes(page)).toEqual(['mini', 'daily']);
    for (const shown of [mini, daily]) await expect(row(page, shown.title)).toHaveCount(1);
    for (const hidden of [hints, unlisted, untouched, inPlay, complete]) await expect(row(page, hidden.title)).toHaveCount(0);

    await check(page, 'Unplayed');
    for (const shown of [mini, daily, unlisted, untouched]) await expect(row(page, shown.title)).toHaveCount(1);
    for (const hidden of [hints, inPlay, complete]) await expect(row(page, hidden.title)).toHaveCount(0);

    await check(page, 'Mini');
    expect(await sizes(page)).toEqual(['mini']);
    await expect(row(page, mini.title)).toHaveCount(1);
    for (const hidden of [daily, unlisted, untouched]) await expect(row(page, hidden.title)).toHaveCount(0);

    await option(page, 'Mini').uncheck();
    await option(page, 'Build Phase').uncheck();
    await option(page, 'Unplayed').uncheck();
    for (const shown of [mini, daily, hints, unlisted, untouched, inPlay, complete]) await expect(row(page, shown.title)).toHaveCount(1);

    await check(page, 'Underway');
    await check(page, 'Complete');
    for (const shown of [inPlay, complete]) await expect(row(page, shown.title)).toHaveCount(1);
    for (const hidden of [mini, daily, hints, unlisted, untouched]) await expect(row(page, hidden.title)).toHaveCount(0);
  });

  test('when nothing matches, the list reads so, body-normal muted, 27px below the heading', async ({ page }) => {
    const me = await freshBuilder(page);
    await seedOwn(me, 'hints');
    await openLibrary(page);
    await check(page, 'Hint Phase');
    await check(page, 'Sunday');

    await expect(page.getByTestId('puzzle-group')).toHaveCount(0);
    const empty = page.getByTestId('puzzle-list-empty');
    await expect(empty).toHaveText(NO_MATCH);
    await expectTextStyle(page, empty, 'body-normal', 'empty line');
    await expectTextColor(page, empty, 'muted', 'empty line');
    const heading = await box(page.getByTestId('page-heading'));
    const e = await box(empty);
    expect(e.y - (heading.y + heading.height), 'heading to empty line').toBeCloseTo(27, 0);
    expect(e.x, 'empty line on the content edge').toBeCloseTo(heading.x, 0);
  });

  test('filters apply without reloading or asking the server for the library', async ({ page }) => {
    const me = await freshBuilder(page);
    const draft = await seedOwn(me, 'grid');
    const hints = await seedOwn(me, 'hints');
    await openLibrary(page);
    const libraryRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname === '/puzzles' || request.headers()['next-action']) libraryRequests.push(request.url());
    });
    await page.evaluate(() => { (window as unknown as { s4Marker: boolean }).s4Marker = true; });

    await check(page, 'Hint Phase');
    await expect(row(page, draft.title)).toHaveCount(0);
    await expect(row(page, hints.title)).toHaveCount(1);
    await option(page, 'Hint Phase').uncheck();
    await expect(row(page, draft.title)).toHaveCount(1);

    expect(await page.evaluate(() => (window as unknown as { s4Marker?: boolean }).s4Marker)).toBe(true);
    expect(libraryRequests).toEqual([]);
  });
});

test.describe('18-S4-5 the filters live in the URL', () => {
  test('checking writes the query in canonical order without adding history; unchecking everything clears it', async ({ page }) => {
    await freshBuilder(page);
    await openLibrary(page);
    const before = await page.evaluate(() => history.length);

    await check(page, 'Mini');
    await expect(page).toHaveURL(/\/puzzles\?size=mini$/);
    await check(page, 'Hint Phase');
    await check(page, 'Complete');
    await check(page, 'Underway');
    await expect(page).toHaveURL(/\/puzzles\?play=underway,complete&create=hint&size=mini$/);
    expect(await page.evaluate(() => history.length), 'no history entries').toBe(before);

    for (const name of ['Underway', 'Complete', 'Hint Phase', 'Mini']) await option(page, name).uncheck();
    await expect(page).toHaveURL(/\/puzzles$/);
  });

  test('a reload, and Back from a puzzle, keep the filters', async ({ page }) => {
    const me = await freshBuilder(page);
    const mini = await seedDraft(me, 'mini', 'mini draft');
    const hints = await seedOwn(me, 'hints');
    await openLibrary(page);
    await check(page, 'Build Phase');
    await check(page, 'Mini');

    await page.reload();
    await page.waitForSelector('[data-testid="puzzle-library"][data-ready="true"]');
    await expect(page).toHaveURL(/\/puzzles\?create=build&size=mini$/);
    for (const name of ['Build Phase', 'Mini']) await expect(option(page, name)).toBeChecked();
    await expect(row(page, mini.title)).toHaveCount(1);
    await expect(row(page, hints.title)).toHaveCount(0);

    await row(page, mini.title).getByTestId('puzzle-edit-link').click();
    await expect(page).toHaveURL(new RegExp(`/puzzles/${mini.id}$`));
    await waitForEditorReady(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/puzzles\?create=build&size=mini$/);
    for (const name of ['Build Phase', 'Mini']) await expect(option(page, name)).toBeChecked();
    await expect(option(page, 'Hint Phase')).not.toBeChecked();
    await expect(row(page, mini.title)).toHaveCount(1);
    await expect(row(page, hints.title)).toHaveCount(0);
  });

  test('opening a filtered URL checks its options; unknown values are ignored', async ({ page }) => {
    const me = await freshBuilder(page);
    const hints = await seedOwn(me, 'hints');
    const draft = await seedOwn(me, 'grid');
    await openLibrary(page, '?play=bogus,complete&create=hint,public&size=Daily,huge&view=play');
    const checked = await page.getByRole('checkbox').evaluateAll((inputs) =>
      inputs.filter((i) => (i as HTMLInputElement).checked).map((i) => (i as HTMLInputElement).labels?.[0]?.textContent?.trim()));
    expect(checked).toEqual(['Complete', 'Hint Phase']);
    await expect(row(page, hints.title)).toHaveCount(1);
    await expect(row(page, draft.title)).toHaveCount(0);
  });
});

test.describe('18-S4-6 Reset', () => {
  test('appears once an option is checked, title-4 link-muted right of the Filters label, and clears everything, focusing the label', async ({ page }) => {
    const me = await freshBuilder(page);
    const draft = await seedOwn(me, 'grid');
    await openLibrary(page);
    const label = filtersLabel(page);
    await expect(label).toHaveCount(1);
    expect(await label.evaluate((el) => el.tagName.toLowerCase())).toBe('h2');
    await expect(reset(page)).toHaveCount(0);

    await check(page, 'Hint Phase');
    const button = reset(page);
    await expect(button).toBeVisible();
    await expectTextStyle(page, button, 'title-4', 'Reset');
    await page.mouse.move(0, 0);
    await expectTextColor(page, button, 'link-muted', 'Reset at rest');
    const l = await box(label);
    const b = await box(button);
    expect(b.x, 'right of the label').toBeGreaterThan(l.x + l.width);
    expect(await baseline(button), 'on the label’s baseline').toBeCloseTo(await baseline(label), 0);
    await button.hover();
    await expect.poll(async () => JSON.stringify(parseColor(await button.evaluate((el) => getComputedStyle(el).color))))
      .toBe(JSON.stringify(await token(page, 'button-hover')));

    await check(page, 'Mini');
    await check(page, 'Unplayed');
    await button.click();
    for (const [, options] of GROUPS) for (const name of options) await expect(option(page, name)).not.toBeChecked();
    await expect(reset(page)).toHaveCount(0);
    await expect(label).toBeFocused();
    await expect(page).toHaveURL(/\/puzzles$/);
    await expect(row(page, draft.title)).toHaveCount(1);
  });
});

test.describe('18-S4-7 the checkbox', () => {
  test('a 16px square with 4px corners, a 1px button-alternate-border outline; checked, button-fill with a white check', async ({ page }) => {
    await freshBuilder(page);
    await openLibrary(page);
    const input = option(page, 'Unplayed');
    await page.mouse.move(0, 0);

    const look = () => input.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
        radius: s.borderTopLeftRadius,
        border: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth],
        borderColor: s.borderTopColor,
        background: s.backgroundColor,
      };
    });
    const rest = await look();
    expect(rest.width).toBeCloseTo(16, 0);
    expect(rest.height).toBeCloseTo(16, 0);
    expect(rest.radius).toBe('4px');
    expect(rest.border).toEqual(['1px', '1px', '1px', '1px']);
    expectColor(rest.borderColor, await token(page, 'button-alternate-border'), 'outline');

    /** Counts blue (button-fill) and white pixels inside the box. */
    const pixels = async () => {
      const blue = await token(page, 'button-fill');
      const png = (await input.screenshot()).toString('base64');
      return page.evaluate(async ({ data, blue }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        const { data: px } = context.getImageData(2, 2, image.width - 4, image.height - 4);
        let blues = 0;
        let whites = 0;
        for (let i = 0; i < px.length; i += 4) {
          const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
          if (Math.abs(r - blue.r) + Math.abs(g - blue.g) + Math.abs(b - blue.b) < 12) blues++;
          if (r > 245 && g > 245 && b > 245) whites++;
        }
        return { blues, whites };
      }, { data: png, blue });
    };
    expect((await pixels()).blues, 'no fill unchecked').toBe(0);

    await input.check();
    await page.mouse.move(0, 0);
    await expect.poll(async () => parseColor(await input.evaluate((el) => getComputedStyle(el).backgroundColor)).a).toBe(1);
    const checked = await look();
    expectColor(checked.background, await token(page, 'button-fill'), 'checked fill');
    expectColor(checked.borderColor, await token(page, 'button-fill'), 'checked outline');
    const drawn = await pixels();
    expect(drawn.blues, 'filled blue').toBeGreaterThan(40);
    expect(drawn.whites, 'a white check').toBeGreaterThan(8);
  });

  test('its label is body-normal primary, 8px after the box and centered on it; keyboard focus rings the label, a click does not; Space toggles it', async ({ page }) => {
    await freshBuilder(page);
    await openLibrary(page);
    const input = option(page, 'Daily');
    const label = optionLabel(page, 'Daily');
    const text = label.getByText('Daily', { exact: true });
    await expectTextStyle(page, text, 'body-normal', 'option');
    await expectTextColor(page, text, 'primary', 'option');
    const i = await box(input);
    const t = await box(text);
    expect(t.x - (i.x + i.width), 'box to label').toBeCloseTo(8, 0);
    expect(t.y + t.height / 2, 'centered').toBeCloseTo(i.y + i.height / 2, 0);

    expect(await ringOf(label), 'idle').toBe('none');
    await tabTo(page, input);
    expect(await ringOf(label), 'keyboard focus').toBe(FOCUS_RING);
    await page.keyboard.press('Space');
    await expect(input).toBeChecked();
    await expect(page).toHaveURL(/\/puzzles\?size=daily$/);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    expect(await ringOf(label), 'blurred').toBe('none');
    await label.click();
    await expect(input).not.toBeChecked();
    await expect(input).toBeFocused();
    expect(await ringOf(label), 'clicked').toBe('none');
  });
});

test.describe('18-S4-8 the desktop left column', () => {
  test('the list column keeps its place; Create A Puzzle and the filters sit in a 200px column left of its hairline, the pair centered', async ({ page }) => {
    const me = await freshBuilder(page);
    await seedDraft(me, 'mini', 'mini draft');
    await openLibrary(page, '?create=build');
    const column = page.getByTestId('puzzle-library');
    const c = await box(column);
    const header = await box(page.getByTestId('app-header'));
    const viewport = await page.evaluate(() => document.documentElement.clientWidth);
    expect(c.y - (header.y + header.height), 'list column 90px below the masthead').toBeCloseTo(90, 0);
    expect(c.width, 'list column width').toBeCloseTo(700, 0);
    expect(await column.evaluate((el) => getComputedStyle(el).borderLeftWidth)).toBe('1px');
    expectColor(await column.evaluate((el) => getComputedStyle(el).borderLeftColor), await token(page, 'line-muted'), 'hairline');
    expect((c.x - 200 + c.x + c.width) / 2, 'the pair is centered').toBeCloseTo(viewport / 2, 0);

    const heading = await box(page.getByTestId('page-heading'));
    const list = await box(page.getByTestId('puzzle-list'));
    const firstGroupHeading = await box(page.getByTestId('puzzle-group-heading').first());
    expect(list.y - (heading.y + heading.height), 'heading to list').toBeCloseTo(27, 0);
    expect(firstGroupHeading.y, 'the first Row Heading at the list top').toBeCloseTo(list.y, 0);

    const button = page.getByTestId('new-puzzle-button');
    await expect(button).toHaveText('Create A Puzzle');
    const b = await box(button);
    expect(b.x, 'Create A Puzzle 200px left of the hairline').toBeCloseTo(c.x - 200, 0);
    expect(b.y, 'level with the list top').toBeCloseTo(list.y, 0);

    const label = filtersLabel(page);
    await expectTextStyle(page, label, 'title-4', 'Filters');
    await expectTextColor(page, label, 'primary', 'Filters');
    const l = await box(label);
    expect(l.y - (b.y + b.height), 'button to Filters').toBeCloseTo(20, 0);
    expect(l.x - b.x, 'Filters 6px in').toBeCloseTo(6, 0);
    await expect(toggle(page)).toBeHidden();

    let previousBottom = l.y + l.height;
    for (const [index, [legendText, options]] of GROUPS.entries()) {
      const group = page.getByRole('group', { name: legendText, exact: true });
      const legend = group.locator('legend');
      await expectTextStyle(page, legend, 'title-4', legendText);
      await expectTextColor(page, legend, 'primary', legendText);
      const g = await box(legend);
      expect(g.x, `${legendText} aligned with Filters`).toBeCloseTo(l.x, 0);
      expect(g.y - previousBottom, `${legendText} spacing`).toBeCloseTo(index === 0 ? 20 : 26, 0);
      let above = g.y + g.height;
      for (const [n, name] of options.entries()) {
        const o = await box(optionLabel(page, name));
        expect(o.height, `${name} row`).toBeCloseTo(20, 0);
        expect(o.y - above, `${name} spacing`).toBeCloseTo(n === 0 ? 14 : 13, 0);
        expect(o.x, `${name} aligned`).toBeCloseTo(l.x, 0);
        expect(o.x + o.width, `${name} inside the column`).toBeLessThanOrEqual(c.x);
        above = o.y + o.height;
        if (n === options.length - 1) previousBottom = above;
      }
    }
    expect(c.y + c.height, 'the hairline runs past the column').toBeGreaterThanOrEqual(previousBottom);

    await expect(page.getByTestId('new-puzzle')).toHaveAttribute('data-ready', 'true');
    await button.click();
    await expect(page.getByTestId('new-puzzle-dialog')).toBeVisible();
  });

  test('two columns from a 948px window; one below it', async ({ page }) => {
    await freshBuilder(page, { width: NARROWEST_TWO_COLUMNS, height: 800 });
    await openLibrary(page);
    let c = await box(page.getByTestId('puzzle-library'));
    let b = await box(page.getByTestId('new-puzzle-button'));
    expect(b.x, 'left column inside the window').toBeGreaterThanOrEqual(24 - 1);
    expect(b.x, 'left column left of the hairline').toBeLessThan(c.x);
    expect(c.x + c.width, 'list inside the window').toBeLessThanOrEqual(NARROWEST_TWO_COLUMNS);
    await expect(option(page, 'Mini')).toBeVisible();
    await expect(toggle(page)).toBeHidden();

    await page.setViewportSize({ width: NARROWEST_TWO_COLUMNS - 1, height: 800 });
    c = await box(page.getByTestId('puzzle-library'));
    b = await box(page.getByTestId('new-puzzle-button'));
    expect(b.x, 'one column: the button on the content edge').toBeCloseTo(c.x + 21, 0);
    await expect(toggle(page)).toBeVisible();
    await expect(option(page, 'Mini')).toBeHidden();
  });
});

test.describe('18-S4-9 smaller screens', () => {
  for (const viewport of [PHONE, { width: NARROWEST_TWO_COLUMNS - 1, height: 800 }]) {
    test(`at ${viewport.width}px: Create A Puzzle and a Filters button share a row; the panel opens above the list and closes with the button or Escape`, async ({ page }) => {
      const me = await freshBuilder(page, viewport);
      const draft = await seedOwn(me, 'grid');
      const hints = await seedOwn(me, 'hints');
      await openLibrary(page);
      const c = await box(page.getByTestId('puzzle-library'));
      const heading = await box(page.getByTestId('page-heading'));
      const button = toggle(page);
      const create = page.getByTestId('new-puzzle-button');

      await expect(button).toHaveText('Filters');
      await expectTextStyle(page, button, 'title-4', 'Filters button');
      await expectTextColor(page, button, 'link-muted', 'Filters button');
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      const panelId = await button.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      const panel = page.locator(`[id="${panelId}"]`);
      await expect(panel).toBeHidden();
      await expect(option(page, 'Mini')).toBeHidden();

      const k = await box(create);
      const t = await box(button);
      expect(k.x, 'Create A Puzzle on the content edge').toBeCloseTo(c.x + 21, 0);
      expect(k.y - (heading.y + heading.height), 'the row 27px below the heading').toBeCloseTo(27, 0);
      expect(t.x + t.width, 'Filters on the right edge').toBeCloseTo(c.x + c.width, 0);
      expect(t.y + t.height / 2, 'one row').toBeCloseTo(k.y + k.height / 2, 0);
      let list = await box(page.getByTestId('puzzle-list'));
      expect(list.y - (k.y + k.height), 'row to list').toBeCloseTo(27, 0);

      await button.click();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await expect(panel).toBeVisible();
      const p = await box(panel);
      list = await box(page.getByTestId('puzzle-list'));
      expect(p.y - (k.y + k.height), 'panel 16px below the row').toBeCloseTo(16, 0);
      expect(list.y - (p.y + p.height), 'list 27px below the panel').toBeCloseTo(27, 0);
      const legends = await Promise.all(GROUPS.map(([name]) => box(page.getByRole('group', { name, exact: true }))));
      expect(legends[1].x, 'Create beside Play').toBeGreaterThan(legends[0].x + legends[0].width);
      expect(legends[1].y, 'Create level with Play').toBeCloseTo(legends[0].y, 0);
      for (const g of legends) expect(g.x + g.width, 'inside the column').toBeLessThanOrEqual(c.x + c.width + 0.5);
      expect(await noHorizontalOverflow(page), 'nothing past the window').toBe(true);

      await check(page, 'Build Phase');
      await expect(button).toHaveText('Filters · 1');
      await expect(row(page, draft.title)).toHaveCount(1);
      await expect(row(page, hints.title)).toHaveCount(0);
      const l = await box(filtersLabel(page));
      const r = await box(reset(page));
      expect(r.x, 'Reset right of the label').toBeGreaterThan(l.x + l.width);
      await check(page, 'Midi');
      await expect(button).toHaveText('Filters · 2');
      await option(page, 'Midi').uncheck();

      await option(page, 'Build Phase').focus();
      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
      await expect(button).toBeFocused();
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      await expect(button).toHaveText('Filters · 1');
      await expect(row(page, hints.title)).toHaveCount(0);
      await expect(page).toHaveURL(/\/puzzles\?create=build$/);

      await button.click();
      await expect(panel).toBeVisible();
      await button.click();
      await expect(panel).toBeHidden();
      await expect(row(page, draft.title)).toHaveCount(1);
      await expect(row(page, hints.title)).toHaveCount(0);

      await page.reload();
      await page.waitForSelector('[data-testid="puzzle-library"][data-ready="true"]');
      await expect(panel, 'starts closed').toBeHidden();
      await expect(toggle(page)).toHaveText('Filters · 1');
    });
  }
});

test.describe('18-S4-10 the style guide', () => {
  test('catalogs the Checkbox, unchecked and checked', async ({ page }) => {
    await freshBuilder(page);
    await page.goto('/style-guide');
    const section = page.getByTestId('sg-checkbox');
    await expect(section).toBeVisible();
    const off = page.getByTestId('sg-checkbox-off').getByRole('checkbox');
    const on = page.getByTestId('sg-checkbox-on').getByRole('checkbox');
    await expect(off).toBeVisible();
    await expect(off).not.toBeChecked();
    await expect(on).toBeVisible();
    await expect(on).toBeChecked();
    expectColor(await on.evaluate((el) => getComputedStyle(el).backgroundColor), await token(page, 'button-fill'), 'checked sample');
    expect(await off.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe('4px');
  });
});
