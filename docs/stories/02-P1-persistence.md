# Story P1 — Persistence

Second slice of the builder-UI epic, and the one that makes "more than one
puzzle" real. Adds a Prisma schema mapping the engine's `Puzzle` shape to
storable JSON, Server Actions for create/list/load, and bare-bones pages —
a `/puzzles` list with a "New Puzzle" action, and a `/puzzles/[id]` detail
route that proves a puzzle round-trips through the database. Real grid
rendering on that detail route is Story Group P2's job; this story's detail
page shows just enough to prove persistence works.

Repo paths:
- `prisma/schema.prisma` — new, the `Puzzle` model
- `src/lib/prisma.ts` — new, shared `PrismaClient` singleton
- `src/lib/puzzle-storage.ts` — new, pure `Grid`/`Puzzle` <-> JSON
  conversion and the default blank-puzzle factory
- `src/lib/puzzle-storage.test.ts` — Vitest acceptance tests for the above
  (**already provided — do not edit**)
- `src/app/puzzles/actions.ts` — new, `'use server'` — `createPuzzle`,
  `listPuzzles`, `loadPuzzle`
- `src/app/puzzles/page.tsx` — new, the `/puzzles` list + "New Puzzle"
- `src/app/puzzles/[id]/page.tsx` — new, minimal detail route
- `src/app/puzzles/[id]/not-found.tsx` — new, shown when `loadPuzzle`
  returns `null`
- `src/app/page.tsx` — edited, links to `/puzzles` (existing file from P0)
- `playwright.config.ts` — edited, loads `.env` and overrides `DATABASE_URL`
  with `TEST_DATABASE_URL` for the e2e webServer (existing file from the
  earlier Playwright setup — I haven't seen its current contents; if
  anything below conflicts with what's already there, stop and say so
  rather than guessing how to merge it, same as Story P0's assumption)
- `e2e/persistence.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

## Prerequisites (human, not CC — `.env*` is off-limits to CC)

Before this story can be implemented:
1. `.env.development.local` (from `vercel env pull`) already contains
   `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) — nothing
   needs to be hand-copied into a separate file. Prisma should be pointed
   *at* this file rather than requiring its own — see the schema and env-
   loading notes below.
2. `TEST_DATABASE_URL` is not part of Neon's standard Vercel-injected set —
   it's specific to this repo's e2e-isolation setup. Once the dedicated
   `e2e-test` Neon branch exists (created *after* the first migration, so
   it starts from an already-migrated schema — see the Test-database
   isolation section), add `TEST_DATABASE_URL` as a real environment
   variable in the Vercel dashboard (Development scope), then re-run
   `vercel env pull .env.development.local` to refresh the local file. This
   keeps everything in the one Vercel-managed file rather than a second,
   hand-maintained one.
3. Prisma's env loading is version-dependent — older Prisma auto-loads
   `.env` only; Prisma v7 requires explicit loading via `prisma.config.ts`.
   Either way, CC should point that loading at `.env.development.local`
   specifically (e.g. `dotenv.config({ path: '.env.development.local' })`
   in `prisma.config.ts`, or a `dotenv-cli`-wrapped npm script for older
   Prisma), not assume the default `.env` filename. CC should confirm the
   installed Prisma major version before choosing the mechanism.

## Required contract

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}

