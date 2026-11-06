import type { Coord, Grid } from '../engine/grid';
import { deleteAt, place, type CursorState } from '../engine/cursor';
import { endCells, isCellLocked, type LockedWord } from './locked-words';

// Locked cells hold (21-S3): typing and Backspace leave a locked word's
// letters and end cells as they are, around the engine's place/deleteAt.

/** A letter or end cell of any locked word. */
export function isCellProtected(grid: Grid, lockedWords: readonly LockedWord[], coord: Coord): boolean {
  return (
    isCellLocked(lockedWords, coord) ||
    lockedWords.some((word) => endCells(grid, word).some(({ col, row }) => col === coord.col && row === coord.row))
  );
}

/** One cell back in the cursor's direction if that cell is there, as deleteAt moves. */
function stepBack(grid: Grid, cursor: CursorState): CursorState {
  const { col, row } = cursor.current;
  const back = cursor.orientation === 'across' ? { col: col - 1, row } : { col, row: row - 1 };
  return grid.at(back.col, back.row).kind === 'active' ? { current: back, orientation: cursor.orientation } : cursor;
}

/** `place`, except a protected cell keeps its letter; the cursor moves on either way. */
export function placeProtected(
  grid: Grid,
  lockedWords: readonly LockedWord[],
  cursor: CursorState,
  letter: string
): { grid: Grid; cursor: CursorState } {
  const placed = place(grid, cursor, letter);
  return isCellProtected(grid, lockedWords, cursor.current) ? { grid, cursor: placed.cursor } : placed;
}

/** `deleteAt`, except a protected cell is never cleared: on one the cursor
 *  moves back, and moving back onto one it lands there. */
export function deleteProtected(
  grid: Grid,
  lockedWords: readonly LockedWord[],
  cursor: CursorState
): { grid: Grid; cursor: CursorState } {
  if (isCellProtected(grid, lockedWords, cursor.current)) return { grid, cursor: stepBack(grid, cursor) };
  const cell = grid.at(cursor.current.col, cursor.current.row);
  const isEmpty = cell.kind === 'active' && cell.letter === null;
  const back = stepBack(grid, cursor);
  if (isEmpty && back !== cursor && isCellProtected(grid, lockedWords, back.current)) return { grid, cursor: back };
  return deleteAt(grid, cursor);
}
