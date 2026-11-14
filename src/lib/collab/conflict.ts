// Epic 24 (24-S7): when another builder's committed edit supersedes mine
// (D2). My latest grid burst and my latest hint are remembered with the
// entry holding them and when they completed; they are recent while my
// cursor has stayed in that entry, and for 3 s after completing. A
// catch-up's operations supersede recent work when the last of them to
// write a cell of it is another account's and changes what that cell showed
// (my value) to something else. Pure: no React, DOM or network.

import type { Coord, Orientation } from '@/engine/grid';
import { slotsWithNumbers, type NumberedSlot } from '@/engine/numbering';
import { intendedGeometry } from '@/engine/puzzle-geometry';
import { deserializeGrid } from '@/lib/puzzle-storage';
import type { PuzzleContent } from './apply';
import { entryName } from './notice';
import type { CellWrite, Operation } from './operation';
import type { Builder } from './presence';
import { builderName } from './session';

/** After the cursor leaves its entry, work stays recent this long after it
 *  completed (D2: about 3 s, a tunable starting value). */
export const CONFLICT_WINDOW_MS = 3_000;

/** Work of mine that a remote edit could supersede. */
export interface Recent {
  /** The cells of the entry holding it (or its own cells, outside any). */
  readonly entry: readonly Coord[];
  readonly completedAt: number;
  /** The cursor has left the entry since it completed. */
  readonly left: boolean;
}

export interface RecentBurst extends Recent {
  readonly writes: readonly CellWrite[];
  readonly orientation: Orientation;
}

export interface RecentHint extends Recent {
  readonly key: string;
  readonly text: string;
}

/** A committed operation a catch-up brought, with its author (null when
 *  the log doesn't know) and whether this tab sent it. */
export interface IncomingOp {
  readonly op: Operation;
  readonly author: Builder | null;
  readonly own: boolean;
}

export interface GridConflict {
  readonly author: Builder | null;
  /** What to outline: the entry's cells, or the superseded cells. */
  readonly cells: readonly Coord[];
  readonly message: string;
}

export interface HintConflict {
  readonly key: string;
  readonly author: Builder | null;
  readonly message: string;
}

const key = ({ col, row }: Coord) => `${col},${row}`;
const has = (cells: readonly Coord[], coord: Coord) => cells.some((cell) => cell.col === coord.col && cell.row === coord.row);

/** The puzzle's numbered entries as the builder sees them: in Build, the
 *  words Preview shows (`intendedGeometry`); in Create Hints, the grid's. */
function entries(content: PuzzleContent): readonly NumberedSlot[] {
  const grid = deserializeGrid(content.grid);
  return slotsWithNumbers(content.phase === 'hints' ? grid : intendedGeometry(grid));
}

/** The entry in `orientation` holding every one of the cells, or null. */
function entryHolding(content: PuzzleContent, cells: readonly Coord[], orientation: Orientation): NumberedSlot | null {
  if (cells.length === 0) return null;
  return entries(content).find((slot) => slot.orientation === orientation && cells.every((cell) => has(slot.cells, cell))) ?? null;
}

const slotName = (slot: NumberedSlot) => entryName(`${slot.number}-${slot.orientation}`);

function shown(content: PuzzleContent, { col, row }: Coord): string | null {
  const cell = content.grid.cells[row]?.[col];
  return cell?.kind === 'active' ? cell.letter : null;
}

const letters = (content: PuzzleContent, slot: NumberedSlot) => slot.cells.map((cell) => shown(content, cell) ?? '?').join('');

/** My burst, just queued: `content` is the projection with it applied. */
export function recordBurst(content: PuzzleContent, writes: readonly CellWrite[], orientation: Orientation, completedAt: number): RecentBurst {
  const cells = writes.map(({ col, row }) => ({ col, row }));
  const entry = entryHolding(content, cells, orientation)?.cells ?? cells;
  return { writes, orientation, entry, completedAt, left: false };
}

