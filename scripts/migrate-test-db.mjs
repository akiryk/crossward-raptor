#!/usr/bin/env node
// Applies pending migrations to TEST_DATABASE_URL as part of pretest:e2e.
// prisma.config.ts points Migrate at DATABASE_URL_UNPOOLED by default (the
// dev database); this runs the same `prisma migrate deploy` with that one
// variable overridden for the child process only, so the dev database's
// own migration state is never touched by an e2e run.

import { spawnSync } from 'node:child_process';
import pg from 'pg';
import { e2eEnvironment } from './e2e-env.mjs';

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  console.error('migrate-test-db: TEST_DATABASE_URL is not set.');
  process.exit(1);
}

// A populated pre-O1 test database cannot migrate without an assignment.
// Only this isolated target is disposable. Retain auth rows until the normal
// post-migration reset, and never delete Puzzle once ownership is installed.
const env = e2eEnvironment();
const client = new pg.Client({ connectionString: env.TEST_DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN');
  const table = (await client.query(`SELECT to_regclass('public."Puzzle"') AS puzzle`)).rows[0].puzzle;
  if (table) {
    await client.query('LOCK TABLE public."Puzzle" IN ACCESS EXCLUSIVE MODE');
    const ownerColumn = await client.query(`SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Puzzle' AND column_name = 'builderId'`);
    if (!ownerColumn.rowCount) {
      const result = await client.query('DELETE FROM public."Puzzle"');
      console.log(`migrate-test-db: removed ${result.rowCount} legacy test Puzzle row(s).`);
    }
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env,
});

process.exit(result.status ?? 1);
