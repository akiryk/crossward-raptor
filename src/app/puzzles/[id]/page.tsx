import { notFound } from 'next/navigation';
import { PuzzleGridEditor } from '@/components/grid/PuzzleGridEditor';
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
      <h1 data-testid="puzzle-title">{puzzle.title}</h1>
      <p data-testid="puzzle-phase">{puzzle.phase}</p>
      <PuzzleGridEditor
        puzzleId={puzzle.id}
        initialGrid={serializeGrid(puzzle.grid)}
        initialPhase={puzzle.phase}
      />
    </div>
  );
}
