import { describe, it, expect } from 'vitest';
import type { Puzzle } from './puzzle';
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
      black: [{ col: 4, row: 0 }, { col: 0, row: 0 }],
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
      black: [{ col: 4, row: 0 }, { col: 0, row: 0 }],
    });
    const p = puzzle({ grid, phase: 'hints' });
    const result = applyGeometryEdit(p, { col: 4, row: 0 }, true);

    expect(result.ok).toBe(false);
    expect(result.puzzle).toBe(p);
  });
});

// --- E2: enterHintsPhase ---
describe('E2 enterHintsPhase', () => {
  it('fully active 3x3 grid gets exactly the 6 derived hint keys, blank', () => {
    const p = puzzle({ grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' });
    const next = enterHintsPhase(p);

    expect(next.phase).toBe('hints');
    expect(next.hints).toEqual({
      '1-across': '',
      '1-down': '',
      '2-down': '',
      '3-down': '',
      '4-across': '',
      '5-across': '',
    });
  });

  it('existing authored text is preserved; only missing keys are filled', () => {
    const p = puzzle({
      grid: createGrid({ cols: 3, rows: 3 }),
      hints: { '1-across': 'Existing clue' },
      phase: 'grid',
    });
    const next = enterHintsPhase(p);

    expect(next.hints['1-across']).toBe('Existing clue');
    expect(next.hints['1-down']).toBe('');
    expect(Object.keys(next.hints)).toHaveLength(6);
  });

  it('extra keys matching no slot are left untouched', () => {
    const p = puzzle({
      grid: createGrid({ cols: 3, rows: 3 }),
      hints: { '99-across': 'stale' },
      phase: 'grid',
    });
    const next = enterHintsPhase(p);

    expect(next.hints['99-across']).toBe('stale');
  });

  it('fully black grid: phase changes, hints unchanged (no required hints)', () => {
    const p = puzzle({
      grid: createGrid({ cols: 3, rows: 3, black: allCells(3, 3) }),
      hints: {},
      phase: 'grid',
    });
    const next = enterHintsPhase(p);

    expect(next.phase).toBe('hints');
    expect(next.hints).toEqual({});
  });

  it('does not mutate the input puzzle', () => {
    const p = puzzle({ grid: createGrid({ cols: 3, rows: 3 }), hints: {}, phase: 'grid' });
    enterHintsPhase(p);

    expect(p.phase).toBe('grid');
    expect(p.hints).toEqual({});
  });

  it('geometry is untouched: extractSlots before and after are unaffected by this call', () => {
    const grid = createGrid({ cols: 3, rows: 3 });
    const p = puzzle({ grid, hints: {}, phase: 'grid' });
    const next = enterHintsPhase(p);

    // same grid reference -- geometry wasn't rebuilt at all
    expect(next.grid).toBe(grid);
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

  it('two calls with the same inputs produce deep-equal results', () => {
    const p = puzzle({ grid: createGrid({ cols: 3, rows: 3 }), phase: 'grid' });
    const a = enterHintsPhase(p);
    const b = enterHintsPhase(p);
    expect(a).toEqual(b);
  });
});
