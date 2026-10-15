import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { parse } from 'pg-connection-string';

function testClient(): PrismaClient {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('Session validation tests require TEST_DATABASE_URL.');
  const connection = parse(url);
  if (
    !['localhost', '127.0.0.1'].includes(connection.host ?? '') ||
    connection.port !== '5433' || connection.database !== 'crossward_test'
  ) {
    throw new Error('Session validation tests require the isolated local test database.');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

/** Invalidate only the fresh user belonging to this test, never the shared suite user. */
export async function invalidateSession(email: string, mode: 'expired' | 'revoked'): Promise<void> {
  const client = testClient();
  try {
    const where = { user: { email } };
    const result = mode === 'expired'
      ? await client.session.updateMany({ where, data: { expiresAt: new Date(Date.now() - 60_000) } })
      : await client.session.deleteMany({ where });
    if (result.count !== 1) throw new Error(`Expected one fresh session; invalidated ${result.count}.`);
  } finally {
    await client.$disconnect();
  }
}

export async function countPuzzlesNamed(title: string): Promise<number> {
  const client = testClient();
  try {
    return await client.puzzle.count({ where: { title } });
  } finally {
    await client.$disconnect();
  }
}
