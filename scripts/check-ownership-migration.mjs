// O1 frozen acceptance: actual committed migration SQL, real PostgreSQL,
// synthetic schemas only. Never load dotenv or connect outside the E2E DB.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';
import { e2eEnvironment } from './e2e-env.mjs';

const migrationName = '20261017220000_add_puzzle_builders';
const directory = new URL('../prisma/migrations/', import.meta.url);
const names = (await readdir(directory)).filter((name) => /^\d/.test(name)).sort();
assert(names.includes(migrationName), `Missing O1 migration ${migrationName}`);
const historicalSQL = await Promise.all(names.filter((name) => name < migrationName)
  .map((name) => readFile(new URL(`${name}/migration.sql`, directory), 'utf8')));
const ownershipSQL = await readFile(new URL(`${migrationName}/migration.sql`, directory), 'utf8');
const client = new pg.Client({ connectionString: e2eEnvironment().TEST_DATABASE_URL });
await client.connect();

const ids = ['legacy-one', 'legacy-two', 'legacy-three', 'legacy-four'];

async function snapshot(table, omitBuilder = false) {
  const expression = omitBuilder ? "to_jsonb(t) - 'builderId'" : 'to_jsonb(t)';
  return (await client.query(`SELECT ${expression} AS row FROM "${table}" t ORDER BY id`)).rows;
}

async function authSnapshot() {
  return Object.fromEntries(await Promise.all(['user', 'session', 'account', 'verification']
    .map(async (table) => [table, await snapshot(table)])));
}

async function seed(puzzles) {
  await client.query(`INSERT INTO "user" (id, name, email, "updatedAt", "displayName") VALUES
    ('unrelated-builder', 'Other', 'other@example.test', '2024-01-02', 'Other Builder'),
    ('confirmed-builder', 'Confirmed', 'confirmed@example.test', '2024-01-03', NULL)`);
  await client.query(`INSERT INTO "session" (id, "expiresAt", token, "updatedAt", "userId")
    VALUES ('preserved-session', '2030-01-01', 'synthetic-token', '2024-01-04', 'confirmed-builder')`);
  await client.query(`INSERT INTO "account" (id, "accountId", "providerId", "userId", "updatedAt")
    VALUES ('preserved-account', 'synthetic-account', 'synthetic-provider', 'confirmed-builder', '2024-01-05')`);
  await client.query(`INSERT INTO "verification" (id, identifier, value, "expiresAt", "updatedAt")
    VALUES ('preserved-verification', 'synthetic-id', 'synthetic-value', '2030-01-01', '2024-01-06')`);
  if (!puzzles) return;
  for (const [index, id] of ids.entries()) {
    await client.query(`INSERT INTO "Puzzle"
      (id, title, grid, hints, phase, "createdAt", "updatedAt", "publishedAt", visibility, "gridBeforeHints")
      VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9, $10::jsonb)`, [
      id, `Original ${index}`, JSON.stringify({ cells: [[index]], metadata: 'must survive' }),
      JSON.stringify({ '1a': `Original hint ${index}` }), index % 2 ? 'hints' : 'grid',
      `2024-02-0${index + 1}T01:02:03.004Z`, `2024-03-0${index + 1}T04:05:06.007Z`,
      index === 3 ? '2024-04-01T07:08:09.010Z' : null,
      index === 3 ? 'public' : 'private', index % 2 ? JSON.stringify({ original: index }) : null,
    ]);
  }
}

async function configure(builder, puzzleIds) {
  await client.query(`SELECT set_config('crossward.legacy_builder_id', $1, false),
    set_config('crossward.legacy_puzzle_ids', $2, false)`, [builder ?? '', puzzleIds ?? '']);
}

async function isolated(label, run, puzzles = true) {
  const schema = `o1_acceptance_${randomUUID().replaceAll('-', '')}`;
  // The identifier is generated here, never supplied by an operator.
  await client.query(`CREATE SCHEMA "${schema}"`);
  try {
    await client.query(`SET search_path TO "${schema}"`);
    await configure();
    for (const sql of historicalSQL) await client.query(sql);
    await seed(puzzles);
    await run();
    process.stdout.write(`PASS ${label}\n`);
  } finally {
    await client.query('ROLLBACK');
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  }
}

async function migrationFailsWithoutChanges(builder, puzzleIds) {
  const beforePuzzles = await snapshot('Puzzle');
  const beforeAuth = await authSnapshot();
  await configure(builder, puzzleIds);
  await assert.rejects(client.query(ownershipSQL), 'Unsafe migration must reject');
  await client.query('ROLLBACK');
  const columns = await client.query(`SELECT column_name FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'Puzzle' AND column_name = 'builderId'`);
  assert.equal(columns.rowCount, 0, 'Failure must roll back the new column too');
  assert.deepEqual(await snapshot('Puzzle'), beforePuzzles);
  assert.deepEqual(await authSnapshot(), beforeAuth);
}

