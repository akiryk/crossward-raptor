# Play — Handoff

## Read first

1. This handoff's Current state and Next action; use AGENTS if not supplied.
2. [REVIEW](../../process/REVIEW.md) and the frozen
   [P5 story](stories/11-P5-library-play.md) for reviewing PR #24.

**Only if needed:** [P4 story](stories/11-P4-reset.md) for the reset behavior P5
reuses; [CODE-REVIEW](../../CODE-REVIEW.md) for the high-risk path;
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) before browser work.
[History](HISTORY.md) keeps older evidence; don't load it for routine startup.

## Current state (2026-10-20)

**P1–P4 are complete** (P4 merged in
[PR #23](https://github.com/akiryk/crossward-raptor/pull/23) at `740d569`).

**P5 is implemented and awaiting independent review** in
[PR #24](https://github.com/akiryk/crossward-raptor/pull/24) on branch
`story/11-P5-library-play`. It was branched from `affa322`; the frozen
baseline is `687ac58`, after the O3 correction `be3a58b`. Implementation
commit `14aaba6`; this handoff update follows it on the branch. Not merged.

Implementation summary (details in the PR):

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

Known limit (accepted in P4/P5): saves are keyed by user and puzzle, so an
old open tab can save into a fresh attempt.

The standing guarded local test-reset grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) covers necessary harness
runs. Merging needs an independent reviewer; epic closeout needs separate
authorization.

## Verification

Author-observed on the implementation tree (`14aaba6`):
- `npm run verify` exit 0, 35 files / 579 tests (only the pre-existing
  `request-logger/render.ts:802` lint warning).
- Full `npm run test:e2e -- --workers=2` exit 0, **435 passed**; the focused
  P5 spec passed 18/18.
- Disabling `LibraryFreshness` made the Back freshness case fail, which
  shows the refresh is needed. It was restored before the full run.
- Frozen acceptance and every test/E2E file show no diff against `687ac58`.
- Visual and keyboard check (throwaway spec, not committed): cues and the
  ✓, quiet Reset/Manage, completed sorted last, the dialog naming the
  puzzle, Escape returning focus to Reset, and a keyboard-confirmed reset
  focusing Play.

Not yet observed: independent review and configured CI on the PR head.

## Next action

Independent review of PR #24 by a session other than its author, under
REVIEW/CODE-REVIEW. Merge it if no blockers remain and verification and CI
pass. Then do P5 and epic closeout docs only if separately authorized.

## Resume prompt

Read docs/epics/11-play/HANDOFF.md and docs/epics/11-play/stories/11-P5-library-play.md. Independently review PR #24 against the frozen P5 acceptance and merge it if no blockers remain.
