# Locked words — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md), then the active story.

## Current state (2026-11-06)

The EPIC's decisions came from an interview with the human 2026-11-06.
**The human approved the EPIC 2026-11-06.**

- [S1 The word highlight](stories/21-S1-word-highlight.md): **done**,
  delivered on `main` (frozen at 69407b0). Its `buildWord`
  (`src/lib/build-word.ts`) is the run S2 and S3 reuse.
- [S2 Lock and unlock a word](stories/21-S2-lock-a-word.md): drafted;
  risk path (branch + PR). One pending question for the human: the
  button's size on a mini.
- [S3 Locked cells hold](stories/21-S3-locked-cells-hold.md): drafted.
- [S4 The lock button's tooltip](stories/21-S4-lock-tooltip.md): drafted.
- [S5 Lock Word in the toggle row](stories/21-S5-toggle-row-lock.md):
  drafted.
- [S6 Reset Grid with locked words](stories/21-S6-reset-with-locks.md):
  drafted.

Epic 20 is closed (ba55af6). Epic 18's 18-S5-5 intermittent can fail a
full browser run; it's a recorded open item, unrelated to this epic.

## Next action

Draft S2's acceptance tests, show they fail on `main`, and obtain the
human's approval to freeze S2, including its pending question: the
button's size on a mini (STORY). S2 is on a risk path: branch + PR.

## Resume prompt

> Continue epic 21 (locked words) per
> docs/epics/21-locked-words/HANDOFF.md: do its Next action.
