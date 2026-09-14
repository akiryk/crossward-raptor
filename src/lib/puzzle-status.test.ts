import { describe, it, expect } from 'vitest';
import { puzzleStatus } from './puzzle-status';
import type { Visibility } from './puzzle-status';

const PUBLISHED_AT = new Date('2026-09-07T12:00:00.000Z');

function status(args: {
  phase?: 'grid' | 'hints';
  hintsComplete?: boolean;
  publishedAt?: Date | null;
  visibility?: Visibility;
}) {
  return puzzleStatus({
    phase: args.phase ?? 'grid',
    hintsComplete: args.hintsComplete ?? false,
    publishedAt: args.publishedAt ?? null,
    visibility: args.visibility ?? 'private',
  });
}

// --- PB5-1: puzzleStatus ---
describe('PB5-1 unpublished puzzles', () => {
  it('grid phase reads as grid', () => {
    expect(status({ phase: 'grid' }).kind).toBe('grid');
  });

  it('hints phase with incomplete hints reads as hints, and says so', () => {
    const result = status({ phase: 'hints', hintsComplete: false });

    expect(result.kind).toBe('hints');
    expect(result.label).toMatch(/incomplete/i);
  });

  it('hints phase with complete hints reads as hints, and says so', () => {
    const result = status({ phase: 'hints', hintsComplete: true });

    expect(result.kind).toBe('hints');
    expect(result.label).toMatch(/complete/i);
    expect(result.label).not.toMatch(/incomplete/i);
  });
});

describe('PB5-1 published puzzles', () => {
  it('private publishing says private', () => {
    const result = status({
      phase: 'hints',
      hintsComplete: true,
      publishedAt: PUBLISHED_AT,
      visibility: 'private',
    });

    expect(result.kind).toBe('published');
    expect(result.label).toMatch(/private/i);
  });

  it('public publishing says public', () => {
    const result = status({
      phase: 'hints',
      hintsComplete: true,
      publishedAt: PUBLISHED_AT,
      visibility: 'public',
    });

    expect(result.kind).toBe('published');
    expect(result.label).toMatch(/public/i);
  });

  it('published outranks phase and hint completeness', () => {
    const result = status({
      phase: 'hints',
      hintsComplete: false,
      publishedAt: PUBLISHED_AT,
      visibility: 'private',
    });

    expect(result.kind).toBe('published');
    expect(result.label).not.toMatch(/incomplete/i);
  });
});

describe('PB5-1 general properties', () => {
  const INPUTS = [
    { phase: 'grid' as const, hintsComplete: false, publishedAt: null },
    { phase: 'hints' as const, hintsComplete: false, publishedAt: null },
    { phase: 'hints' as const, hintsComplete: true, publishedAt: null },
    { phase: 'hints' as const, hintsComplete: true, publishedAt: PUBLISHED_AT },
  ];

  it('every label is non-empty', () => {
    for (const input of INPUTS) {
      for (const visibility of ['private', 'public'] as Visibility[]) {
        const result = puzzleStatus({ ...input, visibility });
        expect(result.label.trim().length, JSON.stringify({ ...input, visibility })).toBeGreaterThan(
          0
        );
      }
    }
  });

  it('purity: two calls with the same input are deep-equal', () => {
    const args = {
      phase: 'hints' as const,
      hintsComplete: true,
      publishedAt: PUBLISHED_AT,
      visibility: 'public' as Visibility,
    };

    expect(puzzleStatus(args)).toEqual(puzzleStatus(args));
  });
});
