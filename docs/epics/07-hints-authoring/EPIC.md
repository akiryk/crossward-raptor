# Epic: Hints Authoring

Make the grid→hints transition real. The engine has supported it since
Story E, and `HintsPanel` already renders beside the grid — but the
control that crosses between phases is a deliberate no-op, and nothing in
the UI reflects that crossing it is irreversible. This epic closes that
gap: a deliberate, explained, one-way commit; a grid that visibly locks;
a scoped way to keep fixing letters afterward without reopening geometry;
and a clue panel that's actually readable while writing 35 clues.

---

## What already exists

Worth stating plainly, because it sets the epic's real size:

- `enterHintsPhase(puzzle)` converts empty cells to black, derives the
  required hints, and seeds each with `''` (Story E, superseded by PB1a).
- `applyGeometryEdit` already rejects in hints phase, and
  `PuzzleGridEditor` already surfaces that as `geometry-locked-message`.
- `HintsPanel` already renders in `hints-region` beside the grid
  (`editor-layout`, `lg:flex-row`), with debounced saves via `saveHints`.
- Clue → grid: `handleHintFocus` looks the slot up through
  `buildSlotLookup` and moves the cursor to it.
- Grid → clue: `activeHintKey(slotLookup, cursor)` reaches `HintsPanel`
  as `activeKey`, and each row already renders `data-active`.
- `PhaseControls` renders `Stepper` with `stepStates({ phase,
  hintsComplete, isPublished })` and an intentionally empty
  `onStepClick`. Its own comment records that the transition button and
  its confirmation were removed in visual-polish-02, leaving the engine
  call and Server Action intact and awaiting exactly the popup H1 builds.

So this epic is not "build the clue panel." It is the transition, the
lock, the edit-mode escape hatch, and a panel legible enough to work in.

## The governing rule

**Geometry is permanent from the moment hints phase begins; letters stay
editable forever.**

Everything else follows. Because the black/active pattern can never
change again, `extractSlots` and `slotsWithNumbers` return the same
answer forever, so numbering is frozen, so the existing `"1-across"` hint
keys can never be orphaned or renumbered. No migration to
coordinate-keyed hints is needed — the lock is what makes number-keys
safe, exactly as Story E argued.

It also means every legal repair is an **overtype**. A word can never
change length, so a builder never needs to clear a cell to fix it; they
type the replacement directly over the old letter.

## Decisions

**The transition is one-way, and the UI must say so.** Step 1 renders
disabled — visible, grey, not clickable — once the puzzle is in hints
phase. A confirmation dialog stands in front of the transition,
explaining what is about to freeze and suggesting the builder preview the
grid first. It does not enumerate specific problems (two-letter words,
blank squares); preview is what that's for.

**The raw grid is snapshotted at the transition, even though nothing
reads it yet.** `enterHintsPhase` blackens every unfilled cell, and
afterward a black square the builder chose is indistinguishable from one
the conversion produced. Preserving the pre-conversion grid costs one
nullable column, written once; not preserving it means every puzzle
converted before someone wants it back is permanently unrecoverable.
Insurance for a future "reopen the grid, lose your clues" affordance, not
a commitment to build one.

**Letter deletion is blocked in hints phase.** Not because it would
corrupt anything — clearing a letter leaves the cell active, so geometry,
symmetry, slots and hint keys are all untouched — but because it can only
ever leave a hole in an otherwise-complete puzzle, and overtyping makes
it unnecessary. Blocking it keeps the grid complete from the transition
onward. No error dialog: the keystroke simply does nothing.

**That block lives in the UI, not the engine.** `deleteAt` is
`(grid, cursor)` by deliberate design so builder and player share it, and
Story E explicitly decided `applyLetterEdit` has no phase check at all.
The guard belongs in `PuzzleGridEditor`'s `handleGridKeyDown`, beside the
existing `publishedAt` guard.

