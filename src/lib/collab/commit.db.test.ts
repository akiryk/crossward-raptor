// 24-S1 acceptance: the commit path against PostgreSQL. Runs in a throwaway
// schema of the local test database (`src/test-support/database.ts`).
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Prisma, PrismaClient } from '@prisma/client';
import { createGrid, withLetter, type Grid } from '@/engine/grid';
import { enterHintsPhase } from '@/engine/phase';
import { serializeGrid, serializePuzzle, type SerializedGrid } from '@/lib/puzzle-storage';
import { createTestDatabase, type TestDatabase } from '@/test-support/database';
import { commitPuzzleOperation, MAX_ATTEMPTS } from './commit';

let db: TestDatabase;
beforeAll(async () => {
  db = await createTestDatabase();
  await db.client.user.createMany({ data: [
    { id: 'adam', name: 'Adam', email: 'adam@collab.example.test', displayName: 'Adam' },
    { id: 'jay', name: 'Jay', email: 'jay@collab.example.test', displayName: 'Jay' },
  ] });
}, 60_000);
afterAll(async () => { await db?.drop(); });

const T0 = new Date('2026-11-12T10:00:00.000Z');
const hours = (n: number) => new Date(T0.getTime() + n * 3_600_000);

function letters(grid: Grid, entries: Array<[number, number, string]>): Grid {
  return entries.reduce((next, [col, row, letter]) => withLetter(next, { col, row }, letter), grid);
}
const blank5 = serializeGrid(createGrid({ cols: 5, rows: 5 }));
/** CAT across the top, locked. */
const lockedCat = serializeGrid(letters(createGrid({ cols: 5, rows: 5 }), [[0, 0, 'C'], [1, 0, 'A'], [2, 0, 'T']]), [
  { col: 0, row: 0, orientation: 'across', length: 3 },
]);
const hinted = serializePuzzle(enterHintsPhase({
  grid: letters(createGrid({ cols: 3, rows: 3 }), [
    [0, 0, 'A'], [1, 0, 'B'], [2, 0, 'C'], [0, 1, 'D'], [1, 1, 'E'], [2, 1, 'F'], [0, 2, 'G'], [1, 2, 'H'],
  ]),
  hints: {}, phase: 'grid',
}));

async function seed(data: {
  grid?: SerializedGrid; hints?: Record<string, string>; phase?: string; builderId?: string;
  version?: number; resetEpoch?: number; publishedAt?: Date | null; title?: string;
} = {}): Promise<string> {
  const row = await db.client.puzzle.create({
    data: {
      builderId: data.builderId ?? 'adam', title: data.title ?? 'Seeded',
      grid: (data.grid ?? blank5) as unknown as Prisma.InputJsonValue,
      hints: (data.hints ?? {}) as Prisma.InputJsonValue, phase: data.phase ?? 'grid',
      version: data.version ?? 0, resetEpoch: data.resetEpoch ?? 0, publishedAt: data.publishedAt ?? null,
    },
  });
  return row.id;
}

type Write = { col: number; row: number; value: string | null };
function cells(puzzleId: string, writes: Write[], extra: Partial<{ opId: string; clientId: string; epoch: number; baseVersion: number }> = {}) {
  return { opId: randomUUID(), puzzleId, clientId: 'tab-a', epoch: 0, baseVersion: 0, kind: 'cells', writes, ...extra };
}
function down(col: number, word: string, from = 0): Write[] {
  return [...word].map((letter, i) => ({ col, row: from + i, value: letter }));
}
const puzzle = (id: string) => db.client.puzzle.findUniqueOrThrow({ where: { id } });
const log = (puzzleId: string) => db.client.puzzleOperation.findMany({ where: { puzzleId }, orderBy: [{ version: 'asc' }, { createdAt: 'asc' }] });
function letterAt(row: { grid: unknown }, col: number, r: number) {
  const cell = (row.grid as SerializedGrid).cells[r][col];
  return cell.kind === 'active' ? cell.letter : 'black';
}
function column(row: { grid: unknown }, col: number, length = 5) {
  return Array.from({ length }, (_, r) => letterAt(row, col, r) ?? '.').join('');
}
const commit = (userId: string, input: unknown, options = {}) => commitPuzzleOperation(db.client, userId, input, options);

