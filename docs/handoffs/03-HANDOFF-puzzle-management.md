# Puzzle Management — Handoff

Current state of the crossword-builder project's third epic, for an agent or
collaborator picking it up fresh. Read alongside
`docs/epics/03-puzzle-management-epic.md` and `AGENTS.md`, which remain
authoritative for scope and behavior. This document covers what has actually
happened and the decisions that live only in conversation. See
`01-HANDOFF-crossward.md` and `02-HANDOFF-builder-ui.md` for the first two
epics' handoffs.

Repo: `crossward-raptor`. Branch `main`, tracking `origin/main`.

---

## Where things stand

**The puzzle-management epic (Story Groups M1, M2, M3, M5, M4) is complete
and committed — shipped in exactly the epic's own suggested build order.**
It adds collection-level operations on top of the builder-UI epic's
single-puzzle editor: naming, removing, listing with status, and starting a
new puzzle from an existing one.

**Story M1 (rename) is complete and committed.** A puzzle's title is now an
always-editable `<input data-testid="puzzle-title">` — `PuzzleTitle`, a
standalone client component rendered *beside* `PuzzleGridEditor` on the
detail page rather than inside it, since the title has nothing to do with
grid/cursor state. This is the pattern both `DeletePuzzleButton` (M2) and
`DuplicatePuzzleButton` (M4) followed afterward. `normalizeTitle`
(`src/lib/puzzle-title.ts`) trims and falls back to `"Untitled Puzzle"` at
save time, not on every keystroke; persistence is the same silent
500ms-debounced pattern as `saveGrid`/`saveHints`, via the new `saveTitle`
action. `PuzzleGridEditor`'s window-level keydown listener had no guard
against typing in a text input — a real, if latent, bug (it would also have
affected the hints panel's inputs) — fixed here by ignoring events whose
target is an `INPUT` or `TEXTAREA`. `e2e/persistence.spec.ts`'s two
`puzzle-title` assertions were updated from `toContainText` to `toHaveValue`
as an explicitly authorized consequence of the title becoming an input, not
a spec weakening. One acceptance-test defect surfaced here — see "Testing
notes" below.

**Story M2 (delete) is complete and committed.** `DeletePuzzleButton`
introduces the two-step inline confirmation pattern this epic uses for every
irreversible action ("cannot be undone" in those words, a confirm and a
cancel button) — `ClearLettersButton` (M5) reuses it verbatim. Delete lives
on the detail page, not on list rows, since every list row is already a
`<Link>` and a delete control inside one would mean nested interactive
elements. `deletePuzzle` is a hard delete (no soft-delete column) and calls
`revalidatePath('/puzzles')` — the first use of that function anywhere in
this codebase, established here as the pattern Stories M3 and M4 both
extended to their own mutations.

**Story M3 (list metadata) is complete and committed.** Each list row now
carries last-updated date, phase, and — in hints phase — hint-completeness
status, via the new pure `summarizePuzzle` (`src/lib/puzzle-summary.ts`),
which reuses the engine's existing `hintsComplete` rather than adding new
engine logic. `listPuzzles` widened its `select` from three scalar columns
to include `grid`/`hints`/`phase` so it can compute this per row — fine at
this scale, per the epic's settled decision; a materialized flag updated on
write is the answer if that ever changes. Sorting was already in place from
Story P1 (`orderBy: updatedAt desc`); this story only surfaces the date it's
based on. Checking `createPuzzle` against the `revalidatePath` pattern M2
established found a real gap — it had none, and only looked correct in
dev/test by accident of `page.goto()` forcing a full reload — so
`revalidatePath('/puzzles')` was added there too.

**Story M5 (clear all letters) is complete and committed.** `clearLetters`
(`src/engine/grid.ts`) is the first change to `src/engine/` since Story G —
every UI story before this one correctly said "no engine changes" because
none of them actually needed one; this one does, since bulk-clearing is a
pure grid-to-grid transform in the same family as `withLetter` and
`toggleBlackSymmetric`, not a `src/lib` concern. `ClearLettersButton` reuses
M2's confirmation pattern. No new Server Action: clearing produces a new
`Grid` in `PuzzleGridEditor`'s existing state, which the existing debounced
`saveGrid` already persists. Sequenced ahead of M4 deliberately — see M4
below.

**Story M4 (duplicate) is complete and committed — the epic's sixth and
final planned story.** `duplicatePuzzle` copies a puzzle's `grid` (letters
included), `hints`, and `phase` by reading the source row and writing its
three JSON/phase columns straight into a new record — no
serialize/deserialize round-trip, no engine involvement, per the epic's
settled "copy everything" decision. `duplicateTitle` prefixes `"Copy of "`
(reusing `normalizeTitle`, so a blank source title yields `"Copy of
Untitled Puzzle"`) and deliberately does not deduplicate a copy of a copy.
`DuplicatePuzzleButton` has no confirmation step, unlike delete and
clear-letters — duplicating destroys nothing, so a confirmation here would
just be ceremony that dilutes the two that matter. This story's default
depended on M5 shipping first: the original "just clear the letters"
mitigation for a builder wanting a template assumed a bulk-clear action
that didn't exist until M5. One acceptance-test defect surfaced here — see
"Testing notes" below.

