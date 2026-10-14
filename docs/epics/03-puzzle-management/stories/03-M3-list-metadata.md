# Story M3 — List metadata

Third slice of the puzzle-management epic. The list currently shows titles
and nothing else. This adds enough to tell puzzles apart at a glance: when
each was last worked on, what phase it's in, and — for puzzles already in
hints phase — whether its hints are finished.

Repo paths:
- `src/lib/puzzle-summary.ts` — new, `summarizePuzzle`
- `src/lib/puzzle-summary.test.ts` — Vitest acceptance tests (**already
  provided — do not edit**)
- `src/app/puzzles/actions.ts` — edited: `listPuzzles` widens its select
  and returns summary fields
- `src/app/puzzles/page.tsx` — edited: renders the new metadata
- `e2e/puzzle-list.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

## Required contract

```ts
// src/lib/puzzle-summary.ts
import type { StoredPuzzle } from './puzzle-storage';
import type { Phase } from '../engine/puzzle';

export interface PuzzleSummary {
  readonly phase: Phase;
  readonly hintsComplete: boolean;
}

/** Derives display-facing status from a stored puzzle row. Pure — no
 *  database, no React. `hintsComplete` uses the engine's existing rule
 *  (Story D): every required hint present and non-blank. */
export function summarizePuzzle(stored: StoredPuzzle): PuzzleSummary;
```

```ts
// src/app/puzzles/actions.ts (changed return type)
export async function listPuzzles(): Promise<
  {
    id: string;
    title: string;
    updatedAt: Date;
    phase: Phase;
    hintsComplete: boolean;
  }[]
>;
```

## Markup contract

Each existing `data-testid="puzzle-list-item"` row additionally carries:

- `data-phase="grid"` or `data-phase="hints"`
- `data-hints-complete="true"` or `"false"` — **always emitted**, even in
  grid phase, so tests can assert on it independently of what's visually
  shown
- `data-updated-at` — the ISO timestamp string

Visible text per row: the title, a formatted last-updated date, and a
phase-aware status (see Decisions).

## Decisions

**Status display is phase-aware; hint completeness is only shown in hints
phase.** A puzzle still in grid phase has no authored hints by definition,
so labelling every grid-phase puzzle "hints incomplete" would be noise
dressed up as information. Show `Grid` for grid-phase puzzles, and
`Hints — complete` / `Hints — incomplete` for hints-phase ones. The
`data-hints-complete` attribute is still emitted in both cases; it's the
*visible* indicator that's conditional.

**Sorting is already implemented — don't re-add it.** `listPuzzles`
already has `orderBy: { updatedAt: 'desc' }`. This story surfaces the date
that ordering is based on; it doesn't introduce the ordering.

**Compute hint completeness per request; store nothing.** Settled in the
epic. Be aware of where the cost actually sits: `listPuzzles` currently
selects three scalar columns, and this widens it to load every puzzle's
full `grid` and `hints` JSON on every visit. At this scale that's fine.
The `hintsComplete` call itself is trivial — if this ever needs
optimizing, the answer is a materialized flag updated on write, not a
faster computation.

**Format dates on the server only.** The list page is a Server Component,
so the formatted string is produced once, server-side. Don't move date
formatting into a client component — server and client can disagree about
locale and timezone, which produces a hydration mismatch. The raw ISO
value goes in `data-updated-at` precisely so tests can assert on something
stable rather than on locale-dependent display text.

**Absolute dates, not relative ones.** "Sep 6, 2026" rather than "2 days
ago". Relative formatting needs either a dependency or hand-rolled
threshold logic, and neither is worth it here.

**Check whether `createPuzzle` needs `revalidatePath` too.** Story M2
found that no action called `revalidatePath` before it, and added one to
`deletePuzzle`. It's worth confirming a newly created puzzle appears
immediately in the list — if it does today, change nothing and say so; if
it only works by accident of navigation, fix it to match `deletePuzzle`'s
pattern. **Unverified assumption** — check rather than assume either way.

## Scope discipline

- **No empty-state design.** If there are zero puzzles, whatever renders
  today is fine. Not worth designing against a state the test database
  never reaches.
- **No pagination, search, or filtering.** Explicit epic non-goals.
- **No changes to the list rows' link behavior.** Rows stay simple
  `<Link>`s — no actions embedded in them (that's what sent rename and
  delete to the detail page).
- **No new engine functions.** `hintsComplete` already exists and is used
  as-is.
- **No changes to the detail page**, `PuzzleTitle`, `PuzzleGridEditor`, or
  `DeletePuzzleButton`.

## Acceptance examples

**M3-1 — `summarizePuzzle` (Vitest)**
- A hints-phase puzzle with every required hint authored →
  `hintsComplete: true`, `phase: 'hints'`.
- The same puzzle with one hint blank (`''`) → `false`.
- The same puzzle with one required key absent → `false`.
- The same puzzle with one hint whitespace-only (`'   '`) → `false`.
- A grid-phase puzzle with no hints at all → `phase: 'grid'`,
  `hintsComplete: false`.
- A fully black grid (no slots) → `hintsComplete: true`, vacuously, per
  Story D — whatever `hints` holds.
- Extra keys matching no required hint don't affect the result.
- Purity: two calls on the same input are equal.

**M3-2 — list metadata (Playwright)**
- A puzzle seeded in grid phase → its row carries `data-phase="grid"` and
  shows a visible status of `Grid`, with no hint-completeness text.
- A puzzle seeded in hints phase with all required hints authored → its
  row carries `data-hints-complete="true"` and shows visible text
  indicating hints are complete.
- A puzzle seeded in hints phase with one blank hint → its row carries
  `data-hints-complete="false"` and shows visible text indicating hints
  are incomplete.
- Every row carries a non-empty `data-updated-at`.
- Of two puzzles seeded in sequence, the more recently created one appears
  **before** the older one in the list (assert relative order of those two
  specifically, not absolute positions — other spec files seed
  concurrently).

## Definition of done

1. `npx vitest run src/lib/puzzle-summary.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/puzzle-list.spec.ts` passes: `npm run test:e2e`.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
