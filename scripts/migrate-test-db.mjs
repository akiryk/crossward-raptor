#!/usr/bin/env node
// Applies pending migrations to TEST_DATABASE_URL as part of pretest:e2e.
// prisma.config.ts points Migrate at DATABASE_URL_UNPOOLED by default (the
// dev database); this runs the same `prisma migrate deploy` with that one
// variable overridden for the child process only, so the dev database's
// own migration state is never touched by an e2e run.

import { config } from 'dotenv';
config({ path: '.env.local' });

import { spawnSync } from 'node:child_process';

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  console.error('migrate-test-db: TEST_DATABASE_URL is not set.');
  process.exit(1);
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL_UNPOOLED: url },
});

process.exit(result.status ?? 1);
