# Story D8 — Live token editing

Restructures `/style-guide` so design decisions can be made by eye instead
of by guessing hex values in a document. The left pane pins tabbed token
controls; the right pane scrolls through every component. Changing a colour
updates everything using that token, live.

This replaces the devtools workflow, which doesn't actually work for this:
editing a swatch in devtools rewrites that rule's declaration, replacing the
`var()` reference with a literal — so one class changes and the token
doesn't. Editing the token itself means finding the `:root` rule under
`<html>`, which is buried and easy to get wrong.

Repo paths:
- `src/app/style-guide/page.tsx` — edited: two-pane structure
- `src/components/style-guide/TokenPane.tsx` — new: tabs and controls
- `src/components/style-guide/ColorPicker.tsx` — new
- `src/components/style-guide/GridExamples.tsx` — new: real grids
- `src/components/style-guide/TokenPanel.tsx` — removed or folded into
  `TokenPane`; the flat list is superseded
- `src/app/globals.css` — edited: register `--color-slot` in `@theme`
- `e2e/style-guide.spec.ts` — **rewritten** (**already provided — do not
  edit**)

## Decisions

**Controls write to `document.documentElement.style`.** Setting a custom
property there overrides the `@theme` value for the whole document, so
every element referencing that token updates at once. That's exactly the
thing devtools can't do conveniently.

**Committed values on every load.** No persistence. You always start from
what's actually in the repo, so there's no risk of judging a palette that
only exists in your browser. The workflow is: adjust, decide, tell me the
token and value, I put it in `@theme`.

**Three tabs: Colors, Fonts, Utility.** Only Colors has controls in this
story. Fonts and Utility render with a line saying what's coming — D9 adds
type controls, D10 adds radii, line width, and font loading. Rendering all
three now means the tab structure is real and testable rather than
retrofitted.

**The left pane is pinned; the right pane scrolls.** With ~50 example
elements you need the controls to still be there when you're looking at the
last one. Tabs keep any single pane short enough to stay put.

**Example grids render the real `PuzzleGrid`.** D1 used static markup
deliberately, so the style guide wouldn't be blocked on D3 building the
component. D3 shipped; that constraint is gone, and static markup can now
only drift from what the app actually renders. The build sample builds a
real `Grid` with `createGrid` and `withLetter`, passes a highlights map,
and renders `PuzzleGrid`; the preview sample renders the same grid with
`mode="preview"`.

**Grids are 10×10.** Big enough to show several states at once and to
judge proportion; small enough not to dominate the pane.

**`--color-slot` gets registered.** It exists in the code and the
screenshot but was never declared in `@theme`'s documented set or asserted
by the spec — it was added during D3 without being registered, so the token
panel never listed it. This story fixes that.

## Markup contract

- `data-testid="token-pane"` — the pinned left pane.
- `data-testid="token-tab"` with `data-tab-id="colors" | "fonts" |
  "utility"` and `data-selected="true" | "false"`. Colors is selected on
  load.
- `data-testid="token-tab-panel"` with the matching `data-tab-id`. Only the
  selected tab's panel is rendered.
- `data-testid="color-picker"` with `data-token-name` — a wrapper holding
  an `<input type="color">` (`data-testid="color-input"`) and the token
  name as visible text.
- `data-testid="examples-pane"` — the scrolling right pane.
- Every existing section test id is preserved: `sg-text`, `sg-buttons`,
  `sg-hover`, `sg-inputs`, `sg-links`, `sg-hint-rows`, `sg-confirmation`,
  `sg-error`, `sg-tooltip`, `sg-stepper`, `sg-grid-build`,
  `sg-grid-preview`.
- `token-panel` is **gone**, replaced by `token-pane`.

Inside the grid samples the real component's test ids now apply —
`puzzle-grid`, `grid-cell`, `cell-number`, `data-cell-state`, `data-coord`
— rather than the former `sg-grid` / `sg-cell` / `sg-cell-number`.

## The build sample's fixture

Concrete enough to judge, specified loosely enough not to over-constrain:

- 10×10.
- At least two words' worth of letters, including a run that crosses
  another.
- Exactly one cell in the `selected` state.
- An active slot through the selected cell containing **both** lettered and
  empty cells, so `slot` styling can be judged against both.
- At least one plain `empty` cell outside that slot.
- At least one `symmetric-hint` cell.
- At least one numbered cell.

The preview sample uses the same grid with `mode="preview"`, so it shows
black, lettered, and `required` cells.

## Scope discipline

- **No type scale.** D9.
- **No radius, line-width, or font-loading controls.** D10.
- **No persistence of edited values.**
- **No changes to any app route or component outside `src/components/style-guide/`**,
  except registering `--color-slot`.
- **No new colour tokens** beyond registering the one that already exists.
- **No engine changes.**

## Acceptance examples

**D8-1 — structure (Playwright)**
- `token-pane` and `examples-pane` both render.
- Three `token-tab` elements; `colors` reports `data-selected="true"`, the
  others `"false"`.
- Only the colors panel is rendered initially.
- Clicking the Fonts tab selects it and renders its panel with visible
  placeholder text; the colors panel is gone.
- Every preserved section test id still renders.

**D8-2 — colour pickers (Playwright)**
- A `color-picker` renders for every colour token, each showing its token
  name.
- Each picker's initial value equals that token's committed value
  (case-insensitive hex comparison).
- Changing `--color-grid-empty` changes the rendered background of an
  `empty` cell in the build sample to the new value.
- Changing `--color-selected` changes the `selected` cell's background.
- Changing `--color-grid-line` changes the grid container's background.
- Changes affect *every* element using the token, not one: after changing
  `--color-grid-empty`, two different empty cells both report the new
  value.
- Reloading restores the committed value in both the picker and the cells.

**D8-3 — real grids (Playwright)**
- The build sample contains exactly 100 `grid-cell` elements.
- It contains at least one cell in each of `empty`, `letter`, `selected`,
  `slot`, and `symmetric-hint`, and at least one `cell-number`.
- The active slot contains both a lettered cell and an empty cell.
- The preview sample contains at least one `black`, one `letter`, and one
  `required` cell.
- Geometry still holds in both samples, measured per `LEARNINGS.md` entry
  7: adjacent cells exactly `--grid-line-width` apart, the same hairline
  around the outside, every cell square and uniformly sized.

**D8-4 — the left pane stays put (Playwright)**
- After scrolling the page to its bottom, `token-pane` is still within the
  viewport.

**D8-5 — responsive**
- No horizontal overflow at 1280×800 or 375×667.

## Definition of done

1. `e2e/style-guide.spec.ts` passes: `npm run test:e2e`.
2. `e2e/shell.spec.ts` and every other spec pass unmodified. **Check rather
   than assume** — registering a token changes the set `shell.spec.ts`
   iterates.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
