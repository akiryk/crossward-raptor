import { describe, it, expect } from 'vitest';
import type { Puzzle } from './puzzle';
import type { Grid } from './grid';
import { createGrid, withLetter } from './grid';
import { applyGeometryEdit, enterHintsPhase, applyLetterEdit } from './phase';

function puzzle(overrides: Partial<Puzzle> = {}): Puzzle {
  return {
    grid: createGrid({ cols: 5, rows: 1 }),
    hints: {},
    phase: 'grid',
    ...overrides,
  };
}

function allCells(cols: number, rows: number) {
  const coords: { col: number; row: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      coords.push({ col, row });
    }
  }
  return coords;
}

/**
 * 3x3 with letters forming an across run and a down run that share (0,0):
 *
 *   C A T
 *   A . .
 *   T . .
 *
 * The four cells marked . are active-but-empty, so entering hints phase
 * blackens exactly those, leaving one 3-cell across slot and one 3-cell
 * down slot -- required hints 1-across and 1-down.
 */
function letteredGrid(): Grid {
  let grid = createGrid({ cols: 3, rows: 3 });
  grid = withLetter(grid, { col: 0, row: 0 }, 'C');
  grid = withLetter(grid, { col: 1, row: 0 }, 'A');
  grid = withLetter(grid, { col: 2, row: 0 }, 'T');
  grid = withLetter(grid, { col: 0, row: 1 }, 'A');
  grid = withLetter(grid, { col: 0, row: 2 }, 'T');
  return grid;
}

const EMPTY_COORDS = [
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 1, row: 2 },
  { col: 2, row: 2 },
];

const LETTERED_COORDS = [
  { col: 0, row: 0, letter: 'C' },
  { col: 1, row: 0, letter: 'A' },
  { col: 2, row: 0, letter: 'T' },
  { col: 0, row: 1, letter: 'A' },
  { col: 0, row: 2, letter: 'T' },
];

function gridsEqual(a: Grid, b: Grid): boolean {
  if (a.cols !== b.cols || a.rows !== b.rows) return false;
  for (let row = 0; row < a.rows; row++) {
    for (let col = 0; col < a.cols; col++) {
      if (JSON.stringify(a.at(col, row)) !== JSON.stringify(b.at(col, row))) {
        return false;
      }
    }
  }
  return true;
}

// --- E1: applyGeometryEdit phase gating ---
describe('E1 applyGeometryEdit', () => {
  it("'grid' phase: blackening a cell also blackens its symmetric counterpart", () => {
    const p = puzzle({ grid: createGrid({ cols: 5, rows: 1 }), phase: 'grid' });
    const result = applyGeometryEdit(p, { col: 4, row: 0 }, true);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.puzzle.grid.at(4, 0)).toEqual({ kind: 'black' });
    expect(result.puzzle.grid.at(0, 0)).toEqual({ kind: 'black' }); // mirror on 5x1
  });

  it("'hints' phase: the same edit is rejected, puzzle returned unchanged", () => {
    const p = puzzle({ grid: createGrid({ cols: 5, rows: 1 }), phase: 'hints' });
    const result = applyGeometryEdit(p, { col: 4, row: 0 }, true);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected rejection');
    expect(result.error.length).toBeGreaterThan(0);
    expect(result.puzzle).toBe(p);
  });

  it("'grid' phase: requesting a state the cell already has is a no-op returning the same puzzle", () => {
    const grid = createGrid({
      cols: 5,
      rows: 1,
      black: [
        { col: 4, row: 0 },
        { col: 0, row: 0 },
      ],
    });
    const p = puzzle({ grid, phase: 'grid' });
    const result = applyGeometryEdit(p, { col: 4, row: 0 }, true);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.puzzle).toBe(p);
  });

  it("'hints' phase: a would-be no-op is still rejected", () => {
    const grid = createGrid({
      cols: 5,
      rows: 1,
      black: [
        { col: 4, row: 0 },
        { col: 0, row: 0 },
      ],
    });
    const p = puzzle({ grid, phase: 'hints' });
    const result = applyGeometryEdit(p, { col: 4, row: 0 }, true);

    expect(result.ok).toBe(false);
    expect(result.puzzle).toBe(p);
  });
});

