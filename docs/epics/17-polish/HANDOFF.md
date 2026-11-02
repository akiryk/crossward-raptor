# Polish — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md)'s [At closeout](EPIC.md#at-closeout-2026-11-02).

**Only if needed:** the [stories](stories/) for a settled detail;
[HISTORY](HISTORY.md) for the closeout audits, their dispositions and the
pre-closeout handoff. Don't load HISTORY for routine startup.

## Current state (2026-11-02)

**The Polish epic is closed.** All ten stories (S1–S10) are done on
`main`: S3 through reviewed PR #32, the rest delivered directly (no risk
path). Each story's status line names its freeze and delivery; the
human's visual checks passed.

Two independent, report-only closeout audits ran on 2026-11-02. The
first found one blocker (a rebus on a Preview-black cell crashed the
builder), fixed by S10's second correction (17-S10-13). The second
confirmed the fix and found documentation drift and one dead branch.
This session applied the human's dispositions
([record](HISTORY.md#closeout-2026-11-02)):

- The epic index, the EPIC and every story's status read closed or done;
  the EPIC's selection-color and S10 lines are current; S10's
  Discrimination notes its later cases.
- The NYT reference records rebus input and sizing as settled by S10.
- `PlayResetDialog`'s `puzzleTitle` is required; its untitled branch,
  unused since 17-S3, is removed.
- Accepted *(human)*: `WrappingField.tsx`'s undeclared change in S10 and
  the unstated visual-check devices (EPIC's At closeout).

## Verification

Closeout (this session, working tree committed unchanged): `npm run
verify` exit 0 (Vitest 640/640) after the `PlayReset.tsx` change. The
full `npm run test:e2e` was not rerun; the last full run was the second
audit's on a6770a4 (912 passed). The closeout's other changes are
documentation only.

## Next action

None in this epic, and no next epic is queued. The human chooses what
comes next; drafting a new epic's specification needs their brief.

## Resume prompt

Read docs/epics/README.md. Draft the next epic's EPIC.md on main from the human's brief, for the human's approval; don't draft stories or implement.
