# Epic: Play

Everything up to now has served the builder. This epic serves the
solver: opening a published puzzle, typing answers into it, leaving and
coming back, and finishing it.

---

## The model, already decided

The grid-engine epic described this shape long before there was anywhere
to put it: a play session is `{ puzzle, entries }`, where `entries` is a
`Grid` with the same geometry and the player's letters, and correctness
is a comparison between the two grids — never a stored flag. The cursor
functions take `(grid, cursor, …)` rather than a `Puzzle` precisely so
that a builder typing answers and a player typing guesses share them
unchanged.

This epic is largely the work of honouring that design.

## Decisions

**One `PlaySession` row per (user, puzzle)**, unique on the pair,
holding a serialized entries grid, `startedAt`, and a nullable
`completedAt`. A row existing means they've started; the entries grid is
how far they got; `completedAt` records when they finished and *when* —
which the library will want the moment it shows a completion date.

`completedAt` is a record, not the source of truth. Whether a puzzle is
solved is always decided by comparing entries to answers.

**A builder plays their own puzzle exactly as anyone else does.** No
preview mode, no special-cased session, no second code path. They know
the answers, which makes their completion meaningless — and that is
what reset is for.

**Opening the play screen starts the session.** On browser mount, create
or load the one row for the signed-in user and puzzle, even before any
letter is entered. Server GETs and background prefetches create nothing.
Repeated/concurrent opens preserve the existing row and progress. P1
includes static numbered Across and Down clues beside the player grid.

**Published puzzles are playable by URL at `/puzzles/{id}/play`.** Any
signed-in user may open public or private published puzzles, including
their own. PB3's private means unlisted, not owner-only. Drafts and missing
IDs show not-found; the separate editor remains owner-only. P1 does not
change the existing library.

**Deleting a puzzle cascades to its play sessions.** Preserve the builder's
existing ability to delete published puzzles; having players does not
introduce a deletion block. The session's user relation also cascades.
These P1 product choices were confirmed by the user on 2026-10-18; the
[P1 story](stories/11-P1-play-route.md) defines the detailed contract.

**Reset deletes the session row**, so "never played" and "reset" are
indistinguishable. Available to every player behind an unobtrusive
control, and additionally as a quiet visible button when the player is
the puzzle's builder, since test-playing is the case that needs it most.
Both routes confirm first, through `Modal`.

**No check, no reveal, no autocheck, no pencil mode, no timer.** All
explicitly deferred by `docs/NYT-CROSSWORD-REFERENCE.md`. A
partially-filled grid shows only what the player typed, with no
indication of what's wrong.

**Completion is silent until the grid is full**, and then it speaks.
When the last empty cell is filled and the grid is *wrong*, a modal says
so without saying where — the NYT's "you're so close" moment. It fires
only on the transition from "has empty cells" to "full and incorrect",
so hunting for the mistake doesn't re-trigger it on every keystroke.
When the grid is full and *correct*: confetti, a congratulations modal,
`completedAt` stamped, and the puzzle locks.

This is the one piece of feedback the epic allows, and it exists because
without it a player with one wrong letter has no way to know they aren't
finished — a dead end that no deferred checking tool would rescue them
from.

**A completed puzzle reopens locked**, showing the finished grid, a
success mark, and no celebration. Input does nothing and a visible
message says why, mirroring `PublishedLockMessage` — the pattern PB4
established for exactly this situation.

**The library keeps size as its only grouping.** Play state rides on the
row as a cue, and completed puzzles sort to the bottom of their size
group. No archive section: nesting play states inside size sections
would give up to twenty headings for a distinction a badge already
makes, and L3 already rejected the same doubling for
published-versus-in-progress.

## Non-goals

- **No checking tools.** Check, reveal and autocheck stay deferred.
- **No rebus input.** The reference doc records that the data model,
  persistence and rendering already handle multi-character entries and
  that only the *input* path is missing. Real, scoped, and not this
  epic.
- **No timer, streaks, or stats.**
- **No leaderboards or social features.**
- **No mobile layout.** Desktop-first, like the rest of the app.
- **No public play.** A player must be signed in, per epic 09.
- **No unpublishing protection for puzzles with sessions.** What happens
  to in-progress play when a builder unpublishes is a real question and
  is deliberately left for a later story rather than guessed at here.

---

## Stories

### P1 — A play route

Implemented, verified and independently reviewed/merged in
[PR #20](https://github.com/akiryk/crossward-raptor/pull/20). See the handoff
for gate evidence and the separate development/production migration boundary.

`PlaySession` and `/puzzles/{id}/play`, rendering a published puzzle with
the player's entries grid and static numbered clues, read-only to begin
with. Reuses `PuzzleGrid` with fixed geometry/numbering independent of
entries; the existing cursor functions are wired in P2.

Any signed-in user may reach any published puzzle, including their own
and private puzzles opened by URL. Browser mount creates or loads the
session; server GET/prefetch does not. See the
[P1 specification](stories/11-P1-play-route.md).

*Prisma — high blast radius.*

### P2 — Typing and resuming

Authorized on 2026-10-18. The [detailed P2 story](stories/11-P2-typing-and-resuming.md)
and 40 unit/27 browser acceptance cases passed independent specification
review and are frozen by the specification-only main baseline.
The user confirmed same-browser local recovery of pending edits without a
close warning, and an unselected puzzle on opening/reopening. Implementation is locally verified (467 unit cases and all 370 browser cases
with a two-worker resource cap); independent PR review/merge is pending. The
user-authorized locator-only correction is separately refrozen on main in
`4e53740`. P3 is not authorized.

Letters go into the entries grid; the cursor behaves as it does in the
editor, since it is the same code. Saved debounced, as everything else
in this app is. Leaving and returning restores exactly what was typed.

Deletion is allowed here, unlike in the locked builder grid — a player
changing their mind is the normal case, and nothing is made
inconsistent by an empty cell.

### P3 — Finishing

Completion detected by comparing entries to answers. The "so close"
modal on the full-but-wrong transition. Confetti and congratulations on
correct. `completedAt` stamped, the puzzle locked, and reopening it
later showing the lock and the success mark without the celebration.

The largest story in the epic and the one most worth splitting if it
grows — detection and locking are separable from the celebration.

### P4 — Reset

Unobtrusive for every player, plus a quiet visible button for the
builder. Confirmed through `Modal`, which M1 and M2 already made
suitable. Deletes the session row and returns the puzzle to untouched.

### P5 — The library learns about play

Published puzzles offer Play. A row shows untouched, in progress, or
completed; completed sorts last within its size group.

*Touches `listPuzzles` — high blast radius.* The library page has been
restyled three times and four specs assert its shape, so this needs the
same grep-first discipline the last epic established.

---

## Suggested order

P1 through P5 in order. P5 is last deliberately: it is the story most
likely to want revisiting once a few puzzles have actually been played,
and designing it further before then would be guessing.

## Definition of done (epic-level)

Per story: acceptance examples encoded as tests and passing,
`npm run verify` exits 0, and `npm run test:e2e` exits 0.

A signed-in user can open a published puzzle, type answers, leave,
return to exactly where they were, be told when they're close, be
congratulated when they finish, find it locked and marked complete
afterward, and reset it if they want to play again.
