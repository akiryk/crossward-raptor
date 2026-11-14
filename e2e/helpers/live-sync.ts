import type { Browser, BrowserContext, Page } from '@playwright/test';
import { ownershipTestClient } from './ownership';

/**
 * Epic 24 (24-S4): browser helpers for live sync. A second browser context
 * signed in as the same seeded builder (two contexts of one account need no
 * membership); the editor's catch-up requests; and pruning a puzzle's
 * operation log in the isolated test database, as the log's retention
 * would. Never imported by application code.
 */
export async function secondContext(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    storageState: 'e2e/.auth/user.json',
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  return { context, page: await context.newPage() };
}

/** Whether a request is the editor's catch-up read (the route's GET). */
export function isCatchUp(request: { method(): string; url(): string }, puzzleId: string): boolean {
  return request.method() === 'GET' && new URL(request.url()).pathname === `/api/puzzles/${puzzleId}/operations`;
}

/** Fails the page's catch-up reads until the returned function is called. */
export async function blockCatchUp(page: Page, puzzleId: string): Promise<() => Promise<void>> {
  const pattern = `**/api/puzzles/${puzzleId}/operations`;
  const handler = (route: import('@playwright/test').Route) =>
    route.request().method() === 'GET' ? route.abort('failed') : route.continue();
  await page.route(pattern, handler);
  return () => page.unroute(pattern, handler);
}

/** Deletes the log's records below `version`, as pruning past the
 *  retention would (the newest is always kept). */
export async function pruneLogBelow(puzzleId: string, version: number): Promise<void> {
  const client = ownershipTestClient();
  try {
    await client.puzzleOperation.deleteMany({ where: { puzzleId, OR: [{ version: { lt: version } }, { version: null }] } });
  } finally {
    await client.$disconnect();
  }
}

/** Makes the page hidden or visible, as switching tabs does. */
export async function setVisibility(page: Page, state: 'hidden' | 'visible'): Promise<void> {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value === 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}
