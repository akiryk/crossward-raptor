// 24-S3 acceptance: a tab's operation queue (`queue.ts`): one in flight, in
// order, retried with the same opId, journaled until answered. Do not edit
// this file to match an implementation.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGrid } from '@/engine/grid';
import { serializeGrid } from '@/lib/puzzle-storage';
import type { CommitOutcome } from './commit';
import type { Operation } from './operation';
import { isNavigationError, OperationQueue, RETRY_DELAYS_MS, type QueueDeps } from './queue';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

const initial = {
  confirmed: {
    content: { grid: serializeGrid(createGrid({ cols: 3, rows: 3 })), hints: {}, title: 'T', phase: 'grid' as const },
    version: 0, resetEpoch: 0,
  },
  pending: [],
};

function harness(overrides: Partial<QueueDeps> = {}) {
  const sent: Operation[] = [];
  const answers: Array<(outcome: CommitOutcome) => void> = [];
  const failures: Array<(error: unknown) => void> = [];
  const journal = vi.fn();
  const onRefused = vi.fn();
  const keepalive = vi.fn();
  let n = 0;
  const queue = new OperationQueue(initial, { puzzleId: 'p', clientId: 'tab', newOpId: () => `op-${++n}` }, {
    send: (op) => {
      sent.push(op);
      return new Promise((resolve, reject) => { answers.push(resolve); failures.push(reject); });
    },
    journal, onRefused, keepalive, ...overrides,
  });
  const answer = async (outcome: CommitOutcome) => {
    answers.shift()!(outcome);
    failures.shift();
    await vi.advanceTimersByTimeAsync(0);
  };
  const fail = async (error: unknown = new Error('offline')) => {
    answers.shift();
    failures.shift()!(error);
    await vi.advanceTimersByTimeAsync(0);
  };
  return { queue, sent, answer, fail, journal, onRefused, keepalive };
}
const title = (text: string) => ({ kind: 'title' as const, title: text });

describe('24-S3-5 one operation in flight, in order', () => {
  it('sends the next only once the one before is answered', async () => {
    const { queue, sent, answer } = harness();
    queue.add(title('A'));
    queue.add(title('B'));
    queue.add(title('C'));
    expect(sent.map((op) => op.opId)).toEqual(['op-1']);
    expect(queue.queueState).toBe('saving');
    await answer({ status: 'accepted', opId: 'op-1', version: 1 });
    expect(sent.map((op) => op.opId)).toEqual(['op-1', 'op-2']);
    await answer({ status: 'accepted', opId: 'op-2', version: 2 });
    await answer({ status: 'accepted', opId: 'op-3', version: 3 });
    expect(queue.queueState).toBe('idle');
    expect(queue.outbox.confirmed).toMatchObject({ version: 3, content: { title: 'C' } });
    expect(sent.map((op) => op.baseVersion)).toEqual([0, 0, 0]);
  });

  it('a refusal is reported with the outbox before and after, and the queue goes on', async () => {
    const { queue, sent, answer, onRefused } = harness();
    const first = queue.add(title('A'));
    queue.add(title('B'));
    await answer({ status: 'refused', opId: 'op-1', code: 'published' });
    expect(onRefused).toHaveBeenCalledTimes(1);
    const [op, code, before, after] = onRefused.mock.calls[0];
    expect(op).toEqual(first);
    expect(code).toBe('published');
    expect(before.pending.map((o: Operation) => o.opId)).toEqual(['op-1', 'op-2']);
    expect(after.pending.map((o: Operation) => o.opId)).toEqual(['op-2']);
    expect(sent).toHaveLength(2);
  });

  it('malformed and not-found answers are refusals too', async () => {
    const { queue, answer, onRefused } = harness();
    queue.add(title('A'));
    queue.add(title('B'));
    await answer({ status: 'invalid' });
    await answer({ status: 'not-found' });
    expect(onRefused.mock.calls.map((call) => call[1])).toEqual(['invalid', 'not-found']);
    expect(queue.outbox.pending).toEqual([]);
  });

  it('answers waiters, before or after the answer, and resolves when idle', async () => {
    const { queue, answer } = harness();
    const op = queue.add(title('A'));
    const early = queue.settled(op.opId);
    const idle = vi.fn();
    void queue.whenIdle().then(idle);
    await answer({ status: 'accepted', opId: op.opId, version: 1 });
    expect(await early).toEqual({ status: 'accepted', version: 1 });
    expect(await queue.settled(op.opId)).toEqual({ status: 'accepted', version: 1 });
    expect(await queue.settled('never')).toBeNull();
    expect(idle).toHaveBeenCalled();
    expect(queue.hasAnswered).toBe(true);
  });
});

