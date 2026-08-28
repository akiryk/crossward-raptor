# Story P3 — Cursor & letter editing

Fourth slice of the builder-UI epic, and the first with real client-side
interactivity. Wires clicks and keystrokes to Group F's engine functions
(`place`, `arrowKey`, `deleteAt`, `moveTo`), adds the visible "selected
cell" state a builder needs to know where they are, and saves edits back to
the database automatically, silently — no save button, no status
indicator, matching how NYT Crossword and Google Docs both just save
without announcing it.

Repo paths:
- `src/components/grid/PuzzleGridEditor.tsx` — new, `'use client'`, the
  interactive wrapper
- `src/components/grid/GridCell.tsx` — edited (existing file from P2): adds
  optional `isSelected` and `onClick` props
- `src/components/grid/EmptyCell.tsx`, `LetterCell.tsx`, `BlackCell.tsx` —
  edited (existing files from P2): accept and apply the same two props
- `src/lib/keyboard-intent.ts` — new, pure keydown-to-engine-intent mapping
- `src/lib/keyboard-intent.test.ts` — Vitest acceptance tests (**already
  provided — do not edit**)
- `src/app/puzzles/actions.ts` — edited (existing file from P1): adds
  `saveGrid`, the `savePuzzle`-shaped action deferred back in Story P1
- `src/app/puzzles/[id]/page.tsx` — edited (existing file from P1/P2):
  renders `<PuzzleGridEditor />` in place of P2's read-only `<PuzzleGrid />`
  (existing file — I haven't seen its current contents; if this conflicts,
  stop and say so, same assumption as every prior story touching it)
- `e2e/editing.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

## Required contract

```ts
// src/lib/keyboard-intent.ts
import type { ArrowDirection } from '../engine/cursor';

export type Intent =
  | { type: 'letter'; letter: string }
  | { type: 'delete' }
  | { type: 'arrow'; direction: ArrowDirection };

/** Maps a raw KeyboardEvent.key to an engine-level intent, or null if the
 *  key isn't one this app handles. Pure — no DOM, no React. */
export function keyToIntent(key: string): Intent | null;
```

```tsx
// src/components/grid/GridCell.tsx (extended)
import type { Cell } from '../../engine/grid';

export function GridCell(props: {
  cell: Cell;
  number?: number;
  isSelected?: boolean;
  onClick?: () => void;
}): JSX.Element;
```

`onClick` is attached uniformly to every cell, including black ones — see
Decisions for why this isn't special-cased by kind. `isSelected` only ever
applies to active cells in practice (the cursor invariant guarantees it
never references a black cell), but the prop itself is harmless to accept
on `BlackCell` too, for a uniform interface across all three cell kinds.

```ts
// src/app/puzzles/actions.ts (addition)
import type { SerializedGrid } from '../../lib/puzzle-storage';

export async function saveGrid(id: string, grid: SerializedGrid): Promise<void>;
```

```tsx
// src/components/grid/PuzzleGridEditor.tsx
'use client';
import type { SerializedGrid } from '../../lib/puzzle-storage';

