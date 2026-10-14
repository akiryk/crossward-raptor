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

## Current state (2026-10-13)

Planned. The epic draft existed as untracked work at intake; this cleanup
relocated it without changing its decisions. No ownership story or acceptance
baseline exists yet. `Puzzle` has no `builderId`, and puzzle actions do not
enforce ownership. No implementation, migration, or ownership verification has
been performed. Closeout audit has not run.

## Next action

After A3, write O1 and its acceptance examples from the actual repo. Include
the editable fixture helper's connection to the authenticated test user so
existing frozen specs keep working. The epic proposes deleting existing
puzzles; settle their disposability with the user before applying that change.
Do not invent a nullable-owner fallback or apply a migration during planning.

Use grilling if the data decision or later O2/O3 UX needs a planning interview;
record settled decisions in the relevant specification. Follow O1, O2, O3 as
the epic recommends, then continue to play.

Resume prompt: "Read `AGENTS.md` and
`docs/epics/10-ownership/HANDOFF.md`, follow Read first, and specify O1 once
the accounts prerequisite is complete."
