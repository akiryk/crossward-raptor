// 24-S2 acceptance: the structural operations on the commit path, and every
// stale-operation rule, against PostgreSQL. Runs in a throwaway schema of the
// local test database (`src/test-support/database.ts`).
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Prisma } from '@prisma/client';
import { createGrid, withLetter, type Grid } from '@/engine/grid';
import { enterHintsPhase } from '@/engine/phase';
import { hintKey, requiredHints } from '@/engine/hints';
import type { LockedWord } from '@/lib/locked-words';
import { deserializeGrid, serializeGrid, serializePuzzle, type SerializedGrid } from '@/lib/puzzle-storage';
import { createTestDatabase, type TestDatabase } from '@/test-support/database';
import { racing } from '@/test-support/racing';
import { commitPuzzleOperation } from './commit';
import { publishPuzzleAt } from './publish';

let db: TestDatabase;
beforeAll(async () => {
  db = await createTestDatabase();
  await db.client.user.createMany({ data: [
    { id: 'adam', name: 'Adam', email: 'adam@structural.example.test', displayName: 'Adam' },
    { id: 'jay', name: 'Jay', email: 'jay@structural.example.test', displayName: 'Jay' },
  ] });
}, 60_000);
afterAll(async () => { await db?.drop(); });

function letters(grid: Grid, entries: Array<[number, number, string]>): Grid {
  return entries.reduce((next, [col, row, letter]) => withLetter(next, { col, row }, letter), grid);
}
/** CAT across the top of a 5×5 (lockable), and DOG down from (4,1). */
const CAT: LockedWord = { col: 0, row: 0, orientation: 'across', length: 3 };
const catGrid = letters(createGrid({ cols: 5, rows: 5 }), [[0, 0, 'C'], [1, 0, 'A'], [2, 0, 'T'], [4, 1, 'D'], [4, 2, 'O'], [4, 3, 'G']]);

async function seed(data: {
  grid?: SerializedGrid; hints?: Record<string, string>; phase?: string; builderId?: string;
  version?: number; resetEpoch?: number; publishedAt?: Date | null;
} = {}): Promise<string> {
  const row = await db.client.puzzle.create({
    data: {
      builderId: data.builderId ?? 'adam', title: 'Seeded',
      grid: (data.grid ?? serializeGrid(catGrid)) as unknown as Prisma.InputJsonValue,
      hints: (data.hints ?? {}) as Prisma.InputJsonValue, phase: data.phase ?? 'grid',
      version: data.version ?? 0, resetEpoch: data.resetEpoch ?? 0, publishedAt: data.publishedAt ?? null,
    },
  });
  return row.id;
}

type Extra = Partial<{ opId: string; epoch: number; baseVersion: number; clientId: string }>;
function operation(puzzleId: string, body: Record<string, unknown>, extra: Extra = {}) {
  return { opId: randomUUID(), puzzleId, clientId: 'tab-a', epoch: 0, baseVersion: 0, ...body, ...extra };
}
const lock = (id: string, word: LockedWord, extra?: Extra) => operation(id, { kind: 'lock', word }, extra);
const unlock = (id: string, word: LockedWord, extra?: Extra) => operation(id, { kind: 'unlock', word }, extra);
const enterHints = (id: string, extra?: Extra) => operation(id, { kind: 'enterHints' }, extra);
const startOver = (id: string, keepLockedWords: boolean, extra?: Extra) => operation(id, { kind: 'startOver', keepLockedWords }, extra);
const cells = (id: string, writes: Array<{ col: number; row: number; value: string | null }>, extra?: Extra) =>
  operation(id, { kind: 'cells', writes }, extra);
const title = (id: string, value: string, extra?: Extra) => operation(id, { kind: 'title', title: value }, extra);
const hint = (id: string, key: string, text: string, extra?: Extra) => operation(id, { kind: 'hint', key, text }, extra);

