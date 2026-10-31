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

**S3 (Delete published puzzles) is approved and frozen** *(human,
2026-10-31)*, accepting the recommended answer to all three questions:
the proposed copy, the proposed visual values, and direct delivery to
`main` (no CODE-REVIEW risk path). Frozen in a specification-only commit
on `main`: [16-S3-delete-published.md](stories/16-S3-delete-published.md),
`e2e/delete-published.spec.ts` and the two 16-S2 amendments in
`e2e/row-menu.spec.ts`. Implementation is next, on `main`.

## Verification

At freeze, on `main` at `5bfae31` plus the then-uncommitted proposed
tests: `npm run verify` exit 0. The story records the discrimination
run. Implementation's `npm run verify` and full `npm run test:e2e` are
not yet run.

## Next action

Implement S3 on `main` per its Repo paths, keeping the frozen acceptance
unchanged. Deliver directly to `main` after `npm run verify` and the full
`npm run test:e2e` both exit 0. Touching `actions.ts` would be a
risk-path escalation (story branch, PR, independent review).

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and docs/epics/16-puzzle-lifecycle/stories/16-S3-delete-published.md. Implement the frozen S3 on main; deliver directly to main after npm run verify and the full npm run test:e2e pass.
