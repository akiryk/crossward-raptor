# Polish — Handoff

## Read first

1. This handoff and [S12 — Quiet saved state](stories/17-S12-quiet-saved-state.md).
2. The [approval packet](acceptance/README.md), then
   [S13 — Prominent Hint polish](stories/17-S13-prominent-hint-polish.md).

## Current state (2026-11-15)

Human approval received verbatim: **“I approve S12 and S13”.** It covers
both specifications, executable acceptance and exact supersession amendments.
Runtime still needs separate authorization under the approved packet.

S12 is frozen in this specification-only commit on `main`: 23 new browser
cases and the exact S12 patch (26 existing cases across seven files).
No runtime changed. S13 is frozen separately after S12, with eight new cases and its exact
amendment (16 directly amended cases plus five map-driven cases). Independent specification reviews
and prior expected failures are recorded in [evidence](acceptance/EVIDENCE.md).

Starting HEAD was `61bb72a`; the pre-existing modified EPIC/HANDOFF/index,
untracked S11 archive and S12/S13 packet were recorded before changes.
The S11 archive remains outside this freeze. Nothing has been pushed.
S1–S11 remain historically complete; these follow-ups are not implemented.

## Verification

Approved proposal hashes matched the prior evidence before amendments.
S12's exact patch passed `git apply --check` and was applied unchanged.
Prior verification belongs to the drafting session; current freeze checks
and baseline commit IDs will be recorded after both freezes. Runtime/browser
implementation gates remain outstanding.

## Next action

Record both baseline commit IDs and final freeze checks. Do not implement runtime without authorization.

## Resume prompt

Read docs/epics/17-polish/HANDOFF.md and docs/epics/17-polish/stories/17-S12-quiet-saved-state.md, then docs/epics/17-polish/acceptance/README.md. Record the approved S12/S13 frozen baselines on main; runtime implementation requires separate authorization.
