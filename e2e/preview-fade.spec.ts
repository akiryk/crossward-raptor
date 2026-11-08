import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// Story 22-S5 — Preview fades in and out.
//
// When Preview turns on or off, every grid cell whose color the toggle
// changes (its background, and its letter's color where that changes, as a
// locked word's gray letter turning black), and the grid's lines, move from
// the old color to the new one over 500ms, ease-in-out. Only the toggle
// fades: outside a fade, a cursor move, typing and a highlight change are
// instant. Turning Preview back during a fade goes back from where the
// colors are, without a jump. With reduced motion (this suite's default)
// there is no fade: the new colors show in the first frame.
//
// The fade is read through the browser's own animations
// (`Element.getAnimations()`), which hold a CSS transition or a Web
// Animation: caught and paused the moment the grid's mode changes, then
// sought to set times, so the curve is checked exactly, not against a
// timer. One real-time recording, once per animation frame, checks that it
// runs on its own in about half a second. "Instant" is checked frame by
// frame: no grid color animation runs, and the first frame showing a change
// already shows its final colors.
//
// Colors are the tokens' resolved values, written out here. Do not edit
// this file to match an implementation.

type Rgb = [number, number, number];
const GRAY_200: Rgb = [221, 224, 230]; // build-cell-off
const GRAY_700: Rgb = [20, 21, 27]; // preview-cell-off
const WHITE: Rgb = [255, 255, 255]; // build-cell-on
const CELL_ERROR: Rgb = [255, 37, 26]; // preview-cell-error
const GRAY_400: Rgb = [186, 188, 190]; // build-cell-border
const GRAY_500: Rgb = [139, 144, 154]; // preview-cell-border; a locked letter (21-S2)
const BLACK: Rgb = [0, 0, 0]; // primary, a letter
const YELLOW: Rgb = [252, 255, 77]; // the cursor

const FADE_MS = 500;
/** Seek times and the progress ease-in-out gives there (0.08, 0.5, 0.92),
 *  with room either side; linear (0.2, 0.5, 0.8) and ease (0.3, 0.8, 0.98)
 *  fall outside. */
const SEEKS: [number, number, number][] = [
  [100, 0.03, 0.15],
  [250, 0.45, 0.55],
  [400, 0.85, 0.97],
];
/** The real-time fade ends no sooner and no later than these after its first frame. */
const SETTLE_MIN_MS = 300;
const SETTLE_MAX_MS = 1200;
/** Long enough for a fade to have ended. */
const SETTLED_MS = 1200;

// A daily: CAT across the top makes (12–14,14) symmetric hints (Preview-red).
const OFF_CELL = '5,5';
const HINT_CELL = '14,14';

function gridWith(letters: Record<string, string>): Grid {
  let grid = createGrid({ cols: 15, rows: 15 });
  for (const [coord, letter] of Object.entries(letters)) {
    const [col, row] = coord.split(',').map(Number);
    grid = withLetter(grid, { col, row }, letter);
  }
  return grid;
}
const catGrid = () => gridWith({ '0,0': 'C', '1,0': 'A', '2,0': 'T' });
const TANGENT = ['3,2', '4,2', '5,2', '6,2', '7,2', '8,2', '9,2'];
const tangentGrid = () => gridWith(Object.fromEntries(TANGENT.map((coord, i) => [coord, 'TANGENT'[i]])));

let titleCounter = 0;
async function open(page: Page, grid: Grid, { motion, width = 1440 }: { motion: 'full' | 'reduced'; width?: number }) {
  titleCounter += 1;
  await page.setViewportSize({ width, height: 1000 });
  await page.emulateMedia({ reducedMotion: motion === 'full' ? 'no-preference' : 'reduce' });
  const { id } = await seedPuzzle({ grid, hints: {}, phase: 'grid' }, `22-S5 fade ${Date.now()}-${titleCounter}`);
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
}

