import { describe, it, expect } from 'vitest';
import { normalizeTitle } from './puzzle-title';

// --- M1-1: normalizeTitle ---
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
