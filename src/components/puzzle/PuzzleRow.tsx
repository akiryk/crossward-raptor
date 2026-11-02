'use client';

import { useRef } from 'react';
import Link from 'next/link';
import type { LibraryPlay } from '@/lib/library-play';
import type { StatusKind } from '@/lib/puzzle-status';
import type { Phase } from '@/engine/puzzle';
import { StatusIcon } from './StatusIcon';
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
const STATUS_TEXT: Record<StatusKind, string> = { grid: 'Build phase', hints: 'Hint phase', published: 'Ready to play' };

// Story 18-S3: rows with the Play icon are green.
const ROW = 'bg-puzzle-row hover:bg-puzzle-row-hover has-[a:focus-visible]:bg-puzzle-row-hover';
const PLAY_ROW = 'bg-puzzle-row-play hover:bg-puzzle-row-play-hover has-[a:focus-visible]:bg-puzzle-row-play-hover';

export function PuzzleRow({ puzzle, view, onDeleted }: {
  puzzle: LibraryPuzzle;
  view: 'build' | 'play';
  onDeleted: () => void;
}) {
  const link = useRef<HTMLAnchorElement>(null);
  const published = puzzle.publishedAt !== null;
  const play = published ? puzzle.play : null;
  // Only Play view shows a visible marker, the player's progress.
  const marker = view === 'build' ? null
    : play?.state === 'in-progress' ? '[in-play]'
    : play?.state === 'completed' ? '[complete]' : null;

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
      className={`relative flex h-[66px] items-center rounded-modal pl-[10px] transition-colors duration-150 ease-out ${puzzle.statusKind === 'published' ? PLAY_ROW : ROW}`}
    >
      <StatusIcon status={puzzle.statusKind} />
      <div className="ml-3 flex w-[212px] min-w-0 flex-col gap-1">
        <Link
          ref={link}
          href={view === 'build' ? `/puzzles/${puzzle.id}` : `/puzzles/${puzzle.id}/play`}
          data-testid={view === 'build' ? 'puzzle-edit-link' : 'puzzle-play-link'}
          className={`${ROW_PRIMARY_LINK} flex min-w-0 text-title-4 text-primary outline-none`}
        >
          <span data-testid="puzzle-list-title" className="truncate">{puzzle.title}</span>
          <span data-testid="puzzle-status" data-status-kind={puzzle.statusKind} className="sr-only">
            {STATUS_TEXT[puzzle.statusKind]}
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
        className="pointer-events-none absolute left-[280px] top-[11px] text-body-normal text-muted"
      >
        {puzzle.updatedLabel}
      </span>
      {view === 'build' && (
        <PuzzleRowMenu puzzle={puzzle} onDeleted={onDeleted} />
      )}
      {view === 'play' && play && (
        <LibraryPlayControls puzzleId={puzzle.id} title={puzzle.title} play={play} playLink={link} />
      )}
    </li>
  );
}