const cell = (page: Page, coord: string) => page.locator(`[data-coord="${coord}"]`);
const gridEl = (page: Page) => page.getByTestId('puzzle-grid');
const toggleInput = (page: Page) => page.getByTestId('preview-toggle').locator('input');

function rgb(css: string): Rgb {
  const m = css.match(/[\d.]+/g);
  if (!m || m.length < 3) throw new Error(`not a color: ${css}`);
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

/** How far `color` is from `from` toward `to`, 0–1, over the channels that change. */
function progress(color: Rgb, from: Rgb, to: Rgb): number {
  const parts = [0, 1, 2]
    .filter((i) => Math.abs(to[i] - from[i]) >= 20)
    .map((i) => (color[i] - from[i]) / (to[i] - from[i]));
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

function expectColor(actual: Rgb, expected: Rgb, label: string, tolerance = 1) {
  const ok = actual.every((v, i) => Math.abs(v - expected[i]) <= tolerance);
  expect(ok, `${label}: rgb(${actual}) ≈ rgb(${expected})`).toBe(true);
}

/** Before the toggle: the first change of the grid's mode pauses every
 *  animation then running in the grid, before a frame is drawn. */
async function catchFade(page: Page) {
  await page.evaluate(() => {
    const grid = document.querySelector('[data-testid="puzzle-grid"]')!;
    const w = window as unknown as { __fade?: Animation[] };
    w.__fade = undefined;
    const observer = new MutationObserver(() => {
      observer.disconnect();
      const animations = grid.getAnimations({ subtree: true });
      for (const animation of animations) animation.pause();
      w.__fade = animations;
    });
    observer.observe(grid, { attributes: true, attributeFilter: ['data-grid-mode'] });
  });
}

type Target = { coord?: string; property: 'background-color' | 'color' };
type Caught = { duration: number | null; delay: number | null; seeks: string[]; count: number };

/** For each target (a cell's background, a color inside a cell, or the
 *  grid's own background: its lines), the caught animations of that
 *  property: their duration and delay, and the color at each seek time. */
async function readFade(page: Page, targets: Target[], times: number[]): Promise<Caught[]> {
  return page.evaluate(
    ({ targets, times }) => {
      const w = window as unknown as { __fade?: Animation[] };
      const animations = w.__fade ?? [];
      const grid = document.querySelector('[data-testid="puzzle-grid"]')!;
      const camel = (p: string) => p.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      return targets.map(({ coord, property }) => {
        const holder = coord ? document.querySelector(`[data-coord="${coord}"]`)! : grid;
        const mine = animations.filter((animation) => {
          const effect = animation.effect as KeyframeEffect | null;
          const target = effect?.target as Element | null;
          if (!effect || !target) return false;
          if (property === 'background-color' ? target !== holder : !holder.contains(target)) return false;
          const transition = (animation as Animation & { transitionProperty?: string }).transitionProperty;
          return transition === property || effect.getKeyframes().some((frame) => camel(property) in frame);
        });
        if (mine.length === 0) return { duration: null, delay: null, seeks: [], count: 0 };
        const effect = mine[0].effect as KeyframeEffect;
        const target = effect.target as Element;
        const seeks = times.map((t) => {
          for (const animation of mine) animation.currentTime = t;
          return getComputedStyle(target).getPropertyValue(property);
        });
        const timing = effect.getComputedTiming();
        return { duration: Number(timing.duration), delay: Number(effect.getTiming().delay ?? 0), seeks, count: mine.length };
      });
    },
    { targets, times }
  );
}

/** Lets every caught animation run to its end. */
async function releaseFade(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __fade?: Animation[] };
    for (const animation of w.__fade ?? []) animation.play();
  });
}

async function colorOf(page: Page, coord: string | null, property: 'background-color' | 'color' = 'background-color') {
  const locator = coord ? cell(page, coord) : gridEl(page);
  return rgb(await locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property));
}

/** The letter's color in a cell. */
async function letterColor(page: Page, coord: string) {
  return rgb(
    await cell(page, coord).evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const text = walker.nextNode();
      return getComputedStyle(text!.parentElement!).color;
    })
  );
}

