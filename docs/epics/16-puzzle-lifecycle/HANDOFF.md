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

**S3 (Delete published puzzles) is drafted, not approved**:
[16-S3-delete-published.md](stories/16-S3-delete-published.md), with
proposed acceptance in `e2e/delete-published.spec.ts` and amendments to
two 16-S2 cases in `e2e/row-menu.spec.ts` (the story's table). All of it
is **uncommitted** in the `main` worktree until freeze. No runtime change.
Three questions are pending for the human: the proposed copy, the "no
longer available" page's visual values, and delivery (recommended:
direct to `main`, since S3 touches no CODE-REVIEW risk path; the
alternative is a PR and independent review anyway).

## Verification

S3's draft, on `main` at `c6361a5` plus the uncommitted proposed tests:
`npm run verify` exit 0 (Vitest 612 of 612; the new tests are browser
only). The story records the discrimination run. `main` fails every new
case except one intentional guard. A reverted throwaway implementation
passed the full `npm run test:e2e`, 806 of 806, and two mutations were
each caught. The guarded reset used the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

## Next action

The human answers S3's pending questions and approves (or revises) its
specification, acceptance and amendments. Then freeze S3 on `main` in a
specification-only commit and implement it, delivered as the answer to
question 3 says.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and docs/epics/16-puzzle-lifecycle/stories/16-S3-delete-published.md. Once the human approves it, freeze S3 on main in a specification-only commit, then implement it and deliver it as its question 3's answer says.
