"use client";

// Epic 24 (24-S3): the editor saves by operations. The editor's state is the
// view: the confirmed state with the pending operations applied
// (`projectOutbox`), plus the burst being typed. A burst becomes an
// operation when it finalizes: the cells, hints or title the view changed
// from the projection (`cellWrites`, `hintChanges`, `titleChange`). Locks,
// Enter Hints and Start Over are operations of their own. The queue sends
// them one at a time, in order; the journal keeps them until answered.

import type { Grid } from "../../engine/grid";
import type { CursorState } from "../../engine/cursor";
import type { Phase } from "../../engine/puzzle";
import { commitOperation } from "../../app/puzzles/actions";
import type { PuzzleContent } from "../../lib/collab/apply";
import { BurstClock } from "../../lib/collab/burst";
import { readJournal, removeJournalKeys, writeJournal, type JournalStorage } from "../../lib/collab/journal";
import { refusalNotice, type RefusalNotice } from "../../lib/collab/notice";
import type { Operation, OperationBody } from "../../lib/collab/operation";
import {
  cellWrites, hintChanges, projectOutbox, rebaseView, titleChange, type Outbox, type Settlement,
} from "../../lib/collab/outbox";
import { OperationQueue, type QueueRefusalCode } from "../../lib/collab/queue";
import { serializeGrid } from "../../lib/puzzle-storage";
import type { LockedWord } from "../../lib/locked-words";
import { wouldBeWord } from "../../lib/build-word";
import type { SaveStatusState } from "./SaveStatus";

/** The part of the editor's state that is saved, and the cursor. */
export interface SavedView {
  grid: Grid;
  lockedWords: LockedWord[];
  cursor: CursorState;
  phase: Phase;
  hints: Record<string, string>;
  title: string;
}

export function viewContent(view: SavedView): PuzzleContent {
  return { grid: serializeGrid(view.grid, view.lockedWords), hints: view.hints, title: view.title, phase: view.phase };
}

function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function storage(): JournalStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** The keepalive send to the commit route (24-S1) as the page is left. */
function sendKeepalive(puzzleId: string, op: Operation): void {
  try {
    void fetch(`/api/puzzles/${encodeURIComponent(puzzleId)}/operations`, {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(op),
    }).catch(() => undefined);
  } catch {
    // Best effort: the journal still holds it.
  }
}

const cellKey = ({ col, row }: { col: number; row: number }) => `${col},${row}`;

/** The cells one grid change edited. */
function editedCells(before: Grid, after: Grid): { col: number; row: number }[] {
  const edited = [];
  if (before.rows !== after.rows || before.cols !== after.cols) return [];
  for (let row = 0; row < after.rows; row++) {
    for (let col = 0; col < after.cols; col++) {
      const a = before.at(col, row);
      const b = after.at(col, row);
      if (a.kind !== b.kind || (a.kind === "active" && b.kind === "active" && a.letter !== b.letter)) edited.push({ col, row });
    }
  }
  return edited;
}

export interface EditorSaverOptions {
  readonly puzzleId: string;
  readonly initialContent: PuzzleContent;
  readonly initialVersion: number;
  readonly initialEpoch: number;
  readonly view: SavedView;
  /** Something the status depends on changed. */
  readonly onChange: () => void;
  /** Replaces the view's saved content (the cursor is the editor's). */
  readonly showContent: (update: (view: PuzzleContent) => PuzzleContent) => void;
  /** A refused operation, explained. */
  readonly notify: (id: string, notice: RefusalNotice) => void;
}

export class EditorSaver {
  readonly clientId = newId();
  private readonly queue: OperationQueue;
  private view: SavedView;
  private previousGrid: Grid;
  private previousHints: Record<string, string>;
  private previousTitle: string;
  /** The burst's word: every word an edited cell, or the cursor after it,
   *  belongs to, in the cursor's direction. */
  private burstWord: { orientation: string; cells: Set<string> } | null = null;
  private readonly gridClock = new BurstClock(() => this.flushGrid());
  private readonly hintClock = new BurstClock(() => this.flushHints());
  private readonly titleClock = new BurstClock(() => this.flushTitle());

  constructor(private readonly options: EditorSaverOptions) {
    this.view = options.view;
    this.previousGrid = options.view.grid;
    this.previousHints = options.view.hints;
    this.previousTitle = options.view.title;
    const { puzzleId } = options;
    this.queue = new OperationQueue(
      {
        confirmed: { content: options.initialContent, version: options.initialVersion, resetEpoch: options.initialEpoch },
        pending: [],
      },
      { puzzleId, clientId: this.clientId, newOpId: newId },
      {
        send: (op) => commitOperation(op),
        keepalive: (op) => sendKeepalive(puzzleId, op),
        journal: (pending) => {
          const store = storage();
          if (store) writeJournal(store, puzzleId, this.clientId, pending);
        },
        onChange: () => options.onChange(),
        onRefused: (op, code, before, after) => this.refused(op, code, before, after),
      },
    );
  }

  /** The editor's latest state. */
  setView(view: SavedView): void {
    this.view = view;
  }

  /** The base a burst is measured from: the projection, while the view is
   *  in its phase (not while Enter Hints awaits the server). */
  private base(): PuzzleContent | null {
    const projected = projectOutbox(this.queue.outbox).content;
    return projected.phase === this.view.phase ? projected : null;
  }

  private refused(op: Operation, code: QueueRefusalCode, before: Outbox, after: Outbox): void {
    const view = viewContent(this.view);
    this.options.notify(op.opId, refusalNotice(op, code, view.grid, view.phase));
    // The grid shows the authoritative cells; edits still being typed stay.
    const oldBase = projectOutbox(before).content;
    const newBase = projectOutbox(after).content;
    this.options.showContent((shown) => rebaseView(oldBase, shown, newBase));
  }

