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
import type { CatchUp } from "../../lib/collab/catchup";
import { CatchUpPoller, parseCatchUp, type PollOutcome } from "../../lib/collab/poller";
import { readJournal, removeJournalKeys, writeJournal, type JournalStorage } from "../../lib/collab/journal";
import { refusalNotice, type RefusalNotice } from "../../lib/collab/notice";
import type { CellWrite, Operation, OperationBody } from "../../lib/collab/operation";
import type { Coord } from "../../engine/grid";
import {
  gridConflict, hintConflict, leftEntry, recordBurst, recordHint, type IncomingOp, type RecentBurst, type RecentHint,
} from "../../lib/collab/conflict";
import type { Builder } from "../../lib/collab/presence";
import { PresenceNotes, operationNote } from "../../lib/collab/session";
import {
  cellWrites, hintChanges, projectOutbox, rebaseView, titleChange, type Confirmed, type Outbox, type Settlement,
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

/** 24-S5: the catch-up was answered with a redirect: the session gate's
 *  (no session, or no username). */
class SignedOut extends Error {}

/** 24-S7: what a heartbeat's answer adds: who else is present, and who
 *  committed the operations it returns. Null when the answer has neither. */
interface SessionAnswer {
  readonly present: readonly Builder[] | null;
  readonly authors: ReadonlyMap<string, Builder>;
}

function isBuilder(value: unknown): value is Builder {
  if (typeof value !== "object" || value === null) return false;
  const { userId, username } = value as Record<string, unknown>;
  return typeof userId === "string" && (username === null || typeof username === "string");
}

function parseSession(input: unknown): SessionAnswer {
  const body = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const present = Array.isArray(body.present) && body.present.every(isBuilder) ? body.present as Builder[] : null;
  const authors = new Map<string, Builder>();
  if (typeof body.authors === "object" && body.authors !== null) {
    for (const [opId, author] of Object.entries(body.authors as Record<string, unknown>)) {
      if (isBuilder(author)) authors.set(opId, author);
    }
  }
  return { present, authors };
}

/** 24-S7: a tab going away (hidden) or leaving (closed), with keepalive. */
function sendPresence(puzzleId: string, clientId: string, state: "away" | "leave"): void {
  try {
    void fetch(`/api/puzzles/${encodeURIComponent(puzzleId)}/presence`, {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId, state }),
    }).catch(() => undefined);
  } catch {
    // Best effort: the row expires by itself.
  }
}

/** 24-S4: the catch-up read (the route's GET), from the confirmed version,
 *  or the snapshot for null. Anything but an answer is a failure, retried.
 *  24-S5: a 400 (`invalid`) is an answer too, and a redirect is `SignedOut`. */
async function fetchCatchUp(
  puzzleId: string, clientId: string, since: number | null,
): Promise<{ result: CatchUp; session: SessionAnswer }> {
  // 24-S7: asked as this tab, which makes it the tab's heartbeat.
  const headers: Record<string, string> = { "x-client-id": clientId };
  if (since !== null) headers["x-catch-up-since"] = String(since);
  const response = await fetch(`/api/puzzles/${encodeURIComponent(puzzleId)}/operations`, {
    headers,
    cache: "no-store",
    redirect: "manual",
  });
  if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) throw new SignedOut();
  if (response.status !== 200 && response.status !== 404 && response.status !== 400) throw new Error(`catch-up: ${response.status}`);
  const body: unknown = await response.json();
  const result = parseCatchUp(body, puzzleId);
  if (!result) throw new Error("catch-up: malformed answer");
  return { result, session: parseSession(body) };
}

const cellKey = ({ col, row }: { col: number; row: number }) => `${col},${row}`;

