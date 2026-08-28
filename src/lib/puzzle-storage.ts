import { createGrid, withLetter } from '../engine/grid';
import type { Cell, Grid } from '../engine/grid';
import type { Puzzle, Phase } from '../engine/puzzle';

export type SerializedCell =
  | { kind: 'black' }
  | { kind: 'active'; letter: string | null };

export interface SerializedGrid {
  cols: number;
  rows: number;
  cells: SerializedCell[][]; // cells[row][col]
}

export function serializeGrid(grid: Grid): SerializedGrid {
  const cells: SerializedCell[][] = Array.from({ length: grid.rows }, (_, row) =>
    Array.from({ length: grid.cols }, (_, col) => {
      const cell = grid.at(col, row) as Cell;
      return cell.kind === 'black' ? { kind: 'black' as const } : cell;
    })
  );
  return { cols: grid.cols, rows: grid.rows, cells };
}

export function deserializeGrid(data: SerializedGrid): Grid {
  const black = [];
  const letters: { col: number; row: number; letter: string }[] = [];
  for (let row = 0; row < data.rows; row++) {
    for (let col = 0; col < data.cols; col++) {
      const cell = data.cells[row][col];
      if (cell.kind === 'black') {
        black.push({ col, row });
      } else if (cell.letter !== null) {
        letters.push({ col, row, letter: cell.letter });
      }
    }
  }

  let grid = createGrid({ cols: data.cols, rows: data.rows, black });
  for (const { col, row, letter } of letters) {
    grid = withLetter(grid, { col, row }, letter);
  }
  return grid;
}

export interface StoredPuzzle {
  grid: SerializedGrid;
  hints: Record<string, string>;
  phase: Phase;
}

export function serializePuzzle(puzzle: Puzzle): StoredPuzzle {
  return {
    grid: serializeGrid(puzzle.grid),
    hints: { ...puzzle.hints },
    phase: puzzle.phase,
  };
}

export function deserializePuzzle(stored: StoredPuzzle): Puzzle {
  return {
    grid: deserializeGrid(stored.grid),
    hints: { ...stored.hints },
    phase: stored.phase,
  };
}

/** A fresh 15x15, fully active, unauthored puzzle in the 'grid' phase. */
export function createBlankPuzzle(): Puzzle {
  return {
    grid: createGrid({ cols: 15, rows: 15 }),
    hints: {},
    phase: 'grid',
  };
}
