"use client";

// Epic 24 (24-S3): the editor's saving by operations (EditorSaver), wired
// to React: the saver follows the editor's state and reports its status
// and refusals.

import { useEffect, useLayoutEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PuzzleContent } from "../../lib/collab/apply";
import { EditorSaver, viewContent, type SavedView } from "./editor-saver";
import type { SaveNotice } from "./SaveNotices";
import type { SaveStatusState } from "./SaveStatus";

export function useOperationSaving<T extends SavedView>({
  puzzleId,
  initialContent,
  initialVersion,
  initialEpoch,
  state,
  setState,
  withContent,
}: {
  puzzleId: string;
  initialContent: PuzzleContent;
  initialVersion: number;
  initialEpoch: number;
  state: T;
  setState: Dispatch<SetStateAction<T>>;
  /** The editor's state showing the content (its cursor kept where it can be). */
  withContent: (prev: T, content: PuzzleContent) => T;
}): { saver: EditorSaver; saveState: SaveStatusState | null; notices: readonly SaveNotice[]; dismissNotice: (id: string) => void } {
  const [, setTick] = useState(0);
  const [notices, setNotices] = useState<SaveNotice[]>([]);
  const [saver] = useState(() => new EditorSaver({
    puzzleId,
    initialContent,
    initialVersion,
    initialEpoch,
    view: state,
    onChange: () => setTick((tick) => tick + 1),
    showContent: (update) => setState((prev) => withContent(prev, update(viewContent(prev)))),
    notify: (id, notice) => setNotices((prev) => [...prev, { id, ...notice }]),
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
  };
}
