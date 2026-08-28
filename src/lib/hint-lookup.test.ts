import { describe, it, expect } from 'vitest';
import { createGrid } from '../engine/grid';
import type { CursorState } from '../engine/cursor';
import { buildSlotLookup, activeHintKey, isHintFilled } from './hint-lookup';

function smallGridWithBlackCorner() {
  return createGrid({ cols: 3, rows: 3, black: [{ col: 2, row: 2 }] });
}

// --- P5-1: buildSlotLookup ---
describe('P5-1 buildSlotLookup', () => {
  it('returns exactly the 6 expected keys for the black-corner 3x3 grid', () => {
    const lookup = buildSlotLookup(smallGridWithBlackCorner());
    const keys = Array.from(lookup.keys()).sort();

    expect(keys).toEqual(
      ['1-across', '1-down', '2-down', '3-down', '4-across', '5-across'].sort()
    );
  });

  it('each slot entry carries the correct orientation and start', () => {
    const lookup = buildSlotLookup(smallGridWithBlackCorner());

    expect(lookup.get('1-across')?.orientation).toBe('across');
    expect(lookup.get('1-across')?.start).toEqual({ col: 0, row: 0 });

    expect(lookup.get('1-down')?.orientation).toBe('down');
    expect(lookup.get('1-down')?.start).toEqual({ col: 0, row: 0 });

    expect(lookup.get('2-down')?.start).toEqual({ col: 1, row: 0 });
    expect(lookup.get('3-down')?.start).toEqual({ col: 2, row: 0 });
    expect(lookup.get('4-across')?.start).toEqual({ col: 0, row: 1 });
    expect(lookup.get('5-across')?.start).toEqual({ col: 0, row: 2 });
  });
});

// --- P5-1: activeHintKey ---
describe('P5-1 activeHintKey', () => {
  const lookup = buildSlotLookup(smallGridWithBlackCorner());

  it('resolves the start cell in each orientation to its own slot', () => {
    const acrossCursor: CursorState = { current: { col: 0, row: 0 }, orientation: 'across' };
    const downCursor: CursorState = { current: { col: 0, row: 0 }, orientation: 'down' };

    expect(activeHintKey(lookup, acrossCursor)).toBe('1-across');
    expect(activeHintKey(lookup, downCursor)).toBe('1-down');
  });

  it('resolves a non-start cell to the slot it belongs to', () => {
    const downCursor: CursorState = { current: { col: 1, row: 1 }, orientation: 'down' };
    expect(activeHintKey(lookup, downCursor)).toBe('2-down');

    const acrossCursor: CursorState = { current: { col: 1, row: 1 }, orientation: 'across' };
    expect(activeHintKey(lookup, acrossCursor)).toBe('4-across');
  });

  it('returns null when no slot matches the cursor orientation at that coord', () => {
    // A single row: one across slot exists, but every down "run" is length 1,
    // so no down slot exists anywhere in this grid at all.
    const oneRowGrid = createGrid({ cols: 3, rows: 1 });
    const oneRowLookup = buildSlotLookup(oneRowGrid);
    const cursor: CursorState = { current: { col: 1, row: 0 }, orientation: 'down' };

    expect(activeHintKey(oneRowLookup, cursor)).toBeNull();
  });
});

// --- P5-1: isHintFilled ---
describe('P5-1 isHintFilled', () => {
  it('a missing key is not filled', () => {
    expect(isHintFilled({}, '1-across')).toBe(false);
  });

  it('an empty string is not filled', () => {
    expect(isHintFilled({ '1-across': '' }, '1-across')).toBe(false);
  });

  it('a whitespace-only string is not filled', () => {
    expect(isHintFilled({ '1-across': '   ' }, '1-across')).toBe(false);
  });

  it('non-blank text is filled', () => {
    expect(isHintFilled({ '1-across': 'A real clue' }, '1-across')).toBe(true);
  });
});
