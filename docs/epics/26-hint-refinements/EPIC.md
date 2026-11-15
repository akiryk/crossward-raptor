# Epic: Hint refinements

**Closed 2026-11-15.** S1–S3 passed automated verification and independent
closeout audit. The human reported no visual issues and authorized merge and
push; merged to main at `b227512`. See [CLOSEOUT](CLOSEOUT.md).

**Approved 2026-11-14.** Written from the human's request for recognized
linked clues. The human then relaxed case (any case counts) and the comma (not
required), and approved the drafting decisions. Each story's specification and
acceptance are approved and frozen on their own
([STORY](../../process/STORY.md)).

## The human's request

Updated by the human's visual review (2026-11-15), implemented in S3:

1. Recognize `With <number>-Across/Down` and `See <number>-Across/Down`,
   case-insensitively, using S1's otherwise unchanged strict validated form.
   Explicit reciprocal clues work by selecting either entry.
2. The hint text is the source of truth; one pure parser, no stored metadata
   or rewriting. Hints remain native fields.
3. In hints and play, the current clue's referenced entry has pale blue cells,
   with current word/cursor precedence, focus gating and live updates from S2.
4. During play, highlight the full referenced clue row in that same pale blue
   (`interactive-faint-hover`), alongside the current clue's stronger blue.
5. Do not decorate the word With or See. This explicitly replaces the original
   S1 word-highlight request everywhere, including builder fields and displays.
6. No navigation, tooltip or automatic cursor movement.

The original S1 decision record remains historical; S3 governs its superseded
syntax and text-decoration behavior. S2's existing scope is preserved.

## Stories

1. [26-S1 Recognized linked clues](stories/26-S1-linked-clues.md): the
   original helper and word decoration (decoration superseded by S3).
2. [26-S2 The linked entry in the grid](stories/26-S2-linked-entry.md):
   the referenced entry's cells while its linked clue is current.
3. [26-S3 Linked hints after visual review](stories/26-S3-linked-hints.md):
   See recognition, full referenced play-row fill, no individual word highlight.

S2 and S3 use S1's shared helper.

## Delivery

No story touches a CODE-REVIEW risk path (the helper lives in
`src/lib`, not `src/engine`). The stories are delivered on an epic branch,
`epic/26-hint-refinements`, so the human can test the whole epic before
it reaches `main`:

- Each story's specification and acceptance are frozen on `main`, then
  merged into the epic branch.
- An orchestrator runs the stories in order with subagents, per
  [ORCHESTRATION](../../process/ORCHESTRATION.md). Each story runs
  `npm run verify` and its own and directly affected E2E specs.
- After the last story come one full `npm run test:e2e` on the epic
  branch, the closeout audit, and then the human's visual check. Only
  then does the epic branch merge to `main`.

## Non-goals

- A linked-clue field, relationship table or any stored metadata.
- A rich-text hint editor, or rewriting hint text.
- Loose or alternate syntax, multiple references (`With 22- and
  28-Across`), bare `28A`.
- Navigating to, clicking or previewing the referenced entry
  (hovercards, tooltips).
- Changes to numbering, hint persistence, the build phase's sister word or
  the build-phase Preview.
