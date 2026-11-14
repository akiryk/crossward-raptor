// 24-S2 acceptance: the structural operations (lock, unlock, enterHints,
// startOver), parsed, validated and applied purely.
import { describe, expect, it } from 'vitest';
import { createGrid, withLetter, type Grid } from '@/engine/grid';
import { enterHintsPhase } from '@/engine/phase';
import { deserializeGrid, serializeGrid, serializePuzzle, type SerializedGrid } from '@/lib/puzzle-storage';
import type { LockedWord } from '@/lib/locked-words';
import {
  applyOperation, epochAfter, evaluateOperation, gridBeforeHints, validateOperation,
  type PuzzleContent, type PuzzleState,
} from './apply';
import { parseOperation, type Operation, type OperationBody } from './operation';

const envelope = { opId: 'op', puzzleId: 'p', clientId: 'tab', epoch: 0, baseVersion: 0 };
const OWNER = { isOwner: true };
const COLLABORATOR = { isOwner: false };
const op = (body: OperationBody, epoch = 0): Operation => ({ ...envelope, epoch, ...body } as Operation);
const lock = (word: LockedWord, epoch = 0) => op({ kind: 'lock', word }, epoch);
const unlock = (word: LockedWord, epoch = 0) => op({ kind: 'unlock', word }, epoch);
const enterHints = (epoch = 0) => op({ kind: 'enterHints' }, epoch);
const startOver = (keepLockedWords: boolean, epoch = 0) => op({ kind: 'startOver', keepLockedWords }, epoch);
const cells = (writes: Array<{ col: number; row: number; value: string | null }>, epoch = 0) => op({ kind: 'cells', writes }, epoch);