/** The client, except that after each of the first `times` puzzle reads
 *  (inside a transaction too) it runs `interfere`: a racing write landing
 *  between the commit's read and its compare-and-swap. */
function racing(times: number, interfere: () => Promise<unknown>) {
  let remaining = times;
  let reads = 0;
  const delegate = (target: object) => new Proxy(target, {
    get(object, key) {
      const value = Reflect.get(object, key);
      if (typeof value !== 'function') return value;
      if (typeof key === 'string' && key.startsWith('find')) {
        return async (...args: unknown[]) => {
          const result = await value.apply(object, args);
          reads++;
          if (remaining > 0) {
            remaining--;
            await interfere();
          }
          return result;
        };
      }
      return value.bind(object);
    },
  });
  const wrap = (client: object): object => new Proxy(client, {
    get(object, key) {
      const value = Reflect.get(object, key);
      if (key === 'puzzle') return delegate(value);
      if (key === '$transaction') {
        return (work: (tx: object) => unknown, ...rest: unknown[]) =>
          value.call(object, (tx: object) => work(wrap(tx)), ...rest);
      }
      return typeof value === 'function' ? value.bind(object) : value;
    },
  });
  return { client: wrap(db.client) as PrismaClient, reads: () => reads };
}

describe('24-S1-8 a commit', () => {
  it('advances the version by one and records the operation in the log', async () => {
    const id = await seed({ grid: lockedCat });
    const op = cells(id, [{ col: 0, row: 2, value: 'M' }, { col: 1, row: 2, value: 'STAR' }], { clientId: 'tab-7', baseVersion: 0 });
    expect(await commit('adam', op, { now: T0 })).toEqual({ status: 'accepted', opId: op.opId, version: 1 });

    const row = await puzzle(id);
    expect(row.version).toBe(1);
    expect(letterAt(row, 0, 2)).toBe('M');
    expect(letterAt(row, 1, 2)).toBe('STAR');
    expect(letterAt(row, 0, 0)).toBe('C');
    expect((row.grid as unknown as SerializedGrid).lockedWords).toEqual(lockedCat.lockedWords);
    expect(await log(id)).toEqual([expect.objectContaining({
      puzzleId: id, opId: op.opId, userId: 'adam', clientId: 'tab-7', epoch: 0, baseVersion: 0,
      status: 'accepted', code: null, version: 1, createdAt: T0,
      operation: { kind: 'cells', writes: op.writes },
      previous: { kind: 'cells', cells: [{ col: 0, row: 2, value: null }, { col: 1, row: 2, value: null }] },
    })]);
  });

  it('commits hints and titles, each advancing the version by one', async () => {
    const id = await seed({ ...hinted });
    const envelope = { puzzleId: id, clientId: 'tab-a', epoch: 0, baseVersion: 0 };
    expect(await commit('adam', { ...envelope, opId: randomUUID(), kind: 'hint', key: '1-across', text: 'Opening' }))
      .toMatchObject({ status: 'accepted', version: 1 });
    expect(await commit('adam', { ...envelope, opId: randomUUID(), kind: 'title', title: '  Renamed  ' }))
      .toMatchObject({ status: 'accepted', version: 2 });
    const row = await puzzle(id);
    expect(row).toMatchObject({ version: 2, title: 'Renamed', phase: 'hints' });
    expect((row.hints as Record<string, string>)['1-across']).toBe('Opening');
    expect((row.hints as Record<string, string>)['1-down']).toBe('');
    expect((await log(id)).map((entry) => [entry.version, entry.previous])).toEqual([
      [1, { kind: 'hint', text: '' }], [2, { kind: 'title', title: 'Seeded' }],
    ]);
  });

  it('refuses another builder, a missing puzzle and malformed input, writing nothing', async () => {
    const id = await seed();
    expect(await commit('jay', cells(id, [{ col: 0, row: 0, value: 'J' }]))).toEqual({ status: 'not-found' });
    expect(await commit('adam', cells('no-such-puzzle', [{ col: 0, row: 0, value: 'J' }]))).toEqual({ status: 'not-found' });
    expect(await commit('adam', { ...cells(id, []), writes: [] })).toEqual({ status: 'invalid' });
    expect(await commit('adam', 'not an operation')).toEqual({ status: 'invalid' });
    expect(await puzzle(id)).toMatchObject({ version: 0, grid: blank5 });
    expect(await log(id)).toEqual([]);
  });
});

