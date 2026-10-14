# Play — Handoff

## Read first

1. `AGENTS.md` — core rules, if not already loaded.
2. `docs/epics/10-ownership/HANDOFF.md` → Current state and Next action —
   confirm ownership is finished before implementing play.
3. `docs/epics/11-play/EPIC.md` → The model, Decisions, Non-goals, and P1 —
   solver behavior and the initial route/session slice.
4. `src/components/grid/PuzzleGrid.tsx`, `src/engine/grid.ts`,
   `src/engine/cursor.ts`, and `prisma/schema.prisma` — fixed geometry,
   reusable input logic, and persistence before specifying P1.

Read the relevant parts of `docs/NYT-CROSSWORD-REFERENCE.md` for solver
conventions and `docs/LEARNINGS.md` for persistence/timing questions as they
arise. Other historical handoffs are conditional, not required upfront.

## Current state (2026-10-13)

Planned. The epic draft existed as untracked work at intake; this cleanup
relocated it without changing its decisions. No play stories or acceptance
baselines exist yet. There is no `PlaySession` model or play route. No play
implementation or verification has been performed; closeout audit has not run.

Inspection found that `PuzzleGrid` derives numbering after converting empty
cells to black. An empty solver entries grid therefore cannot supply the
numbering geometry. P1 must explicitly distinguish fixed puzzle geometry
from displayed player entries while reusing the shared renderer.

## Next action

After ownership, specify P1 from the actual repo. Define route access and when
opening a puzzle creates a session, within the epic's Decisions. Grilling may
help resolve remaining planning choices before tests are frozen. For P2,
make the promised resume behavior precise around rapid navigation and
debounced saves. Follow the epic's P1–P5 order; keep its deferred features
out of scope.

Resume prompt: "Read `AGENTS.md` and `docs/epics/11-play/HANDOFF.md`, follow
Read first, and specify P1 once ownership is complete."
