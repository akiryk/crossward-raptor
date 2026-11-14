// 24-S2 acceptance: publishing pinned to the version the owner's readiness
// check saw (D7), against PostgreSQL in a throwaway schema.
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Prisma } from '@prisma/client';
import { createGrid, withLetter, type Grid } from '@/engine/grid';
import { enterHintsPhase } from '@/engine/phase';
import { hintKey, requiredHints } from '@/engine/hints';
import { deserializeGrid, serializeGrid, serializePuzzle } from '@/lib/puzzle-storage';
import { createTestDatabase, type TestDatabase } from '@/test-support/database';
import { racing } from '@/test-support/racing';
import { commitPuzzleOperation } from './commit';
import { publishPuzzleAt } from './publish';

let db: TestDatabase;
beforeAll(async () => {
  db = await createTestDatabase();
  await db.client.user.createMany({ data: [
    { id: 'adam', name: 'Adam', email: 'adam@publish.example.test', displayName: 'Adam' },
    { id: 'jay', name: 'Jay', email: 'jay@publish.example.test', displayName: 'Jay' },
  ] });
}, 60_000);
afterAll(async () => { await db?.drop(); });

const T0 = new Date('2026-11-13T09:00:00.000Z');
const T1 = new Date('2026-11-13T10:00:00.000Z');

function letters(grid: Grid, entries: Array<[number, number, string]>): Grid {
  return entries.reduce((next, [col, row, letter]) => withLetter(next, { col, row }, letter), grid);
}
const full = letters(createGrid({ cols: 3, rows: 3 }), [
  [0, 0, 'A'], [1, 0, 'B'], [2, 0, 'C'], [0, 1, 'D'], [1, 1, 'E'], [2, 1, 'F'], [0, 2, 'G'], [1, 2, 'H'], [2, 2, 'I'],
]);
const stored = serializePuzzle(enterHintsPhase({ grid: full, hints: {}, phase: 'grid' }));
const { across, down } = requiredHints(deserializeGrid(stored.grid));
const complete = Object.fromEntries([...across, ...down].map((ref) => [hintKey(ref), `Clue ${hintKey(ref)}`]));

async function seed(data: { builderId?: string; phase?: string; hints?: Record<string, string>; version?: number; publishedAt?: Date | null; visibility?: string } = {}) {
  const inHints = (data.phase ?? 'hints') === 'hints';
  return (await db.client.puzzle.create({
    data: {
      builderId: data.builderId ?? 'adam', title: 'Ready',
      grid: (inHints ? stored.grid : serializeGrid(full)) as unknown as Prisma.InputJsonValue,
      hints: (data.hints ?? (inHints ? complete : {})) as Prisma.InputJsonValue,
      phase: data.phase ?? 'hints', version: data.version ?? 0,
      publishedAt: data.publishedAt ?? null, visibility: data.visibility ?? 'private',
    },
  })).id;
}
const puzzle = (id: string) => db.client.puzzle.findUniqueOrThrow({ where: { id } });
const publish = (userId: string, input: unknown, now = T0) => publishPuzzleAt(db.client, userId, input, { now });
const hintOp = (puzzleId: string, text: string, baseVersion = 0) => ({
  opId: randomUUID(), puzzleId, clientId: 'tab-b', epoch: 0, baseVersion, kind: 'hint', key: '1-across', text,
});

