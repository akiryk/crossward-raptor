# Story S1 — The completion count

A pure engine function counts a grid's lettered cells and all its cells,
with two small helpers for the percentage S2 shows ("N% complete",
rounded down) and the ready state (80%).

**Status: Done 2026-11-08,** merged in PR #34 (310bc94) after an
independent review with no blockers. Approved and frozen 2026-11-08 by the orchestrating
session under the human's delegation, after an independent review of
the draft found no blockers ([handoff](../HANDOFF.md#orchestration)).

**Blast radius: small, on a risk path.** One new module in
`src/engine/`, nothing else changes. `src/engine/**` needs a branch
(`story/22-S1-completion-count`), a PR and independent review
(CODE-REVIEW). Nothing uses it until S2.

## What the code does today

`Grid` (`src/engine/grid.ts`) is `cols` × `rows` cells read through
`at(col, row)`. A cell is `{ kind: 'black' }` or `{ kind: 'active',
letter }`, `letter` being `null` when empty, one character, or several
for a rebus. The build phase makes only active cells; grids saved before
the all-white model can still hold black ones. Locks (`src/lib/`) don't
touch the grid's cells. Nothing counts the filled cells.

## Decisions

From the EPIC (human):

- **Lettered cells over all cells.** Progress = 100 × lettered cells ÷
  all the grid's cells (`cols × rows`: 225 for 15×15, 441 for 21×21),
  whatever Preview would show black. 90 of 225 is 40%.
- **A rebus cell counts once.**
- **Only letters move it.** Typing into an empty cell raises it,
  deleting a letter lowers it, overtyping leaves it.
- **Rounded down:** 179 of 225 is 79%.
- **Ready at 80%:** 180 of 225, 353 of 441.

Proposed by the agent, approved with the EPIC:

- **Progress isn't stored;** it's derived from the grid.
- **Locked words count like any other letters.** The count reads only
  the grid, so a lock changes nothing.
- **Black cells** (old grids) count in the total, never as lettered.

### Delegated decisions (drafting agent)

- **The API,** in `src/engine/completion.ts` (new):
  - `type CompletionCount = { readonly lettered: number; readonly total: number }`
  - `completionCount(grid: Grid): CompletionCount`: `lettered` is the
    number of active cells whose `letter` isn't `null`; `total` is
    `cols × rows`.
  - `completionPercent(count: CompletionCount): number`: the whole
    percentage, rounded down; 0 when `total` is 0.
  - `READY_PERCENT = 80` and `isReadyForHints(count): boolean`, true
    exactly when `completionPercent(count) >= READY_PERCENT`.
- **Why the helpers are in S1:** the rounding and the threshold are the
  EPIC's rules, not layout; keeping them pure and unit-tested here means
  S2 only renders them, and the edge cases (179/225, 352/441) are tested
  once, exhaustively, rather than through the browser.
- **Percent and ready take a count, not a grid,** so S2 counts once per
  render and derives both from it. The bar's fill width ("the exact
  value") is S2's layout: it derives it from the count itself.
- **Exact rounding:** the percentage is the floor of the exact ratio for
  every count (the tests check every count from 0 to 225 and to 441
  against integer arithmetic), so the ready state never disagrees with
  the shown "80%".
- **A grid with no cells** is 0% and not ready (no division by zero).
  No real puzzle has one; it only keeps the function total.
- **Any size:** the count works for every grid; showing it only for
  daily and Sunday is S2's decision.
- **The 80–85% zone** and the messages' wording are S2's (display only),
  not exported here.

## Non-goals

- Any UI, store, storage or server change (S2 owns the display; nothing
  is stored).
- A second measure (share of white or playable cells), word counts,
  density or other NYT checks.
- Any notion of Preview, size category or lock in the engine function.
- Changing `grid.ts` or any existing engine module.

## Acceptance (frozen 2026-11-08)

### Unit: `src/engine/completion.test.ts` (new)

1. **22-S1-1 the count:** an empty daily is 0 of 225, an empty Sunday 0
   of 441; each lettered cell counts wherever it is (3, 90, 353); a full
   grid is 225 of 225 and 441 of 441; a rebus (`HEART`) counts once;
   black cells count in the total, not as lettered; the total is `cols ×
   rows` for other sizes (5×5, 9×9, 4×3).
2. **22-S1-2 only letters move it:** typing into an empty cell raises
   `lettered` by one, overtyping leaves the count, deleting a letter
   lowers it by one, `clearLetters` takes it to 0.
3. **22-S1-3 the percentage, rounded down:** 90/225 → 40, 179/225 → 79,
   180/225 → 80, 352/441 → 79, 353/441 → 80; 0, 1, 2 → 0, 3 → 1,
   224/225 → 99, 225/225 → 100, 440/441 → 99, 441/441 → 100; every count
   0…225 and 0…441 equals the integer floor; from a real grid's count;
   0 cells → 0.
4. **22-S1-4 ready at 80%:** `READY_PERCENT` is 80; 179/225 not ready,
   180/225 and 225/225 ready; 352/441 not, 353/441 and 441/441 ready;
   0/225 and 0/0 not; for every daily and Sunday count, ready exactly
   when the percentage is at least 80; from a real grid's count.
5. **22-S1-5 pure:** the grid's cells are unchanged after counting
   (black, rebus and letters included) and repeated counts are equal;
   the count passed to the helpers is unchanged; counting one grid
   doesn't affect the next.

### Discrimination (2026-11-08, observed on `main`)

- `npx vitest run src/engine/completion.test.ts`: the file fails to load,
  `Error: Cannot find module './completion'` (no tests run).
- Against a throwaway reference implementation, outside the repo (a
  `/tmp` copy of `grid.ts` and this test): 24 of 24 pass. With
  `Math.round` in place of rounding down, 7 fail (22-S1-3 and 22-S1-4).
  Counting black cells as lettered, 2 fail (22-S1-1 black cells,
  22-S1-5). The throwaway isn't in the repo.
- `npx eslint src/engine/completion.test.ts` is clean. `npm run verify`
  fails on `main` until the module exists (expected; not run).

## Repo paths

Acceptance: `src/engine/completion.test.ts` (new). Runtime:
`src/engine/completion.ts` (new), nothing else. Docs: this story,
`../EPIC.md` (only if a decision changes), `../HANDOFF.md`.

**CODE-REVIEW:** `src/engine/**`, so branch
`story/22-S1-completion-count`, a PR and an independent review before
merge.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `src/engine/completion.ts` is pure: no React, DOM or database imports,
  no module state, no mutation of its inputs.
- `npm run verify` exits 0. No browser suite is needed (no UI change).
- Delivered through the branch, PR and independent review above; the
  handoff records the merge.
