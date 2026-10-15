# Ownership — Handoff

## Read first

1. `AGENTS.md` — core rules, if not already loaded.
2. `docs/epics/09-accounts/HANDOFF.md` → Current state and Next action —
   confirm accounts is finished before starting ownership implementation.
3. `docs/epics/10-ownership/EPIC.md` → Decisions, O1, and Non-goals —
   the required owner and migration/data decision.
4. `prisma/schema.prisma`, `src/app/puzzles/actions.ts`, and
   `e2e/helpers/seed-puzzle.ts` — inspect the actual schema, write path, and
   fixtures before specifying O1.

Read `docs/CODE-REVIEW.md` for O1's branch/PR and `docs/DEVELOPMENT.md` when
planning migration/testing. No earlier handoff history is needed by default.

## Current state (2026-10-15)

Planned. The epic draft existed as untracked work at intake; this cleanup
relocated it without changing its decisions. No ownership story or acceptance
baseline exists yet. `Puzzle` has no `builderId`, and puzzle actions do not
enforce ownership. No implementation, migration, or ownership verification has
been performed. Closeout audit has not run.

Accounts A3 is merged, but Accounts remains open for its separate session-renewal
finding. Resolve that prerequisite before Ownership implementation.

The user explicitly confirmed on October 15: "Yes, we can delete existing local
puzzles." Existing local-development puzzle deletion is authorized for O1's
migration. No deletion has run; this does not authorize deleting deployed data
or account records. No further confirmation of this settled decision is needed.

## Next action

After Accounts closes, write O1 and its acceptance examples from the actual repo. Include
the editable fixture helper's connection to the authenticated test user so
existing frozen specs keep working. Existing local-development puzzles are
confirmed disposable; include their authorized deletion in O1's migration.
Do not invent a nullable-owner fallback or apply a migration during planning.

Use grilling if the data decision or later O2/O3 UX needs a planning interview;
record settled decisions in the relevant specification. Follow O1, O2, O3 as
the epic recommends, then continue to play.

Resume prompt: "Read `AGENTS.md` and
`docs/epics/10-ownership/HANDOFF.md`, follow Read first, and specify O1 once
the accounts prerequisite is complete."
