import { notFound } from 'next/navigation';
import { PuzzleGridEditor } from '@/components/grid/PuzzleGridEditor';
import { serializeGrid } from '@/lib/puzzle-storage';
import { claimInvitations, loadPuzzle } from '../actions';

export default async function PuzzleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // 24-S5: an invitation to this account's email becomes membership first.
  await claimInvitations();
  const puzzle = await loadPuzzle(id);

  if (!puzzle) {
    notFound();
  }

  return (
    <div className="px-2 py-6 min-[748px]:px-6">
      <PuzzleGridEditor
        puzzleId={puzzle.id}
        initialGrid={serializeGrid(puzzle.grid, puzzle.lockedWords)}
        initialPhase={puzzle.phase}
        initialHints={puzzle.hints}
        initialTitle={puzzle.title}
        initialPublishedAt={puzzle.publishedAt}
        initialVisibility={puzzle.visibility}
        initialVersion={puzzle.version}
        initialEpoch={puzzle.resetEpoch}
        isOwner={puzzle.isOwner}
      />
    </div>
  );
}
