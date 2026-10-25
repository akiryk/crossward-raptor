# Design system — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md)'s redesign programme, especially the epic 14 entry.

**Only if needed:** the [F1–F7 stories](stories/) for settled component
scope; [HISTORY](HISTORY.md) for the closeout audit, F1–F3 verification and
the pre-closeout handoff. Don't load HISTORY for routine startup.

## Current state (2026-10-24)

**The Design system epic is closed.** F1–F7 and the F6 correction are done
and on `main`, delivered directly (no PRs), each on its frozen baseline:
F1 `c5e5d7a`, F2 `4b8c401`, F3 `58cc471`, F4 `b2dfa65`, F5 `065b887`,
F6 `3c077fd` (refrozen `f4f9a19`), F7 `5509870`. The last implementation
commit is `67e8ebc`.

The independent, report-only closeout audit ran on `main` at `171d839`, by
a fresh agent that authored none of the work. It found no blockers. This
session recorded it and applied the dispositions in a docs-only commit
([record and disposition](HISTORY.md#closeout-audit-2026-10-24)):

- EPIC, F1, F3, F6 and F7 got wording and count corrections, with notes
  where a story's text is historical.
- F1–F3 verification was recovered into HISTORY.
- Observations that lived only in this handoff, and three small code
  points, moved into the EPIC's epic 14 entry.
- The epic index now lists the epic as closed.

No runtime or test file changed.

Epic 14 (screen redesign) has since been drafted (see Next action).
Epic 15 (responsive layout) is outlined in the EPIC but not created. The
username epic was folded into epic 14's S1 (human, 2026-10-25). Nothing authorizes creating them.

## Verification

Closeout (docs-only, on the tree that follows `171d839`): `npm run verify`
exit 0. E2E not rerun, since no runtime or test file changed; the last full
run is F7's 505/505 on its implementation tree. The auditor ran its own
`npm run verify` at `171d839`: exit 0, 602 tests, the known
`request-logger/render.ts` lint warning.

## Next action

Work continues in epic 14, Screen redesign. Its EPIC was approved
2026-10-25; its [handoff](../14-screen-redesign/HANDOFF.md)
is the resume point.

## Resume prompt

Read docs/epics/14-screen-redesign/HANDOFF.md and docs/epics/14-screen-redesign/EPIC.md. Record the human's approval of and answers to the Screen redesign EPIC, commit it on main, then draft story S1 (Sign-in, the EPIC's S1 section) for approval; do not freeze or implement it.
