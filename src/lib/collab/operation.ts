// Epic 24 (24-S1, 24-S2): the operation envelope and its kinds: the content
// kinds (cells, hint, title; 24-S1) and the structural ones (lock, unlock,
// enterHints, startOver; 24-S2). Pure: no React, DOM, database or network.

/** One cell's new value: a letter, a rebus string, or null to clear it. */
export interface CellWrite {
  readonly col: number;
  readonly row: number;
  readonly value: string | null;
}

/** A word to lock or unlock, as `LockedWord` stores it: its first cell,
 *  its direction and its length. */
export interface WordRef {
  readonly col: number;
  readonly row: number;
  readonly orientation: 'across' | 'down';
  readonly length: number;
}

export type OperationBody =
  | { readonly kind: 'cells'; readonly writes: readonly CellWrite[] }
  | { readonly kind: 'hint'; readonly key: string; readonly text: string }
  | { readonly kind: 'title'; readonly title: string }
  | { readonly kind: 'lock'; readonly word: WordRef }
  | { readonly kind: 'unlock'; readonly word: WordRef }
  | { readonly kind: 'enterHints' }
  | { readonly kind: 'startOver'; readonly keepLockedWords: boolean };

export type OperationKind = OperationBody['kind'];

/** Every operation carries its identity, the tab that made it, the reset
 *  generation it was made in and the version it was made against. */
export interface OperationEnvelope {
  /** A client UUID; an `opId` is applied at most once. */
  readonly opId: string;
  readonly puzzleId: string;
  /** The tab that made it. */
  readonly clientId: string;
  /** The puzzle's `resetEpoch` when it was made. */
  readonly epoch: number;
  /** The version it was made against: for conflict detection, never for
   *  refusing an edit (except past the log's retention, see `commit.ts`). */
  readonly baseVersion: number;
}

export type Operation = OperationEnvelope & OperationBody;

/** A cell value: an uppercase letter or a rebus of letters and digits (the
 *  editor's `keyToIntent` and `rebusText`). */
export const CELL_VALUE = /^[A-Z0-9]{1,10}$/;
const IDENTIFIER = /^[A-Za-z0-9_-]{1,100}$/;
export const MAX_WRITES = 1024;
export const MAX_HINT_LENGTH = 2000;
export const MAX_TITLE_LENGTH = 500;

export type ParseResult = { readonly ok: true; readonly op: Operation } | { readonly ok: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && IDENTIFIER.test(value);
}

function parseWrites(value: unknown): CellWrite[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_WRITES) return null;
  const writes: CellWrite[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || !isCount(item.col) || !isCount(item.row)) return null;
    const cellValue = item.value;
    if (cellValue !== null && (typeof cellValue !== 'string' || !CELL_VALUE.test(cellValue))) return null;
    const key = `${item.col},${item.row}`;
    if (seen.has(key)) return null;
    seen.add(key);
    writes.push({ col: item.col, row: item.row, value: cellValue });
  }
  return writes;
}

function parseWord(value: unknown): WordRef | null {
  if (!isRecord(value) || !isCount(value.col) || !isCount(value.row)) return null;
  const { orientation, length } = value;
  if (orientation !== 'across' && orientation !== 'down') return null;
  if (!isCount(length) || length < 1 || length > MAX_WRITES) return null;
  return { col: value.col, row: value.row, orientation, length };
}

/** Checks an untrusted operation's shape, returning a fresh copy with only
 *  known fields. It knows nothing of any puzzle's state: that is
 *  `validateOperation`'s job. */
export function parseOperation(input: unknown): ParseResult {
  if (!isRecord(input)) return { ok: false };
  const { opId, puzzleId, clientId, epoch, baseVersion, kind } = input;
  if (!isIdentifier(opId) || !isIdentifier(puzzleId) || !isIdentifier(clientId)) return { ok: false };
  if (!isCount(epoch) || !isCount(baseVersion)) return { ok: false };
  const envelope = { opId, puzzleId, clientId, epoch, baseVersion };

  if (kind === 'cells') {
    const writes = parseWrites(input.writes);
    return writes ? { ok: true, op: { ...envelope, kind, writes } } : { ok: false };
  }
  if (kind === 'hint') {
    const { key, text } = input;
    if (typeof key !== 'string' || !/^[1-9][0-9]{0,3}-(across|down)$/.test(key)) return { ok: false };
    if (typeof text !== 'string' || text.length > MAX_HINT_LENGTH) return { ok: false };
    return { ok: true, op: { ...envelope, kind, key, text } };
  }
  if (kind === 'title') {
    const { title } = input;
    if (typeof title !== 'string' || title.length > MAX_TITLE_LENGTH) return { ok: false };
    return { ok: true, op: { ...envelope, kind, title } };
  }
  if (kind === 'lock' || kind === 'unlock') {
    const word = parseWord(input.word);
    return word ? { ok: true, op: { ...envelope, kind, word } } : { ok: false };
  }
  if (kind === 'enterHints') return { ok: true, op: { ...envelope, kind } };
  if (kind === 'startOver') {
    const { keepLockedWords } = input;
    if (typeof keepLockedWords !== 'boolean') return { ok: false };
    return { ok: true, op: { ...envelope, kind, keepLockedWords } };
  }
  return { ok: false };
}
