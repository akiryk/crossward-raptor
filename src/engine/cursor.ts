import type { Coord, Grid, Orientation } from './grid';
import { withLetter } from './grid';

export interface CursorState {
  readonly current: Coord;
  readonly orientation: Orientation;
}

export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

function isActive(grid: Grid, coord: Coord): boolean {
  return grid.at(coord.col, coord.row).kind === 'active';
}

function step(coord: Coord, orientation: Orientation, forward: boolean): Coord {
  const delta = forward ? 1 : -1;
  return orientation === 'across'
    ? { col: coord.col + delta, row: coord.row }
    : { col: coord.col, row: coord.row + delta };
}

export function place(
  grid: Grid,
  cursor: CursorState,
  letter: string
): { grid: Grid; cursor: CursorState } {
  const nextGrid = withLetter(grid, cursor.current, letter);
  const advanced = step(cursor.current, cursor.orientation, true);
  const cursorNext: CursorState = isActive(nextGrid, advanced)
    ? { current: advanced, orientation: cursor.orientation }
    : cursor;

  return { grid: nextGrid, cursor: cursorNext };
}

export function arrowKey(grid: Grid, cursor: CursorState, direction: ArrowDirection): CursorState {
  const orientation: Orientation =
    direction === 'left' || direction === 'right' ? 'across' : 'down';
  const forward = direction === 'right' || direction === 'down';
  const moved = step(cursor.current, orientation, forward);

  return {
    current: isActive(grid, moved) ? moved : cursor.current,
    orientation,
  };
}

export function deleteAt(grid: Grid, cursor: CursorState): { grid: Grid; cursor: CursorState } {
  const cell = grid.at(cursor.current.col, cursor.current.row);

  if (cell.kind === 'active' && cell.letter !== null) {
    return { grid: withLetter(grid, cursor.current, null), cursor };
  }

  const retreated = step(cursor.current, cursor.orientation, false);
  if (isActive(grid, retreated)) {
    return {
      grid: withLetter(grid, retreated, null),
      cursor: { current: retreated, orientation: cursor.orientation },
    };
  }

  return { grid, cursor };
}

export function moveTo(grid: Grid, cursor: CursorState, coord: Coord): CursorState {
  return isActive(grid, coord) ? { current: coord, orientation: cursor.orientation } : cursor;
}
