# Puzzle lifecycle — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The S3 story, [16-S3-delete-published.md](stories/16-S3-delete-published.md),
   and the EPIC Decisions it cites.

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

S4 (Duplicate a puzzle) has no story yet; its EPIC section is the
starting point.

## Verification

S3's implementation, on `main` at `602c0c5` plus the four runtime
changes (the tree committed as S3's implementation): `npm run verify`
exit 0 (Vitest 612 of 612); full `npm run test:e2e` exit 0, 806 of 806.
Frozen acceptance unchanged from `602c0c5`. The guarded reset used the
standing grant in [DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

## Next action

Draft S4's specification and proposed acceptance from the EPIC's S4
section, on `main`, uncommitted until the human approves it. No runtime
change before freeze.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and the S4 section of docs/epics/16-puzzle-lifecycle/EPIC.md. Draft S4's specification and proposed acceptance on main; don't commit or change runtime until the human approves it.
