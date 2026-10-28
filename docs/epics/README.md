# Epic index and layout

Each epic has `docs/epics/<id>-<name>/EPIC.md`, `HANDOFF.md` and, when stories
exist, `stories/`. Preserve existing IDs/basenames; locally numbered new story
names are allowed. EPIC sets scope/Decisions/Non-goals/order; approved stories
and frozen acceptance specify implementation. HANDOFF is the single current
resume point; optional HISTORY records are historical evidence, not startup
reading or additional product specifications.

## Find the current work

- [Responsive layout](15-responsive-layout/HANDOFF.md) (epic 15, approved
  2026-10-27; S1 to draft)
- [Puzzle lifecycle](16-puzzle-lifecycle/HANDOFF.md) (epic 16, approved
  2026-10-27; after epic 15)
- [Polish](17-polish/HANDOFF.md) (epic 17, approved 2026-10-27; after
  epic 16)
- [Screen redesign](14-screen-redesign/HANDOFF.md) (epic 14, closed
  2026-10-27; open items carried to epic 15 listed there)
- [Design system](13-design-system/HANDOFF.md) (closed 2026-10-24; first of
  the redesign epics, outlined there)
- [Play](11-play/HANDOFF.md) (closed 2026-10-20; open follow-ups listed there)
- [Project workflow](12-project-workflow/HANDOFF.md)
- [Accounts](09-accounts/HANDOFF.md) and [Ownership](10-ownership/HANDOFF.md)
  are prerequisite history when relevant.

Earlier numbered directories and `L-local-infrastructure` preserve historical
work. Visual polish (`06`) has a retrospective epic rather than invented story
specifications. Never infer current git/PR/check state from old checkpoints.

## Workflow routing

[AGENTS](../../AGENTS.md) owns incremental session reading, autonomy and the
mandatory completion report. Follow its task-specific route; this index need
not be read every session. [STORY](../process/STORY.md) owns drafting, human
approval/freeze, implementation, verification and delivery.
[CODE-REVIEW](../CODE-REVIEW.md) owns risk/review policy;
[REVIEW](../process/REVIEW.md) executes it.
[HANDOFF](../process/HANDOFF.md) owns operational handoff format/history retention.

Reusable skills live user-wide under `~/.agents/skills/`, with Claude discovery
links under `~/.claude/skills/`; they are not bundled with this repo. Claude
uses `/story`, `/handoff`, `/audit`, `/review-pr`, `/grilling`; Codex uses the
corresponding `$` names. They follow repository policy and user scope. If
unavailable, use the linked local procedure directly. Do not automatically
invoke grilling for routine implementation or editorial choices; AGENTS owns
the decision boundary. No shared-skill edit is implied by repo workflow work.

## Close an epic

After every story meets its Definition of Done, obtain an independent,
report-only [audit](../process/AUDIT.md) from an agent/session that authored none
of the audited work. Scope it to the epic and affected code/docs; expand only
when evidence requires. The auditor only reports; a non-auditing session
records date, coverage, findings and disposition in the handoff/history, so an
audit resume prompt must not ask the auditor to record its own result. Resolve blockers through scoped implementation and recheck
affected findings before marking the epic closed. Do not retroactively claim
older epics were audited because their implementations shipped.
