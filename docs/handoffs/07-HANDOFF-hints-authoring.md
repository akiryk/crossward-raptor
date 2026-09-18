# Hints Authoring — Handoff

Current state of the crossword-builder project's seventh epic, for an agent
or collaborator picking it up fresh. Read alongside
`docs/epics/07-hints-authoring-epic.md` and `AGENTS.md`, which remain
authoritative for scope and behavior.

Repo: `crossward-raptor`. Branch `main`, tracking `origin/main`.

---

## Where things stand

**Story H1 (confirming the move to hints phase) is complete and
committed.** "Write clues" in the stepper had been an intentional no-op
since visual-polish-02 removed the old enter-hints button and its
confirmation; this story wires the stepper click back up to the existing,
untouched `enterHintsPhase` engine function and `enterHints` Server
Action, behind a real confirmation dialog.

The repo had no dialog/modal primitive before this story. `Modal`
(`src/components/ui/Modal.tsx`) is new and deliberately minimal — a
backdrop, a title, a body, cancel/confirm buttons; Escape and a backdrop
click both cancel; no focus trap, no portal, no stacking, no animation.
It renders `null` when closed. `EnterHintsDialog`
(`src/components/grid/EnterHintsDialog.tsx`) wraps it and owns the
transition's specific copy, kept in its own file so rewording never risks
touching transition logic. Per the story's own decision, the copy
component only renders its wrapper element (and thus only exists in the
DOM) while open — matching `Modal`'s own null-when-closed behavior — which
took one iteration to get right: a wrapper `<div>` holding only `Modal`'s
`position: fixed` content collapses to a zero-size box and reads as
"hidden" to Playwright even though it's technically present, so the
wrapper carries the same `fixed inset-0` footprint as `Modal`'s own
container. A related fix landed in `Modal` itself: the centering wrapper
around the dialog panel needed `pointer-events-none` (with
`pointer-events-auto` on the panel itself), otherwise it silently
intercepted backdrop clicks anywhere outside the panel's own box.

`PhaseControls` now accepts and forwards a real `onStepClick`, replacing
the empty function visual-polish-02 left behind. `PuzzleGridEditor` owns
the dialog's open state; confirming flushes pending debounced saves first
(reusing `flushPendingSaves`, the same PB4-review-finding fix already used
before publishing) so a letter typed just before the transition can't be
silently dropped by `enterHintsPhase` reading a stale, unsaved grid.
Cancelling does nothing at all — no partial state, no phase change.

**What this does not touch, per the story's scope discipline:**
`enterHintsPhase`, `enterHints`, `stepStates`, and `Stepper` are all
unchanged. No Prisma or schema changes — the pre-conversion grid snapshot
the epic mentions is separate, not-yet-built work. No grid appearance
changes and no `HintsPanel` changes; the hints-phase grid still renders
exactly as it did before this story (Story H2 in the epic covers that).

**Story H2 (snapshot the grid before locking it) is implemented on
branch `story/07-H2-snapshot-pre-lock-grid`, opened as a PR pending
independent review — not yet merged to `main`.** It's the other half of
what H1 started: `enterHintsPhase` blackens every unfilled cell, so
afterward a black square the builder chose is indistinguishable from one
the conversion produced. This story adds a new nullable
`gridBeforeHints` column (`prisma/schema.prisma`, migration
`20260918212943_add_grid_before_hints`) and writes it, once, at the
transition — read by nothing yet; it's insurance for a future
"reopen the grid" affordance, not a commitment to build one.

`enterHints` (`src/app/puzzles/actions.ts`) now includes
`gridBeforeHints` in its single `prisma.puzzle.update` call, but only
when the loaded puzzle's phase was still `'grid'` — `enterHintsPhase` is
a no-op on a puzzle already in hints phase, so an unconditional write
would let a second call silently overwrite the one true snapshot with
the already-converted grid. The value written is `serializeGrid` of the
grid exactly as loaded, before `enterHintsPhase` runs on it — no extra
query, since `enterHints` already holds that grid in memory. Nothing in
`src/engine/`, `loadPuzzle`, `serializePuzzle`, or `deserializePuzzle`
changed; the snapshot is written and read as raw JSON at the Prisma
layer only, per the story's scope discipline. No UI changes of any kind.

## What exists (files touched, cumulative across this document)

```
docs/epics/
  07-hints-authoring-epic.md   the epic this document tracks
docs/stories/
  07-H1-enter-hints-confirmation.md   Story H1's specification
  07-H2-snapshot-pre-lock-grid.md     Story H2's specification
docs/handoffs/
  07-HANDOFF-hints-authoring.md   this file
e2e/
  enter-hints.spec.ts            Story H1's acceptance test — do not edit
  enter-hints-snapshot.spec.ts   Story H2's acceptance test — do not edit
  helpers/read-puzzle-row.ts     Story H2 — test-only read-back of a raw
                                   puzzle row, bypassing Server Actions
src/components/ui/
  Modal.tsx   new — reusable open/title/confirm/cancel dialog
src/components/grid/
  EnterHintsDialog.tsx   new — the enter-hints confirmation copy, wraps Modal
  PhaseControls.tsx      accepts and forwards onStepClick (was a no-op)
  PuzzleGridEditor.tsx   dialog state; onStepClick opens it for 'clues';
                          confirming flushes pending saves, then calls the
                          existing enterHints Server Action
prisma/
  schema.prisma   Story H2 — new nullable Puzzle.gridBeforeHints column
  migrations/20260918212943_add_grid_before_hints/   Story H2 — the
    generated migration
src/app/puzzles/
  actions.ts   Story H2 — enterHints writes gridBeforeHints, once, only
                on the actual grid->hints crossing
```

## The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, 270 Vitest
tests passing (unchanged by either H1 or H2 — neither story added engine
or lib logic). `npm run test:e2e`: 209 Playwright tests passing (9 from
H1's `enter-hints.spec.ts`, 5 from H2's `enter-hints-snapshot.spec.ts`).
