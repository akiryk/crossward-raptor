# Story D5b — Stepper navigation

Sixth slice of the visual-design epic. Adds the sense-of-place header —
build the grid → write clues → publish — and makes its labels the primary
navigation, with the "Continue to hints" button kept alongside but made
less prominent.

Repo paths:
- `src/lib/stepper.ts` — new
- `src/lib/stepper.test.ts` — Vitest acceptance tests (**already
  provided — do not edit**)
- `src/components/grid/Stepper.tsx` — new
- `src/components/grid/PhaseControls.tsx` — edited: renders the stepper,
  demotes the continue button
- `e2e/stepper.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

**`data-testid="phase-badge"` stays exactly as it is.** Three committed
specs assert on its text (`phase-controls.spec.ts`,
`hints-transition.spec.ts`, `preview.spec.ts`). The stepper is added
alongside it; the badge is not folded into it, renamed, or removed.

## Required contract

```ts
// src/lib/stepper.ts
import type { Phase } from '../engine/puzzle';

export type StepId = 'build' | 'clues' | 'publish';
export type StepStatus = 'complete' | 'current' | 'available' | 'unavailable';

export interface Step {
  readonly id: StepId;
  readonly label: string;
  readonly status: StepStatus;
  /** Present only when status is 'unavailable'. Explains what's in the way. */
  readonly reason?: string;
}

export function stepStates(args: {
  phase: Phase;
  hintsComplete: boolean;
}): readonly Step[];
```

Always three steps, in order: `build`, `clues`, `publish`.

## Markup contract

- `data-testid="stepper"` wraps the three steps.
- Each step: `data-testid="step"`, `data-step-id`, `data-step-status`.
- Clicking an `unavailable` step reveals `data-testid="step-reason"`
  containing that step's `reason` text.
- The continue button keeps `data-testid="enter-hints-button"` and its
  existing behaviour, rendered with the `quiet` variant.

## Decisions

**Step state is derived, not stored.** `stepStates` is a pure function of
phase and hint completeness, so what the header shows can't drift from
what the puzzle actually is.

**Reasons are revealed by click, not hover.** Hover doesn't exist on touch
devices, so an explanation only available on hover isn't available at all
on a phone. Clicking an unavailable step reveals its reason inline — the
same pattern P4 established for the geometry-locked message. A `title`
attribute may be added for desktop hover as well, but the click path is
the one that's guaranteed and the one that's tested.

**The build step is unavailable once you're past it, and says why.**
There's no reverse hints→grid transition, so clicking "Build the grid"
from hints phase can't do anything. Explaining that is better than a dead
label: "The grid is locked once you start writing clues."

**Publish is honestly unavailable.** Publishing isn't built — epic 4's
PB2–PB5 are deferred until this epic finishes. So the step exists to show
where the work is heading, and its reason says plainly that it isn't
available yet. When hints are incomplete, the reason names that instead,
since it's the thing the builder can act on.

**Publish is never "blocked" in the sense the publishing epic forbids.**
That epic's governing principle is that a builder may publish whatever
they like. Nothing here contradicts it: the step is unavailable because
the feature doesn't exist, not because the puzzle failed a check. When
PB3 lands, this step becomes available regardless of readiness.

**The continue button gets the `quiet` variant.** It's currently the most
prominent thing on the page during the phase where you least want to be
nudged toward leaving. The stepper carries the navigation; the button is a
secondary path to the same action.

## Scope discipline

- **No reverse hints→grid transition.** Explained, not built.
- **No publishing.** Epic 4.
- **No changes to `enterHintsPhase`, its confirmation, or its persistence.**
  Clicking "Write clues" from grid phase triggers the same flow the
  continue button does, confirmation included.
- **No changes to `phase-badge`.**
- **No layout changes.** D5a owns the grid/hints arrangement.
- **No new tokens.**

## Acceptance examples

**D5b-1 — `stepStates` (Vitest)**
- Grid phase: `build` is `current`; `clues` is `available`; `publish` is
  `unavailable` with a non-empty reason.
- Hints phase: `build` is `unavailable` with a reason mentioning the grid
  being locked; `clues` is `current`; `publish` is `unavailable`.
- Hints phase with `hintsComplete: false`: publish's reason refers to
  unwritten clues.
- Hints phase with `hintsComplete: true`: publish's reason refers to
  publishing not being available yet, not to clues.
- Always exactly three steps, in the order `build`, `clues`, `publish`.
- Every `unavailable` step has a non-empty reason; no other status does.
- Purity: two calls with the same input are deep-equal.

**D5b-2 — the stepper (Playwright)**
- In grid phase, three steps render; `build` reports `current` and `clues`
  reports `available`.
- Clicking the `publish` step reveals `step-reason` with visible text.
- Clicking `clues` from grid phase starts the hints transition — the
  confirmation appears, and confirming moves to hints phase.
- In hints phase, `build` reports `unavailable`, and clicking it reveals a
  reason rather than changing phase.
- `enter-hints-button` is still present in grid phase and still works.
- `phase-badge` still reports the phase, unchanged.
- No horizontal overflow at 375×667 with the stepper present.

## Definition of done

1. `npx vitest run src/lib/stepper.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/stepper.spec.ts` passes: `npm run test:e2e`.
3. Every other spec passes unmodified. **Check rather than assume** —
   demoting the continue button and adding a header can move elements that
   other specs click.
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