function expectEased(caught: Caught, from: Rgb, to: Rgb, label: string) {
  expect(caught.count, `${label}: a running animation of it when the mode changed`).toBeGreaterThan(0);
  expect(caught.duration, `${label}: duration`).toBe(FADE_MS);
  expect(caught.delay, `${label}: delay`).toBe(0);
  SEEKS.forEach(([t, min, max], i) => {
    const p = progress(rgb(caught.seeks[i]), from, to);
    expect(p >= min && p <= max, `${label}: at ${t}ms ${caught.seeks[i]} is ${p.toFixed(3)} of the way (${min}–${max})`).toBe(true);
  });
}

type Frame = { t: number; mode: string | null; colors: Record<string, string>; running: number; selected: string | null; texts: Record<string, string> };

/** Records, once per animation frame, the grid's mode, the listed cells'
 *  backgrounds and texts, the cursor's cell and how many color animations
 *  run in the grid. `act` runs in the page after the first frames; the
 *  recording ends `afterMs` after it, or `capMs` from its start. With
 *  `reverseAt`, the toggle is clicked again in the first frame whose
 *  Preview fade of OFF_CELL is at least that far along. */
async function record(
  page: Page,
  coords: string[],
  { act, afterMs = 1500, capMs = 5000, reverseAt }: { act: 'toggle' | 'none'; afterMs?: number; capMs?: number; reverseAt?: number }
): Promise<{ frames: Frame[]; actAt: number; reversedAt: number | null }> {
  return page.evaluate(
    ({ coords, act, afterMs, capMs, reverseAt, from, to, offCell }) =>
      new Promise((resolve) => {
        const grid = document.querySelector('[data-testid="puzzle-grid"]')!;
        const input = document.querySelector<HTMLInputElement>('[data-testid="preview-toggle"] input')!;
        const frames: Frame[] = [];
        const w = window as unknown as { __recordedFrames?: number };
        w.__recordedFrames = 0;
        const start = performance.now();
        let actAt = act === 'none' ? start : -1;
        let reversedAt: number | null = null;
        const isColor = (animation: Animation) => {
          const transition = (animation as Animation & { transitionProperty?: string }).transitionProperty;
          if (transition) return /color/.test(transition);
          const effect = animation.effect as KeyframeEffect | null;
          return !!effect && effect.getKeyframes().some((frame) => 'backgroundColor' in frame || 'color' in frame);
        };
        // How far OFF_CELL is from gray-200 toward gray-700, read on the red
        // channel alone: the fade moves all three channels together (221→20,
        // 224→21, 230→27), so one stands for the rest.
        const along = (css: string) => {
          const c = (css.match(/[\d.]+/g) ?? []).map(Number);
          return (c[0] - from[0]) / (to[0] - from[0]);
        };
        function step(now: number) {
          const colors: Record<string, string> = {};
          const texts: Record<string, string> = {};
          for (const coord of coords) {
            const el = document.querySelector(`[data-coord="${coord}"]`)!;
            colors[coord] = getComputedStyle(el).backgroundColor;
            texts[coord] = el.textContent ?? '';
          }
          const mode = grid.getAttribute('data-grid-mode');
          frames.push({
            t: now,
            mode,
            colors,
            texts,
            running: grid.getAnimations({ subtree: true }).filter((a) => a.playState === 'running' && isColor(a)).length,
            selected: grid.querySelector('[data-selected="true"]')?.getAttribute('data-coord') ?? null,
          });
          w.__recordedFrames = frames.length;
          if (act === 'toggle' && actAt < 0 && frames.length === 3) {
            actAt = performance.now();
            input.click();
          } else if (reverseAt !== undefined && reversedAt === null && mode === 'preview' && along(colors[offCell]) >= reverseAt) {
            reversedAt = performance.now();
            input.click();
          }
          const end = reversedAt ?? actAt;
          if ((end >= 0 && now - end > afterMs) || now - start > capMs) {
            resolve({ frames, actAt, reversedAt });
            return;
          }
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }),
    { coords, act, afterMs, capMs, reverseAt, from: GRAY_200, to: GRAY_700, offCell: OFF_CELL }
  ) as Promise<{ frames: Frame[]; actAt: number; reversedAt: number | null }>;
}

test.describe('22-S5-10 Preview on fades in', () => {
  test('off cells, a symmetric hint and the lines move to Preview\'s colors over 500ms, ease-in-out', async ({ page }) => {
    await open(page, catGrid(), { motion: 'full' });
    await catchFade(page);
    await toggleInput(page).click({ force: true });
    await expect(gridEl(page)).toHaveAttribute('data-grid-mode', 'preview');
    // The cells' state is Preview's at once; only their colors move.
    await expect(cell(page, OFF_CELL)).toHaveAttribute('data-cell-state', 'black');

    const [off, hint, lines] = await readFade(
      page,
      [{ coord: OFF_CELL, property: 'background-color' }, { coord: HINT_CELL, property: 'background-color' }, { property: 'background-color' }],
      SEEKS.map(([t]) => t)
    );
    expectEased(off, GRAY_200, GRAY_700, 'an off cell, gray-200 to gray-700');
    expectEased(hint, WHITE, CELL_ERROR, 'a symmetric hint, white to red');
    expectEased(lines, GRAY_400, GRAY_500, 'the grid\'s lines');

    await releaseFade(page);
    await expect.poll(async () => (await colorOf(page, OFF_CELL)).join()).toBe(GRAY_700.join());
    expectColor(await colorOf(page, HINT_CELL), CELL_ERROR, 'the hint, at the end');
    expectColor(await colorOf(page, null), GRAY_500, 'the lines, at the end');
  });
});

test.describe('22-S5-11 Preview off fades out', () => {
  test('back to the build phase\'s colors the same way', async ({ page }) => {
    await open(page, catGrid(), { motion: 'full' });
    await toggleInput(page).click({ force: true });
    await expect(gridEl(page)).toHaveAttribute('data-grid-mode', 'preview');
    await page.waitForTimeout(SETTLED_MS);

    await catchFade(page);
    await toggleInput(page).click({ force: true });
    await expect(gridEl(page)).toHaveAttribute('data-grid-mode', 'build');
    const [off, hint, lines] = await readFade(
      page,
      [{ coord: OFF_CELL, property: 'background-color' }, { coord: HINT_CELL, property: 'background-color' }, { property: 'background-color' }],
      SEEKS.map(([t]) => t)
    );
    expectEased(off, GRAY_700, GRAY_200, 'an off cell, gray-700 to gray-200');
    expectEased(hint, CELL_ERROR, WHITE, 'a symmetric hint, red to white');
    expectEased(lines, GRAY_500, GRAY_400, 'the grid\'s lines');

    await releaseFade(page);
    await expect.poll(async () => (await colorOf(page, OFF_CELL)).join()).toBe(GRAY_200.join());
    expectColor(await colorOf(page, HINT_CELL), WHITE, 'the hint, at the end');
  });
});

test.describe('22-S5-12 in real time', () => {
  test('the fade starts at the old color, passes through the middle and ends on the new one in about half a second', async ({ page }) => {
    await open(page, catGrid(), { motion: 'full' });
    const { frames } = await record(page, [OFF_CELL], { act: 'toggle' });
    const fade = frames.filter((f) => f.mode === 'preview');
    expect(fade.length, 'frames in Preview').toBeGreaterThan(3);
    const along = fade.map((f) => progress(rgb(f.colors[OFF_CELL]), GRAY_200, GRAY_700));
    expect(along[0], `the first Preview frame is near gray-200 (${fade[0].colors[OFF_CELL]})`).toBeLessThanOrEqual(0.25);
    expect(along.some((p) => p >= 0.25 && p <= 0.75), `a frame mid-fade: ${along.map((p) => p.toFixed(2))}`).toBe(true);
    along.forEach((p, i) => {
      if (i > 0) expect(p, `frame ${i} never goes back`).toBeGreaterThanOrEqual(along[i - 1] - 0.02);
    });
    const end = fade.findIndex((f) => f.colors[OFF_CELL] === `rgb(${GRAY_700.join(', ')})`);
    expect(end, 'it reaches gray-700').toBeGreaterThan(0);
    const took = fade[end].t - fade[0].t;
    expect(took >= SETTLE_MIN_MS && took <= SETTLE_MAX_MS, `ends ${took.toFixed(0)}ms after the first frame`).toBe(true);
    for (const f of fade.slice(end)) expect(f.colors[OFF_CELL], 'and stays').toBe(`rgb(${GRAY_700.join(', ')})`);
  });
});

test.describe('22-S5-13 a locked word\'s gray letters fade to black', () => {
  test('the letter\'s color moves with the cell (Lock Word in the toggle row, 600px)', async ({ page }) => {
    await open(page, tangentGrid(), { motion: 'full', width: 600 });
    await cell(page, '6,2').click();
    await expect(cell(page, '6,2')).toHaveAttribute('data-selected', 'true');
    const control = page.getByTestId('lock-word-control');
    await expect(control).toHaveAttribute('aria-disabled', 'false');
    await control.click();
    await expect(control).toHaveText('Unlock Word');
    await expect.poll(async () => (await letterColor(page, '4,2')).join()).toBe(GRAY_500.join());

    await catchFade(page);
    await toggleInput(page).click({ force: true });
    await expect(gridEl(page)).toHaveAttribute('data-grid-mode', 'preview');
    const [letter] = await readFade(page, [{ coord: '4,2', property: 'color' }], SEEKS.map(([t]) => t));
    expectEased(letter, GRAY_500, BLACK, 'a locked letter, gray-500 to black');
    await releaseFade(page);
    await expect.poll(async () => (await letterColor(page, '4,2')).join()).toBe(BLACK.join());
  });
});

test.describe('22-S5-14 turning Preview back mid-fade', () => {
  test('goes back from where the colors are, with no jump', async ({ page }) => {
    await open(page, catGrid(), { motion: 'full' });
    const { frames, reversedAt } = await record(page, [OFF_CELL], { act: 'toggle', reverseAt: 0.3 });
    expect(reversedAt, 'turned back mid-fade').not.toBeNull();
    const at = (f: Frame) => progress(rgb(f.colors[OFF_CELL]), GRAY_200, GRAY_700);
    const lastOn = [...frames].reverse().find((f) => f.mode === 'preview')!;
    const back = frames.filter((f) => f.t > lastOn.t);
    expect(back.length, 'frames after turning back').toBeGreaterThan(3);
    expect(back[0].mode).toBe('build');
    expect(
      Math.abs(at(back[0]) - at(lastOn)),
      `the first frame back (${back[0].colors[OFF_CELL]}) continues from the last (${lastOn.colors[OFF_CELL]})`
    ).toBeLessThanOrEqual(0.15);
    back.forEach((f, i) => {
      if (i > 0) expect(at(f), `frame ${i} back never turns again`).toBeLessThanOrEqual(at(back[i - 1]) + 0.02);
    });
    const end = back.findIndex((f) => f.colors[OFF_CELL] === `rgb(${GRAY_200.join(', ')})`);
    expect(end, 'it gets back to gray-200').toBeGreaterThanOrEqual(0);
    expect(back[end].t - back[0].t, 'within the fade\'s time').toBeLessThanOrEqual(SETTLE_MAX_MS);
  });
});

/** Records around `action`: the recording has drawn its first frames
 *  before the action starts, and runs 1500ms from its start. */
async function recordAround(page: Page, coords: string[], action: () => Promise<void>) {
  const run = record(page, coords, { act: 'none', afterMs: 1500 });
  await page.waitForFunction(() => ((window as unknown as { __recordedFrames?: number }).__recordedFrames ?? 0) >= 2);
  await action();
  return (await run).frames;
}

/** A frame before the change was recorded; every frame from the first one
 *  showing it has the cells' final colors; and no frame has a color
 *  animation running in the grid. */
function expectInstant(frames: Frame[], changed: (f: Frame) => boolean, coords: string[], label: string) {
  const first = frames.findIndex(changed);
  expect(first, `${label}: the change shows, after a frame without it`).toBeGreaterThan(0);
  const final = frames[frames.length - 1];
  for (const f of frames.slice(first)) {
    for (const coord of coords) expect(f.colors[coord], `${label}: ${coord} from the first frame`).toBe(final.colors[coord]);
  }
  expect(Math.max(...frames.map((f) => f.running)), `${label}: no color animation in the grid`).toBe(0);
}

test.describe('22-S5-15 everything else stays instant (pass today)', () => {
  test('a click and typing, before any toggle, in Preview and after it', async ({ page }) => {
    await open(page, catGrid(), { motion: 'full' });

    // The build phase, never toggled: a click moves the cursor's yellow at once.
    let frames = await recordAround(page, ['10,10', '0,0'], () => cell(page, '10,10').click());
    expectInstant(frames, (f) => f.selected === '10,10', ['10,10', '0,0'], 'build, a click');
    expect(frames[frames.length - 1].colors['10,10']).toBe(`rgb(${YELLOW.join(', ')})`);

    // Typing a letter turns its counterpart (4,4) white at once.
    frames = await recordAround(page, ['4,4', '10,10'], () => page.keyboard.type('Q'));
    expectInstant(frames, (f) => f.texts['10,10'].includes('Q'), ['4,4'], 'build, typing');
    expect(frames[frames.length - 1].colors['4,4']).toBe(`rgb(${WHITE.join(', ')})`);

    // Preview, once its fade has ended: a click on the red cell, then a letter.
    await toggleInput(page).click({ force: true });
    await expect(gridEl(page)).toHaveAttribute('data-grid-mode', 'preview');
    await page.waitForTimeout(SETTLED_MS);
    frames = await recordAround(page, ['4,4', '12,14'], () => cell(page, '12,14').click());
    expectInstant(frames, (f) => f.selected === '12,14', ['12,14'], 'Preview, a click');
    frames = await recordAround(page, ['12,14', '13,14'], () => page.keyboard.type('S'));
    expectInstant(frames, (f) => f.texts['12,14'].includes('S'), ['12,14', '13,14'], 'Preview, typing');

    // Off again, once its fade has ended: a click.
    await toggleInput(page).click({ force: true });
    await expect(gridEl(page)).toHaveAttribute('data-grid-mode', 'build');
    await page.waitForTimeout(SETTLED_MS);
    frames = await recordAround(page, ['7,7', '12,14'], () => cell(page, '7,7').click());
    expectInstant(frames, (f) => f.selected === '7,7', ['7,7', '12,14'], 'after Preview, a click');
  });
});

test.describe('22-S5-16 reduced motion: no fade (pass today)', () => {
  test('the new colors in the first frame, both ways', async ({ page }) => {
    await open(page, catGrid(), { motion: 'reduced' });
    let { frames } = await record(page, [OFF_CELL, HINT_CELL], { act: 'toggle', afterMs: 600 });
    expectInstant(frames, (f) => f.mode === 'preview', [OFF_CELL, HINT_CELL], 'on');
    expect(frames[frames.length - 1].colors[OFF_CELL]).toBe(`rgb(${GRAY_700.join(', ')})`);
    ({ frames } = await record(page, [OFF_CELL, HINT_CELL], { act: 'toggle', afterMs: 600 }));
    expectInstant(frames, (f) => f.mode === 'build', [OFF_CELL, HINT_CELL], 'off');
    expect(frames[frames.length - 1].colors[OFF_CELL]).toBe(`rgb(${GRAY_200.join(', ')})`);
  });
});
