'use client';

import { Fragment, useLayoutEffect, useRef } from 'react';
import { formatNoteDay, formatNoteTime } from '../../lib/collab/session';

/** One note in the session panel (24-S7). */
export interface SessionNote {
  readonly id: number;
  readonly at: Date;
  readonly text: string;
}

/** Story 24-S7. The session activity panel: the session's meaningful
 *  events, timestamped, under a date heading (mockups 02 and 04). Absent
 *  until the first note, it then animates in and stays. Its height is
 *  fixed, so a new note never moves the grid; it scrolls, kept at the
 *  newest note. */
export function SessionPanel({ notes, className = '' }: { notes: readonly SessionNote[]; className?: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [notes.length]);
  if (notes.length === 0) return null;
  return (
    <div data-testid="session-panel-frame" className={`session-panel-enter overflow-hidden ${className}`}>
      <div
        ref={listRef}
        data-testid="session-panel"
        role="log"
        aria-label="Session activity"
        className="h-32 overflow-y-auto rounded-modal border border-line-muted bg-modal-background p-4 shadow-[inset_0_3px_4px_-2px_rgb(0_0_0/0.25)]"
      >
        {notes.map((note, index) => {
          const day = formatNoteDay(note.at);
          const isNewDay = index === 0 || formatNoteDay(notes[index - 1].at) !== day;
          return (
            <Fragment key={note.id}>
              {isNewDay && (
                <p data-testid="session-date" className="text-label font-semibold text-subtle">
                  {day}
                </p>
              )}
              <p data-testid="session-note" className="mt-2 flex gap-4">
                <span data-testid="session-note-time" className="shrink-0 pt-[3px] text-label text-subtle tabular-nums">
                  {formatNoteTime(note.at)}
                </span>
                <span data-testid="session-note-text" className="min-w-0 text-body-normal text-primary">
                  {note.text}
                </span>
              </p>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