/** The cells whose stored value differs between two grids of one shape. */
function changedCells(before: PuzzleContent, after: PuzzleContent): Set<string> {
  const changed = new Set<string>();
  const a = before.grid;
  const b = after.grid;
  if (a.rows !== b.rows || a.cols !== b.cols) return changed;
  for (let row = 0; row < a.rows; row++) {
    for (let col = 0; col < a.cols; col++) {
      if (JSON.stringify(a.cells[row][col]) !== JSON.stringify(b.cells[row][col])) changed.add(cellKey({ col, row }));
    }
  }
  return changed;
}

/** The grid with the writes applied to its white cells. */
function withWrites(grid: PuzzleContent["grid"], writes: readonly CellWrite[]): PuzzleContent["grid"] {
  const cells = grid.cells.map((line) => line.map((cell) => ({ ...cell })));
  for (const { col, row, value } of writes) {
    if (cells[row]?.[col]?.kind === "active") cells[row][col] = { kind: "active", letter: value };
  }
  return { ...grid, cells };
}

const sameContent = (a: PuzzleContent, b: PuzzleContent) => JSON.stringify(a) === JSON.stringify(b);

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

/** 24-S5: why the editor can no longer edit the puzzle. */
export type AccessLoss =
  /** Removed from it, or it was deleted (not told apart). */
  | { readonly kind: "removed" }
  /** It was published elsewhere. */
  | { readonly kind: "published"; readonly publishedAt: Date; readonly visibility: "private" | "public" };

