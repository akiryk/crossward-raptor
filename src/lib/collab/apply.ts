// Epic 24 (24-S1, 24-S2): validating and applying an operation against the
// stored puzzle. Pure: no React, DOM, database or network, and inputs are
// never mutated. The commit path (`commit.ts`) runs these against the server's
// current state; S3's and S4's clients run `applyOperation` on their
// confirmed state.

import type { Phase } from '@/engine/puzzle';
import { hintKey, requiredHints } from '@/engine/hints';
import { enterHintsPhase } from '@/engine/phase';
import { isCellProtected } from '@/lib/locked-keys';
import { clearOutsideLockedWords, lockableWord, sameWord, type LockedWord } from '@/lib/locked-words';
import { normalizeTitle } from '@/lib/puzzle-title';
import {
  deserializeGrid, deserializeLockedWords, deserializePuzzle, serializeGrid, serializePuzzle,
  type SerializedCell, type SerializedGrid,
} from '@/lib/puzzle-storage';
import type { CellWrite, Operation, OperationBody, OperationKind, WordRef } from './operation';

/** The content an operation reads and writes, as stored. */
export interface PuzzleContent {
  readonly grid: SerializedGrid;
  readonly hints: Readonly<Record<string, string>>;
  readonly title: string;
  readonly phase: Phase;
}

/** The stored puzzle as the commit path validates against it. */
export interface PuzzleState extends PuzzleContent {
  readonly resetEpoch: number;
  readonly published: boolean;
}

/** Why an operation was refused. Each is final for that `opId`.
 *  - `published`: the puzzle accepts no edits.
 *  - `epoch`: made before a reset (or for another reset generation).
 *  - `phase`: doesn't fit the puzzle's phase (a hint in Build; in Hints, a
 *    burst writing a black cell or clearing one; 24-S2: a lock, unlock or
 *    Start Over outside Build, Enter Hints in Hints).
 *  - `locked`: a burst would change a cell a locked word protects.
 *  - `invalid`: doesn't fit the puzzle (a cell outside the grid or black in
 *    Build, a hint key the grid doesn't number; 24-S2: locking a word that
 *    isn't lockable there, `lockableWord`).
 *  - `owner`: an owner-only operation (Start Over) from someone else
 *    (24-S2; reachable once S5 admits collaborators).
 *  - `expired`: made against a version older than the log's retention
 *    (decided by `commit.ts`, not here). */
export type RefusalCode = 'published' | 'epoch' | 'phase' | 'locked' | 'invalid' | 'owner' | 'expired';

/** Who commits the operation, as far as validation needs to know. */
export interface Committer {
  /** The puzzle's owner, who alone may start over. */
  readonly isOwner: boolean;
}

/** Without a committer, validation assumes someone who isn't the owner. */
const NOT_OWNER: Committer = { isOwner: false };

/** The kinds only the owner may commit (D5). Publishing is owner-only too,
 *  but isn't an operation (`publish.ts`). */
export function isOwnerOnly(kind: OperationKind): boolean {
  return kind === 'startOver';
}

/** The values an operation replaced, recorded with it in the log. */
export type PreviousValues =
  | { readonly kind: 'cells'; readonly cells: readonly CellWrite[] }
  | { readonly kind: 'hint'; readonly text: string | null }
  | { readonly kind: 'title'; readonly title: string }
  /** Whether the word was locked before (a lock or unlock of a word already
   *  in that state changes nothing). */
  | { readonly kind: 'lock' | 'unlock'; readonly locked: boolean }
  /** The locks the conversion dropped (the grid before it is stored as
   *  `gridBeforeHints`). */
  | { readonly kind: 'enterHints'; readonly lockedWords: readonly LockedWord[] }
  /** The cells the reset changed, with their previous values, and the locks
   *  before it. */
  | { readonly kind: 'startOver'; readonly cells: readonly CellWrite[]; readonly lockedWords: readonly LockedWord[] };

