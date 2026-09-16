import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

/**
 *   C A T
 *   A . .
 *   T . .
 *
 * Lettered so the grid keeps active cells through the hints transition.
 */
function letteredGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3 });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  grid = withLetter(grid, { col: 0, row: 1 }, 'A');
  grid = withLetter(grid, { col: 0, row: 2 }, 'T');
  return grid;
}

async function open(page: Page, phase: 'grid' | 'hints' = 'grid') {
  const { id } = await seedPuzzle({ grid: letteredGrid(), hints: {}, phase });
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  return id;
}

function step(page: Page, id: string) {
  return page.locator(`[data-testid="step"][data-step-id="${id}"]`);
}

// --- D5b-2: the stepper ---
test.describe('D5b-2 stepper', () => {
  test('three steps render, with build current in grid phase', async ({ page }) => {
    await open(page);

    await expect(page.getByTestId('stepper')).toBeVisible();
    await expect(page.getByTestId('step')).toHaveCount(3);

    await expect(step(page, 'build')).toHaveAttribute('data-step-status', 'current');
    await expect(step(page, 'clues')).toHaveAttribute('data-step-status', 'available');
    await expect(step(page, 'publish')).toHaveAttribute('data-step-status', 'unavailable');
  });

  test('clicking an unavailable step reveals its reason', async ({ page }) => {
    await open(page);

    await expect(page.getByTestId('step-reason')).toHaveCount(0);

    await step(page, 'publish').click();

    const reason = page.getByTestId('step-reason');
    await expect(reason).toBeVisible();
    expect((await reason.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
  });

  // The enter-hints button and its confirmation were removed (visual-polish-02);
  // "Write clues" is the one control for entering hints phase, but it's a
  // no-op for now, pending a confirmation popup that doesn't exist yet. See
  // docs/handoffs/06-HANDOFF-visual-polish.md.
  test('clicking the clues step does nothing yet', async ({ page }) => {
    await open(page);

    await step(page, 'clues').click();

    await expect(page.getByTestId('step-reason')).toHaveCount(0);
    await expect(step(page, 'build')).toHaveAttribute('data-step-status', 'current');
    await expect(step(page, 'clues')).toHaveAttribute('data-step-status', 'available');
  });

  test('the build step explains itself rather than reversing the phase', async ({ page }) => {
    await open(page, 'hints');

    await expect(step(page, 'build')).toHaveAttribute('data-step-status', 'unavailable');

    await step(page, 'build').click();

    await expect(page.getByTestId('step-reason')).toBeVisible();
    await expect(step(page, 'build')).toHaveAttribute('data-step-status', 'unavailable');
  });

  test('no horizontal overflow at phone width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await open(page);

    await expect(page.getByTestId('stepper')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });
});
