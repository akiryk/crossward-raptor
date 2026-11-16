# Polish — Handoff

## Read first

1. This handoff: the next task is test-reliability triage, not another full run.
2. [S12 runtime evidence](acceptance/S12-RUNTIME-EVIDENCE.md), the opening final-verification and timeline sections.

**Only if needed:** [S12 scope](stories/17-S12-quiet-saved-state.md),
[approval packet](acceptance/README.md), [S13](stories/17-S13-prominent-hint-polish.md).

## Current state (2026-11-16)

**S12 delivery stopped; next session should diagnose test reliability and cost.**
The human finds multi-hour test runs followed by mandatory whole-suite reruns
unacceptable. They prefer fixing unreliable tests, quarantining appropriate
cases, or removing tests that cannot be made reliable. They suspect unreliable
network/service dependencies; this is a hypothesis to investigate, not an
established cause. Long full-suite runs should be handed to the human with exact
commands rather than repeatedly supervised by an agent. Do not restart a full
suite automatically.

At handoff preparation main was `b2d8ea1`, five commits ahead of observed
origin/main `61bb72a`. The human subsequently authorized this handoff and
supporting documentation to be committed/pushed on main; runtime is excluded.
Check live git for the documentation publication head.
The independently reviewed, human-approved DONE-icon correction is committed in
that separate specification-only refreeze. It waits for the existing final row
color before the screenshot; pixel assertions/tolerances are unchanged.
Earlier correction: `0f110a8`; original S12 baseline: `4fda6c9`; S13: `d3a05cb`.

S12 runtime remains uncommitted in `SaveStatus.tsx`, `BuilderSteps.tsx` and
`PlayPuzzle.tsx`, unchanged from earlier independent read-only reviews. This
handoff and runtime evidence document the stopped verification; documentation
publication does not deliver S12 runtime. Preserve the
unrelated untracked `CLOSEOUT-S11.md`. All seven S13 acceptance files match
`d3a05cb`; S13 runtime is out of scope. No gate waiver or additional semantic
acceptance amendment has been approved. This handoff authorizes triage and
recommendations, not deleting/quarantining frozen tests or delivering S12.

## Verification and timeline

The orchestrator observed serial `npm run verify` exit 0: 114 files, 1,311 tests,
two existing lint warnings. A concurrent attempt failed when Playwright removed
`test-results` during ESLint's scan: a shared-artifact race.

The full post-refreeze browser run exited 1: 1,408 passed, 44 failed, 2.4h.
Retained Mountain-time timestamps place preparation around **20:00 Nov 15** and
completion at **22:24 Nov 15**. The agent resumed around **07:45 Nov 16**; this
was not continuous testing until morning. A fresh unchanged two-worker rerun
was stopped at the human's request at **07:55**: exit 130, 795 passed, two
interrupted, 655 not run (8.9m). DONE-icon and the live-sync measurement passed
in that rerun. No passing full gate exists. Earlier complete runs took about
14 minutes; the 2.4h outlier needs explanation.

Checks used `/tmp/crossward-s12-verification`: original S12 acceptance plus both
approved corrections and the three runtime files. Content hashes are in the
evidence; runtime matches main. Main intentionally retains later S13 acceptance,
so running main's full suite now would also encounter unimplemented S13
expectations. Earlier focused coverage passed 92 cases; visual coverage and
independent review provenance are in the evidence. Browser/server and temporary
sleep inhibitor stopped; `/tmp/crossward-e2e.lock` was released.

## Next action

Triage retained artifacts and test/harness code first. Classify failures as
product regressions, test races, shared-state/resource issues, service failures,
or interrupted execution; quantify the runtime outlier and map actual external
versus local dependencies. Start with `/tmp/crossward-s12-final-run1-failures`
(44 contexts and metadata), live-sync's response-body callback at line 282, the
approved DONE-icon transition fix, and widespread later timeouts. Use short
focused reproductions only to resolve specific uncertainties. Propose concrete
fix/quarantine/removal candidates with evidence and lost-coverage consequences,
and a verification policy that avoids unnecessary whole-suite reruns while
retaining meaningful correctness checks. Supply human-run commands for lengthy
checks. Present the findings and recommended changes before implementation;
follow STORY's approval/refreeze procedure for frozen acceptance amendments.
Do not resume S12 delivery or change S13 acceptance/runtime during this triage.

## Resume prompt

Read docs/epics/17-polish/HANDOFF.md and docs/epics/17-polish/acceptance/S12-RUNTIME-EVIDENCE.md. Triage test reliability and excessive suite runtime on main, and recommend fixes, quarantine/removal candidates and a more efficient verification policy; do not run the full suite, change frozen acceptance, resume S12 delivery or push.
