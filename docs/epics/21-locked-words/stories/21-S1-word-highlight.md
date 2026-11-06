# Story S1 — The word highlight

In the build phase with Preview off, only the word the cursor is in is
blue-medium; every other cell of its row or column is dull blue.

**Status: drafted 2026-11-06; acceptance tests not yet written; not
approved.**

**Blast radius: small, expected off the risk paths.** `src/lib/` and
`src/components/grid/`; no engine, server action or storage change.
Direct delivery to `main` if that holds (CODE-REVIEW).

## What the code does today

The highlight covers the cursor's whole row or column, its slot, from
edge to edge, since the build phase has no black cells.
`cellAppearance` (`src/lib/cell-appearance.ts`) makes a lettered cell in
that slot `slot-letter` (blue-medium) and an empty one `slot` (dull blue).
With the cursor in ORATION going down, DORY and V above and below it are
blue-medium as well. With the cursor on an empty cell, every lettered
cell in its column is blue-medium.

## Decisions

From the human (2026-11-06, EPIC):

- **The cursor's word** is the unbroken run of lettered cells through the
  cursor's cell in its direction, ended by an empty cell or the grid's
  edge. Its cells are blue-medium.
- **Every other cell** of the row or column is dull blue, whether or not
  it holds a letter. The cursor's cell stays yellow.
- **With the cursor on an empty cell, or on a lone letter** (a run of 1),
  there's no word. The column shows only yellow and dull blue.
- **2 letters** make a word for the highlight.

Delegated details, proposed:

- **Symmetric hints** (`slot-required`) in the row keep their current
  look. Only `slot-letter` membership changes.
- **The run** is computed by a pure helper in `src/lib/` (e.g.
  `src/lib/build-word.ts`), which S2 and S3 reuse for lockable words and
  end cells.
- **Preview, the hints phase and play** are untouched. Their slots are
  already bounded by black cells.

## Non-goals

- Changing any highlight colour, or the highlight outside the build phase
  with Preview off.
- Anything to do with locking (S2+).

## Acceptance (proposed, to be written)

### Unit: `src/lib/build-word.test.ts` (new)

1. **21-S1-1 the run:** across and down; a run ended by empty cells, by
   either edge, by both; the cursor on an empty cell or a lone letter
   gives none; a 2-letter run is a word.

### `e2e/word-highlight.spec.ts` (new)

2. **21-S1-2 across:** a row `NOSYPARKER` then empties, cursor on N: the
   10 lettered cells blue-medium, the empties dull blue.
3. **21-S1-3 another word in the line:** a column `DORY`, empty,
   `ORATION`, empty, empty, `V`, cursor in ORATION going down: ORATION
   blue-medium; DORY, V and the empties dull blue.
4. **21-S1-4 cursor on a lone letter or an empty cell:** the same column,
   cursor on V, then on an empty cell: no blue-medium cell in the column.
5. **21-S1-5 Preview unchanged:** with Preview on, the highlight is
   Preview's slot as before.

Existing build-phase highlight cases asserting `slot-letter` across the
whole line may need amending. The drafting phase lists them in an Amended
acceptance table, as in 20-S4.

## Repo paths

Acceptance: the two files above, plus any amended specs listed at
drafting. Runtime: `src/lib/cell-appearance.ts`, a new
`src/lib/build-word.ts`, and `src/components/grid/PuzzleGridEditor.tsx`
and/or `PuzzleGrid.tsx`. Docs: this story, `../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
