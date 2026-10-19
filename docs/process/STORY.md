# Story lifecycle

Canonical procedure for specification, implementation, verification and delivery.
Start with [AGENTS](../../AGENTS.md#session-start-and-autonomy), the active
handoff and the requested story/task. An existing task instruction can specify a
documentation cleanup without inventing a product story or application tests.
User scope and execution permissions govern all phases.

## 1. Draft the specification

Inspect actual affected paths before specifying behavior. Write the story under
`docs/epics/<id>-<name>/stories/`, with Decisions, Non-goals/scope, acceptance,
Repo paths and Definition of Done. Author/edit **proposed** acceptance tests in
this phase; do not change any previously frozen acceptance. Documentation-only
tasks can use concrete path, link, consistency and preservation checks.

Resolve material product/architecture decisions with the user; use judgment for
routine reversible details. Record pending questions without treating suggestions
as approved policy. Demonstrate that new tests discriminate missing behavior,
using focused checks where possible. Browser execution still requires applicable
reset permission. Obtain independent specification review when required by the
story/epic; it does not substitute for human approval.

## 2. Obtain approval and freeze

The human must approve the proposed specification/acceptance scope, or explicitly
delegate that approval/freeze for the defined scope. A request to start drafting,
an outline, a previous story's completion or a coherent uncommitted test suite
does not approve unfinished decisions. Existing approved frozen stories need no
repeat approval merely because a new session resumes them. Record the approval
or delegation and any required independent review in the handoff.

For externally supplied specifications, read the story and its Repo paths first.
Move the story and acceptance marked "already provided" to their declared repo
destinations when necessary; preserve their content during intake. If files are
missing or the epic is ambiguous, report the specific blocker. Any substantive
revision returns to drafting and approval rather than silently altering intake.

Check tracking/worktree state for the story and each acceptance file. After
approval and required review, commit only the specification/acceptance baseline
on `main`, excluding runtime and unrelated work. Record the baseline commit and
acceptance paths for later comparison. Never freeze an ambiguous/erroneous test
or start runtime against an unfinished specification. Drafting, approval and
implementation may share a session; the phase boundary must remain explicit.

## 3. Implement the frozen scope

Use [CODE-REVIEW](../CODE-REVIEW.md#when-review-applies) to classify the declared
Repo paths before runtime changes. High-risk stories start from the frozen main
baseline on `story/<story-file-basename-without-extension>`; include the epic
directory name for locally numbered basenames to avoid collisions. Other work
stays on `main` under the existing direct-delivery policy.

Preserve frozen tests and implement the specified behavior. If a frozen test
appears defective, stop affected implementation and report the issue. A semantic
correction requires explicit human approval, independent review of the proposed
correction, and a separate specification-only commit on main before refreeze and
resuming runtime; never bury it in the implementation diff. Autoformatter-only
reflow must be reported and confirmed whitespace-only.

Use focused checks while iterating. Before committing, inspect **actual** changed
and new paths against CODE-REVIEW, not only the declared scope. If risky paths
appeared, move the uncommitted implementation to the required story branch before
delivery and report the escalation. Declare/explain necessary scope additions;
do not opportunistically clean up adjacent code.

## Verification

- Code changes require `npm run verify` to exit 0 on the final applicable code.
  Fix failures and repeat affected checks; run the full gate again after relevant
  changes. Do not rerun comprehensive checks merely for a session/agent change.
- Stories with E2E acceptance, and changes affecting browser-driven behavior,
  require the full `npm run test:e2e` suite plus any story-specific demonstrations.
  Focused browser tests help iteration but do not replace that gate. Preserve
  frozen cases, timeouts and assertions. Disclose any permitted resource cap.
- Before browser preparation/reset, follow [DEVELOPMENT](../DEVELOPMENT.md#e2e-environment).
  Its user-approved standing grant covers necessary guarded local test resets
  across runs, sessions and stories; do not ask again within that scope. Other
  deletion/reset operations require applicable explicit authorization; isolation
  or a testing request alone grants no additional permission.
  Serialize shared-database suites and retain required manual/visual checks.
- Documentation-only edits require checks of affected paths, links, consistency,
  diff and preservation of unrelated work. They do not require application or
  browser suites unless the task explicitly requires them or code/configuration
  affecting those checks also changed. Do not imply those suites ran.
- Confirm frozen acceptance is unchanged from its baseline, with no untracked
  replacement acceptance. Record command, exit status, scope and tested commit
  or precommit tree identity. Bind precommit results to the resulting commit
  by confirming unchanged tested content. Evidence reuse during independent
  review follows [CODE-REVIEW](../CODE-REVIEW.md#verification-evidence).

## 4. Deliver and hand off

Update the active [handoff](HANDOFF.md) with observed results and actual status.
Commit only authorized implementation/docs, naming the story/task. For direct
delivery, push `main` after required checks; for risky changes, push the branch
and open a PR naming the specification, actual changed paths, verification and
scope escalation. The author does not merge their own PR: arrange independent
[review](REVIEW.md) when authorized, or hand off that exact next task.

Do not call a story complete until its Definition of Done and required delivery
gates are met. Epic closeout follows the [epic index](../epics/README.md#close-an-epic).
Finish with the three-part report in [AGENTS](../../AGENTS.md#mandatory-completion-report).
Proceed to another story only if already authorized.