  flushGrid(): void {
    this.gridClock.cancel();
    this.burstWord = null;
    const from = this.base();
    if (from) {
      const writes = cellWrites(from.grid, serializeGrid(this.view.grid));
      if (writes.length > 0) this.queue.add({ kind: "cells", writes });
    }
    this.options.onChange();
  }

  flushHints(): void {
    this.hintClock.cancel();
    const from = this.base();
    if (from?.phase === "hints") {
      for (const { key, text } of hintChanges(from.hints, this.view.hints)) this.queue.add({ kind: "hint", key, text });
    }
    this.options.onChange();
  }

  flushTitle(): void {
    this.titleClock.cancel();
    const from = this.base();
    const title = from ? titleChange(from.title, this.view.title) : null;
    if (title !== null) this.queue.add({ kind: "title", title });
    this.options.onChange();
  }

  /** Every burst finalizes. */
  flushAll(): void {
    this.flushGrid();
    this.flushHints();
    this.flushTitle();
  }

  /** A text field's blur: the hint and title bursts finalize. */
  flushText(): void {
    this.hintClock.finalize();
    this.titleClock.finalize();
  }

  /** Queues an operation of its own (a lock, Enter Hints, Start Over). */
  add(body: OperationBody): Operation {
    return this.queue.add(body);
  }

  settled(opId: string): Promise<Settlement | null> {
    return this.queue.settled(opId);
  }

  /** The operations not yet answered, oldest first, and the confirmed
   *  version: what Publish is pinned to. */
  snapshot(): { pendingIds: string[]; version: number } {
    return { pendingIds: this.queue.outbox.pending.map((op) => op.opId), version: this.queue.outbox.confirmed.version };
  }

  /** The confirmed state with the pending operations applied. */
  projected(): PuzzleContent {
    return projectOutbox(this.queue.outbox).content;
  }

  /** An earlier page's journal (a reload, a crash): its operations are
   *  re-sent with their own opIds and shown at once. */
  adoptJournal(): void {
    const store = storage();
    if (!store) return;
    const { ops, keys } = readJournal(store, this.options.puzzleId);
    if (ops.length === 0) return;
    const before = this.projected();
    this.queue.adopt(ops);
    removeJournalKeys(store, keys.filter((key) => !key.endsWith(`:${this.clientId}`)));
    const after = this.projected();
    this.options.showContent((shown) => rebaseView(before, shown, after));
  }

  /** The grid changed: an edit opens or extends the burst. Typing what a
   *  cell already holds, or undoing back to it, isn't a change. */
  gridChanged(grid: Grid, cursor: CursorState): void {
    const before = this.previousGrid;
    this.previousGrid = grid;
    if (before === grid) return;
    const from = this.base();
    if (!from || cellWrites(from.grid, serializeGrid(grid)).length === 0) {
      this.gridClock.cancel();
      this.burstWord = null;
      return;
    }
    const word = this.burstWord?.orientation === cursor.orientation ? this.burstWord : null;
    const cells = new Set(word?.cells ?? []);
    for (const coord of [...editedCells(before, grid), cursor.current]) {
      for (const cell of wouldBeWord(grid, coord, cursor.orientation) ?? [coord]) cells.add(cellKey(cell));
    }
    this.burstWord = { orientation: cursor.orientation, cells };
    this.gridClock.touch();
  }

  /** The cursor leaving the burst's word, or turning, finalizes it. */
  cursorMoved(cursor: CursorState): void {
    const word = this.burstWord;
    if (!word || !this.gridClock.isOpen) return;
    if (cursor.orientation !== word.orientation || !word.cells.has(cellKey(cursor.current))) this.gridClock.finalize();
  }

  hintsChanged(hints: Record<string, string>): void {
    if (this.previousHints === hints) return;
    this.previousHints = hints;
    const from = this.base();
    if (from && hintChanges(from.hints, hints).length > 0) this.hintClock.touch();
    else this.hintClock.cancel();
  }

  titleChanged(title: string): void {
    if (this.previousTitle === title) return;
    this.previousTitle = title;
    const from = this.base();
    if (from && titleChange(from.title, title) !== null) this.titleClock.touch();
    else this.titleClock.cancel();
  }

  /** Hidden or closed: every burst finalizes, and the first pending
   *  operation goes with keepalive. Leaving with anything unanswered warns,
   *  unless a server redirect is taking the page away (the journal keeps
   *  it). Returns the cleanup, which finalizes too (leaving the editor
   *  within the app: the queue carries on sending). */
  attachPage(): () => void {
    const onHidden = () => {
      if (document.visibilityState !== "hidden") return;
      this.flushAll();
      this.queue.leave();
    };
    const onPageHide = () => {
      this.flushAll();
      this.queue.leave();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      this.flushAll();
      if (this.queue.isLeaving || this.queue.outbox.pending.length === 0) return;
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      this.flushAll();
    };
  }

  /** The status line: anything typed or queued and not yet answered is
   *  saving; a failed send waiting to be tried again is retrying. */
  saveState(view: SavedView): SaveStatusState | null {
    const state = this.queue.queueState;
    if (state === "retrying") return "retrying";
    const from = projectOutbox(this.queue.outbox).content;
    const shown = viewContent(view);
    const isDraft = from.phase === shown.phase && (
      cellWrites(from.grid, shown.grid).length > 0 ||
      (shown.phase === "hints" && hintChanges(from.hints, shown.hints).length > 0) ||
      titleChange(from.title, shown.title) !== null
    );
    if (state === "saving" || isDraft) return "saving";
    return this.queue.hasAnswered ? "saved" : null;
  }
}
