# Story P5 — Hints panel

Sixth and final slice of the builder-UI epic (P4 and P5 both only depend on
cursor state, not each other — this can land in either order relative to
P4, per the epic's own build-order note). Renders required hints with
editable text, only once `phase === 'hints'` — never before, matching the
earlier discussion that a builder shouldn't see hint fields while still
shaping the grid. Adds the bidirectional highlight between cells and hints,
and finally builds the whole-slot grid highlight that Story P3 explicitly
deferred to this story.

Repo paths:
- `src/lib/hint-lookup.ts` — new, pure slot/cursor/hint-completeness logic
- `src/lib/hint-lookup.test.ts` — Vitest acceptance tests (**already
  provided — do not edit**)
- `src/components/grid/HintsPanel.tsx` — new
- `src/components/grid/GridCell.tsx`, `EmptyCell.tsx`, `LetterCell.tsx` —
  edited (existing files from P2/P3): `isSelected?: boolean` is replaced
  with `highlight?: 'selected' | 'slot'` — see Decisions, this is a
  breaking rename, not an addition
- `src/components/grid/PuzzleGrid.tsx` — edited, or possibly reconciled —
  see "Repo-state assumption" below before touching this file
- `src/app/puzzles/actions.ts` — edited (existing file): `enterHints`'s
  return type gains `hints`; new `saveHints` action added
- `src/components/grid/PuzzleGridEditor.tsx` — edited (existing file):
  adds `hints` state, renders `HintsPanel` when `phase === 'hints'`, wires
  the new highlight/focus behavior
- `src/app/puzzles/[id]/page.tsx` — edited (existing file): passes
  `initialHints` (same "stop if it conflicts" assumption as every prior
  story touching this file)
- `e2e/hints-panel.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

## Repo-state assumption — read before touching `PuzzleGrid.tsx`

Story P3's own scope discipline said `PuzzleGrid.tsx` would **not** be
edited — only the individual cell components would gain new props, with
`PuzzleGrid` simply not passing them. But `PuzzleGridEditor` needs a
click handler and per-cell highlight state to reach `GridCell`, and
`PuzzleGrid`'s props (per that same story) never grew to carry either. Put
together with CC's own P3 completion report — which listed the edited
files and did not include `PuzzleGrid.tsx` — the likely reality is that
`PuzzleGridEditor` ended up composing its own grid-layout container
directly (duplicating the `grid-template-columns`/`aspect-ratio` inline-
style pattern from Story P2), rather than reusing `PuzzleGrid`, which may
now be orphaned. That P3 scope note was mine, and in hindsight it was the
wrong call — it's what led to this.

**This story is where to fix it, since it needs the same per-cell highlight
capability regardless.** Extend `PuzzleGrid.tsx` to accept the props below,
and have `PuzzleGridEditor` render `<PuzzleGrid />` rather than
duplicating its layout — consolidating back to one place that owns the
grid container markup. If it turns out `PuzzleGrid` was already being
reused some other way, reconcile accordingly and report which was
actually true — don't guess silently either way.

## Required contract

```ts
// src/lib/hint-lookup.ts
import type { Grid } from '../engine/grid';
import type { CursorState } from '../engine/cursor';
import type { NumberedSlot } from '../engine/numbering';

/** Every slot in the grid, keyed by hintKey({number, orientation}). */
export function buildSlotLookup(grid: Grid): ReadonlyMap<string, NumberedSlot>;

/** The key of whichever slot contains the cursor's current cell in its
 *  current orientation, or null if no such slot exists (e.g. the cell is
 *  only part of an across run and the cursor is oriented 'down'). */
export function activeHintKey(
  lookup: ReadonlyMap<string, NumberedSlot>,
  cursor: CursorState
): string | null;

/** Same "non-blank" rule Story D's hintsComplete uses, at single-hint
 *  granularity rather than whole-puzzle. */
export function isHintFilled(hints: Record<string, string>, key: string): boolean;
```

```tsx
// src/components/grid/PuzzleGrid.tsx (extended)
import type { Coord, Grid } from '../../engine/grid';

export function PuzzleGrid(props: {
  grid: Grid;
  /** Keyed via cellNumberKey (Story P2) — "row,col". */
  highlights?: ReadonlyMap<string, 'selected' | 'slot'>;
  onCellClick?: (coord: Coord) => void;
}): JSX.Element;
```

```tsx
// src/components/grid/GridCell.tsx (highlight prop replaces isSelected)
export function GridCell(props: {
  cell: Cell;
  number?: number;
  highlight?: 'selected' | 'slot';
  onClick?: () => void;
}): JSX.Element;
```

`'selected'` is the exact cursor cell (full-strength `--color-selected`
styling, same visual weight P3 already built). `'slot'` is every other
cell in the active slot (a visibly lighter version of the same token — not
a second, unrelated token; this is "the same word," not a different kind
of thing). `BlackCell` doesn't need this prop at all — a black cell can
never be a member of any slot's `cells`, by construction (Story B).

```tsx
// src/components/grid/HintsPanel.tsx
import type { NumberedSlot } from '../../engine/numbering';

export function HintsPanel(props: {
  slots: ReadonlyMap<string, NumberedSlot>;
  hints: Record<string, string>;
  activeKey: string | null;
  onHintChange: (key: string, text: string) => void;
  onHintFocus: (key: string) => void;
}): JSX.Element;
```

```ts
// src/app/puzzles/actions.ts (changes)
import type { Phase } from '../../engine/puzzle';

// return type extended — was Promise<{ phase: Phase }> in Story P4
export async function enterHints(id: string): Promise<{ phase: Phase; hints: Record<string, string> }>;

export async function saveHints(id: string, hints: Record<string, string>): Promise<void>;
```

```tsx
// src/components/grid/PuzzleGridEditor.tsx (extended)
export function PuzzleGridEditor(props: {
  puzzleId: string;
  initialGrid: SerializedGrid;
  initialPhase: Phase;
  initialHints: Record<string, string>;
}): JSX.Element;
```

## Markup contract

- `HintsPanel` renders nothing at all when `phase !== 'hints'` — not
  hidden via CSS, not disabled, simply absent, same treatment P4 gave the
  "Enter hints" button's own visibility.
- Each hint gets `data-testid="hint-row"`, `data-hint-key="{key}"`,
  `data-complete="true"|"false"` (per `isHintFilled`), and
  `data-active="true"` only on the one matching the current `activeKey`.
  Contains a `data-testid="hint-input"` text input.
- Grid cells get `data-highlight="selected"` or `data-highlight="slot"`
  when applicable; the attribute is simply absent otherwise (not
  `data-highlight="none"`).

## Decisions

**`slotsWithNumbers`, not `requiredHints`, is the primary data source —
even though the epic's own Group P5 description names `requiredHints`.**
`requiredHints` returns `{number, orientation}` pairs with no coordinates —
enough to know *which* hints are required, but not enough to jump the
cursor to a slot's start when a hint is focused, or to know which grid
cells belong to the active slot for highlighting. `slotsWithNumbers`
carries the same information plus `start` and `cells`, a strict superset.
Using it as the one source avoids computing overlapping-but-different data
twice; `hintKey` (from `hints.ts`) is still reused for the map keys, so the
string format stays identical to what Story D and P1's persisted `hints`
object already use.

**`isHintFilled` is a small standalone predicate, not a reuse of
`hintsComplete`.** `hintsComplete(puzzle)` answers one aggregate
true/false for the *whole* puzzle. The hints panel needs a per-hint
answer, to mark each one individually. It deliberately encodes the exact
same rule D already established (present and non-whitespace) rather than
inventing a different definition of "complete" at this smaller grain.

**Whole-slot highlighting finally lands here, as promised back in Story
P3.** The `'selected'` vs `'slot'` distinction is the payoff of that
deferral — computing "which cells share the active slot" only once, here,
rather than needing it half-built in P3 and finished later.

**`saveHints` saves the whole `hints` object, not a per-key diff** — same
"save the whole field, not a granular patch" pattern `saveGrid` already
established in Story P3. Debounced the same way, on the same 500ms
interval, no new persistence pattern invented.

**No symmetry-warning confirmation before entering hints phase.** Raised
and explicitly deferred past MVP in the design discussion for this story —
not something this story adds.

## Scope discipline

- **No changes to `src/engine/`.**
- **No autofill, no dictionary suggestions, no hint-quality checking.**
  Text fields are plain text, nothing more.
- **No changes to `PhaseControls.tsx`'s button label or the (explicitly
  deferred) symmetry-warning confirmation.**
- **Letter editing and geometry toggling are unaffected** — this story
  only adds the hints layer on top of what P3/P4 already built.

## Acceptance examples

**P5-1 — `hint-lookup` (Vitest)**
- On the 3x3-grid-with-black-at-`(2,2)` shape from Story P2's own test
  fixture: `buildSlotLookup` returns exactly 6 entries — `1-across`,
  `4-across`, `5-across`, `1-down`, `2-down`, `3-down`.
- `activeHintKey` with cursor `{ current: (0,0), orientation: 'across' }`
  → `'1-across'`; same coord, orientation `'down'` → `'1-down'`.
- `activeHintKey` with cursor `{ current: (1,1), orientation: 'down' }` (a
  non-start cell, mid-slot) → `'2-down'` — proving membership isn't
  limited to a slot's start cell.
- `activeHintKey` on a coordinate whose orientation has no corresponding
  slot → `null`.
- `isHintFilled`: missing key → `false`; `''` → `false`; `'   '` → `false`;
  `'A real clue'` → `true`.

**P5-2 — hints panel (Playwright, seeded directly in `'hints'` phase)**
- A puzzle seeded with `phase: 'hints'` and a few hints pre-filled, others
  blank → visiting its page shows one `hint-row` per required hint, with
  `data-complete` matching seeded content correctly.
- Clicking a grid cell sets `data-active="true"` on the matching
  `hint-row` and clears it from the previously active one.
- Typing a letter (still works per P3/P4) shows `data-highlight="selected"`
  on the exact cursor cell and `data-highlight="slot"` on every other
  active cell sharing that slot.
- Clicking into a `hint-input` moves the grid's selection to that slot's
  start cell.
- Editing hint text, waiting past the debounce window, then reloading
  shows the same text still present.
- A puzzle seeded with `phase: 'grid'` shows zero `hint-row` elements —
  the panel doesn't render at all, not merely hidden.

## Definition of done

1. `npx vitest run src/lib/hint-lookup.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/hints-panel.spec.ts` passes: `npm run test:e2e`.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
