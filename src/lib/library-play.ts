import { isSolved } from '../engine/play';
import { isCompatiblePlayEntries } from './play-entries';
import { deserializeGrid, type SerializedGrid } from './puzzle-storage';

export type PlayState = 'untouched' | 'in-progress' | 'completed';

export interface LibraryPlay {
  state: PlayState;
  sessionId: string | null;
}

/** The caller's own attempt as the library shows it. Comparison with the
 *  published grid decides completion, whatever the stored stamp says. */
export function classifyLibraryPlay(
  grid: SerializedGrid,
  session: { id: string; entries: unknown } | null
): LibraryPlay {
  if (!session) return { state: 'untouched', sessionId: null };
  // A stored attempt whose geometry no longer matches is stale; offer reset.
  if (!isCompatiblePlayEntries(session.entries, grid)) {
    return { state: 'in-progress', sessionId: session.id };
  }
  const entries = session.entries;
  if (isSolved(deserializeGrid(grid), deserializeGrid(entries))) {
    return { state: 'completed', sessionId: session.id };
  }
  const started = entries.cells.some((row) =>
    row.some((cell) => cell.kind === 'active' && typeof cell.letter === 'string' && cell.letter.length > 0));
  return { state: started ? 'in-progress' : 'untouched', sessionId: session.id };
}
