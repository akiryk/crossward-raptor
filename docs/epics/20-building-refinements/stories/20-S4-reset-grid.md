# Story S4 — Reset Grid under the grid

S1's Start Over becomes "Reset Grid" and leaves the toggle row: it sits
under the grid at its right edge, on the color key's line, and Rebus goes
back to the toggle row's right end.

**Status: done 2026-11-05.** The human approved the specification and
acceptance as drafted 2026-11-05; frozen at 47ba956, implemented and
pushed on `main` (direct delivery).

**Blast radius: small, no risk path.** `src/components/grid/` only; no
engine, server action or storage change. Direct delivery to `main`
(CODE-REVIEW).

## What the code does today

In the build phase the toggle row's right end holds Rebus, then Start
Over 20px after it (`PuzzleGridEditor`, `StartOverLink`, 20-S1). Start
Over opens `StartOverDialog`, titled "Clear Puzzle", with "Clear Puzzle"
and "Cancel". Under the grid, only in Preview and only when some cell is
red or gold, `PreviewLegend` lists the marks from the grid's left edge,
16px below the grid (14-S5): each item a 24px dot and `text-body-normal`
text (14px on a 20px line, the same as `text-label`), wrapping onto more
lines when narrow. Nothing else is under the build-phase grid.

## Decisions

The human's request (2026-11-04), with their answers to the agent's
questions:

- **The link moves** out of the toggle row to under the grid,
  right-aligned. Its text baseline is the color key's text baseline.
- **It's always there** in the build phase, Preview on or off, color key
  or none: on the color key's line, in the same spot, so it doesn't move
  when Preview or the key comes and goes.
- **"Reset Grid"** replaces "Start Over" on the link, the dialog's title
  and its confirm button. The body stays "Are you sure? This will remove
  every letter from the grid."

Delegated details, proposed:

- **Placement:** its right edge at the grid's right edge, at every width
  (the color key starts at the grid's left edge with no inset). The line
  is the color key's first line, 16px below the grid; the color key
  doesn't move.
- **Narrow:** it stays on the color key's first line; the key's items
  wrap in the room left, at least 20px (the key's own item gap) from the
  link. Nothing overflows at 375px.
- **Rebus** goes back to the toggle row's right end, 16px in (12px below
  a 748px window), as before S1 (17-S10).
- **Everything else in S1 holds:** the link's look (`text-label`,
  `subtle`, `primary` on hover and keyboard focus), always enabled, build
  phase only, a click doesn't take focus from the grid, what confirming
  does, an open rebus entry closed on click. By keyboard it's the next Tab
  stop after the grid.
- **Names in code** stay S1's: the `start-over` test ids, `StartOverLink`
  and `StartOverDialog`, and `e2e/start-over.spec.ts`.

## Non-goals

- Changing what resetting does, or the dialog's body.
- Changing the color key's look, position or wording (14-S5).
- Reset Grid in the hints phase or once published.

## Acceptance

*Approved as drafted and frozen 2026-11-05.*

### e2e/reset-grid.spec.ts (new)

1. **20-S4-1 under the grid (1440px):** one Reset Grid, not in the toggle
   row, under the grid with its right edge at the grid's right edge; with
   Preview off, Preview on with no color key (an empty grid) and Preview
   on with the key, it's in the same spot, its baseline the key's text
   baseline; the key still 16px below the grid at its left edge.
2. **20-S4-2 narrow (375px):** with both key items, Reset Grid's right
   edge at the grid's right edge, its baseline the first key item's text
   baseline, clear of every key item by at least 20px across; no
   horizontal overflow.

The dialog's new words are checked in the amended 20-S1-2, and "build
phase only" in 20-S1-8, unchanged.

### Amended acceptance

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `start-over.spec.ts` (20-S1) | header; 20-S1-1 | "Start Over" in the toggle row, 16px (12px) in, Rebus 20px before it; Tab from Rebus | "Reset Grid", its look unchanged; placement moves to 20-S4-1/2; Tab from the grid |
| `start-over.spec.ts` (20-S1) | 20-S1-2 | title and confirm "Clear Puzzle" | "Reset Grid" |
| `rebus.spec.ts` (17-S10) | header; 17-S10-5 | Rebus 20px before Start Over | the toggle row's right end, 16px (12px narrow) in, as before 20-S1 |
| `no-play-reset.spec.ts` (17-S3) | header; 17-S3-2 the build phase | no button named "reset" | its only one is Reset Grid (`start-over`), no dialog open |

17-S3's "the builder has no Reset" is about play's Reset of a player's
progress; Reset Grid clears the grid being built, and its name now
matches that case's `/reset/i`. Its hints-phase and published cases are
unchanged, as Reset Grid isn't there.

### Discrimination (2026-11-04, observed)

On `main` (4b30928) with the proposed tests: `reset-grid.spec.ts`,
`start-over.spec.ts` and `rebus.spec.ts` 5 failed (20-S4-1, 20-S4-2,
20-S1-1, 20-S1-2, 17-S10-5), 21 passed; `no-play-reset.spec.ts` 1
failed (17-S3-2 the build phase), 14 passed.

A throwaway implementation, kept aside in a git stash, not in the tree:
the first three files `--repeat-each=2`, 51 passed. The full
`npm run test:e2e` had 1044 passed and 1 failed, 17-S3-2's build phase,
which led to its amendment above; with it, `no-play-reset.spec.ts` 15
passed. One earlier run failed to build on a Google font fetch, and the
retry built.

### Implementation (2026-11-05, observed)

The drafting check's throwaway, applied unchanged to the two runtime
files: `npm run verify` exit 0; full `npm run test:e2e` exit 0 (1045
passed); frozen acceptance unchanged from 47ba956.

## Repo paths

Acceptance (immutable after freeze): `e2e/reset-grid.spec.ts`, the
amended `e2e/start-over.spec.ts`, `e2e/rebus.spec.ts` and
`e2e/no-play-reset.spec.ts`.

Runtime: `src/components/grid/PuzzleGridEditor.tsx`,
`src/components/grid/StartOverDialog.tsx` (the throwaway needed only
these two). Docs: this story, `../EPIC.md`, `../HANDOFF.md`. Declare any
other path before editing it.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
