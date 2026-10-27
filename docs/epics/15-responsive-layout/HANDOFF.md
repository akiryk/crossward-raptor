# Responsive layout — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** epic 14's [Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27)
for the carried items' original wording.

## Current state (2026-10-27)

**The EPIC is a draft, not approved.** It was drafted on `main` from the
human's details and two narrow mockups (Build/Hint/Preview and play) of
2026-10-27, which it records in "The human's details". No story exists.
The draft is committed on `main`, awaiting the human's approval.

Findings from the code that shaped the draft:

- The builder's grid shrinks from about 1290px because its column is
  capped at `lg:max-w-[45%]` (`src/components/grid/PuzzleGridEditor.tsx`).
- Both grids also shrink with the window's height (`100vh` minus 300px
  in the builder, 370px in play); the human chose to drop that.
- Playwright's default viewport is 1280×720, under play's 1290px
  threshold; the human approved moving it to 1440px wide in S1's freeze
  commit.

The human answered all ten of the first draft's questions on 2026-10-27
(recorded in the EPIC's Decisions). The epic awaits only the human's
approval.

## Verification

Documentation only; no checks run.

## Next action

Get the human's approval of the EPIC and record it in its status line.
Approval doesn't approve any story; S1's specification is drafted next,
on `main`.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/EPIC.md. Get the human's approval of the EPIC, record it on main, then draft S1's specification for approval.
