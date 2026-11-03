import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { withLetter } from '../src/engine/grid';
import { seedBuilderEditPuzzle, type BuilderEditState } from './helpers/builder-edits';
import { currentBuilderId, ownershipTestClient, seedOtherBuilder } from './helpers/ownership';
import { playPuzzleFixture, seedPlayPuzzle, seedPlaySession } from './helpers/play-route';
import { signInSeededUser } from './helpers/seed-session';

// Story 18-S6 — Narrow right margin.
//
// Below the two-column breakpoint (a 948px window, 18-S4) `/puzzles` is one
// column. Its content (the Create A Puzzle and Filters row, the open Filters
// panel and the puzzle rows) sits 21px inside the list's hairline on the
// left (the 1px hairline and 20px of padding). It has the same margin on
// the right: the window's right edge is as far from the content's right
// edge as its left edge is from the content's left edge, at every
// one-column width, and never less than 21px. Nothing runs past the window
// from 375px up (320px keeps epic 15's known date overflow, so only the
// margins are checked there). From 375px up a row keeps its title column
// at least 90px wide; its date, even a long one ("September 30, 2026"),
// takes the rest in at most two lines, inside the row, after the title,
// the builder name and the in-play marker and before the play Reset and the
// menu button.
//
// From 948px the two-column layout is unchanged: the 700px list column, the
// 900px pair centered, Create A Puzzle 200px left of the hairline, rows
// filling the list column.
//
// The suite shares one database, so rows are found by unique titles. Do not
// edit this file to match an implementation.

test.use({ storageState: { cookies: [], origins: [] } });

const NARROWEST_TWO_COLUMNS = 948;
const CONTENT_INSET_PX = 21;
const ONE_COLUMN_WIDTHS = [320, 375, 600, 710, 899, NARROWEST_TWO_COLUMNS - 1];
// The longest month, so the date is as wide as it gets.
const LONG_DATE = new Date('2026-09-30T12:00:00Z');
const LONG_DATE_TEXT = 'September 30, 2026';
const TITLE_COLUMN_MIN_PX = 90;
const LINE_PX = 20;

/** Page-relative box with its right edge. */
async function box(locator: Locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height, right: r.right + window.scrollX };
  });
}

function windowWidth(page: Page) {
  return page.evaluate(() => document.documentElement.clientWidth);
}

function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
}

