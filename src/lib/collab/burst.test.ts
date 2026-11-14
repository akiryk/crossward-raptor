// 24-S3 acceptance: when a burst finalizes (`burst.ts`). Do not edit this
// file to match an implementation.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BURST_IDLE_MS, BURST_MAX_WAIT_MS, BurstClock } from './burst';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('24-S3-4 the burst clock', () => {
  it('starts from 500 ms idle and a 2 s maximum wait', () => {
    expect(BURST_IDLE_MS).toBe(500);
    expect(BURST_MAX_WAIT_MS).toBe(2000);
  });

  it('finalizes 500 ms after the last edit, once', () => {
    const done = vi.fn();
    const clock = new BurstClock(done);
    clock.touch();
    vi.advanceTimersByTime(300);
    clock.touch();
    vi.advanceTimersByTime(499);
    expect(done).not.toHaveBeenCalled();
    expect(clock.isOpen).toBe(true);
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(1);
    expect(clock.isOpen).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('finalizes 2 s after the first edit however busy the typing', () => {
    const done = vi.fn();
    const clock = new BurstClock(done);
    for (let at = 0; at < 1900; at += 100) {
      clock.touch();
      vi.advanceTimersByTime(100);
    }
    expect(done).not.toHaveBeenCalled();
    clock.touch();
    vi.advanceTimersByTime(100);
    expect(done).toHaveBeenCalledTimes(1);
    clock.touch();
    vi.advanceTimersByTime(499);
    expect(done).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(2);
  });

  it('finalizes at once when told, only with a burst open; cancel ends it unreported', () => {
    const done = vi.fn();
    const clock = new BurstClock(done);
    clock.finalize();
    expect(done).not.toHaveBeenCalled();
    clock.touch();
    clock.finalize();
    expect(done).toHaveBeenCalledTimes(1);
    clock.touch();
    clock.cancel();
    vi.advanceTimersByTime(5000);
    expect(done).toHaveBeenCalledTimes(1);
  });
});
