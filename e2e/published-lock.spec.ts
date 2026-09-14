import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

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

const cell = (page: Page, coord: string) => page.locator(`[data-coord="${coord}"]`);

async function openEditor(page: Page, id: string) {
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
}

async function seedHintsPhase() {
  return seedPuzzle({
    grid: fillAll(createGrid({ cols: 3, rows: 3 })),
    hints: ALL_HINTS,
    phase: 'hints',
  });
}

async function publish(page: Page) {
  await page.locator('[data-testid="step"][data-step-id="publish"]').click();
  await page.getByTestId('publish-button').click();
  await expect(page.getByTestId('unpublish-button')).toBeVisible();
}

// --- PB4-1: the lock ---
test.describe('PB4-1 a published puzzle is read-only', () => {
  test('controls are disabled and the lock is explained', async ({ page }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);
    await publish(page);

    const message = page.getByTestId('published-lock-message');
    await expect(message).toBeVisible();
    expect((await message.textContent())?.trim().length ?? 0).toBeGreaterThan(0);

    await expect(page.getByTestId('puzzle-title')).toBeDisabled();
    await expect(page.getByTestId('hint-input').first()).toBeDisabled();
    await expect(page.getByTestId('clear-letters-button')).toHaveCount(0);
  });

  test('typing a letter changes nothing', async ({ page }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);
    await publish(page);

    await cell(page, '1,1').click();
    await page.keyboard.press('z');

    await expect(cell(page, '1,1')).toContainText('A');
    await expect(cell(page, '1,1')).not.toContainText('Z');
  });

  test('Backspace changes nothing', async ({ page }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);
    await publish(page);

    await cell(page, '1,1').click();
    await page.keyboard.press('Backspace');

    await expect(cell(page, '1,1')).toContainText('A');
  });

  test('a geometry toggle is rejected by the existing hints-phase path', async ({ page }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);
    await publish(page);

    await cell(page, '1,1').click();
    await page.keyboard.press('.');

    await expect(cell(page, '1,1')).toHaveAttribute('data-kind', 'active');
    await expect(page.getByTestId('geometry-locked-message')).toBeVisible();
  });
});

// --- PB4-2: unpublishing restores editing ---
test.describe('PB4-2 unpublishing restores editing', () => {
  test('controls come back and letters can be typed again, without a reload', async ({
    page,
  }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);
    await publish(page);
    await expect(page.getByTestId('published-lock-message')).toBeVisible();

    await page.getByTestId('unpublish-button').click();

    await expect(page.getByTestId('published-lock-message')).toHaveCount(0);
    await expect(page.getByTestId('puzzle-title')).toBeEnabled();
    await expect(page.getByTestId('hint-input').first()).toBeEnabled();
    await expect(page.getByTestId('clear-letters-button')).toBeVisible();

    await cell(page, '1,1').click();
    await page.keyboard.press('z');
    await expect(cell(page, '1,1')).toContainText('Z');
  });
});

// --- PB4-3: an unpublished puzzle is unaffected ---
test.describe('PB4-3 an unpublished puzzle is unaffected', () => {
  test('no lock message, and editing works as before', async ({ page }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);

    await expect(page.getByTestId('published-lock-message')).toHaveCount(0);
    await expect(page.getByTestId('puzzle-title')).toBeEnabled();
    await expect(page.getByTestId('hint-input').first()).toBeEnabled();
    await expect(page.getByTestId('clear-letters-button')).toBeVisible();

    await cell(page, '1,1').click();
    await page.keyboard.press('z');
    await expect(cell(page, '1,1')).toContainText('Z');
  });

  test('hint text can still be edited', async ({ page }) => {
    const { id } = await seedHintsPhase();
    await openEditor(page, id);

    const input = page.locator('[data-hint-key="1-across"] [data-testid="hint-input"]');
    await input.fill('A brand new clue');

    await expect(input).toHaveValue('A brand new clue');
  });
});
