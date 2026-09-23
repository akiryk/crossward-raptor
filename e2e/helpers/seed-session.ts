import type { Page } from '@playwright/test';
import { requestMagicLink, readMagicLinkUrl } from './auth';

/**
 * Leave `page`'s browser context signed in as a fresh user.
 *
 * NOT a frozen acceptance file — editable plumbing, the sibling of
 * seed-puzzle.ts. Used only by the few tests that must start signed out and
 * then authenticate mid-test (route protection). The suite-wide signed-in
 * state for the ~250 builder specs is NOT this helper: that is the
 * storageState seeded once per run by `e2e/auth.setup.ts` (see the story).
 *
 * The implementation reuses A1's proven magic-link helpers and reads the token
 * from the database, so it works whether or not Better Auth signs its session
 * cookie — there is no cookie to forge and get wrong. No email is sent: the
 * test env has no RESEND_API_KEY, and Better Auth stores the token regardless.
 *
 * If you confirm Better Auth's session cookie is unsigned (the raw token),
 * you may replace this — and `auth.setup.ts` — with a direct user+session row
 * write plus `context.addCookies`, per the epic's decision. It's faster, and
 * the frozen spec doesn't care which you use. The story explains the tradeoff.
 */
export async function signInSeededUser(page: Page): Promise<{ email: string }> {
  const email = `a3-seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  await requestMagicLink(page, email);
  // Visiting the verify URL sets a real session cookie on this context.
  await page.goto(await readMagicLinkUrl(email));
  return { email };
}
