# Story P2 — Grid rendering (read-only)

Third slice of the builder-UI epic. Renders a loaded `Puzzle`'s grid on its
detail page — black cells, letters, and the small corner numbers that make
it read as a crossword at all. No interactivity yet: no clicking, no
keyboard, no cursor. That's Story Group P3. This story only has to prove
the grid displays correctly and responsively.

Repo paths:
- `src/components/grid/PuzzleGrid.tsx` — new, the grid container
- `src/components/grid/GridCell.tsx` — new, dispatcher (named `GridCell`,
  not `Cell`, to avoid colliding with the engine's own `Cell` type from
  `grid.ts`)
- `src/components/grid/BlackCell.tsx` — new
- `src/components/grid/EmptyCell.tsx` — new
- `src/components/grid/LetterCell.tsx` — new
- `src/components/grid/CellNumber.tsx` — new
- `src/lib/cell-number-lookup.ts` — new, pure coord->number lookup built
  from `numberGrid`
- `src/lib/cell-number-lookup.test.ts` — Vitest acceptance tests (**already
  provided — do not edit**)
- `src/app/puzzles/[id]/page.tsx` — edited, renders `<PuzzleGrid />`
  alongside the existing `puzzle-title`/`puzzle-phase` elements from Story
  P1 — those must not be removed, `persistence.spec.ts` still depends on
  them (existing file from P1 — I haven't seen its current contents; if it
  conflicts with what's below, stop and say so, same assumption as P0/P1)
- `e2e/helpers/seed-puzzle.ts` — new, direct-to-`TEST_DATABASE_URL` test
  data seeding (see Decisions — this is test infrastructure, not app code)
- `e2e/grid-rendering.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

## Required contract

```ts
// src/lib/cell-number-lookup.ts
import type { Coord, Grid } from '../engine/grid';

export function cellNumberKey(coord: Coord): string;
export function buildCellNumberLookup(grid: Grid): ReadonlyMap<string, number>;
```

```tsx
// src/components/grid/PuzzleGrid.tsx
import type { Grid } from '../../engine/grid';

export function PuzzleGrid({ grid }: { grid: Grid }): JSX.Element;
```

```tsx
// src/components/grid/GridCell.tsx
import type { Cell } from '../../engine/grid';

export function GridCell({ cell, number }: { cell: Cell; number?: number }): JSX.Element;
```

`BlackCell` takes no props. `EmptyCell` and `LetterCell` both take an
optional `number?: number`; `LetterCell` additionally takes `letter:
string`. `CellNumber` takes a required `number: number` — the decision of
*whether* to show one is the parent's job, not `CellNumber`'s.

## Markup contract (Playwright depends on these exactly)

- Each cell renders as an element with `data-testid="grid-cell"`,
  `data-coord="{col},{row}"`, and `data-kind="black"` or `data-kind="active"`.
- A rendered number gets `data-testid="cell-number"`, with the number as its
  visible text.
- A rendered letter is the cell's visible text content directly (no extra
  wrapper needed for that specifically).

## Decisions

**Every component in this story is a Server Component — no `'use client'`
anywhere.** This isn't a style preference; it avoids a real problem. A
`Grid`'s `at(col, row)` method is a closure over private cell data, not
serializable data — if `PuzzleGrid` were a Client Component, passing a
`Grid` to it as a prop across the server/client boundary would fail (React
can't serialize a function to send to the browser). Since P2 has no
interactivity yet, there's no reason for any of this to run client-side:
`/puzzles/[id]/page.tsx` calls `grid.at(...)` entirely on the server while
rendering. **This becomes P3's problem, not P2's** — once cursor/click
handling needs client-side state, something will have to change (most
likely: the client holds a serialized/plain-object form of the grid, not
the live `Grid` with its closure). Flagging now so it isn't a surprise
later; not solving it here.

**Grid sizing uses inline styles, not Tailwind utility classes, for the
column count and aspect ratio.** Both depend on the puzzle's actual
`cols`/`rows`, which vary per puzzle and aren't known until render time.
Tailwind's build-time scanner only picks up utility classes that appear as
complete, static strings in source — a template-literal class like
`` `aspect-[${cols}/${rows}]` `` is invisible to it and silently won't be
included in the generated CSS. `grid-template-columns` and `aspect-ratio`
must be set via the `style` prop instead:
`style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)`, aspectRatio: `${grid.cols} / ${grid.rows}` }}`.
Anything that's a fixed, literal class name (like `text-[0.6em]` on
`CellNumber`, which doesn't depend on any prop) is fine as a Tailwind class
— the distinction is static-vs-dynamic, not inline-vs-Tailwind in general.

