# Ownership — Handoff

## Read first — Ownership closed; O1/O2/O3 delivered

1. `AGENTS.md`, then this current-state/closeout/next-action section: all
   Ownership work is delivered. Preserve data/tests; never replay migrations.
2. `docs/epics/10-ownership/EPIC.md` Decisions/Non-goals and
   `stories/10-O3-builder-edits.md`: trusted builder write predicates,
   owner-only editor loading, unfiltered library, and ownership labels.
3. Frozen O3 acceptance: `src/app/puzzles/actions.builder-edits.test.ts`
   and `e2e/builder-edits.spec.ts`. `e2e/helpers/builder-edits.ts` is editable
   isolated fixture plumbing, not a frozen acceptance file.
4. Runtime: `src/app/puzzles/actions.ts`, `src/app/puzzles/page.tsx`,
   `src/app/puzzles/[id]/page.tsx`; fixture ownership:
   `e2e/helpers/seed-session.ts`, `e2e/helpers/seed-puzzle.ts`.
5. Verification/delivery: `docs/DEVELOPMENT.md`, `docs/LEARNINGS.md`,
   `docs/CODE-REVIEW.md`, `docs/process/REVIEW.md`; closeout:
   `docs/process/AUDIT.md`.

## Current state — O3 delivered; Ownership closed (2026-10-18)

**O1, O2, and O3 are specified, implemented, independently verified/reviewed,
merged, and deployed. Ownership is closed following its independent closeout
audit and the documentation dispositions below. No Ownership work is pending.**

O1/O2 remain fully delivered. The user authorized O3 specification, new
acceptance, implementation, independent verification, PR/review/merge, and
the repository's required epic closeout process. Starting checkout was clean
`main` at `c17d897` (also `origin/main`). No substantive product decision
remained after inspection; the orchestrator and separate implementer reviewed
the specification and verifier-authored acceptance together before runtime
changes.

Specification-only baseline **`db36fa0`** is committed on main. Implementation
branch: **`story/10-O3-builder-edits`**. New acceptance has **51 unit cases and
7 browser cases**. Against unchanged runtime the new unit suite had **21
expected failures / 30 passes** for missing owner predicates, foreign loading,
and enterHints publication/race checks. Pre-freeze TypeScript and new-file
ESLint exited 0.

All **71** pre-existing acceptance files match their captured hashes at
`/private/tmp/crossward-o3-preexisting-acceptance-sha256.json`. Both new tests
are frozen at `db36fa0`. A separate implementation agent completed the scoped
runtime and test-scoped fixture identity plumbing. Every mutation constrains
the write to the session builder; content mutations also constrain publication.
The editor loader refuses foreign rows before deserialization, allowing the
unchanged route's existing not-found page to respond. The library labels
ownership and shows Edit only for the builder. No engine, serializer, schema,
or migration file changed. Focused implementer checks passed **85/85**, plus
TypeScript and touched-file lint.

**Independent gates passed on the first complete runs, with no fixes:**
`npm run verify` exited 0 (**28 files / 402 tests**, TypeScript/lint passed;
existing request-logger unused-variable warning only). Ordinary
`npm run test:e2e` exited 0 (**325/325 in 53.6 seconds**, four workers, fresh
production build), including all seven new O3 browser cases and A4's fresh-user
editor renewal. Preparation validated `localhost:5433/crossward_test`, found
no pending migrations, and ran only the authorized normal isolated reset.

Evidence: `/private/tmp/crossward-o3-independent-verification.md` and
`/private/tmp/crossward-o3-independent-runtime-sha256.json`. The manifest binds
**202** runtime/config/helper/acceptance/script/asset files on `db36fa0` plus
the stable worktree: zero mismatches across both gates and no uncovered runtime
path. Mutable documentation is excluded so delivery records can be updated.
All 71 prior acceptance files and both new frozen O3 files remain byte-identical.
The final reviewer independently matched every committed manifest blob and
confirmed no uncovered runtime path. Root repeated the check on merged main.

Atomic mutation predicates and simulated owner/publication changes between
read/write are covered by a stateful Prisma-shaped unit store. Browsers use
real isolated PostgreSQL/auth/library/editor and compare foreign-row snapshots.
No real two-tab ownership race, direct cross-account forged HTTP action replay,
authenticated production mutation, or mailbox sign-in was repeated.

