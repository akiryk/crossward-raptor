#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { e2eEnvironment } from './e2e-env.mjs';

// Validate before even bringing up Docker. Every later dotenv load keeps
// these explicit values, including the once-per-run destructive reset.
const env = e2eEnvironment();
const steps = [
  ['npx', ['prisma', 'generate']],
  ['npm', ['run', 'db:up']],
  [process.execPath, ['scripts/migrate-test-db.mjs']],
  [process.execPath, ['scripts/reset-test-db.mjs']],
  [process.execPath, ['scripts/free-e2e-port.mjs']],
];

for (const [command, args] of steps) {
  const result = spawnSync(command, args, { env, stdio: 'inherit' });
  if (result.error) console.error(`E2E preparation could not start ${command}: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
