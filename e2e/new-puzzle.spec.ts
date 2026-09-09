import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { waitForEditorReady } from './helpers/wait-for-ready';

function uniqueTitle(label: string) {
  return `D6 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sizeOption(page: Page, size: string) {
  return page.locator(`[data-testid="new-puzzle-size"] [data-size="${size}"]`);
}

async function openDialog(page: Page) {
  await page.goto('/puzzles');
  await page.getByTestId('new-puzzle-button').click();
  await expect(page.getByTestId('new-puzzle-dialog')).toBeVisible();
}

async function createPuzzle(page: Page, title: string, size?: string) {
  await openDialog(page);
  await page.getByTestId('new-puzzle-name').fill(title);
  if (size) await sizeOption(page, size).click();
  await page.getByTestId('new-puzzle-create').click();
  await page.waitForURL(/\/puzzles\/[^/]+$/);
  await waitForEditorReady(page);
}

// --- D6-3: the dialog ---
test.describe('D6-3 new-puzzle dialog', () => {
  test('the button opens a dialog rather than creating a puzzle', async ({ page }) => {
    await page.goto('/puzzles');
    const url = page.url();

    await page.getByTestId('new-puzzle-button').click();

    await expect(page.getByTestId('new-puzzle-dialog')).toBeVisible();
    expect(page.url()).toBe(url);
  });

  test('the name input is focused on open', async ({ page }) => {
    await openDialog(page);

    const focused = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') ?? ''
    );
    expect(focused).toBe('new-puzzle-name');
  });

  test('daily is selected by default', async ({ page }) => {
    await openDialog(page);

    await expect(sizeOption(page, 'daily')).toHaveAttribute('data-selected', 'true');
    await expect(sizeOption(page, 'mini')).toHaveAttribute('data-selected', 'false');
    await expect(sizeOption(page, 'sunday')).toHaveAttribute('data-selected', 'false');
  });

  test('create is disabled until a name is typed', async ({ page }) => {
    await openDialog(page);

    await expect(page.getByTestId('new-puzzle-create')).toBeDisabled();

    await page.getByTestId('new-puzzle-name').fill('Has a name');
    await expect(page.getByTestId('new-puzzle-create')).toBeEnabled();
  });

  test('a whitespace-only name does not enable create', async ({ page }) => {
    await openDialog(page);

    await page.getByTestId('new-puzzle-name').fill('   ');
    await expect(page.getByTestId('new-puzzle-create')).toBeDisabled();
  });

  test('cancelling closes the dialog and creates nothing', async ({ page }) => {
    const title = uniqueTitle('cancelled');
    await openDialog(page);

    await page.getByTestId('new-puzzle-name').fill(title);
    await page.getByTestId('new-puzzle-cancel').click();

    await expect(page.getByTestId('new-puzzle-dialog')).toHaveCount(0);
    await expect(page.getByTestId('puzzle-list')).not.toContainText(title);
  });

  test('Escape closes the dialog', async ({ page }) => {
    await openDialog(page);

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('new-puzzle-dialog')).toHaveCount(0);
  });

  test('creating a mini puzzle yields a 5x5 named as typed', async ({ page }) => {
    const title = uniqueTitle('mini');
    await createPuzzle(page, title, 'mini');

    await expect(page.getByTestId('puzzle-title')).toHaveValue(title);
    await expect(page.getByTestId('grid-cell')).toHaveCount(25);
  });

  test('the default size yields a 15x15', async ({ page }) => {
    const title = uniqueTitle('daily');
    await createPuzzle(page, title);

    await expect(page.getByTestId('puzzle-title')).toHaveValue(title);
    await expect(page.getByTestId('grid-cell')).toHaveCount(225);
  });

  test('creating a sunday puzzle yields a 21x21', async ({ page }) => {
    const title = uniqueTitle('sunday');
    await createPuzzle(page, title, 'sunday');

    await expect(page.getByTestId('grid-cell')).toHaveCount(441);
  });

  test('the new puzzle appears in the list under its typed name', async ({ page }) => {
    const title = uniqueTitle('listed');
    await createPuzzle(page, title, 'mini');

    await page.goto('/puzzles');
    await expect(page.getByTestId('puzzle-list')).toContainText(title);
  });
});
