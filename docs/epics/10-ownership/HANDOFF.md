# Ownership — Handoff

## Read first — O2 display names

1. `AGENTS.md`, then this O2 current-state/next-action section for preservation
   rules and the active boundary. O1 is complete; never replay its migration.
2. `docs/epics/10-ownership/EPIC.md` Decisions/Non-goals and
   `stories/10-O2-display-names.md` for the user-confirmed O2 UX and scope.
3. O2 acceptance: `src/app/puzzles/actions.display-name.test.ts` and
   `e2e/display-name.spec.ts`, frozen before implementation; helper
   `e2e/helpers/display-name.ts` is editable test plumbing.
4. Relevant runtime: `src/app/puzzles/NewPuzzleButton.tsx`,
   `src/components/puzzle/NewPuzzleDialog.tsx`, `src/app/puzzles/page.tsx`,
   `src/app/puzzles/actions.ts`, and existing `User.displayName` in
   `prisma/schema.prisma`. No O2 schema migration is needed.
5. For verification/delivery, `docs/DEVELOPMENT.md`, `docs/LEARNINGS.md`,
   `docs/CODE-REVIEW.md`, and `docs/process/REVIEW.md`.

## Current state — O2 specification reviewed; freeze before implementation (2026-10-17)

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
Root is committing this specification-only freeze on main, then will create
the implementation branch. All 69 existing acceptance files still match their
recorded hashes at `/private/tmp/crossward-o2-preexisting-acceptance-sha256.json`.

Pre-implementation `npm test -- src/app/puzzles/actions.display-name.test.ts`
exited 1: all 20 new cases fail because the two new actions do not exist.
`npx tsc --noEmit` reports only their two missing exports. New-file ESLint
exited 0; its two unused-variable warnings were corrected before freeze.
Required full verify/E2E have not yet run for O2. No runtime, database, inbox,
production, or migration operation occurred during specification.

Preserve existing puzzle/account data and inbox messages; only normal isolated
E2E resets are authorized. Do not inspect/edit `.env*` files. No production
schema/data operation, O1 migration replay, O3, invitations, Play, or hydration
investigation. Ownership remains open, and no epic closeout audit is due yet.

## Next action — finish and freeze O2 acceptance, then implement

Review the new O2 tests against the story, demonstrate meaningful expected
pre-implementation failures, and commit the specification-only baseline on
main. Create `story/10-O2-display-names`, then authorize the prepared implementer.
Verification and final review remain independent; serialize browser suites.

Copyable resume prompt:

> Read AGENTS.md and docs/epics/10-ownership/HANDOFF.md, following Read first.
> Continue O2 only from its recorded checkpoint. Preserve all frozen tests,
> existing puzzle/account data and inbox messages; avoid .env* files. Only
> isolated E2E resets are authorized. Do not replay O1 or begin O3/invitations/
> Play/hydration. Complete the current O2 verification and delivery gates.

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

## Current state (2026-10-17)

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
