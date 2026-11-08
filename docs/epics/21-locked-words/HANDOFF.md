# Locked words — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [EPIC](EPIC.md) and the stories in scope for the next action.

**Only if needed:** [HISTORY](HISTORY.md) (the handoff as of 3d6952a:
S1–S11 delivery, verification, open items, audit notes).

## Current state (2026-11-07, S14–S16 frozen, implementing)

S1–S13 are done and on `main`, with the human's visual check of S12 and
S13. S13's B1 fix is `19e0dee`, independently re-reviewed with no
blockers.

S14–S16 come from the human's review after S12–S13 (EPIC "Changes from
the human's review after S12–S13 (2026-11-07)"). **The human approved
them, delegated details included (2026-11-07)**, and they are frozen on
`main` in a specification-only commit (the stories, EPIC, this handoff,
2 new tests and 15 amended specs):

- [S14](stories/21-S14-word-highlight-only.md): only the cursor's word
  is highlighted; with no word, only the line's off cells are dull blue.
- [S15](stories/21-S15-tick-hover-outline.md): the tick hover outlines
  each word in black instead of darkening it.
- [S16](stories/21-S16-three-second-wait.md): the button beside an
  unlocked word waits 3 seconds.

The scratch runtime (reverted) is `../crossward-raptor-s14-s16-scratch.patch`.
No independent specification review was done; it isn't required.

Non-blocking notes from S12/S13's reviews, for the closeout audit:
- No test pins B1 (frozen acceptance couldn't grow in S13).
- `wordHoldsCell` could simply export `holds`.
- After a click on the tick's button, back on the same end cell, a turn
  no longer picks again (untested).

Not started: the closeout audit (S7–S16 unaudited). Leftovers: branch
`story/21-S2-lock-a-word` (local and remote), stale
`../crossward-raptor-s6-draft/`, scratch patches
`../crossward-raptor-s12*-scratch*.patch`.

## Next action

1. Apply the scratch patch, tidy its comments, and run `npm run verify`
   and the full `npm run test:e2e`. Rerun the 6 unrelated failures from
   the scratch run alone.
2. Push. The human then checks S14–S16 visually.
3. Then the independent, report-only closeout audit of S7–S16. Close the
   epic only with the human's agreement.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md and the S14, S15 and S16 stories in docs/epics/21-locked-words/stories/, then implement the frozen S14–S16 on `main` per the handoff's next action.
