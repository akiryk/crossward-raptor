// Epic 24 (24-S1): validating and applying an operation against the stored
// puzzle. Pure: no React, DOM, database or network, and inputs are never
// mutated. The commit path (`commit.ts`) runs these against the server's
// current state; S3's and S4's clients run `applyOperation` on their
// confirmed state.

import type { Phase } from '@/engine/puzzle';
import { hintKey, requiredHints } from '@/engine/hints';
import { isCellProtected } from '@/lib/locked-keys';
import { normalizeTitle } from '@/lib/puzzle-title';
import { deserializeGrid, deserializeLockedWords, type SerializedCell, type SerializedGrid } from '@/lib/puzzle-storage';
import type { CellWrite, Operation, OperationBody } from './operation';

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
 *    burst writing a black cell or clearing one).
 *  - `locked`: a burst would change a cell a locked word protects.
 *  - `invalid`: doesn't fit the puzzle (a cell outside the grid or black in
 *    Build, a hint key the grid doesn't number).
 *  - `expired`: made against a version older than the log's retention
 *    (decided by `commit.ts`, not here). */
export type RefusalCode = 'published' | 'epoch' | 'phase' | 'locked' | 'invalid' | 'expired';

/** The values an operation replaced, recorded with it in the log. */
export type PreviousValues =
  | { readonly kind: 'cells'; readonly cells: readonly CellWrite[] }
  | { readonly kind: 'hint'; readonly text: string | null }
  | { readonly kind: 'title'; readonly title: string };

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

/** Null if the operation fits the current state, otherwise why not. The
 *  version it was made against plays no part. */
export function validateOperation(state: PuzzleState, op: Operation): RefusalCode | null {
  if (state.published) return 'published';
  if (op.epoch !== state.resetEpoch) return 'epoch';
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
  }
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
  }
}

export type Evaluation =
  | { readonly ok: true; readonly content: PuzzleContent; readonly previous: PreviousValues }
  | { readonly ok: false; readonly code: RefusalCode };

/** Validates, then applies: all or nothing. */
export function evaluateOperation(state: PuzzleState, op: Operation): Evaluation {
  const code = validateOperation(state, op);
  if (code) return { ok: false, code };
  return { ok: true, ...applyOperation(state, op) };
}
