# Write an epic handoff

Use the target epic directory supplied by the user or established by the active
story's `docs/epics/<id>-<name>/stories/` parent. Read `AGENTS.md` and the
handoff conventions in `docs/epics/README.md`. Update that directory's
`HANDOFF.md`; create it there if missing. If the target cannot be inferred,
ask which epic, rather than updating a different epic's handoff.

Inspect its existing handoff, epic Decisions/Non-goals, active story, relevant
code, and live git state. Use observed command results from this session;
do not rerun expensive checks solely to write the handoff.

Put a short ordered `Read first` section before long narrative. Name exact
paths and sections, explain each read's purpose, and separate conditional
references. Give the next session enough context for its next action without
asking it to read every story, old handoff, or the entire codebase.

Record current story status and worktree/commit state, checks passed and not
run, unresolved decisions/blockers, and a concrete next action. Include a
copyable resume prompt. Update stale next steps; preserve historical decisions
and reasoning that live nowhere else. Link specifications instead of restating
them. Distinguish local implementation from verified, committed, merged, and
closed work. Claim audit completion only with an independent audit result.

Change only the target handoff. Do not commit, push, implement the next story,
or change the specifications merely because this skill was invoked. Report
the handoff path and next action.
