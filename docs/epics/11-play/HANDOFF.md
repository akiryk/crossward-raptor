# Play — Handoff

## Read first

1. `AGENTS.md`, if not loaded; this handoff's Current state and Next action.
2. `docs/epics/11-play/EPIC.md` — Decisions, Non-goals and story order.
3. `docs/epics/11-play/stories/11-P1-play-route.md` — frozen P1 contract,
   acceptance paths, scope and manual checks.
4. `src/app/puzzles/actions.play-route.test.ts` and `e2e/play-route.spec.ts`
   — immutable acceptance; `e2e/helpers/play-route.ts` is editable plumbing.
5. For implementation: `src/app/puzzles/actions.ts`,
   `src/components/grid/PuzzleGrid.tsx`, `src/lib/cell-appearance.ts`,
   `src/engine/grid.ts`, `src/engine/numbering.ts`, `prisma/schema.prisma`,
   and `src/lib/require-session.ts` — inspected runtime seams.

Conditionally read `docs/process/STORY.md` and `docs/CODE-REVIEW.md` before
implementation/delivery; `docs/DEVELOPMENT.md` before schema/E2E operations;
`docs/LEARNINGS.md` for timing/fixture failures. Ownership is closed; its
handoff is prerequisite history, not work to replay.

## Current state (2026-10-18)

**P1 specification is independently reviewed and frozen by the specification-only
commit containing this revision. Runtime implementation has not started.**
Starting checkout was clean `main` at `f446509702e77d1b3b2b7024c514e6de0915e50c`.
This task authorized inspection, product decisions, drafting/review and freeze.
No runtime, engine, auth, schema, migration, existing acceptance or environment
file changed. No database, inbox, deployment or production operation occurred.

The baseline contains the story, epic Decisions, this handoff, **25 unit cases**,
**18 browser cases**, and editable browser fixture plumbing. Identify its commit
with `git log -1 -- src/app/puzzles/actions.play-route.test.ts`. The two named
acceptance files are immutable from that commit forward.

The user confirmed all three proposed product choices: browser opening counts
as started even if empty (GET/prefetch does not); static numbered Across/Down
clues belong in P1; puzzle deletion cascades to sessions. The story resolves
route/auth/access, per-player creation, fixed numbering and answer redaction.
No product decision remains open for this slice. Unpublish/edit/republish
lifecycle remains explicitly deferred by the epic.

Separate agents inspected renderer/engine and persistence/auth, then authored
new acceptance. A third independent agent statically reviewed the story,
epic and acceptance/helper: **no blocking findings remain**. Before freeze,
review strengthened real database duplicate-pair rejection, HTML/Server Action
answer redaction, visible headings, black-cell paint, both cascade relations
and database-error propagation. Review did not run browsers or change files.

## Verification at the pre-implementation baseline

- `npm test -- src/app/puzzles/actions.play-route.test.ts`: exit 1,
  **25/25 expected failures**, all missing `loadPlayPuzzle`/`startPlaySession`.
- `npx tsc --noEmit`: exit 2, exactly two expected TS2339 missing-export
  errors in the new unit file at line 32; no unrelated errors.
- `npx eslint src/app/puzzles/actions.play-route.test.ts e2e/play-route.spec.ts e2e/helpers/play-route.ts`:
  exit 0.
- `npx playwright test e2e/play-route.spec.ts --list`: exit 0, **18 P1 cases
  plus setup**; listing executed no setup/browser/server/database work.
- `git diff --check`: exit 0. All **71** existing acceptance files match
  `/private/tmp/crossward-p1-preexisting-acceptance-sha256.json`.
- Full `npm run verify`, browser execution and migration proofs: **not run**.
  The new baseline is intentionally red, including its missing-export type
  errors. P1 is specified, not implemented or runtime-verified.

Ordinary E2E wipes the isolated test database. Obtain explicit authorization
for that deletion if not granted for implementation. No reset was authorized
or attempted during this specification task.

## Next action

Await authorization to implement the frozen P1 story. Then follow the story
workflow and create `story/11-P1-play-route` from main before runtime changes.
Keep implementation, verification and final review independent as useful;
serialize browser suites. Preserve existing and newly frozen acceptance.

Manually demonstrate P1-only input inactivity and start-failure/retry at its
implementation checkpoint. Frozen tests avoid permanently forbidding P2 typing
or P3/P4 completion/reset UI. Verify uniqueness/cascades against actual
PostgreSQL. The additive migration must preserve existing rows/timestamps;
live application requires a separate reviewed, authorized operation.

Resume prompt:

> Read AGENTS.md and docs/epics/11-play/HANDOFF.md, following Read first. P1's
> story and 25 unit/18 browser cases are reviewed and frozen; runtime is
> unchanged and the baseline is intentionally red for missing action exports.
> Implement docs/epics/11-play/stories/11-P1-play-route.md only when authorized.
> Preserve frozen tests and existing data. Do not replay old migrations,
> inspect .env files, or operate on production/inbox data. Obtain explicit
> isolated test-reset authorization before ordinary E2E if needed.

## Inspection history

The initial 2026-10-13 handoff identified the numbering hazard: `PuzzleGrid`
converts empty cells to black before numbering. Current inspection confirmed
engine numbering ignores letters and `clearLetters` preserves geometry. Play
can number entries geometry directly without sending answers. Existing builder
conversion semantics must remain intact. `HintsPanel` exposes answers even
when disabled, so play needs static clues. Existing cursor functions need
wiring in P2, not a new engine implementation in P1.
