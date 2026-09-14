import { describe, it, expect } from 'vitest';
import { stepStates } from './stepper';
import type { Step, StepId } from './stepper';

function byId(steps: readonly Step[], id: StepId): Step {
  const step = steps.find((s) => s.id === id);
  if (!step) throw new Error(`no step ${id}`);
  return step;
}

const GRID = { phase: 'grid' as const, hintsComplete: false, isPublished: false };
const HINTS = { phase: 'hints' as const, hintsComplete: false, isPublished: false };
const PUBLISHED = { phase: 'hints' as const, hintsComplete: true, isPublished: true };

const ALL_INPUTS = [
  GRID,
  { ...GRID, hintsComplete: true },
  HINTS,
  { ...HINTS, hintsComplete: true },
  PUBLISHED,
  { ...PUBLISHED, hintsComplete: false },
];

// --- D5b-1: shape and invariants ---
describe('D5b-1 stepStates shape', () => {
  it('always returns exactly three steps in order', () => {
    for (const args of ALL_INPUTS) {
      expect(stepStates(args).map((s) => s.id)).toEqual(['build', 'clues', 'publish']);
    }
  });

  it('every step has a non-empty label', () => {
    for (const step of stepStates(GRID)) {
      expect(step.label.length).toBeGreaterThan(0);
    }
  });

  it('a reason is present exactly when a step is unavailable', () => {
    for (const args of ALL_INPUTS) {
      for (const step of stepStates(args)) {
        if (step.status === 'unavailable') {
          expect(step.reason ?? '', `${step.id} reason`).not.toBe('');
        } else {
          expect(step.reason, `${step.id} reason`).toBeUndefined();
        }
      }
    }
  });

  it('purity: two calls with the same input are deep-equal', () => {
    expect(stepStates(HINTS)).toEqual(stepStates(HINTS));
  });
});

// --- D5b-1: grid and clues steps ---
describe('D5b-1 grid and clues steps', () => {
  it('grid phase: build is current and clues is available', () => {
    const steps = stepStates(GRID);

    expect(byId(steps, 'build').status).toBe('current');
    expect(byId(steps, 'clues').status).toBe('available');
  });

  it('hints phase: clues is current and build is unavailable', () => {
    const steps = stepStates(HINTS);

    expect(byId(steps, 'clues').status).toBe('current');
    expect(byId(steps, 'build').status).toBe('unavailable');
    expect(byId(steps, 'build').reason ?? '').toMatch(/grid/i);
  });

  it('once published, clues reads as complete', () => {
    expect(byId(stepStates(PUBLISHED), 'clues').status).toBe('complete');
  });
});

// --- PB3-1: the publish step ---
describe('PB3-1 publish step', () => {
  it('grid phase: publish is unavailable, with a reason', () => {
    const publish = byId(stepStates(GRID), 'publish');

    expect(publish.status).toBe('unavailable');
    expect(publish.reason ?? '').not.toBe('');
  });

  it('grid phase stays unavailable regardless of hint completeness', () => {
    expect(byId(stepStates({ ...GRID, hintsComplete: true }), 'publish').status).toBe(
      'unavailable'
    );
  });

  it('hints phase, unpublished: publish is available with no reason', () => {
    const publish = byId(stepStates(HINTS), 'publish');

    expect(publish.status).toBe('available');
    expect(publish.reason).toBeUndefined();
  });

  it('publish is available even when hints are incomplete', () => {
    // the epic's governing principle: quality never blocks publishing
    expect(byId(stepStates({ ...HINTS, hintsComplete: false }), 'publish').status).toBe(
      'available'
    );
  });

  it('hints phase, published: publish is the current step', () => {
    expect(byId(stepStates(PUBLISHED), 'publish').status).toBe('current');
  });

  it('a published puzzle with incomplete hints is still current at publish', () => {
    expect(byId(stepStates({ ...PUBLISHED, hintsComplete: false }), 'publish').status).toBe(
      'current'
    );
  });
});