const commit = (userId: string, input: unknown) => commitPuzzleOperation(db.client, userId, input);
const puzzle = (id: string) => db.client.puzzle.findUniqueOrThrow({ where: { id } });
const record = (opId: string) => db.client.puzzleOperation.findUniqueOrThrow({ where: { opId } });
const logCount = (puzzleId: string) => db.client.puzzleOperation.count({ where: { puzzleId } });
function letterAt(row: { grid: unknown }, col: number, r: number) {
  const cell = (row.grid as SerializedGrid).cells[r][col];
  return cell.kind === 'active' ? cell.letter : 'black';
}
async function accepted(userId: string, input: { opId: string }) {
  const outcome = await commit(userId, input);
  expect(outcome).toMatchObject({ status: 'accepted', opId: input.opId });
  return outcome;
}
async function refused(userId: string, input: { opId: string }, code: string) {
  expect(await commit(userId, input)).toEqual({ status: 'refused', opId: input.opId, code });
}

describe('24-S2-7 lock and unlock on the commit path', () => {
  it('locks and unlocks, one version each, logged with the word and whether it was locked', async () => {
    const id = await seed();
    const locking = lock(id, CAT);
    expect(await commit('adam', locking)).toEqual({ status: 'accepted', opId: locking.opId, version: 1 });
    let row = await puzzle(id);
    expect((row.grid as unknown as SerializedGrid).lockedWords).toEqual([CAT]);
    expect((row.grid as unknown as SerializedGrid).cells).toEqual(serializeGrid(catGrid).cells);
    expect(await record(locking.opId)).toMatchObject({
      status: 'accepted', version: 1, operation: { kind: 'lock', word: CAT }, previous: { kind: 'lock', locked: false },
    });

    const unlocking = unlock(id, CAT, { baseVersion: 1 });
    expect(await commit('adam', unlocking)).toEqual({ status: 'accepted', opId: unlocking.opId, version: 2 });
    row = await puzzle(id);
    expect((row.grid as unknown as SerializedGrid).lockedWords ?? []).toEqual([]);
    expect(letterAt(row, 1, 0)).toBe('A');
    expect(await record(unlocking.opId)).toMatchObject({ previous: { kind: 'unlock', locked: true } });
  });

  it('enforces lockability against the current grid: a word changed since the lock was made is refused', async () => {
    const id = await seed();
    await refused('adam', lock(id, { col: 4, row: 1, orientation: 'down', length: 3 }), 'invalid');
    const late = lock(id, CAT);
    await accepted('adam', cells(id, [{ col: 1, row: 0, value: null }]));
    await refused('adam', late, 'invalid');
    expect(await record(late.opId)).toMatchObject({ status: 'refused', code: 'invalid', version: null });
    const row = await puzzle(id);
    expect(row.version).toBe(1);
    expect((row.grid as unknown as SerializedGrid).lockedWords).toBeUndefined();
  });
});

describe('24-S2-8 enterHints on the commit path', () => {
  it("converts the server's current state, not the sender's, in one write with gridBeforeHints", async () => {
    const id = await seed({ grid: serializeGrid(catGrid, [CAT]) });
    const made = enterHints(id, { baseVersion: 0 });
    // Committed after the tab made its Enter Hints: the conversion keeps it.
    await accepted('adam', cells(id, [{ col: 3, row: 3, value: 'X' }], { clientId: 'tab-b' }));
    expect(await commit('adam', made)).toEqual({ status: 'accepted', opId: made.opId, version: 2 });

    const before = letters(catGrid, [[3, 3, 'X']]);
    const expected = serializePuzzle(enterHintsPhase({ grid: before, hints: {}, phase: 'grid' }));
    const row = await puzzle(id);
    expect(row.phase).toBe('hints');
    expect(row.grid).toEqual(expected.grid);
    expect(letterAt(row, 3, 3)).toBe('X');
    expect(letterAt(row, 3, 2)).toBe('black');
    expect(row.hints).toEqual(expected.hints);
    expect(row.gridBeforeHints).toEqual(serializeGrid(before));
    expect(row.version).toBe(2);
    expect(await record(made.opId)).toMatchObject({ operation: { kind: 'enterHints' }, previous: { kind: 'enterHints', lockedWords: [CAT] } });
  });

  it('a second Enter Hints is refused and writes gridBeforeHints only once', async () => {
    const id = await seed();
    await accepted('adam', enterHints(id));
    const first = await puzzle(id);
    await refused('adam', enterHints(id, { baseVersion: 0 }), 'phase');
    const after = await puzzle(id);
    expect(after.gridBeforeHints).toEqual(first.gridBeforeHints);
    expect(after.grid).toEqual(first.grid);
    expect(after.version).toBe(1);
  });

  it('a burst landing between its read and its write is converted too (compare-and-swap, then retry)', async () => {
    const id = await seed();
    const race = racing(db.client, 1, () => commit('adam', cells(id, [{ col: 3, row: 1, value: 'Q' }], { clientId: 'tab-b' })));
    const made = enterHints(id);
    expect(await commitPuzzleOperation(race.client, 'adam', made)).toEqual({ status: 'accepted', opId: made.opId, version: 2 });
    const row = await puzzle(id);
    expect(letterAt(row, 3, 1)).toBe('Q');
    expect(row.phase).toBe('hints');
    expect((row.gridBeforeHints as unknown as SerializedGrid).cells[1][3]).toEqual({ kind: 'active', letter: 'Q' });
  });
});