Implementation commit **`2d89ca34bf0896a08a906cf71056615e2fee42d7`** was
independently reviewed with **no blocking findings**. Both configured checks
passed: Vercel and Vercel Preview Comments. The reviewer rechecked the exact
head and performed a normal match-head merge of
[PR #19](https://github.com/akiryk/crossward-raptor/pull/19) at
**`2026-10-18T14:48:51Z`**, merge
**`a6a012ecbb2c725c4437f5f53ab6e7de9c6376a8`**. Reviewed and merged Git trees
are identical. Review evidence: `/private/tmp/crossward-o3-independent-review.md`.
Root fast-forwarded local main to this merge and confirmed all 202 verified
runtime hashes match. Git's ORIG_HEAD update needed a sandbox escalation;
the approved fast-forward completed without changing reviewed content.

**Production rollout confirmed at `2026-10-18T14:50Z`:** merge-commit Vercel
status is successful and identifies **`dpl_4buwpUDenDuUDMwCq2uX59ooEWkJ`**.
Read-only `vercel inspect` confirms that same deployment is **Ready**, target
**production**, with canonical `https://crossward-raptor.vercel.app` alias.
Public checks returned homepage **200** and signed-out `/puzzles` **307 → /**.
Vercel inspection/public HTTP checks needed approved network sandbox
escalations. No authenticated production mutation or data/schema operation
occurred. Deployment identity and signed-out health are live evidence;
authenticated behavior is proven by the independent isolated browser suite.
Final documentation-only records preserve every verified runtime byte.

Important inspected constraints: frozen O1 requires the unfiltered library,
including foreign drafts/private rows. O3 labels ownership and removes every
foreign row action; it does not introduce Play/visibility-access rules.
Owner published load/unpublish/delete remain available. Content writes also
need the publication guard; `enterHints` previously lacked it. Frozen A4
renewal tests sign in a fresh user before an implicit puzzle fixture: editable
helpers bind that test's default fixture to its authenticated builder,
without leaking identity across tests or weakening runtime guards.

Preserve all existing puzzle/account data and inbox messages; only ordinary
isolated E2E resets and synthetic test fixtures are authorized. Do not inspect
or edit `.env*` files. No schema/data operation in production, O1 replay,
invitations, Play, or hydration investigation is authorized.

## Independent Ownership closeout — complete (2026-10-18)

A separate reviewer/auditor who authored no runtime, tests, or repository docs
performed a report-only audit on merged **`a6a012e`**. Scope: Ownership epic,
all O1/O2/O3 stories and handoff, affected schema/migration/actions/name flow/
editor/library/fixtures/acceptance, relevant Accounts release prerequisites,
verification/delivery workflows, target guards, and LEARNINGS. The auditor
inspected retained independent O1/O2 verification/review/live-release evidence,
and bound current O3 gate results to all 202 merged blobs. No duplicate test,
build, migration, or live data operation was run merely for closeout.
Report: `/private/tmp/crossward-o3-independent-closeout-audit.md`.

**No blocking implementation/specification issue or new actionable enforcement
gap was found.** Two nonblocking current-document findings are resolved in the
final documentation-only record:

- `docs/DEVELOPMENT.md` now explains explicit builder → same-test validated
  fixture builder → shared suite fallback precedence and attempt isolation.
- This handoff replaces the pre-merge next action with actual review, merge,
  rollout, closeout, and awaiting-task state.

Earlier epic drift (present-tense pre-O1 ownership claims and the inaccurate
published-lock summary) was corrected before merge. Optional trim candidates
are repeated behavioral summaries already enforced by O1/O2/O3 frozen tests;
no pruning is needed for correctness and none was performed. Preserve the
load-bearing migration/assignment authorization, production preservation and
release provenance, raw-creation/UI boundary rationale, A4 fixture binding,
enterHints lock discovery, and uncertainty about the first O1 suite failure.
All eight LEARNINGS entries retain diagnostic/judgment value; no deletion was
recommended. These dispositions account for every audit finding.
The independent auditor rechecked the final documentation-only diff and
confirmed both findings resolved, with no remaining closeout blocker.

Limits: no new authenticated production/mailbox check, real two-tab race,
cross-account forged HTTP action replay, live backfill/preservation recheck,
or unrelated project-wide audit. Protected environment files and existing
development/production data were not accessed; inbox messages were preserved.
Historical O1/O2 results remain
their recorded checkpoints, not newly repeated checks.

## Next action — Ownership complete; await another authorized task

No implementation, verification, review, merge, rollout, or closeout remains
pending for Ownership. Await the user's next task. Play P1 is the next planned
product story but remains unspecified and unauthorized; when requested, start
with `docs/epics/11-play/HANDOFF.md`. Do not start Play, invitations, hydration,
or any migration/data replay merely because Ownership is closed.

Resume prompt:

> Read AGENTS.md and docs/epics/10-ownership/HANDOFF.md, following Read first.
> Ownership is closed: O1/O2/O3 delivered. O3 baseline db36fa0, implementation
> 2d89ca3, independent verify 402 tests/E2E 325/325, PR #19 merged as a6a012e,
> production Ready, independent closeout complete with doc findings resolved.
> Preserve tests/data/inbox; avoid .env*. Never replay migrations or start
> Play/invitations/hydration without authorization. Await my next task.

---

## Historical O2 delivered record — superseded by O3 above

### O2 Read first

1. `AGENTS.md`, then this O2 current-state/next-action section for preservation
   rules and the active boundary. O1 is complete; never replay its migration.
2. `docs/epics/10-ownership/EPIC.md` Decisions/Non-goals and
   `stories/10-O2-display-names.md` for the user-confirmed O2 UX and scope.
3. O2 acceptance: `src/app/puzzles/actions.display-name.test.ts` and
   `e2e/display-name.spec.ts`, frozen before implementation; helper
   `e2e/helpers/display-name.ts` is editable test plumbing.
4. Relevant runtime: `src/app/puzzles/NewPuzzleButton.tsx`,
   `src/components/puzzle/DisplayNameDialog.tsx`, `src/lib/display-name.ts`,
   `src/components/puzzle/NewPuzzleDialog.tsx`, `src/app/puzzles/page.tsx`,
   `src/app/puzzles/actions.ts`, and existing `User.displayName` in
   `prisma/schema.prisma`. No O2 schema migration is needed.
5. For verification/delivery, `docs/DEVELOPMENT.md`, `docs/LEARNINGS.md`,
   `docs/CODE-REVIEW.md`, and `docs/process/REVIEW.md`.

## Current state — O2 delivered (2026-10-17)

**O2 is specified, implemented, independently verified/reviewed, merged, and
deployed.** No O2 work remains pending. Ownership remains open for O3.

The user authorized O2 through specification/freeze, implementation, independent
verification, ordinary E2E, PR, and independent final review/merge. Starting
checkout was clean `main` at `c7ea9bb` (also `origin/main`). User confirmed the
four proposed UX decisions: all idle dismissals cancel without a write/puzzle;
separate first name step saves immediately before title/size; trimmed names
of 1–80 Unicode code points, allowing duplicate names; name prerequisite in
the UI while preserving raw `createPuzzle`'s frozen contract. See O2 story
for pending/failure/concurrent-save details.

Story/epic and new acceptance were independently drafted and reviewed together
by root and the prepared implementation agent before any runtime edits. The
verification agent authored the new tests and guarded fresh-user plumbing.
Root committed the specification-only freeze on main as **`bf65285`**, then
created **`story/10-O2-display-names`**. The separate implementation agent
finished the scoped runtime and named legacy fixtures. New actions read/write
only the session user; conditional capture preserves a concurrent winner.
The raw creation action and all prior acceptance contracts remain unchanged.
All 69 existing acceptance files still match their recorded hashes at `/private/tmp/crossward-o2-preexisting-acceptance-sha256.json`.

Pre-implementation `npm test -- src/app/puzzles/actions.display-name.test.ts`
exited 1: all 20 new cases failed because the two new actions did not exist.
`npx tsc --noEmit` reported only their two missing exports. New-file ESLint
exited 0; its two unused-variable warnings were corrected before freeze.
No runtime, database, inbox, production, or migration operation occurred
during specification. After implementation, independent `npm run verify`
passed: **27 files / 351 tests**, TypeScript/lint exit 0; only the existing
request-logger warning. Focused implementer checks passed 34/34. Independent
ordinary `npm run test:e2e` passed **318/318 in 1.7 minutes**,
including all eight O2 cases, with four workers and a fresh production build.
Both full gates passed on their first complete run with no verification fixes.
Preparation used the validated isolated test database, reported no pending
migrations, and ran only its authorized test reset. All 69 pre-existing
acceptance files and both new O2 tests remain byte-identical to the baseline.

Independent evidence: `/private/tmp/crossward-o2-independent-verification.md`
and `/private/tmp/crossward-o2-independent-runtime-sha256.json`. The latter
binds **198 runtime/config/helper/test/asset files**, including new runtime
files, on `bf65285` plus the tested worktree. Documentation is excluded so
delivery evidence can be recorded. The final reviewer independently matched
all 198 committed head blobs with zero mismatches and no uncovered changed
runtime path. Concurrent capture is covered by a write-time conditional unit
store; no real two-tab DB race or real mailbox sign-in was repeated for O2.

Implementation commit **`d8f7bedbc4b1d6af105ad0a24830fbf113ec395a`** was
independently reviewed with **no findings**. Both configured checks passed:
Vercel deployment and Vercel Preview Comments. The reviewer rechecked the
unchanged head and performed a normal match-head merge of
[PR #18](https://github.com/akiryk/crossward-raptor/pull/18) at
**`2026-10-18T03:11:47Z`**, merge
**`f79cec834e890e00a9218af075d5825b4c732df5`**. Review record:
`/private/tmp/crossward-o2-independent-review.md`. Root fast-forwarded local
main to that merge and confirmed all 198 verified runtime hashes still match.

**Production rollout confirmed at `2026-10-18T03:12:59Z`:** the merge-commit
Vercel status is successful and identifies deployment
**`dpl_5TvxBvCddvfGG6WZCKjzS3TaozDJ`**. Read-only `vercel inspect` confirms
that same deployment is **Ready**, target **production**, with the canonical
`https://crossward-raptor.vercel.app` alias. Public health checks returned
homepage **200** and signed-out `/puzzles` **307 → /**. No authenticated
production name/puzzle was created and no database operation was needed.
This proves deployed code and signed-out health; fresh-user capture and
persistence are proven by the independent isolated browser suite. The final
handoff update is documentation-only, retaining the verified runtime bytes.

Preserve existing puzzle/account data and inbox messages; only normal isolated
E2E resets are authorized. Do not inspect/edit `.env*` files. No production
schema/data operation, O1 migration replay, O3, invitations, Play, or hydration
investigation. Ownership remains open, and no epic closeout audit is due yet.

## Next action — O2 complete; await another authorized task

No O2 implementation, verification, review, merge, or rollout is pending.
Await a new task. O3 is the next planned story, still unspecified and not
started; invitations, Play, hydration investigation, and Ownership closeout
remain outside this authorization. Do not replay any completed migration.

Copyable resume prompt:

> Read AGENTS.md and docs/epics/10-ownership/HANDOFF.md, following Read first.
> O2 is complete: frozen baseline bf65285, implementation d8f7bed, independent
> verify 351 tests and ordinary E2E 318/318, independently reviewed/merged
> PR #18 as f79cec8 and production deployment Ready. Preserve frozen tests,
> existing puzzle/account data and inbox messages; avoid .env* files. O1 is
> also fully delivered; do not replay migrations. Await my next task. Do not
> begin O3/invitations/Play/hydration or Ownership closeout without authorization.

---

## O1 completed release record

### O1 historical Read first

1. `AGENTS.md` — repository and preservation rules.
2. This handoff's Current state, O1 production release, and Next action —
   delivered ownership and the remaining epic boundary.
3. `docs/epics/10-ownership/EPIC.md` → Decisions/Non-goals and O2 — the next
   planned story, which still needs specification when authorized.
4. For O1 evidence, `stories/10-O1-puzzle-builders.md` and
   `docs/DEVELOPMENT.md` → Ownership O1 migration and coordinated release.
5. When specifying O2: `src/app/puzzles/NewPuzzleButton.tsx`,
   `prisma/schema.prisma`, and `src/app/puzzles/actions.ts` — inspect the
   actual creation flow, nullable displayName, and session-derived builder.

For review/delivery, read `docs/CODE-REVIEW.md` and `docs/process/REVIEW.md`.
For E2E configuration, read `docs/DEVELOPMENT.md`. Accounts' top production and
current-state sections are prerequisite evidence; no sign-in reconfiguration
or old migration replay is needed.

### O1 historical current state (2026-10-17)

**O1 is delivered: specified, implemented, independently verified/reviewed,
merged, and deployed to production.** All four production puzzles now belong
to the existing account identified by the user's explicitly supplied sign-in
email. Every pre-existing puzzle field and timestamp and all auth hashes are
unchanged. The production ownership migration and release are complete; do not
reapply them. Ownership remains open because O2/O3 are not yet specified or
implemented, and its closeout audit is not due until all stories are delivered.

Starting checkout was clean `main` at `fc6f66e`. Specification-only baseline
**`bfa68b4`** preceded implementation **`2e90130`** and documentation **`eb796ba`**.
The independent reviewer merged [PR #17](https://github.com/akiryk/crossward-raptor/pull/17)
as **`f6976751cb054879675984635433187a1cf58c9d`** at
`2026-10-17T22:48:53Z`. Local `main` was fast-forwarded to that merge before this
documentation-only rollout record; runtime bytes remain the independently
verified/reviewed implementation. No application or acceptance change accompanies
this handoff update.

The user explicitly commissioned drafting O1 and freezing its acceptance tests
in this session, overriding STORY step 0a's relocation-only default. A separate
specification agent drafted the story/tests; the orchestrator and independent
verification agent reviewed them before the baseline commit. Implementation
started only afterward. The frozen files are:

- `src/app/puzzles/actions.ownership.test.ts`
- `e2e/ownership.spec.ts`
- `scripts/check-ownership-migration.mjs`

All prior acceptance content, including `e2e/auth.setup.ts`, remains frozen.
The implementation adds required ownership, session-derived creation, list
builder metadata, and a transactional exact-set migration. Editable fixtures
bind to the exact shared suite account without changing frozen setup/specs.
Pre-migration cleanup removes only old test Puzzle rows on the validated
isolated target; the normal post-migration reset retains its authorized scope.

**Accounts is closed.** Production personal sign-in and visibility of all four
puzzles are user-confirmed. The approved prior schema application and independent
preservation checks are in `docs/epics/09-accounts/HANDOFF.md` → Production
personal sign-in complete. Do not replay those migrations or start invitations,
Play, or hydration work. O2/O3 remain unspecified and unimplemented; this task
is O1 only.

## Settled data policy and permissions

On **2026-10-17**, the user confirmed preserving all four production puzzles
and assigning all four to their existing successful-sign-in account, keeping
every prior field and timestamp. The authoritative policy is in the epic/story.
Keep the final builder required. Never infer the owner from first/newest/sole
user. The user supplied the exact sign-in email, and read-only production checks
matched it to one existing verified user before application. Raw email/user and
puzzle IDs are not embedded in committed source or this handoff. The independent
reviewer confirmed that the original O1 instruction plus explicit production
assignment confirmation authorizes the necessary reviewed schema/backfill within
this exact preservation scope; another routine confirmation is not required.
The story prohibits an unreviewed operation, not execution of that confirmed
assignment after review. Stop if the account/set or required operation differs.

On **2026-10-15**, the user authorized deleting existing local-development
puzzles. This remains local-only and does not authorize deleting accounts,
production puzzles, or inbox messages. The reviewed local operation on
2026-10-17 deleted exactly **one** pre-O1 development puzzle, applied O1 with
installed Prisma `migrate deploy` (exit 0), and confirmed unchanged auth hashes.
Target was fixed Compose `localhost:5432/crossward`; it refused an already-owned
schema and checked all four prior migration checksums before deleting Puzzle
rows only. Evidence: `/private/tmp/crossward-o1-local-operation/`.
Independent read-only confirmation passed at `2026-10-17T22:41:30.148Z`:
all five finished migration checksums match; required/no-default builder column
and validated restricted-delete/cascading-update FK match; zero puzzles remain;
all auth-row hashes match (1 user, 1 session, 0 accounts, 3 verifications).
Evidence: `/private/tmp/crossward-o1-local-independent-verification.json`.
Isolated E2E resets are authorized; no production reset is.
Do not inspect/edit `.env*` files or clear development inbox messages.

## Verification

Before implementation, `npx vitest run src/app/puzzles/actions.ownership.test.ts`
exited 1 with two meaningful expected failures (missing inserted/returned
builder IDs); the rejected-session case passed. No migration ran in planning.

Implementation-agent checks passed: Prisma generation; ownership/session
Vitest **14/14**; TypeScript; touched-file ESLint; diff check; all **14** frozen
migration cases; and actual installed `prisma migrate deploy` startup-input
proof. The DB checks created/removed only their own synthetic schemas on the
guarded test target. Docker startup/DB access needed approved sandbox
escalations. Independent full gates subsequently passed on the final code:

- `npm run verify`: **26 files / 331 tests**, exit 0, including a rerun after the
  final editable helper correction; existing request-logger lint warning only.
- `node scripts/check-ownership-migration.mjs`: **14/14**, exit 0.
- `node scripts/prove-ownership-deploy.mjs`: exit 0.
- Focused unchanged specs repeated three times: **34/34 in 40.4s**, exit 0,
  four workers and exactly one setup dependency.
- Ordinary `npm run test:e2e`: **310/310 in 1.4 minutes**, exit 0, normal four
  workers and fresh production build; no retries/timeouts/config changes.
- All **69** tracked test/setup/acceptance files match `bfa68b4`, with no
  untracked acceptance files; diff check passes.

Independent report: `/private/tmp/crossward-o1-independent-verification.md`.
Its final **177-file SHA256 manifest** at
`/private/tmp/crossward-o1-verified-tree-sha256.json` covers runtime, configuration,
migrations, helpers, and acceptance files; all hashes matched after the full
suite. The independent reviewer bound all 177 blobs of `2e90130` to this manifest
with zero mismatches and no uncovered non-documentation changes. Subsequent
documentation-only heads must be rechecked before release.
Mutable documentation and operational production verification are separate.

The first ordinary run had **307 passes / 3 failures**: two existing final
library-navigation timeouts and a new helper's non-OK session GET before its
ownership assertions. That response's status was unrecorded, so its cause is
not established; high host load was observed, not proven causal. The implementer
then reused the existing session accessor (stable visitor headers and HTTP error
diagnostics) in the ownership helper. Extending editable `e2e/helpers/auth.ts`
typing is the sole additional helper scope. No application behavior, test,
timeout, or config changed. Focused repetitions and the final ordinary full
run passed. Original failure contexts are retained at
`/private/tmp/crossward-o1-first-e2e-failure`; no original trace was configured.
Do not claim an unrelated hydration fix or a proven rate-limit diagnosis.

The first test preflight found **224** legacy test puzzles, **27** users, and
**21** sessions. Preparation deleted only those puzzles, applied O1, then the
ordinary authorized reset still found all auth rows. Later preparation skipped
legacy cleanup. Three unsafe helper-target controls rejected before connection,
deletion, or deploy.

`scripts/prove-ownership-deploy.mjs` is editable supplemental verification
within the story's focused-runner scope. It proves both explicit inputs reach
the installed Prisma migrator and checks preservation/finished migration state.
The frozen SQL runner separately checks every original puzzle/auth field,
invalid-input rollback, and required/no-default/FK behavior.

Before the live operation below, an inert production-settings check passed with Vercel
CLI 64.5.0, `VERCEL_CLI_USE_NATIVE_BINARY=0`, the explicit actual Node executable,
linked project/team IDs, and an empty temporary cwd. Settings stayed in memory;
credentials were not printed. The globally installed old CLI lacks `env run`;
the newer CLI rejected `--disable-binary`, so use the environment opt-out.
Four Secret values are unavailable to env run; the direct DB URL is available.
No deployment or DB operation resulted from these inert checks.

## O1 production release — complete

The original O1 instruction, explicit four-puzzle preservation/assignment
confirmation, and later supplied sign-in identity authorized this reviewed
operation. No extra routine confirmation was required. The independent reviewer
approved the concrete driver before application and retained merge independence.

Read-only preflight pinned the Accounts-verified Neon target, matched the
explicit email to one existing verified user, captured the exact four puzzle
IDs and canonical SHA256 hashes of all ten original columns, and captured
DB-side auth-row digests without retrieving raw tokens. It confirmed the four
historical migration checksums and only O1 pending. Fresh preflight matched that
snapshot immediately before application. A read-only connection proved the exact
startup settings reached the selected production proxy/server; the separate
local proof had already established installed-Prisma forwarding.

Installed `prisma migrate deploy` applied exactly
`20261017220000_add_puzzle_builders`, exit 0, at
**`2026-10-17T22:48:00.904Z–22:48:03.784Z`**, using the reviewed `eb796ba` schema/SQL
and temporary dotenv-free config. Credentials and migration-session inputs
stayed in memory. SQL changed only the new builder column. No production reset,
puzzle deletion, account change, email request, or inbox operation occurred.

**Independent production verification passed at `2026-10-17T22:48:22.420Z`:**
repeatable-read READ ONLY transaction on the pinned target; exact four IDs and
all ten original-column/timestamp hashes match; all owners equal the explicit
confirmed account; every auth-row digest matches (1 user, 1 session, 0 accounts,
0 verifications). All five migrations are finished, not rolled back, with matching
reviewed checksums and one applied step. Required text builderId/no default and
validated user.id FK with DELETE RESTRICT/UPDATE CASCADE match the specification.

The independent reviewer inspected that evidence, rechecked all 177 reviewed
commit hashes and unchanged frozen tests, confirmed both PR Vercel checks passed,
and merged PR #17 using a normal merge commit. The canonical production alias
was verified **READY** on `f697675` at `2026-10-17T22:50:03.111Z`, deployment
`dpl_LVaCUdXoUotvz3jknYz17aMnH4ws`. Commit evidence maps GitHub's successful
merge-commit Vercel status to that deployment ID and the canonical alias.
Public HTTP checks returned homepage **200** and signed-out `/puzzles` **307 → /**.
These establish deployed code and signed-out health; the user's authenticated
production library/sign-in was not repeated and no new production puzzle was
created. Prior production sign-in success is user-confirmed Accounts evidence.

Retained sanitized operational evidence:

- `/private/tmp/crossward-o1-production-read/preflight.json` and `operation.json`
- `/private/tmp/crossward-o1-production-operation.cjs` — reviewed driver; do not rerun
- `/private/tmp/crossward-o1-production-independent-verification.json` and
  `/private/tmp/crossward-o1-production-independent-verify.cjs`
- `/private/tmp/crossward-o1-production-deployment.json`
- `/private/tmp/crossward-o1-independent-review.md` — final reviewed head, checks,
  inspected independent production verification, and merge evidence

These artifacts may disappear during temporary-file cleanup; this maintained
record preserves their findings without credentials, live tokens, raw puzzle
content, or committed production identity/IDs. No `.env*` file was inspected or
edited. Development inbox messages were not accessed or changed. The short
schema/code creation pause ended once O1 reached the production alias.

## Historical O1 next action — superseded by authorized O2 above

No O1 implementation, migration, PR merge, or rollout remains pending. Do not
replay the operation merely because its temporary evidence exists. If the user
reports a hosted issue, inspect the concrete report and deployed revision before
changing code or production data; do not restart hydration or email setup work.

The next planned story is **O2 — Display names**, currently without a story or
acceptance baseline. When authorized, inspect the actual new-puzzle flow and
settle dismissal behavior, then specify/freeze O2 before implementation. O3,
invitations/custom-domain email, Play, and Ownership closeout remain later work.
No further story is authorized by this O1 completion record.

Copyable resume prompt:

> Read AGENTS.md and docs/epics/10-ownership/HANDOFF.md, following Read first.
> O1 is complete and production's four puzzles are assigned to the explicitly
> confirmed existing account, with independent preservation/schema/checksum
> verification. PR #17 merged and deployed. Do not replay migrations. Preserve
> frozen tests, production/auth data and inbox messages; avoid .env* files.
> Await my next task, or if I explicitly request O2, settle its remaining UX
> decision and specify/freeze acceptance before implementation.

## Historical intake context

The planned epic was relocated from untracked intake work without changing its
then-current decisions. Its handoff began on clean `main` at `f0bf724`, followed
by documentation-only intake commit `fc6f66e`. At intake no story/baseline or
ownership implementation existed. Production assignment was deliberately
unresolved because only local-puzzle deletion was authorized; it is now settled
above. Accounts verify **328 tests** and E2E **307 tests** are historical
prerequisite evidence, not O1 clearance.