describe('24-S1-9 an opId is applied at most once; resending returns its first outcome', () => {
  it('returns the recorded acceptance, even after later commits and publication', async () => {
    const id = await seed();
    const first = cells(id, down(0, 'AB'));
    expect(await commit('adam', first)).toMatchObject({ status: 'accepted', version: 1 });
    await commit('adam', cells(id, [{ col: 0, row: 0, value: 'Z' }]));
    expect(await commit('adam', first)).toEqual({ status: 'accepted', opId: first.opId, version: 1 });
    await db.client.puzzle.update({ where: { id }, data: { publishedAt: T0 } });
    expect(await commit('adam', first)).toEqual({ status: 'accepted', opId: first.opId, version: 1 });
    const row = await puzzle(id);
    expect(row.version).toBe(2);
    expect(column(row, 0)).toBe('ZB...');
    expect((await log(id)).map((entry) => entry.opId)).toHaveLength(2);
  });

  it('returns the recorded refusal even once the operation would now fit', async () => {
    const id = await seed({ grid: lockedCat });
    const op = cells(id, [{ col: 1, row: 0, value: 'U' }]);
    expect(await commit('adam', op)).toEqual({ status: 'refused', opId: op.opId, code: 'locked' });
    await db.client.puzzle.update({ where: { id }, data: { grid: { ...lockedCat, lockedWords: undefined } as unknown as Prisma.InputJsonValue } });
    expect(await commit('adam', op)).toEqual({ status: 'refused', opId: op.opId, code: 'locked' });
    const row = await puzzle(id);
    expect(letterAt(row, 1, 0)).toBe('A');
    expect(row.version).toBe(0);
    expect(await log(id)).toEqual([expect.objectContaining({ opId: op.opId, status: 'refused', code: 'locked', version: null })]);
  });

  it('commits concurrent resends once, every one answering the same', async () => {
    const id = await seed();
    const op = cells(id, down(2, 'XYZ'));
    const outcomes = await Promise.all(Array.from({ length: 5 }, () => commit('adam', op)));
    expect(outcomes).toEqual(Array(5).fill({ status: 'accepted', opId: op.opId, version: 1 }));
    expect((await puzzle(id)).version).toBe(1);
    expect(await log(id)).toHaveLength(1);
  });

  it('treats an opId already used for another puzzle as invalid', async () => {
    const mine = await seed();
    const other = await seed();
    const op = cells(mine, [{ col: 0, row: 0, value: 'A' }]);
    await commit('adam', op);
    expect(await commit('adam', { ...op, puzzleId: other })).toEqual({ status: 'invalid' });
    expect(await puzzle(other)).toMatchObject({ version: 0, grid: blank5 });
  });
});

describe('24-S1-10 one transaction', () => {
  it('leaves the puzzle row untouched when its log record cannot be written', async () => {
    const id = await seed();
    const failing = new Proxy(db.client, {
      get(object, key) {
        const value = Reflect.get(object, key);
        if (key !== '$transaction') return typeof value === 'function' ? value.bind(object) : value;
        return (work: (tx: object) => unknown, ...rest: unknown[]) => value.call(object, (tx: object) => work(new Proxy(tx, {
          get(inner, name) {
            const delegate = Reflect.get(inner, name);
            if (name !== 'puzzleOperation') return typeof delegate === 'function' ? delegate.bind(inner) : delegate;
            return new Proxy(delegate, {
              get(target, method) {
                if (typeof method === 'string' && method.startsWith('create')) {
                  return async () => { throw new Error('the log write failed'); };
                }
                const fn = Reflect.get(target, method);
                return typeof fn === 'function' ? fn.bind(target) : fn;
              },
            });
          },
        })), ...rest);
      },
    });
    await expect(commitPuzzleOperation(failing, 'adam', cells(id, [{ col: 0, row: 0, value: 'Q' }]))).rejects.toThrow();
    expect(await puzzle(id)).toMatchObject({ version: 0, grid: blank5 });
    expect(await log(id)).toEqual([]);
  });
});

