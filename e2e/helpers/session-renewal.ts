import type { Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { parse } from 'pg-connection-string';

// Editable Better Auth/test-database plumbing. The sibling spec is frozen.
const DAY = 86_400_000;

function testClient(): PrismaClient {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('Session renewal tests require TEST_DATABASE_URL.');
  const connection = parse(url);
  if (
    !['localhost', '127.0.0.1'].includes(connection.host ?? '') ||
    connection.port !== '5433' || connection.database !== 'crossward_test'
  ) {
    throw new Error('Session renewal tests require the isolated local test database.');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

export async function sessionSnapshot(page: Page, email: string) {
  const db = testClient();
  try {
    const sessions = await db.session.findMany({ where: { user: { email } } });
    if (sessions.length !== 1) throw new Error(`Expected one fresh session; found ${sessions.length}.`);
    const cookie = (await page.context().cookies()).find((item) => item.name.endsWith('.session_token'));
    if (!cookie) throw new Error('Expected a real browser session cookie.');
    return {
      databaseExpiry: sessions[0].expiresAt.getTime(),
      cookieExpiry: cookie.expires * 1000,
      cookieValue: cookie.value,
    };
  } finally {
    await db.$disconnect();
  }
}

/** Age only this test's still-valid real session, preserving its signed token. */
export async function ageSession(page: Page, email: string): Promise<void> {
  const now = Date.now();
  const db = testClient();
  try {
    const result = await db.session.updateMany({
      where: { user: { email } },
      data: {
        createdAt: new Date(now - 2 * DAY),
        updatedAt: new Date(now - 2 * DAY),
        expiresAt: new Date(now + 28 * DAY),
      },
    });
    if (result.count !== 1) throw new Error(`Expected one fresh session; aged ${result.count}.`);
    const cookie = (await page.context().cookies()).find((item) => item.name.endsWith('.session_token'));
    if (!cookie) throw new Error('Expected a real browser session cookie.');
    await page.context().addCookies([{ ...cookie, expires: (now + 28 * DAY) / 1000 }]);
  } finally {
    await db.$disconnect();
  }
}

/** Exercise Better Auth's supported browser protocol, including deferred refresh. */
export async function renewThroughAuthEndpoint(page: Page): Promise<string | undefined> {
  let response = await page.request.get('/api/auth/get-session');
  if (!response.ok()) throw new Error(`Session read failed: ${response.status()}.`);
  let body = await response.json();
  if (body?.needsRefresh) {
    response = await page.request.post('/api/auth/get-session', {
      data: {},
      headers: { origin: 'http://localhost:3100' },
    });
    if (!response.ok()) throw new Error(`Session refresh failed: ${response.status()}.`);
    body = await response.json();
  }
  return body?.user?.email;
}
