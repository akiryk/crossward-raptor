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

The user authorized implementing the workflow overhaul in
`~/Downloads/crossward-workflow-proposal/IMPLEMENT-IN-REPO.md` directly in the
live repository. Current task is documentation/process implementation, not P3.

Observed starting checkout: `main` at `6034299`, matching local `origin/main`.
Pre-existing work: Play EPIC/HANDOFF modifications, the untracked P3 story and
three acceptance candidates. Preserve those candidates and the EPIC changes;
only the Play handoff is intentionally adapted, with its entire intake version
preserved in Play HISTORY. No P3 specification or test is approved/frozen.

Implemented locally: canonical rule owners and concise pointers, explicit
specification drafting → human approval/delegation → freeze → implementation,
incremental reading, ordinary-decision autonomy, targeted iteration and
verifiable final-head evidence reuse, mandatory three-part completion reports,
and concise Play/workflow handoffs with verbatim historical records.
No application/test/shared-skill/config/database changes are in scope. Data
reset approval remains explicit and ungranted for P3; no standing grant is made.

Implementation and scoped validation are complete. Commit `d82a786`
(`Streamline repository workflow and session handoffs`) was committed on main
and pushed to origin; the push advanced main from `6034299` to `d82a786`.
This documentation-only handoff closeout follows that observed delivery.
These paths do not trigger the risky-code PR policy; no PR/merge is pending.
Independent read-only documentation verification found no blocking defects.
This is not a new epic-wide audit or runtime verification pass.

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

No workflow implementation or validation remains. Await the next user task;
if returning to P3, use [Play's operational handoff](../11-play/HANDOFF.md) to
resolve its pending specification/permissions before freeze or runtime. The
pre-existing P3 EPIC/specification/acceptance was excluded from workflow delivery
and remains local in the originating checkout. Another checkout needs those
actual draft files; do not recreate or silently approve missing acceptance.

**Next-session prompt:**

> Read docs/epics/12-project-workflow/HANDOFF.md; use AGENTS if not supplied.
> The workflow overhaul is implemented, independently validated and delivered
> on main. Await the next user task. If asked to resume P3, read only the
> operational sections of docs/epics/11-play/HANDOFF.md and its targeted draft
> references; resolve the pending specification/permissions before freeze or
> runtime. Do not load archived history unless a specific issue needs it.