// --- E2: enterHintsPhase (rewritten for the PB1a conversion) ---
describe('E2 enterHintsPhase', () => {
  it('blackens every active cell holding no letter', () => {
    const p = puzzle({ grid: letteredGrid(), hints: {}, phase: 'grid' });
    const next = enterHintsPhase(p);

    for (const coord of EMPTY_COORDS) {
      expect(next.grid.at(coord.col, coord.row)).toEqual({ kind: 'black' });
    }
  });

  it('leaves lettered cells untouched', () => {
    const p = puzzle({ grid: letteredGrid(), hints: {}, phase: 'grid' });
    const next = enterHintsPhase(p);

    for (const { col, row, letter } of LETTERED_COORDS) {
      expect(next.grid.at(col, row)).toEqual({ kind: 'active', letter });
    }
  });

  it('sets the phase to hints', () => {
    const p = puzzle({ grid: letteredGrid(), hints: {}, phase: 'grid' });
    expect(enterHintsPhase(p).phase).toBe('hints');
  });

  it('derives hints from the converted geometry, not the original', () => {
    const p = puzzle({ grid: letteredGrid(), hints: {}, phase: 'grid' });
    const next = enterHintsPhase(p);

    // after conversion only one across run and one down run remain, both
    // starting at (0,0) -- so exactly two required hints, sharing number 1
    expect(next.hints).toEqual({ '1-across': '', '1-down': '' });
  });

  it('preserves authored text for a still-required hint', () => {
    const p = puzzle({
      grid: letteredGrid(),
      hints: { '1-across': 'Existing clue' },
      phase: 'grid',
    });
    const next = enterHintsPhase(p);

    expect(next.hints['1-across']).toBe('Existing clue');
    expect(next.hints['1-down']).toBe('');
    expect(Object.keys(next.hints)).toHaveLength(2);
  });

  it('leaves extra keys matching no required hint untouched', () => {
    const p = puzzle({
      grid: letteredGrid(),
      hints: { '99-across': 'stale' },
      phase: 'grid',
    });
    const next = enterHintsPhase(p);

    expect(next.hints['99-across']).toBe('stale');
  });

  it('returns a cell-for-cell identical grid when no active cell is empty', () => {
    let grid = createGrid({ cols: 3, rows: 1 });
    grid = withLetter(grid, { col: 0, row: 0 }, 'C');
    grid = withLetter(grid, { col: 1, row: 0 }, 'A');
    grid = withLetter(grid, { col: 2, row: 0 }, 'T');

    const p = puzzle({ grid, hints: {}, phase: 'grid' });
    const next = enterHintsPhase(p);

    expect(gridsEqual(next.grid, grid)).toBe(true);
  });

  it('fully black grid: phase changes, grid and hints unchanged', () => {
    const grid = createGrid({ cols: 3, rows: 3, black: allCells(3, 3) });
    const p = puzzle({ grid, hints: {}, phase: 'grid' });
    const next = enterHintsPhase(p);

    expect(next.phase).toBe('hints');
    expect(gridsEqual(next.grid, grid)).toBe(true);
    expect(next.hints).toEqual({});
  });

  it('does not mutate the input puzzle', () => {
    const grid = letteredGrid();
    const p = puzzle({ grid, hints: {}, phase: 'grid' });
    enterHintsPhase(p);

    expect(p.phase).toBe('grid');
    expect(p.hints).toEqual({});
    for (const coord of EMPTY_COORDS) {
      expect(grid.at(coord.col, coord.row)).toEqual({ kind: 'active', letter: null });
    }
  });
});

