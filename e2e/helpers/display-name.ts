import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { getSession, readMagicLinkUrl, requestMagicLink } from './auth';
import { ownershipTestClient } from './ownership';

/** O2 deliberately uses real fresh unnamed users, never the shared suite user. */
export async function signInDisplayNameUser(page: Page, existingEmail?: string) {
  const email = existingEmail ?? `o2-${randomUUID()}@example.test`;
  // Validate the isolated target before the existing auth helpers access it.
  const client = ownershipTestClient();
  await client.$disconnect();
  await requestMagicLink(page, email);
  await page.goto(await readMagicLinkUrl(email));
  const session = await getSession(page);
  if (!session?.user?.id || session.user.email !== email) {
    throw new Error('O2 sign-in did not establish the requested user session.');
  }
  return { email, userId: session.user.id };
}

/** Read only this fresh user's persisted profile and puzzles; never reset data. */
export async function displayNameSnapshot(userId: string) {
  const client = ownershipTestClient();
  try {
    const user = await client.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, displayName: true, name: true, email: true, role: true },
    });
    const puzzles = await client.puzzle.findMany({
      where: { builderId: userId },
      select: { id: true, title: true, builderId: true, grid: true },
      orderBy: { createdAt: 'asc' },
    });
    return { user, puzzles };
  } finally {
    await client.$disconnect();
  }
}
