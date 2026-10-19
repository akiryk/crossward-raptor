import type { Grid } from './grid';

/** Fullness concerns active cells, including cells outside any word slot. */
export function isFull(grid: Grid): boolean {
  let hasActiveCell = false;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row);
      if (cell.kind !== 'active') continue;
      hasActiveCell = true;
      if (typeof cell.letter !== 'string' || cell.letter.length === 0) return false;
    }
  }
  return hasActiveCell;
}

/** Answers and rebus strings are opaque: no normalization or partial matches. */
export function isSolved(solution: Grid, entries: Grid): boolean {
  if (solution.cols !== entries.cols || solution.rows !== entries.rows || !isFull(entries)) return false;
  for (let row = 0; row < solution.rows; row++) {
    for (let col = 0; col < solution.cols; col++) {
      const answer = solution.at(col, row);
      const entry = entries.at(col, row);
      if (answer.kind !== entry.kind) return false;
      if (answer.kind === 'active' && (entry.kind !== 'active' || answer.letter !== entry.letter)) return false;
    }
  }
  return true;
}
