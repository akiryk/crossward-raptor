// 24-S1 acceptance: the operation envelope and its content kinds.
import { describe, expect, it } from 'vitest';
import { parseOperation } from './operation';

const envelope = { opId: 'op-1', puzzleId: 'puzzle-1', clientId: 'tab-1', epoch: 0, baseVersion: 3 };
const cells = { ...envelope, kind: 'cells', writes: [{ col: 0, row: 1, value: 'M' }, { col: 0, row: 2, value: null }] };

describe('24-S1-1 parsing an operation', () => {
  it('accepts each content kind and keeps only known fields', () => {
    expect(parseOperation({ ...cells, extra: true, writes: [{ col: 0, row: 1, value: 'M', note: 1 }] })).toEqual({
      ok: true, op: { ...envelope, kind: 'cells', writes: [{ col: 0, row: 1, value: 'M' }] },
    });
    expect(parseOperation({ ...envelope, kind: 'hint', key: '12-down', text: '  Any text  ' })).toEqual({
      ok: true, op: { ...envelope, kind: 'hint', key: '12-down', text: '  Any text  ' },
    });
    expect(parseOperation({ ...envelope, kind: 'title', title: 'My Puzzle' })).toEqual({
      ok: true, op: { ...envelope, kind: 'title', title: 'My Puzzle' },
    });
  });

  it('accepts a rebus and a clear, and returns a copy', () => {
    const input = structuredClone({ ...cells, writes: [{ col: 2, row: 0, value: 'STAR1' }, { col: 3, row: 0, value: null }] });
    const before = structuredClone(input);
    const parsed = parseOperation(input);
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.op.kind === 'cells') expect(parsed.op.writes).not.toBe(input.writes);
    expect(input).toEqual(before);
  });

  it.each([
    ['not an object', null],
    ['an array', [cells]],
    ['no opId', { ...cells, opId: undefined }],
    ['an empty opId', { ...cells, opId: '' }],
    ['an opId with spaces', { ...cells, opId: 'a b' }],
    ['a long opId', { ...cells, opId: 'x'.repeat(101) }],
    ['no puzzleId', { ...cells, puzzleId: undefined }],
    ['no clientId', { ...cells, clientId: 7 }],
    ['a negative epoch', { ...cells, epoch: -1 }],
    ['a fractional epoch', { ...cells, epoch: 0.5 }],
    ['a string baseVersion', { ...cells, baseVersion: '3' }],
    ['an unknown kind', { ...envelope, kind: 'lock', word: {} }],
    ['no writes', { ...cells, writes: [] }],
    ['writes not an array', { ...cells, writes: { col: 0, row: 0, value: 'A' } }],
    ['a negative column', { ...cells, writes: [{ col: -1, row: 0, value: 'A' }] }],
    ['a fractional row', { ...cells, writes: [{ col: 0, row: 1.5, value: 'A' }] }],
    ['a lowercase letter', { ...cells, writes: [{ col: 0, row: 0, value: 'a' }] }],
    ['an empty value', { ...cells, writes: [{ col: 0, row: 0, value: '' }] }],
    ['punctuation', { ...cells, writes: [{ col: 0, row: 0, value: 'A-B' }] }],
    ['a rebus over 10', { ...cells, writes: [{ col: 0, row: 0, value: 'ABCDEFGHIJK' }] }],
    ['a missing value', { ...cells, writes: [{ col: 0, row: 0 }] }],
    ['a cell written twice', { ...cells, writes: [{ col: 0, row: 0, value: 'A' }, { col: 0, row: 0, value: 'B' }] }],
    ['too many writes', { ...cells, writes: Array.from({ length: 1025 }, (_, i) => ({ col: i, row: 0, value: 'A' })) }],
    ['a malformed hint key', { ...envelope, kind: 'hint', key: '1-sideways', text: '' }],
    ['a hint key 0', { ...envelope, kind: 'hint', key: '0-across', text: '' }],
    ['a hint without text', { ...envelope, kind: 'hint', key: '1-across' }],
    ['a hint over 2000', { ...envelope, kind: 'hint', key: '1-across', text: 'x'.repeat(2001) }],
    ['a title not a string', { ...envelope, kind: 'title', title: 5 }],
    ['a title over 500', { ...envelope, kind: 'title', title: 'x'.repeat(501) }],
  ])('refuses %s', (_name, input) => {
    expect(parseOperation(input)).toEqual({ ok: false });
  });

  it('accepts the limits themselves', () => {
    expect(parseOperation({ ...cells, writes: Array.from({ length: 1024 }, (_, i) => ({ col: i, row: 0, value: 'A' })) }).ok).toBe(true);
    expect(parseOperation({ ...envelope, kind: 'hint', key: '1-across', text: 'x'.repeat(2000) }).ok).toBe(true);
    expect(parseOperation({ ...envelope, kind: 'title', title: 'x'.repeat(500) }).ok).toBe(true);
    expect(parseOperation({ ...cells, writes: [{ col: 0, row: 0, value: 'ABCDEFGHIJ' }] }).ok).toBe(true);
  });
});
