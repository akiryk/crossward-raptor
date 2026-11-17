# Story S13 — A quieter, simpler Prominent Hint

Use a faint fill for the empty blue hint area above the play grid, and show
only the selected hint text when populated, without a prefix such as “9A”.

**Status: closed; delivered on main in `750289f` (2026-11-16).**
The human explicitly authorized implementation on 2026-11-16. Combined
verification and delivery evidence are in [resumption evidence](../acceptance/S12-S13-RESUMPTION.md).
Harness corrections are approved/refrozen in `65c92af`. The human-run full
browser gate passed all 1,460 tests; final verify passed all 1,311 tests.
Main delivery and [independent epic closeout](../CLOSEOUT-S12-S13.md) are complete;
see the [handoff](../HANDOFF.md).
The human's response, “I approve S12 and S13”, approves this specification,
the eight-case executable acceptance and the exact supersession patch in the
[approval packet](../acceptance/README.md). The patch is applied after S12 in
this story's separate specification-only freeze commit on `main`. Independent
specification review is recorded in [evidence](../acceptance/EVIDENCE.md).
Product details labelled “proposed” below are now approved as written.

## Current behavior

`ProminentHint.tsx` is the wide player's bar above the grid. It always uses
`play-cell-selected-row` (blue-medium), including when focus leaves the grid
and the bar is empty. It renders a separate number/direction label in
`title-4` and the hint in `title-3` when `label` is non-null. The caller in
`PlayPuzzle.tsx` derives selection from the focused grid's active slot.
`GridExamples.tsx` also renders this component in the style guide.

Narrow play uses `PlayHintBar.tsx` below the grid, already without a standalone
number label. The builder's narrow `HintBox.tsx` edits a hint and is a different
component. Builder Preview Hints deliberately has no Prominent Hint (S9).

## Decisions

- **Human request:** when nothing is selected and the Prominent Hint contains
  no hint, use the existing palette's **interactive-faint**, `#F1F8FC`.
- **Proposed empty-state detail:** use the faint fill whenever this component
  displays no non-whitespace hint text, including a selected entry with a blank
  hint. A hint becoming empty must not leave an emphatic, empty blue panel.
  Do not trim or otherwise rewrite real hint text for display.
- Keep the current blue-medium fill when displaying a hint. Express the faint
  state through a semantic color style, proposed `prominent-hint-empty`, mapped
  to `--palette-interactive-faint`. Components consume color styles rather than
  palette variables or literal colors. Document it in the style-guide catalog. Keep the populated `sg-grid-play`
  sample and add an empty example under `sg-prominent-hint-empty`; both
  render the same Prominent Hint component.
- **Human request:** remove the standalone number and direction, e.g. “9A” or
  “12D”, from the Prominent Hint. The hint text starts at the existing left
  padding, without a blank label column, spacer or replacement badge.
- Keep numbering in the grid, Across/Down lists and editable hint labels.
  Preserve the full authored hint text, including numbers or references within
  it, e.g. “With 1-Down, …” and “See 12-Down”. Epic 26's linked-word/row
  behavior and plain hint-text rendering remain intact.
- Preserve focus/selection rules, initial selected word and keyboard behavior.
  Keep the bar's width, 10px corners, 12px vertical / 16px horizontal padding,
  52px minimum height, `title-3` primary text and 16px gap above the grid.
  It stays present when empty so selecting or deselecting a short hint does
  not move the grid. Long hints continue to wrap and expand the bar as needed.

## Non-goals / scope

Wide play's Prominent Hint and its style-guide samples only. Narrow play's
bar below the grid, builder hint inputs, Preview Hints, grid numbering,
selection colors and selected hint-list rows retain their current behavior.
No engine, hint parsing, persistence, database or linked-clue behavior changes.
S12 owns the title/status-row spacing changes.

## Frozen acceptance

Frozen executable acceptance: [`e2e/prominent-hint-polish.spec.ts`](../../../../e2e/prominent-hint-polish.spec.ts),
covering the approved acceptance:

1. **17-S13-1:** At 1440px, opening unfinished play shows the opening word's
   full hint alone, in `title-3` primary on the existing blue-medium fill.
   There is no separate number/direction label or gap reserved for it.
   Across and Down selections update the text correctly; grid/list numbers
   remain visible and accurate.
2. **17-S13-2:** Move focus away so selection clears: hint text disappears,
   the background resolves to `#F1F8FC`, and the 52px short/empty bar height,
   width, padding, corners, 16px grid gap and grid position stay stable.
   Refocus/select a word and confirm the full hint and blue-medium return.
3. **17-S13-3:** A selected slot with empty or whitespace-only hint text uses
   the faint fill; actual hint text is displayed verbatim. A long hint wraps
   without truncation or overlap, using the width released by the old label.
