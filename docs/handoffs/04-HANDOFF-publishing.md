# Publishing — Handoff

Current state of the crossword-builder project's fourth epic, for an agent or
collaborator picking it up fresh. Read alongside
`docs/epics/04-publishing-epic.md` and `AGENTS.md`, which remain authoritative
for scope and behavior. This document covers what has actually happened and
the decisions that live only in conversation. See `01-HANDOFF-crossward.md`,
`02-HANDOFF-builder-ui.md`, and `03-HANDOFF-puzzle-management.md` for the
first three epics' handoffs.

Repo: `crossward-raptor`. Branch `main`, tracking `origin/main`.

---

## Where things stand

**Story PB1a (empty cells become black on entering hints phase) is complete
and committed.** It's the first slice of Epic 04's PB1 — split out because
the epic's original PB1 bundled the conversion together with a grid-phase
preview toggle (PB1b, not yet built) that touches no committed files and can
land separately.

`enterHintsPhase` (`src/engine/phase.ts`) now converts every active cell
holding no letter into a black cell before deriving anything from the
grid's geometry — via a new, non-exported `convertEmptyCellsToBlack`, built
from the same `createGrid`/`withLetter` primitives Story A and Story G
already established, not a new engine primitive. Required hints are derived
from the *converted* grid, so a builder's typed-in letters determine the
puzzle's final shape rather than its original fully-active canvas. A puzzle
already in `'hints'` phase returns unchanged (no re-conversion) rather than
relying on the UI never offering the transition twice.

This is the first change to `enterHintsPhase`'s behavior since Story E, and
it broke an assumption Story P4 built on: `enterHints` (`src/app/puzzles/
actions.ts`) previously persisted and returned only `hints` and `phase`,
since geometry was assumed untouched. It now also persists and returns
`grid` — without that, the conversion is computed server-side and silently
discarded. `PuzzleGridEditor.tsx`'s `handleEnterHints` correspondingly
stopped optimistically flipping `phase` before the round trip: previously
safe (geometry never changed, so nothing could be inconsistent), it would
now let the phase badge read `hints` for a moment before the blackened grid
actually re-rendered. `phase`, `hints`, and `grid` now all apply together in
one `setState` once the response lands.

`PhaseControls` gained a two-step inline confirmation on
`enter-hints-button`, matching the pattern `DeletePuzzleButton` (M2) and
`ClearLettersButton` (M5) established — "cannot be undone," a confirm and a
cancel — since this transition is irreversible and there's no reverse
hints→grid transition. The confirmation states the concrete count of cells
about to blacken (`emptyCellCount`, computed by a new local
`countEmptyActiveCells` in `PuzzleGridEditor`), not a generic warning, since
the count is exactly the information a builder needs to decide.

### Testing notes

This story's committed acceptance tests included the largest authorized
rewrite of a frozen test file so far. `src/engine/phase.test.ts`'s E2 block:
the "geometry is untouched" test (`expect(next.grid).toBe(grid)`) was
deleted outright — its entire point was that no rebuild happens, which this
story reverses by design — and replaced with direct conversion assertions.
Two other E2 tests were refixtured off a grid with letters rather than a
fully-empty one, since a fully-empty fixture converts entirely to black and
yields no slots to assert against. The E4 purity check was rewritten to
compare grid cells explicitly (`gridsEqual`) rather than via whole-object
`toEqual`, since the grid is now rebuilt per call and two structurally
identical grids no longer share one `at` closure by reference.
`e2e/phase-controls.spec.ts` similarly had five tests switch to clicking
through the new confirmation and seeding a lettered grid, since a couple of
those tests (letter editing in hints phase, specifically) would otherwise
have no active cell left to type into. Both rewrites were verified against
the actual committed baseline before implementation began, per the story
doc's own instruction to check rather than assume; no discrepancies were
found between the story's description of the test changes and the actual
diff.

### What exists

```
docs/epics/
  04-publishing-epic.md          the publishing epic, tracked
docs/stories/
  04-PB1a-empty-cells-black.md   Story PB1a's specification, tracked
docs/handoffs/
  04-HANDOFF-publishing.md       this file, tracked
docs/
  NYT-CROSSWORD-REFERENCE.md     descriptive reference on NYT construction/
                                   solving conventions, pointed at from
                                   AGENTS.md; not itself part of this epic's
                                   deliverables but drafted alongside it
e2e/
  phase-controls.spec.ts   Story P4's acceptance test, rewritten by PB1a —
                            do not edit
  hints-transition.spec.ts Story PB1a's new acceptance test — do not edit
src/engine/
  phase.ts        Story PB1a — enterHintsPhase converts empty active cells
                    to black before deriving required hints; new
                    non-exported convertEmptyCellsToBlack
  phase.test.ts    Story E's E1/E3/E4 structure kept; E2 rewritten and E4's
                    purity check updated by PB1a — do not edit
src/app/puzzles/
  actions.ts       Story PB1a — enterHints persists and returns grid
                    alongside phase and hints
src/components/grid/
  PhaseControls.tsx     Story PB1a — gains a two-step confirmation
                         (enter-hints-confirmation/-confirm-button/
                         -cancel-button) and an emptyCellCount prop
  PuzzleGridEditor.tsx  Story PB1a — handleEnterHints applies phase/hints/
                         grid together after the round trip instead of
                         flipping phase optimistically; new
                         countEmptyActiveCells helper feeds PhaseControls
```

### The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, **166 Vitest
tests passing across 14 files**. `npm run test:e2e` exits 0: **71 Playwright
tests passing across 13 spec files**.

---

## Current status

Story PB1a is complete. Still open in Epic 04, per
`docs/epics/04-publishing-epic.md`: PB1b (the grid-phase preview toggle,
deliberately split out of PB1 and touching no committed files), PB2
(advisory publish-readiness checks), PB3 (publish/unpublish), PB4 (locking
edits to a published puzzle), and PB5 (published status in the builder's
list). The epic's own suggested build order sequences these as
PB1 (a/b), PB2, PB3, PB4, PB5 — a real dependency chain, unlike Epic 03's
mostly-independent stories.
