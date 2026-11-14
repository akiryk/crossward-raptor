import { claimInvitations, listPuzzles, listSharedPuzzleIds, listLibraryCollaboration } from './actions';
import { puzzleStatus } from '@/lib/puzzle-status';
import { requireSession } from '@/lib/require-session';
import { LibraryFreshness } from '@/components/puzzle/LibraryPlayControls';
import { PuzzleLibrary } from '@/components/puzzle/PuzzleLibrary';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default async function PuzzlesPage() {
  // 24-S5: an invitation to this account's email becomes membership first.
  await claimInvitations();
  const [puzzles, sharedIds, session] = await Promise.all([listPuzzles(), listSharedPuzzleIds(), requireSession()]);
  // 24-S6: the puzzles shared with the caller (they collaborate, another owns).
  const shared = new Set(sharedIds);
  const metadata = await listLibraryCollaboration(puzzles.map((puzzle) => puzzle.id));
  const collaboration = new Map(metadata.map((puzzle) => [puzzle.id, puzzle]));

  return (
    <>
      <LibraryFreshness />
      <PuzzleLibrary
        userId={session.user.id}
        puzzles={puzzles.map((puzzle) => ({
          id: puzzle.id,
          builderId: puzzle.builderId,
          shared: puzzle.builderId !== session.user.id && shared.has(puzzle.id),
          builderName: puzzle.builderName,
          collaborators: collaboration.get(puzzle.id)?.collaborators ?? [],
          hasCollaborators: collaboration.get(puzzle.id)?.hasCollaborators ?? false,
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
