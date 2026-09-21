import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGrid, withLetter } from '../src/engine/grid';
import type { Grid } from '../src/engine/grid';
import { seedPuzzle } from './helpers/seed-puzzle';
import { waitForEditorReady } from './helpers/wait-for-ready';

// Other spec files seed against the same test database concurrently, so
// every assertion here keys on a title unique to this run -- never on
// absolute list positions or counts.
function uniqueTitle(label: string) {
  return `L2b ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const ALL_KEYS = ['1-across', '4-across', '5-across', '1-down', '2-down', '3-down'];

function allHints(): Record<string, string> {
  return Object.fromEntries(ALL_KEYS.map((key) => [key, `Clue for ${key}`]));
}

/** Every active cell lettered, so the puzzle survives publishing. */
function filledGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3 });
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      grid = withLetter(grid, { col, row }, 'A');
    }
  }
  return grid;
}

function row(page: Page, title: string) {
  return page.locator('[data-testid="puzzle-list-item"]', { hasText: title });
}

async function seedGridPhase(title: string) {
  return seedPuzzle({ grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' }, title);
}

test.describe('L2b-1 the library page', () => {
  test('the heading and the new-puzzle button share a header row', async ({ page }) => {
    await seedGridPhase(uniqueTitle('header'));
    await page.goto('/puzzles');

    const header = page.getByTestId('puzzle-list-header');
    await expect(header).toBeVisible();
    await expect(header.getByTestId('page-heading')).toBeVisible();
    await expect(header.getByTestId('new-puzzle-button')).toBeVisible();

    const boxes = await page.evaluate(() => {
      const pick = (id: string) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        if (!el) throw new Error(`no ${id}`);
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, centreY: r.top + r.height / 2 };
      };
      return { heading: pick('page-heading'), button: pick('new-puzzle-button') };
    });

    // button sits to the right of the heading, on the same line
    expect(boxes.button.left).toBeGreaterThan(boxes.heading.right);
    expect(Math.abs(boxes.button.centreY - boxes.heading.centreY)).toBeLessThanOrEqual(4);
  });

  test('a row shows its title and a metadata line', async ({ page }) => {
    const title = uniqueTitle('shape');
    await seedGridPhase(title);
    await page.goto('/puzzles');

    const item = row(page, title);
    await expect(item.getByTestId('puzzle-list-title')).toHaveText(title);
    await expect(item.getByTestId('puzzle-status-badge')).toBeVisible();

    const updated = item.getByTestId('puzzle-list-updated');
    await expect(updated).toBeVisible();
    expect((await updated.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
  });

  test('the badge reports the kind of a grid-phase puzzle', async ({ page }) => {
    const title = uniqueTitle('gridbadge');
    await seedGridPhase(title);
    await page.goto('/puzzles');

    await expect(row(page, title).getByTestId('puzzle-status-badge')).toHaveAttribute(
      'data-status-kind',
      'grid'
    );
  });

  test('the badge reports the kind of a hints-phase puzzle', async ({ page }) => {
    const title = uniqueTitle('hintsbadge');
    await seedPuzzle(
      { grid: createGrid({ cols: 3, rows: 3 }), hints: allHints(), phase: 'hints' },
      title
    );
    await page.goto('/puzzles');

    await expect(row(page, title).getByTestId('puzzle-status-badge')).toHaveAttribute(
      'data-status-kind',
      'hints'
    );
  });

  test('a published puzzle reads as published, and looks different', async ({ page }) => {
    const unpublishedTitle = uniqueTitle('unpublished');
    const publishedTitle = uniqueTitle('published');
    await seedGridPhase(unpublishedTitle);
    const { id } = await seedPuzzle(
      { grid: filledGrid(), hints: allHints(), phase: 'hints' },
      publishedTitle
    );

    await page.goto(`/puzzles/${id}`);
    await waitForEditorReady(page);
    await page.locator('[data-testid="step"][data-step-id="publish"]').click();
    await page.getByTestId('publish-button').click();
    await expect(page.getByTestId('unpublish-button')).toBeVisible();

    await page.goto('/puzzles');

    const publishedBadge = row(page, publishedTitle).getByTestId('puzzle-status-badge');
    await expect(publishedBadge).toHaveAttribute('data-status-kind', 'published');

    const bg = (locator: ReturnType<Page['locator']>) =>
      locator.evaluate((el) => getComputedStyle(el).backgroundColor);
    const unpublishedBadge = row(page, unpublishedTitle).getByTestId('puzzle-status-badge');
    expect(await bg(publishedBadge)).not.toBe(await bg(unpublishedBadge));
  });

  test('each row has an edit link pointing at that puzzle', async ({ page }) => {
    const title = uniqueTitle('editlink');
    const { id } = await seedGridPhase(title);
    await page.goto('/puzzles');

    const edit = row(page, title).getByTestId('puzzle-edit-link');
    await expect(edit).toBeVisible();
    expect(await edit.evaluate((el) => el.tagName.toLowerCase())).toBe('a');
    expect(await edit.getAttribute('href')).toContain(id);
  });

  test('the row itself is not a link', async ({ page }) => {
    const title = uniqueTitle('notalink');
    await seedGridPhase(title);
    await page.goto('/puzzles');

    const item = row(page, title);
    expect(await item.evaluate((el) => el.tagName.toLowerCase())).not.toBe('a');
    await expect(item.locator('a')).toHaveCount(1);
  });

  test('clicking edit opens that puzzle', async ({ page }) => {
    const title = uniqueTitle('opens');
    const { id } = await seedGridPhase(title);
    await page.goto('/puzzles');

    await row(page, title).getByTestId('puzzle-edit-link').click();

    await page.waitForURL(new RegExp(`/puzzles/${id}$`));
    await waitForEditorReady(page);
    await expect(page.getByTestId('puzzle-title')).toHaveValue(title);
  });

  test('row attributes survive the redesign', async ({ page }) => {
    const title = uniqueTitle('attrs');
    await seedGridPhase(title);
    await page.goto('/puzzles');

    const item = row(page, title);
    await expect(item).toHaveAttribute('data-phase', 'grid');
    await expect(item).toHaveAttribute('data-hints-complete', 'false');
    await expect(item).toHaveAttribute('data-published', 'false');
    const updatedAt = await item.getAttribute('data-updated-at');
    expect(Number.isNaN(Date.parse(updatedAt ?? ''))).toBe(false);
  });
});
