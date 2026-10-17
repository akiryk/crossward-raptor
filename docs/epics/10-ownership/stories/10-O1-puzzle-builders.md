# Story O1 — Puzzles have builders

Every puzzle has one required builder. Creation records the authenticated
user, and the library's data includes that builder's ID. This establishes
the data needed by O2 and O3; their prompts, permission checks, and library
presentation are separate work.

**Blast radius: high.** Prisma and Server Actions require an implementation
branch, PR, and independent review/merge under `docs/CODE-REVIEW.md`.

## Decisions and data authorization

- `Puzzle.builderId` is a non-null string foreign key to `User.id`, backed
  by the mapped `user` table. Add the Prisma relation and inverse collection.
  Use `ON DELETE RESTRICT` and `ON UPDATE CASCADE`. There is no owner default,
  placeholder account, nullable final state, or automatic owner inference.
- The user confirmed on 2026-10-17 that **all four production puzzles must
  be preserved and assigned to their existing successful-sign-in account**.
  Every pre-existing puzzle field, including both timestamps, must remain
  unchanged. Only the new `builderId` is backfilled. Account, session,
  verification, and inbox data are preserved.
- The previously confirmed permission to delete existing local-development
  puzzles remains local-only. If needed, an explicitly targeted operation
  may delete local `Puzzle` rows before migration; the reusable migration
  itself never deletes existing data. Do not delete local accounts or inbox
  messages. Isolated E2E resets remain authorized under the existing harness.
- The production assignment policy is settled, but this does not identify
  the account by raw ID/email or approve an unreviewed live schema operation.
  Before production execution, establish the exact existing `User.id`
  against the user's confirmed sign-in identity and inspect the exact four
  puzzle IDs. Never choose the first, newest, or sole account as a shortcut.
  Do not hardcode production identity or puzzle IDs in committed files.
- Do not inspect/edit `.env*` files. Do not run migrations during
  specification. Production rollout is a distinct operation after the
  migration and release plan are concrete and reviewed; see Deployment in
  `docs/DEVELOPMENT.md`. Local passing tests do not prove a live rollout.

## Required behavior

### Schema and migration

Add `prisma/migrations/20261017220000_add_puzzle_builders/migration.sql`.
The migration owns one PostgreSQL transaction (`BEGIN` / `COMMIT`) covering the schema change,
legacy-row validation/backfill, requiredness, and FK. A failure rolls back
all schema/data changes made by that migration.

An empty `Puzzle` table migrates without legacy inputs. A nonempty table
requires both explicit inputs in the **same database session that executes
the migration SQL**:

- `current_setting('crossward.legacy_builder_id', true)`: exact ID of an
  existing user.
- `current_setting('crossward.legacy_puzzle_ids', true)`: JSON array of
  distinct string puzzle IDs, exactly matching all pre-existing puzzle rows.
  Order is irrelevant.

Absent/blank inputs, a nonexistent builder, malformed JSON, a non-array,
nonstring elements, duplicate IDs, partial/extra IDs, and a same-size wrong
set must fail closed. Do not silently assign newly discovered rows or rely
on a count alone. Prevent a concurrent puzzle write from escaping the
validated set while the migration runs. Preserve every existing puzzle
column and every auth row; use a SQL backfill that does not modify
`updatedAt`. The final column must be required and have no default.

The operation must demonstrate how both explicit inputs reach Prisma's
actual migration connection before live use; setting them on a different
connection is insufficient. Transport is an implementation/operational
choice, not a requirement for a particular startup-options mechanism.
No production reset, blanket deletion, or resolving a failed migration as
successful is authorized by this story.

### Server Actions

`createPuzzle({ title, size })` obtains a validated session through the
existing guard and writes `session.user.id` as `builderId` in the same
insert as the puzzle. Ignore any extra client-supplied `builderId` property;
the public input contract remains title and size. Preserve title validation,
serialization, return value, and list revalidation. Reject an invalid
session before database access or other effects, as before.

`listPuzzles()` includes `builderId` in each returned row. It still returns
all puzzles for authenticated users, ordered by `updatedAt` descending,
with existing summaries/metadata unchanged. O1 does not filter by builder.

### Fixtures and test isolation

Update editable `seedPuzzle(puzzle, title?, builderId?)` plumbing to insert
the required owner. The optional third argument selects an explicit existing
builder; omission selects the **exact suite-wide authenticated user's ID**,
not an arbitrary first user and not whichever test most recently signed in.
Existing frozen specs must work without edits.

Some public session-validation specs seed a puzzle before authenticating,
and public/setup projects may run concurrently. Supply a deterministic,
test-only fixture identity that the suite's shared auth setup also uses,
or equivalent race-safe plumbing that binds both to the same account.
Preserve A5's email-free configuration, actual session validation, and
per-test isolation of distinct sign-ins. Do not add application-only test
routes or real email delivery.

New editable `e2e/helpers/ownership.ts` exposes:

- `currentBuilderId(page): Promise<string>`: actual validated session's user
  ID for that browser context, failing when absent.
