# Maintain the epic handoff

Canonical handoff format. Follow [AGENTS](../../AGENTS.md) for startup, autonomy
and the mandatory human-facing completion report; do not duplicate those rules.
Update the active epic's existing `docs/epics/<id>-<name>/HANDOFF.md`, creating it
if genuinely missing. Infer the epic from the task/story; ask only if ambiguous.
Preserve unrelated work and do not run expensive checks solely to write a handoff.

The handoff is an operational resume point, not a chronological journal. Aim for
roughly 300–600 words of current context, adjusting for actual complexity:

1. **Read first:** Minimum exact paths/sections for the next action. Do not ask
   to reread AGENTS if supplied. Put optional troubleshooting references under
   **Only if needed**; never route routine startup through archived history.
2. **Current state:** Date, story/task phase, observed branch/commit/worktree,
   separate implementation/verification/commit/PR/review/merge/closeout status,
   outstanding substantive decisions and precise authorization boundaries.
   Check live git/PR/check state when needed; old handoff claims are not evidence
   of the current remote state.
3. **Verification:** Commands, observed outcomes and the commit/tree tested.
   Attribute delegated checks and distinguish external CI. Explicitly mark
   required checks not run; old results must not imply a current pass.
4. **Next action:** One concrete next task, any needed human action, and a
   copy-ready prompt naming this handoff and minimum reading. Review pending
   means review next; no further authorization means await the next task.

Keep settled product decisions in the story/epic. Before compressing history,
preserve unique decisions, rationale, unresolved permissions and useful failure
evidence in the specification or a linked `HISTORY.md`/archive. Label archived
states as historical and preserve their evidence; link specific material only
when the next action actually needs it. Do not append repetitive session logs,
stale test counts or copied specifications to the operational handoff.

Writing a handoff does not itself authorize implementation, commits, pushes,
merges, resets or the next story. End with the report required by AGENTS.
