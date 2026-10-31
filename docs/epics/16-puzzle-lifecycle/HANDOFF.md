# Puzzle lifecycle — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The S4 story, [16-S4-duplicate.md](stories/16-S4-duplicate.md), and
   the EPIC's S4 section and Decisions.

## Current state (2026-10-31)

**The EPIC is approved** (by the human, 2026-10-27), from an outside
proposal checked against the code; its "What the code does today" records
that check. Epic 15 closed 2026-10-29; epic 17 (Polish) follows this one
*(human)*. Stories go one at a time; the epic's approval doesn't approve
any story.

**S1 (Unlisted) is done.** Approved and frozen *(human, 2026-10-29)* on
`main` at `0563d69`; implemented in
[PR #29](https://github.com/akiryk/crossward-raptor/pull/29), independently
reviewed with no findings, and merged to `main` as `ec2e383`. Its
Decisions, including the stored value staying `'private'` and the Build
row keeping `[published]`, are in
[16-S1-unlisted.md](stories/16-S1-unlisted.md).

**S2 (Row menu and visibility) is done.** Approved and frozen *(human,
2026-10-31)* on `main` at `a624b16`; implemented in
[PR #30](https://github.com/akiryk/crossward-raptor/pull/30), independently
reviewed with no findings, and merged to `main` as `642ffe7`. Its
Decisions, including `updatedAt` staying put on a visibility change, are in
[16-S2-row-menu.md](stories/16-S2-row-menu.md).

**S3 (Delete published puzzles) is done.** Approved and frozen *(human,
2026-10-31)* on `main` at `602c0c5`, accepting the recommended answer to
all three questions: the proposed copy, the proposed visual values, and
direct delivery to `main`. Implemented and delivered directly to `main`
in the commit after that freeze, touching only the story's four runtime
paths (no CODE-REVIEW risk path; `actions.ts` unchanged). Its Decisions
are in [16-S3-delete-published.md](stories/16-S3-delete-published.md).

**S4 (Duplicate a puzzle) is implemented and awaits independent
review.** The human approved the specification, acceptance and
amendments *(2026-10-31)*, accepting the recommended answers to its
question: the "{title} (copy)" title, appended every time, and the
proposed failure message. Frozen on `main` at `0e6658c`. Implemented on
`story/16-S4-duplicate`, changing only `src/app/puzzles/actions.ts`
(`duplicatePuzzle`, a risk path) and
`src/components/puzzle/PuzzleRowMenu.tsx`, in PR-PLACEHOLDER. Frozen
acceptance is unchanged from `0e6658c`.

## Verification

S4 implementation (2026-10-31), on the branch's implementation tree:
`npm run verify` exit 0 (Vitest 620 of 620; one pre-existing lint
warning in `request-logger/render.ts`); full `npm run test:e2e` exit 0,
811 of 811. The guarded reset used the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment). Drafting's
discrimination evidence is in the story.

## Next action

Independently review S4's PR per [REVIEW](../../process/REVIEW.md); the
reviewer merges when no blockers remain. Then record the merge here and
in the story.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and the S4 section of docs/epics/16-puzzle-lifecycle/EPIC.md. Present S4's drafted specification and pending question to the human; once they approve, freeze it on main and implement it on story/16-S4-duplicate.