function letters(grid: Grid, entries: Array<[number, number, string]>): Grid {
  return entries.reduce((next, [col, row, letter]) => withLetter(next, { col, row }, letter), grid);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** CAT across the top (lockable: complete, Preview-white, 3 long); DOG
 *  down from (4,1), which Preview runs on into the empty (4,4) (CAT's C is
 *  its counterpart), so it isn't complete; HI, 2 long, across (0,2). */
const CAT: LockedWord = { col: 0, row: 0, orientation: 'across', length: 3 };
const DOG: LockedWord = { col: 4, row: 1, orientation: 'down', length: 3 };
const HI: LockedWord = { col: 0, row: 2, orientation: 'across', length: 2 };
const buildGrid = letters(createGrid({ cols: 5, rows: 5 }), [
  [0, 0, 'C'], [1, 0, 'A'], [2, 0, 'T'], [4, 1, 'D'], [4, 2, 'O'], [4, 3, 'G'], [0, 2, 'H'], [1, 2, 'I'],
]);
function build(locks: LockedWord[] = [], overrides: Partial<PuzzleState> = {}): PuzzleState {
  return deepFreeze({
    grid: serializeGrid(buildGrid, locks), hints: {}, title: 'Original', phase: 'grid',
    resetEpoch: 0, published: false, ...overrides,
  });
}

/** The same Build puzzle converted to Hints, with one hint written. */
function hints(overrides: Partial<PuzzleState> = {}): PuzzleState {
  const stored = serializePuzzle(enterHintsPhase({ grid: buildGrid, hints: {}, phase: 'grid' }));
  return deepFreeze({ ...stored, hints: { ...stored.hints, '1-across': 'Pet' }, title: 'Hinted', resetEpoch: 0, published: false, ...overrides });
}

function letterAt(state: { grid: SerializedGrid }, col: number, row: number) {
  const cell = state.grid.cells[row][col];
  return cell.kind === 'active' ? cell.letter : 'black';
}

function accept(state: PuzzleState, operation: Operation, committer = OWNER) {
  const result = evaluateOperation(state, operation, committer);
  if (!result.ok) throw new Error(`refused: ${result.code}`);
  return result;
}

describe('24-S2-1 parsing the structural kinds', () => {
  it('accepts each with only known fields, as a copy', () => {
    const input = { ...envelope, kind: 'lock', word: { ...CAT, extra: 1 }, extra: true };
    const before = structuredClone(input);
    const parsed = parseOperation(input);
    expect(parsed).toEqual({ ok: true, op: { ...envelope, kind: 'lock', word: CAT } });
    if (parsed.ok && parsed.op.kind === 'lock') expect(parsed.op.word).not.toBe(input.word);
    expect(input).toEqual(before);
    expect(parseOperation({ ...envelope, kind: 'unlock', word: DOG })).toEqual({ ok: true, op: { ...envelope, kind: 'unlock', word: DOG } });
    expect(parseOperation({ ...envelope, kind: 'enterHints', grid: {} })).toEqual({ ok: true, op: { ...envelope, kind: 'enterHints' } });
    for (const keepLockedWords of [true, false]) {
      expect(parseOperation({ ...envelope, kind: 'startOver', keepLockedWords })).toEqual({
        ok: true, op: { ...envelope, kind: 'startOver', keepLockedWords },
      });
    }
  });

  it.each([
    ['a lock without a word', { ...envelope, kind: 'lock' }],
    ['a lock with an empty word', { ...envelope, kind: 'lock', word: {} }],
    ['an unlock with a word not an object', { ...envelope, kind: 'unlock', word: [0, 0, 'across', 3] }],
    ['a word with a negative column', { ...envelope, kind: 'lock', word: { ...CAT, col: -1 } }],
    ['a word with a fractional row', { ...envelope, kind: 'lock', word: { ...CAT, row: 0.5 } }],
    ['a word sideways', { ...envelope, kind: 'lock', word: { ...CAT, orientation: 'sideways' } }],
    ['a word of length 0', { ...envelope, kind: 'unlock', word: { ...CAT, length: 0 } }],
    ['a word too long', { ...envelope, kind: 'lock', word: { ...CAT, length: 1025 } }],
    ['a word length as a string', { ...envelope, kind: 'lock', word: { ...CAT, length: '3' } }],
    ['a startOver without keepLockedWords', { ...envelope, kind: 'startOver' }],
    ['a startOver with keepLockedWords a string', { ...envelope, kind: 'startOver', keepLockedWords: 'true' }],
    ['an enterHints with a bad envelope', { ...envelope, kind: 'enterHints', epoch: -1 }],
    ['a publish (not an operation)', { ...envelope, kind: 'publish', visibility: 'public' }],
  ])('refuses %s', (_name, input) => {
    expect(parseOperation(input)).toEqual({ ok: false });
  });
});

describe('24-S2-2 lock and unlock', () => {
  it('locks a lockable word, keeping every cell, the other locks, the hints and the title', () => {
    const state = build([HI]);
    const result = accept(state, lock(CAT));
    expect(result.content.grid.lockedWords).toEqual([HI, CAT]);
    expect(result.content.grid.cells).toEqual(state.grid.cells);
    expect(result.content.title).toBe('Original');
    expect(result.content.hints).toEqual({});
    expect(result.content.phase).toBe('grid');
    expect(result.previous).toEqual({ kind: 'lock', locked: false });
    expect(result.resetEpoch).toBe(0);
  });

  it('enforces lockability as lockableWord does: complete, Preview-white, 3 or more, from its first cell', () => {
    for (const word of [
      DOG, // runs on into an empty cell
      HI, // two long
      { ...CAT, col: 1, length: 2 }, // not the word's first cell
      { ...CAT, length: 4 }, // not the word's length
      { ...CAT, orientation: 'down' as const }, // not a word that way
      { col: 9, row: 0, orientation: 'across' as const, length: 3 }, // outside the grid
    ]) {
      expect(evaluateOperation(build(), lock(word), OWNER), JSON.stringify(word)).toEqual({ ok: false, code: 'invalid' });
    }
  });

  it('locking a locked word changes nothing and is accepted, even once it no longer qualifies', () => {
    const result = accept(build([DOG]), lock(DOG));
    expect(result.content.grid.lockedWords).toEqual([DOG]);
    expect(result.previous).toEqual({ kind: 'lock', locked: true });
  });

  it('unlocks: the lock goes, its letters stay; unlocking an unlocked word changes nothing', () => {
    const state = build([CAT, HI]);
    const result = accept(state, unlock(CAT));
    expect(result.content.grid.lockedWords).toEqual([HI]);
    expect(result.content.grid.cells).toEqual(state.grid.cells);
    expect(result.previous).toEqual({ kind: 'unlock', locked: true });

    const last = accept(result.content as PuzzleState, unlock(HI));
    expect(last.content.grid.lockedWords ?? []).toEqual([]);
    const again = accept(build(), unlock(CAT));
    expect(again.content.grid.lockedWords ?? []).toEqual([]);
    expect(again.previous).toEqual({ kind: 'unlock', locked: false });
  });

  it('a lock protects its cells from a later burst made before it (D3); unlocking frees them', () => {
    const locked = { ...build(), ...accept(build(), lock(CAT)).content } as PuzzleState;
    expect(evaluateOperation(locked, cells([{ col: 4, row: 4, value: 'Z' }, { col: 1, row: 0, value: 'O' }]))).toEqual({ ok: false, code: 'locked' });
    expect(evaluateOperation(locked, cells([{ col: 3, row: 0, value: 'S' }]))).toEqual({ ok: false, code: 'locked' });
    const unlocked = { ...locked, ...accept(locked, unlock(CAT)).content } as PuzzleState;
    expect(letterAt(accept(unlocked, cells([{ col: 1, row: 0, value: 'O' }])).content, 1, 0)).toBe('O');
  });

  it('a lock or unlock made in Build fails in Hints', () => {
    expect(validateOperation(hints(), lock(CAT), OWNER)).toBe('phase');
    expect(validateOperation(hints(), unlock(CAT), OWNER)).toBe('phase');
  });

  it('leaves its input unchanged and is idempotent', () => {
    const state = build([HI]);
    const once = applyOperation(state, lock(CAT)).content;
    expect(applyOperation(once, lock(CAT)).content).toEqual(once);
    const freed = applyOperation(state, unlock(HI)).content;
    expect(applyOperation(freed, unlock(HI)).content).toEqual(freed);
  });
});

describe('24-S2-3 enterHints', () => {
  it('converts the state as the engine does: empty cells black, blank hints seeded, locks dropped', () => {
    const state = build([CAT], { hints: { '1-across': 'Kept' } });
    const result = accept(state, enterHints(), COLLABORATOR);
    const expected = serializePuzzle(enterHintsPhase({ grid: deserializeGrid(state.grid), hints: { '1-across': 'Kept' }, phase: 'grid' }));
    expect(result.content.phase).toBe('hints');
    expect(result.content.grid).toEqual(expected.grid);
    expect(result.content.grid.lockedWords).toBeUndefined();
    expect(result.content.hints).toEqual(expected.hints);
    expect(result.content.hints['1-across']).toBe('Kept');
    expect(Object.keys(result.content.hints).length).toBeGreaterThan(1);
    expect(letterAt(result.content, 3, 3)).toBe('black');
    expect(letterAt(result.content, 4, 2)).toBe('O');
    expect(result.content.title).toBe('Original');
    expect(result.previous).toEqual({ kind: 'enterHints', lockedWords: [CAT] });
    expect(result.resetEpoch).toBe(0);
  });

  it('is refused once in Hints, and fits Build only', () => {
    expect(validateOperation(hints(), enterHints(), OWNER)).toBe('phase');
    expect(validateOperation(build(), enterHints(), COLLABORATOR)).toBeNull();
  });

  it('stores the grid before it as the snapshot enterHints does: the cells, without locks', () => {
    const state = build([CAT]);
    expect(gridBeforeHints(state.grid)).toEqual(serializeGrid(buildGrid));
    expect(gridBeforeHints(state.grid).lockedWords).toBeUndefined();
  });

  it('then validates late Build operations against Hints (all or nothing)', () => {
    const converted = { ...build(), ...accept(build([CAT]), enterHints()).content } as PuzzleState;
    // Letters into still-active cells fit.
    expect(letterAt(accept(converted, cells([{ col: 4, row: 2, value: 'A' }, { col: 0, row: 0, value: 'B' }])).content, 4, 2)).toBe('A');
    // Clearing one, or writing a cell now black, refuses the whole burst.
    expect(evaluateOperation(converted, cells([{ col: 4, row: 2, value: 'A' }, { col: 4, row: 3, value: null }]))).toEqual({ ok: false, code: 'phase' });
    expect(evaluateOperation(converted, cells([{ col: 4, row: 2, value: 'A' }, { col: 3, row: 3, value: 'Q' }]))).toEqual({ ok: false, code: 'phase' });
    expect(validateOperation(converted, lock(CAT), OWNER)).toBe('phase');
    expect(validateOperation(converted, startOver(true), OWNER)).toBe('phase');
  });
});

describe('24-S2-4 startOver', () => {
  it('is owner-only: refused without the owner, whatever else fits', () => {
    expect(validateOperation(build(), startOver(false))).toBe('owner');
    expect(validateOperation(build(), startOver(true), COLLABORATOR)).toBe('owner');
    expect(validateOperation(build(), startOver(true), OWNER)).toBeNull();
  });

  it('clears every cell and every lock, keeps the title and hints, and begins a new epoch', () => {
    const state = build([CAT]);
    const result = accept(state, startOver(false));
    expect(result.content.grid).toEqual(serializeGrid(createGrid({ cols: 5, rows: 5 })));
    expect(result.content.title).toBe('Original');
    expect(result.content.phase).toBe('grid');
    expect(result.resetEpoch).toBe(1);
    expect(result.previous).toEqual({
      kind: 'startOver', lockedWords: [CAT], cells: [
        { col: 0, row: 0, value: 'C' }, { col: 1, row: 0, value: 'A' }, { col: 2, row: 0, value: 'T' },
        { col: 4, row: 1, value: 'D' }, { col: 0, row: 2, value: 'H' }, { col: 1, row: 2, value: 'I' },
        { col: 4, row: 2, value: 'O' }, { col: 4, row: 3, value: 'G' },
      ],
    });
  });

  it('with Keep Locked Words, keeps the locked words, their letters and their locks', () => {
    const result = accept(build([CAT, DOG]), startOver(true));
    expect(result.content.grid.lockedWords).toEqual([CAT, DOG]);
    for (const [col, row, letter] of [[0, 0, 'C'], [1, 0, 'A'], [2, 0, 'T'], [4, 1, 'D'], [4, 2, 'O'], [4, 3, 'G']] as const) {
      expect(letterAt(result.content, col, row)).toBe(letter);
    }
    expect(letterAt(result.content, 0, 2)).toBeNull();
    expect(letterAt(result.content, 1, 2)).toBeNull();
    expect(result.resetEpoch).toBe(1);
  });

  it('starting over from a later epoch advances that one; no other kind changes the epoch', () => {
    expect(accept(build([], { resetEpoch: 4 }), startOver(false, 4)).resetEpoch).toBe(5);
    expect(epochAfter(4, { kind: 'startOver', keepLockedWords: true })).toBe(5);
    for (const body of [
      { kind: 'enterHints' }, { kind: 'lock', word: CAT }, { kind: 'unlock', word: CAT },
      { kind: 'cells', writes: [] }, { kind: 'title', title: 'x' }, { kind: 'hint', key: '1-across', text: '' },
    ] as OperationBody[]) {
      expect(epochAfter(4, body), body.kind).toBe(4);
    }
    expect(accept(build(), lock(CAT)).resetEpoch).toBe(0);
  });

  it('every operation made before the reset is refused after it, even into cells it left alone', () => {
    const reset = { ...build([CAT]), ...accept(build([CAT]), startOver(true)).content, resetEpoch: 1 } as PuzzleState;
    for (const operation of [
      cells([{ col: 3, row: 3, value: 'Z' }]), lock(CAT), unlock(CAT), enterHints(), startOver(false),
      op({ kind: 'title', title: 'Late' }),
    ]) {
      expect(validateOperation(reset, operation, OWNER), operation.kind).toBe('epoch');
    }
    expect(validateOperation(reset, cells([{ col: 3, row: 3, value: 'Z' }], 1), OWNER)).toBeNull();
  });

  it('is refused in Hints', () => {
    expect(validateOperation(hints(), startOver(false), OWNER)).toBe('phase');
  });
});

describe('24-S2-5 publication and the epoch hold for every structural kind', () => {
  const kinds = [lock(CAT), unlock(CAT), enterHints(), startOver(true), startOver(false)];
  it.each(kinds.map((operation) => [operation.kind, operation] as const))('%s is refused once published', (_kind, operation) => {
    expect(validateOperation(build([], { published: true }), operation, OWNER)).toBe('published');
    expect(validateOperation(hints({ published: true }), operation, OWNER)).toBe('published');
  });
  it.each(kinds.map((operation) => [operation.kind, operation] as const))('%s from another epoch is refused', (_kind, operation) => {
    expect(validateOperation(build([CAT], { resetEpoch: 1 }), operation, OWNER)).toBe('epoch');
    expect(validateOperation(build([CAT], { resetEpoch: 1 }), { ...operation, epoch: 2 }, OWNER)).toBe('epoch');
  });
});

// A small deterministic generator, so a failure names its seed.
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

describe('24-S2-6 replay with structural operations (randomized, 300 seeds)', () => {
  const SIZE = 5;
  const WORDS: LockedWord[] = [CAT, DOG, HI, { col: 0, row: 4, orientation: 'across', length: 3 }];

  function randomBody(random: () => number): OperationBody {
    const roll = random();
    if (roll < 0.12) return { kind: 'lock', word: WORDS[Math.floor(random() * WORDS.length)] };
    if (roll < 0.2) return { kind: 'unlock', word: WORDS[Math.floor(random() * WORDS.length)] };
    if (roll < 0.24) return { kind: 'startOver', keepLockedWords: random() < 0.5 };
    if (roll < 0.27) return { kind: 'enterHints' };
    if (roll < 0.32) return { kind: 'title', title: `T${Math.floor(random() * 100)}` };
    const writes = [];
    const used = new Set<string>();
    for (let i = 0; i < 1 + Math.floor(random() * 3); i++) {
      const col = Math.floor(random() * SIZE);
      const row = Math.floor(random() * SIZE);
      if (used.has(`${col},${row}`)) continue;
      used.add(`${col},${row}`);
      writes.push({ col, row, value: ['C', 'A', 'T', 'X', null][Math.floor(random() * 5)] });
    }
    return { kind: 'cells', writes };
  }

  const view = (state: PuzzleContent & { resetEpoch: number }) =>
    ({ grid: state.grid, hints: state.hints, title: state.title, phase: state.phase, resetEpoch: state.resetEpoch });

  it('replaying the accepted operations from any version reaches the server state, epoch included; no pre-reset operation is accepted', () => {
    const kinds = new Set<string>();
    for (let seed = 2000; seed < 2300; seed++) {
      const random = prng(seed);
      let server: PuzzleState = build();
      const snapshots: PuzzleState[] = [server];
      const accepted: Operation[] = [];
      for (let i = 0; i < 25; i++) {
        // Made in the current epoch, or (a late tab) the one before.
        const epoch = random() < 0.8 ? server.resetEpoch : Math.max(0, server.resetEpoch - 1);
        const operation = op(randomBody(random), epoch);
        const before = structuredClone(server);
        const result = evaluateOperation(server, operation, OWNER);
        expect(server, `seed ${seed}: never mutates`).toEqual(before);
        if (!result.ok) continue;
        expect(operation.epoch, `seed ${seed}: accepted only in the current epoch`).toBe(server.resetEpoch);
        server = { ...server, ...result.content, resetEpoch: result.resetEpoch };
        snapshots.push(server);
        accepted.push(operation);
        kinds.add(operation.kind);
      }
      for (let version = 0; version < snapshots.length; version++) {
        const replayed = accepted.slice(version).reduce(
          (state, next) => ({ ...state, ...applyOperation(state, next).content, resetEpoch: epochAfter(state.resetEpoch, next) }),
          snapshots[version],
        );
        expect(view(replayed), `seed ${seed}, from version ${version}`).toEqual(view(server));
      }
    }
    expect([...kinds].sort()).toEqual(['cells', 'enterHints', 'lock', 'startOver', 'title', 'unlock']);
  });
});
