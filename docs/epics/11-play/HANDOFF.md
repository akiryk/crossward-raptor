# Play — Handoff

## Read first

1. This handoff's Current state and Next action; use AGENTS if not supplied.
2. [AUDIT](../../process/AUDIT.md) and [EPIC](EPIC.md) for the closeout
   audit.

**Only if needed:** the [P1–P5 stories](stories/) for per-story scope;
[CODE-REVIEW](../../CODE-REVIEW.md) for the high-risk paths;
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) before browser work.
[History](HISTORY.md) keeps older evidence; don't load it for routine startup.

## Current state (2026-10-20)

**P1–P5 are complete.** P4 merged in
[PR #23](https://github.com/akiryk/crossward-raptor/pull/23) at `740d569`.
P5 was independently reviewed (a separate session, no findings) and merged
in [PR #24](https://github.com/akiryk/crossward-raptor/pull/24) at merge
commit `e89b6d5`. The reviewed head was `54f1050`, the frozen baseline
`687ac58`, and the O3 correction `be3a58b`.

**The epic is not closed.** The independent closeout audit ran on 2026-10-20
([record](HISTORY.md#closeout-audit-2026-10-20)). Its verdict is that the epic
can't be closed yet.

**Blocker:** nothing records the `20261018180000_add_play_sessions` migration
being applied to development or production. `main` deploys automatically, and
since P5 the library page reads `playSessions`. The human must confirm and
record the production and development schema state, or authorize the reviewed
migration per [DEVELOPMENT](../../DEVELOPMENT.md). Agents may not touch those
databases.

The audit also found non-blocking doc drift in EPIC, the P1 story and
LEARNINGS, plus follow-ups such as the P4 stale-ID keystroke window. They're
listed in the record.

P5 implementation summary (details in the PR):

- `listPuzzles` reads the caller's attempt through a caller-filtered
  `playSessions` relation in the single `findMany`.
- A pure classifier lives in `src/lib/library-play.ts`, and
  `groupPuzzles` sorts in bands.
- Rows use a stretched primary link (Play, or Edit for drafts), with
  Reset and Manage raised above it.
- `LibraryPlayControls` reuses `PlayResetDialog` with a new optional
  `puzzleTitle`.
- Freshness: the reset action's existing `revalidatePath('/puzzles')`
  refreshes the row in place. `LibraryFreshness` calls `router.refresh()`
  when the library is re-entered through history (Back). No play action
  changed.
- Undeclared path added: `src/components/puzzle/library-row.ts`. It's a
  shared class string, because a client module's exported constant can't
  be used as a string in the server page.

Non-blocking review note: `library-row.ts` was not declared in Repo paths
before editing, but the PR and this handoff record it.

Known limit (accepted in P4/P5): saves are keyed by user and puzzle, so an
old open tab can save into a fresh attempt.

The standing guarded local test-reset grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) covers necessary harness
runs.

## Verification

Reviewer-observed on the PR head `54f1050`, whose runtime tree matches
`14aaba6` (only docs changed after it):
- `npm run verify` exit 0, 35 files / 579 tests (only the pre-existing
  `request-logger/render.ts:802` lint warning).
- Full `npm run test:e2e -- --workers=2` exit 0, **435 passed**, with no
  retries configured.
- Frozen tests and E2E files show no diff against `687ac58`.
- Configured CI is only the Vercel deployment and preview comments, both
  passing. CI doesn't run the unit or E2E gates.

Author-observed on `14aaba6`: the focused P5 spec passed 18/18. Disabling
`LibraryFreshness` made the Back case fail. The visual and keyboard check
passed.

## Next action

Once the human has confirmed and recorded the PlaySession migration state
(blocker 1), fix the audit's doc corrections 2–6 on main. These are
docs-only: EPIC, the P1 and P5 stories, and the HANDOFF prune. Then recheck
blockers 1–6, and mark the epic closed in this handoff, EPIC and the
[epic index](../README.md). Follow-ups 7–12 need their own scoped stories or
tasks; they don't block closure.

## Resume prompt

Read docs/epics/11-play/HANDOFF.md and the closeout audit record it links. Resolve the audit's doc corrections and close the Play epic on main once the PlaySession migration state is recorded; docs only, no database operations.
