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

**S2 (Row menu and visibility) is approved and frozen** at `a624b16` *(human,
2026-10-31)*: the specification, acceptance and amendments as drafted,
with both pending questions answered as recommended (the proposed visual
values, and `updatedAt` unchanged on a visibility change). The freeze is
a specification-only commit on `main`:
[16-S2-row-menu.md](stories/16-S2-row-menu.md),
`e2e/row-menu.spec.ts`, `src/app/puzzles/actions.visibility.test.ts` and
the amended `e2e/puzzle-library.spec.ts` (14-S2-2, 14-S2-3, 14-S2-6). No
runtime change in it.

**S2 is implemented** on `story/16-S2-row-menu` (branched from `b3109a3`,
which only records the freeze) and awaits independent review in
[PR #30](https://github.com/akiryk/crossward-raptor/pull/30).
Only the story's declared runtime paths changed; the one addition to the
throwaway design is recorded in the story's Implementation note. Not
merged.

## Verification

On the implementation tree (2026-10-31, before commit; committed content
unchanged):

- `npm run verify`: exit 0. Vitest 612 of 612; ESLint's one warning is
  pre-existing in `request-logger/`.
- Full `npm run test:e2e`: exit 0, 795 of 795, under the standing
  test-database reset grant ([DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)).
- Frozen acceptance (`e2e/row-menu.spec.ts`,
  `src/app/puzzles/actions.visibility.test.ts`,
  `e2e/puzzle-library.spec.ts`) unchanged from `a624b16`.

## Next action

Independently review PR #30 per [REVIEW](../../process/REVIEW.md) and
merge it when no blockers remain. S3 is not authorized by this.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and docs/epics/16-puzzle-lifecycle/stories/16-S2-row-menu.md. Review PR #30 (S2) on story/16-S2-row-menu independently, and merge it if no blockers remain.
