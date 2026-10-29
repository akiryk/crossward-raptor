# Puzzle lifecycle — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).
3. The active story, [16-S1-unlisted.md](stories/16-S1-unlisted.md).

## Current state (2026-10-29)

**The EPIC is approved** (by the human, 2026-10-27), from an outside
proposal checked against the code; its "What the code does today" records
that check. Epic 15 closed 2026-10-29; epic 17 (Polish) follows this one
*(human)*. Stories go one at a time; the epic's approval doesn't approve
any story.

**S1 (Unlisted) is drafted, not approved**:
[16-S1-unlisted.md](stories/16-S1-unlisted.md), with proposed acceptance in
`e2e/unlisted.spec.ts` and `src/app/puzzles/actions.unlisted.test.ts` and
amendments to six frozen test files (listed in the story's table). All of
it is **uncommitted** in the `main` worktree until freeze. No runtime
change. One question is pending for the human: whether a published Build
row shows its visibility (recommended: no, keep `[published]`; S2's menu
shows it).

S1 changes `src/app/puzzles/actions.ts`, a CODE-REVIEW risk path: after
freeze, implement on `story/16-S1-unlisted` with a PR and an independent
review.

## Verification

S1's draft: `tsc --noEmit` and ESLint pass on the proposed tests; the
discrimination run is recorded in the story (a throwaway implementation,
reverted, failed exactly the eight amended frozen cases in the full suites
and passed all proposed tests; `main` fails the new cases). The guarded
reset used the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment). `npm run verify` fails
on the uncommitted proposed tests until implementation, by design.

## Next action

The human answers S1's pending question and approves (or revises) its
specification, acceptance and amendments. Then freeze S1 on `main` in a
specification-only commit and implement it on `story/16-S1-unlisted`,
opening a PR for independent review; don't merge it yourself.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and docs/epics/16-puzzle-lifecycle/stories/16-S1-unlisted.md. Once the human approves it, freeze S1 on main in a specification-only commit, then implement it on story/16-S1-unlisted and open a PR; don't merge it.
