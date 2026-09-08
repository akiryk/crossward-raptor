# Story D1c — Grid hairline: outer edge and real measurement

A second follow-up to D1, from looking at the corrected grid samples. Two
things: the hairline stops at the outer edge, and the tests still can't
catch the class of bug that produced the last one.

Repo paths:
- `src/app/style-guide/page.tsx` — edited: outer hairline
- `e2e/style-guide.spec.ts` — edited (**already provided — do not edit**)
- `docs/LEARNINGS.md` — edited (**already provided — do not edit**)

## 1. The hairline stops at the outer edge

The container paints `--color-grid-line` and uses a 1px `gap`, so
divisions *between* cells are correct. But nothing draws a line around the
outside, so the grid's outer boundary is invisible — and white cells
against a white page have no perceptible edge at all. That's why the cells
read as non-square despite measuring exactly 40×40: you can only see a
cell boundary where a grey cell happens to sit next to a white one.

The fix is padding equal to `--grid-line-width` on the container, so its
background shows around the perimeter exactly as it does between cells.
Every edge of every cell is then bounded by the same hairline, in the same
colour, regardless of what the cell contains or what's next to it.

## 2. Tests must measure rendered geometry, not declared CSS

The last bug is worth understanding, because the tests passed throughout
it. `getComputedStyle` reported `rowGap` and `columnGap` as exactly `1px`
— the CSS was never wrong. The cells were `w-10` (40px) inside
equal-fraction tracks about 52.67px wide, so each cell left-aligned and
left ~12.67px of empty track beside it. That leftover space was the same
colour as the hairline, so it looked like one thick gap.

No assertion about `gap`, in any form, could have caught that. The
declared value and the rendered result disagreed, and only the rendered
result mattered.

So this story replaces the CSS-property assertions with measurements taken
from `getBoundingClientRect`: the actual distance between adjacent cells,
and between the outermost cells and the container's edge. Those hold
regardless of *how* the spacing is achieved — gap, padding, margins,
track sizing — which is the property worth testing.

**The existing `gap`/`background-color` assertions are removed, not kept
alongside.** They describe implementation rather than result, and the last
bug proved they can pass while the render is wrong. Keeping them would
imply a coverage that isn't real.

## Scope discipline

- **Style guide only.** The real grid components are D3 and D4; they'll
  inherit this technique, but this story doesn't touch them.
- **No token changes.**
- **No changes to any app route or component outside `/style-guide`.**

## Acceptance examples

**D1c-1 — inner hairlines (Playwright, measured)**
- For every pair of horizontally adjacent cells, the distance between the
  right edge of one and the left edge of the next equals
  `--grid-line-width`, within half a pixel.
- Likewise vertically.

**D1c-2 — outer hairline (Playwright, measured)**
- The distance from the container's edge to the nearest cell edge equals
  `--grid-line-width` on all four sides, within half a pixel.

**D1c-3 — cells still square and uniform**
- Every cell's rendered width equals its height, and all cells share the
  same dimensions.

## Definition of done

1. `e2e/style-guide.spec.ts` passes: `npm run test:e2e`.
2. Every other spec passes unmodified.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
