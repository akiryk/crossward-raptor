// Epic 24 (24-S3): when a burst of edits is finished. A burst finalizes after
// 500 ms without an edit, or 2 s after its first edit however busy the
// typing (the maximum wait), or when the editor finalizes it itself (the
// cursor leaving the word, blur, a step button, Start Over, Publish, the
// page being hidden or closed). The timers are passed in, so tests drive
// them.

export const BURST_IDLE_MS = 500;
export const BURST_MAX_WAIT_MS = 2000;

export interface BurstTimers {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const browserTimers: BurstTimers = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class BurstClock {
  private idle: unknown = null;
  private max: unknown = null;

  constructor(
    private readonly onFinalize: () => void,
    private readonly options: { idleMs?: number; maxWaitMs?: number } = {},
    private readonly timers: BurstTimers = browserTimers
  ) {}

  /** Whether a burst is open: edited since it last finalized. */
  get isOpen(): boolean {
    return this.max !== null;
  }

  /** An edit: the idle wait starts over; the first edit of a burst starts
   *  the maximum wait. */
  touch(): void {
    if (this.idle !== null) this.timers.clearTimeout(this.idle);
    this.idle = this.timers.setTimeout(() => this.finalize(), this.options.idleMs ?? BURST_IDLE_MS);
    if (this.max === null) {
      this.max = this.timers.setTimeout(() => this.finalize(), this.options.maxWaitMs ?? BURST_MAX_WAIT_MS);
    }
  }

  /** Ends the burst now, if one is open, and reports it. */
  finalize(): void {
    if (!this.isOpen) return;
    this.cancel();
    this.onFinalize();
  }

  /** Ends the burst without reporting it. */
  cancel(): void {
    if (this.idle !== null) this.timers.clearTimeout(this.idle);
    if (this.max !== null) this.timers.clearTimeout(this.max);
    this.idle = null;
    this.max = null;
  }
}
