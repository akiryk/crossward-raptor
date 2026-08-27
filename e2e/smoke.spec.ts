import { test, expect } from '@playwright/test';

// Proves the e2e harness works end to end: dev server boots under
// Playwright's webServer, and the root route renders. Not coverage of any
// real flow -- builder-specific tests land story-by-story once the UI
// they exercise exists.
test('root route boots and renders', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  await expect(page.locator('body')).toBeVisible();
});
