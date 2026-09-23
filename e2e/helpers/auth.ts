import type { Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Plumbing for the A1 magic-link spec (`e2e/magic-link.spec.ts`).
 *
 * NOT a frozen acceptance file. The implementer owns this and should adjust
 * it to the installed Better Auth version — it exists to isolate every
 * Better-Auth-specific detail (endpoint paths, token storage) so the spec can
 * stay purely behavioural. It is the read-side sibling of seed-puzzle.ts and
 * read-puzzle-row.ts: a test-only accessor to the local Postgres test
 * database (Story L1), never imported by application code.
 *
 * The queries and route strings below are a best-effort starting point
 * written without the library in front of us. Verify each against the version
 * you install and correct as needed — that is expected, and is exactly why
 * this lives outside the frozen spec.
 */

function testDbClient(): PrismaClient {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set — e2e/helpers/auth.ts must run against ' +
        'the dedicated test database, never the real database. Refusing to read.'
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

/** Ask Better Auth to issue a magic link for `email`. */
export async function requestMagicLink(page: Page, email: string): Promise<void> {
  const res = await page.request.post('/api/auth/sign-in/magic-link', {
    data: { email, callbackURL: '/puzzles' },
  });
  if (!res.ok()) {
    throw new Error(
      `requestMagicLink failed: ${res.status()} ${await res.text()}`
    );
  }
}

/**
 * Return the path a person would click to complete sign-in for the most
 * recent link issued to `email`, read from the test database.
 *
 * The starting implementation reads the token Better Auth stored in its
 * verification table (untyped `$queryRaw`, so this file compiles before the
 * auth models exist in the generated client) and rebuilds the verify URL.
 * Adjust the column(s) and the verify route to what your version actually
 * stores and exposes — or, equivalently, have `sendMagicLink` persist the URL
 * and read that here. It must read from the database (no inbox) and must not
 * trigger an email send.
 */
export async function readMagicLinkUrl(email: string): Promise<string> {
  const client = testDbClient();
  try {
    const rows = await client.$queryRaw<
      Array<{ identifier: string; value: string }>
    >`
      SELECT "identifier", "value"
      FROM "verification"
      WHERE "identifier" LIKE ${`%${email}%`} OR "value" LIKE ${`%${email}%`}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) throw new Error(`no magic-link verification row for ${email}`);
    // The token is whichever column your version stores it in; identifier is
    // the common case. Correct this against the real row shape.
    const token = row.identifier;
    return `/api/auth/magic-link/verify?token=${encodeURIComponent(
      token
    )}&callbackURL=/puzzles`;
  } finally {
    await client.$disconnect();
  }
}

/** Better Auth's current session for this browser context, or null. */
export async function getSession(
  page: Page
): Promise<{ user?: { email?: string } } | null> {
  const res = await page.request.get('/api/auth/get-session');
  if (!res.ok()) {
    throw new Error(`getSession failed: ${res.status()} ${await res.text()}`);
  }
  const text = await res.text();
  if (!text) return null;
  const body = JSON.parse(text) as { user?: { email?: string } } | null;
  return body && body.user ? body : null;
}

/** Sign the current browser context out. */
export async function signOut(page: Page): Promise<void> {
  // Better Auth's /sign-out requires an application/json request even though
  // it takes no fields; sending an empty object sets that Content-Type (a
  // bare POST is rejected 415). The body schema is optional.
  //
  // It also enforces an origin check on state-changing POSTs. A browser fetch
  // sends Origin automatically, but Playwright's request context does not, so
  // it is set here to the page's own (trusted) origin — otherwise the request
  // is rejected 403 MISSING_OR_NULL_ORIGIN.
  const res = await page.request.post('/api/auth/sign-out', {
    data: {},
    headers: { origin: new URL(page.url()).origin },
  });
  if (!res.ok()) {
    throw new Error(`signOut failed: ${res.status()} ${await res.text()}`);
  }
}
