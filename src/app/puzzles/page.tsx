import { claimInvitations, listPuzzles, listSharedPuzzleIds } from './actions';
import { puzzleStatus } from '@/lib/puzzle-status';
import { requireSession } from '@/lib/require-session';
import { LibraryFreshness } from '@/components/puzzle/LibraryPlayControls';
import { PuzzleLibrary } from '@/components/puzzle/PuzzleLibrary';
import { prisma } from '@/lib/prisma';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default async function PuzzlesPage() {
  // 24-S5: an invitation to this account's email becomes membership first.
  await claimInvitations();
  const [puzzles, sharedIds, session] = await Promise.all([listPuzzles(), listSharedPuzzleIds(), requireSession()]);
  // 24-S6: the puzzles shared with the caller (they collaborate, another owns).
  const shared = new Set(sharedIds);
  // Display metadata only for puzzles the authenticated library query permits.
  const metadata = await prisma.puzzle.findMany({
    where: { id: { in: puzzles.map((puzzle) => puzzle.id) } },
    select: {
      id: true,
      collaborators: {
        orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }],
        select: { userId: true, user: { select: { displayName: true } } },
      },
      _count: { select: { invitations: { where: { expiresAt: { gt: new Date() } } } } },
    },
  });
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
          collaborators: collaboration.get(puzzle.id)?.collaborators.map((member) => ({
            userId: member.userId,
            name: member.user.displayName?.trim() || '(no username)',
          })) ?? [],
          hasCollaborators: (collaboration.get(puzzle.id)?.collaborators.length ?? 0) > 0 ||
            (collaboration.get(puzzle.id)?._count.invitations ?? 0) > 0,
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
