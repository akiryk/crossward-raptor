import type { Coord, Grid } from './grid';
import { createGrid, withLetter } from './grid';

export function symmetricCounterpart(grid: Grid, coord: Coord): Coord {
  return { col: grid.cols - 1 - coord.col, row: grid.rows - 1 - coord.row };
}

export function isSymmetric(grid: Grid): boolean {
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const counterpart = symmetricCounterpart(grid, { col, row });
      const isBlack = grid.at(col, row).kind === 'black';
      const counterpartIsBlack = grid.at(counterpart.col, counterpart.row).kind === 'black';
      if (isBlack !== counterpartIsBlack) return false;
    }
  }
  return true;
}

export function toggleBlackSymmetric(grid: Grid, coord: Coord): Grid {
  const counterpart = symmetricCounterpart(grid, coord);
  const nextBlack: Coord[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const wasBlack = grid.at(col, row).kind === 'black';
      const isTarget = col === coord.col && row === coord.row;
      const isCounterpart = col === counterpart.col && row === counterpart.row;
      const newState = isTarget || isCounterpart ? !isBlackAt(grid, coord) : wasBlack;
      if (newState) nextBlack.push({ col, row });
    }
  }

  let next = createGrid({ cols: grid.cols, rows: grid.rows, black: nextBlack });

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const isTarget = col === coord.col && row === coord.row;
      const isCounterpart = col === counterpart.col && row === counterpart.row;
      if (isTarget || isCounterpart) continue;

      const cell = grid.at(col, row);
      if (cell.kind === 'active' && cell.letter !== null) {
        next = withLetter(next, { col, row }, cell.letter);
      }
    }
  }

  return next;
}

function isBlackAt(grid: Grid, coord: Coord): boolean {
  return grid.at(coord.col, coord.row).kind === 'black';
}
