import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { e2eEnvironment } from '../../scripts/e2e-env.mjs';
import { getSession } from './auth';

export const SUITE_BUILDER_EMAIL = 'crossward-e2e-suite-builder@example.test';

/** Every ownership fixture uses the harness's effective-target validation. */
export function ownershipTestClient(): PrismaClient {
  if (!process.env.TEST_DATABASE_URL) throw new Error('Ownership fixtures require TEST_DATABASE_URL.');
  const url = e2eEnvironment().TEST_DATABASE_URL;
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

/** Public specs can seed before auth.setup runs; both converge on this user. */
export async function ensureSuiteBuilder(client: PrismaClient): Promise<string> {
  const user = await client.user.upsert({
    where: { email: SUITE_BUILDER_EMAIL },
    create: {
      id: 'crossward-e2e-suite-builder',
      email: SUITE_BUILDER_EMAIL,
      name: 'E2E Suite Builder',
      displayName: 'E2E Suite Builder',
    },
    // A nonempty, identity-preserving update keeps this a native ON CONFLICT
    // upsert when public fixture creation and auth setup run concurrently.
    update: { email: SUITE_BUILDER_EMAIL, displayName: 'E2E Suite Builder' },
  });
  return user.id;
}

export async function currentBuilderId(page: Page): Promise<string> {
  const session = await getSession(page);
  if (typeof session?.user?.id !== 'string' || !session.user.id) {
    throw new Error('The browser has no validated builder session.');
  }
  return session.user.id;
}

export async function readPuzzleBuilderId(id: string): Promise<string> {
  const client = ownershipTestClient();
  try {
    const row = await client.puzzle.findUniqueOrThrow({ where: { id }, select: { builderId: true } });
    return row.builderId;
  } finally {
    await client.$disconnect();
  }
}

export async function seedOtherBuilder(): Promise<string> {
  const client = ownershipTestClient();
  try {
    const id = randomUUID();
    await client.user.create({ data: { id, email: `o1-${id}@example.test`, name: 'Other Builder' } });
    return id;
  } finally {
    await client.$disconnect();
  }
}