describe('24-S2-9 startOver on the commit path', () => {
  it('clears the grid and its locks and begins a new epoch, one version, as the owner', async () => {
    const id = await seed({ grid: serializeGrid(catGrid, [CAT]), version: 3, resetEpoch: 2 });
    const reset = startOver(id, false, { epoch: 2, baseVersion: 3 });
    expect(await commit('adam', reset)).toEqual({ status: 'accepted', opId: reset.opId, version: 4 });
    const row = await puzzle(id);
    expect(row.resetEpoch).toBe(3);
    expect(row.grid).toEqual(serializeGrid(createGrid({ cols: 5, rows: 5 })));
    expect(row.phase).toBe('grid');
    expect(row.title).toBe('Seeded');
    expect(await record(reset.opId)).toMatchObject({
      epoch: 2, version: 4, operation: { kind: 'startOver', keepLockedWords: false }, previous: { kind: 'startOver', lockedWords: [CAT] },
    });
  });

  it('with Keep Locked Words, keeps each locked word and its lock', async () => {
    const id = await seed({ grid: serializeGrid(catGrid, [CAT]) });
    await accepted('adam', startOver(id, true));
    const row = await puzzle(id);
    expect((row.grid as unknown as SerializedGrid).lockedWords).toEqual([CAT]);
    expect([letterAt(row, 0, 0), letterAt(row, 1, 0), letterAt(row, 2, 0), letterAt(row, 4, 2)]).toEqual(['C', 'A', 'T', null]);
    expect(row.resetEpoch).toBe(1);
  });

  it('is refused in Hints, changing nothing', async () => {
    const id = await seed();
    await accepted('adam', enterHints(id));
    const before = await puzzle(id);
    await refused('adam', startOver(id, false, { baseVersion: 1 }), 'phase');
    expect(await puzzle(id)).toEqual(before);
  });
});