4. **17-S13-4:** Display hints containing numeric text and With/See references:
   preserve their complete text. Existing linked grid highlights and clue-list
   row fills still work, and clue-list numbering remains. At 390px retain the
   existing narrow hint bar and navigation; no extra number is introduced.
5. **17-S13-5:** The style guide shows populated (hint only) and empty/faint
   Prominent Hint examples. `prominent-hint-empty` appears in the semantic color
   catalog, maps to `interactive-faint`, and follows a live palette change.
   Existing grid selection, narrow hint-bar and list-row colors remain intact.

### Approved frozen-acceptance supersessions

The approved exact
[`17-S13-supersession.patch`](../acceptance/17-S13-supersession.patch)
is based on the S12-amended baseline. The
[case inventory](../acceptance/CASES.md#s13) names every case. Applied in S13's specification-only freeze commit, after S12.

- `e2e/play-design.spec.ts`, **14-S7-2**, all four cases: replace the standalone
  prefixes with exact full hint text; replace label typography/shared baseline
  with absent label and 16px left-padding coverage; require faint fill on blur.
  Keep frame geometry, populated blue, hint type and cursor-following.
- Same file, **14-S7-3**, both editable hint-click cases: replace the “3A”,
  “2D” and “1A” prefix assertions with their complete selected hints. Retain
  selection, first-empty/full-word cursor, typing and all list-number tests.
- Same file, **14-S7-5**, style-guide case: replace nonempty label with hint-only
  text matching the selected row and an empty/faint sample. Preserve grid colors
  and selected-row checks. Retire unused baseline helper and stale header copy.
- `e2e/play-opening.spec.ts`, **17-S2-1**, five wide opening/resume/Down/full/
  toggle cases: replace only prefix-plus-hint assertions with exact full hint.
  Narrow opening cases are unchanged. **17-S2-2**, typography case: replace
  label baseline with absent label/full text/16px left padding; keep text font,
  weight, primary color and 52px height; retire the unused baseline helper.
- `e2e/completed-play.spec.ts`, **19-S1-3** confirming reset (corrected from
  the outline's S1-2): expect “Feline” alone; keep all S12 compact-state,
  reset/session, focus and cursor assertions.
- Additional sweep result: `e2e/real-words.spec.ts`, **17-S6-7** and **17-S6-8**:
  expect “Retiring” and “Sky color” alone. All direction/ignored-key assertions
  remain unchanged.
- `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`: add exactly
  `prominent-hint-empty: interactive-faint` to their `STYLES` maps. This extends
  the strict whitelist/mapping and live palette/catalog cases; it retires no
  existing palette, style, assertion or timeout.
- Keep `e2e/linked-clues.spec.ts`, `linked-entry.spec.ts`, `linked-hints.spec.ts`,
  narrow hint-bar, Preview Hints, rebus and grid/layout assertions unchanged.
  There are **16 directly amended cases plus five map-driven cases**. No
  other prefix or empty-fill supersession was found.

## Repo paths

- `src/components/play/ProminentHint.tsx`
- `src/components/play/PlayPuzzle.tsx` (adapt props/selection signal as needed)
- `src/components/style-guide/GridExamples.tsx`
- `src/components/style-guide/ColorSwatches.tsx`
- `src/app/globals.css`
- `src/app/globals-css.test.ts`, `e2e/color-tokens.spec.ts` (add semantic mapping)
- Frozen `e2e/prominent-hint-polish.spec.ts`
- `e2e/play-design.spec.ts`, `e2e/play-opening.spec.ts`,
  `e2e/completed-play.spec.ts`, `e2e/real-words.spec.ts` (approved amendments above)
- This story, `../EPIC.md`, `../HANDOFF.md`, epic index, `../acceptance/`

No declared runtime path is a CODE-REVIEW risk path; inspect actual changed
paths before delivery. Expand acceptance paths only with a recorded reason.

## Definition of Done

- Prepare executable acceptance and exact supersessions, obtain human approval,
  and freeze a separate specification/acceptance baseline under
  [STORY](../../../process/STORY.md) before runtime changes.
- Demonstrate current code fails new empty-fill and hint-only acceptance.
- Implement the approved scope, preserving all other frozen acceptance. Run
  `npm run verify` and the full `npm run test:e2e` under DEVELOPMENT's guarded
  test-environment rules, serializing browser runs sharing the database.
- Inspect wide play in selected, unselected and long-hint states; inspect the
  style guide and narrow play for regressions. Record actual visual checks.
- Meet applicable delivery gates and record results in the handoff. An epic
  closeout requires the separate independent audit required by the epic index;
  historical closeout does not cover these new follow-ups.
