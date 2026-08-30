import type { Page } from '@playwright/test';

/**
 * Waits for PuzzleGridEditor to signal it can actually respond to input.
 * The editor's keydown listener (and click handlers, wired up during the
 * same commit) aren't live until client-side hydration completes, which
 * can happen after page.goto() has already resolved — sending a keypress
 * or click before this resolves can be silently dropped.
 */
export async function waitForEditorReady(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="puzzle-editor"][data-ready="true"]');
}
