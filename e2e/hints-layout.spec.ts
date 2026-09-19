import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

/**
 * A 5x5 with black corners at (4,0) and (0,4), every other cell lettered.
 * Answers come out at two different lengths (4 and 5), which is the point:
 * the layout must line every input up regardless of how long each row's
 * answer is.
 */
function mixedLengthGrid(): Grid {
  let grid = createGrid({ cols: 5, rows: 5, black: [{ col: 4, row: 0 }, { col: 0, row: 4 }] });
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      if (grid.at(col, row).kind === 'active') {
        grid = withLetter(grid, { col, row }, 'A');
      }
    }
  }
  return grid;
}

async function openPuzzle(page: Page) {
  const { id } = await seedPuzzle({ grid: mixedLengthGrid(), hints: {}, phase: 'hints' });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  await expect(page.getByTestId('hints-region')).toBeVisible();
  return id;
}

/**
 * For each column, the x/width of the column itself plus the x/width of
 * every hint-input and hint-answer inside it.
 */
async function measureColumns(page: Page) {
  return page.evaluate(() => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, width: r.width };
    };
    return Array.from(document.querySelectorAll('[data-testid="hint-column"]')).map((col) => ({
      orientation: col.getAttribute('data-orientation'),
      column: box(col),
      inputs: Array.from(col.querySelectorAll('[data-testid="hint-input"]')).map(box),
      answers: Array.from(col.querySelectorAll('[data-testid="hint-answer"]')).map(box),
    }));
  });
}

const TOLERANCE = 1;

test.describe('H5-1 clue row layout', () => {
  test('every input in a column starts at the same x', async ({ page }) => {
    await openPuzzle(page);
    const columns = await measureColumns(page);

    for (const { orientation, inputs } of columns) {
      expect(inputs.length, `${orientation} rows`).toBeGreaterThan(1);
      for (const input of inputs) {
        expect(input.left, `${orientation} input left`).toBeCloseTo(inputs[0].left, 0);
      }
    }
  });

  test('both columns place their inputs at the same offset', async ({ page }) => {
    await openPuzzle(page);
    const columns = await measureColumns(page);

    expect(columns.length).toBe(2);
    const offsets = columns.map((c) => c.inputs[0].left - c.column.left);
    expect(Math.abs(offsets[0] - offsets[1])).toBeLessThanOrEqual(TOLERANCE);
  });

  test('every answer starts at the same offset within its column', async ({ page }) => {
    await openPuzzle(page);
    const columns = await measureColumns(page);

    const offsets: number[] = [];
    for (const { orientation, answers, column } of columns) {
      expect(answers.length, `${orientation} answers`).toBeGreaterThan(1);
      for (const answer of answers) {
        expect(answer.left - column.left, `${orientation} answer offset`).toBeCloseTo(
          answers[0].left - column.left,
          0
        );
      }
      offsets.push(answers[0].left - column.left);
    }
    expect(Math.abs(offsets[0] - offsets[1])).toBeLessThanOrEqual(TOLERANCE);
  });

  test('each input fills the rest of its column', async ({ page }) => {
    await openPuzzle(page);
    const columns = await measureColumns(page);

    for (const { orientation, inputs, column } of columns) {
      for (const input of inputs) {
        expect(column.right - input.right, `${orientation} input right edge`).toBeLessThanOrEqual(
          TOLERANCE
        );
      }
    }
  });

  test('the input is wider than its default intrinsic width', async ({ page }) => {
    await openPuzzle(page);
    const columns = await measureColumns(page);

    // A bare <input> defaults to roughly 20 characters, around 180px. The
    // point of this story is that it grows past that to fill the column.
    for (const { orientation, inputs, column } of columns) {
      expect(inputs[0].width, `${orientation} input width`).toBeGreaterThan(column.width / 2);
    }
  });
});
