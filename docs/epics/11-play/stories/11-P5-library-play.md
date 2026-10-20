# Story P5 — The library learns about play

Let the library offer Play on published puzzles, show the signed-in player's
own state on each, sort finished puzzles last within their size group, and
offer the confirmed P4 reset on rows with an attempt.

**Status:** the human approved the specification and acceptance on
2026-10-20, including the clickable row and the O3 correction, and gave the
go-ahead to freeze. The baseline is frozen on `main` after the separate O3
correction commit `be3a58b`; the handoff records the baseline commit.
Implemented, independently reviewed and merged in
[PR #24](https://github.com/akiryk/crossward-raptor/pull/24) at `e89b6d5`.
**Blast radius: high:** `listPuzzles` in `actions.ts`, and the library page
whose shape four existing browser specs assert.

## Decisions

Before drafting, I inspected EPIC P5, `listPuzzles`, `src/app/puzzles/page.tsx`,
`groupPuzzles`/`puzzleStatus`, P4's `resetPlaySession` and
`PlayResetDialog`, the `PlaySession` schema, and every library-shape assertion:
`actions.ownership.test.ts`, `actions.session.test.ts`,
`puzzle-groups.test.ts`, `puzzle-list.spec.ts`,
`puzzle-list-layout.spec.ts`, `puzzle-groups.spec.ts`,
`publish-status.spec.ts`, `ownership.spec.ts`. No migration or new dependency
is needed.

The human approved the decisions below on 2026-10-20.

### Which rows carry play

- Only **published** rows carry play: a Play link, a play state, and possibly
  a reset control. Unpublished rows are unchanged and ignore any surviving
  session, because an unpublished puzzle can't be played or reset (P1/P4
  reject it). Unpublishing semantics stay deferred, per the epic.
- The library itself is unchanged: it stays unfiltered and lists every
  builder's puzzles, as `ownership.spec.ts` asserts.
- Play state is always the **authenticated caller's own** attempt. Another
  player's session on the same puzzle never affects the caller's row.

### Classifying a row

For a published puzzle with the caller's session row `S`, if any:

- **completed:** `S` exists, and its entries match the puzzle grid's geometry
  and solve it (`isSolved`), whatever `completedAt` says. Following the epic,
  comparison is the source of truth; P3's play page locks on the same check.
- **in progress:** `S` exists and isn't completed, and either at least one
  active cell has a letter (a full but incorrect grid included) or its
  entries no longer match the grid's geometry. That second case is a stale
  attempt the player may want to reset.
- **untouched:** no `S`, or `S` is neither of the above. This includes the
  blank row that opening the play page or a P4 reset creates (EPIC P5).

### `listPuzzles` contract

- Every existing field, its value and the `updatedAt desc` query order stay
  unchanged. Each item gains
  `play: { state: 'untouched' | 'in-progress' | 'completed'; sessionId: string | null } | null`.
  The value is `null` for unpublished puzzles. For published puzzles,
  `sessionId` is the caller's row ID when a row exists, otherwise `null`.
- Read the caller's session inside the **same** `prisma.puzzle.findMany`,
  through the `playSessions` relation filtered to the authenticated user ID.
  Make no separate `playSession` query. This keeps the snapshot atomic and the
  frozen ownership/session mocks valid (they provide only `puzzle.findMany`).
  Compute play only for published rows.
- Return no entries, letters, solution, `startedAt`/`completedAt` or other
  users' data. The action stays authenticated before any data access.

### Ordering

- Size groups stay the only grouping. Within each group: unpublished work
  first, then published puzzles that aren't completed (untouched and in
  progress together), then completed. Within each band, most recently updated
  comes first. `GroupablePuzzle` gains an **optional** `play` field, so callers
  and frozen tests that omit it keep today's order.

### The row

Human-approved on 2026-10-20, with a clickable row. A published puzzle is for
playing and an unpublished one for editing; no row offers both as its primary
action.

- **Primary action by state.** Every published row, whether the caller built
  it or not and whether it's public or private, has a **Play** link (`<a>`,
  visible text `Play`, `href="/puzzles/{id}/play"`). The caller's own
  unpublished rows keep their **Edit** link. Another builder's unpublished
  row has no action and isn't clickable.
- **The whole row is clickable.** Clicking anywhere on a row that has a
  primary action (the title, thumbnail, metadata or empty space) follows
  that action. Use a stretched-link overlay from the primary link: the row
  element stays a non-link `<li>`, and drafts keep exactly one `<a>`, so
  `puzzle-list-layout.spec.ts` keeps passing. The primary link is the row's
  only navigation tab stop; don't add a row-level `tabindex`, role or click
  handler. Show pointer feedback over the whole clickable row.
