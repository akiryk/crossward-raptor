# Story H5 — Clue row layout, and the hints-phase style guide sample

Two independent pieces of tidying left over from H3 and H4. They share a
story because each is too small to be worth its own, but they touch
different files and neither depends on the other — if one turns out
wrong, it can be reverted without the other.

**Part A — the clue input doesn't fill its column.** `TextInput` renders
a bare `<input>` with no width rule, so it sits at the browser's default
intrinsic width (roughly 20 characters) and leaves most of the column
empty. The answers are also inline in the flex row, so every row's input
starts at a different x depending on how long its answer is.

**Part B — the style guide doesn't know about hints phase.** H4 added
`--color-locked-letter` and `--color-editable-letter` to `globals.css`,
but `TokenPane`'s `COLOR_TOKENS` list is hand-maintained, so neither
token gets a picker, and `GridExamples` has no sample showing the states
they colour.

Repo paths:
- `src/components/grid/HintsPanel.tsx` — edited: fixed-width answer
  area, growing input
- `src/components/ui/TextInput.tsx` — edited: the `underline` variant
  fills its container
- `src/components/style-guide/TokenPane.tsx` — edited: two tokens added
  to `COLOR_TOKENS`
- `src/components/style-guide/GridExamples.tsx` — edited: two new
  sample sections
- `e2e/hints-layout.spec.ts` — new (**already provided — do not edit**)
- `e2e/style-guide.spec.ts` — extended (**already provided — do not
  edit**; every existing case unchanged, H5's appended and three arrays
  widened)

---

## Part A — clue row layout

### Required contract

Each hint row keeps its three children, but their widths change:

- The number is a fixed-width, right-aligned span, so multi-digit
  numbers align on their last digit.
- The answer is a fixed-width, left-aligned span. Its width is derived
  from the longest answer in the puzzle, so the column is exactly as wide
  as it needs to be.
- The input grows to fill whatever remains, and its left edge therefore
  sits at the same x in every row.

```tsx
// src/components/ui/TextInput.tsx (edited)
// the 'underline' variant gains a full-width rule; 'box' is unchanged
```

`TextInput` gains no new props. The input fills its container, and
`HintsPanel` wraps it in a flex child that claims the remaining space —
that wrapper needs `min-w-0` as well as `flex-1`, because a flex item
will not shrink below its content's intrinsic width without it, which is
the specific reason the input is stuck at its default size today.

### Decisions

**The answer width is derived from the longest answer, not a fixed
measurement.** A puzzle of short answers shouldn't reserve space for
long ones. `HintsPanel` already receives the grid, so it can measure
every slot's answer with `slotAnswer` and size the column once.

**Both columns use the same width, measured across every slot in the
puzzle.** Across and Down usually have different longest answers, so
sizing each column independently would leave the two halves visibly
mismatched. Symmetry costs some space in whichever column has the
shorter longest answer — on a puzzle whose longest Across is seven
letters and longest Down is five, the Down column reserves seven
letters' worth. That is the deliberate trade, not a bug.

**Fall back to the stacked layout if this reads badly.** A single long
entry sets the width for every row, so a 15-letter answer in a 15x15
pushes every input right, including rows whose answer is three letters.
If that looks wrong in practice, the alternative already discussed is to
put the number and answer on one line with the input on its own line
beneath, full width. That is a small change from where this lands, and
is explicitly out of scope here.

### Acceptance examples

**H5-1 — row layout (Playwright, `e2e/hints-layout.spec.ts`)**
- Within a column, every clue input's left edge is at the same x.
- Across the two columns, each input's offset from its own column's left
  edge is the same — the two halves are symmetrical.
- Every answer's left edge is at the same offset within its column.
- Each input's right edge reaches its column's right edge, so no space
  is left unclaimed.
- This holds on a puzzle whose answers differ in length.

---

## Part B — the style-guide hints samples

### Required contract

`TokenPane`'s `COLOR_TOKENS` gains `--color-locked-letter` and
`--color-editable-letter`, placed beside the other grid tokens so the
list keeps mirroring `globals.css`'s order.

`GridExamples` gains two sections, following the existing
one-section-per-state pattern:

- `data-testid="sg-grid-hints"` — the grid as a builder sees it while
  writing clues: `isHintsPhase`, no highlights.
- `data-testid="sg-grid-hints-editing"` — the same grid in EDIT GRID
  mode: `isHintsPhase` and `isEditingGrid`, with cursor highlights.

Both render the existing 10x10 fixture passed through
`convertEmptyCellsToBlack`, so they show what a real hints-phase puzzle
looks like — every unfilled cell black — rather than the unconverted
build fixture.

### Decisions

**The samples show a converted grid.** A hints-phase puzzle has no empty
cells; showing one would document a state that cannot occur. Converting
the existing fixture keeps the three grid samples recognisably the same
puzzle while showing each phase honestly.

**The editing sample needs a different cursor from the build sample.**
`GridExamples`' cursor sits at (3,5), which is empty and therefore black
after conversion — a cursor on a black cell produces no highlight at
all. The editing sample puts the cursor at (3,1) instead, inside the
four-cell down slot at column 3, so the sample shows `selected`,
`slot-letter`, `editable-letter` and `black` together. The build and
preview samples keep their existing cursor unchanged.

**Two sections, not one.** `sg-grid-build` and `sg-grid-preview` are
already one section per state, and `GRID_SAMPLES` in the spec drives a
per-sample geometry test off that shape.

### Acceptance examples

**H5-2 — style guide (Playwright, `e2e/style-guide.spec.ts`)**
- A colour picker renders for each of the two new tokens, and both
  resolve — covered by the existing D8-1 and D8-2 tests once the tokens
  join `COLOR_TOKENS`.
- Both new sections render — covered by the existing D8-1 sections test.
- The hints sample shows `black` and `locked-letter` cells.
- The editing sample shows `black`, `editable-letter`, `selected` and
  `slot-letter` cells.
- Both new samples pass the existing measured-geometry test.

---

## Scope discipline

- No changes to `src/engine/`, `slotAnswer`, `cellAppearance`, or
  `PuzzleGrid`.
- No changes to clue↔grid highlighting, saving, or keyboard behavior.
- No changes to the build or preview samples, including their cursor.
- `TextInput` gains no new props, and the `box` variant is untouched.
- No responsive work. The two-column layout is still desktop-only, and
  how it behaves at narrow widths remains out of scope.
- No stacked-row fallback — see Part A's decisions.

## Definition of done

1. `e2e/hints-layout.spec.ts` and `e2e/style-guide.spec.ts` pass:
   `npm run test:e2e`.
2. Every other spec passes unmodified. **Check this rather than assuming
   it** — `hints-panel.spec.ts` asserts on `hint-label`, `hint-answer`
   and `hint-input`, all of which move in Part A, though none of its
   assertions are positional.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
