import { randomInt, randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { readMagicLinkUrl } from './auth';
import { ownershipTestClient } from './ownership';
import { registerFixtureBuilder } from './fixture-builder';

// Editable 23-S3 plumbing, not frozen acceptance: accounts with and without a
// username, read and written straight in the isolated test database, and a
// magic link requested from the API (optionally carrying a `name`, as an old
// form or a hand-made request would) and followed in the browser.

export function uniqueEmail(label: string) {
  return `s3-${label}-${randomUUID()}@example.test`;
}

/** An existing account, as an older one may be: Better Auth's name, any username. */
export async function createAccount(
  email: string,
  options: { displayName: string | null; name?: string },
): Promise<string> {
  const client = ownershipTestClient();
  try {
    const id = randomUUID();
    await client.user.create({
      data: { id, email, name: options.name ?? '', displayName: options.displayName },
    });
    return id;
  } finally {
    await client.$disconnect();
  }
}

export async function readAccount(email: string): Promise<{ id: string; displayName: string | null; name: string } | null> {
  const client = ownershipTestClient();
  try {
    return await client.user.findUnique({ where: { email }, select: { id: true, displayName: true, name: true } });
  } finally {
    await client.$disconnect();
  }
}

export async function setUsername(email: string, displayName: string | null): Promise<void> {
  const client = ownershipTestClient();
  try {
    await client.user.update({ where: { email }, data: { displayName } });
  } finally {
    await client.$disconnect();
  }
}

/** Request a link from the API (with `name` if given) and follow it in this page. */
export async function signInByLink(page: Page, email: string, name?: string): Promise<void> {
  const forwarded = `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
  await page.context().setExtraHTTPHeaders({ 'x-forwarded-for': forwarded });
  const res = await page.request.post('/api/auth/sign-in/magic-link', {
    data: name === undefined ? { email, callbackURL: '/puzzles' } : { email, name, callbackURL: '/puzzles' },
    headers: { origin: 'http://localhost:3100', 'x-forwarded-for': forwarded },
  });
  if (!res.ok()) throw new Error(`magic link request failed: ${res.status()} ${await res.text()}`);
  await page.goto(await readMagicLinkUrl(email));
  const account = await readAccount(email);
  if (account) registerFixtureBuilder(account.id);
}

export async function countPlaySessions(puzzleId: string, userId: string): Promise<number> {
  const client = ownershipTestClient();
  try {
    return await client.playSession.count({ where: { puzzleId, userId } });
  } finally {
    await client.$disconnect();
  }
}

export async function readPlayEntries(puzzleId: string, userId: string): Promise<unknown> {
  const client = ownershipTestClient();
  try {
    const row = await client.playSession.findUnique({
      where: { userId_puzzleId: { userId, puzzleId } },
      select: { entries: true },
    });
    return row?.entries ?? null;
  } finally {
    await client.$disconnect();
  }
}

export async function readGrid(puzzleId: string): Promise<unknown> {
  const client = ownershipTestClient();
  try {
    const row = await client.puzzle.findUniqueOrThrow({ where: { id: puzzleId }, select: { grid: true } });
    return row.grid;
  } finally {
    await client.$disconnect();
  }
}
