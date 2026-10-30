# Puzzle lifecycle — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md), especially "S2 — Row menu and visibility" and the
   Decisions it relies on.

## Current state (2026-10-29)

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

**S2 (Row menu and visibility)** has no story file yet. Only drafting its
specification and proposed acceptance is the next job; it needs human
approval and a specification-only freeze on `main` before implementation.

## Verification

Reviewer, on PR #29's head `fa04d69` (the merged S1 content): `npm run
verify` exit 0, Vitest 606 of 606; full `npm run test:e2e` exit 0, 780 of
780, using the guarded reset under the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment). `git diff 0563d69`
touches no acceptance file. External CI: Vercel deployment only (runs no
test gates), passed.

## Next action

Draft S2's specification and proposed acceptance from the EPIC's S2
section as `stories/16-S2-*.md`, per STORY's drafting phase, on `main`.
Stop for human approval before freezing; no runtime change.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and the "S2 — Row menu and visibility" section of docs/epics/16-puzzle-lifecycle/EPIC.md. Draft S2's specification and proposed acceptance on main; stop for human approval before freezing.