- **Secondary controls sit above the overlay** and act on their own without
  following the row's link: **Reset** now, and the planned "⋯" more-options
  button later.
- **Interim Manage link.** The caller's own published rows keep a quiet
  secondary link to the editor with visible text **Manage** (hook
  `puzzle-edit-link`, `href="/puzzles/{id}"`). That editor is still the only
  UI for unpublishing or deleting. A later "⋯" story may move those actions
  and remove Manage. Frozen O3 requires this link on own published rows.
  Like Edit, Manage keeps a pointer cursor and a visible hover change, since
  frozen `controls.spec.ts` checks the first `puzzle-edit-link`.
- **Play state on the row.** The row carries `data-play-state` with its
  state; unpublished rows have no such attribute.
- **State cue.** Separate from the builder status badge: **In progress** for
  an attempt in progress, and **Completed** with the same ✓ success mark the
  play page uses. Untouched rows show no cue. There's no completion date in P5.
- **Reset.** In-progress and completed rows also show a quiet **Reset**
  button that opens P4's reset confirmation. Untouched rows have none, since
  resetting a blank attempt would do nothing.

### Frozen acceptance correction (O3)

Frozen `e2e/builder-edits.spec.ts` (O3) required another builder's rows,
including published ones, to have no links or buttons. That contradicts the
epic's "published puzzles offer Play". On 2026-10-20 the human approved the
smallest correction: another builder's **published** rows have no
`puzzle-edit-link` and no editor link (`a[href="/puzzles/{id}"]`); their
unpublished rows keep the original no-controls assertion. O3's story records
the correction. Per STORY, it needs independent review and lands in a
separate specification-only commit on `main` before the P5 freeze. It must
not be bundled with runtime work.

### Library reset

- Reuse `PlayResetDialog` (title **Reset puzzle?**, **Cancel** and **Reset
  puzzle** actions, same hooks), with body copy that also names the puzzle's
  title. Many rows share the page, so the confirmation must say which puzzle.
  Any change to `PlayResetDialog` stays optional and leaves the play page's
  behavior unchanged.
- Confirm by calling the unchanged
  `resetPlaySession(puzzleId, play.sessionId)`. P4's server semantics, and its
  frozen acceptance, apply as they stand: transactional delete and recreate of
  a fresh blank row, stale or foreign IDs delete nothing, and the library
  cache is invalidated.
- Pending: show `play-reset-pending`. Confirm, Cancel, Close, Escape and the
  backdrop are disabled or do nothing. Exactly one request is sent.
- Success: the dialog closes and the page stays on `/puzzles` with no manual
  reload. The row now shows the caller's current state from the server: after
  an ordinary reset it's untouched, with no cue or Reset button, sorted out of
  the completed band. Focus moves to that row's Play link. Also remove the old
  session's `crossward:play-draft:v1:<sessionId>` key, as P4 does, keeping
  every unrelated key. If storage removal fails, the reset still succeeds.
- Stale ID (the attempt was replaced elsewhere after the library loaded): the
  server deletes nothing and the newer attempt survives. The row then reflects
  that attempt, which may still be in progress. P4 accepted the same limit.
- Failure or lost acknowledgement: stay in the dialog with `play-reset-error`
  and leave data unchanged (or committed, if the acknowledgement was lost).
  Re-enable dismissal and confirmation; a retry reaches P4's idempotent
  success.
- Cancel, Escape, the backdrop or Close change nothing, and focus returns to
  the row's Reset button.

### Freshness

- After an acknowledged save, completion or reset on the play page, reaching
  the library shows current state. That holds for a fresh load, for app
  navigation, and for **browser Back** to a library page visited before
  playing. The implementation picks the mechanism (for example, invalidating
  `/puzzles` from play actions or refreshing the library on reentry). It must
  not disturb the play page, and frozen P1–P4 acceptance must still pass.
 

## Acceptance

Frozen executable acceptance:

- `src/app/puzzles/actions.library-play.test.ts`: authentication before
  access; the existing fields and order preserved; `play` null for unpublished
  rows even when a session survives; untouched with no row or a blank row;
  in progress for partial, full-incorrect and geometry-mismatched entries;
  completed by comparison whether or not it's stamped, and a stamped but
  unsolved row isn't completed; the caller-only relation filter, with another
  user's session ignored; a single `puzzle.findMany` and no `playSession`
  query; no entries, answers or timestamps returned.