async function rejectSQL(sql, values, code) {
  await assert.rejects(client.query(sql, values), (error) => error.code === code);
}

async function assertRequiredForeignKey() {
  const column = (await client.query(`SELECT is_nullable, column_default
    FROM information_schema.columns WHERE table_schema = current_schema()
    AND table_name = 'Puzzle' AND column_name = 'builderId'`)).rows;
  assert.deepEqual(column, [{ is_nullable: 'NO', column_default: null }]);
  const constraints = (await client.query(`SELECT c.confdeltype, c.confupdtype,
    c.confrelid = '"user"'::regclass AS references_user,
    ARRAY(SELECT a.attname::text FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, n)
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum ORDER BY k.n) AS columns,
    ARRAY(SELECT a.attname::text FROM unnest(c.confkey) WITH ORDINALITY AS k(attnum, n)
      JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.attnum ORDER BY k.n) AS targets
    FROM pg_constraint c WHERE c.conrelid = '"Puzzle"'::regclass AND c.contype = 'f'`)).rows;
  assert.deepEqual(constraints, [{
    confdeltype: 'r', confupdtype: 'c', references_user: true, columns: ['builderId'], targets: ['id'],
  }]);
  const insert = `INSERT INTO "Puzzle" (id, grid, hints, "updatedAt", "builderId")
    VALUES ($1, '{}'::jsonb, '{}'::jsonb, '2024-01-01', $2)`;
  await rejectSQL(insert, ['null-builder', null], '23502');
  await rejectSQL(insert, ['missing-builder', 'nonexistent-user'], '23503');
  await rejectSQL(`INSERT INTO "Puzzle" (id, grid, hints, "updatedAt")
    VALUES ('omitted-builder', '{}'::jsonb, '{}'::jsonb, '2024-01-01')`, [], '23502');
  await client.query(insert, ['valid-new-puzzle', 'confirmed-builder']);
  await rejectSQL(`DELETE FROM "user" WHERE id = 'confirmed-builder'`, [], '23503');
  assert.equal((await client.query(`SELECT count(*)::int AS n FROM "user" WHERE id = 'confirmed-builder'`)).rows[0].n, 1);
  await client.query(`UPDATE "user" SET id = 'renamed-builder' WHERE id = 'confirmed-builder'`);
  assert.deepEqual((await client.query(`SELECT DISTINCT "builderId" FROM "Puzzle"`)).rows,
    [{ builderId: 'renamed-builder' }]);
}

try {
  await isolated('empty puzzle table migrates without a legacy assignment and preserves auth', async () => {
    const beforeAuth = await authSnapshot();
    await client.query(ownershipSQL);
    assert.deepEqual(await snapshot('Puzzle'), []);
    assert.deepEqual(await authSnapshot(), beforeAuth);
    await assertRequiredForeignKey();
  }, false);

  await isolated('four explicit legacy puzzles preserve every prior field and gain only the confirmed builder', async () => {
    const beforePuzzles = await snapshot('Puzzle');
    const beforeAuth = await authSnapshot();
    await configure('confirmed-builder', JSON.stringify([...ids].reverse()));
    await client.query(ownershipSQL);
    assert.deepEqual(await snapshot('Puzzle', true), beforePuzzles);
    assert.deepEqual(await authSnapshot(), beforeAuth);
    assert.deepEqual((await client.query(`SELECT id, "builderId" FROM "Puzzle" ORDER BY id`)).rows,
      [...ids].sort().map((id) => ({ id, builderId: 'confirmed-builder' })));
    await assertRequiredForeignKey();
  });

  const failures = [
    ['nonempty table without operator inputs', undefined, undefined],
    ['builder without explicit puzzle set', 'confirmed-builder', undefined],
    ['puzzle set without builder', undefined, JSON.stringify(ids)],
    ['nonexistent builder', 'nonexistent-user', JSON.stringify(ids)],
    ['partial puzzle set', 'confirmed-builder', JSON.stringify(ids.slice(0, 3))],
    ['extra puzzle id', 'confirmed-builder', JSON.stringify([...ids, 'unexpected'])],
    ['same count with wrong puzzle id', 'confirmed-builder', JSON.stringify([...ids.slice(0, 3), 'wrong'])],
    ['duplicate puzzle ids', 'confirmed-builder', JSON.stringify([...ids, ids[0]])],
    ['empty puzzle set', 'confirmed-builder', '[]'],
    ['malformed puzzle JSON', 'confirmed-builder', 'not-json'],
    ['JSON object instead of explicit array', 'confirmed-builder', '{"legacy-one":true}'],
    ['nonstring array item', 'confirmed-builder', JSON.stringify([...ids.slice(0, 3), 42])],
  ];
  for (const [label, builder, puzzleIds] of failures) {
    await isolated(`${label}: fails closed and rolls back`, () => migrationFailsWithoutChanges(builder, puzzleIds));
  }
} finally {
  await client.end();
}