- `readPuzzleBuilderId(id): Promise<string>`: persisted owner of that puzzle.
- `seedOtherBuilder(): Promise<string>`: fresh synthetic existing user,
  distinct from the shared authenticated user.

Database helpers must be restricted to the validated isolated E2E target.
Helpers are plumbing, not frozen acceptance files.

## Non-goals

No display-name prompt or requirement; no ownership mutation guards or
editor-route refusal; no list attribution/actions redesign; no account
selection UI, profile page, ownership transfer, roles, invitations, Play,
or hydration investigation. Preserve the existing authentication boundary.

## Repo paths

Acceptance baseline — supplied in this specification session, then frozen
in the specification-only baseline commit before implementation:

- `src/app/puzzles/actions.ownership.test.ts` — new frozen Vitest acceptance.
- `e2e/ownership.spec.ts` — new frozen Playwright acceptance.
- `scripts/check-ownership-migration.mjs` — new frozen migration acceptance.
  Executes the actual committed migration against synthetic schemas in the
  isolated test database, and removes only the schemas it creates. It does
  not migrate/reset public tables or load dotenv.

Implementation and editable plumbing:

- `prisma/schema.prisma` and
  `prisma/migrations/20261017220000_add_puzzle_builders/migration.sql`.
- `src/app/puzzles/actions.ts` — trusted insert and returned list metadata.
- `e2e/helpers/seed-puzzle.ts`, `e2e/helpers/ownership.ts`,
  `e2e/helpers/seed-session.ts` — fixture/session binding as needed; preserve
  existing helper contracts used by frozen specs. Keep frozen
  `e2e/auth.setup.ts` unchanged.
- `scripts/migrate-test-db.mjs`, `scripts/prepare-e2e.mjs` — if needed to
  preserve the isolated reset/migration order with a populated pre-O1 test
  database. Before migration, cleanup may remove only legacy `Puzzle` rows
  from that validated isolated test target; retain auth rows until the normal
  already-authorized post-migration E2E reset. Never target development or
  production through E2E preparation.
- A focused migration runner/operational runbook and
  `docs/DEVELOPMENT.md` — if needed to make explicit migration-session inputs,
  target checks, and separate production release ordering reproducible.
- This epic's `EPIC.md` and `HANDOFF.md` — settled policy/current state and
  verification/delivery evidence, following the repository process.

No existing acceptance spec is edited or moved. If an unlisted helper or
harness path is needed, explain the scope before including it; do not change
frozen behavior to fit the implementation.

## Acceptance examples

1. A session for builder A creates a normal mini puzzle with `builderId=A`,
   even when the caller adds `builderId=B` to the submitted object. A rejected
   session causes no database access or revalidation.
2. A's and B's rows both appear in `listPuzzles()` with their actual builder
   IDs, existing summaries, and existing descending update order.
3. An empty legacy database migrates with no assignment input. Requiredness,
   absence of a default, referential integrity, restrict-on-delete, and
   cascade-on-ID-update work in PostgreSQL.
4. Four varied legacy rows migrate only with the explicit existing builder
   and exact ID set. Every prior field and all auth rows are unchanged;
   only the required builder field is added.
5. Each unsafe/malformed/mismatched assignment fails and rolls back both
   column creation and all original data. Multiple existing users do not
   cause automatic selection.
6. A real UI creation persists the actual browser session's user ID. Default
   fixtures belong to the shared browser user; an explicit different fixture
   builder persists and that puzzle remains visible in the library.
7. The entire existing suite passes with frozen specs unchanged, including
   signed-out fixture cases and email-free sign-in.

## Definition of done

1. Story, epic decision, and all three acceptance files reviewed together
   and committed as the immutable specification baseline on `main` before
   implementation. User requested drafting/freezing them in this session;
   this is the explicit exception to STORY step 0a's relocation-only default.
2. `npm run verify` exits 0.
3. `node scripts/check-ownership-migration.mjs` exits 0 against the isolated
   E2E database, with all positive and fail-closed cases demonstrated.
4. Ordinary `npm run test:e2e` exits 0 with every prior acceptance file
   unchanged. Serialize browser/build/database checks between agents.
5. Verify the three acceptance files are unchanged from their committed
   baseline. Record results/limitations, migration safety evidence, and
   independent verification in the maintained handoff.
6. Push the high-blast-radius implementation branch, open its PR, and obtain
   independent review and reviewer merge after required local/configured CI
   gates pass. Preserve review independence from both implementation and
   verification agents. **Do not merge into main's automatic production
   deployment until the reviewed coordinated live migration/release is ready
   and required live-change authorization has been obtained.** The new
   Prisma queries require `builderId`; deploying them against the old schema
   breaks the application. Local implementation and PR review may complete
   while merge waits for this concrete release gate.
7. Record production rollout separately: exact confirmed target/account/set,
   concrete reviewed operation and live-change authorization, preservation
   snapshots/checks, migration outcome, and coordinated deployment state.
   A Vercel build generates Prisma Client but does not apply migrations;
   coordinate main's automatic deployment with the required live schema.
   If rollout is pending, state that explicitly instead of claiming the
   four production puzzles have already been assigned.
