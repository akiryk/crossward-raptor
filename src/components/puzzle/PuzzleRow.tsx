'use client';

import { useRef } from 'react';
import Link from 'next/link';
import type { LibraryPlay } from '@/lib/library-play';
import type { StatusKind } from '@/lib/puzzle-status';
import type { Phase } from '@/engine/puzzle';
import { CrosswordIcon } from './CrosswordIcon';
import { LibraryDelete } from './LibraryDeleteDialog';
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

const STATUS_MARKER: Record<StatusKind, string> = { grid: '[grid]', hints: '[hint]', published: '[published]' };

export function PuzzleRow({ puzzle, view, onDeleted }: {
  puzzle: LibraryPuzzle;
  view: 'build' | 'play';
  onDeleted: () => void;
}) {
  const link = useRef<HTMLAnchorElement>(null);
  const published = puzzle.publishedAt !== null;
  const play = published ? puzzle.play : null;
  const marker = view === 'build'
    ? { testId: 'puzzle-status-badge', text: STATUS_MARKER[puzzle.statusKind] }
    : play?.state === 'in-progress'
      ? { testId: 'puzzle-play-state', text: '[in-play]' }
      : play?.state === 'completed' ? { testId: 'puzzle-play-state', text: '[complete]' } : null;

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
      className="relative flex h-[66px] items-center rounded-modal bg-puzzle-row pl-[10px] transition-colors duration-150 ease-out hover:bg-puzzle-row-hover has-[a:focus-visible]:bg-puzzle-row-hover"
    >
      <CrosswordIcon />
      <div className="ml-3 flex w-[212px] min-w-0 flex-col gap-1">
        <Link
          ref={link}
          href={view === 'build' ? `/puzzles/${puzzle.id}` : `/puzzles/${puzzle.id}/play`}
          data-testid={view === 'build' ? 'puzzle-edit-link' : 'puzzle-play-link'}
          className={`${ROW_PRIMARY_LINK} flex min-w-0 text-title-4 text-primary outline-none`}
        >
          <span data-testid="puzzle-list-title" className="truncate">{puzzle.title}</span>
          {marker && (
            <>
              <span className="whitespace-pre"> </span>
              <span data-testid={marker.testId} data-status-kind={view === 'build' ? puzzle.statusKind : undefined} className="shrink-0">
                {marker.text}
              </span>
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
      {view === 'build' && !published && (
        <LibraryDelete puzzleId={puzzle.id} title={puzzle.title} onDeleted={onDeleted} />
      )}
      {view === 'play' && play && (
        <LibraryPlayControls puzzleId={puzzle.id} title={puzzle.title} play={play} playLink={link} />
      )}
    </li>
  );
}
