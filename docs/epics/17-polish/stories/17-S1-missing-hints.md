# Story S1 — Missing hints

When 3 Publish finds hints missing, it marks each one: the hint's row
turns pink, and its number, its answer word and its input line turn the
error red. A row returns to normal as soon as the builder types in it.

**Status: done** (2026-10-31). The human approved this specification,
its acceptance and the two amendments on 2026-10-31; frozen on `main` in
96a3cd6 (specification only) and delivered directly on `main`.

## Correction (2026-11-01) *(human; approved)*

The human's visual check during S9: the pink row is "too much red/pink
error highlighting". With their mockup (`Image #5`, 2026-11-01): **only
the input is filled `hint-missing`**, as a selected row's input is
filled `hint-cell-cursor`. The row's own background stays clear. The
number, the answer word and the input's 1px bottom line keep the
`error` color, and nothing else changes. A marked input stays pink when
its row is selected or focused, as the Hint Box's marked input does.
The Hint Box is unchanged (only its input was already filled).

It **supersedes** the opening paragraph's "the hint's row turns pink",
"The row's background is the new `hint-missing` color style" under "What
a mark looks like", and that section's "The cursor word's input fill … still
applies on a marked row, inside its pink": a marked input is pink,
whether or not its row is the cursor word's.

Acceptance amended in `e2e/missing-hints.spec.ts` in a
specification-only commit, together with S9's correction:

| Case | Frozen (96a3cd6) | Corrected |
| --- | --- | --- |
| `expectMarked` (17-S1-1 to 17-S1-3) | the row's background `PINK` | the row's background transparent, the input's `PINK` |
| `expectUnmarked` | the row's background transparent | also the input's background not `PINK` |
| 17-S1-4 style guide | the marked row `PINK` | the marked row transparent, its input `PINK`; the unmarked input not `PINK` |