describe('24-S2-10 stale operations at the commit path', () => {
  it('an operation from before a reset is refused, even into a cell the reset left alone, and stays refused', async () => {
    const id = await seed({ grid: serializeGrid(catGrid, [CAT]) });
    const late = cells(id, [{ col: 3, row: 3, value: 'Z' }], { clientId: 'tab-b' });
    const others = [lock(id, CAT), unlock(id, CAT), enterHints(id), title(id, 'Late'), startOver(id, true)];
    await accepted('adam', startOver(id, true));
    const after = await puzzle(id);

    await refused('adam', late, 'epoch');
    for (const op of others) await refused('adam', op, 'epoch');
    expect(await puzzle(id)).toEqual(after);
    expect(await record(late.opId)).toMatchObject({ status: 'refused', code: 'epoch', epoch: 0 });
    // Resent, it keeps its first outcome; made in the new epoch, it fits.
    await refused('adam', late, 'epoch');
    await accepted('adam', cells(id, [{ col: 3, row: 3, value: 'Z' }], { epoch: 1, baseVersion: 1 }));
    expect(letterAt(await puzzle(id), 3, 3)).toBe('Z');
  });

  it('a reset landing between a burst\'s read and its write refuses the burst', async () => {
    const id = await seed();
    const race = racing(db.client, 1, () => commit('adam', startOver(id, false)));
    const burst = cells(id, [{ col: 0, row: 4, value: 'M' }], { clientId: 'tab-b' });
    expect(await commitPuzzleOperation(race.client, 'adam', burst)).toEqual({ status: 'refused', opId: burst.opId, code: 'epoch' });
    const row = await puzzle(id);
    expect(letterAt(row, 0, 4)).toBeNull();
    expect(row.resetEpoch).toBe(1);
    expect(row.version).toBe(1);
  });

  it('a lock or unlock made in Build fails once the puzzle is in Hints; letters still fit, clearing does not', async () => {
    const id = await seed({ grid: serializeGrid(catGrid, [CAT]) });
    const lateUnlock = unlock(id, CAT);
    const lateLock = lock(id, { col: 4, row: 1, orientation: 'down', length: 3 });
    const lateLetters = cells(id, [{ col: 4, row: 2, value: 'A' }]);
    const lateClear = cells(id, [{ col: 4, row: 1, value: 'E' }, { col: 4, row: 3, value: null }]);
    await accepted('adam', enterHints(id, { clientId: 'tab-b' }));
    const converted = await puzzle(id);

    await refused('adam', lateUnlock, 'phase');
    await refused('adam', lateLock, 'phase');
    await refused('adam', lateClear, 'phase');
    expect(await puzzle(id)).toEqual(converted);
    expect(await accepted('adam', lateLetters)).toMatchObject({ version: 2 });
    expect(letterAt(await puzzle(id), 4, 2)).toBe('A');
  });

  it('a burst into a cell locked after the burst was made is refused whole', async () => {
    const id = await seed();
    const intoLetter = cells(id, [{ col: 3, row: 3, value: 'Y' }, { col: 1, row: 0, value: 'O' }], { clientId: 'tab-b' });
    const intoEnd = cells(id, [{ col: 3, row: 0, value: 'S' }], { clientId: 'tab-b' });
    const sameValue = cells(id, [{ col: 1, row: 0, value: 'A' }, { col: 3, row: 4, value: 'K' }], { clientId: 'tab-b' });
    await accepted('adam', lock(id, CAT));

    await refused('adam', intoLetter, 'locked');
    await refused('adam', intoEnd, 'locked');
    let row = await puzzle(id);
    expect([letterAt(row, 3, 3), letterAt(row, 1, 0), letterAt(row, 3, 0)]).toEqual([null, 'A', null]);
    expect(row.version).toBe(1);
    expect(await accepted('adam', sameValue)).toMatchObject({ version: 2 });

    // A lock landing between a burst's read and its write refuses it too.
    const other = await seed();
    const race = racing(db.client, 1, () => commit('adam', lock(other, CAT)));
    const burst = cells(other, [{ col: 2, row: 0, value: 'B' }]);
    expect(await commitPuzzleOperation(race.client, 'adam', burst)).toEqual({ status: 'refused', opId: burst.opId, code: 'locked' });
    row = await puzzle(other);
    expect(letterAt(row, 2, 0)).toBe('T');
  });

  it('nothing is accepted after publication, whatever its kind', async () => {
    const stored = serializePuzzle(enterHintsPhase({ grid: catGrid, hints: {}, phase: 'grid' }));
    const { across, down } = requiredHints(deserializeGrid(stored.grid));
    const complete = Object.fromEntries([...across, ...down].map((ref) => [hintKey(ref), 'Clue']));
    const id = await seed({ grid: stored.grid, hints: complete, phase: 'hints', version: 2 });
    const pending = [
      cells(id, [{ col: 0, row: 0, value: 'B' }]), hint(id, '1-across', 'Late'), title(id, 'Late'),
      lock(id, CAT), unlock(id, CAT), enterHints(id), startOver(id, false), startOver(id, true),
    ];
    expect(await publishPuzzleAt(db.client, 'adam', { puzzleId: id, version: 2, visibility: 'public' })).toMatchObject({ status: 'published' });
    const published = await puzzle(id);
    const logged = await logCount(id);

    for (const op of pending) await refused('adam', op, 'published');
    expect(await puzzle(id)).toEqual(published);
    expect(published.version).toBe(2);
    expect(await logCount(id)).toBe(logged + pending.length);
  });
});
