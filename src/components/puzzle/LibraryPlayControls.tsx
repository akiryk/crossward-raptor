'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { resetPlaySession } from '@/app/puzzles/actions';
import { playDraftKey } from '@/components/play/play-autosave';
import { PlayResetDialog } from '@/components/play/PlayReset';
import type { LibraryPlay } from '@/lib/library-play';
import { ROW_CONTROL } from './library-row';

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

/** Play's Reset for a completed attempt; focus returns to the row's link. */
export function LibraryPlayControls({
  puzzleId,
  title,
  play,
  playLink,
}: {
  puzzleId: string;
  title: string;
  play: LibraryPlay;
  playLink: RefObject<HTMLAnchorElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  // The attempt a confirmed reset replaced; focus Play once the row shows
  // the server's current attempt instead.
  const replaced = useRef<string | null>(null);
  const completed = play.state === 'completed' && play.sessionId !== null;

  useEffect(() => {
    if (replaced.current === null || open || play.sessionId === replaced.current) return;
    replaced.current = null;
    playLink.current?.focus();
  }, [open, play.sessionId, playLink]);

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
      {completed && (
        <button
          type="button"
          data-testid="puzzle-reset-button"
          className={ROW_CONTROL}
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
