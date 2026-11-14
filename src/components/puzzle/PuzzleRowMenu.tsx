'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { duplicatePuzzle, setPuzzleVisibility } from '@/app/puzzles/actions';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { LibraryDelete } from './LibraryDeleteDialog';
import type { LibraryPuzzle } from './PuzzleRow';

// 24-S6: every own row's menu imports this module (any row can gain a menu
// as soon as it is the caller's own), so the dialog itself loads in its own
// chunk, fetched only once a row's Collaborators… is actually chosen. Kept
// out of the list's own render path: every library row re-renders on every
// change (a completed one's Reset included, 18-S5-5), so this module's
// unrelated weight on that path is avoided, not just its unused markup.
const CollaboratorsDialog = dynamic(() => import('./CollaboratorsDialog').then((module) => module.CollaboratorsDialog));

/** Story 16-S2: an own row's three-dot menu. Story 16-S4 adds Duplicate, first;
 *  18-S4 adds Open in builder to published rows; 19-S3 adds a completed
 *  row's Reset before Delete, which a hairline sets apart. 24-S6 adds
 *  Collaborators… second on unpublished rows; a shared row (not `own`)
 *  offers Duplicate only, and its player's Reset. */
export function PuzzleRowMenu({ puzzle, own, onDeleted, onReset }: {
  puzzle: LibraryPuzzle;
  own: boolean;
  onDeleted: () => void;
  onReset?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [managing, setManaging] = useState(false);
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

  // Story 18-S4: a published row links to play, so the builder's published view is here.
  const openInBuilder: MenuItem = {
    key: 'open-in-builder',
    label: 'Open in builder',
    testId: 'puzzle-menu-open-builder',
    onSelect: () => router.push(`/puzzles/${puzzle.id}`),
  };

  const remove: MenuItem = {
    key: 'delete', label: 'Delete', testId: 'puzzle-menu-delete', tone: 'error', separated: true, onSelect: () => setDeleting(true),
  };
  const reset: MenuItem[] = onReset
    ? [{ key: 'reset', label: 'Reset', testId: 'puzzle-menu-reset', tone: 'error', onSelect: onReset }]
    : [];
  const collaborators: MenuItem = {
    key: 'collaborators', label: puzzle.hasCollaborators ? 'Edit Collaborators' : 'Add Collaborators', testId: 'puzzle-menu-collaborators', onSelect: () => setManaging(true),
  };
  const items: MenuItem[] = !own
    ? [duplicate, ...reset]
    : published
    ? [duplicate, openInBuilder, {
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
    }, ...reset, remove]
    : [duplicate, collaborators, remove];

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
      {own && !published && (
        <CollaboratorsDialog puzzleId={puzzle.id} open={managing} onClose={() => { setManaging(false); router.refresh(); }} />
      )}
      {own && <LibraryDelete puzzleId={puzzle.id} title={puzzle.title} published={published} onDeleted={onDeleted} open={deleting} setOpen={setDeleting} />}
    </>
  );
}
