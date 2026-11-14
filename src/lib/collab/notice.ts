// Epic 24 (24-S3): words for a refused operation. The builder is told what
// wasn't saved and why, and the refused input (a burst's letters, a hint's
// or a title's text) is kept so it can be copied. Pure.

import { withLetter, type Coord } from '@/engine/grid';
import { slotsWithNumbers, type NumberedSlot } from '@/engine/numbering';
import { intendedGeometry } from '@/engine/puzzle-geometry';
import { deserializeGrid, type SerializedGrid } from '@/lib/puzzle-storage';
import type { Phase } from '@/engine/puzzle';
import type { Operation } from './operation';
import type { QueueRefusalCode } from './queue';

export interface RefusalNotice {
  /** The explanation, one sentence. */
  readonly message: string;
  /** The refused input, to copy; null when there is nothing to keep. */
  readonly input: string | null;
}

const REASONS: Record<QueueRefusalCode, string> = {
  locked: 'the word was locked',
  epoch: 'the puzzle was started over',
  phase: 'the puzzle moved to Create Hints',
  published: 'the puzzle was published',
  invalid: 'it no longer fits the puzzle',
  owner: "only the puzzle's owner can do that",
  expired: 'this page is out of date. Reload the page to continue',
  'not-found': 'this puzzle is no longer available',
};

/** "1-across" as the builder reads it: "1-Across". */
export function entryName(key: string): string {
  const [number, direction] = key.split('-');
  return `${number}-${direction.charAt(0).toUpperCase()}${direction.slice(1)}`;
}

function slotsOf(grid: SerializedGrid, phase: Phase, coords: readonly Coord[]): readonly NumberedSlot[] {
  let shown = deserializeGrid(grid);
  if (phase === 'hints') return slotsWithNumbers(shown);
  // In Build, the words are the ones Preview shows (`intendedGeometry`),
  // with the written cells counted as lettered, as `wouldBeWord` does: a
  // cleared cell still belongs to its word.
  for (const coord of coords) {
    const cell = shown.at(coord.col, coord.row);
    if (cell.kind === 'active' && cell.letter === null) shown = withLetter(shown, coord, 'A');
  }
  return slotsWithNumbers(intendedGeometry(shown));
}

function holds(slot: NumberedSlot, coord: Coord): boolean {
  return slot.cells.some((cell) => cell.col === coord.col && cell.row === coord.row);
}

/** The entry holding every one of the cells, Across first; null if none. */
function entryOf(grid: SerializedGrid, phase: Phase, coords: readonly Coord[]): NumberedSlot | null {
  const slots = slotsOf(grid, phase, coords);
  const fits = (orientation: 'across' | 'down') =>
    slots.find((slot) => slot.orientation === orientation && coords.every((coord) => holds(slot, coord))) ?? null;
  // A single cell belongs to both; a run along a column reads as Down.
  const sameColumn = coords.length > 1 && coords.every((coord) => coord.col === coords[0].col);
  return sameColumn ? fits('down') : fits('across') ?? fits('down');
}

function letterAt(grid: SerializedGrid, coord: Coord): string | null {
  const cell = grid.cells[coord.row]?.[coord.col];
  return cell?.kind === 'active' ? cell.letter : null;
}

/** The explanation for a refused operation, given the grid as the builder
 *  saw it with the refused edits (before the authoritative cells replace
 *  them) and the phase they were made in. */
export function refusalNotice(op: Operation, code: QueueRefusalCode, grid: SerializedGrid, phase: Phase): RefusalNotice {
  const reason = REASONS[code];
  switch (op.kind) {
    case 'cells': {
      const coords = op.writes.map(({ col, row }) => ({ col, row }));
      const entry = entryOf(grid, phase, coords);
      const where = entry ? `in ${entry.number}-${entry.orientation === 'across' ? 'Across' : 'Down'}` : 'in the grid';
      // The whole entry as the builder saw it, or else the letters written.
      const letters = entry
        ? entry.cells.map((coord) => letterAt(grid, coord) ?? '?').join('')
        : op.writes.map((write) => write.value ?? '').join('');
      const wrote = op.writes.some((write) => write.value !== null);
      if (!wrote) return { message: `Your deletions ${where} weren't saved: ${reason}.`, input: null };
      return { message: `Your ${letters} ${where} wasn't saved: ${reason}.`, input: letters };
    }
    case 'hint':
      return { message: `Your hint for ${entryName(op.key)} wasn't saved: ${reason}.`, input: op.text };
    case 'title':
      return { message: `Your title wasn't saved: ${reason}.`, input: op.title };
    case 'lock':
    case 'unlock': {
      const cells = Array.from({ length: op.word.length }, (_, index) => op.word.orientation === 'across'
        ? { col: op.word.col + index, row: op.word.row }
        : { col: op.word.col, row: op.word.row + index });
      const entry = entryOf(grid, phase, cells);
      const name = entry ? `${entry.number}-${entry.orientation === 'across' ? 'Across' : 'Down'}` : 'The word';
      return { message: `${name} wasn't ${op.kind === 'lock' ? 'locked' : 'unlocked'}: ${reason}.`, input: null };
    }
    case 'enterHints':
      return {
        message: code === 'phase'
          ? 'The puzzle is already in Create Hints. Reload the page to see it.'
          : `The puzzle didn't move to Create Hints: ${reason}.`,
        input: null,
      };
    case 'startOver':
      return { message: `Reset Grid wasn't saved: ${reason}.`, input: null };
  }
}

/** Words for a refused publication, shown in the Publish dialog (D7). */
export function publishRefusalMessage(code: 'stale' | 'published' | 'phase' | 'incomplete' | 'not-found' | 'invalid' | 'unsaved'): string {
  switch (code) {
    case 'stale':
      return "This puzzle changed after you checked it, so it wasn't published. Reload the page to see the changes, then publish again.";
    case 'published':
      return 'This puzzle is already published.';
    case 'phase':
      return "This puzzle isn't in Create Hints, so it can't be published.";
    case 'incomplete':
      return 'Every hint needs to be written before publishing.';
    case 'unsaved':
      return "Some of your changes weren't saved, so it wasn't published. Check the note above the grid, then publish again.";
    case 'not-found':
    case 'invalid':
      return "This puzzle can't be published.";
  }
}
