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

**Story PB2 (advisory publish-readiness) is complete and committed** — the
epic's second slice, resuming after epic 05 absorbed PB1b as its own
Story D4. New pure `publishReadiness` (`src/lib/publish-readiness.ts`)
reports five finding kinds — `unfilled-cells`, `unwritten-hints`,
`short-answers`, `unchecked-squares`, `asymmetric` — reusing
`requiredHints`/`hintKey` (the same rule `hintsComplete` already encodes),
`extractSlots`, and `isSymmetric` rather than adding new engine logic; the
story's own Scope discipline barred any `src/engine/` change; all five
checks consume existing exports. It returns findings, never a boolean —
there is no `canPublish` — so nothing could mistake the result for
permission, matching the epic's governing principle that the builder
decides when a puzzle is done.

The new `ReadinessPanel` renders inside the stepper's publish step, in the
same `step-reason` element the plain one-line reason already used —
`Stepper.tsx`'s revealed content became a `div` holding both the existing
reason text and, for the publish step only, the panel. That required
threading a `puzzle: Puzzle` prop into `Stepper` and, in turn, into
`PhaseControls` (from `PuzzleGridEditor`, which already holds `grid`/
`hints`/`phase` in state) — neither file is named in the story's Repo
paths, but there was no way for `Stepper` to compute `publishReadiness`
without the puzzle reaching it. `stepper.ts` and its committed tests were
untouched, per the story's Decisions: the one-liner and the panel are two
levels of detail on the same question, and the duplication was judged
cheaper than editing a frozen test file for a cosmetic gain.
`e2e/stepper.spec.ts` and `e2e/typography.spec.ts` (which asserts
`step-reason`'s computed font-size/color) both still pass unmodified, as
the story required — the Tailwind classes stayed on the `step-reason`
element itself regardless of the tag change. `npm run verify` exits 0
(`tsc --noEmit`, lint, 234 Vitest tests — 17 new). `npm run test:e2e`:
all 5 new `publish-readiness.spec.ts` tests plus the full 173-test suite
pass, first attempt.

**Story PB3 (publish and unpublish) is complete and merged** — the
epic's third slice, and its first high-blast-radius story:
`prisma/schema.prisma` gains
`publishedAt DateTime?` and `visibility String @default("private")`
(migration `20260914155828_add_publish_fields`, the first since Story
P1's `init`), and `src/app/puzzles/actions.ts` gains `publishPuzzle(id,
visibility)` and `unpublishPuzzle(id)`. Publishing requires hints phase —
not a quality gate, but sequencing: grid-phase geometry isn't final yet,
so `stepStates` (`src/lib/stepper.ts`) keeps publish `unavailable` there
regardless of `hintsComplete`, and makes it `available` (or `current`,
once published) in hints phase regardless of `hintsComplete` — the
epic's governing principle that no quality check ever blocks publishing.
`stepStates` widened to take `isPublished`; `clues` reads `complete`
once published rather than `current`.

The new `PublishControls` renders beside PB2's `ReadinessPanel`, inside
the same publish-step `step-reason` element. That forced a real change
to `Stepper.tsx`'s reveal logic, not just an addition: previously, a step
only revealed on click when `unavailable` (its only reason to have
content worth revealing); now the publish step must reveal on click at
*any* status, since that is how its controls become reachable at all.
`handleClick` special-cases `step.id === 'publish'` ahead of the
status check, and the reveal condition drops its `step.reason &&` guard
for that step, since an available/current publish step has no reason
text but still has a panel and controls to show. `isPublished` and
`visibility` thread down from `PuzzleGridEditor` (new state, seeded from
`loadPuzzle`'s now-widened `PuzzleWithMeta`) through `PhaseControls` into
`Stepper` — like PB2's `puzzle` prop, neither intermediate file is named
in the story's Repo paths, but there was no other way for the controls
to reach the puzzle's actual publish state or a way to call back up to
persist a change.

`e2e/publish-readiness.spec.ts`'s "the panel changes nothing about what
the stepper permits" test — PB2-era, not this story's own frozen test —
asserted `publish` stays `unavailable` on a clean hints-phase puzzle.
That's exactly what this story makes false (its own Repo paths note
`stepper.ts` "edited: publish becomes reachable"), so the assertion was
updated to expect `available` instead, per the story doc's own
instruction to check rather than assume rather than treat "passes
unmodified" as covering an assertion the story deliberately overturns.
No other spec needed a change: `e2e/stepper.spec.ts` passes unmodified
(clicking `publish` in grid phase still reveals a reason, as before),
and `e2e/typography.spec.ts`'s font-size/color check on `step-reason`
survives because the Tailwind classes stayed on that element regardless
of what renders inside it. `npm run verify` exits 0 (`tsc --noEmit`,
lint, 238 Vitest tests — 4 net new: `stepStates`' committed test file was
rewritten wholesale for the wider contract, not merely extended).
`npm run test:e2e`: all 7 new `publish.spec.ts` tests, the corrected
`publish-readiness.spec.ts`, and the full 180-test suite pass, first
attempt. Both migrations (dev and, via `pretest:e2e`, test) applied
cleanly.

Independent review on the PR found `publishPuzzle` writing
unconditionally: neither the hints-phase/not-already-published
precondition nor `visibility` itself (an erased type at runtime) was
enforced at the write boundary, so a direct or concurrent Server Action
call could publish a grid-phase puzzle, silently change visibility on
republish, or store an arbitrary string in that column. Fixed by moving
the precondition into the same `updateMany`'s `WHERE` clause as the
write (`id, phase: 'hints', publishedAt: null`, checking `count`
afterward) rather than a separate check beforehand, and validating
`visibility` against its two legal values before it reaches the
database.

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

**Story PB4 (a published puzzle is read-only) is complete and merged** —
the epic's fourth slice, and its second high-blast-radius story
(`actions.ts` only this time; no schema change). `saveGrid`, `saveHints`, and `saveTitle` each
now refuse when `publishedAt` is set, using the same
condition-in-the-`WHERE`-clause `updateMany` pattern the PB3 review
established for `publishPuzzle` (a new shared `updateUnlessPublished`
helper), rather than a separate check before the write. That's defense
in depth for a path the UI shouldn't allow — PB4's own Decisions call
for the action to throw and the UI to prevent, matching `withLetter`'s
precedent that an impossible state fails loudly. `PuzzleGridEditor`'s
keydown handler drops `letter`/`delete` intents when `prev.publishedAt`
is set (checked fresh from the functional `setState` updater, not a
stale closure); the geometry-toggle path needed no new guard, since a
puzzle can only be published from hints phase (PB3) and geometry is
already frozen there (Story E) — publishing one still shows the
existing `geometry-locked-message`, not a new published-specific one,
per the story's own "one path to that outcome" Decision.

The new `PublishedLockMessage` and a disabled `ClearLettersButton`
(now conditionally rendered, not itself edited) join a disabled
`hint-input` (new `disabled` prop on `HintsPanel`, threaded to
`TextInput`) and a disabled `puzzle-title`. The last of these forced an
actual restructure beyond what the story's Repo paths named: PB4-2
requires the title to re-enable the instant a puzzle is unpublished,
with no reload, but `PuzzleTitle` and `PuzzleGridEditor` were separate
sibling components in `page.tsx`, each fed once from server-rendered
props — there was no shared reactive state between them for `PuzzleTitle`
to observe a client-side unpublish. `PuzzleTitle`'s render moved inside
`PuzzleGridEditor` (which already owns `isPublished` as state), with
`page.tsx` now passing `initialTitle` through instead of rendering
`PuzzleTitle` itself. `TextInput` gained the underlying `disabled` prop
every one of these threads down to. `npm run verify` exits 0 (`tsc
--noEmit`, lint, 238 Vitest tests — no new ones; this story has no
extractable pure logic, per its own Repo paths note). `npm run test:e2e`:
all 8 new `published-lock.spec.ts` tests, every other spec touching
letters, hints, titles, clear-letters, or publishing (`clear-letters`,
`controls`, `delete`, `hints-panel`, `new-puzzle`, `persistence`,
`publish-readiness`, `publish`, `rename`, `stepper`, `typography`), and
the full 187-test suite pass, first attempt — none needed a change.

Independent review found a second race, this time against
`publishPuzzle` itself: an edit to a letter, hint, or title made within
the 500ms debounce window right before clicking Publish would lose the
race — `publishedAt` got set first, then the delayed autosave hit
PB3's published guard and was silently dropped, leaving the UI showing
an edit the database had quietly reverted. Fixed by having
`PuzzleGridEditor` track each debounce timer in a ref and, before
calling `publishPuzzle`, cancel whatever's pending and re-issue all
three saves immediately with the current in-memory values, awaited.
Title state moved out of `PuzzleTitle` and into `PuzzleGridEditor`
(which already owned this pattern for grid/hints) so all three flush
from one place; `PuzzleTitle` is now a plain controlled component
(`value`/`onChange`/`disabled`, no `puzzleId`/`initialTitle` or debounce
of its own). Verified with a throwaway Playwright test (type, publish
immediately, reload) confirmed to fail against the pre-fix code and
pass after — not part of the committed suite, since the story's own
acceptance tests don't cover this interaction.

**Story PB5 (published status in the list) is complete, on branch
`story/04-PB5-publish-status`, pending PR review** — the epic's fifth
and final slice. New pure `puzzleStatus` (`src/lib/puzzle-status.ts`)
takes over the phase-aware status text Story M3 put inline in
`page.tsx`, now with a third input (`publishedAt`/`visibility`) and a
fourth branch: published outranks phase, so a published puzzle in hints
phase with incomplete hints still reads as published, not as "Hints —
incomplete" — publishing describes what happened at the end of
authoring, not where authoring currently stands. `summarizePuzzle` is
untouched, per the story's own Decisions: `publishedAt`/`visibility` are
columns on the row, not part of the stored grid/hints JSON it derives
phase and completeness from. `listPuzzles` (`actions.ts`) selects and
returns both alongside the existing fields. `puzzle-list-item` gains
`data-published`, `data-visibility`, and `data-published-at` (present
only when published, via a `data-*` prop of `undefined` rather than a
conditional spread) — `data-phase`, `data-hints-complete`, and
`data-updated-at` from Story M3 are unchanged. The publish date is
shown (not the time), formatted server-side with the existing
`formatDate` helper already used for the updated date, avoiding the
same hydration-mismatch risk that decision already existed to avoid.
`npm run verify` exits 0 (`tsc --noEmit`, lint, 246 Vitest tests — 8
new). `npm run test:e2e`: all 5 new `publish-status.spec.ts` tests and
`puzzle-list.spec.ts` (explicitly named in the DoD as asserting on the
row markup this story changes) pass unmodified.

This branch was originally cut from `main` before Story PB4 merged,
since PB5 only depends on PB3 (already merged) and not on PB4's
read-only lock; the 4 `published-lock.spec.ts` failures that resulted
on that base were reproduced identically on bare `main` with none of
this story's changes applied, confirming they were PB4's gap, not a PB5
regression. Per review, PB4 was merged first and this branch merged
with the result before merging PB5, so that gap no longer exists here
— a merge, not a rebase, since this branch had already been pushed and
a merge reaches the same end state without rewriting existing history.

### What exists

```
docs/epics/
  04-publishing-epic.md          the publishing epic, tracked
docs/stories/
  04-PB1a-empty-cells-black.md   Story PB1a's specification, tracked
  04-PB2-publish-readiness.md    Story PB2's specification, tracked
  04-PB3-publish.md              Story PB3's specification, tracked
  04-PB4-published-lock.md       Story PB4's specification, tracked
  04-PB5-publish-status.md       Story PB5's specification, tracked
docs/handoffs/
  04-HANDOFF-publishing.md       this file, tracked
docs/
  NYT-CROSSWORD-REFERENCE.md     descriptive reference on NYT construction/
                                   solving conventions, pointed at from
                                   AGENTS.md; not itself part of this epic's
                                   deliverables but drafted alongside it
prisma/
  schema.prisma   Story PB3 — Puzzle gains publishedAt (DateTime?) and
                    visibility (String, default "private")
  migrations/20260914155828_add_publish_fields/  Story PB3 — the second
                    migration, after Story P1's init
e2e/
  phase-controls.spec.ts   Story P4's acceptance test, rewritten by PB1a —
                            do not edit
  hints-transition.spec.ts Story PB1a's new acceptance test — do not edit
  publish-readiness.spec.ts Story PB2's acceptance test, one assertion
                              corrected by PB3 (publish step now
                              `available` in hints phase, not
                              `unavailable`) — otherwise do not edit
  publish.spec.ts          Story PB3's acceptance test — do not edit
  published-lock.spec.ts  Story PB4's acceptance test — do not edit
  publish-status.spec.ts   Story PB5's acceptance test — do not edit
src/engine/
  phase.ts        Story PB1a — enterHintsPhase converts empty active cells
                    to black before deriving required hints; new
                    non-exported convertEmptyCellsToBlack
  phase.test.ts    Story E's E1/E3/E4 structure kept; E2 rewritten and E4's
                    purity check updated by PB1a — do not edit
src/lib/
  publish-readiness.ts       Story PB2 — new; publishReadiness(puzzle) ->
                               readonly Finding[], five finding kinds
  publish-readiness.test.ts Story PB2's acceptance test — do not edit
  stepper.ts       Story PB3 — stepStates gains isPublished; publish is
                     available/current in hints phase instead of always
                     unavailable; clues reads complete once published
  stepper.test.ts  Story PB3 — rewritten wholesale for the wider
                     contract — do not edit
  puzzle-status.ts      Story PB5 — new; puzzleStatus(args) -> {kind,
                          label}, published outranks phase
  puzzle-status.test.ts Story PB5's acceptance test — do not edit
src/app/puzzles/
  actions.ts       Story PB1a — enterHints persists and returns grid
                    alongside phase and hints; Story PB3 — new
                    publishPuzzle(id, visibility) and unpublishPuzzle(id);
                    loadPuzzle's PuzzleWithMeta gains publishedAt and
                    visibility; Story PB4 — saveGrid/saveHints/saveTitle
                    refuse via new shared updateUnlessPublished; Story
                    PB5 — listPuzzles' rows gain publishedAt and
                    visibility
  [id]/page.tsx    Story PB3 — passes initialPublishedAt/initialVisibility
                    to PuzzleGridEditor; Story PB4 — passes initialTitle
                    instead of rendering PuzzleTitle itself
  page.tsx         Story PB5 — renders puzzleStatus's label instead of
                    the old inline statusText; puzzle-list-item gains
                    data-published/data-visibility/data-published-at
src/components/grid/
  PhaseControls.tsx     Story PB1a — gains a two-step confirmation
                         (enter-hints-confirmation/-confirm-button/
                         -cancel-button) and an emptyCellCount prop;
                         Story PB2 — forwards a new puzzle prop to Stepper;
                         Story PB3 — forwards isPublished/visibility and
                         onPublish/onUnpublish to Stepper
  PuzzleGridEditor.tsx  Story PB1a — handleEnterHints applies phase/hints/
                         grid together after the round trip instead of
                         flipping phase optimistically; new
                         countEmptyActiveCells helper feeds PhaseControls;
                         Story PB2 — passes {grid, hints, phase} as
                         PhaseControls' puzzle prop; Story PB3 — new
                         publishedAt/visibility state and
                         handlePublish/handleUnpublish, seeded from
                         initialPublishedAt/initialVisibility; Story PB4 —
                         now also renders PuzzleTitle (moved from
                         page.tsx) and PublishedLockMessage; keydown
                         handler drops letter/delete when published;
                         ClearLettersButton conditionally rendered;
                         HintsPanel gets a disabled prop; review fix —
                         title state also lives here now (own debounce
                         timer, like grid/hints), and each debounce
                         timer is tracked in a ref so handlePublish can
                         cancel and flush all three before publishing
  Stepper.tsx           Story PB2 — new puzzle prop; the revealed
                         step-reason for the publish step now renders
                         ReadinessPanel alongside the existing reason text;
                         Story PB3 — new isPublished/visibility/onPublish/
                         onUnpublish props; the publish step now reveals
                         on click at any status (not just unavailable),
                         and renders PublishControls when reachable
  PublishControls.tsx   Story PB3 — new; publish-button/private-checkbox
                         when unpublished, unpublish-button when
                         published, publish-state always
  PublishedLockMessage.tsx  Story PB4 — new; the one published-lock
                         explanation, rendered when publishedAt is set
  HintsPanel.tsx        Story PB4 — new disabled prop, threaded to each
                         hint-input's TextInput
src/components/puzzle/
  PuzzleTitle.tsx       Story PB4 — new disabled prop, threaded to
                         TextInput; now rendered from PuzzleGridEditor
                         rather than page.tsx; review fix — now a plain
                         controlled component (value/onChange/disabled),
                         title state and its debounced save moved to
                         PuzzleGridEditor
src/components/ui/
  TextInput.tsx         Story PB4 — new disabled prop on the underlying
                         input, with matching disabled styling
```

### The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, **246 Vitest
tests passing across 20 files**. `npm run test:e2e` exits 0: **192
Playwright tests passing across 26 spec files** — rerun in full after
merging `main` (Story PB4) into this branch, per review; the
`published-lock.spec.ts` gap that existed before that merge is gone.

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
