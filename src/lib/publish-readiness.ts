import type { Puzzle } from '../engine/puzzle';
import { extractSlots } from '../engine/slots';
import { requiredHints, hintKey } from '../engine/hints';
import { isSymmetric } from '../engine/symmetry';

export type FindingKind =
  | 'unfilled-cells'
  | 'unwritten-hints'
  | 'short-answers'
  | 'unchecked-squares'
  | 'asymmetric';

export interface Finding {
  readonly kind: FindingKind;
  /** How many instances. Absent for findings that aren't countable. */
  readonly count?: number;
  /** Human-readable, e.g. "3 squares have no letter". */
  readonly message: string;
}

function plural(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * Everything a builder might want to know before publishing. Returns only
 * findings that apply; an empty array means nothing is outstanding.
 * Advisory only — no caller should treat this as a gate.
 */
export function publishReadiness(puzzle: Puzzle): readonly Finding[] {
  const { grid, hints } = puzzle;
  const findings: Finding[] = [];

  let unfilledCount = 0;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row);
      if (cell.kind === 'active' && cell.letter === null) unfilledCount++;
    }
  }
  if (unfilledCount > 0) {
    findings.push({
      kind: 'unfilled-cells',
      count: unfilledCount,
      message: `${unfilledCount} ${plural(unfilledCount, 'square has', 'squares have')} no letter.`,
    });
  }

  const { across, down } = requiredHints(grid);
  let unwrittenCount = 0;
  for (const ref of [...across, ...down]) {
    const text = hints[hintKey(ref)];
    if (text === undefined || text.trim() === '') unwrittenCount++;
  }
  if (unwrittenCount > 0) {
    findings.push({
      kind: 'unwritten-hints',
      count: unwrittenCount,
      message: `${unwrittenCount} ${plural(unwrittenCount, 'clue is', 'clues are')} missing.`,
    });
  }

  const slots = extractSlots(grid);

  const shortCount = slots.filter((slot) => slot.length < 3).length;
  if (shortCount > 0) {
    findings.push({
      kind: 'short-answers',
      count: shortCount,
      message: `${shortCount} ${plural(shortCount, 'answer is', 'answers are')} shorter than three letters.`,
    });
  }

  const acrossCells = new Set<string>();
  const downCells = new Set<string>();
  for (const slot of slots) {
    const cells = slot.orientation === 'across' ? acrossCells : downCells;
    for (const { col, row } of slot.cells) cells.add(`${col},${row}`);
  }
  let uncheckedCount = 0;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (grid.at(col, row).kind !== 'active') continue;
      const key = `${col},${row}`;
      if (!acrossCells.has(key) || !downCells.has(key)) uncheckedCount++;
    }
  }
  if (uncheckedCount > 0) {
    findings.push({
      kind: 'unchecked-squares',
      count: uncheckedCount,
      message: `${uncheckedCount} ${plural(uncheckedCount, 'square is', 'squares are')} not covered by both an across and a down answer.`,
    });
  }

  if (!isSymmetric(grid)) {
    findings.push({
      kind: 'asymmetric',
      message: 'The black-square pattern lacks 180° rotational symmetry.',
    });
  }

  return findings;
}
