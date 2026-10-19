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
4. **Next action:** One short paragraph: the next job, any needed human
   action, and what limits it (branch, no push, approval before freeze).
5. **Resume prompt:** The prompt the user pastes, in the form below.

## The resume prompt

```
Read docs/epics/<id>-<name>/HANDOFF.md and <story path>[, then <session
file>]. <The job> on <branch>; <the delivery limits>.
```

It names the files to read and the job, nothing more. It doesn't summarize
the work, restate decisions or standing grants, or list files the procedure
already sends the agent to (AGENTS, STORY and the docs they name).

The job is the next one in the epic's order: review PR #N if a review is
pending; otherwise implement the next story, or write its specification if
there isn't one (name its section in `EPIC.md` in place of the story path).
If the epic has no next job, the prompt points at the epic where work
continues. The prompt is never "await a task": pasting it is the user's
authorization, so it always names a job.

End your final message to the user with the resume prompt, verbatim, as a
plain line of text they can copy. No block quote or code fence.

Keep settled product decisions in the story/epic. Before compressing history,
preserve unique decisions, rationale, unresolved permissions and useful failure
evidence in the specification or a linked `HISTORY.md`/archive. Label archived
states as historical and preserve their evidence; link specific material only
when the next action actually needs it. Do not append repetitive session logs,
stale test counts or copied specifications to the operational handoff.

Writing a handoff does not itself authorize implementation, commits, pushes,
merges, resets or the next story. End with the report required by AGENTS.
