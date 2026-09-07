# Epic: Puzzle Management

The third epic. The first two built the thing that makes a puzzle (the
engine) and the thing that edits one (the builder UI). This one is about
the puzzles as a *collection* — naming them, removing them, telling them
apart, and starting a new one from an existing one.

It's small and deliberately unglamorous. It exists because the absence is
already being felt: every puzzle is titled "Untitled Puzzle" (the schema
default, never overridden by `createPuzzle`), and nothing can be renamed or
removed from inside the app at all — removing a puzzle currently means
going around the app to the database. Everything built after this is easier
to work with once it's done.

---

## Conventions

Inherits the builder-UI epic's conventions unchanged — Tailwind v4 `@theme`
tokens, small focused components, Context only for state more than one
component needs, Server Actions for persistence, no new global state
library. Nothing here should need a new pattern; if a story seems to,
that's a signal to stop and ask rather than invent one.

**Destructive actions are described honestly.** A delete that cannot be
undone says so, in the confirmation, in those words. This is not a style
preference: an app that labels a permanent action as if it were reversible
is a real trap, and the copy is the only thing standing between a user and
data they can't get back.

**Verification.** Same as the builder-UI epic: at least one Playwright test
per story exercising the real flow, plus Vitest for any extractable pure
logic. Most stories here are thin (a Server Action plus some UI) and will
be Playwright-only; that's expected, not a gap.

---

## Non-goals for this epic (explicitly considered and deferred)

- **Authentication or multi-user accounts.** Still single-user; anyone with
  a URL can edit. Unchanged from the builder-UI epic.
- **Trash / undo / restore.** Delete is permanent. A recoverable-delete
  feature is real work (schema change, a restore surface, a "recently
  deleted" view) and nothing so far justifies it. The mitigation is honest
  copy, not infrastructure.
- **Folders, tags, or any organization beyond a flat list.** At this scale
  a flat list sorted sensibly is enough.
- **Search or filtering.** Same reason. Revisit if the list ever gets long
  enough to be annoying.
- **Import / export of puzzles** (.puz files, JSON, printing).
- **Publishing, sharing, or draft-vs-live states.** That belongs with the
  play/solve epic, which needs to define what a solver sees.
- **Puzzle size options at creation.** `createBlankPuzzle()` is hardcoded
  to 15×15. Mini/midi sizes are genuinely useful and the engine already
  supports them (nothing assumes 15 anywhere), but a size picker is a
  creation-flow feature, not a management one — deliberately left for its
  own story later rather than smuggled in here.

---

## Definition of done (epic-level)

1. The story's flow is covered by at least one passing Playwright test.
2. `tsc --noEmit` is clean across the repo.
3. Lint is clean.
4. `npm run verify` exits 0.

---

## Story Group M1 — Rename

Give a puzzle a title. The most direct fix for the actual pain: right now
nothing in the list distinguishes one puzzle from another.

**Settled: inline on the detail page.** The title there is a lone `<h1>`
with no competing click handler, while every row on `/puzzles` is already
wrapped in a `<Link>` — renaming from the list would mean splitting that
click target between "open" and "edit" (an edit icon, a double-click, a
separate button), which is real interaction design to invent for no gain.

This does not need to live inside `PuzzleGridEditor`. The `<h1>` renders in
the page's Server Component, above and outside the editor, and the editor's
state has no title field and no reason to gain one. The precedent to follow
is `NewPuzzleButton` — a small standalone `'use client'` component embedded
directly in a server page. A `PuzzleTitle` component built the same way sits
*next to* `PuzzleGridEditor`, not within it.

Persistence follows the existing pattern: a `saveTitle` Server Action,
debounced silently on the same 500ms interval as `saveGrid` and
`saveHints` — no save button, no status indicator, consistent with what P3
established.

## Story Group M2 — Delete

Remove a puzzle, permanently, with a confirmation that says so.

Two things this story must get right, both learned the hard way elsewhere:

- The confirmation states plainly that deletion cannot be undone. Not
  "remove," not "archive" — the word should match the behavior.
- Deleting from the detail page navigates somewhere sensible afterward
  (the list), rather than leaving the user on a route whose puzzle no
  longer exists.

## Story Group M3 — List metadata

The list currently shows titles and nothing else. Add enough to tell
puzzles apart and see at a glance where each one stands: last-updated date,
current phase, and whether its hints are complete (`hintsComplete` already
exists, from Story D).

**Sorting is already done** — `listPuzzles` already has
`orderBy: { updatedAt: 'desc' }`; the list page simply doesn't render the
date. This story surfaces existing data, it doesn't add sorting.

**Settled: compute hint completeness per request, don't store a flag.** At
this scale (dozens of puzzles, 15×15 grids) the work is negligible, and a
stored flag is a cache-invalidation problem waiting to happen.

Worth being precise about where the real cost sits, though: `listPuzzles`
currently selects only `{ id, title, updatedAt }`. Computing completeness
means widening that query to load every puzzle's full `grid` and `hints`
JSON on every visit to `/puzzles`. The `hintsComplete` call itself is
trivial; the payload growth is the thing to watch. If puzzle count or grid
size ever grows enough to matter, the fix is a materialized flag updated on
write — not optimizing the computation.

## Story Group M4 — Duplicate

Copy an existing puzzle as the starting point for a new one. Genuinely
useful for a builder: reusing a black-square pattern you like is a normal
part of construction.

**Settled: copy everything** — grid (letters included), hints, and phase.
Neither option is meaningfully harder to build (Prisma stores `grid`/`hints`
as opaque `Json`, so a full duplicate can copy the three raw columns without
touching the engine at all), so this is decided on behavior, not cost. Copy-
everything is the least surprising reading of "duplicate," and it's the safer
default in one direction that matters: a full copy can be stripped down to a
template, but a template can never recover the fill that was discarded.

That default is only reasonable *with* M5 below. The original argument for it
assumed a builder wanting a template could "just clear the letters" — but no
bulk-clear operation exists anywhere in the codebase. `withLetter` and
`deleteAt` are both single-cell, so stripping a 15×15 duplicate by hand would
mean up to 225 individual backspaces.

## Story Group M5 — Clear all letters

A single action that empties every letter from a grid, leaving black-square
geometry untouched.

This exists because M4's default depends on it, but it earns its place
independently: restarting a fill on a grid whose shape you like is a normal
thing to want, and today the only way to do it is one cell at a time.

The transform itself is small and pure — map every active cell to
`letter: null`, leave black cells alone — and `createBlankPuzzle` already
establishes the resulting shape as the baseline for a fresh puzzle. As a
destructive action, it follows this epic's honesty convention: the
confirmation says the letters can't be recovered.

---

## Suggested build order

M1, M2, M3, M5, M4 — largely independent, so the order mostly reflects how
much each relieves current pain rather than a dependency chain. Two soft
dependencies worth respecting:

- Delete was expected to live on M3's list rows, which would have made
  doing M2 first a way to avoid revisiting the list markup twice. That
  didn't hold: Story M2 put delete on the detail page instead, for the
  same reason rename went there — every row on `/puzzles` is already a
  `<Link>`, and a delete control inside one means nested interactive
  elements. M2 and M3 turned out independent of each other.
- M5 before M4, so that when duplicate ships copying everything, turning a
  copy into a template is already a single action rather than 225
  backspaces.
