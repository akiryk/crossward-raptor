"use client";

// Epic 24 (24-S3): the editor's saving by operations (EditorSaver), wired
// to React: the saver follows the editor's state and reports its status
// and refusals.

import { useEffect, useLayoutEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PuzzleContent } from "../../lib/collab/apply";
import { EditorSaver, viewContent, type AccessLoss, type SavedView } from "./editor-saver";
import type { SaveNotice } from "./SaveNotices";
import type { SaveStatusState } from "./SaveStatus";
import type { Coord } from "../../engine/grid";
import type { SessionNote } from "./SessionPanel";

/** 24-S7: a conflict's outline or hint highlight shows this long: fading in
 *  over 400 ms, holding 1.5 s and fading out over 500 ms. */
export const CONFLICT_SHOW_MS = 2400;

/** 24-S7: an outline over superseded cells, while it shows. */
export interface ConflictOutline {
  readonly id: number;
  readonly cells: readonly Coord[];
}

export function useOperationSaving<T extends SavedView>({
  puzzleId,
  initialContent,
  initialVersion,
  initialEpoch,
  state,
  setState,
  withContent,
  published,
  onAccessLost,
  onSignedOut,
  userId,
}: {
  puzzleId: string;
  initialContent: PuzzleContent;
  initialVersion: number;
  initialEpoch: number;
  state: T;
  setState: Dispatch<SetStateAction<T>>;
  /** The editor's state showing the content (its cursor kept where it can be). */
  withContent: (prev: T, content: PuzzleContent) => T;
  /** 24-S5: the puzzle is already published (nothing to poll for). */
  published?: boolean;
  /** 24-S5: access lost while open (removed, deleted or published). */
  onAccessLost?: (loss: AccessLoss) => void;
  /** 24-S5: the session is gone. */
  onSignedOut?: () => void;
  /** 24-S7: the signed-in account. */
  userId?: string;
}): {
  saver: EditorSaver;
  saveState: SaveStatusState | null;
  notices: readonly SaveNotice[];
  dismissNotice: (id: string) => void;
  sessionNotes: readonly SessionNote[];
  outlines: readonly ConflictOutline[];
  conflictHints: ReadonlySet<string>;
} {
  const [, setTick] = useState(0);
  const [notices, setNotices] = useState<SaveNotice[]>([]);
  // 24-S7: the session panel's notes, and the conflicts showing.
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [outlines, setOutlines] = useState<ConflictOutline[]>([]);
  const [conflictHints, setConflictHints] = useState<ReadonlySet<string>>(() => new Set());
  const [nextId] = useState(() => {
    let id = 0;
    return () => ++id;
  });
  const [saver] = useState(() => new EditorSaver({
    puzzleId,
    initialContent,
    initialVersion,
    initialEpoch,
    view: state,
    onChange: () => setTick((tick) => tick + 1),
    showContent: (update) => setState((prev) => withContent(prev, update(viewContent(prev)))),
    notify: (id, notice) => setNotices((prev) => [...prev, { id, ...notice }]),
    published,
    onAccessLost,
    onSignedOut,
    userId,
    onSessionNote: (text) => setSessionNotes((prev) => [...prev, { id: nextId(), at: new Date(), text }]),
    onConflict: (conflict) => {
      const id = nextId();
      if ("cells" in conflict) {
        setOutlines((prev) => [...prev, { id, cells: conflict.cells }]);
        setTimeout(() => setOutlines((prev) => prev.filter((outline) => outline.id !== id)), CONFLICT_SHOW_MS);
        return;
      }
      const key = conflict.hintKey;
      setConflictHints((prev) => new Set(prev).add(key));
      setTimeout(() => setConflictHints((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      }), CONFLICT_SHOW_MS);
    },
  }));

  useLayoutEffect(() => {
    saver.setView(state);
  });
  useEffect(() => saver.attachPage(), [saver]);
  useEffect(() => saver.adoptJournal(), [saver]);
  // In this order: an edit extends the burst's word before the cursor's
  // move is checked against it.
  useEffect(() => saver.gridChanged(state.grid, state.cursor), [saver, state.grid, state.cursor]);
  useEffect(() => saver.cursorMoved(state.cursor), [saver, state.cursor]);
  useEffect(() => saver.hintsChanged(state.hints), [saver, state.hints]);
  useEffect(() => saver.titleChanged(state.title), [saver, state.title]);

  return {
    saver,
    saveState: saver.saveState(state),
    notices,
    dismissNotice: (id) => setNotices((prev) => prev.filter((notice) => notice.id !== id)),
    sessionNotes,
    outlines,
    conflictHints,
  };
}
