# Story P4 — Geometry & phase controls

Fifth slice of the builder-UI epic. Adds the ability to toggle a cell
black/active, an "Enter hints phase" control, and visible feedback when a
geometry edit is rejected because the grid is frozen (Story E). This is
where "what's done vs. not" starts to matter for the grid's shape, not just
its letters (Story P3).

Repo paths:
- `src/lib/keyboard-intent.ts` — edited (existing file from P3): adds a
  `toggleBlack` intent
- `src/lib/keyboard-intent.test.ts` — edited/extended Vitest tests
  (**already provided — do not edit**; P3's existing cases are unchanged,
  new cases added for the `.` key)
- `src/app/puzzles/actions.ts` — edited (existing file from P1/P3): adds
  `enterHints`
- `src/components/grid/PhaseControls.tsx` — new
- `src/components/grid/PuzzleGridEditor.tsx` — edited (existing file from
  P3): adds phase state, geometry-toggle handling, and renders
  `PhaseControls`
- `src/app/puzzles/[id]/page.tsx` — edited (existing file): passes
  `initialPhase` to `PuzzleGridEditor` (existing file — same "stop if it
  conflicts" assumption as every prior story touching it)
- `e2e/phase-controls.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

## Required contract

```ts
// src/lib/keyboard-intent.ts (extended)
export type Intent =
  | { type: 'letter'; letter: string }
  | { type: 'delete' }
  | { type: 'arrow'; direction: import('../engine/cursor').ArrowDirection }
  | { type: 'toggleBlack' };

// keyToIntent('.') === { type: 'toggleBlack' }; everything from P3 unchanged.
```

```ts
// src/app/puzzles/actions.ts (addition)
import type { Phase } from '../../engine/puzzle';

/** Loads the puzzle, transitions it to 'hints' phase via the engine's
 *  enterHintsPhase, persists the result, and returns the new phase. */
export async function enterHints(id: string): Promise<{ phase: Phase }>;
```

```tsx
// src/components/grid/PhaseControls.tsx
import type { Phase } from '../../engine/puzzle';

export function PhaseControls(props: {
  phase: Phase;
  onEnterHints: () => void;
}): JSX.Element;
```

Renders `data-testid="phase-badge"` with the current phase as visible text
(`"grid"` or `"hints"`). Renders a `data-testid="enter-hints-button"` button
that calls `onEnterHints` — only when `phase === 'grid'`; renders nothing in
its place once already in `'hints'` phase (not a disabled button — there's
no forward transition to disable against, so a disabled control would just
be confusing chrome).

```tsx
// src/components/grid/PuzzleGridEditor.tsx (extended)
export function PuzzleGridEditor(props: {
  puzzleId: string;
  initialGrid: SerializedGrid;
  initialPhase: Phase;
}): JSX.Element;
```

Renders `<PhaseControls />` alongside the grid. On a rejected geometry
toggle, renders `data-testid="geometry-locked-message"` with visible text
(e.g. "Geometry is locked in hints phase"), auto-dismissed after ~2 seconds.

## Decisions

**`.` toggles black on the selected cell.** This isn't specified anywhere
in the epic or engine — it's a real, standing convention from crossword-
construction tools (NYT's own constructor tooling and Crossword Compiler
both use it), chosen over inventing something new. `keyToIntent` maps it
unconditionally to `{ type: 'toggleBlack' }`, the same way it maps letters
and arrows — the mapping itself doesn't know or care about phase.

**Phase gating happens where the intent is handled, not in the key
mapping.** `keyToIntent('.')` returns the same intent regardless of current
phase; `PuzzleGridEditor` is what calls `applyGeometryEdit`, which is what
actually enforces the Story E rule and returns `{ ok: false }` in `'hints'`
phase. This mirrors how Group E already separates "what was requested" from
"whether it's currently allowed" — the UI layer shouldn't re-implement that
check itself.

**Toggling passes a placeholder `hints: {}` into the client-side
`applyGeometryEdit` call.** `applyGeometryEdit` takes a full `Puzzle`, but
`PuzzleGridEditor` only holds `grid` and `phase` in state — not `hints`
(that's Story P5's job to add, when there's a hints panel that actually
needs it). This is safe specifically because Story E's own spec is explicit
that `applyGeometryEdit` never reads `hints` for its logic and returns it
back unchanged by reference either way — a placeholder value is inert here,
not a shortcut that risks incorrect behavior. This would **not** be safe
for `enterHintsPhase`, which is why that one runs server-side instead (see
below), not with the same trick.

**`enterHints` runs entirely server-side, not client-side like letter and
geometry edits.** Unlike `applyGeometryEdit`, `enterHintsPhase` actually
needs real, current hint text to compute which required hints are already
authored versus missing. The client doesn't hold real `hints` state in this
story, so running it client-side would silently treat every puzzle as
having zero authored hints — harmless today (nothing can author a hint
before Story P5 exists), but wrong the moment that stops being true. Doing
it server-side, loading the puzzle's real `hints` fresh from the database,
is correct regardless of what the client happens to hold. The action
returns only `{ phase }` — `hints` isn't returned because nothing on the
client consumes it yet.

**Geometry edits reuse Story P3's existing debounced `saveGrid` — no new
autosave path.** A toggle produces a new `Grid`, exactly like a letter edit
does; it flows through the same "update local state, debounce, persist"
effect already built in P3. Nothing new to invent here.

**Symmetric mirroring needs no separate handling.**
`applyGeometryEdit` already delegates to `toggleBlackSymmetric` internally
(Story E); toggling one cell black already blackens its counterpart as a
consequence of calling the existing function correctly. There's no
UI-level mirroring logic to write.

**Rejected geometry edits get a visible, auto-dismissing message — this is
a different kind of feedback than the "no save-status indicator" decision
from Story P3, not a reversal of it.** P3's call was that routine,
successful autosave shouldn't announce itself, matching how real
autosaving tools behave. A *rejected* edit is a different situation: the
builder pressed `.` and nothing visibly happened, with no other way to
learn why. Silence there wouldn't be restraint, it would just be
confusing — so this gets an explicit, if brief, message.

## Scope discipline

- **Letter editing is unaffected.** `place`/`deleteAt` still work in both
  phases exactly as Story P3 left them — this story only adds phase
  awareness for geometry edits.
- **No hints panel, no hint text anywhere in the UI.** Story P5.
- **No "exit hints phase" / back-to-grid control.** Not part of the engine
  (Story E never defined a reverse transition) and not invented here.
- **No changes to `src/engine/`.** This story only consumes existing Group
  E functions.
- **No changes to `PuzzleGrid.tsx`, `GridCell.tsx`, or any of the individual
  cell components.** Toggling changes *which* cell kind gets rendered, not
  how any of P2/P3's rendering components work — no new props needed there.

## Acceptance examples

**P4-1 — `keyToIntent`, extended (Vitest)**
- `'.'` maps to `{ type: 'toggleBlack' }`.
- Every P3 case (letters, `Backspace`, arrows, unhandled keys, purity) is
  unchanged and still passes.

**P4-2 — phase controls and geometry toggling (Playwright)**
- A seeded, fully active puzzle in `'grid'` phase shows
  `data-testid="phase-badge"` with text `"grid"`, and an
  `enter-hints-button`.
- Selecting a cell and pressing `.` turns it (and its symmetric
  counterpart) black — both now show `data-kind="black"`.
- Pressing `.` again on that same cell turns it back active.
- Clicking `enter-hints-button` updates the phase badge to `"hints"` and
  removes the button.
- After entering hints phase, selecting an active cell and pressing `.`
  leaves the grid unchanged and shows `geometry-locked-message` with
  visible text; the message is gone after ~2 seconds (`toBeHidden` after a
  wait, not immediately).
- After entering hints phase, typing a letter into an active cell still
  works exactly as in Story P3 — phase gating applies only to geometry.
- Reloading after entering hints phase still shows `"hints"` in the phase
  badge — proving `enterHints` actually persisted, not just updated local
  state.

## Definition of done

1. `npx vitest run src/lib/keyboard-intent.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/phase-controls.spec.ts` passes: `npm run test:e2e`.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
