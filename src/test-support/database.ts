// Epic 24 (24-S1): database tests. Each test file gets its own throwaway
// schema in the validated local test database (localhost or 127.0.0.1,
// port 5433, crossward_test; `scripts/e2e-env.mjs`), with the repository's
// migrations applied, and drops it afterwards. Public tables are never read
// or written, so this needs no reset and can't disturb a browser run.
// Needs the Docker test database: `npm run db:up`.

import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { e2eEnvironment } from '../../scripts/e2e-env.mjs';

const MIGRATIONS = path.join(process.cwd(), 'prisma', 'migrations');

export interface TestDatabase {
  /** A Prisma client confined to this file's schema. */
  readonly client: PrismaClient;
  /** Runs SQL in this file's schema, for setup a client can't express. */
  query(sql: string, values?: unknown[]): Promise<pg.QueryResult>;
  /** Applies the migrations not yet applied (see `createTestDatabase`). */
  migrateRest(): Promise<void>;
  /** Disconnects and drops the schema. */
  drop(): Promise<void>;
}

/** The migration directory names, oldest first. */
export async function migrationNames(): Promise<string[]> {
  const entries = await readdir(MIGRATIONS, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

/** A fresh schema with every migration applied, or with all but the last
 *  `holdBack` (applied later by `migrateRest`). */
export async function createTestDatabase(options: { holdBack?: number } = {}): Promise<TestDatabase> {
  const url = e2eEnvironment().TEST_DATABASE_URL as string;
  const schema = `vitest_${randomUUID().replaceAll('-', '')}`;
  const admin = new pg.Client({ connectionString: url });
  try {
    await admin.connect();
  } catch (error) {
    throw new Error(
      `Database tests need the local test database (localhost:5433); start it with \`npm run db:up\`. ${String(error)}`
    );
  }

  const names = await migrationNames();
  const now = names.slice(0, names.length - (options.holdBack ?? 0));
  let pending = names.slice(now.length);
  const apply = async (list: string[]) => {
    for (const name of list) {
      await admin.query(await readFile(path.join(MIGRATIONS, name, 'migration.sql'), 'utf8'));
    }
  };

  await admin.query(`CREATE SCHEMA "${schema}"`);
  await admin.query(`SET search_path TO "${schema}"`);
  let client: PrismaClient | undefined;
  try {
    await apply(now);
    client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }, { schema }) });
  } catch (error) {
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
    throw error;
  }

  return {
    client,
    query: (sql, values) => admin.query(sql, values),
    async migrateRest() {
      await apply(pending);
      pending = [];
    },
    async drop() {
      await client.$disconnect();
      await admin.query('SET search_path TO public');
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await admin.end();
    },
  };
}
