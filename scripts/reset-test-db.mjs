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

const url = process.env.TEST_DATABASE_URL;

if (!url) {
  console.error('reset-test-db: TEST_DATABASE_URL is not set. Refusing to run.');
  process.exit(1);
}

let hostname;
try {
  hostname = new URL(url).hostname;
} catch {
  console.error('reset-test-db: TEST_DATABASE_URL is not a valid URL. Refusing to run.');
  process.exit(1);
}

if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
  console.error(
    `reset-test-db: TEST_DATABASE_URL does not point at localhost (host is "${hostname}"). Refusing to run.`
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
