# Story S9 — First hint numbers fixed

In the builder's hints phase, toggling Preview Hints moves neither
column's first hint number: its left, top, size and color stay
identical. The rows after it may move, since the two lists' row heights
differ.

**Status: done** (2026-11-02; implemented `6db5d86`). Found by the human during S5–S8
verification: "the number in the first row of both Across and Down
columns … should not move at all. … Size doesn't change, color doesn't
change, x-value doesn't change, y-value doesn't change." Not covered by
the S5–S8 delegation; the human approved this specification, its
acceptance and its delegated decisions directly ("I approve S9").

**Blast radius: tiny.** One class on `PlayerHints.tsx`'s list, only
under the builder's existing `stacksWhenNarrow` option, and one new spec
file. No frozen test changes. Play and the style guide don't pass the
option and are unchanged.

**CODE-REVIEW risk classification:** no risk path. Delivered directly on
`main`.

## What the code does today

- **Editing** (`HintsPanel`): the first row is `items-baseline`, so the
  number sits on the Hint Input's first text line, below the input's 4px
  top padding (`TextInput`'s `py-1`). 14-S6 fixes the row's place (the
  first line 45px below the label).
- **Preview** (`PlayerHints`): the list starts 11px below the label
  (`mt-[11px]`), the row pads 6px, and the number has no further offset.
- Measured on `main` (5×5, 1440px and 1280px): Preview's first numbers
  are 4px higher than the editing list's, in both columns. Left, size
  (14px), weight and color already match.

## Decisions

### The human's *(2026-11-02)*

- Neither column's first hint number moves when Preview Hints toggles:
  not left, top, size or color.
- **One column** (below a 1430px window): 18-S7 lets the Down label move
  there, so Down's first number keeps its place relative to the Down
  label. The Across label and its first number don't move.

### Delegated decisions *(drafting, approved by the human)*

- **Preview moves, not the editing list.** 14-S6 freezes the editing
  list's rows. Under `stacksWhenNarrow`, Preview's list starts 15px
  below the label instead of 11px. Its later rows move 4px down with it.
- The prop keeps its name. Its comment now says it also aligns the first
  numbers with the Hint Inputs'.

## Acceptance

*Approved and frozen.* One new file, `e2e/first-hint-fixed.spec.ts`, no frozen
file amended.

1. **18-S9-1** at 1440, 2400, 1430, 1429, 1280 and 1140px, a 5×5 and a
   15×15, with Preview Hints off, on and off again: each column's first number
   keeps its text's left and top, relative to the grid, within 0.5px.
   In one column, Down's top is checked relative to the Down label's
   text. The number's computed size, weight and color stay identical.
   12 tests.

**Discrimination (2026-11-02):** on `main`, all 12 fail on Across's top,
received 4px. With the throwaway fix above, S9's 12 tests,
`hint-preview-alignment` (18-S7) and `preview-hints` (17-S9) pass, 55
tests in all. The throwaway was then reverted.

## Repo paths

- `src/components/play/PlayerHints.tsx`
- `e2e/first-hint-fixed.spec.ts` (new)

## Definition of Done

Frozen acceptance passes unchanged; `npm run verify` exits 0; the full
`npm run test:e2e` exits 0; the human confirms on the dev server.
