# Builder UI — Handoff

Current state of the crossword-builder project's second epic, for an agent or
collaborator picking it up fresh. Read alongside `02-builder-ui-epic.md` and
`AGENTS.md`, which remain authoritative for scope and behavior. This document
covers what has actually happened and the decisions that live only in
conversation. See `01-HANDOFF-crossward.md` for the first epic's handoff.

Repo: `crossward-raptor`. Branch `main`. Nothing pushed to a remote.

---

## Where things stand

**The grid-engine epic (Groups A–G) is complete and committed.** `src/engine/`
is a pure, headless module with no DOM and no database, per
`01-HANDOFF-crossward.md`.

**This is a new, second epic: the builder UI.** `docs/epics/02-builder-ui-epic.md`
covers the React/Next.js layer built on top of the engine, plus the
persistence needed to support more than one puzzle. It is scoped to the
builder (creating a puzzle) — the play/solve experience is a separate, later
epic.

**Story P0 (design tokens + app shell) is complete and committed.**
`e2e/shell.spec.ts` passes under `npm run test:e2e`, and `npm run verify`
exits 0.

**The `/story` skill was just generalized to support Playwright acceptance
tests.** `.claude/skills/story/SKILL.md` previously identified a story's
acceptance test by hardcoding `*.test.ts` in steps 0 and 4, which only
matched Vitest. It now reads the story file's own "Repo paths" section to
find every acceptance test file listed there — Vitest, Playwright, or both —
and step 3 loops against `npm run test:e2e` in addition to `npm run verify`
for any story whose Repo paths include an e2e spec file. This epic relies on
that change, since P0 (and likely other early stories in this epic) are
Playwright-only.

**Story P1 (persistence) is complete and committed.** Prisma schema for
`Puzzle` (JSON `grid`/`hints` columns), a Neon connection via the
`@prisma/adapter-neon` driver adapter, and `createPuzzle`/`listPuzzles`/
`loadPuzzle` Server Actions. `/puzzles` lists puzzles with a "New Puzzle"
action; `/puzzles/[id]` shows a puzzle's title and phase, proving a puzzle
round-trips through the database. Note for future stories: the installed
Prisma major (7.10.0) no longer accepts `url`/`directUrl` inside
`schema.prisma` — connection strings now live in `prisma.config.ts`
(Migrate, via `DATABASE_URL_UNPOOLED`) and are passed to `PrismaClient` via
a driver adapter (`src/lib/prisma.ts`, via pooled `DATABASE_URL`) instead,
which the story's own contract didn't anticipate. `npm run verify` exits 0
(`tsc --noEmit`, lint, and 111 Vitest tests across 9 files), and
`npm run test:e2e` exits 0 (10 Playwright tests across `shell.spec.ts`,
`smoke.spec.ts`, and the new `persistence.spec.ts`).

