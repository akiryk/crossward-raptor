# Story H1 — Confirming the move to hints phase

First slice of the hints-authoring epic. "Write clues" in the stepper is
currently an intentional no-op: visual-polish-02 removed the transition
button and its confirmation, leaving `onStepClick` empty and the engine
call untouched behind it. This story wires that click back up, behind a
confirmation dialog, and builds the reusable `Modal` the repo doesn't
have yet.

Entering hints phase is irreversible — geometry freezes permanently — so
it must not happen on a single stray click.

Repo paths:
- `src/components/ui/Modal.tsx` — new: reusable confirm/cancel dialog
- `src/components/grid/EnterHintsDialog.tsx` — new: the copy, isolated so
  it can be reworded without touching transition logic
- `src/components/grid/PhaseControls.tsx` — edited: accepts and forwards
  `onStepClick`
- `src/components/grid/PuzzleGridEditor.tsx` — edited: dialog state, and
  calling the existing `enterHints` Server Action
- `e2e/enter-hints.spec.ts` — new (**already provided — do not edit**)

## What already works and is not touched

- `enterHintsPhase` (engine) and `enterHints` (Server Action) are built,
  tested, and correct. This story calls them; it does not change them.
- `stepStates` already marks `build` as `'unavailable'` in hints phase
  with an explanatory reason, and `clues` as `'available'` in grid phase.
  No change.
- `Stepper` already renders unavailable steps greyed and reveals their
  reason on click instead of firing `onStepClick`. No change — a builder
  who clicks "Build the grid" after the transition gets told why it's
  locked, which is better than an inert label.
- `HintsPanel` already renders once `phase === 'hints'`. No change.

## Required contract

```tsx
// src/components/ui/Modal.tsx (new)
export function Modal(props: {
  open: boolean;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}): React.JSX.Element | null;
```

Renders `null` when `open` is false. When open: a backdrop, the title,
`children` as the body, and cancel/confirm buttons. Escape and a
backdrop click both call `onCancel`. Nothing else — no focus trap, no
animation, no portal, no stacking. Built to this story's need; a second
consumer can extend it.

```tsx
// src/components/grid/EnterHintsDialog.tsx (new)
export function EnterHintsDialog(props: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}): React.JSX.Element;
```

Wraps `Modal` and owns the copy. Title: "Ready to write clues?" Body,
as separate paragraphs:

> Writing clues locks your grid. Every empty square becomes a black
> square, and the black-and-white pattern is fixed from then on — you
> won't be able to add or remove black squares, or change how long any
> word is.
>
> You'll still be able to change letters afterward.
>
> If you haven't already, preview your grid first to see how it will
> look.

Confirm label: "Write clues". Cancel label: "Keep building".

```tsx
// src/components/grid/PhaseControls.tsx (edited)
// gains: onStepClick: (id: StepId) => void
// and forwards it to Stepper in place of the empty function
```

## Markup contract

- `data-testid="modal"` on the dialog container, rendered only when open.
- `data-testid="modal-backdrop"`, `data-testid="modal-title"`,
  `data-testid="modal-confirm"`, `data-testid="modal-cancel"`.
- `data-testid="enter-hints-dialog"` on the `Modal` rendered by
  `EnterHintsDialog`, so a spec can distinguish it from any future
  dialog.

## Decisions

**The modal is built here rather than in its own story.** A `Modal` with
no consumer has no observable behavior, and this repo has no
component-unit-test setup — every test is pure-engine Vitest or
Playwright. Building it alongside its first consumer is what makes it
verifiable at all. It still lands in `src/components/ui/` and is written
to be reused.

**Copy lives in its own component, not in `Modal` or the editor.**
Rewording is the most likely future change to this feature, and it
should never risk touching transition logic.

**Only the `clues` step is wired.** `onStepClick` receives a `StepId`,
but `build` and `publish` never reach it — `Stepper` routes unavailable
steps and the publish step to its own reveal behavior. The handler
ignores any id other than `'clues'` rather than assuming it can't
arrive.

**Cancelling does nothing at all.** No partial state, no "you were
asked" flag, no phase change. The dialog closes and the puzzle is
exactly as it was.

**Pending debounced saves are flushed before transitioning.**
`enterHints` reloads the puzzle from the database, so an unsaved letter
typed within the last 500ms would be silently dropped by the conversion
— it would read as an empty cell and be blackened. `flushPendingSaves`
already exists for precisely this class of race (PB4 review finding) and
is reused here.

**The snapshot of the pre-conversion grid is not in this story.** It
needs a Prisma column and is separate work; see the epic. Puzzles
transitioned before it lands keep no original.

## Scope discipline

- No changes to `enterHintsPhase`, `enterHints`, `stepStates`, or
  `Stepper`.
- No Prisma or schema changes.
- No changes to `HintsPanel`, its layout, or its contents.
- No new tokens, no grid appearance changes — the hints-phase grid still
  renders exactly as it does today. H2 handles that.
- No EDIT GRID mode, no deletion blocking.
- `Modal` gains no features this story doesn't use.

## Acceptance examples

**H1-1 — the dialog (Playwright, `e2e/enter-hints.spec.ts`)**
- In grid phase, the `clues` step reports
  `data-step-status="available"` and no dialog is present.
- Clicking it opens `enter-hints-dialog`; the puzzle is still in grid
  phase (`build` still `current`, no `hints-region`).
- Cancelling closes the dialog and leaves the puzzle in grid phase.
- Escape closes it; a backdrop click closes it. Both leave grid phase
  intact.
- Confirming closes the dialog and moves to hints phase: `hints-region`
  appears, `clues` becomes `current`, `build` becomes `unavailable`.
- The transition survives a reload — it was persisted, not just local
  state.
- After the transition, clicking `build` does not return to grid phase;
  it reveals `step-reason` instead.
- After the transition, empty cells have become black: a cell that was
  empty in grid phase reports `data-kind="black"`.

## Definition of done

1. `e2e/enter-hints.spec.ts` passes: `npm run test:e2e`.
2. Every other spec passes unmodified. **Check this rather than assuming
   it.**
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
