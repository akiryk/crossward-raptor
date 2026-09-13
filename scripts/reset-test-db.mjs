#!/usr/bin/env node
// Deletes every row from the Puzzle table in TEST_DATABASE_URL, run once
// per e2e suite (not per test -- four parallel workers share one database
// within a run, see docs/stories/L1-local-postgres.md). Refuses to run if
// TEST_DATABASE_URL is unset or does not point at localhost: a wipe script
// that can reach a hosted database is a liability, and this one should be
// structurally unable to.

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { parse as parseConnectionString } from 'pg-connection-string';

const url = process.env.TEST_DATABASE_URL;

if (!url) {
  console.error('reset-test-db: TEST_DATABASE_URL is not set. Refusing to run.');
  process.exit(1);
}

// Checking new URL(url).hostname alone is not enough: pg-connection-string
// (what pg/PrismaPg actually use to interpret the string) lets a `host` (or
// `port`) query parameter silently override the authority entirely --
// postgresql://user:pass@localhost/db?host=remote.example connects to
// remote.example, not localhost. Parsing with the same library the real
// connection will use, rather than re-deriving the rule by hand, means this
// can't drift from what actually gets connected to.
let host;
try {
  host = parseConnectionString(url).host;
} catch {
  console.error('reset-test-db: TEST_DATABASE_URL could not be parsed. Refusing to run.');
  process.exit(1);
}

if (host !== 'localhost' && host !== '127.0.0.1') {
  console.error(
    `reset-test-db: TEST_DATABASE_URL does not resolve to a localhost host (effective host is "${host}"). Refusing to run.`
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const client = new PrismaClient({ adapter });

try {
  const { count } = await client.puzzle.deleteMany();
  console.log(`reset-test-db: deleted ${count} row(s) from Puzzle.`);
} finally {
  await client.$disconnect();
}
