# Story S3 — The Preview tooltip stays over a group

In Preview, once a red or gold cell's tooltip shows, it stays where it is
while the mouse moves over the touching cells of the same color, instead
of flashing away and reappearing over each one.

**Status: done 2026-11-04.** The human approved the specification and
acceptance as drafted 2026-11-04; frozen at 58b5f59, implemented and
pushed on `main` (direct delivery).

**Blast radius: small, no risk path.** `src/components/grid/PuzzleGrid.tsx`
(and `src/components/ui/Tooltip.tsx` only if needed); no engine, server
action or storage change. Direct delivery to `main` (CODE-REVIEW).

## What the code does today

S2's tooltip follows the mouse-hovered cell (`PuzzleGrid`, pointer events
of type `mouse`) and sits above that cell. The grid's 1px lines are the
grid itself showing through the gap between cells, so on its way from
one cell to the next the mouse can be over no cell; the tooltip then
goes, and comes back above the next cell. Whether a line is hit depends
on where the cells' edges fall on the screen's pixels (observed: at
1440px, between 3,2 and 4,2 only one 1/64px position is the line). Even
with no gap, it jumps to each cell it reaches.

## Decisions

The human's request (2026-11-04), with their answers to the agent's
questions:

- **It stays over a group.** Once shown, the tooltip stays above the
  first cell hovered, with its text, while the mouse is over any cell of
  the same mark that touches it, side by side or one above the other,
  through cells of that mark (a run of gold cells, a red group turning a
  corner). It never goes in between.
- **The other mark:** moving onto a touching cell of the other color
  moves it there with that color's text, without going in between.
- **Leaving:** over an unmarked cell (a letter or black cell) or off the
  grid it goes at once, as in S2; a separate group of the same color
  reached that way gets a new tooltip above the cell entered.

Delegated details, approved with the story:

- **The lines between cells** change nothing: over one, the tooltip stays
  as it was. Leaving the grid (its outer line included) closes it, as
  in S2.
- **When the group changes:** if the cell it stays above is no longer of
  the hovered cell's mark, or no longer joined to it (e.g. a letter
  typed or deleted elsewhere), it moves to the hovered cell, with that
  cell's text. The hovered cell's own mark changing still changes or
  removes it, as in S2.
- **Supersedes** S2's "moving to another marked cell moves it" within a
  group; everything else in S2 holds. No frozen S2 case changes.

## Non-goals

- Anything S2 ruled out: a delay or animation, an arrow, touch or
  keyboard tooltips, tooltips outside Preview, changing the colors, the
  marks or the legend.
- Placing the tooltip over the whole group rather than the first cell.
- Joining cells that touch only at a corner.

## Acceptance

*Frozen 2026-11-04.*

### e2e/preview-tooltip-stays.spec.ts (new)

Each stays case also checks the tooltip never left the page (a
`MutationObserver` on the page), and rests the mouse on a line between
two cells, found as a point that hits neither cell, where it stays.

1. **20-S3-1 a gold group:** from 3,2 to 4,2 and back, by way of the
   line between them, the gold tooltip stays above 3,2, centered.
2. **20-S3-2 a red group:** along 1,4 to 4,4 and up to 4,3 round the
   corner, by way of the line between 4,4 and 4,3, the red tooltip stays
   above 1,4.
3. **20-S3-3 the other mark:** from gold 4,2, on the line to red 4,3 it
   stays above 4,2; on 4,3 it's above 4,3 with the red text; back on 4,2
   above it with the gold text; never gone.
4. **20-S3-4 leaving:** from gold 1,2 over black 2,2 none; on gold 3,2 a
   new one above 3,2; from 1,2 up to black 1,1 none *(pass today)*.
5. **20-S3-5 the group changes:** hovered from 3,4 to 4,4, it stays
   above 3,4; deleting the letter that made them gold (3,4 black, 4,4
   red) moves it above 4,4 with the red text.

No frozen acceptance needs amending: nothing it checks changes.

### Discrimination (2026-11-04, observed)

On `main` (d32031e) with the proposed tests, `npx playwright test
e2e/preview-tooltip-stays.spec.ts`: 4 failed, 2 passed (20-S3-4 and auth
setup). 20-S3-1 and 20-S3-3 fail with no tooltip on the line between two
cells (the reported flash); 20-S3-2 and 20-S3-5 with it moved to the next
cell (139.8px off center, a cell's width).

Drafting fixed three test defects found that way: the bottom row lay
below a 900px window, so each case scrolls the grid into view; the
leftmost cell's tooltip is held 8px in from the window's edge, so
20-S3-4 uses 1,2; and the line is found in 1/64px steps, as quarter
pixels missed it.

A throwaway implementation (since discarded; no runtime change remains)
passed this file and `preview-tooltips.spec.ts` twice
(`--repeat-each=2`, 31 passed). With it, the full `npx playwright test`
had 1039 passed and 4 failed, all outside Preview: 16-S4-2 and two
16-S4-3 cases (`duplicate.spec.ts`) and P5's Escape case
(`library-play.spec.ts`). Not this story's: they passed in the
implementation's full run (below).

### Verification (2026-11-04, observed)

On the implementation (`PuzzleGrid.tsx` only): `npm run verify` exit 0;
`preview-tooltip-stays.spec.ts` and `preview-tooltips.spec.ts`
`--repeat-each=2` 31 passed; full `npm run test:e2e` exit 0 (1043
passed). An earlier full run had one failure, 14-S7-1
(`play-design.spec.ts`), an `ECONNRESET` on the session request; that
file passed alone (`--repeat-each=2`, 39 passed). Frozen acceptance
unchanged from 58b5f59.

## Repo paths

Acceptance (immutable after freeze): `e2e/preview-tooltip-stays.spec.ts`.

Runtime: `src/components/grid/PuzzleGrid.tsx`, and
`src/components/ui/Tooltip.tsx` if needed. Docs: this story,
`20-S2-preview-cell-tooltips.md` (a pointer to this story), `../EPIC.md`,
`../HANDOFF.md`. Declare any other path before editing it.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
