# Collaborative puzzle construction — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md), especially Stories, Decisions, Invariants and
   Open questions.

**Only if needed:** the source material, which is outside the repo and is
not a specification. The EPIC supersedes all three:

- the human's draft epic (`~/Downloads/draft-epic-collaboration.md`);
- the agent's technical investigation
  (`~/Downloads/collaboration-technical-investigation.md`);
- the human's decisions (`~/Downloads/response-01.md`).

## Current state (2026-11-09)

**Drafting.** The EPIC is written and awaits the human's review and
approval. No story specification or acceptance exists yet, and nothing is
frozen. No application code, schema, migration, service or production
data has changed.

How the draft came about:

- The human's draft epic and four mockups went to a technical
  investigation.
- The human answered the investigation's decisions D1–D9 on 2026-11-09
  and authorized drafting this epic only.
- That authorization covers no implementation, migrations, infrastructure,
  freezing, merging or deploying.

The EPIC records the human's decisions, and the agent's proposed details
under their own heading. The proposals are not approved policy until the
human approves the epic.

**The order changed from the investigation.** Persistence now comes first
(S1–S3) and membership fourth (S4). The reason: once a second builder can
open the editor, today's whole-snapshot saves would overwrite each other's
work. The rationale is in the EPIC's Stories.

**Open questions for the human** (EPIC, "Open questions"):

1. Remote selections: in S5 or out of this epic.
2. Where the owner manages collaborators, possibly with a mockup.
3. The agent's proposed details, notably:
   - the 2 s maximum wait;
   - the 30-day invitation expiry;
   - binding an invitation immediately to an existing account;
   - the `localStorage` journal.
4. Whether CODE-REVIEW should name the new commit paths.

**Constraint for every story.** Each one is on the risk paths: a branch,
a PR and independent review. A story with a migration merges only after
the migration is applied to production, with the human's authorization
(`main` deploys automatically).

## Verification

Documentation only: the new EPIC, this handoff, four mockup copies in
`assets/` and the epic index entry. The checks run on this documentation:

- the links and asset paths resolve;
- the code facts cited in the EPIC were read from the files at 70135ee;
- no other paths changed.

`npm run verify` and `npm run test:e2e` were not run, since no code
changed.

## Next action

The human reviews the EPIC, answers its open questions, and approves it
(with any corrections). Then the next job is S1's specification and
proposed acceptance (EPIC, Stories 1), drafted on `main` for the human's
approval. There is no freeze and no implementation before approval.

## Resume prompt

Read docs/epics/24-collaboration/HANDOFF.md and docs/epics/24-collaboration/EPIC.md. Record the human's approval of and answers to the EPIC, then draft S1's specification and proposed acceptance (EPIC, Stories 1) on main; no freeze or implementation without approval.
