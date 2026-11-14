import { test, expect } from '@playwright/test';
import { createGrid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { addJay, collaboratorContext } from './helpers/collaborators';
import { COLLABORATOR_EMAIL, readPuzzleBuilderId } from './helpers/ownership';
import { readUser } from './helpers/collaborator-management';
import { waitForEditorReady } from './helpers/wait-for-ready';

test('24-S8 collaboration link alignment, typography and live Add/Edit labels', async ({ page }) => {
  const { id } = await seedPuzzle({ grid: createGrid({ cols: 15, rows: 15 }), hints: {}, phase: 'grid' }, `24-S8 toolbar ${Date.now()}`);
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  const link = page.getByTestId('editor-collaborators');
  const rebus = page.getByTestId('rebus-control');
  await expect(link).toHaveText('Add Collaborators');
  for (const width of [1440, 1000, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(link).toHaveCSS('font-size', '14px');
    await expect(rebus).toHaveCSS('font-size', '14px');
    await expect(page.locator('[data-toggle-label]').first()).toHaveCSS('font-size', '14px');
    await expect.poll(async () => {
      const a = (await link.boundingBox())!;
      const b = (await rebus.boundingBox())!;
      return Math.abs(a.x + a.width - b.x - b.width);
    }).toBeLessThan(1);
    expect((await link.boundingBox())!.y).toBeLessThan((await rebus.boundingBox())!.y);
    await expect(link).toHaveCSS('color', await rebus.evaluate((node) => getComputedStyle(node).color));
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await link.click();
  const dialog = page.getByTestId('collaborators-dialog');
  await dialog.getByTestId('collaborators-email').fill(COLLABORATOR_EMAIL);
  await dialog.getByTestId('collaborators-add').click();
  await expect(dialog.getByTestId('collaborator-row')).toContainText('Jay');
  await page.keyboard.press('Escape');
  await expect(link).toHaveText('Edit Collaborators');
  await link.click();
  await dialog.getByTestId('collaborator-remove').click();
  await expect(dialog.getByTestId('collaborators-empty')).toBeVisible();
  await dialog.getByTestId('collaborators-email').fill(`s8-${Date.now()}@example.test`);
  await dialog.getByTestId('collaborators-add').click();
  await expect(dialog.getByTestId('invitation-row')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(link).toHaveText('Edit Collaborators');
  await page.reload();
  await waitForEditorReady(page);
  await expect(link).toHaveText('Edit Collaborators');
  await link.click();
  await dialog.getByTestId('invitation-revoke').click();
  await expect(dialog.getByTestId('collaborators-empty')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(link).toHaveText('Add Collaborators');
});

test('24-S8 library names show owner first and collaborators for both accounts', async ({ page, browser }) => {
  const title = `24-S8 names ${Date.now()}`;
  const { id } = await seedPuzzle({ grid: createGrid({ cols: 5, rows: 5 }), hints: {}, phase: 'grid' }, title);
  await addJay(id);
  const owner = await readUser(await readPuzzleBuilderId(id));
  const jay = await collaboratorContext(browser);
  try {
    for (const viewer of [page, jay.page]) {
      await viewer.goto('/puzzles');
      const row = viewer.getByTestId('puzzle-list-item').filter({ has: viewer.getByTestId('puzzle-list-title').getByText(title, { exact: true }) });
      await expect(row.getByTestId('puzzle-builder-name')).toHaveText(owner.displayName!.trim());
      await expect(row.getByTestId('puzzle-owner-label')).toHaveText(', (owner)');
      await expect(row.getByTestId('puzzle-owner-label')).toHaveCSS('font-weight', '400');
      await expect(row.getByTestId('puzzle-collaborator-name')).toHaveText('Jay');
      const titleBox = (await row.getByTestId('puzzle-list-title').boundingBox())!;
      const ownerBox = (await row.getByTestId('puzzle-builder-name').boundingBox())!;
      const memberBox = (await row.getByTestId('puzzle-collaborator-name').boundingBox())!;
      expect(ownerBox.y - titleBox.y - titleBox.height).toBeCloseTo(4, 0);
      expect(memberBox.y - ownerBox.y - ownerBox.height).toBeCloseTo(4, 0);
      expect(memberBox.x).toBeCloseTo(ownerBox.x, 0);
      const rowBox = (await row.boundingBox())!;
      expect(memberBox.y + memberBox.height).toBeLessThanOrEqual(rowBox.y + rowBox.height);
    }
  } finally {
    await jay.context.close();
  }
});