- `src/lib/puzzle-groups.play.test.ts`: completed sorts after a newer
  published non-completed puzzle, which sorts after unpublished work; untouched
  and in progress share a band; each band orders by recency; groups stay by
  size; no `play` field means unchanged order; input isn't mutated.
- `e2e/library-play.spec.ts`: a Play link on published rows of both builders
  and both visibilities and on no unpublished row; following it opens a ready
  play page; clicking the row (title, thumbnail) follows its primary action,
  Manage opens the editor, and another builder's draft row isn't clickable; the state attribute and cues for the three states, including a
  blank row; isolation from another player; completed-last ordering in a
  group; Reset only on started rows; dialog semantics, title naming, focus and
  dismissal; success in place for in-progress and completed rows, verified in
  the database, with focus on Play, removal of only the old draft, and the
  state surviving a reload; pending; a failed or lost acknowledgement, then a
  retry; stale-ID protection; and freshness after playing via Back.

Stable hooks (new or reused): `puzzle-play-link`, `puzzle-edit-link` (Edit or Manage), `puzzle-play-state`,
`puzzle-reset-button`, and row attribute `data-play-state`. The reused P4
dialog hooks are `play-reset-dialog`, `play-reset-confirm`,
`play-reset-cancel`, `play-reset-pending` and `play-reset-error`. Visible
names `Play`, `Edit` (drafts), `Manage` (own published), `Reset`, `In progress`, `Completed` and the dialog title
**Reset puzzle?** are contractual. The library dialog body must name the puzzle's
title, say the reset cannot be undone, and mention the completion record (as
P4's copy does). Otherwise body and error copy may vary as long as the meaning
stays the same.

## Non-goals / scope

P5 only. Out of scope: the "⋯" more-options menu and its delete, duplicate and share
actions (a later story), an archive section or extra headings, a completion
date, filtering or searching, a reset on untouched rows, reset-all, any
change to `resetPlaySession`/`startPlaySession`/save/inspect semantics,
unpublishing protection, play cues on unpublished rows, timer or stats,
checking tools, a schema or migration, builder editor changes, mobile
redesign, auth changes, and edits to previously frozen acceptance. Drafting
authorizes neither runtime work nor deletion of real data. The standing
test-reset grant in [DEVELOPMENT](../../../DEVELOPMENT.md#e2e-environment)
applies only to necessary guarded local browser runs.

## Repo paths

- New frozen acceptance: the three files listed under Acceptance.
- Frozen acceptance correction (its own spec-only commit):
  `e2e/builder-edits.spec.ts`, `docs/epics/10-ownership/stories/10-O3-builder-edits.md`.
- Future runtime: `src/app/puzzles/actions.ts` (`listPuzzles` only, plus any
  freshness invalidation in play actions), `src/app/puzzles/page.tsx`,
  `src/lib/puzzle-groups.ts`; a colocated library play/reset client module
  (for example `src/components/puzzle/LibraryPlayControls.tsx`); an optional
  title prop on `src/components/play/PlayResetDialog`
  (`src/components/play/PlayReset.tsx`); optionally a pure classifier in
  `src/lib/`.
- Editable fixture plumbing, if needed: `e2e/helpers/play-route.ts`.
- Documentation: this story, `../EPIC.md`, `../HANDOFF.md`, `../HISTORY.md`.

Declare any additional paths before editing. Runtime requires a story branch
(`story/11-P5-library-play`), a PR and independent review per CODE-REVIEW. The
specification baseline belongs on main only after human approval and freeze.

## Definition of done

- Obtain human approval of the specification and acceptance. Commit only the
  approved baseline on main before any runtime work.
- Show that the new tests catch the missing P5 behavior. Keep P1–P4 and every
  other frozen acceptance intact, especially the four library specs. Stop
  affected work on an erroneous frozen test.
- After separately authorized implementation, `npm run verify` and the
  complete `npm run test:e2e -- --workers=2` suite exit 0 without weakened
  assertions, retries or timeouts.
- Inspect the library visually: the Play link, both cues and the ✓ mark,
  the quiet Reset, completed rows last, and the dialog naming the puzzle.
  Demonstrate keyboard access, dismissal and focus on success.
- Update the handoff with actual verification and delivery state. Obtain
  independent review, configured CI and a normal merge of the verified head.
  Epic closeout needs separate authorization.
