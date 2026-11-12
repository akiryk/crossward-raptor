# Collaborative puzzle construction — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md), especially Stories, "Retiring snapshot saves",
   "Multi-user testing" and Decisions.

**Only if needed:** the source material, which is outside the repo and is
not a specification. The EPIC supersedes all three:

- the human's draft epic (`~/Downloads/draft-epic-collaboration.md`);
- the agent's technical investigation
  (`~/Downloads/collaboration-technical-investigation.md`);
- the human's decisions (`~/Downloads/response-01.md`).

## Current state (2026-11-12)

**Drafting; the revised story split awaits the human's review.** No story
specification or acceptance exists, and nothing is frozen. No application
code, schema, migration, service or production data has changed.

- 2026-11-09: the human answered D1–D9 and the agent drafted the EPIC.
- 2026-11-12: the human approved the architecture, product decisions and
  general order. They asked for:
  - smaller stories (about seven was suggested, not required);
  - the settled decisions folded in and the stale open questions removed;
  - a plan for old browser tabs during the switch from snapshot saves;
  - explicit multi-user tests of overlapping edits, revocation and
    reconnecting.
- The revision makes seven stories, close to the human's suggestion. The
  boundary changes are explained in the EPIC's "Why not other boundaries".
- The four former open questions are recorded as resolved by the agent's
  suggestions under the approval (EPIC, "Resolved with the epic's
  approval"). The human didn't answer them individually, so their review
  of the revision also confirms that reading.
- The human held S1's drafting until they review this revision.

**Authorization.** Epic drafting only: no implementation, migrations,
infrastructure, freezing, merging or deploying.

**Constraint for every story.** Each one is on the risk paths: a branch,
a PR and independent review. S1 and S5 (and S7 if presence needs a table)
merge only after their migration is applied to production, with the
human's authorization (`main` deploys automatically). S3 may need the
human's authorization for a Vercel setting (EPIC, "Retiring snapshot
saves").

## Verification

Documentation only: `EPIC.md` and this handoff. The checks:

- the EPIC's internal story references were checked (S1–S7);
- no other paths changed.

`npm run verify` and `npm run test:e2e` were not run, since no code
changed.

## Next action

The human reviews the revised split and the resolved questions, with any
corrections. Then the next job is S1's specification and proposed
acceptance (EPIC, Stories 1), drafted on `main` for the human's approval.
There is no freeze and no implementation before approval.

## Resume prompt

Read docs/epics/24-collaboration/HANDOFF.md and docs/epics/24-collaboration/EPIC.md. Record the human's review of the revised story split, then draft S1's specification and proposed acceptance (EPIC, Stories 1) on main; no freeze or implementation without approval.
