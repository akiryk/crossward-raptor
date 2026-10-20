'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resetPlaySession } from '@/app/puzzles/actions';
import { playDraftKey } from '@/components/play/play-autosave';
import { PlayResetDialog } from '@/components/play/PlayReset';
import type { LibraryPlay } from '@/lib/library-play';
import { ROW_PRIMARY_LINK } from './library-row';

/** Lifts a secondary control above the row's primary-link overlay. */
const ABOVE_ROW_LINK = 'relative z-10';
const QUIET_CONTROL = 'cursor-pointer rounded-btn px-2 py-1 text-help text-ink-2 '
  + 'hover:bg-hover-tint hover:text-foreground';

// Browser Back restores the library from the client router cache, which
// predates anything saved, completed or reset while playing. Remember that
// a history traversal happened so the library refreshes when it remounts.
let returnedThroughHistory = false;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => { returnedThroughHistory = true; });
}

/** Refreshes the library's server data when it is reentered via history. */
export function LibraryFreshness() {
  const router = useRouter();
  useEffect(() => {
    if (!returnedThroughHistory) return;
    returnedThroughHistory = false;
    router.refresh();
  }, [router]);
  return null;
}

/** A published row's Play link, plus the builder's Manage link and the
 *  caller's Reset for a started attempt. */
export function LibraryPlayControls({
  puzzleId,
  title,
  play,
  isBuilder,
}: {
  puzzleId: string;
  title: string;
  play: LibraryPlay;
  isBuilder: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const playLink = useRef<HTMLAnchorElement>(null);
  // The attempt a confirmed reset replaced; focus Play once the row shows
  // the server's current attempt instead.
  const replaced = useRef<string | null>(null);
  const started = play.state !== 'untouched' && play.sessionId !== null;

  useEffect(() => {
    if (replaced.current === null || open || play.sessionId === replaced.current) return;
    replaced.current = null;
    playLink.current?.focus();
  }, [open, play.sessionId]);

  function openReset() {
    setFailed(false);
    setOpen(true);
  }

  function cancelReset() {
    if (busy.current) return;
    setOpen(false);
    setFailed(false);
  }

  async function confirmReset() {
    const sessionId = play.sessionId;
    if (busy.current || sessionId === null) return;
    busy.current = true;
    setPending(true);
    setFailed(false);
    try {
      // Invalidates /puzzles, so the action's response refreshes this row.
      await resetPlaySession(puzzleId, sessionId);
    } catch {
      setFailed(true);
      return;
    } finally {
      busy.current = false;
      setPending(false);
    }
    try {
      localStorage.removeItem(playDraftKey(sessionId));
    } catch {
      // The new session ID already prevents recovering the obsolete draft.
    }
    replaced.current = sessionId;
    setOpen(false);
  }

  return (
    <>
      {started && (
        <button
          type="button"
          data-testid="puzzle-reset-button"
          className={`${ABOVE_ROW_LINK} ${QUIET_CONTROL}`}
          // Some browsers do not focus a clicked button; Modal restores focus
          // to whatever was focused when it opened.
          onClick={(event) => {
            event.currentTarget.focus();
            openReset();
          }}
        >
          Reset
        </button>
      )}
      {isBuilder && (
        <Link
          href={`/puzzles/${puzzleId}`}
          data-testid="puzzle-edit-link"
          className={`${ABOVE_ROW_LINK} ${QUIET_CONTROL}`}
        >
          Manage
        </Link>
      )}
      <Link
        ref={playLink}
        href={`/puzzles/${puzzleId}/play`}
        data-testid="puzzle-play-link"
        className={`${ROW_PRIMARY_LINK} rounded-btn border border-rule-strong bg-background px-3 py-1 text-body text-accent hover:bg-hover-tint`}
      >
        Play
      </Link>
      {/* Stays mounted while the refreshed row drops its Reset button. */}
      <PlayResetDialog
        open={open}
        pending={pending}
        failed={failed}
        onConfirm={() => void confirmReset()}
        onCancel={cancelReset}
        puzzleTitle={title}
      />
    </>
  );
}
