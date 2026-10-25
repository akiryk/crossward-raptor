import { listPuzzles } from './actions';
import { puzzleStatus } from '@/lib/puzzle-status';
import { requireSession } from '@/lib/require-session';
import { LibraryFreshness } from '@/components/puzzle/LibraryPlayControls';
import { PuzzleLibrary } from '@/components/puzzle/PuzzleLibrary';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default async function PuzzlesPage() {
  const [puzzles, session] = await Promise.all([listPuzzles(), requireSession()]);

  return (
    <>
      <LibraryFreshness />
      <PuzzleLibrary
        userId={session.user.id}
        puzzles={puzzles.map((puzzle) => ({
          id: puzzle.id,
          builderId: puzzle.builderId,
          builderName: puzzle.builderName,
          title: puzzle.title,
          phase: puzzle.phase,
          hintsComplete: puzzle.hintsComplete,
          updatedAt: puzzle.updatedAt.toISOString(),
          updatedLabel: formatDate(puzzle.updatedAt),
          publishedAt: puzzle.publishedAt?.toISOString() ?? null,
          visibility: puzzle.visibility,
          cols: puzzle.cols,
          rows: puzzle.rows,
          statusKind: puzzleStatus(puzzle).kind,
          play: puzzle.play,
        }))}
      />
    </>
  );
}
