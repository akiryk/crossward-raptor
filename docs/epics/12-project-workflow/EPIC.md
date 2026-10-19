# Epic: Project workflow

Make the project easy to resume and its story workflow usable by both Claude
and Codex. This is documentation and agent-workflow work, not product work.

## Decisions

- Follow budget-app's layout: one named epic directory containing `EPIC.md`,
  `HANDOFF.md`, and `stories/` when stories exist.
- Preserve existing epic and story identifiers, including `L` for local
  infrastructure and the documented historical D6 collision.
- Maintain one handoff per epic. Start it with the next session's minimum
  ordered reading list; distinguish current work from historical records.
- Story 01 initially shared repo-local skill files between Claude and Codex.
  Superseded by Story 02: reusable skills live user-wide in `~/.agents/skills/`,
  with `~/.claude/skills/` links. Project-specific policy stays in `docs/process/`.
- [AGENTS](../../../AGENTS.md#session-start-and-autonomy) owns when user
  decisions need clarification; routine workflow edits need no grilling interview.
- Run an independent, report-only audit at epic closeout. Record findings
  and coverage before calling an epic closed.

## Non-goals

- No authentication, ownership, play, schema, application, or test changes.
- No rewrite of historical decisions or general documentation audit.
- No changes to agent permissions. Story 01 excluded global installation;
  Story 02 explicitly authorizes installing the five shared workflow skills.

## Stories

- [01 — Epic layout and focused handoffs](stories/01-epic-layout-and-handoffs.md)
- [02 — Share workflow skills across repositories](stories/02-shared-skills.md)

## Definition of done

The story's acceptance checks pass, `npm run verify` exits 0, and an
independent closeout audit is recorded in `HANDOFF.md`.

Those story gates describe Stories 01/02, whose completed evidence is preserved
in [HISTORY](HISTORY.md). The 2026-10-19 workflow amendment is an explicitly
authorized documentation-only task; its applicable validation follows
[STORY](../../process/STORY.md#verification). It neither reopens those stories
nor authorizes product work, shared-skill edits or data resets.
