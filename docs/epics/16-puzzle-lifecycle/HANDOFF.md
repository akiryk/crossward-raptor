# Puzzle lifecycle — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md) and [AUDIT](../../process/AUDIT.md); open a
   story file only when a finding needs it.

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

**S4 (Duplicate a puzzle) is done.** The human approved the specification, acceptance and
amendments *(2026-10-31)*, accepting the recommended answers to its
question: the "{title} (copy)" title, appended every time, and the
proposed failure message. Frozen on `main` at `0e6658c`. Implemented on
`story/16-S4-duplicate`, changing only `src/app/puzzles/actions.ts`
(`duplicatePuzzle`, a risk path) and
`src/components/puzzle/PuzzleRowMenu.tsx`, in [PR #31](https://github.com/akiryk/crossward-raptor/pull/31). Frozen
acceptance is unchanged from `0e6658c`. Independently reviewed with no
findings and merged to `main` as `c3bf751`.

**Every story meets its Definition of Done.** The epic awaits its
independent closeout audit.

## Verification

S4 review (2026-10-31), run by the independent reviewer on the reviewed
head `053b6bd`: `npm run verify` exit 0 (Vitest 620 of 620; one
pre-existing lint warning in `request-logger/render.ts`); full
`npm run test:e2e` exit 0, 811 of 811; CI (Vercel) passed. The guarded reset used the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment). Drafting's
discrimination evidence is in the story.

## Next action

An independent, report-only closeout audit of epic 16 per
[AUDIT](../../process/AUDIT.md) and the
[epic index](../README.md#close-an-epic), by a session that authored none
of the epic's work. A non-auditing session then records its date,
coverage, findings and disposition here.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and docs/epics/16-puzzle-lifecycle/EPIC.md. Perform the independent closeout audit of epic 16 per docs/process/AUDIT.md on main; report only, with no edits, commits or pushes.
