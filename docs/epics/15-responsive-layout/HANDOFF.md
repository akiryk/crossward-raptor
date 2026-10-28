# Responsive layout — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** epic 14's [Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27)
for the carried items' original wording.

## Current state (2026-10-27)

**The EPIC is approved** (by the human, 2026-10-27). It was drafted
on `main` from the human's details and two narrow mockups
(Build/Hint/Preview and play) of 2026-10-27, which it records in "The
human's details". No story is drafted or approved yet.

Findings from the code that shaped the draft:

- The builder's grid shrinks from about 1290px because its column is
  capped at `lg:max-w-[45%]` (`src/components/grid/PuzzleGridEditor.tsx`).
- Both grids also shrink with the window's height (`100vh` minus 300px
  in the builder, 370px in play); the human chose to drop that.
- Playwright's default viewport is 1280×720, under play's 1290px
  threshold; the human approved moving it to 1440px wide in S1's freeze
  commit.

The human answered all ten of the first draft's questions on 2026-10-27
(recorded in the EPIC's Decisions).

**Amended 2026-10-27** with the human's wide-layout details, before any
story was drafted: the main area capped at 1800px and centered under the
full-width masthead, a 32px gap between the grid and the hints, and hint
columns without max widths, in the builder and play. S2 became "Wide
layout" and carries them.

## Verification

Documentation only; no checks run.

## Next action

Draft S1 (560px grid) per its EPIC section, with proposed acceptance, on
`main`, for the human's approval. The epic's approval doesn't approve any
story; nothing is frozen or implemented until S1 is approved.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/EPIC.md. Draft S1's specification (EPIC.md's "S1 — 560px grid") with proposed acceptance on main, for the human's approval; don't freeze or implement it.
