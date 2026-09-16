import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

/** Fills every active cell so a puzzle can be made "clean". */
function fillAll(grid: Grid, letter = 'A'): Grid {
  let filled = grid;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (grid.at(col, row).kind === 'active') {
        filled = withLetter(filled, { col, row }, letter);
      }
    }
  }
  return filled;
}

const ALL_HINTS: Record<string, string> = {
  '1-across': 'a',
  '4-across': 'b',
  '5-across': 'c',
  '1-down': 'd',
  '2-down': 'e',
  '3-down': 'f',
};

async function openPublishStep(page: Page, id: string) {
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  await page.locator('[data-testid="step"][data-step-id="publish"]').click();
  await expect(page.getByTestId('step-reason')).toBeVisible();
}

// --- PB2-2: the readiness panel ---
test.describe('PB2-2 readiness panel', () => {
  test('the publish step reveals the panel', async ({ page }) => {
    const { id } = await seedPuzzle({
      grid: fillAll(createGrid({ cols: 3, rows: 3 })),
      hints: {},
      phase: 'hints',
    });
    await openPublishStep(page, id);

    const panel = page.getByTestId('readiness-panel');
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('step-reason').getByTestId('readiness-panel')).toBeVisible();
  });

  test('unwritten hints are reported', async ({ page }) => {
    const { id } = await seedPuzzle({
      grid: fillAll(createGrid({ cols: 3, rows: 3 })),
      hints: {},
      phase: 'hints',
    });
    await openPublishStep(page, id);

    const finding = page.locator('[data-testid="finding"][data-finding-kind="unwritten-hints"]');
    await expect(finding).toBeVisible();
    expect((await finding.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
  });

  test('an asymmetric grid is reported', async ({ page }) => {
    const { id } = await seedPuzzle({
      grid: fillAll(createGrid({ cols: 3, rows: 3, black: [{ col: 0, row: 0 }] })),
      hints: {},
      phase: 'hints',
    });
    await openPublishStep(page, id);

    await expect(
      page.locator('[data-testid="finding"][data-finding-kind="asymmetric"]')
    ).toBeVisible();
  });

  test('a puzzle with nothing outstanding says so', async ({ page }) => {
    const { id } = await seedPuzzle({
      grid: fillAll(createGrid({ cols: 3, rows: 3 })),
      hints: ALL_HINTS,
      phase: 'hints',
    });
    await openPublishStep(page, id);

    await expect(page.getByTestId('readiness-clear')).toBeVisible();
    await expect(page.getByTestId('finding')).toHaveCount(0);
  });

  test('the panel changes nothing about what the stepper permits', async ({ page }) => {
    const { id } = await seedPuzzle({
      grid: fillAll(createGrid({ cols: 3, rows: 3 })),
      hints: ALL_HINTS,
      phase: 'hints',
    });
    await openPublishStep(page, id);

    // a clean puzzle is no more or less publishable than a messy one --
    // hints phase alone makes publish available (Story PB3), regardless
    // of what the readiness panel reports
    await expect(
      page.locator('[data-testid="step"][data-step-id="publish"]')
    ).toHaveAttribute('data-step-status', 'available');
    await expect(
      page.locator('[data-testid="step"][data-step-id="build"]')
    ).toHaveAttribute('data-step-status', 'unavailable');
  });
});
