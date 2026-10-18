import { test, expect, type Page } from '@playwright/test';
import { currentBuilderId, seedOtherBuilder } from './helpers/ownership';
import { builderEditSnapshot, seedBuilderEditPuzzle, type BuilderEditState } from './helpers/builder-edits';
import { waitForEditorReady } from './helpers/wait-for-ready';

function title(label: string) { return `O3 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function item(page: Page, name: string) { return page.getByTestId('puzzle-list-item').filter({ hasText: name }); }
const states: BuilderEditState[] = ['grid', 'hints', 'private published', 'public published'];

test('O3 the unfiltered library distinguishes builders and gives only owners Edit, across reloads', async ({ page }) => {
  const own = await currentBuilderId(page);
  const other = await seedOtherBuilder();
  const fixtures = [];
  for (const builder of [own, other]) {
    for (const state of states) {
      const name = title(`${builder === own ? 'own' : 'foreign'} ${state}`);
      fixtures.push({ ...await seedBuilderEditPuzzle(name, builder, state), name, builder, state });
    }
  }
  await page.goto('/puzzles');
  for (let visit = 0; visit < 2; visit++) {
    if (visit) await page.reload();
    for (const fixture of fixtures) {
      const row = item(page, fixture.name);
      await expect(row).toBeVisible();
      await expect(row.getByTestId('puzzle-list-title')).toHaveText(fixture.name);
      await expect(row.getByTestId('puzzle-status-badge')).toBeVisible();
      await expect(row.getByTestId('puzzle-list-updated')).toBeVisible();
      await expect(row).toContainText(fixture.builder === own ? 'Your puzzle' : "Another builder's puzzle");
      if (fixture.builder === own) {
        await expect(row.getByTestId('puzzle-edit-link')).toHaveAttribute('href', `/puzzles/${fixture.id}`);
        await expect(row.getByTestId('puzzle-edit-link')).toBeVisible();
      } else {
        await expect(row.locator('a, button, [role="button"]')).toHaveCount(0);
      }
    }
  }
});

for (const state of states) {
  test(`O3 a foreign ${state} editor URL is refused without disclosing or changing puzzle contents`, async ({ page }) => {
    const name = title(`secret ${state}`);
    const { id } = await seedBuilderEditPuzzle(name, await seedOtherBuilder(), state);
    const before = await builderEditSnapshot(id);
    await page.goto(`/puzzles/${id}`);
    await expect(page.getByTestId('puzzle-not-found')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(`/puzzles/${id}`);
    await expect(page.getByTestId('puzzle-editor')).toHaveCount(0);
    await expect(page.getByTestId('grid-cell')).toHaveCount(0);
    await expect(page.getByTestId('puzzle-title')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(name);
    expect(await builderEditSnapshot(id)).toEqual(before);
  });
}

test('O3 own editing persists through the real editor', async ({ page }) => {
  const { id } = await seedBuilderEditPuzzle(title('owned editable'), await currentBuilderId(page), 'grid');
  await page.goto(`/puzzles/${id}`);
  await waitForEditorReady(page);
  const changed = title('saved by owner');
  const saved = page.waitForResponse((response) => response.request().method() === 'POST' && response.request().headers()['next-action'] !== undefined);
  await page.getByTestId('puzzle-title').fill(changed);
  await saved;
  await page.reload();
  await waitForEditorReady(page);
  await expect(page.getByTestId('puzzle-title')).toHaveValue(changed);
  expect((await builderEditSnapshot(id)).title).toBe(changed);
});

test('O3 an own published puzzle opens locked and can be unpublished and edited again', async ({ page }) => {
  const { id } = await seedBuilderEditPuzzle(title('owned published'), await currentBuilderId(page), 'public published');
  await page.goto('/puzzles');
  await page.locator(`[data-testid="puzzle-edit-link"][href="/puzzles/${id}"]`).click();
  await waitForEditorReady(page);
  await expect(page.getByTestId('published-lock-message')).toBeVisible();
  await expect(page.getByTestId('puzzle-title')).toBeDisabled();
  await page.locator('[data-testid="step"][data-step-id="publish"]').click();
  await page.getByTestId('unpublish-button').click();
  await expect(page.getByTestId('publish-button')).toBeVisible();
  await expect(page.getByTestId('puzzle-title')).toBeEnabled();
  const changed = title('unpublished and saved');
  const saved = page.waitForResponse((response) => response.request().method() === 'POST' && response.request().headers()['next-action'] !== undefined);
  await page.getByTestId('puzzle-title').fill(changed);
  await saved;
  await page.reload();
  await waitForEditorReady(page);
  await expect(page.getByTestId('puzzle-title')).toHaveValue(changed);
  const row = await builderEditSnapshot(id);
  expect(row.publishedAt).toBeNull();
  expect(row.title).toBe(changed);
});
