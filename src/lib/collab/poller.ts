// Epic 24 (24-S4): live sync by polling (D9). While the editor is visible
// it asks for the operations committed since its confirmed version about
// once a second, and at once on becoming visible again, coming back online,
// or learning that it is behind. One request at a time; a failed one is
// tried again after a growing delay. The request, the timers and visibility
// are passed in; nothing here touches React or the DOM.

import type { BurstTimers } from './burst';
import type { CatchUp, CommittedOperation } from './catchup';
import { parseOperation } from './operation';
import type { PuzzleContent } from './apply';

/** About once a second while visible (D9). */
export const POLL_INTERVAL_MS = 1000;
/** After a failed request: 1 s, 2 s, 4 s, 8 s, then 15 s each time. */
export const POLL_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

/** What the caller made of an answer: carry on, ask for the snapshot
 *  next (the confirmed state diverged), or stop polling (the puzzle is
 *  gone, or the request was malformed). */
export type PollOutcome = 'ok' | 'resync' | 'stop';

export interface PollerDeps {
  /** The catch-up read from `since`, or the snapshot for null. */
  readonly fetch: (since: number | null) => Promise<CatchUp>;
  /** The version the confirmed state is at. */
  readonly since: () => number;
  readonly apply: (result: CatchUp) => PollOutcome;
  readonly isVisible: () => boolean;
  readonly timers?: BurstTimers;
  readonly intervalMs?: number;
  readonly retryDelaysMs?: readonly number[];
}

const defaultTimers: BurstTimers = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class CatchUpPoller {
  private timer: unknown = null;
  private inFlight = false;
  private again = false;
  private wantSnapshot = false;
  private failures = 0;
  private stopped = true;

  constructor(private readonly deps: PollerDeps) {}

  private get timers(): BurstTimers {
    return this.deps.timers ?? defaultTimers;
  }

  /** Starts polling, at once. */
  start(): void {
    this.stopped = false;
    this.pollNow();
  }

  /** Stops for good (until started again). */
  stop(): void {
    this.stopped = true;
    this.cancel();
  }

  /** Hidden: no more requests until `pollNow` (the one in flight finishes). */
  pause(): void {
    this.cancel();
  }

  /** Asks now (visible again, back online, behind): a waiting request,
   *  even a retry's, is brought forward; one in flight is followed by
   *  another at once. Nothing while hidden or stopped. */
  pollNow(): void {
    if (this.stopped) return;
    if (this.inFlight) {
      this.again = true;
      return;
    }
    this.cancel();
    if (!this.deps.isVisible()) return;
    void this.run();
  }

  /** The next request asks for the snapshot. */
  resync(): void {
    this.wantSnapshot = true;
    this.pollNow();
  }

  private cancel(): void {
    if (this.timer === null) return;
    this.timers.clearTimeout(this.timer);
    this.timer = null;
  }

  private async run(): Promise<void> {
    this.inFlight = true;
    const snapshot = this.wantSnapshot;
    this.wantSnapshot = false;
    let delay = this.deps.intervalMs ?? POLL_INTERVAL_MS;
    try {
      const result = await this.deps.fetch(snapshot ? null : this.deps.since());
      this.failures = 0;
      const outcome = this.deps.apply(result);
      if (outcome === 'stop') this.stopped = true;
      if (outcome === 'resync') {
        this.wantSnapshot = true;
        this.again = true;
      }
    } catch {
      if (snapshot) this.wantSnapshot = true;
      const delays = this.deps.retryDelaysMs ?? POLL_RETRY_DELAYS_MS;
      delay = delays[Math.min(this.failures, delays.length - 1)];
      this.failures++;
    }
    this.inFlight = false;
    if (this.again) {
      this.again = false;
      this.failures = 0;
      this.pollNow();
      return;
    }
    if (this.stopped || !this.deps.isVisible()) return;
    this.timer = this.timers.setTimeout(() => {
      this.timer = null;
      this.pollNow();
    }, delay);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isContent(value: unknown): value is PuzzleContent {
  if (!isRecord(value) || !isRecord(value.grid) || !isRecord(value.hints)) return false;
  const { grid } = value;
  if (!isCount(grid.rows) || !isCount(grid.cols) || !Array.isArray(grid.cells) || grid.cells.length !== grid.rows) return false;
  if (!grid.cells.every((row) => Array.isArray(row) && row.length === grid.cols)) return false;
  if (!Object.values(value.hints).every((text) => typeof text === 'string')) return false;
  return typeof value.title === 'string' && (value.phase === 'grid' || value.phase === 'hints');
}

/** Checks an answer from the catch-up route; anything malformed is null
 *  (treated as a failed request). */
export function parseCatchUp(input: unknown, puzzleId: string): CatchUp | null {
  if (!isRecord(input)) return null;
  if (input.status === 'not-found' || input.status === 'invalid') return { status: input.status };
  if (input.status === 'snapshot') {
    if (!isCount(input.version) || !isCount(input.resetEpoch) || !isContent(input.content)) return null;
    return { status: 'snapshot', version: input.version, resetEpoch: input.resetEpoch, content: input.content };
  }
  // 24-S5: a published puzzle, as stored, with its publication.
  if (input.status === 'published') {
    if (!isCount(input.version) || !isCount(input.resetEpoch) || !isContent(input.content)) return null;
    const publishedAt = typeof input.publishedAt === 'string' || input.publishedAt instanceof Date ? new Date(input.publishedAt) : null;
    if (!publishedAt || Number.isNaN(publishedAt.getTime())) return null;
    if (input.visibility !== 'private' && input.visibility !== 'public') return null;
    return {
      status: 'published', version: input.version, resetEpoch: input.resetEpoch, content: input.content,
      publishedAt, visibility: input.visibility,
    };
  }
  if (input.status !== 'ops' || !Array.isArray(input.ops)) return null;
  const ops: CommittedOperation[] = [];
  for (const raw of input.ops) {
    const parsed = parseOperation(raw);
    if (!parsed.ok || parsed.op.puzzleId !== puzzleId || !isRecord(raw) || !isCount(raw.version)) return null;
    ops.push({ ...parsed.op, version: raw.version });
  }
  return { status: 'ops', ops };
}