describe('24-S3-6 retries', () => {
  it('a failed send or busy is retried with the same opId after a growing delay, nothing else sent meanwhile', async () => {
    const { queue, sent, answer, fail } = harness();
    queue.add(title('A'));
    queue.add(title('B'));
    await fail();
    expect(queue.queueState).toBe('retrying');
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0] - 1);
    expect(sent).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(sent.map((op) => op.opId)).toEqual(['op-1', 'op-1']);
    expect(queue.queueState).toBe('saving');
    await answer({ status: 'busy', opId: 'op-1' });
    expect(queue.queueState).toBe('retrying');
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[1]);
    expect(sent.map((op) => op.opId)).toEqual(['op-1', 'op-1', 'op-1']);
    expect(sent[2]).toEqual(sent[0]);
    await answer({ status: 'accepted', opId: 'op-1', version: 1 });
    expect(sent.map((op) => op.opId)).toEqual(['op-1', 'op-1', 'op-1', 'op-2']);
  });

  it('starts at 1 s and grows', () => {
    expect(RETRY_DELAYS_MS[0]).toBe(1000);
    for (let i = 1; i < RETRY_DELAYS_MS.length; i++) expect(RETRY_DELAYS_MS[i]).toBeGreaterThan(RETRY_DELAYS_MS[i - 1]);
  });

  it('a server redirect means the page is leaving: no retry, the operation stays pending', async () => {
    const { queue, sent, fail } = harness();
    queue.add(title('A'));
    const redirect = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;replace;/puzzles/p;307;' });
    expect(isNavigationError(redirect)).toBe(true);
    expect(isNavigationError(new Error('offline'))).toBe(false);
    await fail(redirect);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(sent).toHaveLength(1);
    expect(queue.isLeaving).toBe(true);
    expect(queue.outbox.pending.map((op) => op.opId)).toEqual(['op-1']);
  });
});

describe('24-S3-7 journal, adoption and leaving', () => {
  it('journals the pending operations on every change, ending empty', async () => {
    const { queue, answer, journal } = harness();
    queue.add(title('A'));
    queue.add(title('B'));
    expect(journal.mock.calls.at(-1)![0].map((op: Operation) => op.opId)).toEqual(['op-1', 'op-2']);
    await answer({ status: 'accepted', opId: 'op-1', version: 1 });
    expect(journal.mock.calls.at(-1)![0].map((op: Operation) => op.opId)).toEqual(['op-2']);
    await answer({ status: 'refused', opId: 'op-2', code: 'locked' });
    expect(journal.mock.calls.at(-1)![0]).toEqual([]);
  });

  it('adopts an earlier page’s operations unchanged and once, ahead of newer ones', async () => {
    const { queue, sent, answer } = harness();
    const old: Operation = { opId: 'old-1', puzzleId: 'p', clientId: 'old-tab', epoch: 0, baseVersion: 0, kind: 'title', title: 'Old' };
    queue.adopt([old]);
    queue.adopt([old]);
    queue.add(title('New'));
    expect(sent).toEqual([old]);
    await answer({ status: 'accepted', opId: 'old-1', version: 1 });
    expect(sent.map((op) => op.opId)).toEqual(['old-1', 'op-1']);
  });

  it('leaving sends the first pending operation with keepalive, and keeps it pending', () => {
    const { queue, keepalive } = harness();
    queue.leave();
    expect(keepalive).not.toHaveBeenCalled();
    const op = queue.add(title('A'));
    queue.add(title('B'));
    queue.leave();
    expect(keepalive).toHaveBeenCalledTimes(1);
    expect(keepalive).toHaveBeenCalledWith(op);
    expect(queue.outbox.pending).toHaveLength(2);
  });
});
