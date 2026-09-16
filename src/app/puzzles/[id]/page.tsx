import { notFound } from 'next/navigation';
import { PuzzleGridEditor } from '@/components/grid/PuzzleGridEditor';
import { DeletePuzzleButton } from '@/components/puzzle/DeletePuzzleButton';
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
      <PuzzleGridEditor
        puzzleId={puzzle.id}
        initialGrid={serializeGrid(puzzle.grid)}
        initialPhase={puzzle.phase}
        initialHints={puzzle.hints}
        initialTitle={puzzle.title}
        initialPublishedAt={puzzle.publishedAt}
        initialVisibility={puzzle.visibility}
      />
      <div data-testid="danger-zone" className="mt-8 border-t border-rule pt-4">
        <DeletePuzzleButton puzzleId={puzzle.id} />
      </div>
    </div>
  );
}
