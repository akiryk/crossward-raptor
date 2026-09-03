import { test, expect } from '@playwright/test';
import { createGrid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

async function seedFullyActive3x3() {
  return seedPuzzle({ grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' });
}

// --- P4-2: phase controls and geometry toggling ---
test.describe('P4-2 phase controls and geometry toggling', () => {
  test('shows the grid phase badge and an enter-hints button', async ({ page }) => {
    const { id } = await seedFullyActive3x3();
    await page.goto(`/puzzles/${id}`);

    await expect(page.getByTestId('phase-badge')).toContainText('grid');
    await expect(page.getByTestId('enter-hints-button')).toBeVisible();
  });

  test('toggling a cell black also blackens its symmetric counterpart', async ({ page }) => {
    const { id } = await seedFullyActive3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.press('.');

    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute('data-kind', 'black');
    await expect(page.locator('[data-coord="2,2"]')).toHaveAttribute('data-kind', 'black');
  });

  test('toggling the same cell again turns it back active', async ({ page }) => {
    const { id } = await seedFullyActive3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.locator('[data-coord="1,1"]').click();
    await page.keyboard.press('.');
    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute('data-kind', 'black');

    await page.keyboard.press('.');
    await expect(page.locator('[data-coord="1,1"]')).toHaveAttribute('data-kind', 'active');
  });

  test('entering hints phase updates the badge and removes the button', async ({ page }) => {
    const { id } = await seedFullyActive3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('enter-hints-button').click();

    await expect(page.getByTestId('phase-badge')).toContainText('hints');
    await expect(page.getByTestId('enter-hints-button')).toHaveCount(0);
  });

  test('geometry edits are rejected in hints phase, with a visible message', async ({ page }) => {
    const { id } = await seedFullyActive3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('enter-hints-button').click();
    await expect(page.getByTestId('phase-badge')).toContainText('hints');

    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.press('.');

    await expect(page.locator('[data-coord="0,0"]')).toHaveAttribute('data-kind', 'active');
    await expect(page.getByTestId('geometry-locked-message')).toBeVisible();
  });

  test('the rejection message auto-dismisses', async ({ page }) => {
    const { id } = await seedFullyActive3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('enter-hints-button').click();
    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.press('.');

    await expect(page.getByTestId('geometry-locked-message')).toBeVisible();
    await expect(page.getByTestId('geometry-locked-message')).toBeHidden({ timeout: 4000 });
  });

  test('letter editing still works normally in hints phase', async ({ page }) => {
    const { id } = await seedFullyActive3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('enter-hints-button').click();
    await page.locator('[data-coord="0,0"]').click();
    await page.keyboard.press('x');

    await expect(page.locator('[data-coord="0,0"]')).toContainText('X');
  });

  test('the hints-phase transition persists across a reload', async ({ page }) => {
    const { id } = await seedFullyActive3x3();
    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);

    await page.getByTestId('enter-hints-button').click();
    await expect(page.getByTestId('phase-badge')).toContainText('hints');

    await page.reload();

    await expect(page.getByTestId('phase-badge')).toContainText('hints', { timeout: 15000 });
  });
});
