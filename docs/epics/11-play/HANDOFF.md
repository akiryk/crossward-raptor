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

**P1 is complete: implemented, verified, independently reviewed and merged.**
[PR #20](https://github.com/akiryk/crossward-raptor/pull/20) merged normally on
2026-10-18 at `cea9ea05c81513fdd7aa86dc8fd0b76b85da4679`. The reviewed runtime
head is `0988b5287494604d1c321fb89500e654fa1f8471`; corrected frozen acceptance
is `6520aaf`. Local main was fast-forwarded to the merge before this
documentation-only closeout. No runtime changes followed independent review.
The original checkout was clean; no unrelated work was included. P2 is not
authorized and has not started. The Play epic remains open for P2–P5.

The user authorized implementation, then explicitly authorized the minimal
frozen-test await-order correction and isolated test-database resets. The
unit correction passed independent review and was refrozen in specification-only
commit `936422c`. The later user-authorized browser capture-only correction
passed separate independent review and was refrozen on main in `6520aaf`.
All acceptance is immutable from that corrected baseline onward.

Runtime adds the additive `PlaySession` migration, authenticated passive loader
and conflict-safe start, play route/client lifecycle, static numbered clues,
and fixed-geometry play rendering. Separate implementation and verification
agents worked on this story; a third agent reviewed the actual PR/head and
reported no findings. That reviewer independently reran verification, ordinary
full E2E and the synthetic migration proof on the exact reviewed head,
confirmed unchanged acceptance and a clean worktree, checked both Vercel and
Vercel Preview Comments were successful, then merged with a normal merge commit.
GitHub's merged state, head and merge commit were independently read back.

The migration was applied **only to the validated isolated test database** by
the authorized E2E harness. The synthetic migration proof preserves all
original seeded puzzle/auth columns and timestamps, verifies no backfill,
required identity/entries, defaults, pair uniqueness, foreign keys and both
cascades, retaining an unrelated puzzle/session. No historical migrations
were replayed for that proof. No development/production schema or data changes,
inbox operations, or environment-file inspections/edits were performed.

## Verification at the final runtime checkpoint

- `npm run verify`: **exit 0**, **427/427 tests**, 29 files; TypeScript and
  lint pass. One pre-existing unused-variable warning remains in
  `request-logger/render.ts:802`, no lint errors. The independent reviewer
  repeated this gate on `0988b52`: **exit 0**, same 427/29 counts.
- Ordinary `npm run test:e2e`: **exit 0**, **343/343 pass** (1.3 minutes),
  including all 18 P1 browser cases, existing auth/ownership and builder cases.
  The final run includes the independently reviewed fixture race repair.
  Independent review repeated ordinary full E2E on runtime commit `0988b52`:
  **exit 0, 343/343 pass** (1.7 minutes). Thus the final runtime passed two
  consecutive complete browser runs, with separate fresh isolated resets.
- `npm run test:e2e -- e2e/play-route.spec.ts --grep "answer strings" --repeat-each=5`:
  **exit 0**, five consecutive exact frozen redaction cases plus setup pass.
- `npm run test:e2e -- e2e/play-route.spec.ts --grep "HTTP GET and prefetch" --repeat-each=5`:
  **exit 0**, five consecutive prefetch cases plus setup pass.
- `node scripts/check-play-migration.mjs`: **exit 0**, all three preservation,
  constraint/default and cascade proof groups pass on synthetic schemas only.
  Independent review repeated the proof on `0988b52`: **exit 0**.
- Temporary browser checkpoint driver
  `node /private/tmp/crossward-p1-checkpoint.mjs`: **exit 0**. A deliberately
  aborted start showed the visible error and Retry without creating a session;
  Retry reached ready with one session. Cell clicks, letter typing,
  Backspace/Delete and all arrows left rendered grid, stored entries, session
  timestamps and puzzle fields unchanged. This is a P1 checkpoint, not a
  permanent assertion forbidding later P2 input. Both error/ready screenshots
  were visually inspected at `/private/tmp/crossward-p1-{error,ready}.png`.
- Temporary header probe: plain HTML, Purpose-only HTML, router-hint-only
  HTML and both hints all complete, while real RSC prefetch remains RSC.
  All return 200 and create no session. Corrected both-hint HTML completed
  in 10 ms versus a repeatable 3-second aborted probe before the fix.
- All 73 tracked acceptance files match `6520aaf`; the 71 pre-existing files
  also match `/private/tmp/crossward-p1-preexisting-acceptance-sha256.json`.
  Both author and independent reviewer refreshed this comparison before
  delivery; `git diff --check` passes. Both acceptance corrections were explicitly
  authorized and separately refrozen; neither belongs to the runtime PR diff.

## Next action

P1 has no remaining implementation/delivery work. Await authorization for the
next slice. P2 is currently an epic outline, not a supplied frozen story;
specify, independently review and freeze its story/acceptance before coding it.
Do not infer P2 authorization from completion of P1.

The additive migration has been applied only to the isolated test database.
Development/production application remains a separate reviewed, explicitly
authorized operation. No existing development/production data deletion,
inbox operation, environment-file edit or live migration is authorized by this
completed implementation task.

Resume prompt:

> Read AGENTS.md and docs/epics/11-play/HANDOFF.md, following Read first. P1 is
> complete and merged through independently reviewed PR #20 at cea9ea0, with
> frozen corrected acceptance at 6520aaf. All required local gates and configured
> CI passed. Follow only the newly authorized task; P2 needs its own frozen
> story/acceptance, and development/production migration application needs a
> separate reviewed and explicitly authorized operation.

## Implementation findings and resolved blockers

The original isolation assertion at unit line 342 constructed its expected
session before asynchronous authentication/creation finished. The user
approved the two-statement await-order correction; an independent agent
confirmed unchanged assertion and product scope before refreeze in `936422c`.
The earlier **426 pass / 1 fail** verification result is historical, superseded
by the successful gate above.

The first browser run found missing literal whitespace between clue spans;
that markup is corrected. It also found header-only HTML prefetch stalled.
A focused retained trace and header-variant probe reproduced the latter:
Next 16 reads the router-prefetch hint independently of RSC and omits the
page subtree, leaving the HTML response pending. Next's middleware adapter
normally strips Flight headers before invoking middleware and restores them
afterward, so header normalization alone was ineffective.

The declared `next.config.ts` flag `skipProxyUrlNormalize: true` exposes the
actual headers. The declared `src/middleware.ts` handler, after the unchanged
cookie guard, drops only the router-prefetch hint for HTML GETs to the play
route with no RSC header. It preserves real RSC prefetch and existing trusted
loader/start authentication. The app has no Pages Router data routes,
basePath or locales affected by the flag; full auth/ownership E2E remains
part of the gate. No auth redesign or timeout relaxation was introduced.

The initial full browser run had **329 pass / 14 fail** (the two P1 issues
and 12 existing library/auth navigation timeouts). After the clue correction,
a traced P1 run had **18 pass / 1 fail**, isolating header-only prefetch. A
later ordinary full run had **342 pass / 1 fail**, with all prior library/auth
navigation cases passing and only prefetch still blocked. The latest run above
includes the supported flag and resolves prefetch. An initial
verify/E2E overlap also hit an ESLint directory-scan race while E2E recreated
`test-results`; the successful verify was rerun with preparation serialized.

### Chromium response-capture blocker

Primary upstream evidence: Chromium issue
https://issues.chromium.org/issues/568852319 and merged change
https://chromium-review.googlesource.com/c/chromium/src/+/8508456 describe
fully read no-store fetch bodies reported to DevTools as canceled. Its fix
landed in Chromium 157.0.8090.0; the installed Playwright 1.62.1 browser is
151.0.7922.34. Independent read-only research confirmed even stable Playwright
1.64.1 and its current prerelease bundle Chromium 156 without the fix; no
dependency update or permanent machine-specific Chrome channel was made.

Temporary probes reached ready/persisted sessions while CDP body reads failed
in all 12 direct visits; a separate Chrome 155 probe reproduced it. Native
response-clone reads completed, and uncompressed responses still sometimes
failed in CDP, ruling out a justified compression/runtime workaround.

Before application, the proposed upstream-body capture passed **12/12 browser visits**, asserting
nonempty original HTML and action bodies, absence of a unique solution sentinel
in both bodies and client HTML, and successful ready state. One of those
visits still failed the parallel diagnostic CDP read, demonstrating why the
upstream capture is needed. These temporary probes changed no acceptance or
application files. A third reviewer approved the precise capture proposal;
the user then explicitly authorized it. The actual frozen-test diff passed
independent review and was committed separately on main in `6520aaf`.
All original assertions remain unchanged.

The subsequent full gate passed every P1 case but exposed a shared-user
fixture race: an upsert targeting email could lose on the fixed primary key
when several public tests first seeded together. The declared editable
`e2e/helpers/ownership.ts` fix uses `createMany(skipDuplicates)` then the
original update-by-email, preserving fields and identity. Independent review
found no blockers; no frozen acceptance changed for this fixture repair. The subsequent ordinary full run passed all 343 cases.

## Specification history

The P1 specification and **25 unit/18 browser cases** were independently
reviewed and frozen in `b6f357a`. Before implementation, all 25 unit cases
failed for the missing action exports and TypeScript had exactly two expected
missing-export errors. Existing **71** acceptance files matched
`/private/tmp/crossward-p1-preexisting-acceptance-sha256.json`. Browser listing
succeeded without executing setup, server or database work. No reset was
authorized or performed during specification.

The user confirmed browser opening counts as started even if empty (GET and
prefetch do not), static numbered Across/Down clues belong in P1, and puzzle
deletion cascades to sessions. Route/auth/access, player isolation, numbering
and answer redaction are frozen in the story. Unpublish/edit/republish lifecycle
remains explicitly deferred. Ownership is closed and is prerequisite history,
not work to replay.

Separate agents inspected renderer/engine and persistence/auth, then authored
acceptance. A third agent statically reviewed the specification and acceptance
before freeze, with no blockers reported then. That review strengthened actual
database uniqueness, response redaction, visible headings, black-cell paint,
both cascade relations and database-error propagation. The await-order defect
above was discovered only when implementation made runtime execution possible.

## Inspection history

The initial 2026-10-13 handoff identified the numbering hazard: `PuzzleGrid`
converts empty cells to black before numbering. Current inspection confirmed
engine numbering ignores letters and `clearLetters` preserves geometry. Play
can number entries geometry directly without sending answers. Existing builder
conversion semantics must remain intact. `HintsPanel` exposes answers even
when disabled, so play needs static clues. Existing cursor functions need
wiring in P2, not a new engine implementation in P1.
