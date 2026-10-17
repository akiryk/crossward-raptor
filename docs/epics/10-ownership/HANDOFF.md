# Ownership — Handoff

## Read first

1. `AGENTS.md` — core rules, if not already loaded.
2. `docs/epics/09-accounts/HANDOFF.md` → Production personal sign-in complete
   and Current state — Accounts closed: the prerequisite and deployed-data checkpoint.
3. `docs/epics/10-ownership/EPIC.md` → Decisions, O1, and Non-goals —
   the required owner and migration/data decision.
4. `prisma/schema.prisma`, `src/app/puzzles/actions.ts`, and
   `e2e/helpers/seed-puzzle.ts` — inspect the actual schema, write path, and
   fixtures before specifying O1.

Before implementation, read `docs/process/STORY.md` and `docs/CODE-REVIEW.md`
for O1's frozen acceptance baseline, verification, branch/PR, and independent
review/merge. Read `docs/DEVELOPMENT.md` → Deployment and E2E configuration
when planning migrations/testing. No earlier handoff history is needed by default.

## Current state (2026-10-17)

Planned. The epic draft existed as untracked work at intake; this cleanup
relocated it without changing its decisions. No ownership story or acceptance
baseline exists yet. `Puzzle` has no `builderId`, and puzzle actions do not
enforce ownership. No implementation, migration, or ownership verification has
been performed. Closeout audit has not run.

**Accounts is closed.** A1–A6 and the independent closeout audit are complete;
the A4 renewal finding is resolved. Production authentication settings and the
personal Resend testing sender are configured. Three existing production
migrations were applied with explicit approval and independently verified,
including unchanged original contents/timestamps for all **four production
puzzles**. The user then confirmed successful production login and visibility
of all four puzzles at `https://crossward-raptor.vercel.app/`. See Accounts'
maintained handoff for the evidence and limitations; no need to repeat those
checks or migrations just to begin planning Ownership.

The user chose Ownership before inviting other users and intends to start its
story work in a **new session**. This session only updates this handoff; it
does not write O1, change the epic's Decisions, implement ownership, or apply
another migration. Starting checkpoint: clean `main` at `f0bf724`, tracking
`origin/main`, before this documentation-only update.

The user explicitly confirmed on October 15: "Yes, we can delete existing local
puzzles." Existing local-development puzzle deletion is authorized for O1's
migration. No deletion has run; this does not authorize deleting deployed data
or account records. No further confirmation of this settled decision is needed.

**Unresolved production decision:** the four deployed puzzles now matter to
the user's working hosted app. Before specifying O1's migration, settle how
they should be preserved and assigned to a builder. Assigning them to the
user's existing account is a possible approach, not a recorded decision or
authorization. The epic's earlier delete-rather-than-backfill decision cannot
be applied to production on the strength of the local-only permission. Record
the settled production policy in the epic/story before implementation; keep
`builderId` required rather than inventing a nullable-owner workaround.

## Verification/state

This handoff update inspected the epic, actual schema, Server Actions, and
editable fixture helper. `Puzzle` still has no owner field; `createPuzzle`
authenticates without assigning a builder, and `seedPuzzle` currently inserts
without one. `git diff --check` is the documentation check. No new application
verification, browser/build suite, database operation, or inbox operation ran
for this update; no `.env*` files were inspected or edited. The prior Accounts
sender implementation passed verify (328 tests) and ordinary E2E (307 tests);
those are historical Accounts evidence, not Ownership acceptance or clearance.

## Next action — specify O1 in the new session

First settle the production-puzzle ownership policy above, then write O1 and
its acceptance examples from the actual repo. Include
the editable fixture helper's connection to the authenticated test user so
existing frozen specs keep working. Existing local-development puzzles are
confirmed disposable; include their authorized deletion in O1's migration.
Do not invent a nullable-owner fallback or apply a migration during planning.
Preserve account records, production puzzles, development inbox messages,
frozen acceptance content, and A5's isolated email-free E2E configuration.
Only isolated E2E resets are authorized beyond the specific local-puzzle
decision; no production reset or deletion is authorized.

Use grilling if the data decision or later O2/O3 UX needs a planning interview;
record settled decisions in the relevant specification. For substantial
authorized story implementation, use separate implementation and verification
agents, serialize browser/build checks, and obtain independent final PR review
and merge. O1 changes schema and Server Actions, so it requires that gate.
Follow the planned O1, O2, O3 order as authorized. Invitations/custom-domain
email setup and Play remain later work; do not start them automatically or
restart the hydration investigation.

Copyable resume prompt:

> Start Ownership O1. Read AGENTS.md and docs/epics/10-ownership/HANDOFF.md,
> following Read first. Accounts is closed and I can sign into production and
> see my four puzzles. First settle with me how O1 will preserve and assign
> those production puzzles; only local-development puzzle deletion was
> previously authorized. Then specify O1 and freeze its acceptance examples
> before implementation. Follow the story workflow and required independent
> verification/PR review/merge gates for authorized implementation. Preserve
> frozen tests, account records, production data, and inbox messages; do not
> inspect/edit .env* files, apply migrations during planning, begin invitations
> or Play, or restart hydration investigation.
