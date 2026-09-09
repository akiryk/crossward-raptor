# Story D6 — New-puzzle dialog

Final slice of the visual-design epic. Clicking "New puzzle" now asks for a
name and a size before the puzzle exists, instead of creating an untitled
15×15 immediately.

This removes "Untitled Puzzle" at the source, and delivers the puzzle-size
options that epic 3 deliberately deferred as a non-goal.

**This is a high-blast-radius story** per `docs/CODE-REVIEW.md`: it touches
`src/lib/puzzle-storage.ts` and `src/app/puzzles/actions.ts`. It goes on a
branch and opens a PR rather than merging to `main`.

Repo paths:
- `src/lib/puzzle-size.ts` — new
- `src/lib/puzzle-size.test.ts` — Vitest acceptance tests (**already
  provided — do not edit**)
- `src/lib/puzzle-storage.ts` — edited: `createBlankPuzzle` takes a size
- `src/app/puzzles/actions.ts` — edited: `createPuzzle` takes title and size
- `src/components/puzzle/NewPuzzleDialog.tsx` — new
- `src/components/puzzle/NewPuzzleButton.tsx` — edited: opens the dialog
- `e2e/new-puzzle.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)
- `e2e/persistence.spec.ts` — edited (**already provided — do not edit**;
  authorized changes, see below)

`src/lib/puzzle-storage.test.ts` needs **no** changes — see Decisions.

## Required contract

```ts
// src/lib/puzzle-size.ts
export type PuzzleSize = 'mini' | 'daily' | 'sunday';

export interface Dimensions {
  readonly cols: number;
  readonly rows: number;
}

export const DEFAULT_SIZE: PuzzleSize = 'daily';

/** mini 5x5, daily 15x15, sunday 21x21. */
export function dimensionsFor(size: PuzzleSize): Dimensions;
```

```ts
// src/lib/puzzle-storage.ts (signature widened, default preserved)
export function createBlankPuzzle(size?: PuzzleSize): Puzzle;
```

```ts
// src/app/puzzles/actions.ts (signature widened)
export async function createPuzzle(input: {
  title: string;
  size: PuzzleSize;
}): Promise<{ id: string }>;
```

```tsx
// src/components/puzzle/NewPuzzleDialog.tsx
export function NewPuzzleDialog(props: {
  onCancel: () => void;
  onCreate: (input: { title: string; size: PuzzleSize }) => void;
}): JSX.Element;
```

## Markup contract

- `new-puzzle-button` keeps its test id. Clicking it opens the dialog
  rather than creating a puzzle.
- `data-testid="new-puzzle-dialog"` — the dialog, with `role="dialog"`.
- `data-testid="new-puzzle-name"` — the name input, focused on open.
- `data-testid="new-puzzle-size"` containing one control per size, each
  with `data-size="mini" | "daily" | "sunday"` and
  `data-selected="true"|"false"`. `daily` is selected on open.
- `data-testid="new-puzzle-create"` — disabled while the name is blank.
- `data-testid="new-puzzle-cancel"`.
- Escape closes the dialog without creating anything.

## Decisions

**`createBlankPuzzle`'s size parameter is optional, defaulting to
`'daily'`.** That keeps 15×15 as the no-argument behaviour, so Story P1's
committed `puzzle-storage.test.ts` — which asserts `createBlankPuzzle()`
returns a 15×15 — passes untouched. Widening a signature without breaking
its existing contract is worth the small effort here.

**A name is required; blank can't be submitted.** The point of the dialog
is that untitled puzzles stop existing. `normalizeTitle`'s fallback stays
where it is for the rename path — a builder clearing the title field later
still gets "Untitled Puzzle" rather than an empty one — but creation
requires a real name up front.

**Three named sizes, not free dimensions.** mini 5×5, daily 15×15, sunday
21×21, matching the conventions recorded in
`docs/NYT-CROSSWORD-REFERENCE.md`. Arbitrary dimensions are a different
feature; the engine supports them, nothing asks for them yet.

**The dialog creates, then navigates** — same as the old button did, just
with real inputs. Cancelling creates nothing.

**Authorized edits to `persistence.spec.ts`.** Three of its four tests
click `new-puzzle-button` and expect a puzzle immediately. They now fill
the dialog first and assert the name they typed rather than "Untitled
Puzzle". The fourth (nonexistent id → 404) is unchanged. These are
consequences of the flow this story deliberately changes, not weakenings —
the same assertions about persistence still hold, just after one more
step.

## Scope discipline

- **No arbitrary grid dimensions.** Three presets.
- **No renaming from the dialog.** Renaming is M1's inline title.
- **No changes to `normalizeTitle` or its tests.**
- **No engine changes.** `createGrid` already accepts any dimensions.
- **No changes to the detail page, grid, hints, or stepper.**
- **No template or duplicate-from-existing option.** Duplicate was removed
  in D7 and isn't coming back here.

## Acceptance examples

**D6-1 — `puzzle-size` (Vitest)**
- `dimensionsFor('mini')` → 5×5; `'daily'` → 15×15; `'sunday'` → 21×21.
- `DEFAULT_SIZE` is `'daily'`.
- Purity: two calls return equal results.

**D6-2 — `createBlankPuzzle` (Vitest)**
- `createBlankPuzzle()` still returns a 15×15, fully active, empty-hints,
  grid-phase puzzle — Story P1's behaviour, unchanged.
- `createBlankPuzzle('mini')` returns a 5×5; `'sunday'` a 21×21.
- Every cell is active with no letter, at every size.

**D6-3 — the dialog (Playwright)**
- Clicking `new-puzzle-button` opens `new-puzzle-dialog`; no navigation
  happens and no puzzle is created yet.
- The name input is focused on open.
- `daily` is selected by default.
- `new-puzzle-create` is disabled while the name is blank, and enabled
  once a name is typed.
- Cancelling closes the dialog and creates nothing — the list is unchanged.
- Escape closes the dialog too.
- Creating with a name and `mini` navigates to the new puzzle, whose title
  is the typed name and whose grid has 25 cells.
- Creating with `sunday` yields 441 cells.
- Creating with the default yields 225 cells.
- The new puzzle appears in the list under its typed name.

## Definition of done

1. `npx vitest run src/lib/puzzle-size.test.ts` passes (covered by
   `npm run verify`).
2. `src/lib/puzzle-storage.test.ts` passes **unmodified**.
3. `e2e/new-puzzle.spec.ts` and `e2e/persistence.spec.ts` pass.
4. Every other spec passes unmodified. **Check rather than assume.**
5. `tsc --noEmit` is clean across the repo.
6. Lint is clean.
7. `npm run verify` exits 0.
8. Opened as a PR, not merged — this story is high blast radius.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
