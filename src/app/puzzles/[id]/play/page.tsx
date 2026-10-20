import { notFound } from 'next/navigation';
import { PlayPuzzle } from '@/components/play/PlayPuzzle';
import { isPlayPuzzleBuilder, loadPlayPuzzle } from '../../actions';

export default async function PlayPuzzlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const puzzle = await loadPlayPuzzle(id);
  if (!puzzle) notFound();
  const isBuilder = await isPlayPuzzleBuilder(id);

  return <PlayPuzzle key={puzzle.id} initialPuzzle={puzzle} isBuilder={isBuilder} />;
}