describe('24-S1-11 a lost race is retried a bounded number of times', () => {
  it('retries from the read after another commit wins, keeping both', async () => {
    const id = await seed();
    const rival = cells(id, [{ col: 4, row: 4, value: 'R' }], { clientId: 'tab-b' });
    const { client } = racing(2, () => commit('adam', { ...rival, opId: randomUUID(), writes: [{ col: 4, row: rival.writes.length + 1, value: 'R' }] }));
    const mine = cells(id, [{ col: 0, row: 0, value: 'M' }]);
    const outcome = await commitPuzzleOperation(client, 'adam', mine);
    expect(outcome).toMatchObject({ status: 'accepted', opId: mine.opId });
    const row = await puzzle(id);
    expect(outcome.status === 'accepted' && outcome.version).toBe(row.version);
    expect(row.version).toBeGreaterThanOrEqual(2);
    expect(letterAt(row, 0, 0)).toBe('M');
    expect(letterAt(row, 4, 2)).toBe('R');
    expect((await log(id)).map((entry) => entry.version)).toEqual(Array.from({ length: row.version }, (_, i) => i + 1));
  });

  it('compares and swaps on the version itself, not only on the log', async () => {
    const id = await seed();
    const raced = serializeGrid(withLetter(createGrid({ cols: 5, rows: 5 }), { col: 4, row: 4 }, 'R'));
    // Another writer advances the version with no log record of its own.
    const { client } = racing(1, () => db.client.puzzle.update({
      where: { id }, data: { version: { increment: 1 }, grid: raced as unknown as Prisma.InputJsonValue },
    }));
    expect(await commitPuzzleOperation(client, 'adam', cells(id, [{ col: 0, row: 0, value: 'M' }])))
      .toMatchObject({ status: 'accepted', version: 2 });
    const row = await puzzle(id);
    expect([letterAt(row, 0, 0), letterAt(row, 4, 4), row.version]).toEqual(['M', 'R', 2]);
  });

  it('gives up after a bounded number of attempts, writing nothing of its own', async () => {
    const id = await seed();
    let rivals = 0;
    const { client, reads } = racing(Infinity, () => commit('adam', cells(id, [{ col: 4, row: rivals++ % 5, value: 'R' }])));
    const mine = cells(id, [{ col: 0, row: 0, value: 'M' }]);
    expect(await commitPuzzleOperation(client, 'adam', mine)).toEqual({ status: 'busy', opId: mine.opId });
    expect(reads()).toBeLessThanOrEqual(3 * MAX_ATTEMPTS);
    expect(MAX_ATTEMPTS).toBeGreaterThanOrEqual(3);
    expect(MAX_ATTEMPTS).toBeLessThanOrEqual(10);
    const row = await puzzle(id);
    expect(letterAt(row, 0, 0)).toBeNull();
    expect((await log(id)).some((entry) => entry.opId === mine.opId)).toBe(false);
    // Resent later, it commits.
    expect(await commit('adam', mine)).toMatchObject({ status: 'accepted', version: row.version + 1 });
  });

  it('commits five concurrent bursts, one version each, losing none', async () => {
    const id = await seed();
    const ops = Array.from({ length: 5 }, (_, i) => cells(id, [{ col: i, row: i, value: 'ABCDE'[i] }], { clientId: `tab-${i}` }));
    const outcomes = await Promise.all(ops.map((op) => commit('adam', op)));
    expect(outcomes.every((outcome) => outcome.status === 'accepted')).toBe(true);
    expect(outcomes.map((outcome) => (outcome.status === 'accepted' ? outcome.version : 0)).sort()).toEqual([1, 2, 3, 4, 5]);
    const row = await puzzle(id);
    expect(row.version).toBe(5);
    expect([0, 1, 2, 3, 4].map((i) => letterAt(row, i, i)).join('')).toBe('ABCDE');
    expect((await log(id)).map((entry) => entry.version)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('24-S1-12 interleaved bursts: commit order wins per cell', () => {
  it('MASKS, then MAG over its first three cells, gives MAGKS (D1)', async () => {
    const id = await seed();
    await commit('adam', cells(id, down(1, 'MASKS'), { clientId: 'adam-tab' }));
    // Made against version 0, before MASKS was seen: the version never refuses it.
    expect(await commit('adam', cells(id, down(1, 'MAG'), { clientId: 'other-tab', baseVersion: 0 })))
      .toMatchObject({ status: 'accepted', version: 2 });
    expect(column(await puzzle(id), 1)).toBe('MAGKS');
  });

  it('the other order gives MASKS', async () => {
    const id = await seed();
    await commit('adam', cells(id, down(1, 'MAG'), { clientId: 'other-tab' }));
    await commit('adam', cells(id, down(1, 'MASKS'), { clientId: 'adam-tab' }));
    expect(column(await puzzle(id), 1)).toBe('MASKS');
  });

  it('compatible edits made against the same version both survive', async () => {
    const id = await seed();
    await commit('adam', cells(id, down(0, 'ABRA'), { clientId: 'tab-a', baseVersion: 0 }));
    await commit('adam', cells(id, down(4, 'HAM'), { clientId: 'tab-b', baseVersion: 0 }));
    const row = await puzzle(id);
    expect([column(row, 0), column(row, 4), row.version]).toEqual(['ABRA.', 'HAM..', 2]);
  });
});

describe('24-S1-13 rules checked against the current state', () => {
  it('rejects a burst into a locked word whole, recording the refusal', async () => {
    const id = await seed({ grid: lockedCat });
    const op = cells(id, [{ col: 0, row: 3, value: 'F' }, { col: 3, row: 0, value: 'S' }]);
    expect(await commit('adam', op)).toEqual({ status: 'refused', opId: op.opId, code: 'locked' });
    const row = await puzzle(id);
    expect(row.version).toBe(0);
    expect(row.grid).toEqual(lockedCat);
    expect(await log(id)).toEqual([expect.objectContaining({ status: 'refused', code: 'locked', version: null, previous: null })]);
    // A burst leaving locked cells as they are commits.
    expect(await commit('adam', cells(id, [{ col: 0, row: 0, value: 'C' }, { col: 0, row: 3, value: 'F' }])))
      .toMatchObject({ status: 'accepted', version: 1 });
  });

  it('applies the Hints rules', async () => {
    const id = await seed({ ...hinted });
    const env = { puzzleId: id, clientId: 'tab-a', epoch: 0, baseVersion: 0 };
    expect(await commit('adam', cells(id, [{ col: 1, row: 1, value: 'Q' }]))).toMatchObject({ status: 'accepted', version: 1 });
    expect(await commit('adam', cells(id, [{ col: 0, row: 0, value: 'W' }, { col: 1, row: 1, value: null }])))
      .toMatchObject({ status: 'refused', code: 'phase' });
    expect(await commit('adam', cells(id, [{ col: 2, row: 2, value: 'W' }]))).toMatchObject({ status: 'refused', code: 'phase' });
    expect(await commit('adam', { ...env, opId: randomUUID(), kind: 'hint', key: '7-across', text: 'x' }))
      .toMatchObject({ status: 'refused', code: 'invalid' });
    const row = await puzzle(id);
    expect([row.version, letterAt(row, 0, 0), letterAt(row, 1, 1), letterAt(row, 2, 2)]).toEqual([1, 'A', 'Q', 'black']);
  });

  it('refuses a hint in Build', async () => {
    const id = await seed();
    expect(await commit('adam', { puzzleId: id, clientId: 't', epoch: 0, baseVersion: 0, opId: randomUUID(), kind: 'hint', key: '1-across', text: 'x' }))
      .toMatchObject({ status: 'refused', code: 'phase' });
  });

  it('refuses anything once published', async () => {
    const id = await seed({ ...hinted, publishedAt: T0 });
    for (const op of [
      cells(id, [{ col: 0, row: 0, value: 'Z' }]),
      { puzzleId: id, clientId: 't', epoch: 0, baseVersion: 0, opId: randomUUID(), kind: 'title', title: 'Late' },
    ]) {
      expect(await commit('adam', op)).toMatchObject({ status: 'refused', code: 'published' });
    }
    expect(await puzzle(id)).toMatchObject({ version: 0, title: 'Seeded', grid: hinted.grid });
  });

  it('refuses an operation published past between its read and its write', async () => {
    const id = await seed({ ...hinted });
    const { client } = racing(1, () => db.client.puzzle.update({ where: { id }, data: { publishedAt: T0 } }));
    expect(await commitPuzzleOperation(client, 'adam', cells(id, [{ col: 0, row: 0, value: 'Z' }])))
      .toMatchObject({ status: 'refused', code: 'published' });
    expect(await puzzle(id)).toMatchObject({ version: 0, grid: hinted.grid });
  });

  it('refuses an operation from another reset epoch, even into untouched cells', async () => {
    const id = await seed({ resetEpoch: 1, version: 4 });
    expect(await commit('adam', cells(id, [{ col: 2, row: 2, value: 'E' }], { epoch: 0, baseVersion: 4 })))
      .toMatchObject({ status: 'refused', code: 'epoch' });
    expect(await puzzle(id)).toMatchObject({ version: 4, grid: blank5 });
    expect(await commit('adam', cells(id, [{ col: 2, row: 2, value: 'E' }], { epoch: 1, baseVersion: 4 })))
      .toMatchObject({ status: 'accepted', version: 5 });
  });

  it('refuses an operation whose epoch changed between its read and its write', async () => {
    const id = await seed();
    const { client } = racing(1, () => db.client.puzzle.update({ where: { id }, data: { resetEpoch: 1 } }));
    expect(await commitPuzzleOperation(client, 'adam', cells(id, [{ col: 0, row: 0, value: 'Z' }])))
      .toMatchObject({ status: 'refused', code: 'epoch' });
    expect((await puzzle(id)).grid).toEqual(blank5);
  });
});

describe('24-S1-14 pruning the log', () => {
  it('keeps the last records by count', async () => {
    const id = await seed();
    for (let i = 0; i < 5; i++) await commit('adam', cells(id, [{ col: i, row: 0, value: 'A' }], { baseVersion: i }), { retainCount: 3 });
    expect((await log(id)).map((entry) => entry.version)).toEqual([3, 4, 5]);
    expect((await puzzle(id)).version).toBe(5);
  });

  it('keeps nothing past the window but the newest accepted record', async () => {
    const id = await seed({ grid: lockedCat });
    await commit('adam', cells(id, [{ col: 0, row: 1, value: 'A' }]), { now: T0 });
    await commit('adam', cells(id, [{ col: 1, row: 0, value: 'U' }]), { now: hours(1) }); // refused
    await commit('adam', cells(id, [{ col: 0, row: 2, value: 'B' }]), { now: hours(2) });
    await commit('adam', cells(id, [{ col: 0, row: 3, value: 'C' }]), { now: hours(25.5) });
    expect((await log(id)).map((entry) => [entry.version, entry.status])).toEqual([[2, 'accepted'], [3, 'accepted']]);
    await commit('adam', cells(id, [{ col: 1, row: 0, value: 'U' }]), { now: hours(60) }); // refused
    expect((await log(id)).map((entry) => [entry.version, entry.status])).toEqual([[3, 'accepted'], [null, 'refused']]);
  });

  it('refuses, as expired, an operation made against a version older than the log keeps', async () => {
    const id = await seed();
    for (let i = 0; i < 5; i++) await commit('adam', cells(id, [{ col: i, row: 0, value: 'A' }], { baseVersion: i }), { retainCount: 2 });
    expect((await log(id)).map((entry) => entry.version)).toEqual([4, 5]);
    const old = cells(id, [{ col: 0, row: 4, value: 'O' }], { baseVersion: 2 });
    expect(await commit('adam', old)).toEqual({ status: 'refused', opId: old.opId, code: 'expired' });
    expect(await commit('adam', old)).toEqual({ status: 'refused', opId: old.opId, code: 'expired' });
    expect(await commit('adam', cells(id, [{ col: 0, row: 4, value: 'O' }], { baseVersion: 3 })))
      .toMatchObject({ status: 'accepted', version: 6 });
  });
});
