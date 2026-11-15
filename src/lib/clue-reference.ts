import type { Coord, Orientation } from '../engine/grid';
import type { NumberedSlot } from '../engine/numbering';

/** Recognize a leading reference to another existing entry, without storing metadata. */
export function parseClueReference(
  text: string,
  slots: ReadonlyMap<string, NumberedSlot>,
  ownKey?: string,
): { key: string; number: number; orientation: Orientation } | null {
  const match = /^(?:with|see) ([1-9][0-9]*)-(across|down)\b/i.exec(text);
  if (!match) return null;
  const number = Number(match[1]);
  const orientation = match[2].toLowerCase() as Orientation;
  const key = `${number}-${orientation}`;
  return key !== ownKey && slots.has(key) ? { key, number, orientation } : null;
}

/** The entry named by the current clue, in slot order, without changing inputs. */
export function linkedEntryCells(
  hints: Readonly<Record<string, string>>,
  currentKey: string | null,
  slots: ReadonlyMap<string, NumberedSlot>,
): readonly Coord[] {
  if (currentKey === null) return [];
  const reference = parseClueReference(hints[currentKey] ?? '', slots, currentKey);
  return reference ? slots.get(reference.key)!.cells : [];
}
