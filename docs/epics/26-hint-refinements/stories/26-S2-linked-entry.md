# Story S2 — The linked entry in the grid

While a linked clue (26-S1) is the current clue, the cells of the entry it
names are pale blue (`linked-clue`, `interactive-faint-hover`): in the
builder's hints phase and in play. This is a secondary highlight. The
current word and cursor keep their look.

**Status: Approved 2026-11-14** by the human, drafting decisions
accepted. Acceptance written and frozen 2026-11-15 under the human's
explicit delegated freeze authorization; see the epic handoff for the
baseline commit. Depends on 26-S1.

**Blast radius: small, off the risk paths.** `PuzzleGrid` gains one cell
set, and the editor and play compute it with S1's helper. Delivered on
`epic/26-hint-refinements`.

## The human's request

See the [EPIC](../EPIC.md#the-humans-request), item 3.
[S3](26-S3-linked-hints.md) extends recognition to See and removes S1's
individual word decoration; S2's grid behavior is preserved.

## What the code does today

- **The current clue.** In the builder's hints phase it's `activeKey`,
  the word of the grid's cursor, which follows the focused hint field
  (`PuzzleGridEditor.tsx`). In play it's `selectedKey`
  (`PlayPuzzle.tsx`). Each fills `highlights` with `'slot'` for its cells
  and `'selected'` for the cursor, only while the grid or a hint field
  has focus.
- **`PuzzleGrid`** paints `highlights` per mode (`hints`, `hints-locked`,
  `play`, `preview`). Its only other secondary set is `sisterWord`, used
  in `build` mode only.

## Decisions

From the human:

- The referenced entry's cells take the sister word's pale blue while its
  linked clue is current, in the builder and in play.
- The current word and cursor keep their look. Moving to another clue
  moves the highlight to that clue's reference, or removes it.
- An invalid or nonexistent reference gives no grid highlight.
- No click, navigation or cursor movement.

Drafting decisions (approved by the human 2026-11-14):

- **Where.** The builder's hints phase (`hints` and `hints-locked`) and
  play. Not the build phase, where the sister word owns the pale blue, and
  not the build-phase Preview, which has no hint text in view.
- **When.** Only while there is a current clue, under the same focus
  condition as the current word's highlight. With no highlighted word
  (focus elsewhere, a finished and locked play grid), there is no linked
  entry either.
- **Crossing cells.** A cell in both the current word and the linked
  entry keeps the current word's (or cursor's) look. Pale blue never
  replaces it.
- **Live.** The set is recomputed every render from the current clue's
  text, so editing the current hint into or out of a valid reference
  adds or removes the cells at once.
- **One computation.** `linkedEntryCells(hints, currentKey, slots)` in
  `src/lib/clue-reference.ts` returns the referenced slot's cells, or
  none, using `parseClueReference` with `ownKey` = `currentKey`. The
  editor and play both call it and pass the result to `PuzzleGrid` as
  `linkedWord`.
- **Only the background.** `data-highlight`, `data-cell-state`, letters
  and their colors are unchanged. A linked cell is marked
  `data-linked="true"` for tests.
- **Style.** `bg-linked-clue`, S1's style. After S3, referenced grid cells
  and the referenced play clue row share it; individual words are plain text.

## Non-goals

The EPIC's, and also: any change to the sister word, the build phase,
or the current word's colors.

## Acceptance (frozen 2026-11-15)

Viewport 1440px. Colors written out. Linked cells are found by reading
every cell's background, so a case fails on any extra pale cell.

### `src/lib/clue-reference.test.ts` (S1's file, extended)

1. **26-S2-1 cells:** a current clue `With 4-Across, x` gives
   4-Across's cells in order. With a null current key, an ordinary hint,
   an invalid reference or a self-reference, there are none. The inputs
   are unchanged.

### `e2e/linked-entry.spec.ts` (new)

2. **26-S2-2 builder:** in the hints phase, 1-Down's hint `With 1-Across,
   x` and the cursor in 1-Down. 1-Across's cells, except the shared
   (0,0), are #E8F7FF with `data-linked`. 1-Down keeps its cursor-word
   fill and the cursor its cursor fill. No other cell is pale.
3. **26-S2-3 builder, moving:** stepping to an ordinary clue removes
   every pale cell. Stepping to a clue with another valid reference shows
   that entry's cells instead.
4. **26-S2-4 builder, editing:** with the cursor's word current,
   changing its hint `1` → `82` removes the pale cells at once, and
   changing it back restores them.
5. **26-S2-5 play:** a published puzzle with a linked clue. Selecting its
   word makes the referenced cells pale, and the selected word and cell
   keep play's colors. Selecting an ordinary word, or clicking an
   ordinary hint in the list, removes them. Clicking the linked hint
   restores them.
6. **26-S2-6 none:** the build phase with the same hints shows no linked
   cell, and the sister word is unchanged *(passes today)*. With focus
   off the grid and hint fields, there is none.

### Discrimination

Observed before freeze on the S1 epic head `957ddda` plus proposed acceptance:

- Without S2 runtime, `npm test -- src/lib/clue-reference.test.ts` exited 1:
  S2-1 failed because `linkedEntryCells` was absent; all 19 S1 tests passed.
- Without S2 runtime, `npm run test:e2e -- e2e/linked-entry.spec.ts --grep
  '26-S2-[2345]'` exited 1: all four S2 cases failed at their first pale-cell
  assertion (expected `1,0` and `2,0`, observed none); both setup cases passed.
- With a throwaway prototype, `npm run verify` exited 0: 114 files and 1,308
  tests passed (two existing lint warnings). The initial sandboxed attempt
  could not connect to localhost; the successful gate used approved access.
- The prototype passed `npm run test:e2e -- e2e/linked-entry.spec.ts
  e2e/sister-word.spec.ts e2e/hints-grid-editing.spec.ts
  e2e/hint-phase-design.spec.ts e2e/play-design.spec.ts
  e2e/linked-clues.spec.ts`: exit 0, 76 passed. An earlier draft selected
  Across by clicking the current cell; the draft was corrected before freeze.
- An independent verification agent inspected proposed acceptance and found
  no blockers or vacuous assertions. S2's browser scope is 1440px; finished
  play is covered by the existing selection gate, not a new direct S2 case.

The prototype was removed before committing this specification/acceptance
baseline on main. Existing frozen S1 assertions were preserved unchanged.

## Repo paths

Acceptance: `src/lib/clue-reference.test.ts` (extended),
`e2e/linked-entry.spec.ts` (new). Runtime: `src/lib/clue-reference.ts`,
`src/components/grid/PuzzleGrid.tsx`,
`src/components/grid/PuzzleGridEditor.tsx`,
`src/components/play/PlayPuzzle.tsx`. Docs: this story, `../EPIC.md`,
`../HANDOFF.md`.

**CODE-REVIEW:** no risk path.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0. The new spec and the directly affected
  grid specs (`sister-word`, `hints-grid-editing`, `hint-phase-design`,
  `play-design`, `linked-clues`) pass.
- Merged into `epic/26-hint-refinements`, with observed results in the
  handoff.
- The human's visual check happens at epic closeout.