function cellAt(grid: SerializedGrid, col: number, row: number): SerializedCell | undefined {
  if (row >= grid.rows || col >= grid.cols) return undefined;
  return grid.cells[row]?.[col];
}

function validateCells(state: PuzzleState, writes: readonly CellWrite[]): RefusalCode | null {
  for (const { col, row, value } of writes) {
    const cell = cellAt(state.grid, col, row);
    if (!cell) return 'invalid';
    if (cell.kind === 'black') return state.phase === 'hints' ? 'phase' : 'invalid';
    // The Hints phase fixes the geometry: nothing may be cleared.
    if (state.phase === 'hints' && value === null) return 'phase';
  }

  // D3: a burst that would change a protected cell is rejected whole.
  const lockedWords = deserializeLockedWords(state.grid);
  if (lockedWords.length > 0) {
    const grid = deserializeGrid(state.grid);
    for (const { col, row, value } of writes) {
      const cell = cellAt(state.grid, col, row) as SerializedCell & { kind: 'active' };
      if (cell.letter !== value && isCellProtected(grid, lockedWords, { col, row })) return 'locked';
    }
  }
  return null;
}

/** A lock needs the word `lockableWord` finds from its first cell, in the
 *  server's current grid: complete, Preview-white and 3 or more long. A
 *  word already locked stays lockable (locking it again changes nothing). */
function validateLock(state: PuzzleState, word: WordRef): RefusalCode | null {
  if (deserializeLockedWords(state.grid).some((locked) => sameWord(locked, word))) return null;
  if (!cellAt(state.grid, word.col, word.row)) return 'invalid';
  const found = lockableWord(deserializeGrid(state.grid), {
    current: { col: word.col, row: word.row }, orientation: word.orientation,
  });
  return found && sameWord(found, word) ? null : 'invalid';
}

/** Null if the operation fits the current state, otherwise why not. The
 *  version it was made against plays no part. `committer` matters only to
 *  owner-only kinds; without one, it is someone who isn't the owner. */
export function validateOperation(state: PuzzleState, op: Operation, committer: Committer = NOT_OWNER): RefusalCode | null {
  if (state.published) return 'published';
  if (op.epoch !== state.resetEpoch) return 'epoch';
  if (isOwnerOnly(op.kind) && !committer.isOwner) return 'owner';
  switch (op.kind) {
    case 'cells':
      return validateCells(state, op.writes);
    case 'hint': {
      if (state.phase !== 'hints') return 'phase';
      const { across, down } = requiredHints(deserializeGrid(state.grid));
      return [...across, ...down].some((ref) => hintKey(ref) === op.key) ? null : 'invalid';
    }
    case 'title':
      return null;
    // The Hints phase has no locks, so a lock or unlock made in Build fails
    // there.
    case 'lock':
      return state.phase === 'grid' ? validateLock(state, op.word) : 'phase';
    case 'unlock':
    case 'enterHints':
    case 'startOver':
      return state.phase === 'grid' ? null : 'phase';
  }
}

/** The grid with exactly these locked words (none: no `lockedWords`). */
function withLockedWords(grid: SerializedGrid, lockedWords: readonly LockedWord[]): SerializedGrid {
  const next: SerializedGrid = { ...grid };
  delete next.lockedWords;
  if (lockedWords.length > 0) next.lockedWords = lockedWords.map((word) => ({ ...word }));
  return next;
}

/** What Enter Hints stores as `gridBeforeHints`: the grid before the
 *  conversion, without its locks, as the snapshot `enterHints` stores it. */
export function gridBeforeHints(grid: SerializedGrid): SerializedGrid {
  return serializeGrid(deserializeGrid(grid));
}

/** The content with the operation applied, and the values it replaced.
 *  Assumes the operation is valid for the content (`validateOperation`).
 *  A burst writes only its own cells; locked words are kept. Applying the
 *  same operation twice gives the same content as once. */
