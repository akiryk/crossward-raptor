#!/usr/bin/env node
// Reproduce O1's startup-option transport with the installed Prisma migrator.
// Only a random synthetic schema in the validated isolated E2E DB is changed.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';
import { e2eEnvironment } from './e2e-env.mjs';

const env = e2eEnvironment();
const client = new pg.Client({ connectionString: env.TEST_DATABASE_URL });
const schema = `o1_deploy_proof_${randomUUID().replaceAll('-', '')}`;
const temporary = await mkdtemp(path.join(tmpdir(), 'crossward-o1-deploy-'));
const root = fileURLToPath(new URL('../', import.meta.url));
const migrationName = '20261017220000_add_puzzle_builders';
const require = createRequire(import.meta.url);
const configModule = pathToFileURL(require.resolve('prisma/config')).href;
const configPath = path.join(temporary, 'prisma.config.mjs');
const url = new URL(env.TEST_DATABASE_URL);
url.searchParams.set('schema', schema);

function deploy() {
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/prisma/build/index.js'),
    'migrate', 'deploy', '--config', configPath], {
    cwd: temporary,
    env: { ...env, O1_PROOF_DATABASE_URL: url.href },
    encoding: 'utf8',
  });
  // Never print connection strings; this proof uses synthetic credentials,
  // but keep output limited to the operation's useful outcome.
  assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
}

await client.connect();
try {
  await client.query(`CREATE SCHEMA "${schema}"`);
  await client.query(`SET search_path TO "${schema}"`);
  await mkdir(path.join(temporary, 'migrations'));
  await copyFile(path.join(root, 'prisma/schema.prisma'), path.join(temporary, 'schema.prisma'));
  await copyFile(path.join(root, 'prisma/migrations/migration_lock.toml'),
    path.join(temporary, 'migrations/migration_lock.toml'));
  await writeFile(configPath, `import { defineConfig } from ${JSON.stringify(configModule)};
export default defineConfig({ schema: ${JSON.stringify(path.join(temporary, 'schema.prisma'))},
  migrations: { path: ${JSON.stringify(path.join(temporary, 'migrations'))} },
  datasource: { url: process.env.O1_PROOF_DATABASE_URL } });\n`);
  for (const name of (await readdir(path.join(root, 'prisma/migrations'))).sort()) {
    if (!/^\d/.test(name) || name >= migrationName) continue;
    await mkdir(path.join(temporary, 'migrations', name));
    await copyFile(path.join(root, 'prisma/migrations', name, 'migration.sql'),
      path.join(temporary, 'migrations', name, 'migration.sql'));
  }
  deploy();
  await client.query(`INSERT INTO "user" (id, name, email, "updatedAt")
    VALUES ('proof-builder', 'Synthetic Builder', 'proof@example.test', '2024-01-01')`);
  const ids = ['proof-one', 'proof-two', 'proof-three', 'proof-four'];
  for (const id of ids) {
    await client.query(`INSERT INTO "Puzzle" (id, title, grid, hints, "updatedAt")
      VALUES ($1, 'Preserved synthetic puzzle', '{}'::jsonb, '{}'::jsonb, '2024-02-03')`, [id]);
  }
  const before = (await client.query('SELECT to_jsonb(p) AS row FROM "Puzzle" p ORDER BY id')).rows;
  const beforeAuth = (await client.query('SELECT to_jsonb(u) AS row FROM "user" u ORDER BY id')).rows;
  await mkdir(path.join(temporary, 'migrations', migrationName));
  await copyFile(path.join(root, 'prisma/migrations', migrationName, 'migration.sql'),
    path.join(temporary, 'migrations', migrationName, 'migration.sql'));

  // PostgreSQL startup options are part of the URL read by Prisma's own
  // migration connection. Compact JSON and these synthetic IDs contain no
  // whitespace or backslash that would need the startup lexer's escaping.
  url.searchParams.set('options', '-c crossward.legacy_builder_id=proof-builder ' +
    `-c crossward.legacy_puzzle_ids=${JSON.stringify(ids)}`);
  deploy();
  assert.deepEqual((await client.query(`SELECT to_jsonb(p) - 'builderId' AS row
    FROM "Puzzle" p ORDER BY id`)).rows, before);
  assert.deepEqual((await client.query('SELECT to_jsonb(u) AS row FROM "user" u ORDER BY id')).rows, beforeAuth);
  assert.deepEqual((await client.query('SELECT DISTINCT "builderId" FROM "Puzzle"')).rows,
    [{ builderId: 'proof-builder' }]);
  const applied = await client.query(`SELECT migration_name FROM "_prisma_migrations"
    WHERE migration_name = $1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL`, [migrationName]);
  assert.equal(applied.rowCount, 1);
  console.log('PASS installed Prisma migrate deploy receives both startup inputs on its migration connection; four original rows and user preserved.');
} finally {
  await client.query('ROLLBACK');
  await client.query('SET search_path TO public');
  await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await client.end();
  await rm(temporary, { recursive: true, force: true });
}