// --- E3: applyLetterEdit ---
describe('E3 applyLetterEdit', () => {
  it("'grid' phase: writes a letter into an active cell", () => {
    const p = puzzle({ grid: createGrid({ cols: 5, rows: 1 }), phase: 'grid' });
    const next = applyLetterEdit(p, { col: 0, row: 0 }, 'A');

    expect(next.grid.at(0, 0)).toEqual({ kind: 'active', letter: 'A' });
  });

  it("'hints' phase: also accepted -- no phase check on letter edits", () => {
    let grid = createGrid({ cols: 5, rows: 1 });
    grid = withLetter(grid, { col: 0, row: 0 }, 'L');
    grid = withLetter(grid, { col: 1, row: 0 }, 'I');
    grid = withLetter(grid, { col: 2, row: 0 }, 'A');
    grid = withLetter(grid, { col: 3, row: 0 }, 'N');
    grid = withLetter(grid, { col: 4, row: 0 }, 'S');

    const p = puzzle({ grid, phase: 'hints' });
    const next = applyLetterEdit(p, { col: 1, row: 0 }, 'Y');

    expect(next.grid.at(1, 0)).toEqual({ kind: 'active', letter: 'Y' });
    expect(next.grid.at(0, 0)).toEqual({ kind: 'active', letter: 'L' });
    expect(next.grid.at(4, 0)).toEqual({ kind: 'active', letter: 'S' });
    expect(next.phase).toBe('hints');
  });

  it('writing to a black cell throws, in either phase', () => {
    const grid = createGrid({ cols: 5, rows: 1, black: [{ col: 2, row: 0 }] });
    const gridPhase = puzzle({ grid, phase: 'grid' });
    const hintsPhase = puzzle({ grid, phase: 'hints' });

    expect(() => applyLetterEdit(gridPhase, { col: 2, row: 0 }, 'A')).toThrow();
    expect(() => applyLetterEdit(hintsPhase, { col: 2, row: 0 }, 'A')).toThrow();
  });

  it('writing off the grid throws', () => {
    const p = puzzle({ grid: createGrid({ cols: 5, rows: 1 }), phase: 'grid' });
    expect(() => applyLetterEdit(p, { col: 5, row: 0 }, 'A')).toThrow();
  });

  it('does not mutate the input puzzle', () => {
    const p = puzzle({ grid: createGrid({ cols: 5, rows: 1 }), phase: 'grid' });
    applyLetterEdit(p, { col: 0, row: 0 }, 'A');

    expect(p.grid.at(0, 0)).toEqual({ kind: 'active', letter: null });
  });
});

// --- E4: purity ---
describe('E4 purity', () => {
  it('applyGeometryEdit: rejected result returns the exact input puzzle reference', () => {
    const p = puzzle({ grid: createGrid({ cols: 5, rows: 1 }), phase: 'hints' });
    const result = applyGeometryEdit(p, { col: 0, row: 0 }, true);

    if (result.ok) throw new Error('expected rejection');
    expect(result.puzzle).toBe(p);
  });

  it('applyGeometryEdit: no-op result returns the exact input puzzle reference', () => {
    const p = puzzle({ grid: createGrid({ cols: 5, rows: 1 }), phase: 'grid' });
    const result = applyGeometryEdit(p, { col: 0, row: 0 }, false); // already active

    if (!result.ok) throw new Error('expected ok');
    expect(result.puzzle).toBe(p);
  });

  it('enterHintsPhase: two calls produce equal grids and equal hints', () => {
    const p = puzzle({ grid: letteredGrid(), hints: {}, phase: 'grid' });
    const a = enterHintsPhase(p);
    const b = enterHintsPhase(p);

    // compared cell-by-cell rather than with toEqual on the whole puzzle:
    // the grid is now rebuilt per call, so its `at` closures are distinct
    // objects and a whole-object comparison would fail on identity alone.
    expect(gridsEqual(a.grid, b.grid)).toBe(true);
    expect(a.hints).toEqual(b.hints);
    expect(a.phase).toBe(b.phase);
  });
});