model Puzzle {
  id        String   @id @default(cuid())
  title     String   @default("Untitled Puzzle")
  grid      Json
  hints     Json
  phase     String   @default("grid")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```ts
// src/lib/puzzle-storage.ts
import type { Coord, Grid } from '../engine/grid';
import type { Puzzle, Phase } from '../engine/puzzle';

export type SerializedCell =
  | { kind: 'black' }
  | { kind: 'active'; letter: string | null };

export interface SerializedGrid {
  cols: number;
  rows: number;
  cells: SerializedCell[][]; // cells[row][col]
}

export function serializeGrid(grid: Grid): SerializedGrid;
export function deserializeGrid(data: SerializedGrid): Grid;

export interface StoredPuzzle {
  grid: SerializedGrid;
  hints: Record<string, string>;
  phase: Phase;
}

export function serializePuzzle(puzzle: Puzzle): StoredPuzzle;
export function deserializePuzzle(stored: StoredPuzzle): Puzzle;

/** A fresh 15x15, fully active, unauthored puzzle in the 'grid' phase. */
export function createBlankPuzzle(): Puzzle;
```

```ts
// src/app/puzzles/actions.ts
'use server';

export async function createPuzzle(): Promise<{ id: string }>;
export async function listPuzzles(): Promise<
  { id: string; title: string; updatedAt: Date }[]
>;
export async function loadPuzzle(id: string): Promise<Puzzle | null>;
```

`savePuzzle` is deliberately not part of this story — see Scope discipline.

## Markup contract for `/puzzles` and `/puzzles/[id]`

The Playwright tests depend on these hooks specifically:

- `/puzzles` page: a `<button data-testid="new-puzzle-button">` that calls
  `createPuzzle` and navigates to the new puzzle's `/puzzles/[id]`; the list
  itself as `<ul data-testid="puzzle-list">` containing one
  `<a href="/puzzles/{id}" data-testid="puzzle-list-item">` per puzzle.
- `/puzzles/[id]` page: `data-testid="puzzle-title"` and
  `data-testid="puzzle-phase"` elements showing the loaded puzzle's title
  and phase as visible text.
- `/puzzles/[id]/not-found.tsx`: a `data-testid="puzzle-not-found"` element
  with clear text (e.g. "Puzzle not found"), rendered via Next.js's
  `notFound()` when `loadPuzzle` returns `null`.

## Decisions

**JSON storage, not normalized tables.** `grid` and `hints` are stored as
Prisma `Json` columns holding the shapes above, not one row per cell. This
was left open when the epic was drafted; settled here per "simplicity
first" — nothing about this story or the ones after it needs per-cell
queries, so normalizing would be speculative structure with no current use.

**`Grid` is serialized as a full 2D array, not a `black`-coords-plus-letters
diff.** `createGrid`'s constructor takes a sparse `black: Coord[]` list, and
storing the same sparse shape would be more compact — but reconstructing a
`Grid` correctly from a sparse letters-plus-black-coords representation
means re-deriving which coords are letter-bearing versus not, which is
exactly the kind of bug-prone reimplementation Story G was written to
avoid. A full `cells[row][col]` array is directly built from repeated
`grid.at(col, row)` calls and directly consumed by `createGrid` (for the
black pattern) plus repeated `withLetter` calls (for any non-null letters)
— it reuses the engine's existing functions rather than duplicating grid
construction logic, at the cost of a larger JSON blob. At this puzzle's
scale (dozens of cells), that cost is irrelevant.

**No `savePuzzle` in this story.** The epic's own P1 description lists
"create/list/load/save," but there is no edit UI yet to call it — Groups P2
(read-only rendering) and P3 (cursor/letter editing) come after this one.
Shipping a write path nothing exercises is exactly what this repo's
practice has consistently avoided (Story D, E, F, G all only ship what
their acceptance tests exercise). `savePuzzle` belongs to Story P3, built
alongside the first edit that needs to call it.

**No input validation on deserialization.** `deserializePuzzle` trusts the
shape coming out of Prisma's `Json` columns rather than runtime-validating
it (e.g. with a schema library). This is a single-user app writing and
reading only its own data via `serializePuzzle`/`createBlankPuzzle` — there
is no untrusted external input to guard against yet. Revisit if that
changes (e.g. an import/upload feature).

**Default puzzle is 15x15, fully active, empty hints, `'grid'` phase.**
Matches the standard size referenced throughout the grid-engine epic's own
examples. No puzzle-size picker in this story — one size, decided now,
changeable later without difficulty since `createBlankPuzzle` is a single
function.

**No title-editing UI.** Every new puzzle is titled "Untitled Puzzle" (the
schema default). Renaming is a future story, not invented here.

## Test-database isolation

`playwright.config.ts`'s `webServer` entry must launch the dev server with
`DATABASE_URL` overridden to `TEST_DATABASE_URL`'s value, so
`e2e/persistence.spec.ts` never touches the real database — per the
decision made earlier in this epic, before this pattern got copied by every
later story's tests. Concretely:

```ts
// playwright.config.ts — additions
import { config } from 'dotenv';
config({ path: '.env.development.local' }); // so process.env.TEST_DATABASE_URL exists here

// inside the webServer entry:
webServer: {
  // ...existing command/url/reuseExistingServer...
  env: {
    DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
  },
},
```

A directly-set `env` value on a spawned child process takes precedence over
whatever Next.js's own `.env*` loading would otherwise set — dotenv-style
loaders don't override a variable that's already present in the process
environment. `npm run dev` (used for everyday local development, not
through Playwright) is unaffected and keeps using the real `DATABASE_URL`
from `.env.development.local` as before.

**Document this in `AGENTS.md` or `README.md`**, per the earlier discussion
about not letting this convention get silently forgotten: a short note that
`e2e/` tests run against a dedicated Neon branch (`TEST_DATABASE_URL`), not
the real database, and that the test branch is not automatically cleaned up
— acceptable at current scale, worth revisiting if it grows.

## Scope discipline

- **No grid rendering.** `/puzzles/[id]` shows enough to prove the puzzle
  loaded correctly (its id, title, and phase is sufficient) — not a
  rendered grid. That's Story Group P2.
- **No editing, no `savePuzzle`.** See Decisions.
- **No authentication.** Anyone with a puzzle's URL can view it — matches
  the epic's non-goals.
- **No pagination on `/puzzles`.** A flat list is fine at this scale.
- **No engine changes.** `serializeGrid`/`deserializeGrid` consume the
  engine's existing public API (`Grid.at`, `createGrid`, `withLetter`) and
  add nothing to `src/engine/`.
- **No changes to Story P0's files** beyond `app/page.tsx` linking to
  `/puzzles`, and no changes to its token/shell contract.

## Acceptance examples

**P1-1 — `puzzle-storage` (Vitest)**
- `serializeGrid`/`deserializeGrid` round-trip a fully active grid, a grid
  with black cells, and a grid with letters written via `withLetter` — the
  deserialized grid is deep-equal (cell by cell) to the original.
- `serializePuzzle`/`deserializePuzzle` round-trip preserves `hints` content
  and `phase` exactly.
- `createBlankPuzzle()` returns a 15x15 grid, every cell active, no
  letters, `hints: {}`, `phase: 'grid'`.
- Two calls to `createBlankPuzzle()` are deep-equal to each other (purity;
  no shared mutable default lurking anywhere).

**P1-2 — persistence flow (Playwright, against `TEST_DATABASE_URL`)**
- Visiting `/puzzles`, noting the current list length, clicking "New
  Puzzle" → navigates to a `/puzzles/[id]` route; that page shows the new
  puzzle's phase (`grid`) and default title ("Untitled Puzzle").
- Reloading that same `/puzzles/[id]` page shows the same content —
  proving the data came from the database, not from in-memory state that a
  reload would lose.
- Returning to `/puzzles` afterward shows the list length increased by
  exactly one (not asserting an absolute count, since the test branch may
  carry data from prior runs).
- Visiting `/puzzles/`, followed by an id that was never created, shows a
  clear not-found state (Next.js `notFound()`), not a crash or a blank
  page.

## Definition of done

1. `npx vitest run src/lib/puzzle-storage.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/persistence.spec.ts` passes: `npm run test:e2e`.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.
6. Confirm via `git diff`/`git status` that `.env*` files were never read
   or written by CC during this story, per `AGENTS.md`.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
