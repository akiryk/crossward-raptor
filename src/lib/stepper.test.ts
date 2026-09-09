import { describe, it, expect } from 'vitest';
import { stepStates } from './stepper';
import type { Step, StepId } from './stepper';

function byId(steps: readonly Step[], id: StepId): Step {
  const step = steps.find((s) => s.id === id);
  if (!step) throw new Error(`no step ${id}`);
  return step;
}

// --- D5b-1: stepStates ---
describe('D5b-1 stepStates', () => {
  it('always returns exactly three steps in order', () => {
    for (const args of [
      { phase: 'grid' as const, hintsComplete: false },
      { phase: 'hints' as const, hintsComplete: true },
    ]) {
      const steps = stepStates(args);
      expect(steps.map((s) => s.id)).toEqual(['build', 'clues', 'publish']);
    }
  });

  it('every step has a non-empty label', () => {
    for (const step of stepStates({ phase: 'grid', hintsComplete: false })) {
      expect(step.label.length).toBeGreaterThan(0);
    }
  });

  it('grid phase: build is current and clues is available', () => {
    const steps = stepStates({ phase: 'grid', hintsComplete: false });

    expect(byId(steps, 'build').status).toBe('current');
    expect(byId(steps, 'clues').status).toBe('available');
  });

  it('grid phase: publish is unavailable with a reason', () => {
    const publish = byId(stepStates({ phase: 'grid', hintsComplete: false }), 'publish');

    expect(publish.status).toBe('unavailable');
    expect(publish.reason ?? '').not.toBe('');
  });

  it('hints phase: clues is current and build is unavailable', () => {
    const steps = stepStates({ phase: 'hints', hintsComplete: false });

    expect(byId(steps, 'clues').status).toBe('current');
    expect(byId(steps, 'build').status).toBe('unavailable');
    expect(byId(steps, 'build').reason ?? '').toMatch(/grid/i);
  });

  it('publish reason names unwritten clues when hints are incomplete', () => {
    const publish = byId(stepStates({ phase: 'hints', hintsComplete: false }), 'publish');

    expect(publish.status).toBe('unavailable');
    expect(publish.reason ?? '').toMatch(/clue/i);
  });

  it('publish reason refers to availability once hints are complete', () => {
    const publish = byId(stepStates({ phase: 'hints', hintsComplete: true }), 'publish');

    expect(publish.status).toBe('unavailable');
    expect(publish.reason ?? '').not.toMatch(/clue/i);
    expect(publish.reason ?? '').not.toBe('');
  });

  it('a reason is present exactly when a step is unavailable', () => {
    for (const args of [
      { phase: 'grid' as const, hintsComplete: false },
      { phase: 'grid' as const, hintsComplete: true },
      { phase: 'hints' as const, hintsComplete: false },
      { phase: 'hints' as const, hintsComplete: true },
    ]) {
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
    const args = { phase: 'hints' as const, hintsComplete: false };
    expect(stepStates(args)).toEqual(stepStates(args));
  });
});
