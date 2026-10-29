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

**S1 (Unlisted) is approved and frozen** *(human, 2026-10-29)*: the
specification, acceptance and amendments as drafted, with the Build
marker question settled as option 1 (a published Build row keeps
`[published]`). The freeze is a specification-only commit on `main`:
[16-S1-unlisted.md](stories/16-S1-unlisted.md), `e2e/unlisted.spec.ts`,
`src/app/puzzles/actions.unlisted.test.ts` and the six amended frozen
test files listed in the story's table. No runtime change in it.

S1 changes `src/app/puzzles/actions.ts`, a CODE-REVIEW risk path: it's
implemented on `story/16-S1-unlisted` with a PR and an independent
review.

## Verification

At freeze: the drafting discrimination run recorded in the story.
`npm run verify` fails on `main` at the freeze commit until S1's
implementation lands, by design.

## Next action

Implement S1 on `story/16-S1-unlisted` from the freeze commit and open a
PR for independent review; don't merge it yourself.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and docs/epics/16-puzzle-lifecycle/stories/16-S1-unlisted.md. Once the human approves it, freeze S1 on main in a specification-only commit, then implement it on story/16-S1-unlisted and open a PR; don't merge it.
