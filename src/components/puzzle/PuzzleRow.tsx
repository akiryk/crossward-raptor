'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { LibraryPlay } from '@/lib/library-play';
import type { StatusKind } from '@/lib/puzzle-status';
import type { Phase } from '@/engine/puzzle';
import { StatusIcon, type IconStatus } from './StatusIcon';
import { PuzzleRowMenu } from './PuzzleRowMenu';
import { LibraryPlayControls } from './LibraryPlayControls';
import { ROW_PRIMARY_LINK } from './library-row';

export interface LibraryPuzzle {
  id: string;
  builderId: string;
  builderName: string | null;
  title: string;
  phase: Phase;
  hintsComplete: boolean;
  updatedAt: string;
  updatedLabel: string;
  publishedAt: string | null;
  visibility: string;
  cols: number;
  rows: number;
  statusKind: StatusKind;
  play: LibraryPlay | null;
}

// Story 18-S3: the status, named for screen readers; the icon shows it.
const STATUS_TEXT: Record<IconStatus, string> = {
  grid: 'Build phase', hints: 'Hint phase', published: 'Ready to play', complete: 'Complete',
};

// Story 18-S6: room kept clear on the right for the row's controls, so the
// date (in the row's flow, after the title column) stops before them: 12px
// past the menu (12px in, 24px wide) or the play Reset (12px in, up to 40px
// wide; 19-S3: only on rows without a menu). In a narrow row the date wraps
// first, then the title column shrinks, to no less than 90px.
function rightRoom(menu: boolean, reset: boolean) {
  if (menu) return 'pr-12';
  if (reset) return 'pr-16';
  return 'pr-3';
}

// Story 18-S3: rows with the Play icon are green.
const ROW = 'bg-puzzle-row hover:bg-puzzle-row-hover has-[a:focus-visible]:bg-puzzle-row-hover';
const PLAY_ROW = 'bg-puzzle-row-play hover:bg-puzzle-row-play-hover has-[a:focus-visible]:bg-puzzle-row-play-hover';
// Story 19-S2: rows with the DONE icon are orange.
const COMPLETE_ROW = 'bg-puzzle-row-complete hover:bg-puzzle-row-complete-hover has-[a:focus-visible]:bg-puzzle-row-complete-hover';

/** Story 18-S4: a published row links to play and shows the player's
 *  progress; an unpublished one (always the caller's) links to the builder.
 *  The caller's own rows keep their menu. */
export function PuzzleRow({ puzzle, own, onDeleted }: {
  puzzle: LibraryPuzzle;
  own: boolean;
  onDeleted: () => void;
}) {
  const link = useRef<HTMLAnchorElement>(null);
  const [resetting, setResetting] = useState(false);
  const published = puzzle.publishedAt !== null;
  const play = published ? puzzle.play : null;
  // Story 18-S5: a completed puzzle shows DONE and names it in the hidden text.
  const status: IconStatus = play?.state === 'completed' ? 'complete' : puzzle.statusKind;
  const marker = play?.state === 'in-progress' ? '[in-play]' : null;
  const resettable = play?.state === 'completed' && play.sessionId !== null;

  return (
    <li
      data-testid="puzzle-list-item"
      data-phase={puzzle.phase}
      data-hints-complete={puzzle.hintsComplete ? 'true' : 'false'}
      data-updated-at={puzzle.updatedAt}
      data-published={published ? 'true' : 'false'}
      data-visibility={puzzle.visibility}
      data-published-at={puzzle.publishedAt ?? undefined}
      data-play-state={play?.state}
      data-keyboard-focus-host
      className={`relative flex h-[66px] items-center rounded-modal pl-[10px] ${rightRoom(own, resettable)} transition-colors duration-150 ease-out ${status === 'complete' ? COMPLETE_ROW : puzzle.statusKind === 'published' ? PLAY_ROW : ROW}`}
    >
      <StatusIcon status={status} />
      <div className="ml-3 flex w-[212px] min-w-[90px] flex-col gap-1">
        <Link
          ref={link}
          href={published ? `/puzzles/${puzzle.id}/play` : `/puzzles/${puzzle.id}`}
          data-testid={published ? 'puzzle-play-link' : 'puzzle-edit-link'}
          className={`${ROW_PRIMARY_LINK} flex min-w-0 text-title-4 text-primary outline-none`}
        >
          <span data-testid="puzzle-list-title" className="truncate">{puzzle.title}</span>
          <span data-testid="puzzle-status" data-status-kind={status} className="sr-only">
            {STATUS_TEXT[status]}
          </span>
          {marker && (
            <>
              <span className="whitespace-pre"> </span>
              <span data-testid="puzzle-play-state" className="shrink-0">{marker}</span>
            </>
          )}
        </Link>
        <span data-testid="puzzle-builder-name" className="block h-5 truncate text-title-4 text-muted">
          {puzzle.builderName ?? ''}
        </span>
      </div>
      <span
        data-testid="puzzle-list-updated"
        className="pointer-events-none ml-3 mt-[11px] shrink-[1000] self-start text-body-normal text-muted min-[948px]:whitespace-nowrap"
      >
        {puzzle.updatedLabel}
      </span>
      {own && (
        <PuzzleRowMenu puzzle={puzzle} onDeleted={onDeleted} onReset={resettable ? () => setResetting(true) : undefined} />
      )}
      {play && (
        <LibraryPlayControls
          puzzleId={puzzle.id}
          title={puzzle.title}
          play={play}
          playLink={link}
          open={resetting}
          setOpen={setResetting}
          button={!own}
        />
      )}
    </li>
  );
}
