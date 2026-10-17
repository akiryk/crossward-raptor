import { randomInt } from 'node:crypto';
import type { Page } from '@playwright/test';

// Editable A6 plumbing, separate from the frozen behavioral spec. Like A5's
// API auth helper, give unrelated UI visitors separate production IP buckets.
export async function openSignedOutFrontDoor(page: Page): Promise<void> {
  await page.context().setExtraHTTPHeaders({
    'x-forwarded-for': `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`,
  });
  await page.goto('/');
  await page.waitForSelector('[data-testid="sign-in-form"][data-ready="true"]');
}
