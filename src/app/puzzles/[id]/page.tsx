import { notFound } from 'next/navigation';
import { PuzzleGridEditor } from '@/components/grid/PuzzleGridEditor';
import { PuzzleTitle } from '@/components/puzzle/PuzzleTitle';
import { serializeGrid } from '@/lib/puzzle-storage';
import { loadPuzzle } from '../actions';

export default async function PuzzleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const puzzle = await loadPuzzle(id);

  if (!puzzle) {
    notFound();
  }

  return (
    <div className="p-6">
      <PuzzleTitle puzzleId={puzzle.id} initialTitle={puzzle.title} />
      <p data-testid="puzzle-phase">{puzzle.phase}</p>
      <PuzzleGridEditor
        puzzleId={puzzle.id}
        initialGrid={serializeGrid(puzzle.grid)}
        initialPhase={puzzle.phase}
        initialHints={puzzle.hints}
      />
    </div>
  );
}
