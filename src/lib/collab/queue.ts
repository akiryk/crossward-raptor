// Epic 24 (24-S3): a tab's operation queue. It sends one operation at a
// time, in the order they were made, and the next only once the server has
// answered for the one before. An operation the server couldn't answer for
// (a network failure, or `busy`) is re-sent with the same `opId` after a
// growing delay, so it is applied at most once. Every change to the pending
// operations is journaled. The commit, the keepalive send, the journal and
// the timers are passed in; nothing here touches React or the DOM.

import type { RefusalCode } from './apply';
import type { BurstTimers } from './burst';
import type { CommitOutcome } from './commit';
import type { Operation, OperationBody } from './operation';
import type { CommittedOperation } from './catchup';
import {
  applyCommitted, applySnapshot, enqueue, makeOperation, settle, type Confirmed, type Outbox, type Settlement,
} from './outbox';

/** Re-sending waits 1 s, 2 s, 4 s, 8 s, then 15 s each time. */
export const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

/** What the queue is doing: nothing to send, sending, or waiting to re-send
 *  after a failure. */
export type QueueState = 'idle' | 'saving' | 'retrying';

/** Why an operation was refused: the commit path's codes, `not-found` (no
 *  puzzle the builder can edit) and `invalid` (malformed: the server
 *  wouldn't record it). */
export type QueueRefusalCode = RefusalCode | 'not-found';

export interface QueueDeps {
  /** Commits one operation (the `commitOperation` action). */
  readonly send: (op: Operation) => Promise<CommitOutcome>;
  /** Sends one operation as the page is left (the keepalive route). */
  readonly keepalive?: (op: Operation) => void;
  /** Persists the pending operations (the journal). */
  readonly journal?: (pending: readonly Operation[]) => void;
  /** Called after every change of the outbox or the state. */
  readonly onChange?: () => void;
  /** Called when an operation is refused, with the outbox before and after
   *  it was dropped. */
  readonly onRefused?: (op: Operation, code: QueueRefusalCode, before: Outbox, after: Outbox) => void;
  /** 24-S4: an operation was accepted as a version past the next one the
   *  confirmed state needs: others committed in between, to catch up on. */
  readonly onBehind?: () => void;
  readonly timers?: BurstTimers;
  readonly retryDelaysMs?: readonly number[];
}

const defaultTimers: BurstTimers = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/** A Next.js redirect thrown by a server action (no session, or a tab whose
 *  build is out of date): the page is being navigated away. */
export function isNavigationError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
}

export class OperationQueue {
  private state: Outbox;
  private inFlight: string | null = null;
  private retry: unknown = null;
  private failures = 0;
  private leaving = false;
  private readonly waiters = new Map<string, ((settlement: Settlement) => void)[]>();
  /** The answers given this session, by `opId` (the latest 500). */
  private readonly answers = new Map<string, Settlement>();
  private readonly idleWaiters: (() => void)[] = [];

  constructor(
    initial: Outbox,
    private readonly ids: { readonly puzzleId: string; readonly clientId: string; readonly newOpId: () => string },
    private readonly deps: QueueDeps
  ) {
    this.state = initial;
  }

  get outbox(): Outbox {
    return this.state;
  }

  get queueState(): QueueState {
    if (this.retry !== null) return 'retrying';
    return this.state.pending.length > 0 ? 'saving' : 'idle';
  }

  /** Whether the server has answered for any operation this session. */
  get hasAnswered(): boolean {
    return this.answers.size > 0;
  }

  /** Whether the page is being navigated away by a server redirect. */
  get isLeaving(): boolean {
    return this.leaving;
  }

  /** Makes, journals and queues an operation; returns it. */
  add(body: OperationBody): Operation {
    const op = makeOperation(this.state, body, { ...this.ids, opId: this.ids.newOpId() });
    this.update(enqueue(this.state, op));
    this.pump();
    return op;
  }

  /** Queues operations journaled by an earlier page, unchanged (their own
   *  `opId`, epoch and base version), ahead of anything made since. */
  adopt(ops: readonly Operation[]): void {
    const known = new Set(this.state.pending.map((op) => op.opId));
    const fresh = ops.filter((op) => !known.has(op.opId));
    if (fresh.length === 0) return;
    const inFlight = this.state.pending.filter((op) => op.opId === this.inFlight);
    const rest = this.state.pending.filter((op) => op.opId !== this.inFlight);
    this.update({ ...this.state, pending: [...inFlight, ...fresh, ...rest] });
    this.pump();
  }

  /** Resolves with the server's answer for `opId`: at once if it has been
   *  answered, null if it was never queued. */
  settled(opId: string): Promise<Settlement | null> {
    const answer = this.answers.get(opId);
    if (answer) return Promise.resolve(answer);
    if (!this.state.pending.some((op) => op.opId === opId)) return Promise.resolve(null);
    return new Promise((resolve) => {
      this.waiters.set(opId, [...(this.waiters.get(opId) ?? []), resolve]);
    });
  }

