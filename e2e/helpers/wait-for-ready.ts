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

/**
 * Waits for NewPuzzleButton to signal it can actually respond to a click.
 * Same race as the editor: the button's onClick isn't wired until
 * hydration commits, which can happen after page.goto() has already
 * resolved -- a click before this resolves can be silently dropped.
 */
export async function waitForNewPuzzleReady(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="new-puzzle"][data-ready="true"]');
}