**Story P2 (grid rendering, read-only) is complete and committed.**
`/puzzles/[id]` now renders the puzzle's grid via `PuzzleGrid`, dispatching
each cell through `GridCell` to `BlackCell`/`EmptyCell`/`LetterCell`, with
corner numbers from `src/lib/cell-number-lookup.ts` (built on
`numberGrid`). All Server Components — no client-side state yet, since a
`Grid`'s `at()` closure can't cross the server/client boundary as a prop
(see the story's Decisions). `e2e/helpers/seed-puzzle.ts` needed the same
Prisma-7-driver-adapter fix as `src/lib/prisma.ts` (its `datasources`
option and un-cast JSON fields no longer typecheck) — not itself flagged
"already provided — do not edit" in the story's Repo paths, so this was
in-scope to fix rather than a spec deviation. `npm run verify` exits 0
(`tsc --noEmit`, lint, and 117 Vitest tests across 10 files), and
`npm run test:e2e` exits 0 (14 Playwright tests across `shell.spec.ts`,
`smoke.spec.ts`, `persistence.spec.ts`, and the new
`grid-rendering.spec.ts`).

### What exists

```
docs/epics/
  02-builder-ui-epic.md       the builder-UI epic, tracked
docs/stories/
  02-P0-tokens-and-shell.md   Story P0's specification, tracked
  02-P1-persistence.md       Story P1's specification, tracked
  02-P2-grid-rendering.md    Story P2's specification, tracked
e2e/
  shell.spec.ts               Story P0's acceptance test — do not edit
  persistence.spec.ts         Story P1's acceptance test — do not edit
  grid-rendering.spec.ts      Story P2's acceptance test — do not edit
  helpers/seed-puzzle.ts      Story P2 — new; seeds TEST_DATABASE_URL
                               directly (own PrismaClient + adapter),
                               bypassing Server Actions; not app code
docs/handoffs/
  02-HANDOFF-builder-ui.md    this file, tracked
.claude/skills/story/
  SKILL.md                    generalized to read acceptance test files from
                               a story's Repo paths section, not a hardcoded
                               *.test.ts pattern
prisma/
  schema.prisma                Story P1 — the Puzzle model; datasource has
                                no url/directUrl (see note above)
  migrations/                  Story P1 — 20260828190406_init, applied
prisma.config.ts               Story P1 — new; loads .env.development.local,
                                points Migrate at DATABASE_URL_UNPOOLED
src/lib/
  prisma.ts                    Story P1 — new; shared PrismaClient using
                                @prisma/adapter-neon over pooled DATABASE_URL
  puzzle-storage.ts            Story P1 — new; Grid/Puzzle <-> JSON
                                conversion, createBlankPuzzle
  puzzle-storage.test.ts       Story P1's acceptance test — do not edit
  cell-number-lookup.ts        Story P2 — new; pure coord->number lookup
                                built from numberGrid
  cell-number-lookup.test.ts   Story P2's acceptance test — do not edit
src/components/grid/
  PuzzleGrid.tsx                Story P2 — new; grid container, renders
                                 each grid-cell wrapper (data-testid/
                                 data-coord/data-kind) via GridCell
  GridCell.tsx                  Story P2 — new; dispatcher over
                                 Black/Empty/LetterCell
  BlackCell.tsx                 Story P2 — new
  EmptyCell.tsx                 Story P2 — new
  LetterCell.tsx                Story P2 — new
  CellNumber.tsx                Story P2 — new
src/app/
  globals.css                 Story P0 — @theme token block (colors, fonts,
                               grid-line-width), replaces create-next-app
                               defaults
  layout.tsx                  Story P0 — root layout composing Header + main
                               landmark, Geist font boilerplate removed
  page.tsx                    Story P0 — minimal placeholder, create-next-app
                               starter content removed; Story P1 — now links
                               to /puzzles
src/app/puzzles/
  actions.ts                   Story P1 — new; createPuzzle/listPuzzles/
                                loadPuzzle Server Actions
  page.tsx                     Story P1 — new; /puzzles list + New Puzzle
  NewPuzzleButton.tsx           Story P1 — new; client component wrapping
                                createPuzzle + navigation
  [id]/page.tsx                 Story P1 — new; minimal detail route;
                                Story P2 — now renders <PuzzleGrid />
  [id]/not-found.tsx            Story P1 — new; shown when loadPuzzle
                                returns null
playwright.config.ts           Story P1 — edited; webServer now loads
                                .env.development.local and overrides
                                DATABASE_URL with TEST_DATABASE_URL;
                                persistence.spec.ts uses
                                test.describe.configure({ mode: 'serial' })
                                so its shared-list-count assertions don't
                                race each other, rather than disabling
                                fullyParallel repo-wide
src/components/layout/
  Header.tsx                  Story P0 — new
```

---

## Suggested next steps

1. **Story P1 (persistence)** — Prisma schema for `Puzzle`, Neon connection,
   and create/list/load/save Server Actions, per
   `docs/epics/02-builder-ui-epic.md`.