export function applyOperation(
  content: PuzzleContent,
  op: OperationBody
): { content: PuzzleContent; previous: PreviousValues } {
  switch (op.kind) {
    case 'cells': {
      const cells = content.grid.cells.map((row) => row.map((cell) => ({ ...cell })));
      const previous: CellWrite[] = [];
      for (const { col, row, value } of op.writes) {
        const cell = cells[row][col] as SerializedCell & { kind: 'active' };
        previous.push({ col, row, value: cell.letter });
        cells[row][col] = { kind: 'active', letter: value };
      }
      const grid: SerializedGrid = {
        ...content.grid,
        cells,
        ...(content.grid.lockedWords && { lockedWords: content.grid.lockedWords.map((word) => ({ ...word })) }),
      };
      return { content: { ...content, grid }, previous: { kind: 'cells', cells: previous } };
    }
    case 'hint':
      return {
        content: { ...content, hints: { ...content.hints, [op.key]: op.text } },
        previous: { kind: 'hint', text: Object.hasOwn(content.hints, op.key) ? content.hints[op.key] : null },
      };
    case 'title':
      return {
        content: { ...content, title: normalizeTitle(op.title) },
        previous: { kind: 'title', title: content.title },
      };
    case 'lock':
    case 'unlock': {
      const lockedWords = deserializeLockedWords(content.grid);
      const locked = lockedWords.some((word) => sameWord(word, op.word));
      const next = op.kind === 'unlock'
        ? lockedWords.filter((word) => !sameWord(word, op.word))
        : locked ? lockedWords : [...lockedWords, { ...op.word }];
      return { content: { ...content, grid: withLockedWords(content.grid, next) }, previous: { kind: op.kind, locked } };
    }
    case 'enterHints': {
      // The engine's conversion, as the snapshot `enterHints` does it: empty
      // cells turn black, blank hints are seeded, the locks are dropped.
      const stored = serializePuzzle(enterHintsPhase(deserializePuzzle(content)));
      return {
        content: { ...content, grid: stored.grid, hints: stored.hints, phase: stored.phase },
        previous: { kind: 'enterHints', lockedWords: deserializeLockedWords(content.grid) },
      };
    }
    case 'startOver': {
      // As the editor's Start Over (21-S6): every cell white and empty, but
      // with Keep Locked Words a locked word keeps its cells and its lock.
      const before = deserializeLockedWords(content.grid);
      const kept = op.keepLockedWords ? before : [];
      const grid = serializeGrid(clearOutsideLockedWords(deserializeGrid(content.grid), kept), kept);
      const cells: CellWrite[] = [];
      content.grid.cells.forEach((line, row) => line.forEach((cell, col) => {
        const after = grid.cells[row][col] as SerializedCell & { kind: 'active' };
        if (cell.kind === 'black' || cell.letter !== after.letter) {
          cells.push({ col, row, value: cell.kind === 'active' ? cell.letter : null });
        }
      }));
      return { content: { ...content, grid }, previous: { kind: 'startOver', cells, lockedWords: before } };
    }
  }
}

/** The reset generation after the operation: Start Over begins a new one
 *  (D5), every other kind keeps it. */
export function epochAfter(resetEpoch: number, op: OperationBody): number {
  return op.kind === 'startOver' ? resetEpoch + 1 : resetEpoch;
}

export type Evaluation =
  | {
      readonly ok: true;
      readonly content: PuzzleContent;
      readonly previous: PreviousValues;
      /** The puzzle's `resetEpoch` once applied (`epochAfter`). */
      readonly resetEpoch: number;
    }
  | { readonly ok: false; readonly code: RefusalCode };

/** Validates, then applies: all or nothing. */
export function evaluateOperation(state: PuzzleState, op: Operation, committer: Committer = NOT_OWNER): Evaluation {
  const code = validateOperation(state, op, committer);
  if (code) return { ok: false, code };
  return { ok: true, ...applyOperation(state, op), resetEpoch: epochAfter(state.resetEpoch, op) };
}
