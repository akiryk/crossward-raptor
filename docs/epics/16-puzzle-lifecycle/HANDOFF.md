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

S1 is **implemented** on `story/16-S1-unlisted` (from `0563d69`), pushed,
with a PR open for independent review per CODE-REVIEW; **not merged**.
It changes only `src/app/puzzles/actions.ts` (risk path: `listPuzzles`'s
`where`), `src/components/grid/PublishDialog.tsx` and
`src/lib/puzzle-status.ts`, plus this handoff and the story's status.

## Verification

On the implementation tree (the PR's commit; docs-only edits after the
runs): `npm run verify` exit 0, Vitest 606 of 606; full `npm run test:e2e`
exit 0, 780 of 780, using the guarded reset under the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment). `git diff 0563d69`
touches no acceptance file. External CI: see the PR.

## Next action

Independently review S1's PR on `story/16-S1-unlisted` per REVIEW and
merge it if no blockers remain. S2 isn't authorized until then.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and docs/epics/16-puzzle-lifecycle/stories/16-S1-unlisted.md. Once the human approves it, freeze S1 on main in a specification-only commit, then implement it on story/16-S1-unlisted and open a PR; don't merge it.
