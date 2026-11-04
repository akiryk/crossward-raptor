# Story S2 — Preview cell tooltips

In Preview, hovering a red or gold cell with the mouse shows a small dark
tooltip above it that says what the color means.

**Status: done 2026-11-04.** The human approved the specification and
acceptance as drafted 2026-11-04 (keeping `text-label`), frozen at
3a96758; implemented and delivered on `main`.

**Blast radius: small, no risk path.** `src/components/grid/` plus a new
`src/components/ui/Tooltip.tsx`; no engine, server action or storage
change. Direct delivery to `main` (CODE-REVIEW).

## What the code does today

Preview exists only in the build phase. `PuzzleGrid` (`mode="preview"`)
gives each cell a Preview state, `data-cell-state`: `recommended` (gold,
a cell of a two-letter word, lettered or not), `required` (red, an empty
cell whose symmetric counterpart holds a letter), `letter` or `black`.
Gold wins when both apply. The cursor and its word are painted over
those colors in the build phase's yellow and blue (17-S4), but
`data-cell-state` stays the cell's own. `PreviewLegend` under the grid
names the marks present (14-S5). Nothing in the app shows on hover; there
is no tooltip component.

## Decisions

From the EPIC:

- **The text:** a gold cell "Consider avoiding two-letter words."; a red
  cell "Filling in these cells will result in a symmetrical puzzle." A
  cell that's both shows only the gold text, as it's colored gold.
- **When:** mouse hover only, only in Preview, only over a red or gold
  cell. Touch and keyboard rely on the legend, which stays unchanged.
- **The look:** a small dark bubble, `preview-cell-off` background,
  `inverse` `text-label`, above the cell and centered on it, with no
  delay and no arrow.

Delegated details, proposed:

- **The tooltip** (`preview-tooltip`, `role="tooltip"`): 4px vertical and
  8px horizontal padding, 4px corners (`rounded`), at most 280px wide
  with the text centered and wrapping (the red text takes two lines, the
  gold one). Its bottom is 4px above the cell's top. No shadow, no
  transition: it appears and goes at once.
- **Kept on screen:** never closer than 8px to the window's left or right
  edge, shifting off center to stay in. If it wouldn't fit above the cell
  with 8px to the window's top, it goes 4px below the cell instead.
- **It follows the cell's mark** (`data-cell-state`), not the painted
  color: the cursor's cell and its word keep their tooltips under the
  yellow and blue, so a click on a gold cell doesn't take its tooltip
  away. One tooltip at most; moving to another marked cell moves it and
  changes its text at once. It goes when the pointer leaves for an
  unmarked cell or leaves the grid, and when the hovered cell's mark goes
  (e.g. a letter typed into it) or changes (its text changes with it).
- **It doesn't get in the way:** it takes no pointer events, so the cells
  under it still hover and click; it doesn't take focus and isn't read as
  the cell's description (the cells aren't focusable; the legend is the
  accessible explanation).
- **Mouse only** means a pointer of type `mouse`: a touch tap, which
  browsers follow with emulated mouse events, shows nothing; moving the
  cursor onto a marked cell by keyboard shows nothing.

## Non-goals

- Changing Preview's colors, which cells are marked, or the legend.
- Tooltips outside Preview: the build view, the hints phase (including
  Preview Hints) and play.
- Touch or keyboard tooltips; a hover delay or animation; an arrow.
- Other uses of the `Tooltip` primitive.

## Acceptance

*Approved and frozen 2026-11-04.*

### e2e/preview-tooltips.spec.ts (new)

1. **20-S2-1 a red cell (1440px):** hovering it shows one tooltip, role
   `tooltip`, with the red text; moving to a letter cell, then a black
   cell, shows none; back on the red cell it shows again; leaving the
   grid hides it.
2. **20-S2-2 a gold cell:** a lettered and an empty gold cell each show
   the gold text; a cell both gold and missing its symmetric letter shows
   only the gold text.
3. **20-S2-3 the look:** `preview-cell-off` background, `inverse` text,
   14px on a 20px line, 4px/8px padding, 4px corners, no shadow, no
   arrow (no `::before`/`::after` content); its bottom 4px above the
   cell, centered on it; visible at full opacity at once, with no
   transition or animation; at most 280px wide, the red text on two
   lines, the gold on one.
4. **20-S2-4 moving and clicking:** from a red cell to a gold one, one
   tooltip, now the gold text over the gold cell; a click on the cell
   under the tooltip moves the cursor there; the tooltip of a cell under
   the cursor and of one in its word stays.
5. **20-S2-5 the mark changes:** a letter typed into the hovered red cell
   takes its tooltip away; a hovered cell turned gold by a typed letter
   elsewhere shows the gold text.
6. **20-S2-6 on screen (375px):** the tooltips of the top row's leftmost
   and rightmost marked cells stay 8px inside the window; scrolled so the
   top row is at the window's top, the tooltip is 4px below the cell.
7. **20-S2-7 none:** with Preview off, hovering a symmetric-hint cell
   shows none; in Preview, the keyboard cursor on a red cell shows none;
   a touch tap on a red cell (a touch device) shows none; the hints
   phase shows none *(pass today)*.

No frozen acceptance needs amending: nothing it checks changes.

### Discrimination (2026-11-04, observed)

On `main` (a0bc55d) with the proposed tests, `npm run test:e2e` over
`preview-tooltips.spec.ts`: 6 failed (20-S2-1 to 20-S2-6), 4 passed
(the 20-S2-7 guards), plus auth setup.

A throwaway implementation (since discarded; no runtime change remains)
passed the file three times (`--repeat-each=3`, 31 passed) once a test
defect it exposed was fixed in drafting: 20-S2-6 shrinks the window to
300px tall before scrolling, as at 600px the page can't scroll the top
row to the window's top. Swapping its pointer events for mouse events
failed 20-S2-7c, so the touch guard catches a hover that isn't mouse
only. With it, the full `npm run test:e2e` had 1037 passed and 1 failed:
18-S5-5 (done-icon, a library row's colour), outside this story's
surface. It also fails on clean `main` (1 of 5 repeated: "play rounded
corner ... #F0F5E5"), so it is an existing intermittent failure, not
this story's.

### Implementation (2026-11-04, observed)

`Tooltip` places itself in a portal, before paint, from its anchor's box;
`PuzzleGrid` tracks the mouse-hovered cell (pointer events of type
`mouse`) and shows the tooltip while that cell's mark has a text.
`PuzzleGridEditor` needed no change. `npm run verify` exit 0; the story
file `--repeat-each=3`, 31 passed; full `npm run test:e2e` exit 0 (1038
passed). Acceptance unchanged from 3a96758.

## Repo paths

Acceptance (immutable after freeze): `e2e/preview-tooltips.spec.ts`.

Runtime: `src/components/grid/PuzzleGrid.tsx`,
`src/components/grid/PuzzleGridEditor.tsx`, a new
`src/components/ui/Tooltip.tsx`. Docs: this story, `../EPIC.md`,
`../HANDOFF.md`. Declare any other path before editing it.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
