# Play — Handoff

## Read first

1. This handoff's Current state and Next action; use AGENTS if not supplied.
2. [P4 story](stories/11-P4-reset.md), its two frozen acceptance files and
   the PR #23 diff; [REVIEW](../../process/REVIEW.md) for the review.

**Only if needed:** [EPIC P4](EPIC.md#p4--reset),
[STORY](../../process/STORY.md) for implementation and delivery,
[CODE-REVIEW](../../CODE-REVIEW.md) for the high-risk review path,
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) before browser work.
The [historical P3 completion handoff](HISTORY.md#historical-p3-completion-handoff-archived-during-p4-drafting-2026-10-19)
retains its full verification/permission provenance.

## Current state (2026-10-20)

**P4 is implemented on `story/11-P4-reset` in
[PR #23](https://github.com/akiryk/crossward-raptor/pull/23), awaiting
independent review per CODE-REVIEW (high risk: `actions.ts`). Not merged.**
Runtime was authorized 2026-10-20 (implement, open PR, don't merge).
Implementation commit `5e62dc4`; the handoff commit follows on the same
branch. Frozen acceptance (26 server cases in
`src/app/puzzles/actions.play-reset.test.ts`, 24 browser cases in
`e2e/play-reset.spec.ts`) is byte-identical to baseline `14bb217`.

Added paths beyond the story's list (declared in the story): new colocated
`src/components/play/PlayReset.tsx`, and a read-only `isPlayPuzzleBuilder`
action in `actions.ts` supplying the route's builder boolean.

Human decisions: reset stays on the play page and shows a fresh blank
attempt; the library reset control moves to P5. Known accepted limit: saves
are keyed by user and puzzle, so an old open tab can save into the fresh
attempt. P1–P3 remain complete (P3 merged in PR #22 at `4cfa4d7`).

## Verification

On the code tree committed as `5e62dc4` (no code edits after these runs):
`npm run verify` exit 0 (560 tests; one pre-existing lint warning in
`request-logger/render.ts`); focused P4 E2E 25/25; full
`npm run test:e2e -- --workers=2` exit 0, 417 passed. The browser runs used
the standing guarded local test reset grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment). Visual check of builder
shortcut, options disclosure, confirmation, pending, error, completed-to-blank
reset and non-builder view, via a throwaway local script (not committed).
Configured CI on PR #23: not observed by the author.

## Next action

Independently review PR #23 per REVIEW/CODE-REVIEW (a different agent or
session from the author). The reviewer merges if there are no blockers and the
required verification and CI pass. P5 requires separate authorization.

## Resume prompt

Read docs/epics/11-play/HANDOFF.md and docs/epics/11-play/stories/11-P4-reset.md. Independently review PR #23 on story/11-P4-reset per REVIEW; merge only if no blockers remain and required checks pass.
