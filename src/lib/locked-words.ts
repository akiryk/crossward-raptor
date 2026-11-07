import { createGrid, withLetter, type Coord, type Grid, type Orientation } from '../engine/grid';
import type { CursorState } from '../engine/cursor';
import { buildWord } from './build-word';

// Locked words in the build phase (21-S2): a finished word the builder
// has fixed, saved with the grid. Drawn from its stored cells, whatever
// the grid now holds there.

export interface LockedWord {
  col: number;
  row: number;
  orientation: Orientation;
  length: number;
}

const MIN_LOCKABLE_LENGTH = 3;

function delta(orientation: Orientation): [number, number] {
  return orientation === 'across' ? [1, 0] : [0, 1];
}

/** The word's cells, in reading order. */
export function lockedWordCells(word: LockedWord): Coord[] {
  const [dc, dr] = delta(word.orientation);
  return Array.from({ length: word.length }, (_, i) => ({ col: word.col + dc * i, row: word.row + dr * i }));
}

function holds(word: LockedWord, coord: Coord): boolean {
  const isAcross = word.orientation === 'across';
  const offset = isAcross ? coord.col - word.col : coord.row - word.row;
  const inLine = isAcross ? coord.row === word.row : coord.col === word.col;
  return inLine && offset >= 0 && offset < word.length;
}

function sameWord(a: LockedWord, b: LockedWord): boolean {
  return a.col === b.col && a.row === b.row && a.orientation === b.orientation && a.length === b.length;
}

function isLettered(grid: Grid, { col, row }: Coord): boolean {
  const cell = grid.at(col, row);
  return cell.kind === 'active' && cell.letter !== null;
}

/** The cursor's word if it can be locked: the run Preview keeps white
 *  (21-S8), complete (every cell lettered) and at least 3 long. */
export function lockableWord(grid: Grid, cursor: CursorState): LockedWord | null {
  const cells = buildWord(grid, cursor.current, cursor.orientation);
  if (!cells || cells.length < MIN_LOCKABLE_LENGTH) return null;
  if (!cells.every((cell) => isLettered(grid, cell))) return null;
  return { ...cells[0], orientation: cursor.orientation, length: cells.length };
}

/** The cells just before and after the word, none past the grid's edge. */
export function endCells(grid: Grid, word: LockedWord): Coord[] {
  const [dc, dr] = delta(word.orientation);
  const before = { col: word.col - dc, row: word.row - dr };
  const after = { col: word.col + dc * word.length, row: word.row + dr * word.length };
  return [before, after].filter(
    ({ col, row }) => col >= 0 && row >= 0 && col < grid.cols && row < grid.rows
  );
}

/** Whether a locked word holds the cell. */
export function isCellLocked(lockedWords: readonly LockedWord[], coord: Coord): boolean {
  return lockedWords.some((word) => holds(word, coord));
}

/** The locked word holding the cursor's cell in its direction, if any. */
export function lockedWordAt(lockedWords: readonly LockedWord[], cursor: CursorState): LockedWord | null {
  return (
    lockedWords.find((word) => word.orientation === cursor.orientation && holds(word, cursor.current)) ?? null
  );
}

/** The list with the word added, or removed if it's already locked. */
export function toggleLock(lockedWords: readonly LockedWord[], word: LockedWord): LockedWord[] {
  return lockedWords.some((locked) => sameWord(locked, word))
    ? lockedWords.filter((locked) => !sameWord(locked, word))
    : [...lockedWords, { col: word.col, row: word.row, orientation: word.orientation, length: word.length }];
}

/** Reset Grid's Keep Locked Words (21-S6): a new grid, every cell white
 *  and empty, black ones included, but a locked word's cells keep what
 *  they hold (a rebus too). */
export function clearOutsideLockedWords(grid: Grid, lockedWords: readonly LockedWord[]): Grid {
  let next = createGrid({ cols: grid.cols, rows: grid.rows });
  for (const coord of lockedWords.flatMap(lockedWordCells)) {
    const cell = grid.at(coord.col, coord.row);
    if (cell.kind === 'active' && cell.letter) next = withLetter(next, coord, cell.letter);
  }
  return next;
}
