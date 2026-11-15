import type { Orientation } from '../engine/grid';
import type { NumberedSlot } from '../engine/numbering';

/** Recognize a leading reference to another existing entry, without storing metadata. */
export function parseClueReference(
  text: string,
  slots: ReadonlyMap<string, NumberedSlot>,
  ownKey?: string,
): { key: string; number: number; orientation: Orientation } | null {
  const match = /^with ([1-9][0-9]*)-(across|down)\b/i.exec(text);
  if (!match) return null;
  const number = Number(match[1]);
  const orientation = match[2].toLowerCase() as Orientation;
  const key = `${number}-${orientation}`;
  return key !== ownKey && slots.has(key) ? { key, number, orientation } : null;
}
