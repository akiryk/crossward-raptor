# Ownership — Handoff

## Read first

1. `AGENTS.md` — repository and preservation rules.
2. This handoff's Current state and Release gate — frozen specification,
   verification, and production application are separate checkpoints.
3. `docs/epics/10-ownership/EPIC.md` → Decisions/Non-goals and
   `stories/10-O1-puzzle-builders.md` — confirmed data policy and O1 contract.
4. `docs/DEVELOPMENT.md` → Ownership O1 migration and coordinated release —
   migration inputs, installed-Prisma proof, and release order.
5. `prisma/migrations/20261017220000_add_puzzle_builders/migration.sql`,
   `prisma/schema.prisma`, `src/app/puzzles/actions.ts`, and
   `e2e/helpers/ownership.ts` — implementation and shared fixture identity.

For review/delivery, read `docs/CODE-REVIEW.md` and `docs/process/REVIEW.md`.
For E2E configuration, read `docs/DEVELOPMENT.md`. Accounts' top production and
current-state sections are prerequisite evidence; no sign-in reconfiguration
or old migration replay is needed.

## Current state (2026-10-17)

**O1 specified, implemented locally, and independently verified; final PR review
and production release remain pending.** Starting checkout was clean `main` at `fc6f66e`,
tracking `origin/main`. Specification-only commit **`bfa68b4`** is on local
`main`; implementation is on **`story/10-O1-puzzle-builders`**. No delivery or
production ownership application is claimed at this checkpoint.

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
user. The exact sign-in email was requested and remains pending. The independent
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
suite. The final reviewer must bind the delivered commit blobs to this manifest.
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

No production DB operation, inbox operation, or environment-file inspection/edit
has run. An inert production-settings check passed with Vercel
CLI 64.5.0, `VERCEL_CLI_USE_NATIVE_BINARY=0`, the explicit actual Node executable,
linked project/team IDs, and an empty temporary cwd. Settings stayed in memory;
credentials were not printed. The globally installed old CLI lacks `env run`;
the newer CLI rejected `--disable-binary`, so use the environment opt-out.
Four Secret values are unavailable to env run; the direct DB URL is available.
No deployment or DB operation resulted from these inert checks.

## Release gate and next action

Commit/push the verified implementation/handoff and obtain final independent
PR review from an agent who authored neither implementation nor verification.
Bind the reviewed commit to the independent 177-file verification manifest.
The reviewer's working-tree inspection found no blockers, including the prepared
`/private/tmp/crossward-o1-production-operation.cjs`; final committed-head review
and gate evidence remain required. That driver has only been syntax checked and
reviewed, not executed. It pins the Accounts-verified production target, exact
email/account and four-row set, old puzzle/auth hashes, migration checksums,
reviewed HEAD, and matching fresh preflight before applying only O1. Inputs and
credentials stay in memory; snapshots contain hashes/IDs, not tokens or content.

**Before merge:** main automatically deploys; the new queries require
`builderId`. Prepare/review the concrete live operation, identify the exact
existing user against the confirmed sign-in email, snapshot the exact four
puzzle IDs and original-column/auth hashes, and record the existing task plus
explicit assignment confirmation as authorization. Refresh the read-only
preflight, apply only reviewed O1 SQL with
explicit migration-session inputs, independently verify preservation/schema/
ledger, then coordinate reviewer merge and deployment. The old app's create
insert lacks builderId during the short schema/code transition; coordinate a
quiet creation window. Do not merge incompatible code while rollout is pending.

No live migration/main deployment is authorized merely by local passing tests.
If identity or live readiness remains pending, leave a concrete reviewed PR
ready for release instead of claiming production assignment. Routine isolated
testing, branch/PR, and independent review need no repeated confirmation.

Copyable resume prompt:

> Continue Ownership O1 from docs/epics/10-ownership/HANDOFF.md, following Read
> first. Preserve bfa68b4's frozen baseline and all earlier acceptance tests.
> Finish the recorded independent gates/review and coordinated release.
> Production's four puzzles must remain intact and belong only to the user's
> explicitly confirmed existing sign-in account; inspect the exact current set
> before reviewed SQL application. Preserve accounts/inbox messages, avoid
> .env* files, and do not start O2/O3, invitations, Play, or hydration work.

## Historical intake context

The planned epic was relocated from untracked intake work without changing its
then-current decisions. Its handoff began on clean `main` at `f0bf724`, followed
by documentation-only intake commit `fc6f66e`. At intake no story/baseline or
ownership implementation existed. Production assignment was deliberately
unresolved because only local-puzzle deletion was authorized; it is now settled
above. Accounts verify **328 tests** and E2E **307 tests** are historical
prerequisite evidence, not O1 clearance.
