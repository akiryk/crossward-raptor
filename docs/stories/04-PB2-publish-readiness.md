# Story PB2 — Publish readiness (advisory)

Second slice of the publishing epic, resuming it after epic 05. Reports
what's unfinished about a puzzle so a builder can decide knowingly. Every
finding is informational — nothing here blocks anything, per the epic's
governing principle that the builder decides when a puzzle is done.

Repo paths:
- `src/lib/publish-readiness.ts` — new
- `src/lib/publish-readiness.test.ts` — Vitest acceptance tests (**already
  provided — do not edit**)
- `src/components/grid/ReadinessPanel.tsx` — new
- `src/components/grid/Stepper.tsx` — edited: the publish step's revealed
  content renders the panel
- `e2e/publish-readiness.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

`e2e/stepper.spec.ts` should pass unmodified — `step-reason` still exists
and still has visible text; the panel renders inside it. If that turns out
not to be achievable, stop and say so rather than editing it.

## Required contract

```ts
// src/lib/publish-readiness.ts
import type { Puzzle } from '../engine/puzzle';

export type FindingKind =
  | 'unfilled-cells'
  | 'unwritten-hints'
  | 'short-answers'
  | 'unchecked-squares'
  | 'asymmetric';

export interface Finding {
  readonly kind: FindingKind;
  /** How many instances. Absent for findings that aren't countable. */
  readonly count?: number;
  /** Human-readable, e.g. "3 squares have no letter". */
  readonly message: string;
}

/**
 * Everything a builder might want to know before publishing. Returns only
 * findings that apply; an empty array means nothing is outstanding.
 * Advisory only — no caller should treat this as a gate.
 */
export function publishReadiness(puzzle: Puzzle): readonly Finding[];
```

## What each finding means

- **`unfilled-cells`** — active cells holding no letter. After PB1a's
  conversion there should be none in hints phase unless the builder deleted
  a letter afterward.
- **`unwritten-hints`** — required hints missing or blank, using the same
  rule `hintsComplete` already encodes.
- **`short-answers`** — slots shorter than three letters. The convention is
  a three-letter minimum; `extractSlots` already enforces only two, so this
  reports the gap rather than changing it.
- **`unchecked-squares`** — active cells not covered by *both* an across
  slot and a down slot. Conventionally every white square belongs to two
  answers, so each letter is confirmed by two clues.
- **`asymmetric`** — the black pattern lacks 180° rotational symmetry.
  Uncountable, so no `count`. Uses `isSymmetric`, which has existed since
  Story A with no caller outside its own tests.

## Decisions

**Advisory, and structurally unable to be a gate.** The function returns
findings, not a boolean. There is no `canPublish`, no `isReady` — nothing a
caller could mistake for permission. That's deliberate: the epic's
governing principle is that a builder may publish whatever they like, and
the easiest way to keep that true is to never compute the opposite.

**All-over interlock is still deferred.** Nothing in the engine does graph
connectivity, so checking whether black squares cut the grid into islands
needs a flood-fill that doesn't exist. Real work, no dependency from the
play epic, and the other four checks reuse data already computed.

**The panel renders inside the stepper's publish step.** Clicking that step
already reveals `step-reason`; now it reveals the findings. That puts the
information exactly where a builder asks "can I publish?" without adding
page furniture before PB3 has a publish control to sit beside. PB3 can
reuse the component in its own context.

**`stepper.ts`'s one-line reason stays as it is.** It and the panel are two
levels of detail on the same question, which is mild duplication — but
changing `stepStates` would mean editing its committed tests for a
cosmetic gain, and the one-liner is what the step needs when the panel
isn't open.

**A clean puzzle says so.** An empty findings array renders as an explicit
"nothing outstanding" message rather than blank space, so the absence of
findings is distinguishable from the panel failing to render.

## Markup contract

- `data-testid="readiness-panel"` — rendered inside the publish step's
  `step-reason`.
- `data-testid="finding"` with `data-finding-kind`, one per finding, each
  with its message as visible text.
- `data-testid="readiness-clear"` — shown instead when there are no
  findings.

## Scope discipline

- **No publishing.** PB3.
- **No `publishedAt`, no schema change.**
- **No interlock check.**
- **No gating of anything, anywhere.**
- **No changes to `src/engine/`** — all five checks consume existing
  functions.
- **No changes to `stepper.ts` or its tests.**

## Acceptance examples

**PB2-1 — `publishReadiness` (Vitest)**
- A 3×3 fully active grid with one letter and no hints reports
  `unfilled-cells` with count 8 and `unwritten-hints` with count 6.
- The same grid with every cell lettered reports no `unfilled-cells`.
- A puzzle whose every required hint is authored reports no
  `unwritten-hints`; one blank hint reports count 1; a whitespace-only
  hint counts too.
- A 3×1 grid reports `unchecked-squares` with count 3 — the row is an
  across answer, but no column is long enough to be a down answer.
- A 3×3 fully active grid reports no `unchecked-squares`.
- A 3×1 grid with `(2,0)` black reports `short-answers` with count 1 — a
  two-cell run.
- A 3×3 with black only at `(0,0)` reports `asymmetric`, with no `count`.
- A symmetric grid reports no `asymmetric`.
- A puzzle with nothing outstanding returns an empty array.
- Every finding's `message` is non-empty.
- Purity: two calls on the same puzzle are deep-equal, and the puzzle is
  not mutated.

**PB2-2 — the panel (Playwright)**
- Clicking the publish step reveals `readiness-panel` inside `step-reason`.
- A puzzle with unwritten hints shows a `finding` with
  `data-finding-kind="unwritten-hints"` and visible text.
- An asymmetric puzzle shows the `asymmetric` finding.
- A puzzle with nothing outstanding shows `readiness-clear` and no
  `finding` elements.
- The publish step is still `unavailable` — the panel changes nothing about
  what the stepper permits.

## Definition of done

1. `npx vitest run src/lib/publish-readiness.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/publish-readiness.spec.ts` passes.
3. Every other spec passes unmodified, `stepper.spec.ts` included.
   **Check rather than assume.**
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