describe('24-S2-11 publishing pinned to a version', () => {
  it('publishes at the version the readiness check saw, without advancing it or logging an operation', async () => {
    const id = await seed({ version: 3 });
    expect(await publish('adam', { puzzleId: id, version: 3, visibility: 'public' })).toEqual({
      status: 'published', publishedAt: T0, visibility: 'public', version: 3,
    });
    const row = await puzzle(id);
    expect(row.publishedAt).toEqual(T0);
    expect(row.visibility).toBe('public');
    expect(row.version).toBe(3);
    expect(await db.client.puzzleOperation.count({ where: { puzzleId: id } })).toBe(0);
  });

  it('a repeat at that version answers with the stored publication; at an earlier one it is refused', async () => {
    const id = await seed({ version: 3 });
    await publish('adam', { puzzleId: id, version: 3, visibility: 'public' });
    expect(await publish('adam', { puzzleId: id, version: 3, visibility: 'private' }, T1)).toEqual({
      status: 'published', publishedAt: T0, visibility: 'public', version: 3,
    });
    expect(await publish('adam', { puzzleId: id, version: 2, visibility: 'public' }, T1)).toEqual({ status: 'refused', code: 'published' });
    expect((await puzzle(id)).publishedAt).toEqual(T0);
  });

  it('is refused at a stale version: the puzzle changed since the check', async () => {
    const id = await seed();
    await commitPuzzleOperation(db.client, 'adam', hintOp(id, 'Changed'));
    const before = await puzzle(id);
    expect(await publish('adam', { puzzleId: id, version: 0, visibility: 'public' })).toEqual({ status: 'refused', code: 'stale' });
    expect(await puzzle(id)).toEqual(before);
    expect(await publish('adam', { puzzleId: id, version: 1, visibility: 'public' })).toMatchObject({ status: 'published', version: 1 });
  });

  it('is refused when an operation commits between its read and its write, a letter or a hint', async () => {
    const letter = (puzzleId: string) => ({
      opId: randomUUID(), puzzleId, clientId: 'tab-b', epoch: 0, baseVersion: 0, kind: 'cells', writes: [{ col: 1, row: 1, value: 'Z' }],
    });
    for (const racer of [letter, (puzzleId: string) => hintOp(puzzleId, 'Racing')]) {
      const id = await seed();
      const race = racing(db.client, 1, () => commitPuzzleOperation(db.client, 'adam', racer(id)));
      expect(await publishPuzzleAt(race.client, 'adam', { puzzleId: id, version: 0, visibility: 'public' }, { now: T0 })).toEqual({
        status: 'refused', code: 'stale',
      });
      const row = await puzzle(id);
      expect(row.publishedAt).toBeNull();
      expect(row.version).toBe(1);
    }
  });

  it('is refused when a hint is blanked between its read and its write without a version (an old tab at version 0)', async () => {
    const id = await seed();
    const race = racing(db.client, 1, () => db.client.puzzle.update({
      where: { id }, data: { hints: { ...complete, '1-across': '  ' } as Prisma.InputJsonValue },
    }));
    expect(await publishPuzzleAt(race.client, 'adam', { puzzleId: id, version: 0, visibility: 'public' })).toEqual({
      status: 'refused', code: 'incomplete',
    });
    expect((await puzzle(id)).publishedAt).toBeNull();
  });

  it('is refused in Build and with a required hint missing', async () => {
    const build = await seed({ phase: 'grid' });
    expect(await publish('adam', { puzzleId: build, version: 0, visibility: 'public' })).toEqual({ status: 'refused', code: 'phase' });
    const missing = await seed({ hints: { ...complete, '1-down': ' ' } });
    expect(await publish('adam', { puzzleId: missing, version: 0, visibility: 'public' })).toEqual({ status: 'refused', code: 'incomplete' });
    expect((await puzzle(build)).publishedAt).toBeNull();
    expect((await puzzle(missing)).publishedAt).toBeNull();
  });

  it("is owner-only: another builder's puzzle and a missing one are not found", async () => {
    const jays = await seed({ builderId: 'jay' });
    expect(await publish('adam', { puzzleId: jays, version: 0, visibility: 'public' })).toEqual({ status: 'not-found' });
    expect(await publish('adam', { puzzleId: 'missing', version: 0, visibility: 'public' })).toEqual({ status: 'not-found' });
    expect((await puzzle(jays)).publishedAt).toBeNull();
  });

  it.each([
    ['not an object', () => null],
    ['an array', (id: string) => [{ puzzleId: id, version: 0, visibility: 'public' }]],
    ['no puzzleId', () => ({ version: 0, visibility: 'public' })],
    ['a bad puzzleId', () => ({ puzzleId: 'a b', version: 0, visibility: 'public' })],
    ['no version', (id: string) => ({ puzzleId: id, visibility: 'public' })],
    ['a negative version', (id: string) => ({ puzzleId: id, version: -1, visibility: 'public' })],
    ['a fractional version', (id: string) => ({ puzzleId: id, version: 0.5, visibility: 'public' })],
    ['a string version', (id: string) => ({ puzzleId: id, version: '0', visibility: 'public' })],
    ['an unknown visibility', (id: string) => ({ puzzleId: id, version: 0, visibility: 'everyone' })],
  ])('refuses %s as invalid, writing nothing', async (_name, input) => {
    const id = await seed();
    expect(await publish('adam', input(id))).toEqual({ status: 'invalid' });
    expect((await puzzle(id)).publishedAt).toBeNull();
  });
});