**EDIT GRID is a mode within hints phase, not a return to grid phase.**
It re-enables letter typing and cell clicking, and disables the clue
inputs, because a builder cannot coherently edit both at once. It never
re-enables geometry. Changes save as typed, exactly as everywhere else in
this editor — so there is no snapshot, no revert, and no ambiguity about
what a mid-edit reload means. The button is a straight mode toggle:
"EDIT GRID" while writing clues, "EDIT HINTS" while editing the grid.

**The hints-phase grid looks different from the build-phase grid.** A
locked grid that renders identically to an editable one invites clicks
that will not respond. Hints phase gets its own lettered-cell color;
EDIT GRID mode gets a third, signalling "these are live again."

**Clue rows carry their answer.** A builder scanning 35 rows of bare
numbers cannot tell which clue is which without clicking each one to see
what lights up in the grid — and once the list is long enough to scroll,
the grid may not even be in view. Each row shows its answer inline.

## Non-goals

- **Reopening geometry.** No path back to grid phase, with or without
  losing clues. The snapshot exists so this stays possible later.
- **Mobile and responsive layout.** Desktop only. The two-column
  arrangement may break below a large viewport; fixing that is separate.
- **A layout system.** This epic works within `PuzzleGridEditor`'s
  existing `editor-layout` flex arrangement. A real per-phase layout
  system is acknowledged as needed and deliberately deferred.
- **Warning that an edited answer invalidates its existing clue.**
  Changing REDWING to REDWINE may leave the clue wrong. Builder's
  business.
- **Validating clue text.** No length limits, no duplicate detection, no
  NYT clue conventions.
- **Publishing changes.** Untouched by this epic.

---

## Stories

### H1 — The commit

Everything that happens at the moment of transition.

- "Write clues" in the stepper opens a confirmation dialog instead of
  being a no-op; `onStepClick` is wired for the first time.
- Dialog copy lives in its own component file, editable without touching
  transition logic.
- Confirming calls the existing `enterHints` Server Action; cancelling
  does nothing at all.
- Step 1 renders disabled and non-clickable once `phase === 'hints'`
  (`stepStates`).
- The pre-conversion grid is written to a new nullable Prisma column at
  the transition, and read by nothing. **Prisma — high blast radius.**

### H2 — The locked grid

What the grid looks like and does once clues are being written.

- New token for hints-phase lettered cells, distinct from build phase.
- `PreviewToggle` is replaced in `editor-actions` by the EDIT GRID
  button when `phase === 'hints'`.
- Letter deletion does nothing in hints phase.
- Clicking a cell does not move the cursor while clues are being
  written. (Grid → clue highlighting therefore only operates in EDIT
  GRID mode, per H3.)

### H3 — EDIT GRID mode

The scoped escape hatch.

- Mode toggle; button label flips between EDIT GRID and EDIT HINTS.
- New token for editable lettered cells during the mode.
- `HintsPanel` inputs disabled while the mode is active (the `disabled`
  prop already exists; it currently tracks `isPublished` only).
- Letter typing and cell clicking re-enabled; geometry still rejected.
- Selecting a word highlights its clue row. The `data-active` hook
  already exists and already tracks the cursor — this story styles it
  and confirms it behaves in EDIT GRID mode.

### H4 — Clue panel legibility

`HintsPanel` currently renders one flat list of rows labelled
`"1 Across"`, in `extractSlots` order, with no grouping and no answer
text.

- Across and Down become two side-by-side columns, each under its own
  subhead.
- Each row shows its answer inline: `1. REDWINE ____`, derived from the
  slot's cells against the grid.

---

## Suggested order

H1, then H2, then H3. H1 is the gate everything else sits behind; H2
establishes the locked appearance H3 contrasts against. H4 is
independent and can land any time.

## Definition of done (epic-level)

Per story: acceptance examples encoded as tests and passing,
`npm run verify` exits 0, and for any story touching the editor,
`npm run test:e2e` exits 0.
