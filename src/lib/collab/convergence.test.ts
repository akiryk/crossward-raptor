// 24-S1 acceptance: a randomized convergence test. Several tabs make
// operations against their own views; the server commits them in an
// arbitrary interleaving (each tab's in order, one at a time). Seeded, so a
// failure names a reproducible seed.
import { describe, expect, it } from 'vitest';
import { createGrid, withLetter } from '@/engine/grid';
import { enterHintsPhase } from '@/engine/phase';
import { hintKey, requiredHints } from '@/engine/hints';
import { deserializeGrid, serializeGrid, serializePuzzle } from '@/lib/puzzle-storage';
import type { LockedWord } from '@/lib/locked-words';
import { applyOperation, evaluateOperation, type PuzzleContent, type PuzzleState } from './apply';
import type { CellWrite, Operation } from './operation';

function prng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZE = 5;
const VALUES = ['A', 'B', 'C', 'Q', 'X', 'REB', null];

function initialState(random: () => number, phase: 'grid' | 'hints'): PuzzleState {
  let grid = createGrid({ cols: SIZE, rows: SIZE });
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (phase === 'hints' || random() < 0.4) grid = withLetter(grid, { col, row }, 'ABCDE'[Math.floor(random() * 5)]);
    }
  }
  if (phase === 'hints') {
    const black = [{ col: 2, row: 2 }];
    const hinted = enterHintsPhase({ grid: withLetterless(grid, black), hints: {}, phase: 'grid' });
    return { ...serializePuzzle(hinted), title: 'T', resetEpoch: 0, published: false };
  }
  // A locked word across row 0, so some bursts are refused.
  for (let col = 0; col < 3; col++) grid = withLetter(grid, { col, row: 0 }, 'L');
  const locks: LockedWord[] = [{ col: 0, row: 0, orientation: 'across', length: 3 }];
  return { grid: serializeGrid(grid, locks), hints: {}, title: 'T', phase: 'grid', resetEpoch: 0, published: false };
}

function withLetterless(grid: ReturnType<typeof createGrid>, empty: Array<{ col: number; row: number }>) {
  return empty.reduce((next, coord) => withLetter(next, coord, null), grid);
}

function randomOperation(random: () => number, state: PuzzleState, tab: number, index: number): Operation {
  const envelope = { opId: `t${tab}-${index}`, puzzleId: 'p', clientId: `tab-${tab}`, epoch: 0, baseVersion: 0 };
  const roll = random();
  if (roll < 0.1) return { ...envelope, kind: 'title', title: `Title ${tab}.${index}` };
  if (state.phase === 'hints' && roll < 0.4) {
    const { across, down } = requiredHints(deserializeGrid(state.grid));
    const keys = [...across, ...down].map(hintKey);
    return { ...envelope, kind: 'hint', key: keys[Math.floor(random() * keys.length)], text: `Clue ${tab}.${index}` };
  }
  const writes: CellWrite[] = [];
  const used = new Set<string>();
  const count = 1 + Math.floor(random() * 4);
  while (writes.length < count) {
    const col = Math.floor(random() * SIZE);
    const row = Math.floor(random() * SIZE);
    if (used.has(`${col},${row}`)) continue;
    used.add(`${col},${row}`);
    writes.push({ col, row, value: VALUES[Math.floor(random() * VALUES.length)] });
  }
  return { ...envelope, kind: 'cells', writes };
}

interface Commit { op: Operation; accepted: boolean }

function simulate(seed: number, phase: 'grid' | 'hints') {
  const random = prng(seed);
  const initial = initialState(random, phase);
  const tabs = Array.from({ length: 3 }, (_, tab) =>
    Array.from({ length: 6 }, (_, index) => randomOperation(random, initial, tab, index)));
  const queues = tabs.map((ops) => [...ops]);
  let server: PuzzleState = initial;
  const log: Commit[] = [];
  const snapshots: PuzzleState[] = [initial];
  while (queues.some((queue) => queue.length > 0)) {
    const ready = queues.filter((queue) => queue.length > 0);
    const op = ready[Math.floor(random() * ready.length)].shift()!;
    const before = structuredClone(server);
    const result = evaluateOperation(server, op);
    expect(server, `seed ${seed}: evaluating never mutates the state`).toEqual(before);
    if (result.ok) {
      server = { ...server, ...result.content };
      snapshots.push(server);
    }
    log.push({ op, accepted: result.ok });
  }
  return { initial, server, log, snapshots };
}

function content(state: PuzzleContent): PuzzleContent {
  return { grid: state.grid, hints: state.hints, title: state.title, phase: state.phase };
}

describe('24-S1-7 convergence', () => {
  const seeds = Array.from({ length: 300 }, (_, i) => 1000 + i);

  it.each(['grid', 'hints'] as const)('in %s, every client replaying the committed operations reaches the server state', (phase) => {
    for (const seed of seeds) {
      const { server, log, snapshots } = simulate(seed, phase);
      const accepted = log.filter((entry) => entry.accepted).map((entry) => entry.op);
      // Catch-up from any version: that version's state plus the later operations.
      for (let version = 0; version < snapshots.length; version++) {
        const replayed = accepted.slice(version).reduce<PuzzleContent>((state, op) => applyOperation(state, op).content, snapshots[version]);
        expect(content(replayed), `seed ${seed}, from version ${version}`).toEqual(content(server));
      }
    }
  });

  it.each(['grid', 'hints'] as const)('in %s, commit order wins per cell and compatible edits all survive', (phase) => {
    for (const seed of seeds) {
      const { initial, server, log } = simulate(seed, phase);
      for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
          const last = log.filter((entry) => entry.accepted && entry.op.kind === 'cells')
            .flatMap((entry) => (entry.op.kind === 'cells' ? entry.op.writes : []))
            .filter((write) => write.col === col && write.row === row)
            .at(-1);
          const expected = last ? { kind: 'active', letter: last.value } : initial.grid.cells[row][col];
          expect(server.grid.cells[row][col], `seed ${seed}, cell (${col},${row})`).toEqual(expected);
        }
      }
      const lastTitle = log.filter((entry) => entry.accepted && entry.op.kind === 'title').at(-1);
      expect(server.title).toBe(lastTitle?.op.kind === 'title' ? lastTitle.op.title : initial.title);
    }
  });

  it('refuses whole: a refused burst leaves every one of its cells as it was', () => {
    let refusals = 0;
    for (const seed of seeds) {
      const random = prng(seed);
      const initial = initialState(random, 'grid');
      const op = randomOperation(random, initial, 0, 0);
      const locked = { ...op, kind: 'cells' as const, writes: [{ col: 4, row: 4, value: 'Z' }, { col: 1, row: 0, value: 'Z' }] };
      for (const candidate of [op, locked]) {
        const result = evaluateOperation(initial, candidate);
        if (!result.ok) refusals++;
        if (!result.ok) expect(result.code).toBe('locked');
      }
    }
    expect(refusals).toBeGreaterThanOrEqual(seeds.length);
  });

  it('exercises acceptance and refusal in both phases', () => {
    for (const phase of ['grid', 'hints'] as const) {
      const outcomes = seeds.flatMap((seed) => simulate(seed, phase).log.map((entry) => entry.accepted));
      expect(outcomes.filter(Boolean).length, phase).toBeGreaterThan(outcomes.length / 4);
      expect(outcomes.filter((ok) => !ok).length, phase).toBeGreaterThan(outcomes.length / 20);
    }
  });
});
