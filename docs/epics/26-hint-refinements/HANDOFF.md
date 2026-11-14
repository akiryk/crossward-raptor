# Hint refinements — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md) and the next story in `stories/`.
3. For orchestrated runs, [ORCHESTRATION](../../process/ORCHESTRATION.md).

## Current state (2026-11-14)

**Specifications approved 2026-11-14.** The human approved the EPIC,
[26-S1](stories/26-S1-linked-clues.md) and
[26-S2](stories/26-S2-linked-entry.md), with their acceptance case lists
and drafting decisions, after relaxing two rules: letter case doesn't
matter (`with 18-across` counts) and the comma isn't required. The approved documents are committed on
`main`. No acceptance test files are written yet, nothing is frozen, and
`epic/26-hint-refinements` doesn't exist yet.

**Authorization (human, 2026-11-14):** run the rest of the epic without
stopping. For each story in order: write its acceptance per the approved
case lists, record discrimination, freeze on `main` (approval delegated
for acceptance matching those lists), implement on the epic branch, and
run verify plus its own and directly affected E2E specs. Then one full
`npm run test:e2e` on the epic branch and the independent closeout audit
(fix or accept findings). Stop for the human's visual check before the
epic branch merges to `main`; that merge is not authorized. Stop earlier
only for a true blocker or a needed change to an approved decision.

## Verification

None run (documentation drafting only).

## Next action

Orchestrate the epic per the authorization above and ORCHESTRATION:
S1's acceptance and freeze on `main`, then `epic/26-hint-refinements`
from that freeze and S1's implementation there; then S2 the same way
(freeze on `main`, merge `main` into the epic branch, implement). Both
stories are UI-only, so no disabling experiments and no `pr-reviewer`.
Finish at the human's visual check.

## Resume prompt

Read docs/epics/26-hint-refinements/HANDOFF.md and docs/epics/26-hint-refinements/stories/26-S1-linked-clues.md. Run the rest of the epic as authorized there, S1 then S2, on main (freezes) and epic/26-hint-refinements (implementation); stop for the human's visual check, no merge to main.
