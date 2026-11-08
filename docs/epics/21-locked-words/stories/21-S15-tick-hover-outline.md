# Story S15 — The tick hover outlines the word

Hovering a ticked end cell no longer darkens its locked words. Each one
gets a black outline around its letters instead, and every cell keeps its
color.

**Status: approved by the human and frozen (2026-11-07), delegated details included.** From the
human's review after S12–S13 (EPIC "Changes from the human's review after
S12–S13 (2026-11-07)", item 2). Amends S11's darkening, and S13's
"the darkening" (now the outline). Depends on S11 and S13 (delivered).

**Blast radius: small, expected off the risk paths.** One client
component, `src/components/grid/PuzzleGrid.tsx`. No `src/engine/**`,
`src/lib/puzzle-storage.ts`, `src/app/puzzles/actions.ts` or `prisma/**`
change (CODE-REVIEW "When review applies"). Direct delivery to `main`.

## What the code does today

Inspected `PuzzleGrid.tsx`: the overlays, `hoverTick`,
`isHoverTickShown` and `handlePointerMove`.

- **The darkening:** while the mouse is on a ticked end cell (or on the
  button of the word S13 picked), each cell of every locked word ending
  there gets a 15%-black layer (`tick-hover-shade`), drawn under the
  outlines, ticks and button.
- **The gray outline** (`word-outline`, 1px gray-500) wraps a locked word
  and its two end cells, on the grid lines (inset by the line's width).

## Decisions

From the human (2026-11-07, EPIC):

- **No darkening:** the cells keep their colors.
- **A black outline around the word**, not around each cell, and around
  its letters only, not its end cells (the human chose "word only").
- When and where it shows is unchanged (S11, S13): at once, on the whole
  ticked end cell, for every locked word ending there, kept on the picked
  word's button, following the tick.

### Delegated details

Proposed by the drafting agent, approved by the human:

- **The line:** 1px solid black (`--palette-black`), on the grid lines
  around the word's cells, as the gray outline sits around the word and
  its end cells. It's drawn over the gray outline (whose ends stay gray)
  and under the ticks and the lock button.
- **Two words ending at one cell** each get their own outline (CAT and
  OWL, then DOG too, in S11's fixture). Words that cross would share a
  cell inside both outlines. Not tested.
- **Hook:** `[data-testid="tick-hover-outline"]`, one per word, replacing
  `tick-hover-shade`.

## Non-goals

- Changing when the hover starts or ends, its area, the button it shows
  (S11, S13) or the gray outline.
- A black outline anywhere else (the cursor's word, a hovered word).

## Acceptance (frozen)

No new spec: the S11 and S13 specs carry it.

### Amended frozen acceptance (2 specs)

Each amendment is marked "21-S15" in the file. No other assertion,
timeout or case changes.

- `e2e/lock-tick-hover.spec.ts` (S11) and `e2e/lock-tick-button.spec.ts`
  (S13): `expectPaint` and `expectPaintNow` (and S13's
  `paintMismatches`) check that the cells named `dark` keep their paint
  (were 15% darker). A new `tickOutlineMismatches` checks that each
  `tick-hover-outline` is a 1px solid black line, 1px outside its cells'
  boxes on every side, and that the outlines surround exactly the `dark`
  cells: no end cell, no other word. So every case's "darker" now means
  "outlined", and "unchanged" also means "not outlined". The headers note
  it. Unused darkening constants are removed.
- `e2e/lock-tick-hover.spec.ts` 21-S11-5's first case: the cursor's
  yellow and its word's blue keep their colors under the outline (were
  85%). 21-S11-6's second case: TANGENT outlined while the mouse is on
  its tick, not after. 21-S11-7's touch case: no outline.

### Discrimination (2026-11-07, observed)

- **Against the scratch S14–S16 implementation** (S14's Discrimination):
  both specs pass with the amendments (in the 201 of 201).
- **On `main` (856db3a):** 19 of the two specs' cases fail, at an
  outline check or at S16's timing.
- **The scratch without S15** (S14 and S16 applied, the darkening kept):
  16 of the two specs' 24 cases fail, every one at an outline check
  (`outlined: …`) or 21-S11-6's outlined-then-not poll. The 8 that pass
  don't hover a tick with a word to outline, or check only the button.

## Repo paths

Acceptance: the amended `e2e/lock-tick-hover.spec.ts` and
`e2e/lock-tick-button.spec.ts`.

Runtime: `src/components/grid/PuzzleGrid.tsx`, the tick hover's
overlay (and its comments).

Risk: all off the CODE-REVIEW risk paths. Docs: this story, `../EPIC.md`,
`../HANDOFF.md`. Declare any other path before editing it.

## Definition of done

- Approved by the human and frozen in a specification-only commit on
  `main` (with S14 and S16) before any runtime change. Frozen acceptance
  is unchanged after that.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- The human's visual check.
- Delivered on `main`; the handoff records observed results.