function uniqueTitle(label: string) {
  return `S6 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function setUpdatedAt(puzzleId: string, at: Date) {
  const client = ownershipTestClient();
  try {
    await client.$executeRaw`UPDATE "Puzzle" SET "updatedAt" = ${at} WHERE "id" = ${puzzleId}`;
  } finally {
    await client.$disconnect();
  }
}

/** A published puzzle `playerId` has completed (stamped), so its row has the play Reset. */
async function seedCompleted(builderId: string, playerId: string) {
  const puzzle = playPuzzleFixture();
  const fixture = await seedPlayPuzzle({ builderId, puzzle });
  const sessionId = await seedPlaySession(playerId, fixture.id, puzzle.grid);
  const client = ownershipTestClient();
  try {
    await client.playSession.update({ where: { id: sessionId }, data: { completedAt: new Date('2026-01-04T04:05:06Z') } });
  } finally {
    await client.$disconnect();
  }
  return fixture;
}

/** A published puzzle `playerId` has started and not finished, so its row shows [in-play]. */
async function seedInPlay(builderId: string, playerId: string) {
  const puzzle = playPuzzleFixture();
  const fixture = await seedPlayPuzzle({ builderId, puzzle });
  // One letter cleared from the solution: started, not finished.
  await seedPlaySession(playerId, fixture.id, withLetter(puzzle.grid, { col: 0, row: 0 }, null));
  return fixture;
}

interface Seeded { title: string; menu: boolean; reset: boolean; marker: boolean }

/**
 * A brand-new builder at `width`, with a draft in each phase, an unlisted
 * published puzzle, their own completed puzzle (menu and Reset), another
 * builder's they completed (Reset only) and another builder's they have
 * started ([in-play]), every one last updated on September 30.
 */
async function libraryAt(page: Page, width: number): Promise<Seeded[]> {
  await page.setViewportSize({ width, height: 800 });
  await signInSeededUser(page);
  const me = await currentBuilderId(page);
  const seeded: (Seeded & { id: string })[] = [];
  for (const state of ['grid', 'hints', 'private published'] as BuilderEditState[]) {
    const title = uniqueTitle(state);
    const { id } = await seedBuilderEditPuzzle(title, me, state);
    seeded.push({ id, title, menu: true, reset: false, marker: false });
  }
  const own = await seedCompleted(me, me);
  // 19-S3: the caller's own completed row offers Reset in its menu.
  seeded.push({ id: own.id, title: own.title, menu: true, reset: false, marker: false });
  const other = await seedOtherBuilder();
  const foreign = await seedCompleted(other, me);
  seeded.push({ id: foreign.id, title: foreign.title, menu: false, reset: true, marker: false });
  const started = await seedInPlay(other, me);
  seeded.push({ id: started.id, title: started.title, menu: false, reset: false, marker: true });
  for (const { id } of seeded) await setUpdatedAt(id, LONG_DATE);
  // Only this builder's drafts, unlisted puzzle and played puzzles, so the
  // shared database's other puzzles stay out of the list.
  await page.goto('/puzzles?play=underway,complete&create=build,hint,unlisted');
  await page.waitForSelector('[data-testid="puzzle-library"][data-ready="true"]');
  return seeded.map(({ title, menu, reset, marker }) => ({ title, menu, reset, marker }));
}

function row(page: Page, title: string) {
  return page.getByTestId('puzzle-list-item').filter({ hasText: title });
}

const toggle = (page: Page) => page.getByRole('button', { name: /^Filters/ });

test.describe('18-S6-1 one column has equal left and right margins', () => {
  for (const width of ONE_COLUMN_WIDTHS) {
    test(`at ${width}px: the Create A Puzzle and Filters row, the open panel and the rows are as far from the right edge as from the left`, async ({ page }) => {
      const titles = await libraryAt(page, width);
      const w = await windowWidth(page);

      const create = await box(page.getByTestId('new-puzzle-button'));
      const filters = await box(toggle(page));
      const left = create.x;
      expect(left, 'the content is 21px or more from the left edge').toBeGreaterThanOrEqual(CONTENT_INSET_PX - 0.5);
      expect(w - filters.right, 'Filters as far from the right edge as Create A Puzzle from the left').toBeCloseTo(left, 0);

      expect(titles).toHaveLength(6);
      for (const { title } of titles) {
        const r = await box(row(page, title));
        expect(r.x, `${title}: left edge on the content edge`).toBeCloseTo(left, 0);
        expect(w - r.right, `${title}: right margin equals the left`).toBeCloseTo(left, 0);
      }

      await toggle(page).click();
      const panel = page.getByTestId('puzzle-filters');
      await expect(panel).toBeVisible();
      for (const name of ['Play', 'Create', 'Size']) {
        const g = await box(page.getByRole('group', { name, exact: true }));
        expect(g.x, `${name} inside the left margin`).toBeGreaterThanOrEqual(left - 0.5);
        expect(g.right, `${name} inside the right margin`).toBeLessThanOrEqual(w - left + 0.5);
      }
      const p = await box(panel);
      expect(p.right, 'the panel inside the right margin').toBeLessThanOrEqual(w - left + 0.5);
    });
  }
});

test.describe('18-S6-2 nothing runs past the window in one column', () => {
  for (const width of ONE_COLUMN_WIDTHS.filter((n) => n >= 375)) {
    test(`at ${width}px, with the panel closed and open`, async ({ page }) => {
      await libraryAt(page, width);
      expect(await noHorizontalOverflow(page), 'panel closed').toBe(true);
      await toggle(page).click();
      await expect(page.getByTestId('puzzle-filters')).toBeVisible();
      expect(await noHorizontalOverflow(page), 'panel open').toBe(true);
    });
  }
});

test.describe('18-S6-3 two columns are unchanged', () => {
  for (const width of [NARROWEST_TWO_COLUMNS, 1280]) {
    test(`at ${width}px: the 700px list column, the 900px pair centered, rows filling the column`, async ({ page }) => {
      const titles = await libraryAt(page, width);
      const w = await windowWidth(page);
      const c = await box(page.getByTestId('puzzle-library'));
      expect(c.width, 'list column width').toBeCloseTo(700, 0);
      expect((c.x - 200 + c.right) / 2, 'the pair is centered').toBeCloseTo(w / 2, 0);
      const create = await box(page.getByTestId('new-puzzle-button'));
      expect(create.x, 'Create A Puzzle 200px left of the hairline').toBeCloseTo(c.x - 200, 0);
      await expect(toggle(page)).toBeHidden();
      for (const { title } of titles) {
        const r = await box(row(page, title));
        expect(r.x, `${title}: 21px inside the hairline`).toBeCloseTo(c.x + CONTENT_INSET_PX, 0);
        expect(r.right, `${title}: to the column's right edge`).toBeCloseTo(c.right, 0);
      }
      expect(await noHorizontalOverflow(page)).toBe(true);
    });
  }
});

