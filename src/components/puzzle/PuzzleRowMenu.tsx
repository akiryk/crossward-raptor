'use client';

import { useState } from 'react';
import { setPuzzleVisibility } from '@/app/puzzles/actions';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { LibraryDelete } from './LibraryDeleteDialog';
import type { LibraryPuzzle } from './PuzzleRow';

/** Story 16-S2: a Build row's three-dot menu. */
export function PuzzleRowMenu({ puzzle, onDeleted }: { puzzle: LibraryPuzzle; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const published = puzzle.publishedAt !== null;
  const makePublic = puzzle.visibility !== 'public';

  const items: MenuItem[] = published
    ? [{
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
    }]
    : [{ key: 'delete', label: 'Delete', testId: 'puzzle-menu-delete', tone: 'error', onSelect: () => setDeleting(true) }];

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
      <LibraryDelete puzzleId={puzzle.id} title={puzzle.title} onDeleted={onDeleted} open={deleting} setOpen={setDeleting} />
    </>
  );
}
