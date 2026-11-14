// 24-S1 acceptance: the migration is additive. Applied to a schema holding
// synthetic rows, it preserves every row and timestamp, gives each puzzle
// version 0 and epoch 0, and adds an empty log.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, migrationNames, type TestDatabase } from '@/test-support/database';

// Amended by 24-S5: S1's migration is no longer the newest. Its migration
// and every later one are held back, applied together by `migrateRest`;
// each is additive, so the rows-preserved assertions below are unchanged.
const NAME = /_add_puzzle_operations$/;

let db: TestDatabase;
beforeAll(async () => {
  const names = await migrationNames();
  const index = names.findIndex((name) => NAME.test(name));
  db = await createTestDatabase({ holdBack: index < 0 ? 0 : names.length - index });
}, 60_000);
afterAll(async () => { await db?.drop(); });

const rows = async (table: string) =>
  (await db.query(`SELECT to_jsonb(t) AS row FROM "${table}" t ORDER BY id`)).rows.map(({ row }) => row);

describe('24-S1-15 the migration', () => {
  it('is held back with every later one, preserves every row, and adds the columns and an empty log', async () => {
    expect((await migrationNames()).some((name) => NAME.test(name))).toBe(true);

    await db.query(`INSERT INTO "user" (id, name, email, "updatedAt", "displayName") VALUES
      ('owner', 'Owner', 'owner@24s1.example.test', '2024-01-02', 'Owner'),
      ('player', 'Player', 'player@24s1.example.test', '2024-01-03', NULL)`);
    await db.query(`INSERT INTO "Puzzle"
      (id, "builderId", title, grid, hints, phase, "gridBeforeHints", "publishedAt", visibility, "createdAt", "updatedAt") VALUES
      ('draft', 'owner', 'Draft', '{"cols":1,"rows":1,"cells":[[{"kind":"active","letter":"A"}]]}', '{}', 'grid', NULL, NULL, 'private', '2024-01-01', '2024-02-02'),
      ('done', 'owner', 'Done', '{"cols":1,"rows":1,"cells":[[{"kind":"black"}]]}', '{"1-across":"Clue"}', 'hints', '{"original":"grid"}', '2024-03-04', 'public', '2024-01-03', '2024-02-04')`);
    await db.query(`INSERT INTO "PlaySession" (id, "userId", "puzzleId", entries, "startedAt")
      VALUES ('play', 'player', 'done', '{"cells":[]}', '2024-03-05')`);
    const before = { puzzles: await rows('Puzzle'), users: await rows('user'), plays: await rows('PlaySession') };

    await db.migrateRest();

    expect(await rows('Puzzle')).toEqual(before.puzzles.map((row) => ({ ...row, version: 0, resetEpoch: 0 })));
    expect(await rows('user')).toEqual(before.users);
    expect(await rows('PlaySession')).toEqual(before.plays);
    expect(await rows('PuzzleOperation')).toEqual([]);
  });

  it('constrains the log: one record per opId and per version, and it goes with its puzzle', async () => {
    const insert = (id: string, opId: string, version: number | null, user: string | null = 'owner') => db.query(
      `INSERT INTO "PuzzleOperation" (id, "puzzleId", "opId", "userId", "clientId", epoch, "baseVersion", status, version, operation)
       VALUES ($1, 'draft', $2, $3, 'tab', 0, 0, $4, $5, '{}')`,
      [id, opId, user, version === null ? 'refused' : 'accepted', version]);
    await insert('a', 'op-a', 1);
    await insert('r1', 'op-r1', null);
    await insert('r2', 'op-r2', null, 'player');
    await expect(insert('b', 'op-a', 2)).rejects.toMatchObject({ code: '23505' });
    await expect(insert('c', 'op-c', 1)).rejects.toMatchObject({ code: '23505' });

    await db.query(`DELETE FROM "user" WHERE id = 'player'`);
    expect((await db.query(`SELECT "userId" FROM "PuzzleOperation" WHERE id = 'r2'`)).rows).toEqual([{ userId: null }]);
    await db.query(`DELETE FROM "Puzzle" WHERE id = 'draft'`);
    expect(await rows('PuzzleOperation')).toEqual([]);
    expect((await rows('Puzzle')).map((row) => row.id)).toEqual(['done']);
  });
});
