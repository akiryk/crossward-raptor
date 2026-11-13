// 24-S1 acceptance: validating and applying operations against the stored
// puzzle, purely.
import { describe, expect, it } from 'vitest';
import { createGrid, withLetter, type Grid } from '@/engine/grid';
import { enterHintsPhase } from '@/engine/phase';
import { serializeGrid, serializePuzzle } from '@/lib/puzzle-storage';
import type { LockedWord } from '@/lib/locked-words';
import { applyOperation, evaluateOperation, validateOperation, type PuzzleState } from './apply';
import type { CellWrite, Operation } from './operation';

const envelope = { opId: 'op', puzzleId: 'p', clientId: 'tab', epoch: 0, baseVersion: 0 };
const cells = (...writes: CellWrite[]): Operation => ({ ...envelope, kind: 'cells', writes });
const hint = (key: string, text: string): Operation => ({ ...envelope, kind: 'hint', key, text });
const title = (value: string): Operation => ({ ...envelope, kind: 'title', title: value });

function letters(grid: Grid, entries: Array<[number, number, string]>): Grid {
  return entries.reduce((next, [col, row, letter]) => withLetter(next, { col, row }, letter), grid);
}

/** CAT across at the top left, locked; DOG down from (4,1), not locked. */
const CAT: LockedWord = { col: 0, row: 0, orientation: 'across', length: 3 };
const buildGrid = letters(createGrid({ cols: 5, rows: 5 }), [
  [0, 0, 'C'], [1, 0, 'A'], [2, 0, 'T'], [4, 1, 'D'], [4, 2, 'O'], [4, 3, 'G'],
]);
function build(overrides: Partial<PuzzleState> = {}): PuzzleState {
  return deepFreeze({
    grid: serializeGrid(buildGrid, [CAT]), hints: {}, title: 'Original', phase: 'grid',
    resetEpoch: 0, published: false, ...overrides,
  });
}

