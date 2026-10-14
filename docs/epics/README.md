# Epics and the development workflow

Each epic has one named directory:

```text
docs/epics/09-accounts/
  EPIC.md
  HANDOFF.md
  stories/
    09-A1-magic-links.md
    09-A2-front-door.md
    09-A3-route-protection.md
```

`EPIC.md` sets scope, Decisions, Non-goals, and story order. Story files are
the implementation specification. `HANDOFF.md` is the epic's single maintained
resume point, not an additional specification or a new file for each session.
Planned epics may have no stories yet. Existing story basenames and IDs are
preserved; new stories can use local names such as `01-<name>.md`.

## Find the current work

- [Accounts](09-accounts/HANDOFF.md)
- [Ownership](10-ownership/HANDOFF.md), which follows accounts
- [Play](11-play/HANDOFF.md), which follows ownership
- [Project workflow](12-project-workflow/HANDOFF.md), the documentation cleanup

Read the selected handoff for its current status and next action.

Earlier numbered directories and `L-local-infrastructure` preserve historical
work. Visual polish (`06`) was a prompt-driven pass; its retrospective epic
does not invent story specifications. Historical handoff test counts and branch
states describe their recorded checkpoints, not the current checkout.

## Start a session

Read `AGENTS.md`, then the target epic's `HANDOFF.md` beginning with `Read first`.
Follow that ordered list. It should name the next story and the exact files or
sections needed for its next action. Read other epics, old handoff narrative,
setup, conventions, or incident notes only when relevant. Confirm live state
with `git status` and the files being changed before relying on a handoff.

## Skills and story work

The reusable skills are installed user-wide in `~/.agents/skills/`, with
`~/.claude/skills/` links to the same files. They are available across projects
and follow the current repository's policy. Crossward's rules live in
`docs/process/`, referenced by `AGENTS.md`; the shared skills contain no
Crossward-specific commands, paths, or delivery permissions.

Claude uses `/story`, `/handoff`, `/audit`, `/review-pr`, and `/grilling`.
Codex uses `$story`, `$handoff`, `$audit`, `$review-pr`, and `$grilling`.
These personal skills are not bundled with a clone of this repo. If they are
unavailable, follow [STORY](../process/STORY.md),
[HANDOFF](../process/HANDOFF.md), [AUDIT](../process/AUDIT.md), or
[REVIEW](../process/REVIEW.md) directly. Codex's supported user-wide paths are
documented in [Build skills](https://learn.chatgpt.com/docs/build-skills).

1. Inspect the actual repo paths before writing an epic or story. For meaningful
   unresolved product or architecture decisions, use grilling to work through
   them with the user. Routine cleanup and already-settled stories do not need
   an interview. Record settled decisions in the epic/story.
2. Establish the story specification and acceptance examples before
   implementation; freeze acceptance tests. Documentation-only stories can use
   concrete manual checks instead of adding application tests.
3. Run the story skill against `docs/epics/<id>-<name>/stories/<story>.md`.
   It owns implementation, verification, handoff updates, and delivery under
   [the review rules](../CODE-REVIEW.md). User instructions and environment
   permissions govern any commit or push; do not include unrelated work.
4. An orchestrator can delegate independent exploration, implementation, and
   verification/review with clear file ownership. Keep acceptance tests frozen;
   coordinate shared-file edits and serialize full E2E runs, which share a
   database. Independent review follows the blast-radius rules.
   For PRs, the independent reviewer merges after no blocking findings remain
   and required verification/configured CI pass; the author stops at the PR.
5. Update the same epic's handoff after a story or when pausing mid-story.

## Write a handoff

Use the shared handoff skill with [Crossward's handoff process](../process/HANDOFF.md).
Keep the next session's actionable context at the top:

- **Read first:** a short numbered list of exact repository paths, with why
  each matters and any relevant section. Start with `AGENTS.md` if not already
  loaded, this handoff's current-state section, the epic's Decisions/Non-goals,
  then the next story and its essential code/tests. Separate conditional reads.
- **Current state:** date, epic/story status, branch/commit if checked, existing
  uncommitted work, and blockers. Distinguish implemented, verified, committed,
  merged, and closed; none implies the next.
- **Verification:** exact commands, results, and checkpoint tested. Label checks
  not run. Historical results must not imply a current pass.
- **Next action:** one concrete starting task, with unresolved decisions and
  permissions that affect it. Give a copyable resume prompt naming the handoff.
- **Decisions/context:** link to the spec; retain reasons, discoveries, and
  historical detail that live nowhere else. Do not duplicate full specifications
  or erase history just to fit this format.

Update stale next steps as work lands. Never mark a story done or an epic closed
just because a session ended. Keep unverified findings separate from demonstrated
failures. A planned epic's handoff should say what must be decided and specified
before implementation, rather than inventing its missing story.

## Close an epic

After its stories meet their Definitions of Done, run the audit skill in an
independent agent/session that did not author the audited work. Scope it to the
epic and the code/docs it touches; expand only when evidence needs it.

The audit reports findings and coverage and edits nothing. Record its date,
scope, findings, and disposition in `HANDOFF.md`. Resolve blockers through scoped
follow-up work, then recheck affected findings. Mark the epic closed only after
the required checks and audit are accounted for; do not infer that older epics
were audited merely because their implementations shipped.
