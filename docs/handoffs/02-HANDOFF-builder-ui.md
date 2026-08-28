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

### What exists

```
docs/epics/
  02-builder-ui-epic.md       the builder-UI epic, tracked
docs/stories/
  02-P0-tokens-and-shell.md   Story P0's specification, tracked
  02-P1-persistence.md       Story P1's specification, tracked
e2e/
  shell.spec.ts               Story P0's acceptance test — do not edit
  persistence.spec.ts         Story P1's acceptance test — do not edit
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
  [id]/page.tsx                 Story P1 — new; minimal detail route
  [id]/not-found.tsx            Story P1 — new; shown when loadPuzzle
                                returns null
playwright.config.ts           Story P1 — edited; webServer now loads
                                .env.development.local and overrides
                                DATABASE_URL with TEST_DATABASE_URL;
                                fullyParallel disabled so persistence.spec.ts's
                                shared-list-count assertions don't race each
                                other within the file
src/components/layout/
  Header.tsx                  Story P0 — new
```

---

## Suggested next steps

1. **Story P1 (persistence)** — Prisma schema for `Puzzle`, Neon connection,
   and create/list/load/save Server Actions, per
   `docs/epics/02-builder-ui-epic.md`.
