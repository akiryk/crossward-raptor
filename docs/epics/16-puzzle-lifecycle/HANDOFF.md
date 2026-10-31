# Puzzle lifecycle — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [16-S2-row-menu.md](stories/16-S2-row-menu.md).

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

**S2 (Row menu and visibility) is approved and frozen** *(human,
2026-10-31)*: the specification, acceptance and amendments as drafted,
with both pending questions answered as recommended (the proposed visual
values, and `updatedAt` unchanged on a visibility change). The freeze is
a specification-only commit on `main`:
[16-S2-row-menu.md](stories/16-S2-row-menu.md),
`e2e/row-menu.spec.ts`, `src/app/puzzles/actions.visibility.test.ts` and
the amended `e2e/puzzle-library.spec.ts` (14-S2-2, 14-S2-3, 14-S2-6). No
runtime change in it.

S2 changes `src/app/puzzles/actions.ts`, a CODE-REVIEW risk path, so
it's implemented on `story/16-S2-row-menu` with a PR and an independent
review. The throwaway implementation used for discrimination is outside
the repo at `/tmp/s2-throwaway/` (may not survive a reboot).

## Verification

At freeze: drafting checks only (details in the story's Discrimination
section). With the throwaway, Vitest passed 612 of 612 and the four
affected browser specs 69 of 69. Two full `npm run test:e2e` runs under
heavy machine load failed 3 and 8 timeouts outside S2's specs, and each
failing spec passed alone. On `main`'s runtime the proposed tests fail as
intended. `npm run verify` fails on `main` at the freeze commit until
S2's implementation lands, by design. No full suite has passed yet.

## Next action

Implement S2 on `story/16-S2-row-menu` from the freeze commit and open a
PR for independent review; don't merge it yourself. A clean full
`npm run test:e2e` run is still required.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and docs/epics/16-puzzle-lifecycle/stories/16-S2-row-menu.md. Implement S2 on story/16-S2-row-menu from its freeze commit and open a PR for independent review; don't merge it.
