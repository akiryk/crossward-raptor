// Epic 24 (24-S3): the editor's side of saving by operations. A tab keeps
// the confirmed state (what the server has acknowledged) apart from its
// pending operations; what the builder sees is the confirmed state with the
// pending operations applied, plus the edits of the burst being typed (the
// draft). Pure: no React, DOM, storage, network or timers, and inputs are
// never mutated. 24-S4: committed operations caught up from the server
// (`applyCommitted`, `applySnapshot`) advance the confirmed state, and the
// editor rebases the view with `rebaseView`.

import { normalizeTitle } from '@/lib/puzzle-title';
import type { SerializedGrid } from '@/lib/puzzle-storage';
import { applyOperation, epochAfter, evaluateOperation, type PuzzleContent, type RefusalCode } from './apply';
import type { CommittedOperation } from './catchup';
import type { CellWrite, Operation, OperationBody } from './operation';

/** What the server has acknowledged. */
export interface Confirmed {
  readonly content: PuzzleContent;
  /** The puzzle's version as of `content`. */
  readonly version: number;
  /** Its reset generation as of `content`. */
  readonly resetEpoch: number;
}

/** A tab's confirmed state and its operations not yet acknowledged, in the
 *  order they were made (and are sent). */
export interface Outbox {
  readonly confirmed: Confirmed;
  readonly pending: readonly Operation[];
  /** 24-S4: operations the server accepted as a version past the next one
   *  the confirmed state needs (others committed in between, not yet caught
   *  up). They are no longer sent, but still shown, until catching up
   *  reaches them. Oldest first; absent when there are none. */
  readonly acknowledged?: readonly CommittedOperation[];
}

/** The server's answer for one operation, as far as the outbox is
 *  concerned: committed as `version`, or refused for good. */
export type Settlement =
  | { readonly status: 'accepted'; readonly version: number }
  | { readonly status: 'refused'; readonly code: RefusalCode | 'not-found' };

/** The builder is the owner (S3: only owners reach the editor; S5 passes the
 *  real answer). */
const OWNER = { isOwner: true };

/** The confirmed state with the pending operations applied, in order. One
 *  that wouldn't fit (the server would refuse it) is left out, as it will
 *  be. The epoch is the one an operation made now belongs to. */
export function projectOutbox(outbox: Outbox): { readonly content: PuzzleContent; readonly resetEpoch: number } {
  let content = outbox.confirmed.content;
  let resetEpoch = outbox.confirmed.resetEpoch;
  for (const op of [...(outbox.acknowledged ?? []), ...outbox.pending]) {
    const result = evaluateOperation({ ...content, resetEpoch, published: false }, op, OWNER);
    if (!result.ok) continue;
    content = result.content;
    resetEpoch = result.resetEpoch;
  }
  return { content, resetEpoch };
}

/** A new operation with its envelope: made in the epoch the pending
 *  operations lead to (after a pending Start Over, the new one), against the
 *  confirmed version. */
export function makeOperation(
  outbox: Outbox,
  body: OperationBody,
  ids: { readonly opId: string; readonly puzzleId: string; readonly clientId: string }
): Operation {
  return {
    ...body,
    opId: ids.opId,
    puzzleId: ids.puzzleId,
    clientId: ids.clientId,
    epoch: projectOutbox(outbox).resetEpoch,
    baseVersion: outbox.confirmed.version,
  } as Operation;
}

/** The outbox with the operation appended. */
export function enqueue(outbox: Outbox, op: Operation): Outbox {
  return { ...outbox, pending: [...outbox.pending, op] };
}

/** The outbox with `acknowledged` left out when empty. */
function withAcknowledged(outbox: Outbox, acknowledged: readonly CommittedOperation[]): Outbox {
  const { confirmed, pending } = outbox;
  return acknowledged.length > 0 ? { confirmed, pending, acknowledged } : { confirmed, pending };
}

/** The outbox once the server has answered for `opId`. An acceptance as
 *  the version after the confirmed one applies the operation to the
 *  confirmed state; one at or below it (a resend whose first commit the
 *  confirmed state already holds) changes nothing but the pending list. A
 *  refusal only drops the operation. 24-S4: an acceptance further ahead
 *  (others committed in between) is kept as acknowledged, for catching up
 *  to apply in its place. */
export function settle(outbox: Outbox, opId: string, settlement: Settlement): Outbox {
  const op = outbox.pending.find((candidate) => candidate.opId === opId);
  if (!op) return outbox;
  const pending = outbox.pending.filter((candidate) => candidate !== op);
  if (settlement.status === 'refused' || settlement.version <= outbox.confirmed.version) {
    return { ...outbox, pending };
  }
  const { confirmed } = outbox;
  if (settlement.version > confirmed.version + 1) {
    const acknowledged = [...(outbox.acknowledged ?? []), { ...op, version: settlement.version }]
      .sort((a, b) => a.version - b.version);
    return withAcknowledged({ ...outbox, pending }, acknowledged);
  }
  return withAcknowledged({
    pending,
    confirmed: {
      content: applyOperation(confirmed.content, op).content,
      version: settlement.version,
      resetEpoch: epochAfter(confirmed.resetEpoch, op),
    },
  }, outbox.acknowledged ?? []);
}

/** What applying caught-up operations did. `settled` are this tab's own
 *  operations (pending, or acknowledged ahead) that the log showed
 *  committed, with their versions; `diverged` means an operation didn't
 *  fit the confirmed state, which should never happen: the caller reloads
 *  the snapshot. */
