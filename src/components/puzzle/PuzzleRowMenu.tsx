'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { duplicatePuzzle, setPuzzleVisibility } from '@/app/puzzles/actions';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { LibraryDelete } from './LibraryDeleteDialog';
import type { LibraryPuzzle } from './PuzzleRow';

/** Story 16-S2: a Build row's three-dot menu. Story 16-S4 adds Duplicate, first. */
export function PuzzleRowMenu({ puzzle, onDeleted }: { puzzle: LibraryPuzzle; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const published = puzzle.publishedAt !== null;
  const makePublic = puzzle.visibility !== 'public';
  const router = useRouter();

  const duplicate: MenuItem = {
    key: 'duplicate',
    label: 'Duplicate',
    testId: 'puzzle-menu-duplicate',
    onSelect: async () => {
      setFailed(null);
      try {
        const { id } = await duplicatePuzzle(puzzle.id);
        router.push(`/puzzles/${id}`);
        return true;
      } catch {
        setFailed('Could not duplicate the puzzle. Please try again.');
        return false;
      }
    },
  };

  const remove: MenuItem = { key: 'delete', label: 'Delete', testId: 'puzzle-menu-delete', tone: 'error', onSelect: () => setDeleting(true) };
  const items: MenuItem[] = published
    ? [duplicate, {
      key: 'visibility',
      label: makePublic ? 'Make public' : 'Make unlisted',
      testId: 'puzzle-menu-visibility',
      onSelect: async () => {
        setFailed(null);
        try {
          await setPuzzleVisibility(puzzle.id, makePublic ? 'public' : 'private');
          return true;
        } catch {
          setFailed(`Could not make the puzzle ${makePublic ? 'public' : 'unlisted'}. Please try again.`);
          return false;
        }
      },
    }, remove]
    : [duplicate, remove];

  return (
    <>
      <Menu
        label={`Actions for ${puzzle.title}`}
        items={items}
        onOpen={() => setFailed(null)}
        className="absolute right-3 top-[9px]"
        alert={failed && (
          <p data-testid="puzzle-menu-error" role="alert" className="mt-1 w-[240px] rounded-modal border border-line-muted bg-modal-background px-3 py-2 text-body-normal text-error">
            {failed}
          </p>
        )}
      />
      <LibraryDelete puzzleId={puzzle.id} title={puzzle.title} published={published} onDeleted={onDeleted} open={deleting} setOpen={setDeleting} />
    </>
  );
}
