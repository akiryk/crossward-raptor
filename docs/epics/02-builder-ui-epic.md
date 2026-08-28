# Epic: Crossword Builder UI

The second epic. The grid engine (Groups A–G) is complete: a pure, headless
`src/engine/` with no DOM and no database. This epic builds the React/Next.js
layer on top of it — the builder's actual screen — and adds the persistence
this app needs to be usable for more than one puzzle at a time.

This epic covers the **builder** experience only (creating a puzzle). The
play/solve experience is real and matters, per the original project
overview, but is a separate, later epic — see Non-goals.

---

## Conventions

**Stack.** Next.js (App Router), React, TypeScript, Tailwind CSS v4.
Persistence via Neon (serverless Postgres) through Prisma — Neon because its
free tier scales compute to zero after a few minutes idle and wakes on the
next request automatically, rather than requiring a manual restore after a
multi-day pause the way Supabase's or MongoDB Atlas's free tiers do. This
also matches `AGENTS.md`'s existing "Postgres via Prisma" default rather
than replacing it. Server Actions handle reads/writes; no client-side
data-fetching library (TanStack Query, SWR) is introduced unless a real need
for caching/revalidation shows up later.

**Design tokens.** All colors, font families/sizes, and border/line widths
are defined once, in a Tailwind v4 `@theme` block in `app/globals.css`.
Components consume semantic utility classes generated from those tokens
(`bg-cell-selected`, `border-grid-line`, `text-hint-complete`, etc.) — never
a hardcoded hex value or a bare pixel size inside component code. If a value
is used more than once, it belongs in `@theme`, not repeated.

**Layout is intentionally not tokenized.** Structure, composition, and
arrangement are ordinary JSX/Tailwind utility classes per component. Layout
is expected to cost more to change later than a color or font swap — that's
an accepted tradeoff per the brief, not an oversight to fix.

**State management.** Local component state (`useState`/`useReducer`) by
default. Puzzle-editing state that more than one component needs — the
current `Puzzle`, cursor/selection — lives in a single React Context
provided at the editor page level, not threaded prop-by-prop through
components that don't themselves use it. Server-persisted data (loading and
saving a `Puzzle`) goes through Server Actions, not through that same
Context — the Context holds the in-memory working copy; persistence is an
explicit write-through, not the source of truth for the editing session. No
global state library (Zustand, Redux, etc.) is introduced preemptively; that
decision waits for a concrete need Context can't handle.

**Derived state stays derived.** Same rule as the engine's "slots are
derived, never stored": which slot is "active" for cursor/hint highlighting
is computed from `(grid, cursor)` via `slotsWithNumbers` on every render,
never stored as its own piece of state that could drift out of sync with
the cursor that determines it.

**Component architecture.** Small, focused, reusable components. A
component that renders meaningfully different output for different states —
`Cell` for black vs. empty-active vs. lettered vs. selected — is a thin
dispatcher over small sub-components, not one component with a large
conditional tree inside it. A component takes only the props it itself
reads; a prop threaded through only so a descendant can use it is a bug to
fix, not a convenience to keep.

**Responsiveness.** The grid is the dominant visual element in both the
builder and (later) the player, and must size fluidly — relative units,
`aspect-ratio` — rather than fixed pixel cell sizes, so it works from a
phone-width viewport up through a full laptop window.

**Verification.** This epic has no pure-function spec the way Groups A–G
did — there's a rendered, interactive result to check, not a return value.
Each story's Definition of Done is: `npm run verify` (now covering the
whole repo, not just `src/engine/`) plus at least one Playwright test
(`npm run test:e2e`) exercising the story's flow in a real browser, run at
more than one viewport width for any story that affects layout. Playwright
is this epic's acceptance mechanism, the way Vitest was Groups A–G's.

---

## Non-goals for this epic (explicitly later)

- The play/solve experience. It reuses the engine's cursor functions per the
  grid-engine epic's own design (`(grid, cursor, ...)`, never `Puzzle`), but
  building that UI is a separate epic.
- Authentication or multi-user accounts. Persistence here is single-user;
  anyone with a puzzle's URL can edit it for now.