### Testing notes

Two acceptance tests in this epic were found, during implementation, to
pass regardless of whether the behavior they claimed to test actually
existed — `rename.spec.ts`'s use of `.fill()` (which dispatches no
`keydown` events, so it couldn't exercise the keydown guard it was meant to
verify) and `duplicate.spec.ts`'s `waitForURL` regex (which matched the URL
the page was already on, so it resolved without waiting for any
navigation). Both were corrected in the committed spec files, not worked
around in the implementation. `docs/LEARNINGS.md`'s entry 6 covers the
general lesson — a wait or assertion that can't distinguish before-state
from after-state isn't one — and isn't repeated here.

### What exists

```
docs/epics/
  03-puzzle-management-epic.md     the puzzle-management epic, tracked
docs/stories/
  03-M1-rename.md                  Story M1's specification, tracked
  03-M2-delete.md                  Story M2's specification, tracked
  03-M3-list-metadata.md           Story M3's specification, tracked
  03-M4-duplicate.md               Story M4's specification, tracked
  03-M5-clear-letters.md           Story M5's specification, tracked
docs/handoffs/
  03-HANDOFF-puzzle-management.md  this file, tracked
e2e/
  rename.spec.ts          Story M1's acceptance test — do not edit
  delete.spec.ts          Story M2's acceptance test — do not edit
  puzzle-list.spec.ts     Story M3's acceptance test — do not edit
  clear-letters.spec.ts   Story M5's acceptance test — do not edit
  duplicate.spec.ts       Story M4's acceptance test — do not edit
                          (corrected once; see LEARNINGS.md #6)
  persistence.spec.ts     Story P1's test; Story M1 amended two
                          assertions (toContainText -> toHaveValue),
                          an explicitly authorized consequence of the
                          title becoming an <input>
src/engine/
  grid.ts                 Story M5 — adds clearLetters (first engine
                           change since Story G)
  grid.test.ts             Story G's G1 cases, extended by Story M5 with
                           M5 cases — do not edit
src/lib/
  puzzle-title.ts          Story M1 — new; normalizeTitle. Story M4 —
                           adds duplicateTitle
  puzzle-title.test.ts     Story M1's acceptance test, extended by
                           Story M4 — do not edit
  puzzle-summary.ts        Story M3 — new; summarizePuzzle, built on the
                           engine's existing hintsComplete
  puzzle-summary.test.ts   Story M3's acceptance test — do not edit
src/components/puzzle/
  PuzzleTitle.tsx            Story M1 — new; standalone client component
                             beside PuzzleGridEditor
  DeletePuzzleButton.tsx     Story M2 — new; two-step inline confirmation
  DuplicatePuzzleButton.tsx  Story M4 — new; single action, no
                             confirmation
src/components/grid/
  ClearLettersButton.tsx     Story M5 — new; reuses M2's confirmation
                             pattern
  PuzzleGridEditor.tsx       Story M1 — window keydown listener ignores
                             INPUT/TEXTAREA targets; Story M5 — renders
                             ClearLettersButton, applies clearLetters to
                             grid state
src/app/puzzles/
  actions.ts       Story M1 — adds saveTitle; Story M2 — adds
                    deletePuzzle (+ revalidatePath('/puzzles')); Story M3
                    — widens listPuzzles to return phase/hintsComplete,
                    adds revalidatePath to createPuzzle; Story M4 — adds
                    duplicatePuzzle
  page.tsx         Story M3 — renders date/phase/hint-completeness per
                    list row
  [id]/page.tsx    Story M1 — renders <PuzzleTitle /> instead of a plain
                    <h1>; Story M2 — renders <DeletePuzzleButton />;
                    Story M4 — renders <DuplicatePuzzleButton />
docs/LEARNINGS.md   Entry 6 added — a wait/assertion that can't
                     distinguish before- from after-state, citing both
                     this epic's test defects
```

### The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, **163 Vitest
tests passing across 14 files**. `npm run test:e2e` exits 0: **65
Playwright tests passing across 12 spec files**.

---

## Current status

The puzzle-management epic is complete — nothing in
`docs/epics/03-puzzle-management-epic.md` is pending. Deferred by that
epic's own Non-goals, still unbuilt: recoverable delete (trash/undo/
restore), folders/tags, search/filtering, puzzle import/export,
publishing/sharing, and puzzle-size options at creation. The play/solve
epic — reusing the grid engine's `(grid, cursor, ...)` cursor functions per
the grid-engine epic's own design (`01-HANDOFF-crossward.md`, decision 7) —
hasn't started and has no epic doc yet.
