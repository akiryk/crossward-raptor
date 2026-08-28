import { test, expect } from '@playwright/test';

// --- P0-1: shell renders ---
test.describe('P0-1 app shell renders', () => {
  test('shows a header with the app name and a main landmark', async ({ page }) => {
    await page.goto('/');

    const header = page.getByTestId('app-header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Crossward');
    await expect(page.getByTestId('app-main')).toBeVisible();
  });

  test('the header is visibly styled, not left transparent', async ({ page }) => {
    await page.goto('/');

    const header = page.getByTestId('app-header');
    const backgroundColor = await header.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(backgroundColor).not.toBe('transparent');
  });
});

// --- P0-2: responsive ---
test.describe('P0-2 responsive layout', () => {
  test('no horizontal overflow at a phone-width viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.getByTestId('app-header')).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test('no horizontal overflow at a laptop-width viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.getByTestId('app-header')).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });
});

// --- P0-3: tokens are wired ---
test.describe('P0-3 design tokens', () => {
  test('every declared theme token resolves to a non-empty value', async ({ page }) => {
    await page.goto('/');

    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const names = [
        '--color-background',
        '--color-foreground',
        '--color-selected',
        '--color-complete',
        '--color-incomplete',
        '--color-grid-line',
        '--font-display',
        '--font-body',
        '--font-data',
        '--grid-line-width',
      ];
      const result: Record<string, string> = {};
      for (const name of names) {
        result[name] = style.getPropertyValue(name).trim();
      }
      return result;
    });

    for (const [name, value] of Object.entries(tokens)) {
      expect(value, `expected ${name} to be defined in @theme`).not.toBe('');
    }
  });
});
