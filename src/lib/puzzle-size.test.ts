import { describe, it, expect } from 'vitest';
import { dimensionsFor, DEFAULT_SIZE } from './puzzle-size';
import type { PuzzleSize } from './puzzle-size';
import { createBlankPuzzle } from './puzzle-storage';

const EXPECTED: Record<PuzzleSize, { cols: number; rows: number }> = {
  mini: { cols: 5, rows: 5 },
  daily: { cols: 15, rows: 15 },
  sunday: { cols: 21, rows: 21 },
};

// --- D6-1: puzzle-size ---
describe('D6-1 puzzle-size', () => {
  it('maps each size to its dimensions', () => {
    expect(dimensionsFor('mini')).toEqual(EXPECTED.mini);
    expect(dimensionsFor('daily')).toEqual(EXPECTED.daily);
    expect(dimensionsFor('sunday')).toEqual(EXPECTED.sunday);
  });

  it('defaults to daily', () => {
    expect(DEFAULT_SIZE).toBe('daily');
  });

  it('purity: two calls return equal results', () => {
    expect(dimensionsFor('sunday')).toEqual(dimensionsFor('sunday'));
  });
});

// --- D6-2: createBlankPuzzle with a size ---
describe('D6-2 createBlankPuzzle', () => {
  it('with no argument still returns Story P1 behaviour: a blank 15x15', () => {
    const puzzle = createBlankPuzzle();

    expect(puzzle.grid.cols).toBe(15);
    expect(puzzle.grid.rows).toBe(15);
    expect(puzzle.hints).toEqual({});
    expect(puzzle.phase).toBe('grid');
  });

  it('builds a grid of the requested size', () => {
    for (const size of ['mini', 'daily', 'sunday'] as PuzzleSize[]) {
      const puzzle = createBlankPuzzle(size);
      expect(puzzle.grid.cols, size).toBe(EXPECTED[size].cols);
      expect(puzzle.grid.rows, size).toBe(EXPECTED[size].rows);
    }
  });

  it('every cell is active and empty, at every size', () => {
    for (const size of ['mini', 'daily', 'sunday'] as PuzzleSize[]) {
      const { grid } = createBlankPuzzle(size);
      for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
          expect(grid.at(col, row), `${size} (${col},${row})`).toEqual({
            kind: 'active',
            letter: null,
          });
        }
      }
    }
  });

  it('hints and phase are the same regardless of size', () => {
    for (const size of ['mini', 'daily', 'sunday'] as PuzzleSize[]) {
      const puzzle = createBlankPuzzle(size);
      expect(puzzle.hints).toEqual({});
      expect(puzzle.phase).toBe('grid');
    }
  });
});
