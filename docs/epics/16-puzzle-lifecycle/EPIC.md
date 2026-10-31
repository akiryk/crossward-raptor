# Epic: Puzzle lifecycle

**Approved by the human 2026-10-27.** Rewritten the same day from an
outside proposal (`CROSSWARD-PUZZLE-LIFECYCLE-EPIC.md`, written without
access to this repo) against the code and the approved Decisions of epics
11 and 14. Every pending question was answered before approval *(human)*
and is recorded in Decisions; items still marked *proposed* are settled in
their stories. Stories are drafted and approved one at a time. Queued
after epic 15 *(human)*.

Today a builder can publish a puzzle but can't do much with it afterwards.
They can't change who sees it, remove it from the library, or fix a
mistake without building it again from scratch. This epic gives the
puzzle's builder those controls and leaves published content unchanged.
It is not a revision-history or editorial-workflow system.

---

## What the code does today (2026-10-27)

Read from the code and the earlier epics. The outside proposal assumed
otherwise in several places.

- **"Private" is stored but has no effect.** `visibility` is `'private'`
  (the default) or `'public'`, chosen in the Publish dialog (14-S4).
  `listPuzzles` returns every published puzzle to every signed-in user,
  and the library's Play view shows them all (14-S2: "Play lists every
  published puzzle"). Anyone signed in can open either kind at
  `/puzzles/{id}/play` (epic 11: "PB3's private means unlisted, not
  owner-only"). The unlisted half, keeping private puzzles out of other
  users' Play view, was never built.
- **Everything except `/` requires sign-in** (`src/middleware.ts`, and
  `requireSession` in every action). No puzzle is reachable without an
  account.
- **Publishing is final** *(human, 2026-10-26, epic 14)*. Every edit
  action is conditioned on `publishedAt: null`. There is no Unpublish.
- **Deleting a published puzzle is allowed on the server but not offered
  in the UI.** `deletePuzzle` deletes any puzzle the caller built.
  `PlaySession` cascades, as epic 11 decided ("having players does not
  introduce a deletion block"). The library shows Delete only on
  unpublished rows (`PuzzleRow.tsx`); 14-S2 kept published deletion out
  of its scope, and 14-S4 removed the builder's own Delete.
- **A missing or deleted puzzle** shows `[id]/not-found.tsx`'s "Puzzle not
  found", in both the editor and play. A save or completion check against
  a puzzle deleted mid-solve throws "This puzzle is not available to
  play."; the player shows "We couldn't save your entries."
- **There is no way back from the hints phase to grid building.** In the
  hints phase the shape is locked and button 1 is done and disabled
  (14-S12). `applyGeometryEdit` has no app caller. `gridBeforeHints` keeps
  the grid from before hints were entered, but nothing reads it back.
- **A builder test-plays like anyone else** *(epic 11)*: "No preview mode,
  no special-cased session, no second code path". Reset exists for this.
  The builder's Preview toggle is a grid-construction diagnostic, not a
  solver preview.
- **The library** (14-S2) has a Build view (your puzzles, any phase,
  markers `[grid]`/`[hint]`/`[published]`, visibility only in
  `data-visibility`) and a Play view (published puzzles, play state). Rows
  are a fixed 66px tall in a 700px container, with one trailing control
  each.

## Scope

1. **Private becomes Unlisted.** Other users' unlisted puzzles leave the
   Play view, which today shows them; the link still works for anyone
   signed in.
2. **A row menu and changing visibility.** Each Build row gets a
   three-dot button opening a menu of the puzzle's actions. From it the
   builder switches a published puzzle between Unlisted and Public. Its
   ID, URL, content and play sessions are unchanged.
3. **Delete published puzzles from the library,** with a confirmation that
   says other players lose their progress, and a clear page for a link to
   a deleted puzzle.
4. **Duplicate a puzzle** into a new, unpublished copy the builder can
   edit, for fixing a published puzzle or reworking any puzzle.

## Decisions

**Epics 13 and 14's Decisions carry over** *(human)*: components use color
styles; exact values come from the human per story; a story that replaces
frozen behavior names each superseded test and its replacement, retired in
its specification-only freeze commit; tests assert structural properties.

**Published content stays immutable** *(human, epic 14)*. No edits to a
published puzzle's grid, letters, hints or title. A fix is a duplicate with
its own ID and URL; existing play sessions stay with the original.

**No Unpublish** *(human, epic 14)*. Making a puzzle Unlisted takes it out
of discovery and keeps links and progress. Deleting it removes it.

**Deletion is hard and cascades** *(epic 11)*. No soft delete, tombstone,
recycle bin or recovery. Deleting a published puzzle deletes every
player's session for it. This epic only adds the library control and the
wording.

**"Private" is renamed "Unlisted"** *(human, 2026-10-27)*. The Publish
dialog's choice and the status labels read Unlisted and Public. The stored
value stays `'private'`, so no migration is needed *(proposed)*.

**Unlisted hides a puzzle from other people's Play view** *(human,
2026-10-27)*. Today a Private puzzle shows in everyone's Play view, as if
it were Public. That's the defect S1 fixes. The builder still sees their
own unlisted puzzles in both views.

**An unlisted puzzle's link works for anyone signed in** *(human,
2026-10-27)*. Sending the link is how a builder shares a puzzle with
testers; only the builder sees it listed. This matches epic 11's "PB3's
private means unlisted, not owner-only".

**What a player sees when the builder changes a puzzle mid-solve**
*(human asked, 2026-10-27)*. If the builder makes it Unlisted, the player
keeps their progress, their open page keeps working, the link still
opens it and it stays in their Play view (next Decision). If
the builder deletes it, the player's progress is deleted with it (epic
11). Their next save says the puzzle is no longer available. A reload or
the link shows the "no longer available" page, and the puzzle leaves
their Play view (S3).

