# Story 01 — Epic layout and focused handoffs

The skill locations below describe this story's completed checkpoint.
[Story 02](02-shared-skills.md) supersedes that location with user-wide skills;
the epic layout, handoff conventions, and preserved specifications still apply.

As a collaborator resuming Crossward, I want each epic's specification,
stories, and handoff together, with a precise reading order, so I can pick
up the next task without loading unrelated project history.

## Decisions

- Move existing documents to `docs/epics/<id>-<name>/`. Name epic documents
  `EPIC.md` and handoffs `HANDOFF.md`; retain existing story basenames.
- Keep `L-local-infrastructure` rather than renumbering historical work.
- Give the historical visual-polish pass a small retrospective `EPIC.md`,
  explicitly identifying its original lack of story baselines.
- Add planning handoffs for ownership and play, which have epic drafts but
  no detailed stories yet.
- Put layout, reading, handoff, and closeout conventions in
  `docs/epics/README.md`; link there from `AGENTS.md` and the root README.
- Update story, review, and audit skills for the new paths. Add a handoff
  skill and bring in budget-app's grilling skill for future planning.
- Share the same skill files with Codex through symlinked skill folders.
- Preserve existing uncommitted A3 implementation and other unrelated work.

## Repo paths

- `docs/epics/**`, `docs/stories/**`, `docs/handoffs/**` — move and update
  documentation references; add this epic/story and missing handoffs.
- `AGENTS.md`, `README.md`, `docs/CODE-REVIEW.md` — update workflow pointers.
- `.claude/skills/{story,review-pr,audit,handoff,grilling}/SKILL.md` — update
  existing skills and add handoff/grilling.
- `.agents/skills/{story,review-pr,audit,handoff,grilling}` — symlinks only.

## Acceptance checks

1. Every existing epic, story, and handoff has one destination in the named
   epic layout. Original story IDs and historical decisions are retained.
2. Existing document references point to their new destinations. References
   to deleted historical artifacts remain explicitly historical. Frozen
   acceptance tests, including their old documentation comments, are unchanged.
3. Every epic folder has `EPIC.md` and one `HANDOFF.md`. Each handoff has a
   short ordered `Read first` section before historical narrative. Ownership
   and play handoffs say they are planned; accounts does not claim A3 is done.
4. The README documents the layout and standard workflow. The handoff skill
   requires exact next reads, worktree/commit state, verified checks versus
   unchecked claims, next action, and unresolved decisions. The story skill
   updates that handoff rather than creating per-session files.
5. Epic closeout requires an independent report-only audit. Its status and
   findings are recorded; verification is not presented as an audit substitute.
6. Both agent environments resolve the same five skill files. Grilling is
   available but no grilling interview is run for this story.
7. Application files, acceptance tests, database state, and pre-existing
   configuration changes are unchanged by this story. `npm run verify` exits 0.

## Validation

Use file inventory, reference checks, preserved-file hashes, skill validation,
and independent audit. No new application tests or browser run are needed for
this documentation-only change.
