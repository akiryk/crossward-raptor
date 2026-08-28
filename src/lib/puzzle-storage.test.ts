import { describe, it, expect } from 'vitest';
import { createGrid, withLetter } from '../engine/grid';
import type { Grid } from '../engine/grid';
import {
  serializeGrid,
  deserializeGrid,
  serializePuzzle,
  deserializePuzzle,
  createBlankPuzzle,
} from './puzzle-storage';

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

// --- P1-1: grid serialization ---
describe('P1-1 grid serialization', () => {
  it('round-trips a fully active grid', () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const round = deserializeGrid(serializeGrid(grid));
    expect(gridsEqual(grid, round)).toBe(true);
  });

  it('round-trips a grid with black cells', () => {
    const grid = createGrid({
      cols: 5,
      rows: 5,
      black: [{ col: 0, row: 0 }, { col: 4, row: 4 }],
    });
    const round = deserializeGrid(serializeGrid(grid));
    expect(gridsEqual(grid, round)).toBe(true);
  });

  it('round-trips a grid with letters', () => {
    let grid = createGrid({ cols: 5, rows: 1 });
    grid = withLetter(grid, { col: 0, row: 0 }, 'C');
    grid = withLetter(grid, { col: 1, row: 0 }, 'A');
    grid = withLetter(grid, { col: 2, row: 0 }, 'T');

    const round = deserializeGrid(serializeGrid(grid));
    expect(gridsEqual(grid, round)).toBe(true);
  });

  it('round-trips a grid with both black cells and letters', () => {
    let grid = createGrid({ cols: 5, rows: 1, black: [{ col: 3, row: 0 }] });
    grid = withLetter(grid, { col: 0, row: 0 }, 'C');
    grid = withLetter(grid, { col: 4, row: 0 }, 'Z');

    const round = deserializeGrid(serializeGrid(grid));
    expect(gridsEqual(grid, round)).toBe(true);
  });

  it('size is not assumed: round-trips a non-square, non-15x15 grid', () => {
    const grid = createGrid({ cols: 3, rows: 9 });
    const round = deserializeGrid(serializeGrid(grid));
    expect(gridsEqual(grid, round)).toBe(true);
  });
});

// --- P1-1: puzzle serialization ---
describe('P1-1 puzzle serialization', () => {
  it('round-trips hints and phase exactly', () => {
    const puzzle = {
      grid: createGrid({ cols: 3, rows: 3 }),
      hints: { '1-across': 'A clue', '1-down': '' },
      phase: 'hints' as const,
    };

    const round = deserializePuzzle(serializePuzzle(puzzle));

    expect(round.hints).toEqual(puzzle.hints);
    expect(round.phase).toBe('hints');
    expect(gridsEqual(round.grid, puzzle.grid)).toBe(true);
  });
});

// --- P1-1: createBlankPuzzle ---
describe('P1-1 createBlankPuzzle', () => {
  it('returns a 15x15 fully active grid, no letters, empty hints, grid phase', () => {
    const puzzle = createBlankPuzzle();

    expect(puzzle.grid.cols).toBe(15);
    expect(puzzle.grid.rows).toBe(15);
    expect(puzzle.hints).toEqual({});
    expect(puzzle.phase).toBe('grid');

    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        expect(puzzle.grid.at(col, row)).toEqual({ kind: 'active', letter: null });
      }
    }
  });

  it('two calls are deep-equal (purity, no shared mutable default)', () => {
    const a = createBlankPuzzle();
    const b = createBlankPuzzle();

    expect(gridsEqual(a.grid, b.grid)).toBe(true);
    expect(a.hints).toEqual(b.hints);
    expect(a.phase).toBe(b.phase);
  });
});