**`cellNumberKey` duplicates, rather than imports, `numbering.ts`'s
internal key format.** `numbering.ts`'s own `startCellKey` isn't exported —
it's a private implementation detail of `numberGrid`/`slotsWithNumbers`.
Rather than exporting it from the engine just for this, `cell-number-
lookup.ts` defines its own equivalent (`${row},${col}`). It doesn't need to
match `numbering.ts`'s exact format, only to be internally consistent with
itself; duplicating one trivial string-formatting function is simpler than
widening the engine's public surface for it.

**Letters use the `font-data` token from Story P0.** That token's role was
named for exactly this — grid letters — when P0 set up the `@theme` block.

**Testing black cells and letters needs seeded data, not the default
puzzle.** `createPuzzle` (Story P1) always produces a fully active,
letterless 15x15 grid — there's no UI yet to produce a puzzle with black
cells or letters (that's Group P4/P3). So `e2e/grid-rendering.spec.ts`
can't exercise `BlackCell`/`LetterCell` against anything created through
the app itself. `e2e/helpers/seed-puzzle.ts` writes a row directly to
`TEST_DATABASE_URL` via a `PrismaClient` scoped to that connection string,
using `serializePuzzle` from Story P1 — bypassing the Server Actions
entirely rather than adding an app-facing "create with custom grid"
capability that nothing else needs yet. This is test infrastructure, not a
production code path, and stays out of `src/app/`.

## Scope discipline

- **No interactivity.** No `onClick`, no keyboard handling, no cursor
  state. Story Group P3.
- **No hints panel.** Story Group P5.
- **No phase-aware styling** (e.g. dimming the grid in hints phase). Story
  Group P4 territory once there's a phase control to react to.
- **No changes to `src/engine/`.** This story only consumes
  `Grid`/`Cell`/`numberGrid`, adding nothing to them.
- **No changes to Story P1's Server Actions or schema.**
- **`e2e/helpers/seed-puzzle.ts` is not imported by any app code** — it
  exists solely for `grid-rendering.spec.ts` and future e2e specs that need
  non-default puzzle data.

## Acceptance examples

**P2-1 — `cell-number-lookup` (Vitest)**
- A fully active 3x3 grid (per Story E's own numbering example) →
  `buildCellNumberLookup` maps `(0,0)` to `1`, `(1,0)` to `2`, `(2,0)` to
  `3`, `(0,1)` to `4`, `(0,2)` to `5`; no entry exists for `(1,1)`, `(2,1)`,
  `(1,2)`, `(2,2)` (not lookup-miss errors — simply absent keys).
  Numbering here is Group C/`numberGrid`'s output, taken as-given, so this
  test only ties the map back to what the grid actually contains, not what
  particular constant numbers should be.
- A fully black grid → `buildCellNumberLookup` returns an empty map.
- Two calls on the same grid produce equal maps (purity).

**P2-2 — grid rendering (Playwright)**
- A puzzle seeded with a 3x3 fully active grid, letters `C A T / A / T`
  written at a few coords, and a black cell at `(2,2)` (an arbitrary
  concrete shape — exact letters don't matter, only that they're present)
  → visiting `/puzzles/{id}` shows 9 `grid-cell` elements total, exactly
  one with `data-kind="black"`, the rest `data-kind="active"`; cells with a
  written letter show that letter as text; `data-testid="cell-number"`
  appears only at coords `numberGrid` assigns a number to, showing the
  correct number.
- A puzzle seeded with `createBlankPuzzle()`'s default shape (15x15, fully
  active) → 225 `grid-cell` elements, zero with `data-kind="black"`.
- At a phone-width viewport (375×667) and a laptop-width viewport
  (1280×800), the grid is visible with no horizontal overflow on the page
  (same check as Story P0's shell tests).

## Definition of done

1. `npx vitest run src/lib/cell-number-lookup.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/grid-rendering.spec.ts` passes: `npm run test:e2e`.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
