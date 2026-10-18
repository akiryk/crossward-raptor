import { randomUUID } from 'node:crypto';
import { test, type Page } from '@playwright/test';
import { requestMagicLink, readMagicLinkUrl, getSession } from './auth';
import { ensureSuiteBuilder, ownershipTestClient, SUITE_BUILDER_EMAIL } from './ownership';
import { registerFixtureBuilder } from './fixture-builder';

/**
 * Leave `page` signed in. Auth setup uses the deterministic fixture builder;
 * all other callers get a fresh user so session invalidation stays isolated.
 *
 * NOT a frozen acceptance file — editable plumbing, the sibling of
 * seed-puzzle.ts. Used only by the few tests that must start signed out and
 * then authenticate mid-test (route protection). The suite-wide signed-in
 * state is seeded once by `e2e/auth.setup.ts`, which calls this helper in
 * the setup project and saves its storageState.
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
  const setup = test.info().project.name === 'setup';
  const email = setup
    ? SUITE_BUILDER_EMAIL
    : `a3-seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  const client = ownershipTestClient();
  let builderId: string;
  try {
    if (setup) {
      builderId = await ensureSuiteBuilder(client);
    } else {
      // Seed before verification redirects to the library, so its initial
      // creation flow sees this fixture's persisted builder name.
      builderId = randomUUID();
      await client.user.create({ data: {
        id: builderId, email, name: 'E2E Session Builder', displayName: 'E2E Session Builder',
      } });
    }
  } finally {
    await client.$disconnect();
  }
  await requestMagicLink(page, email);
  // Visiting the verify URL sets a real session cookie on this context.
  await page.goto(await readMagicLinkUrl(email));
  const session = await getSession(page);
  if (session?.user?.id !== builderId || session.user.email !== email) {
    throw new Error('Seeded sign-in did not establish the requested builder session.');
  }
  registerFixtureBuilder(builderId);
  return { email };
}