**A started unlisted puzzle stays in its player's Play view** *(human,
2026-10-27)*. The Play view lists other builders' unlisted puzzles only to
players who have a play session for them. A player who started or
finished one keeps finding it, and a tester who opened the link finds it
listed afterwards. Nobody else sees it listed.

**Sign-in stays required** *(human, confirmed 2026-10-31)*. Unlisted
means hidden from the Play view, not readable without an account. The
outside proposal's anonymous link access is a Non-goal.

**No draft test-solve** *(human, confirmed 2026-10-31)*. Epic 11's
"plays their own puzzle exactly as anyone else does" stands. To test
before sharing, the builder publishes Unlisted and plays; epic 17 removes
Reset from play *(human, 2026-10-27)*. The outside proposal's L2 is dropped.

**Duplicate comes back** *(human, 2026-10-27)*. This epic supersedes
epic 05's Story Group D7, which removed epic 03's Duplicate.

**A duplicate is a new puzzle, not a revision** *(proposed)*. It gets a
new ID, the caller as builder and `publishedAt: null`. It copies the
source's grid, letters, hints, phase and `gridBeforeHints`.

**A duplicate keeps its source's phase** *(human, 2026-10-27, for
published puzzles; proposed for the rest)*. A published puzzle is always
in the hints phase, so its copy opens there with the shape locked and
letters and hints editable. Going back to grid building would defeat the
point of copying it *(human)*. Any puzzle can be duplicated, including one
still in grid building: the rule stays "Duplicate copies the puzzle as it
is", and the menu needn't hide Duplicate on some rows. It copies no
play sessions, published date or visibility (the default applies). Only
the source's builder can duplicate it. The source is never changed. The
copy's title is distinguishable (e.g. "<title> (copy)"; story detail). The
copy is created on the server from the stored source, never from client
state.

**Keep Build / Play** *(human, epic 14)*. Owner actions live in the Build
view's rows. Other users never see them. No third view and no separate
management page.

**A three-dot row menu** *(human, 2026-10-27)*. Each Build row gets a
button with three dots that opens a contextual menu of the puzzle's
actions. The human approved the following *(2026-10-27)*: the menu replaces the row's trailing Delete button,
and its items are Duplicate, then "Make public" or "Make unlisted" on a
published puzzle, then Delete, which opens the existing delete dialog. It's
keyboard-operable, and it's a new component with its own style-guide
sample. The Play view's rows are unchanged.

**No grid-engine change.** Duplication and visibility are server actions
over stored puzzles; `src/engine/**` is untouched.

**Risk paths.** S1, S2 and S4 change `src/app/puzzles/actions.ts`, so each
goes through a story branch, a PR and independent review per
[CODE-REVIEW](../../CODE-REVIEW.md#when-review-applies). S3 does too if its
stale-link or delete handling touches the actions.

## Non-goals

- Editing a published puzzle in place, including typo fixes.
- Unpublish, archive or any link-blocking state short of Delete.
- Reading or playing a puzzle without signing in.
- A draft test-solve or solver preview distinct from ordinary play.
- Carrying progress, completion or anything else from a source to its
  duplicate, or linking the two (no version graph, no "replaced by").
- Version history, revert, soft delete or recovery.
- Shared editing, roles, moderation or admin overrides of ownership.
- A route from the hints phase back to grid building, for a duplicate or
  any other puzzle.
- Grid-engine changes.

---

## Stories

Order as listed. Story files are `stories/16-S<n>-<slug>.md`. Each lists
the frozen tests it supersedes.

### S1 — Unlisted

`listPuzzles` stops returning other builders' unlisted (stored
`'private'`) published puzzles, except those the caller has a play session
for. The Play view then shows your own puzzles in either visibility, other
builders' public ones and the unlisted ones you've played. Play by URL follows
the link-access Decision. Existing private puzzles in the database become
unlisted when this ships. "Private" reads "Unlisted" in the Publish dialog
and the status labels. Supersedes 14-S2's "Play lists every published
puzzle" tests and 14-S4's "Private" label expectations. Settles whether
the Build view marks visibility.

### S2 — Row menu and visibility

The three-dot menu on every Build row, replacing the trailing Delete
button (Delete moves into the menu, still unpublished rows only until
S3). On a published puzzle the menu offers "Make public" or "Make
unlisted". The owner-only write is guarded on `builderId`,
`publishedAt: not null` and a valid value. Nothing else changes: not the
ID, URL, content, `publishedAt` or play sessions. Adds the menu's
style-guide sample. Supersedes 14-S2's row Delete button tests.

### S3 — Delete published puzzles

The menu's Delete is offered on published rows too, with a confirmation
that, for a published puzzle, says other players' progress is deleted.
Declining deletes nothing. A link to a deleted puzzle shows a "no longer
available" message with a way back to `/puzzles`, in play and the editor.
A player mid-solve whose save fails because the puzzle was deleted is told
so, not shown a generic save error. Supersedes 16-S2-3 and 16-S2-7,
which pinned a published row's menu to its visibility item alone; no
14-S2 case still pinned published rows having no Delete.

### S4 — Duplicate a puzzle

The menu's Duplicate, on every Build row, creates the copy described
in Decisions and opens it in the editor. Tests cover a new ID and owner,
unpublished, identical grid, letters and hints, the source unchanged, no
sessions copied, and another user's puzzle refused.

---

## Pending questions

None. The draft's questions and their follow-ups were answered 2026-10-27
*(human)* and are recorded in Decisions.

---

## At closeout (2026-10-31)

- **Accepted, no code change** *(human)*: while one row's menu action is
  pending, a second row's menu may possibly be opened, so two menus could
  be open at once.
- Nothing else is left open.
