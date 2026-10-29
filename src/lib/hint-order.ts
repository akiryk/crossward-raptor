import type { NumberedSlot } from '../engine/numbering';

/** Every word's key in the Hint Box's order (15-S4): the Across words by
 *  number, then the Down words. */
export function hintOrder(lookup: ReadonlyMap<string, NumberedSlot>): string[] {
  const rank = (slot: NumberedSlot) => (slot.orientation === 'across' ? 0 : 1);
  return Array.from(lookup.entries())
    .sort(([, a], [, b]) => rank(a) - rank(b) || a.number - b.number)
    .map(([key]) => key);
}

/** The key one step from `key` in hintOrder, wrapping at both ends, or
 *  null if `key` isn't a word in the lookup. */
export function adjacentHintKey(
  lookup: ReadonlyMap<string, NumberedSlot>,
  key: string,
  step: 1 | -1
): string | null {
  const order = hintOrder(lookup);
  const index = order.indexOf(key);
  if (index === -1) return null;
  return order[(index + step + order.length) % order.length];
}
