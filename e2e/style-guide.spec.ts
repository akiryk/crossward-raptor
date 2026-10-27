import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const COLOR_TOKENS = [
  '--color-background',
  '--color-foreground',
  '--color-ink-2',
  '--color-ink-3',
  '--color-rule',
  '--color-rule-strong',
  '--color-hover-tint',
  '--color-panel-tint',
  '--color-accent',
  '--color-accent-hover',
  '--color-ok-tint',
  '--color-grid-empty',
  '--color-grid-line-build',
  '--color-grid-line-play',
  '--color-cell-fill',
  '--color-selected',
  '--color-slot',
  '--color-slot-content',
  '--color-required',
  '--color-recommended',
  '--color-locked-letter',
  '--color-editable-letter',
  '--color-incomplete',
];

const OTHER_TOKENS = [
  '--font-display',
  '--font-body',
  '--font-data',
  '--radius-btn',
  '--radius-md',
  '--radius-lg',
  '--radius-grid',
  '--grid-line-width',
  '--text-headline',
  '--text-body',
  '--text-help',
  '--text-label',
  '--weight-normal',
  '--weight-bold',
];

const SECTIONS = [
  'sg-text',
  'sg-buttons',
  'sg-hover',
  'sg-inputs',
  'sg-links',
  'sg-hint-rows',
  'sg-confirmation',
  'sg-error',
  'sg-tooltip',
  // 14-S4: the stepper sample is replaced by the builder-steps sample.
  'sg-builder-steps',
  'sg-grid-build',
  'sg-grid-preview',
  'sg-grid-hints',
  // 14-S12: the EDIT GRID sample became the focused-grid sample, and the
  // locked-letters sample is new.
  'sg-grid-hints-locked',
  'sg-grid-hints-selected',
];

const GRID_SAMPLES = [
  'sg-grid-build',
  'sg-grid-preview',
  'sg-grid-hints',
  // 14-S12: the EDIT GRID sample became the focused-grid sample, and the
  // locked-letters sample is new.
  'sg-grid-hints-locked',
  'sg-grid-hints-selected',
];
const TOLERANCE = 0.5;

function tokenValue(page: Page, name: string) {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name
  );
}

function cellIn(page: Page, sample: string, state: string) {
  return page.getByTestId(sample).locator(`[data-cell-state="${state}"]`);
}

async function measureSample(page: Page, sample: string) {
  return page.evaluate((testid) => {
    const section = document.querySelector(`[data-testid="${testid}"]`);
    const container = section?.querySelector('[data-testid="puzzle-grid"]');
    if (!container) throw new Error(`no puzzle-grid inside ${testid}`);
    const cells = Array.from(
      container.querySelectorAll('[data-testid="grid-cell"]')
    ) as HTMLElement[];
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        w: r.width,
        h: r.height,
      };
    };
    return { container: box(container), cells: cells.map(box) };
  }, sample);
}

// --- D8-1: structure ---
test.describe('D8-1 structure', () => {
  test('every example section still renders', async ({ page }) => {
    await page.goto('/style-guide');

    for (const section of SECTIONS) {
      await expect(page.getByTestId(section), `expected ${section}`).toBeVisible();
    }
  });

  test('every token still resolves, including the newly registered one', async ({ page }) => {
    await page.goto('/style-guide');

    for (const token of [...COLOR_TOKENS, ...OTHER_TOKENS]) {
      expect(await tokenValue(page, token), `expected ${token}`).not.toBe('');
    }
  });
});

