# Puzzle lifecycle — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md), especially "S3 — Delete published puzzles" and
   the Decisions it relies on.

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

**S3 (Delete published puzzles)** has no story file yet. Only drafting its
specification and proposed acceptance is the next job; it needs human
approval and a specification-only freeze on `main` before implementation.

## Verification

Reviewer, on PR #30's head `d2a0444` (the merged S2 content): `npm run
verify` exit 0, Vitest 612 of 612 (ESLint's one warning is pre-existing in
`request-logger/`); full `npm run test:e2e` exit 0, 795 of 795, using the
guarded reset under the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment). `git diff a624b16`
touches no acceptance file. External CI: Vercel deployment only (runs no
test gates), passed.

## Next action

Draft S3's specification and proposed acceptance from the EPIC's S3
section as `stories/16-S3-*.md`, per STORY's drafting phase, on `main`.
Stop for human approval before freezing; no runtime change.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and the "S3 — Delete published puzzles" section of docs/epics/16-puzzle-lifecycle/EPIC.md. Draft S3's specification and proposed acceptance on main; stop for human approval before freezing.
