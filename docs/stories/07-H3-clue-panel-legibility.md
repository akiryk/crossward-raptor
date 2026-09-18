# Story H3 — A clue panel you can actually write in

Third slice of the hints-authoring epic. `HintsPanel` renders every slot
in one flat list, in `extractSlots` order — all Across entries, then all
Down entries, with no break between them, no spacing inside a row, and
no indication of which word each clue belongs to. A builder scanning
thirty-five rows of bare numbers has to click each one and watch the
grid to find out what they're clueing, which stops working the moment
the list is long enough to scroll the grid out of view.

This story makes the panel legible: two columns under their own
subheads, each row showing its answer, and an input that looks like the
underline it was always meant to be.

Repo paths:
- `src/lib/slot-answer.ts` — new: `slotAnswer`
- `src/lib/slot-answer.test.ts` — new (**already provided — do not
  edit**)
- `src/components/ui/TextInput.tsx` — edited: optional `variant`
- `src/components/grid/HintsPanel.tsx` — edited: grouping, answers,
  spacing
- `src/components/grid/PuzzleGridEditor.tsx` — edited: passes `grid` to
  `HintsPanel`
- `e2e/hints-panel.spec.ts` — extended (**already provided — do not
  edit; P5-2's cases unchanged, H3-2's appended**)

## Required contract

```ts
// src/lib/slot-answer.ts (new)
import type { Grid } from '../engine/grid';
import type { NumberedSlot } from '../engine/numbering';

/**
 * The answer currently written in a slot, one character per cell in
 * reading order. An empty cell contributes '_', so the returned string
 * is always exactly as long as the slot.
 */
export function slotAnswer(grid: Grid, slot: NumberedSlot): string;
```

```tsx
// src/components/ui/TextInput.tsx (edited)
// gains: variant?: 'box' | 'underline'   // defaults to 'box'
```

`'box'` is exactly today's styling, unchanged. `'underline'` drops the
border, radius, focus ring and horizontal padding, keeping a single
bottom rule that strengthens to `--color-accent` on hover and focus,
matching the box variant's own affordance rule (D2).

```tsx
// src/components/grid/HintsPanel.tsx (edited)
// gains: grid: Grid
```

Renders two columns side by side, Across then Down, each under its own
subhead. Within a column, rows keep the order `slots` already provides.
Each row is: the slot number, the answer, then the input.

## Markup contract

- `data-testid="hint-column"` on each column, with
  `data-orientation="across"` or `"down"`.
- `data-testid="hint-column-heading"` on each subhead, reading "Across"
  or "Down".
- `data-testid="hint-row"`, `data-hint-key`, `data-complete` and
  `data-active` are unchanged.
- `data-testid="hint-label"` now renders the number alone — `"1"`, not
  `"1 Across"`. The column subhead carries the orientation.
- `data-testid="hint-answer"` on the answer text, new.
- `data-testid="hint-input"` unchanged, now rendered with
  `variant="underline"`.
- The input's `aria-label` keeps its full form (`"1 Across clue"`), since
  a screen reader reaching the input has no column heading in context.

## Decisions

**`variant` is an optional prop with a `'box'` default, not a second
component.** Same reasoning D4 used for `mode`: both variants share the
same input behavior, and a second component would let the two drift.
Optional-with-default also means every existing `TextInput` call site
renders exactly as it does today.

**The answer is derived, never stored.** `slotAnswer` reads the letters
out of the grid on every render, so it cannot desync from the puzzle.
This is the epic's "slots are derived, never stored" rule applied to
answer text.

**`'_'` for an empty cell.** After the transition every active cell
holds a letter — the conversion blackens the rest — so this case should
not arise in practice. But `slotAnswer` must be total, and a placeholder
that preserves length is more honest than silently returning a shorter
string that looks like a different word.

**The orientation moves from the row to the column heading.** Repeating
"Across" on every row of a column headed "Across" is noise, and it
pushes the answer — the thing the builder is actually scanning for —
further right.

**Grouping happens in the component, not in a new engine function.**
`NumberedSlot` already carries `orientation`; splitting one map into two
lists is presentation, and `requiredHints` already demonstrates the same
grouping in the engine for a different consumer.

**No new tokens.** The number uses `--color-ink-3`, which the token file
already describes as the color for cell numbers and eyebrows; the answer
uses `--color-foreground`. That contrast is what makes them distinct.

## Scope discipline

- No changes to `buildSlotLookup`, `activeHintKey`, `isHintFilled`, or
  anything in `src/engine/`.
- No changes to how hints are saved, debounced, or keyed.
- No changes to clue↔grid highlighting behavior — `data-active` and
  `onHintFocus` work as they do today.
- No responsive or mobile work. Two columns side by side, desktop only;
  how they behave at narrow widths is out of scope.
- No grid appearance changes, no locking, no EDIT GRID mode.
- `TextInput` gains no styling options this story doesn't use.

## A caution about existing specs

Changing `hint-label` from `"1 Across"` to `"1"` may break an existing
spec that asserts on that text. If it does, **stop and report it** —
that spec is a committed specification and this story does not authorize
editing it. The fix is a conversation about which behavior is correct,
not a test edit.

## Acceptance examples

**H3-1 — `slotAnswer` (Vitest, `src/lib/slot-answer.test.ts`)**
- An across slot whose cells hold C, A, T → `'CAT'`.
- A down slot reads top-to-bottom, in the slot's own cell order.
- An empty cell contributes `'_'`, and the result's length always equals
  the slot's length.
- A fully empty slot of length 3 → `'___'`.
- A multi-character cell (a rebus) is passed through whole — the letter
  is opaque.
- The grid is not mutated.

**H3-2 — the panel (Playwright, `e2e/hints-panel.spec.ts`)**
- Exactly two `hint-column` elements, one `data-orientation="across"`
  and one `"down"`, headed "Across" and "Down".
- Every across slot's row is inside the across column, and every down
  slot's row inside the down column.
- A row's `hint-label` reads the number alone, with no orientation word.
- A row's `hint-answer` reads that slot's letters — including a down
  slot, which reads down the grid rather than across it.
- Typing in a clue input still records the text, and focusing a row
  still marks it `data-active`.

## Definition of done

1. `npx vitest run src/lib/slot-answer.test.ts` passes.
2. `e2e/hints-panel.spec.ts` passes: `npm run test:e2e`.
3. Every other spec passes unmodified. **Check this rather than assuming
   it** — see the caution above about `hint-label`.
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
