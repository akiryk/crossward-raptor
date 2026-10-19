# Project workflow — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. For workflow follow-up, only the canonical document governing the changed
   rule: AGENTS (startup/autonomy/report), STORY (phases/checks/delivery),
   CODE-REVIEW (risk/evidence/merge), HANDOFF (resume format), or REVIEW (checklist).

**Only if needed:** [Epic index](../README.md) for layout/skills/closeout;
DEVELOPMENT's E2E environment for reset safety. [History](HISTORY.md) retains the
2026-10-13/14 layout/shared-skill work and its independent closeout evidence.
Those historical tasks are complete; this amendment does not redo them.

## Current state (2026-10-19)

The user authorized the delivered workflow overhaul in
`~/Downloads/crossward-workflow-proposal/IMPLEMENT-IN-REPO.md` directly in the
live repository. That task was documentation/process implementation. The current
follow-up is the user-approved standing test-reset grant, delivered with the
authorized P3 work; use Play's handoff for application status.

Observed starting checkout: `main` at `6034299`, matching local `origin/main`.
Pre-existing work: Play EPIC/HANDOFF modifications, the untracked P3 story and
three acceptance candidates. Preserve those candidates and the EPIC changes;
only the Play handoff is intentionally adapted, with its entire intake version
preserved in Play HISTORY. At that workflow intake, no P3 specification or test
was approved/frozen; P3 was subsequently approved and frozen in `d1570e0`.

Implemented locally: canonical rule owners and concise pointers, explicit
specification drafting → human approval/delegation → freeze → implementation,
incremental reading, ordinary-decision autonomy, targeted iteration and
verifiable final-head evidence reuse, mandatory three-part completion reports,
and concise Play/workflow handoffs with verbatim historical records.
The workflow overhaul did not include application, test, shared-skill,
configuration or database changes.
At workflow delivery, reset approval remained explicit and ungranted for P3.
The user subsequently approved necessary P3 test resets and requested a lasting
policy change on 2026-10-19: the standing grant for this repository's guarded
local test harness is now recorded in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment), with AGENTS/STORY pointers.

Implementation and scoped validation are complete. Commit `d82a786`
(`Streamline repository workflow and session handoffs`) was committed on main
and pushed to origin; the push advanced main from `6034299` to `d82a786`.
This documentation-only handoff closeout follows that observed delivery.
These paths do not trigger the risky-code PR policy; no PR/merge is pending.
Independent read-only documentation verification found no blocking defects.
This is not a new epic-wide audit or runtime verification pass.

On 2026-10-19 the user approved replacing the next-session prompt rule with a
fixed resume prompt: HANDOFF owns its template and rules (files to read and
the job, nothing more; never "await a task"), each epic handoff has a
`## Resume prompt` section, and AGENTS and AUDIT point to it. Aligning the
rest of the handoff layout with the user's budget-app repo was offered as a
separate follow-up and is not decided.

## Verification

- Implementer: 13 documents and 51 local Markdown links/anchors checked, no
  errors; both archived handoffs match their entire intake snapshots verbatim;
  all 221 protected file hashes and five shared skills unchanged.
- Independent verification: no blocking policy/consistency defects; 49 local
  links/anchors checked, `git diff --check` exits 0, both archives preserved,
  all 221 protected files and 75 existing acceptance hashes unchanged.
- These checks cover the workflow worktree before delivery. Documentation-only
  validation follows STORY; no application or browser suite is required or
  claimed. Existing P3 red acceptance is outside this task. No reset ran.

## Next action

No workflow job is pending; application work continues in Play. Aligning the
handoff layout further is a follow-up only if the user asks for it.

## Resume prompt

Read docs/epics/11-play/HANDOFF.md and docs/epics/11-play/EPIC.md (P4 — Reset). Write the P4 story specification and its proposed acceptance tests on main; don't commit until I approve and freeze them.