export interface CatchUpResult {
  readonly outbox: Outbox;
  readonly settled: readonly { readonly opId: string; readonly version: number }[];
  readonly diverged: boolean;
}

/** The builder isn't known here; the server already checked who committed
 *  each operation. */
const ANYONE_ALLOWED = { isOwner: true };

/** The outbox after operations committed on the server (by anyone, this
 *  tab included), in version order. Each one the confirmed state doesn't
 *  hold yet is applied to it, in turn, if it is the next version; earlier
 *  ones are skipped, and a gap stops there (the next catch-up starts from
 *  the confirmed version). One of this tab's own operations is applied from
 *  the log too, and leaves the pending (or acknowledged) list, so it is
 *  never applied twice and never sent again. */
export function applyCommitted(outbox: Outbox, ops: readonly CommittedOperation[]): CatchUpResult {
  let { confirmed } = outbox;
  let pending = outbox.pending;
  let acknowledged = outbox.acknowledged ?? [];
  const settled: { opId: string; version: number }[] = [];
  for (const op of ops) {
    if (op.version <= confirmed.version) continue;
    if (op.version !== confirmed.version + 1) break;
    const result = evaluateOperation(
      { ...confirmed.content, resetEpoch: confirmed.resetEpoch, published: false }, op, ANYONE_ALLOWED,
    );
    if (!result.ok) {
      return { outbox: withAcknowledged({ confirmed, pending }, acknowledged), settled, diverged: true };
    }
    const { grid, hints, title, phase } = result.content;
    confirmed = { content: { grid, hints, title, phase }, version: op.version, resetEpoch: result.resetEpoch };
    if (pending.some((candidate) => candidate.opId === op.opId)) {
      pending = pending.filter((candidate) => candidate.opId !== op.opId);
      settled.push({ opId: op.opId, version: op.version });
    }
    acknowledged = acknowledged.filter((candidate) => candidate.opId !== op.opId);
  }
  acknowledged = acknowledged.filter((candidate) => candidate.version > confirmed.version);
  const changed = confirmed !== outbox.confirmed || pending !== outbox.pending ||
    acknowledged.length !== (outbox.acknowledged ?? []).length;
  return { outbox: changed ? withAcknowledged({ confirmed, pending }, acknowledged) : outbox, settled, diverged: false };
}

/** The outbox with the puzzle as stored for its confirmed state, when that
 *  is newer than the confirmed one (a snapshot older than what the tab
 *  holds changes nothing). Acknowledged operations it already holds leave;
 *  pending ones stay, to be answered by the server (one that had landed is
 *  answered with its first outcome, and then only dropped). */
export function applySnapshot(outbox: Outbox, snapshot: Confirmed): Outbox {
  if (snapshot.version <= outbox.confirmed.version) return outbox;
  const acknowledged = (outbox.acknowledged ?? []).filter((op) => op.version > snapshot.version);
  return withAcknowledged({ confirmed: snapshot, pending: outbox.pending }, acknowledged);
}

/** The cells the view changed from the base: each active cell (in both)
 *  whose value differs, row-major. Writing the value a cell already holds
 *  isn't a change. */
export function cellWrites(base: SerializedGrid, view: SerializedGrid): CellWrite[] {
  const writes: CellWrite[] = [];
  if (base.rows !== view.rows || base.cols !== view.cols) return writes;
  for (let row = 0; row < base.rows; row++) {
    for (let col = 0; col < base.cols; col++) {
      const before = base.cells[row][col];
      const after = view.cells[row][col];
      if (before.kind !== 'active' || after.kind !== 'active') continue;
      if (before.letter !== after.letter) writes.push({ col, row, value: after.letter });
    }
  }
  return writes;
}

/** The hints the view changed from the base, each with its whole text. */
export function hintChanges(
  base: Readonly<Record<string, string>>,
  view: Readonly<Record<string, string>>
): { key: string; text: string }[] {
  return Object.keys(view)
    .filter((key) => view[key] !== (Object.hasOwn(base, key) ? base[key] : undefined))
    .map((key) => ({ key, text: view[key] }));
}

/** The title to send, or null when the view's title is the base's once
 *  normalized as the server stores it. */
export function titleChange(base: string, view: string): string | null {
  return normalizeTitle(view) === base ? null : view;
}

/** The view after its base changed from `oldBase` to `newBase` (an
 *  operation refused, or, from S4, a remote one applied): the draft's
 *  edits, wherever the view differs from the old base, are kept on top of
 *  the new base; everything else is the new base's. */
export function rebaseView(oldBase: PuzzleContent, view: PuzzleContent, newBase: PuzzleContent): PuzzleContent {
  const sameShape = oldBase.grid.rows === newBase.grid.rows && oldBase.grid.cols === newBase.grid.cols &&
    view.grid.rows === newBase.grid.rows && view.grid.cols === newBase.grid.cols;
  const cells = newBase.grid.cells.map((line, row) => line.map((cell, col) => {
    if (!sameShape || cell.kind !== 'active') return { ...cell };
    const before = oldBase.grid.cells[row][col];
    const shown = view.grid.cells[row][col];
    const edited = before.kind === 'active' && shown.kind === 'active' && shown.letter !== before.letter;
    return edited ? { kind: 'active' as const, letter: shown.letter } : { ...cell };
  }));
  const grid: SerializedGrid = { ...newBase.grid, cells };
  const hints: Record<string, string> = { ...newBase.hints };
  for (const { key, text } of hintChanges(oldBase.hints, view.hints)) hints[key] = text;
  const title = titleChange(oldBase.title, view.title) === null ? newBase.title : view.title;
  return { grid, hints, title, phase: newBase.phase };
}
