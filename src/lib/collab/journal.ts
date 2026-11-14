// Epic 24 (24-S3): the journal. A tab's unacknowledged operations are kept
// in `localStorage`, per puzzle and reset epoch, until the server answers
// for them, so a reload or a crash loses none. The next editor opened on
// the puzzle adopts every journal for it and re-sends the operations with
// their original `opId`s: one that did land is answered with its first
// outcome rather than applied twice. The storage is passed in.

import { parseOperation, type Operation } from './operation';

/** The part of `Storage` the journal uses. */
export interface JournalStorage {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const PREFIX = 'crossward:journal:v1';

/** One tab's journal for one puzzle and epoch. */
export function journalKey(puzzleId: string, epoch: number, clientId: string): string {
  return `${PREFIX}:${puzzleId}:${epoch}:${clientId}`;
}

interface Entry {
  readonly savedAt: number;
  readonly ops: readonly unknown[];
}

function keysFor(storage: JournalStorage, puzzleId: string): { key: string; epoch: number; clientId: string }[] {
  const found = [];
  const prefix = `${PREFIX}:${puzzleId}:`;
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith(prefix)) continue;
    const [epochText, clientId] = key.slice(prefix.length).split(':');
    const epoch = Number(epochText);
    if (!Number.isSafeInteger(epoch) || epoch < 0 || !clientId) continue;
    found.push({ key, epoch, clientId });
  }
  return found;
}

/** Writes this tab's unacknowledged operations, one entry per epoch, and
 *  removes its entries for epochs it no longer has. Storage failures (full,
 *  disabled) are swallowed: the journal is a safety net, not the save. */
export function writeJournal(
  storage: JournalStorage,
  puzzleId: string,
  clientId: string,
  ops: readonly Operation[],
  now: number = Date.now()
): void {
  try {
    const byEpoch = new Map<number, Operation[]>();
    for (const op of ops) byEpoch.set(op.epoch, [...(byEpoch.get(op.epoch) ?? []), op]);
    for (const { key, epoch, clientId: owner } of keysFor(storage, puzzleId)) {
      if (owner === clientId && !byEpoch.has(epoch)) storage.removeItem(key);
    }
    for (const [epoch, epochOps] of byEpoch) {
      const entry: Entry = { savedAt: now, ops: epochOps };
      storage.setItem(journalKey(puzzleId, epoch, clientId), JSON.stringify(entry));
    }
  } catch {
    // The journal is best effort.
  }
}

/** Every journaled operation for the puzzle, from any tab: older epochs
 *  first, then by when each tab's entry was written, each in its own order.
 *  Malformed entries and operations are skipped; an operation journaled
 *  twice is returned once. `keys` are the entries read, for the adopting
 *  tab to remove once it has journaled them as its own. */
export function readJournal(storage: JournalStorage, puzzleId: string): { ops: Operation[]; keys: string[] } {
  const entries: { epoch: number; savedAt: number; ops: Operation[]; key: string }[] = [];
  try {
    for (const { key, epoch } of keysFor(storage, puzzleId)) {
      let entry: Entry | null = null;
      try {
        entry = JSON.parse(storage.getItem(key) ?? 'null') as Entry | null;
      } catch {
        entry = null;
      }
      const ops: Operation[] = [];
      if (entry && Array.isArray(entry.ops)) {
        for (const raw of entry.ops) {
          const parsed = parseOperation(raw);
          if (parsed.ok && parsed.op.puzzleId === puzzleId) ops.push(parsed.op);
        }
      }
      entries.push({ epoch, savedAt: typeof entry?.savedAt === 'number' ? entry.savedAt : 0, ops, key });
    }
  } catch {
    return { ops: [], keys: [] };
  }
  entries.sort((a, b) => a.epoch - b.epoch || a.savedAt - b.savedAt);
  const seen = new Set<string>();
  const ops: Operation[] = [];
  for (const entry of entries) {
    for (const op of entry.ops) {
      if (seen.has(op.opId)) continue;
      seen.add(op.opId);
      ops.push(op);
    }
  }
  return { ops, keys: entries.map((entry) => entry.key) };
}

/** Removes journal entries (best effort). */
export function removeJournalKeys(storage: JournalStorage, keys: readonly string[]): void {
  try {
    for (const key of keys) storage.removeItem(key);
  } catch {
    // Best effort.
  }
}
