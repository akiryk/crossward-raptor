# Epic: Puzzle lifecycle

**Draft, not approved (2026-10-27).** Rewritten from an outside proposal
(`CROSSWARD-PUZZLE-LIFECYCLE-EPIC.md`, written without access to this repo)
against the code and the approved Decisions of epics 11 and 14. Nothing
here is approved until the human approves the EPIC; each story is then
drafted and approved on its own. Queued after epic 15.

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

1. **Private means unlisted.** Other users' private puzzles leave the Play
   view; the link still works for anyone signed in.
2. **Change visibility after publishing.** The builder switches a
   published puzzle between Private and Public. Its ID, URL, content and
   play sessions are unchanged.
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

**No Unpublish** *(human, epic 14)*. Making a puzzle Private takes it out
of discovery and keeps links and progress. Deleting it removes it.

**Deletion is hard and cascades** *(epic 11)*. No soft delete, tombstone,
recycle bin or recovery. Deleting a published puzzle deletes every
player's session for it. This epic only adds the library control and the
wording.

**Sign-in stays required** *(proposed)*. Unlisted means hidden from the
Play view, not readable without an account. The outside proposal's
anonymous link access is a Non-goal.

**No draft test-solve** *(proposed)*. Epic 11's "plays their own puzzle
exactly as anyone else does" stands. To test before sharing, the builder
publishes Private, plays and resets. The outside proposal's L2 is dropped.

**A duplicate is a new puzzle, not a revision** *(proposed)*. It gets a
new ID, the caller as builder and `publishedAt: null`. It copies the
source's grid, letters, hints, phase and `gridBeforeHints`. It copies no
play sessions, published date or visibility (the default applies). Only
the source's builder can duplicate it. The source is never changed. The
copy's title is distinguishable (e.g. "<title> (copy)"; story detail). The
copy is created on the server from the stored source, never from client
state.

**Keep Build / Play** *(human, epic 14)*. Owner actions live in the Build
view's rows. Other users never see them. No third view and no separate
management page.

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
- A route from the hints phase back to grid building (see Pending
  question 3).
- Grid-engine changes.

---

## Stories

Order as listed. Story files are `stories/16-S<n>-<slug>.md`. Each lists
the frozen tests it supersedes.

### S1 — Private means unlisted

`listPuzzles` stops returning other builders' private published puzzles.
The Play view then shows your own puzzles in either visibility and other
builders' public ones. Play by URL is unchanged: any signed-in user can
still open a private puzzle's link. Existing private puzzles in the
database become unlisted when this ships. Supersedes 14-S2's "Play lists
every published puzzle" tests. Settles the Build view's visibility marker
and whether "Private" is relabelled "Unlisted" (Pending question 1).

### S2 — Change visibility

An owner-only action switches a published puzzle between Private and
Public. The write is guarded on `builderId`, `publishedAt: not null` and a
valid value. Nothing else changes: not the ID, URL, content, `publishedAt`
or play sessions. Settles where the control lives (Pending question 4).

### S3 — Delete published puzzles

The library's Delete is offered on published rows too, with a confirmation
that, for a published puzzle, says other players' progress is deleted.
Declining deletes nothing. A link to a deleted puzzle shows a "no longer
available" message with a way back to `/puzzles`, in play and the editor.
A player mid-solve whose save fails because the puzzle was deleted is told
so, not shown a generic save error. Supersedes 14-S2's published rows
having no Delete.

### S4 — Duplicate a puzzle

A Duplicate action on Build rows, in any phase, creates the copy described
in Decisions and opens it in the editor. Tests cover a new ID and owner,
unpublished, identical grid, letters and hints, the source unchanged, no
sessions copied, and another user's puzzle refused.

---

## Pending questions

1. **The word "Private."** Once S1 ships, Private means unlisted:
   link-playable, not owner-only. Keep the label "Private" (and the
   Publish dialog's "Who can play it?"), or rename it "Unlisted" in the
   dialog and status labels? The stored value can stay `'private'` either
   way. *Proposed:* rename to "Unlisted"; "Private" suggests owner-only.
2. **Is S1 a change the human wants?** It changes 14-S2's approved "Play
   lists every published puzzle" to match epic 11's intent. The
   alternative is keeping Private and Public identical and dropping S1, but
   then the visibility choice means nothing.
3. **A duplicate of a hints-phase puzzle has a locked shape.** Nothing
   moves a puzzle back to grid building today. Accept that (fix letters
   and hints only), or add a route back (e.g. a duplicate restored from
   `gridBeforeHints` in the grid phase, losing its hints)? *Proposed:*
   accept it here; a route back is its own epic or story.
4. **Where the owner actions go.** A Build row has room for one trailing
   control today. Duplicate, visibility and Delete together suggest a row
   menu (a new component and style-guide sample) or a new place, like the
   builder's published state for visibility. Values from the human per
   epic 13/14's Decisions.
5. **Order against epic 15.** Queued after it. Say if any story should go
   first.