/** A 3×3 full of A, then Hints: B at the center and (2,2) black. */
const hintsPuzzle = enterHintsPhase({
  grid: letters(createGrid({ cols: 3, rows: 3, black: [{ col: 2, row: 2 }] }), [
    [0, 0, 'A'], [1, 0, 'A'], [2, 0, 'A'], [0, 1, 'A'], [1, 1, 'B'], [2, 1, 'A'], [0, 2, 'A'], [1, 2, 'A'],
  ]),
  hints: {}, phase: 'grid',
});
function hintsState(overrides: Partial<PuzzleState> = {}): PuzzleState {
  const stored = serializePuzzle(hintsPuzzle);
  return deepFreeze({ ...stored, hints: { ...stored.hints, '1-across': 'First' }, title: 'Hinted', resetEpoch: 0, published: false, ...overrides });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function letterAt(state: { grid: PuzzleState['grid'] }, col: number, row: number) {
  const cell = state.grid.cells[row][col];
  return cell.kind === 'active' ? cell.letter : 'black';
}

describe('24-S1-2 a cells burst writes only its own cells', () => {
  it('applies every write, keeps the other cells and the locked words, and records the replaced values', () => {
    const state = build();
    const result = evaluateOperation(state, cells({ col: 4, row: 1, value: 'M' }, { col: 4, row: 4, value: 'STAR' }, { col: 4, row: 3, value: null }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(letterAt(result.content, 4, 1)).toBe('M');
    expect(letterAt(result.content, 4, 4)).toBe('STAR');
    expect(letterAt(result.content, 4, 3)).toBeNull();
    expect(letterAt(result.content, 4, 2)).toBe('O');
    expect(letterAt(result.content, 0, 0)).toBe('C');
    expect(result.content.grid.lockedWords).toEqual([CAT]);
    expect(result.content.grid.cols).toBe(5);
    expect(result.content.hints).toEqual({});
    expect(result.content.title).toBe('Original');
    expect(result.previous).toEqual({ kind: 'cells', cells: [
      { col: 4, row: 1, value: 'D' }, { col: 4, row: 4, value: null }, { col: 4, row: 3, value: 'G' },
    ] });
  });

  it('is idempotent and leaves its input unchanged (the state is frozen)', () => {
    const op = cells({ col: 3, row: 3, value: 'X' });
    const once = applyOperation(build(), op).content;
    const twice = applyOperation(once, op).content;
    expect(twice).toEqual(once);
    expect(letterAt(build(), 3, 3)).toBeNull();
  });
});

describe('24-S1-3 a burst into a locked word is rejected whole (D3)', () => {
  it.each([
    ['changes a locked letter', [{ col: 1, row: 0, value: 'U' }]],
    ['clears a locked letter', [{ col: 2, row: 0, value: null }]],
    ['writes the end cell', [{ col: 3, row: 0, value: 'S' }]],
    ['writes free cells and one locked letter', [{ col: 0, row: 4, value: 'Z' }, { col: 4, row: 4, value: 'Y' }, { col: 0, row: 0, value: 'B' }]],
  ])('refuses a burst that %s, writing nothing', (_name, writes) => {
    const state = build();
    expect(validateOperation(state, cells(...writes))).toBe('locked');
    expect(evaluateOperation(state, cells(...writes))).toEqual({ ok: false, code: 'locked' });
  });

  it('accepts a burst that writes a locked letter with the value it already holds', () => {
    const result = evaluateOperation(build(), cells({ col: 0, row: 0, value: 'C' }, { col: 0, row: 4, value: 'Z' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(letterAt(result.content, 0, 4)).toBe('Z');
  });

  it('accepts writes around a puzzle with no locks', () => {
    expect(validateOperation(build({ grid: serializeGrid(buildGrid) }), cells({ col: 1, row: 0, value: 'U' }))).toBeNull();
  });
});

describe('24-S1-4 the Hints phase', () => {
  it('accepts a changed letter or rebus on an active cell', () => {
    const result = evaluateOperation(hintsState(), cells({ col: 1, row: 1, value: 'C' }, { col: 0, row: 0, value: 'ONE' }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(letterAt(result.content, 1, 1)).toBe('C');
    expect(letterAt(result.content, 0, 0)).toBe('ONE');
    expect(result.content.phase).toBe('hints');
  });

  it('refuses a burst that clears a cell or writes a black one, whole', () => {
    expect(validateOperation(hintsState(), cells({ col: 1, row: 1, value: null }))).toBe('phase');
    expect(validateOperation(hintsState(), cells({ col: 2, row: 2, value: 'A' }))).toBe('phase');
    expect(evaluateOperation(hintsState(), cells({ col: 1, row: 1, value: 'C' }, { col: 0, row: 0, value: null })))
      .toEqual({ ok: false, code: 'phase' });
  });

  it('writes a hint the grid numbers, recording its previous text', () => {
    const state = hintsState();
    const replaced = evaluateOperation(state, hint('1-across', 'New clue'));
    expect(replaced).toMatchObject({ ok: true, previous: { kind: 'hint', text: 'First' } });
    if (replaced.ok) {
      expect(replaced.content.hints['1-across']).toBe('New clue');
      expect(replaced.content.hints['1-down']).toBe('');
      expect(replaced.content.grid).toEqual(state.grid);
    }
    const blank = evaluateOperation(state, hint('2-down', '  '));
    expect(blank).toMatchObject({ ok: true, previous: { kind: 'hint', text: '' } });
    if (blank.ok) expect(blank.content.hints['2-down']).toBe('  ');
  });

  it('refuses a hint key the grid does not number', () => {
    expect(validateOperation(hintsState(), hint('9-across', 'Nowhere'))).toBe('invalid');
    expect(validateOperation(hintsState(), hint('2-across', 'Not a word start'))).toBe('invalid');
  });

  it('refuses a hint in Build, where clues are not edited', () => {
    expect(validateOperation(build(), hint('1-across', 'Too early'))).toBe('phase');
  });

  it('records a missing hint as null', () => {
    const state = hintsState({ hints: {} });
    expect(evaluateOperation(state, hint('1-down', 'X'))).toMatchObject({ ok: true, previous: { kind: 'hint', text: null } });
  });
});

describe('24-S1-5 publication and the epoch', () => {
  it.each([
    ['cells', cells({ col: 4, row: 4, value: 'A' })],
    ['hint', hint('1-across', 'Late')],
    ['title', title('Late')],
  ])('refuses %s once published', (_kind, op) => {
    expect(validateOperation(build({ published: true }), op)).toBe('published');
    expect(validateOperation(hintsState({ published: true }), op)).toBe('published');
  });

  it('refuses an operation from another epoch, even into untouched cells', () => {
    const state = build({ resetEpoch: 2 });
    expect(validateOperation(state, { ...cells({ col: 4, row: 4, value: 'A' }), epoch: 1 })).toBe('epoch');
    expect(validateOperation(state, { ...cells({ col: 4, row: 4, value: 'A' }), epoch: 3 })).toBe('epoch');
    expect(validateOperation(state, { ...title('X'), epoch: 0 })).toBe('epoch');
    expect(validateOperation(state, { ...cells({ col: 4, row: 4, value: 'A' }), epoch: 2 })).toBeNull();
  });

  it('never refuses for the version an operation was made against', () => {
    for (const baseVersion of [0, 1, 99, 100000]) {
      expect(validateOperation(build(), { ...cells({ col: 4, row: 4, value: 'A' }), baseVersion })).toBeNull();
    }
  });
});

describe('24-S1-6 cells outside the puzzle, and the title', () => {
  it('refuses a cell outside the grid', () => {
    expect(validateOperation(build(), cells({ col: 5, row: 0, value: 'A' }))).toBe('invalid');
    expect(validateOperation(build(), cells({ col: 0, row: 5, value: 'A' }))).toBe('invalid');
  });

  it('refuses a black cell in Build (a legacy grid)', () => {
    const grid = serializeGrid(createGrid({ cols: 3, rows: 3, black: [{ col: 1, row: 1 }] }));
    expect(validateOperation(build({ grid }), cells({ col: 1, row: 1, value: 'A' }))).toBe('invalid');
  });

  it('normalizes the title as saving it does, in either phase, recording the old one', () => {
    expect(evaluateOperation(build(), title('  New name  '))).toMatchObject({
      ok: true, content: { title: 'New name' }, previous: { kind: 'title', title: 'Original' },
    });
    expect(evaluateOperation(hintsState(), title('   '))).toMatchObject({
      ok: true, content: { title: 'Untitled Puzzle' }, previous: { kind: 'title', title: 'Hinted' },
    });
  });
});
