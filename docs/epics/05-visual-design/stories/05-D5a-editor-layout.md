# Story D5a — Editor layout

Fifth slice of the visual-design epic. Makes the editor usable: the grid
fits on screen, and the hints are visible at the same time as the grid
rather than somewhere below the fold.

This is the complaint that started the epic — a 15×15 puzzle currently
runs off the bottom of the screen, so you can only see the top of it, and
the hints are further down still.

Repo paths:
- `src/app/puzzles/[id]/page.tsx` — edited: layout structure
- `src/components/grid/PuzzleGridEditor.tsx` — edited: grid sizing wrapper
- `src/components/grid/PuzzleGrid.tsx` — edited if needed for sizing
- `src/components/grid/HintsPanel.tsx` — edited: panel sizing and scroll
- `e2e/editor-layout.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

## Markup contract

- `data-testid="editor-layout"` wraps the grid and the hints panel.
- `data-testid="grid-region"` wraps the grid.
- `data-testid="hints-region"` wraps the hints panel. Rendered only in
  hints phase, as today.

Existing test ids — `puzzle-grid`, `grid-cell`, `hint-row`, `hint-input`,
`data-coord` — are unchanged.

## Decisions

**The grid is sized by the smaller of available width and height.** The
current sizing considers width only, which is why a 15×15 runs off the
bottom. It should be bounded by viewport height as well, so the whole
puzzle is visible without scrolling. A `min()` of a height-based value, a
width-based value, and a hard maximum is the straightforward expression of
that.

**The grid is deliberately smaller than it could be.** On a wide screen it
must leave room for the hints beside it. Sizing the grid greedily and
letting hints take what's left is the obvious approach and the wrong one —
it reproduces the current problem at a different breakpoint.

**Side by side when there's width, stacked when there isn't.** On a laptop
the hints sit beside the grid; on a phone they go below it. No fixed
breakpoint is specified here — pick one that works and say which.

**The hints panel scrolls within its own region**, rather than growing the
page. A 15×15 can require sixty-odd hints; if the panel grows the page,
the grid scrolls out of view and the layout has achieved nothing.

**Cells stay square and uniformly sized at every viewport.** Whatever
sizing approach is used, D3's and D1c's geometry guarantees still hold —
the tests re-check them here at multiple widths.

**No tokens for layout**, per the epic's convention. Sizing here is
ordinary CSS; only design values live in `@theme`.

## Scope discipline

- **No stepper work.** D5b.
- **No changes to cell appearance, numbering, or preview.** D3 and D4.
- **No changes to the puzzles list page.**
- **No engine, persistence, or Server Action changes.**
- **No behaviour changes** — clicking, typing, and hint editing work
  exactly as before.
- **No new-puzzle dialog.** D6.

## Acceptance examples

All measured from bounding rects, per `docs/LEARNINGS.md` entry 7.

**D5a-1 — the grid fits (Playwright)**
- A 15×15 puzzle at 1280×800: the grid's bottom edge is within the
  viewport height, and its right edge within the viewport width.
- The same at 1024×768.
- At 375×667: the grid's width is within the viewport width, and the page
  has no horizontal overflow.

**D5a-2 — grid and hints are visible together (Playwright)**
- A 15×15 puzzle in hints phase at 1280×800: both `grid-region` and
  `hints-region` are visible, and at least one `hint-row` is within the
  viewport at the same time as the whole grid.
- At 1280×800 the hints sit beside the grid — `hints-region`'s left edge
  is at or beyond `grid-region`'s right edge.
- At 375×667 they stack — `hints-region`'s top edge is at or beyond
  `grid-region`'s bottom edge.

**D5a-3 — the grid leaves room (Playwright)**
- At 1280×800, the grid's width is no more than 60% of the viewport
  width, so the hints have somewhere to go.

**D5a-4 — the hints panel scrolls itself (Playwright)**
- With a 15×15 puzzle in hints phase, `hints-region`'s height is within
  the viewport height — the panel does not grow the page to fit every
  hint.

**D5a-5 — geometry still holds (Playwright)**
- At 1280×800 and at 375×667: cells are square, all the same size, and
  adjacent cells are exactly `--grid-line-width` apart with the same
  hairline around the outside.

## Definition of done

1. `e2e/editor-layout.spec.ts` passes: `npm run test:e2e`.
2. Every other spec passes unmodified. **Check rather than assume** — a
   sizing change can move elements out from under tests that click them.
   If a frozen spec contradicts this story, stop and report.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