  /** Resolves once nothing is pending. */
  whenIdle(): Promise<void> {
    if (this.state.pending.length === 0) return Promise.resolve();
    return new Promise((resolve) => this.idleWaiters.push(resolve));
  }

  /** The page is being left: the first pending operation is sent with
   *  keepalive. Its answer is never seen, so it proves nothing; the journal
   *  still holds it. */
  leave(): void {
    const head = this.state.pending[0];
    if (head) this.deps.keepalive?.(head);
  }

  /** 24-S4: operations committed on the server, in version order, applied
   *  to the confirmed state (`applyCommitted`). This tab's own operations
   *  among them are answered as accepted (their waiters too) and never sent
   *  again; a retry waiting on one of them is called off. Returns whether
   *  the confirmed state diverged (then the caller reloads the snapshot). */
  catchUp(ops: readonly CommittedOperation[]): boolean {
    const result = applyCommitted(this.state, ops);
    if (result.outbox !== this.state) this.update(result.outbox);
    for (const { opId, version } of result.settled) this.answered(opId, { status: 'accepted', version });
    if (result.settled.length > 0) this.recover();
    return result.diverged;
  }

  /** 24-S4: the puzzle as stored, when the log can't catch the tab up
   *  (`applySnapshot`). */
  resync(snapshot: Confirmed): void {
    const next = applySnapshot(this.state, snapshot);
    if (next !== this.state) this.update(next);
  }

  /** Sends the first pending operation now, if nothing is in flight. A
   *  waiting retry is brought forward. */
  flush(): void {
    if (this.retry !== null) {
      (this.deps.timers ?? defaultTimers).clearTimeout(this.retry);
      this.retry = null;
    }
    this.pump();
  }

  private update(next: Outbox): void {
    const changedPending = next.pending !== this.state.pending;
    this.state = next;
    if (changedPending) this.deps.journal?.(next.pending);
    this.deps.onChange?.();
  }

  private pump(): void {
    if (this.inFlight !== null || this.retry !== null || this.leaving) return;
    const head = this.state.pending[0];
    if (!head) {
      for (const resolve of this.idleWaiters.splice(0)) resolve();
      return;
    }
    this.inFlight = head.opId;
    this.deps.onChange?.();
    this.deps.send(head).then(
      (outcome) => this.answer(head, outcome),
      (error) => this.fail(head, error)
    );
  }

  private answer(op: Operation, outcome: CommitOutcome): void {
    this.inFlight = null;
    switch (outcome.status) {
      case 'accepted':
        this.done(op, { status: 'accepted', version: outcome.version });
        return;
      case 'refused':
        this.done(op, { status: 'refused', code: outcome.code });
        return;
      case 'invalid':
        this.done(op, { status: 'refused', code: 'invalid' });
        return;
      case 'not-found':
        this.done(op, { status: 'refused', code: 'not-found' });
        return;
      case 'busy':
        this.retryUnlessCaughtUp(op);
        return;
    }
  }

  private fail(op: Operation, error: unknown): void {
    this.inFlight = null;
    if (isNavigationError(error)) {
      // The page is going; the journal keeps the operation for the next one.
      this.leaving = true;
      this.deps.onChange?.();
      return;
    }
    this.retryUnlessCaughtUp(op);
  }

  /** 24-S4: an operation catching up showed committed needs no retry. */
  private retryUnlessCaughtUp(op: Operation): void {
    if (this.state.pending.some((candidate) => candidate.opId === op.opId)) {
      this.scheduleRetry();
      return;
    }
    this.failures = 0;
    this.pump();
  }

  /** A retry waiting for an operation no longer pending is called off. */
  private recover(): void {
    if (this.retry === null) return;
    (this.deps.timers ?? defaultTimers).clearTimeout(this.retry);
    this.retry = null;
    this.failures = 0;
    this.deps.onChange?.();
    this.pump();
  }

  private answered(opId: string, settlement: Settlement): void {
    this.answers.set(opId, settlement);
    if (this.answers.size > 500) this.answers.delete(this.answers.keys().next().value as string);
    for (const resolve of this.waiters.get(opId) ?? []) resolve(settlement);
    this.waiters.delete(opId);
  }

  private scheduleRetry(): void {
    const delays = this.deps.retryDelaysMs ?? RETRY_DELAYS_MS;
    const delay = delays[Math.min(this.failures, delays.length - 1)];
    this.failures++;
    this.retry = (this.deps.timers ?? defaultTimers).setTimeout(() => {
      this.retry = null;
      this.pump();
    }, delay);
    this.deps.onChange?.();
  }

  private done(op: Operation, settlement: Settlement): void {
    this.failures = 0;
    const before = this.state;
    const next = settle(this.state, op.opId, settlement);
    this.update(next);
    if (settlement.status === 'refused' && next !== before) this.deps.onRefused?.(op, settlement.code, before, this.state);
    if (settlement.status === 'accepted' && (next.acknowledged?.length ?? 0) > 0) this.deps.onBehind?.();
    this.answered(op.opId, settlement);
    this.pump();
  }
}
