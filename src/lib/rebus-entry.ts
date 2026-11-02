import type { Grid } from '../engine/grid';
import { withLetter } from '../engine/grid';
import type { CursorState } from '../engine/cursor';
import { place } from '../engine/cursor';

export const REBUS_MAX_LENGTH = 10;

export function rebusIntent(key: string, isOpen: boolean): 'open' | 'close' | null {
  if (!isOpen) return key === 'Escape' ? 'open' : null;
  return key === 'Enter' || key === 'Escape' ? 'close' : null;
}

export function rebusText(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, REBUS_MAX_LENGTH);
}

export function closeRebus(
  grid: Grid,
  cursor: CursorState,
  text: string,
  options: { advance: boolean; canClear: boolean },
): { grid: Grid; cursor: CursorState } {
  const cell = grid.at(cursor.current.col, cursor.current.row);
  const letter = cell.kind === 'active' ? cell.letter : null;
  if (text === '') {
    if (!options.canClear || letter === null) return { grid, cursor };
    return { grid: withLetter(grid, cursor.current, null), cursor };
  }
  const placed = place(grid, cursor, text);
  const next = letter === text ? grid : options.advance ? placed.grid : withLetter(grid, cursor.current, text);
  return { grid: next, cursor: options.advance ? placed.cursor : cursor };
}