/** My hint, just queued. */
export function recordHint(content: PuzzleContent, hintKey: string, text: string, completedAt: number): RecentHint {
  const slot = entries(content).find((candidate) => `${candidate.number}-${candidate.orientation}` === hintKey);
  return { key: hintKey, text, entry: slot?.cells ?? [], completedAt, left: false };
}

/** The cursor moved: once outside the entry, the work is recent only by
 *  time. */
export function leftEntry<T extends Recent>(recent: T, cursor: Coord): T {
  if (recent.left || has(recent.entry, cursor)) return recent;
  return { ...recent, left: true };
}

export function isRecent(recent: Recent, cursor: Coord, now: number): boolean {
  return (!recent.left && has(recent.entry, cursor)) || now - recent.completedAt <= CONFLICT_WINDOW_MS;
}

/** The last operation in the batch to write each cell. */
function lastWriters(ops: readonly IncomingOp[]): Map<string, IncomingOp> {
  const writers = new Map<string, IncomingOp>();
  for (const incoming of ops) {
    if (incoming.op.kind !== 'cells') continue;
    for (const write of incoming.op.writes) writers.set(key(write), incoming);
  }
  return writers;
}

const isOthers = (incoming: IncomingOp, self: string) => !incoming.own && incoming.author?.userId !== self;

interface Input<R> {
  readonly recent: R | null;
  /** The projection before and after the catch-up. */
  readonly before: PuzzleContent;
  readonly after: PuzzleContent;
  readonly ops: readonly IncomingOp[];
  /** This builder's account. */
  readonly self: string;
  readonly cursor: Coord;
  readonly now: number;
}

/** Whether the catch-up superseded my latest grid burst, and how to say so. */
export function gridConflict({ recent, before, after, ops, self, cursor, now }: Input<RecentBurst>): GridConflict | null {
  if (!recent || !isRecent(recent, cursor, now)) return null;
  if (before.phase !== after.phase) return null;
  const writers = lastWriters(ops);
  const lost: Coord[] = [];
  let by: IncomingOp | null = null;
  for (const write of recent.writes) {
    const writer = writers.get(key(write));
    if (!writer || !isOthers(writer, self)) continue;
    const mine = write.value;
    if (shown(before, write) !== mine || shown(after, write) === mine) continue;
    lost.push({ col: write.col, row: write.row });
    if (!by || ops.indexOf(writer) > ops.indexOf(by)) by = writer;
  }
  if (!by) return null;
  const name = builderName(by.author?.username);
  const written = recent.writes.map(({ col, row }) => ({ col, row }));
  const was = entryHolding(before, written, recent.orientation);
  const now_ = entryHolding(after, written, recent.orientation);
  if (was && now_ && was.number === now_.number && was.cells.length === now_.cells.length
    && was.cells.every((cell, index) => cell.col === now_.cells[index].col && cell.row === now_.cells[index].row)) {
    return {
      author: by.author,
      cells: now_.cells,
      message: `${name} changed ${slotName(was)} from ${letters(before, was)} to ${letters(after, now_)}.`,
    };
  }
  const count = lost.length === 1 ? 'a letter' : `${lost.length} letters`;
  return { author: by.author, cells: lost, message: `${name} changed ${count} you just typed${was ? ` in ${slotName(was)}` : ''}.` };
}

/** Whether the catch-up superseded my latest hint, and how to say so. */
export function hintConflict({ recent, before, after, ops, self, cursor, now }: Input<RecentHint>): HintConflict | null {
  if (!recent || !isRecent(recent, cursor, now)) return null;
  let by: IncomingOp | null = null;
  for (const incoming of ops) {
    if (incoming.op.kind === 'hint' && incoming.op.key === recent.key) by = incoming;
  }
  if (!by || !isOthers(by, self)) return null;
  if ((before.hints[recent.key] ?? '') !== recent.text || (after.hints[recent.key] ?? '') === recent.text) return null;
  return { key: recent.key, author: by.author, message: `${builderName(by.author?.username)} changed your hint for ${entryName(recent.key)}.` };
}