test.describe('18-S6-4 a row\'s contents stay inside it in one column', () => {
  for (const width of [375, 600, 899]) {
    test(`at ${width}px: the title column keeps 90px; a long date takes the rest in at most two lines, after the title and before Reset and the menu`, async ({ page }) => {
      const seeded = await libraryAt(page, width);
      for (const { title, menu, reset, marker } of seeded) {
        const item = row(page, title);
        const r = await box(item);
        const date = item.getByTestId('puzzle-list-updated');
        await expect(date).toHaveText(LONG_DATE_TEXT);
        const d = await box(date);
        expect(d.height, `${title}: date in at most two lines`).toBeLessThanOrEqual(2 * LINE_PX + 0.5);
        expect(await date.evaluate((el) => el.scrollWidth <= el.clientWidth), `${title}: date text inside its box`).toBe(true);
        expect(d.y + d.height, `${title}: date inside the row`).toBeLessThanOrEqual(r.y + r.height + 0.5);

        // The builder name is a block the width of the title column.
        const name = await box(item.getByTestId('puzzle-builder-name'));
        expect(name.width, `${title}: title column at least ${TITLE_COLUMN_MIN_PX}px`).toBeGreaterThanOrEqual(TITLE_COLUMN_MIN_PX - 0.5);
        const t = await box(item.getByTestId('puzzle-list-title'));
        expect(t.x, `${title}: title inside the row`).toBeGreaterThanOrEqual(r.x);
        expect(t.right, `${title}: title before the date`).toBeLessThanOrEqual(d.x + 0.5);
        expect(name.right, `${title}: builder name before the date`).toBeLessThanOrEqual(d.x + 0.5);
        const cue = item.getByTestId('puzzle-play-state');
        await expect(cue).toHaveCount(marker ? 1 : 0);
        if (marker) {
          await expect(cue).toBeVisible();
          expect((await box(cue)).right, `${title}: [in-play] before the date`).toBeLessThanOrEqual(d.x + 0.5);
        }

        let end = r.right;
        await expect(item.getByTestId('puzzle-menu-button')).toHaveCount(menu ? 1 : 0);
        await expect(item.getByTestId('puzzle-reset-button')).toHaveCount(reset ? 1 : 0);
        if (menu) {
          const m = await box(item.getByTestId('puzzle-menu-button'));
          expect(m.right, `${title}: menu inside the row`).toBeLessThanOrEqual(r.right + 0.5);
          end = Math.min(end, m.x);
        }
        if (reset) {
          const k = await box(item.getByTestId('puzzle-reset-button'));
          expect(k.right, `${title}: Reset inside the row`).toBeLessThanOrEqual(r.right + 0.5);
          if (menu) {
            const m = await box(item.getByTestId('puzzle-menu-button'));
            expect(k.right, `${title}: Reset before the menu`).toBeLessThanOrEqual(m.x + 0.5);
          }
          end = Math.min(end, k.x);
        }
        expect(d.right, `${title}: date before the row's controls`).toBeLessThanOrEqual(end + 0.5);
      }
    });
  }
});
