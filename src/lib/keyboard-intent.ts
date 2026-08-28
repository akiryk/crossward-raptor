import type { ArrowDirection } from '../engine/cursor';

export type Intent =
  | { type: 'letter'; letter: string }
  | { type: 'delete' }
  | { type: 'arrow'; direction: ArrowDirection };

const ARROW_DIRECTIONS: Record<string, ArrowDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** Maps a raw KeyboardEvent.key to an engine-level intent, or null if the
 *  key isn't one this app handles. Pure — no DOM, no React. */
export function keyToIntent(key: string): Intent | null {
  if (key.length === 1 && /^[a-zA-Z]$/.test(key)) {
    return { type: 'letter', letter: key.toUpperCase() };
  }
  if (key === 'Backspace') {
    return { type: 'delete' };
  }
  if (key in ARROW_DIRECTIONS) {
    return { type: 'arrow', direction: ARROW_DIRECTIONS[key] };
  }
  return null;
}