const LOSS_MESSAGES: Record<AccessLoss["kind"], string> = {
  removed: "This puzzle is no longer available to you: it was deleted, or you were removed from it. Nothing more can be saved here.",
  published: "This puzzle was published, so it can't be edited any more.",
};

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
  /** 24-S5: the puzzle is already published: nothing to poll for. */
  readonly published?: boolean;
  /** 24-S5: the editor lost access (once); it becomes read-only. */
  readonly onAccessLost?: (loss: AccessLoss) => void;
  /** 24-S5: the session is gone; the page reloads (to the sign-in). */
  readonly onSignedOut?: () => void;
  /** 24-S7: the signed-in account, which operation authors are compared
   *  with (my own account's other tabs raise nothing). */
  readonly userId?: string;
  /** 24-S7: a note for the session panel. */
  readonly onSessionNote?: (text: string) => void;
  /** 24-S7: my recent work was superseded: outline these cells, or
   *  highlight this hint. */
  readonly onConflict?: (conflict: { readonly cells: readonly Coord[] } | { readonly hintKey: string }) => void;
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
  /** 24-S4: polls for committed operations while the page is visible. */
  private readonly poller: CatchUpPoller;
  /** 24-S4: the cells a remote change is about to show, so the grid's
   *  change isn't taken for the builder's edit. */
  private remoteCells = new Set<string>();
  /** 24-S5: access lost, or published here: no more polling or sending. */
  private stopped = false;
  /** 24-S5: this editor's own Publish is in flight. */
  private publishing = false;
  /** 24-S5: the session is gone and the page is reloading. */
  private signingOut = false;
  /** 24-S7: who else is present, from one catch-up to the next. */
  private readonly presenceNotes = new PresenceNotes();
  /** 24-S7: the latest answer's session part, for `caughtUp`. */
  private session: SessionAnswer = { present: null, authors: new Map() };
  /** 24-S7: my latest grid burst and hint, which a remote edit could
   *  supersede (D2). */
  private recentBurst: (RecentBurst & { readonly opId: string }) | null = null;
  private recentHint: (RecentHint & { readonly opId: string }) | null = null;

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
        onBehind: () => this.poller.pollNow(),
        onLost: (code) => (code === "not-found" ? this.lose({ kind: "removed" }) : this.publishedElsewhere()),
      },
    );
    this.poller = new CatchUpPoller({
      fetch: async (since) => {
        try {
          const { result, session } = await fetchCatchUp(puzzleId, this.clientId, since);
          this.session = session;
          return result;
        } catch (error) {
          if (error instanceof SignedOut) this.signedOut();
          throw error;
        }
      },
      since: () => this.queue.outbox.confirmed.version,
      apply: (result) => this.caughtUp(result),
      isVisible: () => document.visibilityState === "visible",
    });
  }

  /** 24-S4: what the catch-up read brought. Committed operations (or the
   *  snapshot) advance the confirmed state; the view is rebased, so the
   *  builder's draft stays and nothing local (the cursor, Preview, focus)
   *  moves. Before another tab's Start Over or Enter Hints is applied, every
   *  burst finalizes: the draft becomes operations of the state it was made
   *  in, which the server judges (a reset refuses them, D5; Hints takes
   *  only what fits, D4), each visibly. */
  private caughtUp(result: CatchUp): PollOutcome {
    if (this.stopped) return "stop";
    if (result.status === "not-found" || result.status === "invalid") {
      this.lose({ kind: "removed" });
      return "stop";
    }
    if (result.status === "published") {
      // This editor's own Publish decides (endPublish).
      if (this.publishing) return "ok";
      const snapshot = { content: result.content, version: result.version, resetEpoch: result.resetEpoch };
      this.lose({ kind: "published", publishedAt: result.publishedAt, visibility: result.visibility }, snapshot);
      return "stop";
    }
    const { outbox } = this.queue;
    const own = new Set([...outbox.pending, ...(outbox.acknowledged ?? [])].map((op) => op.opId));
    // 24-S7: who joined or left.
    const { present, authors } = this.session;
    if (present) for (const note of this.presenceNotes.update(present, Date.now())) this.options.onSessionNote?.(note);
    if (result.status === "ops") {
      const fresh = result.ops.filter((op) => op.version > outbox.confirmed.version);
      if (fresh.length === 0) return "ok";
      if (fresh.some((op) => (op.kind === "startOver" || op.kind === "enterHints") && !own.has(op.opId))) this.flushAll();
      const before = this.projected();
      const diverged = this.queue.catchUp(fresh);
      const after = this.projected();
      this.showRemote(before, after);
      this.noticeSession(fresh.map((op) => ({ op, author: authors.get(op.opId) ?? null, own: own.has(op.opId) })), before, after);
      return diverged ? "resync" : "ok";
    }
    if (result.version <= outbox.confirmed.version) return "ok";
    const { confirmed } = outbox;
    if (result.resetEpoch !== confirmed.resetEpoch || result.content.phase !== confirmed.content.phase) this.flushAll();
    const before = this.projected();
    this.queue.resync({ content: result.content, version: result.version, resetEpoch: result.resetEpoch });
    this.showRemote(before, this.projected());
    return "ok";
  }

  /** 24-S7: what the session panel and the grid say about operations a
   *  catch-up brought: another account's Enter Hints or Start Over, and my
   *  recent work superseded (D2). Only when the answer named their authors:
   *  my own account's other tabs raise nothing. */
  private noticeSession(ops: readonly IncomingOp[], before: PuzzleContent, after: PuzzleContent): void {
    const self = this.options.userId;
    if (self === undefined || !ops.some((incoming) => incoming.author !== null)) return;
    const others = (incoming: IncomingOp) => !incoming.own && incoming.author !== null && incoming.author.userId !== self;
    for (const incoming of ops) {
      const note = others(incoming) ? operationNote(incoming.op, incoming.author) : null;
      if (note) this.options.onSessionNote?.(note);
    }
    const input = { before, after, ops, self, cursor: this.view.cursor.current, now: Date.now() };
    const grid = gridConflict({ ...input, recent: this.recentBurst });
    if (grid) {
      this.recentBurst = null;
      this.options.onConflict?.({ cells: grid.cells });
      this.options.onSessionNote?.(grid.message);
    }
    const hint = hintConflict({ ...input, recent: this.recentHint });
    if (hint) {
      this.recentHint = null;
      this.options.onConflict?.({ hintKey: hint.key });
      this.options.onSessionNote?.(hint.message);
    }
  }

  /** 24-S5: the queue halts for good; every burst finalizes and every
   *  pending operation is dropped, each explained with its input kept. The
   *  journal empties with the pending list. */
  private dropEverything(code: QueueRefusalCode, explain?: () => void): void {
    this.queue.halt();
    this.flushAll();
    explain?.();
    this.queue.dropAll(code);
  }

  /** 24-S5: a commit was refused as published: nothing more is sent, and
   *  the catch-up, asked at once, brings the publication. */
  private publishedElsewhere(): void {
    if (this.stopped || this.queue.isHalted) return;
    this.dropEverything("published");
    this.poller.pollNow();
  }

  /** 24-S5: access is lost, once: polling and sending stop, the loss is
   *  explained, unsaved input is kept in notes, and the editor is told. */
  private lose(loss: AccessLoss, stored?: Confirmed): void {
    if (this.stopped) return;
    this.stopped = true;
    this.poller.stop();
    const notifyLoss = () => this.options.notify(`access-${loss.kind}`, { message: LOSS_MESSAGES[loss.kind], input: null });
    if (loss.kind === "removed") {
      this.dropEverything("not-found", notifyLoss);
    } else {
      // 24-S6: always, even after a `published` refusal halted the queue:
      // edits made since are dropped and explained now.
      this.dropEverything("published");
      notifyLoss();
    }
    if (stored) {
      const before = this.projected();
      this.queue.resync(stored);
      this.showRemote(before, this.projected());
    }
    this.options.onAccessLost?.(loss);
  }

  /** 24-S5: the session is gone. Nothing is retried; the work stays
   *  journaled for the next open, and the page reloads without warning. */
  private signedOut(): void {
    if (this.signingOut) return;
    this.signingOut = true;
    this.poller.stop();
    this.queue.halt();
    this.flushAll();
    this.options.onSignedOut?.();
  }

  /** 24-S5: this editor's own Publish is about to be sent: a publication
   *  seen by the catch-up meanwhile is its own, not a loss. */
  beginPublish(): void {
    this.publishing = true;
  }

  /** 24-S5: this editor's own Publish was answered. Published, polling and
   *  sending stop quietly. */
  endPublish(published: boolean): void {
    this.publishing = false;
    if (!published || this.stopped) return;
    this.stopped = true;
    this.poller.stop();
    this.queue.halt();
  }

  /** Shows a change of the projection from elsewhere, keeping the draft.
   *  Not while Enter Hints awaits the server (the view isn't in the
   *  projection's phase): its confirmation shows the projection. */
  private showRemote(before: PuzzleContent, after: PuzzleContent): void {
    if (sameContent(before, after) || viewContent(this.view).phase !== before.phase) return;
    this.remoteCells = changedCells(before, after);
    this.options.showContent((shown) => rebaseView(before, shown, after));
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
    // 24-S7: refused work isn't there to be superseded.
    if (this.recentBurst?.opId === op.opId) this.recentBurst = null;
    if (this.recentHint?.opId === op.opId) this.recentHint = null;
    const view = viewContent(this.view);
    // The refused letters as typed, even where the view no longer shows
    // them (24-S4: a Start Over from elsewhere left them out).
    const typed = op.kind === "cells" ? withWrites(view.grid, op.writes) : view.grid;
    this.options.notify(op.opId, refusalNotice(op, code, typed, view.phase));
    // The grid shows the authoritative cells; edits still being typed stay.
    const oldBase = projectOutbox(before).content;
    const newBase = projectOutbox(after).content;
    this.options.showContent((shown) => rebaseView(oldBase, shown, newBase));
  }

  flushGrid(): void {
    this.gridClock.cancel();
    const orientation = (this.burstWord?.orientation ?? this.view.cursor.orientation) === "down" ? "down" : "across";
    this.burstWord = null;
    const from = this.base();
    if (from) {
      const writes = cellWrites(from.grid, serializeGrid(this.view.grid));
      if (writes.length > 0) {
        const op = this.queue.add({ kind: "cells", writes });
        // 24-S7: my latest burst, with the entry holding it (D2).
        const recent = recordBurst(this.projected(), writes, orientation, Date.now());
        this.recentBurst = { ...leftEntry(recent, this.view.cursor.current), opId: op.opId };
      }
    }
    this.options.onChange();
  }

  flushHints(): void {
    this.hintClock.cancel();
    const from = this.base();
    if (from?.phase === "hints") {
      for (const { key, text } of hintChanges(from.hints, this.view.hints)) {
        const op = this.queue.add({ kind: "hint", key, text });
        // 24-S7: my latest hint, with its entry (D8's clue conflicts).
        this.recentHint = { ...recordHint(this.projected(), key, text, Date.now()), opId: op.opId };
      }
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
    const remote = this.remoteCells;
    this.remoteCells = new Set();
    if (before === grid) return;
    const from = this.base();
    if (!from || cellWrites(from.grid, serializeGrid(grid)).length === 0) {
      this.gridClock.cancel();
      this.burstWord = null;
      return;
    }
    // 24-S4: a remote change shown under the draft neither extends the burst
    // nor joins its word.
    const edited = editedCells(before, grid).filter((coord) => !remote.has(cellKey(coord)));
    if (remote.size > 0 && edited.length === 0) return;
    const word = this.burstWord?.orientation === cursor.orientation ? this.burstWord : null;
    const cells = new Set(word?.cells ?? []);
    for (const coord of [...edited, cursor.current]) {
      for (const cell of wouldBeWord(grid, coord, cursor.orientation) ?? [coord]) cells.add(cellKey(cell));
    }
    this.burstWord = { orientation: cursor.orientation, cells };
    this.gridClock.touch();
  }

  /** The cursor leaving the burst's word, or turning, finalizes it. */
  cursorMoved(cursor: CursorState): void {
    // 24-S7: leaving the entry makes recent work recent only by time.
    if (this.recentBurst) this.recentBurst = { ...leftEntry(this.recentBurst, cursor.current), opId: this.recentBurst.opId };
    if (this.recentHint) this.recentHint = { ...leftEntry(this.recentHint, cursor.current), opId: this.recentHint.opId };
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
   *  within the app: the queue carries on sending). 24-S4: it also runs
   *  the catch-up polling, which stops with it. */
  attachPage(): () => void {
    const onHidden = () => {
      // 24-S4: visible again, catch up at once; hidden, stop polling.
      if (document.visibilityState === "visible") {
        this.poller.pollNow();
        this.queue.flush();
        return;
      }
      if (document.visibilityState !== "hidden") return;
      this.poller.pause();
      this.flushAll();
      this.queue.leave();
      // 24-S7: hidden, the tab stays present a while without polling.
      this.sendPresence("away");
    };
    // 24-S4: back online, catch up and send at once.
    const onOnline = () => {
      this.poller.pollNow();
      this.queue.flush();
    };
    const onPageHide = () => {
      this.flushAll();
      this.queue.leave();
      // 24-S7: closing, the tab leaves the session.
      this.sendPresence("leave");
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      this.flushAll();
      if (this.queue.isLeaving || this.signingOut || this.queue.outbox.pending.length === 0) return;
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("online", onOnline);
    // 24-S5: a published puzzle has nothing to catch up on.
    if (!this.options.published && !this.stopped) this.poller.start();
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("online", onOnline);
      this.poller.stop();
      this.flushAll();
    };
  }

  /** 24-S7: tells the server this tab is away or gone, unless nothing is
   *  being followed any more (published, lost, signing out). */
  private sendPresence(state: "away" | "leave"): void {
    if (this.options.published || this.stopped || this.signingOut) return;
    sendPresence(this.options.puzzleId, this.clientId, state);
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
