import { arrowKey, moveTo, toggleOrientation, type ArrowDirection, type CursorState } from '../engine/cursor';
import type { Coord, Grid, Orientation } from '../engine/grid';

// Only real words (17-S6): in the hints phase and play the cursor's
// direction is one with a word through its cell. These wrap the engine's
// cursor functions; typing, Backspace and same-axis arrows already stay
// within words.

/** Whether a word (extractSlots' run of two or more white cells) runs
 *  through `coord` in `orientation`: a white neighbour on that axis. */
export function hasWord(grid: Grid, coord: Coord, orientation: Orientation): boolean {
  const [dc, dr] = orientation === 'across' ? [1, 0] : [0, 1];
  return (
    grid.at(coord.col - dc, coord.row - dr).kind === 'active' ||
    grid.at(coord.col + dc, coord.row + dr).kind === 'active'
  );
}

const other = (orientation: Orientation): Orientation => (orientation === 'across' ? 'down' : 'across');

/** A starting cursor on `coord`: Across, or Down where it has no Across
 *  word (17-S2's opening rule). */
export function wordStart(grid: Grid, coord: Coord): CursorState {
  return { current: coord, orientation: hasWord(grid, coord, 'across') ? 'across' : 'down' };
}

/** `coord` in `orientation` if a word runs that way, else the other way if
 *  one does; a cell with no word either way keeps `orientation`. */
function onWord(grid: Grid, coord: Coord, orientation: Orientation): CursorState {
  const keep = hasWord(grid, coord, orientation) || !hasWord(grid, coord, other(orientation));
  return { current: coord, orientation: keep ? orientation : other(orientation) };
}

/** A direction change only where a word runs the new way. */
function turned(grid: Grid, before: CursorState, after: CursorState): CursorState {
  return hasWord(grid, after.current, after.orientation) ? after : before;
}

/** A click: on another cell, takes a word's direction; on the cursor cell,
 *  turns only onto a word. */
export function wordMoveTo(grid: Grid, cursor: CursorState, coord: Coord): CursorState {
  const moved = moveTo(grid, cursor, coord);
  if (moved === cursor) return cursor;
  const same = coord.col === cursor.current.col && coord.row === cursor.current.row;
  return same ? turned(grid, cursor, moved) : onWord(grid, coord, cursor.orientation);
}

/** Space: turns only onto a word. */
export function wordToggle(grid: Grid, cursor: CursorState): CursorState {
  return turned(grid, cursor, toggleOrientation(cursor));
}

/** An arrow: a cross-axis arrow turns only onto a word; a same-axis arrow
 *  moves as the engine's. */
export function wordArrowKey(grid: Grid, cursor: CursorState, direction: ArrowDirection): CursorState {
  const next = arrowKey(grid, cursor, direction);
  return next.orientation === cursor.orientation ? next : turned(grid, cursor, next);
}