export function PuzzleGridEditor(props: {
  puzzleId: string;
  initialGrid: SerializedGrid;
}): JSX.Element;
```

## Decisions

**The client reconstructs its own `Grid`; the server never sends one.**
This is what Story P2 flagged as its own open problem. `initialGrid` is a
plain `SerializedGrid` (already defined in `puzzle-storage.ts`, already
serializable) passed from the server-rendered page. `PuzzleGridEditor`
calls `deserializeGrid` once, client-side, on mount, and holds the live
`Grid` — with its closure-based `at()` — entirely in React state from then
on. Nothing crosses the server/client boundary except plain data.

**Silent, debounced autosave — no visible save state.** Per the human's
explicit call: real crossword-editing and document-editing tools don't
show "Saving…/Saved" chrome, and adding it here would be inventing UI
nothing asked for. `PuzzleGridEditor` debounces grid changes (500ms of no
further edits) before calling `saveGrid`. A failed save is logged to the
console, not surfaced in the UI — acceptable at this stage for a
single-user app; revisit if that stops being true.

**`onClick` is uniform across all cell kinds, including black.** The
alternative — withholding the handler from `BlackCell` specifically — would
duplicate, in the UI layer, exactly the no-op-on-black behavior `moveTo`
already guarantees (Story F). Attaching it everywhere and letting `moveTo`
decide what happens is simpler and avoids a redundant kind-based branch
that could drift out of sync with the engine's own rule.

**Initial cursor position is the first active cell in reading order, not a
hardcoded `(0,0)`, and initial orientation defaults to `'across'`.** Today's puzzles (via `createPuzzle`) are always fully
active, so `(0,0)` would work — but Story P4 adds black cells, and a puzzle
with `(0,0)` black would leave the cursor pointing at an invalid coord from
the start. Scanning for the first active cell costs little and keeps this
component correct once P4 lands, rather than needing a second look then. A
puzzle with *no* active cells at all is treated as the impossible state it
is (AGENTS.md rule 2) — not defended against.

**No click-to-toggle-orientation on re-clicking the selected cell.** Many
crossword UIs flip across/down when you click an already-selected cell.
`moveTo` (Story F) explicitly never changes orientation, by design. Adding
a toggle here would be new UI-level behavior on top of an engine contract
that deliberately doesn't offer it — worth doing later as its own
considered addition, not folded in silently now.

**Whole-word highlighting is deferred to Story P5, not built here.**
Highlighting every cell in the active slot (not just the single selected
cell) needs the same derived "active slot from cursor" computation that
Group P5's hint-highlighting needs. Building it once, alongside P5, avoids
computing it twice in two different stories. P3 only highlights the single
selected cell — enough to know where you are, not the full word.

## Scope discipline

- **No orientation indicator in the UI.** Typing and arrow keys behave
  correctly regardless of whether the builder consciously tracks
  across/down; a visible indicator is a nice-later-addition, not invented
  here.
- **No hints panel, no phase controls.** Story Groups P5 and P4.
- **No changes to `src/engine/`.** This story only consumes Group F's
  existing functions.
- **No changes to `PuzzleGrid.tsx` itself** (P2's read-only container) —
  only the individual cell components it composes gain the two new props,
  which `PuzzleGrid` simply doesn't pass (defaulting them away), keeping
  P2's read-only rendering path unchanged in behavior.
- **`saveGrid` only ever writes the `grid` column.** `hints` and `phase`
  are untouched — those belong to P4 and P5's own save paths when they
  exist.

## Acceptance examples

**P3-1 — `keyToIntent` (Vitest)**
- `'a'` through `'z'`, and their uppercase forms, all map to
  `{ type: 'letter', letter: <uppercased> }`.
- `'Backspace'` maps to `{ type: 'delete' }`.
- `'ArrowUp'`, `'ArrowDown'`, `'ArrowLeft'`, `'ArrowRight'` map to
  `{ type: 'arrow', direction: 'up' | 'down' | 'left' | 'right' }`
  respectively.
- `'1'`, `' '` (space), `'Shift'`, `'Enter'`, `'Escape'`, and any other
  unhandled key all map to `null`.
- Purity: two calls with the same key produce deep-equal results.

**P3-2 — editing flow (Playwright, seeded via the P2 helper)**
- Visiting a seeded puzzle's page shows exactly one cell with
  `data-selected="true"` — the first active cell in reading order.
- Clicking a different active cell moves `data-selected` to it; the
  previous cell no longer has it.
- Clicking a black cell leaves `data-selected` unchanged (no-op, per
  `moveTo`).
- Typing a letter writes it into the selected cell and advances selection
  to the next active cell in the current orientation, matching `place`'s
  rules from Story F (stopping at a black cell or the grid edge instead of
  wrapping).
- Pressing Backspace on a lettered cell clears it without moving selection;
  pressing it again (now empty) retreats selection and clears the cell
  behind it, matching `deleteAt`.
- Pressing arrow keys moves selection and updates orientation per
  `arrowKey`'s rules, including the "orientation still changes even when
  the move itself is blocked" case from Story F.
- Typing a letter, waiting past the debounce window, then reloading the
  page shows the same letter still present — proving the autosave path
  actually persisted it, not just updated local state.

## Definition of done

1. `npx vitest run src/lib/keyboard-intent.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/editing.spec.ts` passes: `npm run test:e2e`.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
