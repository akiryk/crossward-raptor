// P1 migration proof: only synthetic rows in a random schema on the validated
// local E2E database. No dotenv, historical migrations, or public-table writes.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';
import { e2eEnvironment } from './e2e-env.mjs';

const migrations = new URL('../prisma/migrations/', import.meta.url);
const names = (await readdir(migrations)).filter((name) => /play.*session/i.test(name));
assert.equal(names.length, 1, 'Expected exactly one P1 PlaySession migration');
const sql = await readFile(new URL(`${names[0]}/migration.sql`, migrations), 'utf8');
const client = new pg.Client({ connectionString: e2eEnvironment().TEST_DATABASE_URL });
const schema = `p1_proof_${randomUUID().replaceAll('-', '')}`;
const tables = ['user', 'Puzzle', 'session', 'account', 'verification'];

async function snapshot() {
  const rows = {};
  for (const table of tables) {
    rows[table] = (await client.query(`SELECT to_jsonb(t) AS row FROM "${table}" t ORDER BY id`)).rows;
  }
  return rows;
}

await client.connect();
try {
  await client.query(`CREATE SCHEMA "${schema}"`);
  await client.query(`SET search_path TO "${schema}"`);
  // LIKE copies column/default/index definitions, never existing data. Public
  // relations are read only for their shape, including installations after P1.
  for (const table of tables) {
    await client.query(`CREATE TABLE "${table}" (LIKE public."${table}" INCLUDING ALL)`);
  }
  await client.query(`INSERT INTO "user" (id, name, email, "updatedAt") VALUES
    ('builder', 'Synthetic Builder', 'builder@p1.example.test', '2024-01-02'),
    ('player', 'Synthetic Player', 'player@p1.example.test', '2024-01-03')`);
  await client.query(`INSERT INTO "Puzzle"
    (id, "builderId", title, grid, hints, phase, "gridBeforeHints", "publishedAt", visibility, "createdAt", "updatedAt") VALUES
    ('first', 'builder', 'Original first', '{"original":"answer"}', '{"1-across":"Original clue"}', 'hints', '{"original":"snapshot"}', '2024-03-04', 'private', '2024-01-01', '2024-02-02'),
    ('second', 'builder', 'Original second', '{"original":"draft"}', '{}', 'grid', NULL, NULL, 'public', '2024-01-03', '2024-02-04')`);
  await client.query(`INSERT INTO "session" (id, "expiresAt", token, "updatedAt", "userId")
    VALUES ('auth', '2030-01-01', 'synthetic-token', '2024-01-04', 'player')`);
  await client.query(`INSERT INTO "account" (id, "accountId", "providerId", "userId", "updatedAt")
    VALUES ('account', 'synthetic-account', 'synthetic-provider', 'player', '2024-01-05')`);
  await client.query(`INSERT INTO "verification" (id, identifier, value, "expiresAt", "updatedAt")
    VALUES ('verification', 'synthetic-id', 'synthetic-value', '2030-01-01', '2024-01-06')`);

  const before = await snapshot();
  await client.query(sql);
  assert.deepEqual(await snapshot(), before, 'Migration must preserve every original row and timestamp');
  assert.equal((await client.query('SELECT * FROM "PlaySession"')).rowCount, 0, 'No backfill');
  console.log('PASS additive migration preserves all seeded puzzle/auth fields and timestamps; no backfill');

  const insert = `INSERT INTO "PlaySession" (id, "userId", "puzzleId", entries)
    VALUES ($1, $2, $3, '{"cells":[],"cols":0,"rows":0}')`;
  await client.query(insert, ['first-session', 'player', 'first']);
  await client.query(insert, ['second-session', 'builder', 'second']);
  const first = (await client.query(`SELECT * FROM "PlaySession" WHERE id = 'first-session'`)).rows[0];
  assert(first.startedAt instanceof Date);
  assert.equal(first.completedAt, null);
  await assert.rejects(client.query(insert, ['duplicate', 'player', 'first']), (error) => error.code === '23505');
  await assert.rejects(client.query(insert, ['missing-user', 'absent', 'first']), (error) => error.code === '23503');
  await assert.rejects(client.query(insert, ['missing-puzzle', 'player', 'absent']), (error) => error.code === '23503');
  await assert.rejects(client.query(insert, ['null-user', null, 'first']), (error) => error.code === '23502');
  await assert.rejects(client.query(`INSERT INTO "PlaySession" (id, "userId", "puzzleId") VALUES ('no-entries', 'builder', 'first')`), (error) => error.code === '23502');
  console.log('PASS database pair uniqueness, required entries/identity, foreign keys and timestamp defaults');

  const retained = (await client.query(`SELECT * FROM "PlaySession" WHERE id = 'second-session'`)).rows;
  await client.query(`DELETE FROM "Puzzle" WHERE id = 'first'`);
  assert.equal((await client.query(`SELECT * FROM "PlaySession" WHERE id = 'first-session'`)).rowCount, 0);
  assert.deepEqual((await client.query(`SELECT * FROM "PlaySession"`)).rows, retained);
  assert.deepEqual((await client.query(`SELECT to_jsonb(t) AS row FROM "Puzzle" t ORDER BY id`)).rows, before.Puzzle.filter(({ row }) => row.id === 'second'));
  await client.query(insert, ['user-session', 'player', 'second']);
  await client.query(`DELETE FROM "user" WHERE id = 'player'`);
  assert.deepEqual((await client.query(`SELECT * FROM "PlaySession"`)).rows, retained);
  console.log('PASS puzzle/user deletion cascades only matching sessions; unrelated puzzle/session preserved');
} finally {
  await client.query('ROLLBACK');
  await client.query('SET search_path TO public');
  await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await client.end();
}