- Publishing, share links, or any notion of a puzzle being "live" vs. draft.
- Autofill or dictionary assistance.
- Visual design polish beyond "clear enough that the function is apparent."
  Palette, type scale, and spacing are expected to be revisited iteratively
  after this epic — the token architecture exists specifically to make that
  cheap when it happens.
- Undo/redo.
- Real-time collaboration between multiple builders on one puzzle.

---

## Definition of done (epic-level)

A story is done when:

1. Its flow is covered by at least one Playwright test, and it passes.
2. `tsc --noEmit` is clean across the repo.
3. Lint is clean.
4. `npm run verify` exits 0.

---

## Story Group P0 — Design tokens & app shell

Establishes the token system and a base page layout before anything
functional depends on it.

- **P0.1** — `@theme` block in `app/globals.css` with an initial, minimal
  token set: a small palette (background, text, one selection accent, one
  completion accent), font families for display/body/data roles, and a
  line-width token for grid rules.
- **P0.2** — Base app shell (header, content area), responsive from phone to
  laptop width. No puzzle content yet — this proves the shell and the token
  system independently of any engine wiring.

## Story Group P1 — Persistence

Prisma schema for `Puzzle` (mapping the engine's `Puzzle` shape — grid
geometry and letters, hints, phase — to storable columns), a Neon
connection, and Server Actions for create/list/load/save. The exact schema
shape (JSON columns for grid/hints vs. a normalized cell table) is
undecided — settle it when this group is drafted; JSON is the simpler
starting point per "simplicity first," and nothing so far demands
normalization.

A "New Puzzle" action creates a blank record and navigates to its editor
route. That route can render placeholder/minimal content at this stage —
real grid rendering is Group P2's job, not this group's. This lets
persistence be built and Playwright-verified (create a puzzle, reload,
confirm it's still there) without waiting on the visual editor.

- **P1.1** — Prisma schema + Neon connection, migrated.
- **P1.2** — Create / list / load / save Server Actions.
- **P1.3** — `/puzzles` list page and "New Puzzle" flow.

## Story Group P2 — Grid rendering (read-only)

Renders a loaded `Puzzle`'s grid at its editor route. `Cell` dispatches to
small black/empty/lettered/selected sub-components. Fluidly sized,
responsive grid. No input handling yet — this isolates the rendering and
responsiveness story from the interaction story that follows.

## Story Group P3 — Cursor & letter editing

Wires Group F's engine functions (`place`, `arrowKey`, `deleteAt`,
`moveTo`) to real clicks and keystrokes. Introduces the shared cursor
Context. Edits write through to persistence. Whether that write-through is
autosave (debounced) or an explicit save action is undecided — settle it
when this group is drafted.

## Story Group P4 — Geometry & phase controls

UI for toggling a cell black/active (`applyGeometryEdit`), an "Enter hints
phase" control (`enterHintsPhase`), and visible feedback when an edit is
rejected because geometry is frozen (Story E). This is where "what's done
vs. not done" starts to matter for the grid's shape, not just its letters.

## Story Group P5 — Hints panel

Renders required hints (`requiredHints`, `hintKey`) with editable text
fields, and the bidirectional highlight: selecting a cell highlights its
slot's hint; selecting or focusing a hint moves the cursor into that slot's
start cell. A visual marker distinguishes complete from incomplete hints.

---

## Suggested build order

1. **P0** — nothing else can start without the token system and shell.
2. **P1** — persistence early, ahead of the full visual editor, per explicit
   priority: this is what makes "more than one puzzle" real before the rest
   of the builder exists.
3. **P2** — read-only rendering against real persisted data.
4. **P3** — interactivity, once there's something real to click.
5. **P4** and **P5** can likely run in parallel once P3 lands — both depend
   on cursor state existing, not on each other — the same way Groups E and F
   did in the grid-engine epic.

Write each story's flow as a Playwright scenario *first* where practical,
the same spirit as the engine epic's "write acceptance examples as tests
first," then let the agent make it pass under `npm run verify` +
`npm run test:e2e`.
