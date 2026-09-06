# Story M5 — Clear all letters

Fourth slice of the puzzle-management epic, deliberately sequenced ahead of
M4. A single action that empties every letter from a grid while leaving its
black-square geometry untouched.

This exists partly because M4's copy-everything default depends on it —
without a bulk clear, turning a duplicate into a reusable template means up
to 225 individual backspaces. But it earns its place independently:
restarting a fill on a grid whose shape you like is a normal thing to want,
and today the only way to do it is one cell at a time.

Repo paths:
- `src/engine/grid.ts` — edited: adds `clearLetters`
- `src/engine/grid.test.ts` — extended Vitest tests (**already provided —
  do not edit**; Story G's existing G1 cases are unchanged, M5 cases added
  after them)
- `src/components/grid/ClearLettersButton.tsx` — new
- `src/components/grid/PuzzleGridEditor.tsx` — edited: renders the button
  and applies the clear to its grid state
- `e2e/clear-letters.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

**No new Server Action.** Clearing produces a new `Grid` in
`PuzzleGridEditor`'s existing state, which the existing debounced
`saveGrid` persists exactly like any other edit. Adding a dedicated action
would duplicate a path that already works.

## Required contract

```ts
// src/engine/grid.ts (addition)
import type { Grid } from './grid';

/**
 * Returns a new grid with every active cell's letter cleared to null.
 * Black cells and grid dimensions are untouched — geometry is unchanged,
 * only the fill is removed.
 */
export function clearLetters(grid: Grid): Grid;
```

```tsx
// src/components/grid/ClearLettersButton.tsx
export function ClearLettersButton(props: { onConfirm: () => void }): JSX.Element;
```

## Markup contract

- `data-testid="clear-letters-button"` — the initial trigger.
- Clicking it reveals `data-testid="clear-letters-confirmation"`, whose
  visible text includes **"cannot be undone"**, alongside
  `data-testid="clear-letters-confirm-button"` and
  `data-testid="clear-letters-cancel-button"`.
- Cancelling restores the initial state with the trigger visible.

## Decisions

**`clearLetters` belongs in the engine, not in `src/lib`.** Every story
since P0 has said "no changes to `src/engine/`" — those stories genuinely
didn't need any. This one does. It's a pure grid-to-grid transform in
exactly the same family as `withLetter` and `toggleBlackSymmetric`, and it
belongs beside them rather than as a serialized-data transform in the
persistence layer. The alternative — operating on `SerializedGrid` — would
force the editor to serialize, transform, and deserialize just to clear its
own in-memory grid.

**Authorized extension of a committed acceptance test.**
`src/engine/grid.test.ts` gains M5 cases. Story G's existing G1
`withLetter` cases are preserved byte-for-byte; nothing there changes. This
is the same pattern Story G itself used when it extended
`symmetry.test.ts`, and Story P4 when it extended `keyboard-intent.test.ts`.

**Allowed in both phases.** Letter editing works in grid and hints phase
alike (Story E: `applyLetterEdit` has no phase check), so a bulk clear
follows the same rule. Only *geometry* is frozen in hints phase, and this
changes no geometry.

**Two-step inline confirmation with "cannot be undone" copy**, matching
`DeletePuzzleButton` from Story M2 and the epic's honesty convention.
Clearing a full 15×15 fill is a real loss if unintended, and there's no
undo.

**The cursor stays where it is.** Clearing changes no geometry, so the
cursor's current coordinate remains a valid active cell. Nothing about
selection needs to move or reset.

## Scope discipline

- **No "clear this word" or per-slot clearing.** Whole grid only.
- **No undo.** Consistent with the epic's non-goals; the confirmation is
  the safeguard.
- **No hint clearing.** This clears letters, not hints. Clearing hint text
  is a different operation nobody has asked for.
- **No phase change.** A puzzle in hints phase stays in hints phase after
  clearing.
- **No changes to `withLetter`, `toggleBlackSymmetric`, or any other
  existing engine function.**
- **No changes to the list page, `PuzzleTitle`, or `DeletePuzzleButton`.**

## Acceptance examples

**M5-1 — `clearLetters` (Vitest, extending `grid.test.ts`)**
- A grid with letters in several cells → every active cell has
  `letter: null` afterward.
- Black cells are still `{ kind: 'black' }`; the black pattern is
  identical before and after.
- `cols` and `rows` are unchanged.
- A grid that already has no letters → result is cell-by-cell equal to the
  input (no-op).
- Purity: the input grid still holds its letters after the call.
- Two calls on the same input produce cell-by-cell equal results.
- Size is not assumed: works on a non-square, non-15×15 grid.

**M5-2 — clear flow (Playwright)**
- A seeded puzzle with letters shows `clear-letters-button`, with no
  confirmation visible initially.
- Clicking it reveals a confirmation containing "cannot be undone".
- Cancelling restores the trigger and leaves every letter in place.
- Confirming empties every lettered cell.
- Black cells remain black after clearing.
- The cleared grid survives a reload — the clear actually persisted.
- Clearing works the same way on a puzzle seeded in hints phase.

## Definition of done

1. `src/engine/grid.test.ts` passes with both its G1 and M5 cases (covered
   by `npm run verify`).
2. `e2e/clear-letters.spec.ts` passes: `npm run test:e2e`.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
