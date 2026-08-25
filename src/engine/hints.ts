import type { Grid, Orientation } from './grid';
import type { Puzzle } from './puzzle';
import { slotsWithNumbers } from './numbering';

export interface HintRef {
  readonly number: number;
  readonly orientation: Orientation;
}

export interface RequiredHints {
  readonly across: readonly HintRef[];
  readonly down: readonly HintRef[];
}

export function hintKey(ref: HintRef): string {
  return `${ref.number}-${ref.orientation}`;
}

export function requiredHints(grid: Grid): RequiredHints {
  const slots = slotsWithNumbers(grid);
  const across: HintRef[] = [];
  const down: HintRef[] = [];

  for (const slot of slots) {
    const ref: HintRef = { number: slot.number, orientation: slot.orientation };
    if (slot.orientation === 'across') {
      across.push(ref);
    } else {
      down.push(ref);
    }
  }

  return { across, down };
}

export function hintsComplete(puzzle: Puzzle): boolean {
  const { across, down } = requiredHints(puzzle.grid);

  for (const ref of [...across, ...down]) {
    const text = puzzle.hints[hintKey(ref)];
    if (text === undefined || text.trim() === '') {
      return false;
    }
  }

  return true;
}
