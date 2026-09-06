import { describe, it, expect } from 'vitest';
import { normalizeTitle, duplicateTitle } from './puzzle-title';

// --- M1-1: normalizeTitle (unchanged from Story M1) ---
describe('M1-1 normalizeTitle', () => {
  it('leaves an ordinary title unchanged', () => {
    expect(normalizeTitle('Monday Puzzle')).toBe('Monday Puzzle');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeTitle('  Padded  ')).toBe('Padded');
  });

  it('falls back to the default for an empty string', () => {
    expect(normalizeTitle('')).toBe('Untitled Puzzle');
  });

  it('falls back to the default for a whitespace-only string', () => {
    expect(normalizeTitle('   ')).toBe('Untitled Puzzle');
    expect(normalizeTitle('\t\n ')).toBe('Untitled Puzzle');
  });

  it('preserves internal whitespace', () => {
    expect(normalizeTitle('  Two  Words  ')).toBe('Two  Words');
  });

  it('purity: two calls with the same input are equal', () => {
    expect(normalizeTitle('Anything')).toBe(normalizeTitle('Anything'));
    expect(normalizeTitle('')).toBe(normalizeTitle(''));
  });
});

// --- M4-1: duplicateTitle ---
describe('M4-1 duplicateTitle', () => {
  it('prefixes an ordinary title', () => {
    expect(duplicateTitle('Monday Puzzle')).toBe('Copy of Monday Puzzle');
  });

  it('prefixes the default title', () => {
    expect(duplicateTitle('Untitled Puzzle')).toBe('Copy of Untitled Puzzle');
  });

  it('does not deduplicate: a copy of a copy stacks the prefix', () => {
    expect(duplicateTitle('Copy of Monday Puzzle')).toBe('Copy of Copy of Monday Puzzle');
  });

  it('normalizes a blank source title before prefixing', () => {
    expect(duplicateTitle('')).toBe('Copy of Untitled Puzzle');
    expect(duplicateTitle('   ')).toBe('Copy of Untitled Puzzle');
  });

  it('trims a padded source title before prefixing', () => {
    expect(duplicateTitle('  Padded  ')).toBe('Copy of Padded');
  });

  it('purity: two calls with the same input are equal', () => {
    expect(duplicateTitle('Anything')).toBe(duplicateTitle('Anything'));
  });
});