// --- D8-3: real grids ---
test.describe('D8-3 real grid samples', () => {
  test('the build sample is a 10x10 showing every build state', async ({ page }) => {
    await page.goto('/style-guide');

    const sample = page.getByTestId('sg-grid-build');
    await expect(sample.getByTestId('grid-cell')).toHaveCount(100);

    for (const state of ['empty', 'letter', 'selected', 'slot', 'slot-letter', 'symmetric-hint']) {
      await expect(
        cellIn(page, 'sg-grid-build', state).first(),
        `expected a ${state} cell`
      ).toBeVisible();
    }
    await expect(sample.getByTestId('cell-number').first()).toBeVisible();
  });

  test('the active slot spans both lettered and empty cells', async ({ page }) => {
    await page.goto('/style-guide');

    // A slot cell holding a letter is styled 'slot-letter', distinct from a
    // plain empty 'slot' cell -- confirm the active slot really has both.
    const letterCells = cellIn(page, 'sg-grid-build', 'slot-letter');
    const emptyCells = cellIn(page, 'sg-grid-build', 'slot');

    const letterTexts = await letterCells.allTextContents();
    const emptyTexts = await emptyCells.allTextContents();

    expect(letterTexts.length).toBeGreaterThan(0);
    expect(letterTexts.every((t) => /[A-Z]/.test(t))).toBe(true);
    expect(emptyTexts.length).toBeGreaterThan(0);
    expect(emptyTexts.every((t) => !/[A-Z]/.test(t))).toBe(true);
  });

  test('the preview sample shows black, lettered and required cells', async ({ page }) => {
    await page.goto('/style-guide');

    for (const state of ['black', 'letter', 'required']) {
      await expect(
        cellIn(page, 'sg-grid-preview', state).first(),
        `expected a ${state} cell`
      ).toBeVisible();
    }
  });

  // --- H5-2: the hints-phase samples ---
  test('the hints sample shows black and locked-letter cells', async ({ page }) => {
    await page.goto('/style-guide');

    for (const state of ['black', 'locked-letter']) {
      await expect(
        cellIn(page, 'sg-grid-hints', state).first(),
        `expected a ${state} cell`
      ).toBeVisible();
    }
  });

  test('the hints sample shows no build-phase or editing states', async ({ page }) => {
    await page.goto('/style-guide');

    // The grid is locked there: no cursor, and every unfilled cell was
    // converted to black by the transition.
    for (const state of ['empty', 'selected', 'slot', 'editable-letter']) {
      await expect(
        cellIn(page, 'sg-grid-hints', state),
        `expected no ${state} cell`
      ).toHaveCount(0);
    }
  });

  // 14-S12 retired "the editing sample shows the EDIT GRID states
  // together": there is no EDIT GRID mode. Its replacement,
  // sg-grid-hints-selected, is checked by e2e/hints-grid-editing.spec.ts
  // (14-S12-7).

  // 14-S6 retired "the two hints samples differ only in their lettered-cell
  // state": locked and EDIT GRID letters are both play-cell-on now. The
  // samples' colors are checked by e2e/hint-phase-design.spec.ts (14-S6-6).

  for (const sample of GRID_SAMPLES) {
    test(`${sample}: geometry holds (measured)`, async ({ page }) => {
      await page.goto('/style-guide');

      const line = parseFloat(await tokenValue(page, '--grid-line-width'));
      const { container, cells } = await measureSample(page, sample);
      expect(cells.length).toBe(100);

      for (const cell of cells) {
        expect(cell.w).toBeCloseTo(cell.h, 0);
        expect(cell.w).toBeCloseTo(cells[0].w, 0);
      }

      let adjacencies = 0;
      for (const a of cells) {
        for (const b of cells) {
          if (Math.abs(a.top - b.top) < TOLERANCE && b.left > a.right - TOLERANCE) {
            const distance = b.left - a.right;
            if (distance < line * 4) {
              expect(distance).toBeCloseTo(line, 0);
              adjacencies++;
            }
          }
          if (Math.abs(a.left - b.left) < TOLERANCE && b.top > a.bottom - TOLERANCE) {
            const distance = b.top - a.bottom;
            if (distance < line * 4) {
              expect(distance).toBeCloseTo(line, 0);
              adjacencies++;
            }
          }
        }
      }
      expect(adjacencies).toBeGreaterThan(0);

      expect(Math.min(...cells.map((c) => c.left)) - container.left).toBeCloseTo(line, 0);
      expect(Math.min(...cells.map((c) => c.top)) - container.top).toBeCloseTo(line, 0);
      expect(container.right - Math.max(...cells.map((c) => c.right))).toBeCloseTo(line, 0);
      expect(container.bottom - Math.max(...cells.map((c) => c.bottom))).toBeCloseTo(line, 0);
    });
  }
});