Runtime: `HintsPanel.tsx` only (the style guide's sample uses it).

Discrimination (2026-11-01, observed): on 6c5427f the corrected file
failed 8 cases (every `expectMarked` caller and the style guide); with
the throwaway (`/tmp/s9/correction-throwaway.patch`, one `HintsPanel`
class change) all passed. See S9's correction for the full suite.

**Blast radius: small.** One new palette variable and color style, a
`TextInput` option, marks in `HintsPanel` and `HintBox`, one piece of
editor state and a style-guide sample. No schema, server action or engine
change, so no CODE-REVIEW risk path: direct delivery on `main`.

## What the code does today

Inspected `PuzzleGridEditor.tsx` (`handleStep`, `handleHintChange`, the
Hint Box and list), `HintsPanel.tsx`, `HintBox.tsx`, `TextInput.tsx`,
`TooEarlyDialog.tsx`, `src/engine/hints.ts`, `src/lib/hint-lookup.ts`,
`globals.css`, the style guide and its `ColorSwatches`, and the frozen
tests that name these.

- In the hints phase, 3 Publish runs `hintsComplete`. If any required
  hint is absent or only spaces, it opens "Not quite!" and marks nothing.
- Each hint row already has `data-hint-key` and `data-complete`
  (`isHintFilled`, the same "non-blank" rule). The number is `hint-label`
  (`title-4`, primary), the answer word `hint-answer` (`label`, muted,
  primary while its row has focus) and the input a wrapping `TextInput`
  (1px line, line-muted at rest, line-highlight on focus).
- `TextInput`'s `error` prop paints the line `error` but also prints a
  message under the field, which a hint row doesn't want.
- Below 1000px the Hint Box shows one word's hint: its word `hint-box-word`
  (muted), its input `hint-box-input` (filled `hint-box-input`, no line at
  rest, a line-highlight one on focus). The list stays in the page,
  hidden. Both edit the same `hints` state.
- The palette has no pink. `globals-css.test.ts` and
  `e2e/color-tokens.spec.ts` freeze the complete lists of palette
  variables and color styles.

## Decisions

### When rows are marked *(EPIC)*

- Clicking 3 Publish in the hints phase while required hints are blank
  opens "Not quite!" as today *(EPIC proposed, settled here)*, and marks
  **exactly** the blank hints at that moment: absent, empty or only
  spaces, by `isHintFilled`. The marks show with the dialog and stay after
  it closes, however it closes.
- With every hint written, 3 Publish opens the Publish dialog as today and
  nothing is marked.
- The build phase's 3 Publish ("Lol." and "Nope.") marks nothing; it has
  no hints. S8 removes that button.
- Marks live in the editor only. They aren't saved, so a reload shows
  none.

### What a mark looks like *(human)*

On a marked row (`data-missing="true"` on `hint-row`):

- the row's background is the new `hint-missing` color style, which
  references the new `pink` palette variable, #FFE4E2 *(human's "pink";
  the style's name is proposed)*;
- the hint number (`hint-label`), the answer word (`hint-answer`) and the
  input's 1px bottom line are `error`, focused or not, so focusing a
  marked row changes none of them;
- the input carries `aria-invalid="true"` *(proposed: the same signal
  `TextInput`'s `error` gives assistive tech)*, with no error message.

Marking moves nothing: every row, number, input and word keeps its box.
The cursor word's yellow input fill (14-S12) still applies on a marked
row, inside its pink.

### When a mark clears *(human)*

- A row's mark clears at the first change to its text: a typed
  character (a space counts), a deletion or a paste. Focusing, clicking or
  moving through the row doesn't clear it. Other rows keep their marks.
- A cleared hint that becomes blank again stays unmarked until the next
  Publish click *(EPIC proposed, settled here)*, which re-marks it with
  every other blank hint.

### The Hint Box *(EPIC proposed, settled here)*

The Hint Box and the list share the marks. While the box's word is
marked:

- the box has `data-missing="true"`;
- its input is filled `hint-missing` instead of `hint-box-input`, with a
  1px `error` bottom line at rest and on focus, and `aria-invalid="true"`;
- its word (`hint-box-word`) is `error`.

A change typed in the box clears that word's mark in the list too, and
the other way round. Stepping with the arrows shows each word's own mark.

### Style guide *(EPIC)*

A new `sg-hint-row-missing` section shows the hints panel with one
marked row and one written, unmarked row. The color catalog lists `pink`
and `hint-missing`.

### No other change

"Not quite!"'s words, the Publish dialog, saving, the build phase and
play are unchanged. Nothing scrolls to the first missing hint. The engine
is untouched; the blank rule is `isHintFilled` over `buildSlotLookup`'s
keys, outside `src/engine/**`.

## Acceptance

*Frozen 2026-10-31.* One new file and two amendments.

### e2e/missing-hints.spec.ts

A seeded 3×3 word square (CAT / ARE / TEA) in the hints phase, with 4
Across absent, 1 Down empty and 2 Down only spaces; 1 and 5 Across and 3
Down written. At 1280×900 unless named. Colors are the tokens' resolved
values.

1. **17-S1-1 Publish marks the blank hints**
   - No row is marked before Publish. After it, with "Not quite!" open,
     exactly the three blank rows are marked; after OK they are pink,
     with the number, word and line in `error` and `aria-invalid`; the
     written rows are as before (transparent, primary number, muted word,
     line-muted line). The puzzle isn't published.
   - Marking moves no row, number, input or word (boxes to 0.1px).
   - Focusing a marked input keeps every mark.
2. **17-S1-2 a row clears at its first change**
   - Typing one letter clears that row (transparent, primary number, no
     `aria-invalid`); the other two stay marked.
   - Deleting one space from the spaces-only hint clears its mark.
   - A hint typed in and emptied again stays unmarked; the next Publish
     marks exactly the blank hints (1 and 2 Down, not the now-written 4
     Across).
   - With every hint written, Publish opens the Publish dialog and marks
     nothing *(guard; passes today)*.
   - A reload shows no marks.
3. **17-S1-3 the Hint Box**, at 768px
   - The box on a written word (1 Across) is unmarked and blue. Next to 4
     Across: marked, pink, a 1px `error` line while focused,
     `aria-invalid`, the word `error`. Typing one letter clears it back to
     blue and muted, and the hidden list's marks are then 1 and 2 Down.
   - A mark cleared in the list at 1280px is cleared in the box at 768px,
     while 1 Down is still marked there.
4. **17-S1-4 style guide**: `sg-hint-row-missing` shows one marked row
   (pink, `error` number, word and line) and an unmarked one.

### Retired and amended acceptance

Each amendment is retired in the specification-only freeze commit.
Every other frozen test is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `src/app/globals-css.test.ts` | F1 `VARIABLES`, `STYLES` | the complete lists, without pink | add the `pink` variable (#FFE4E2) and the `hint-missing` style referencing it |
| `e2e/color-tokens.spec.ts` | F1 `VARIABLES`, `STYLES` | the same lists | the same two additions |

These lists are complete by design ("no @theme colors besides …" and the
catalog's counts), so any new color amends them. S5 amends the same lists
again.

### Acceptance choices *(drafting)*

- The seed covers all three kinds of blank: absent, empty and spaces.
- Marks are found by `data-missing`, and colors are checked on the
  elements the human named. The checks are structural (attribute,
  computed color, box), not class names.
- The throwaway's sample used the hints panel; the test only needs the
  section and the two rows, so the sample's grid is the implementer's.
- Not covered: the build phase's dialogs (S8) and scrolling to a missing
  hint (out of scope).

### Discrimination (2026-10-31, observed)

- **Throwaway implementation** of the Decisions, then reverted (patch kept
  outside the repo). With the proposed tests: Vitest 620 of 620;
  `missing-hints`, `color-tokens`, `style-guide`, `hint-box`,
  `hint-phase-design`, `builder-controls`, `inputs` and `hints-panel`
  121 of 121 (including the setup project).
- **Current `main` with the proposed tests:** Vitest 2 failed (the two
  amended list cases). Browser: 11 of 12 `missing-hints` cases failed
  (all but the guard), and the 5 `color-tokens` cases that read the
  lists.
- **Two mutations on the throwaway,** each caught: clearing only when the
  text becomes non-blank (fails the spaces case), and not passing the
  mark to the Hint Box (fails both 17-S1-3 cases).
- One weakness found and fixed while drafting: the spaces case first
  passed on `main` because it never checked the row was marked; it now
  does, and fails there.
- `tsc` and ESLint pass on the proposed tests. `npm run verify` fails
  until implementation, by design. The full `npm run test:e2e` was not
  run while drafting.

## Repo paths

Acceptance (immutable after freeze): `e2e/missing-hints.spec.ts` and
the two amendments above.

Runtime:

- `src/app/globals.css`: `--palette-pink`, `--color-hint-missing`.
- `src/components/ui/TextInput.tsx`: an option for the error line and
  `aria-invalid` without a message.
- `src/components/grid/HintsPanel.tsx`: the row's marks.
- `src/components/grid/HintBox.tsx`: the box's marks.
- `src/components/grid/PuzzleGridEditor.tsx`: the marked set, set on
  Publish and cleared per hint on change.
- `src/components/style-guide/ColorSwatches.tsx`,
  `src/components/style-guide/GridExamples.tsx`,
  `src/app/style-guide/page.tsx`: the swatches and the sample.
- This story, `../EPIC.md` and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S1. Out of scope: play (S2, S3), Preview selection (S4), selection
colors (S5), the step controls and the build phase's dialogs (S8),
scrolling to a missing hint, and any change to "Not quite!"'s words.

## Definition of done

- The human approves this specification, its acceptance and the
  amendments, recorded here and in the handoff. Freeze on `main` in a
  specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.
