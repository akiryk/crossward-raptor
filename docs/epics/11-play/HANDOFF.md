# Play — Handoff

## Read first

1. This handoff's Current state and Next action; use AGENTS if not supplied.
2. The [closeout audit record](HISTORY.md#closeout-audit-2026-10-20) for the
   open follow-ups.

**Only if needed:** [EPIC](EPIC.md) and the [P1–P5 stories](stories/) for
settled scope; [CODE-REVIEW](../../CODE-REVIEW.md) for the high-risk paths;
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) before browser work.
[History](HISTORY.md) keeps older evidence; don't load it for routine startup.

## Current state (2026-10-20)

**Play is closed.** P1–P5 merged in PRs
[#20](https://github.com/akiryk/crossward-raptor/pull/20)–[#24](https://github.com/akiryk/crossward-raptor/pull/24);
P5's merge commit is `e89b6d5`. The independent report-only closeout audit
ran on `main` at `2a75254` and was recorded in `e25bf91`
([record and disposition](HISTORY.md#closeout-audit-2026-10-20)).

**Blocker 1 resolved by human confirmation:** on 2026-10-20 the user
confirmed that `20261018180000_add_play_sessions` is applied to both the
development and production databases. This is user-reported; no agent
inspected either database or any `.env*` file.

**Doc corrections 2–6 resolved** on `main` in a docs-only commit: EPIC's
reset Decision, stale status lines, migration-evidence pointer and spec
count; the P1 story's superseded P5 note; the P5 story's spec count; and the
epic index now says a non-auditing session records audit results.

**Open follow-ups (non-blocking, each needs its own scoped story or task):**
7. The P4 stale-ID reset window: `PlayPuzzle.tsx` clears autosave and closes
   the dialog before `beginSession`'s completion inspection, so keystrokes in
   that window are dropped.
8. Volatile `/private/tmp/crossward-p3-*.json` evidence paths.
9. LEARNINGS #3 cites "Story P3/P5" without naming epic 02.
10. No test covers freshness via app navigation or Back after a play-page
    reset.
11. The engine lint rule doesn't ban DOM globals.
12. `scripts/check-play-migration.mjs` is undocumented in DEVELOPMENT.

Known limit (accepted, owned by the P4 story): saves are keyed by user and
puzzle, so an old open tab can save into a fresh attempt.

## Verification

Closeout is docs-only; no runtime changed after the reviewed P5 head
`54f1050`, so no suite was rerun for it. Standing evidence: the reviewer's
`npm run verify` (579 tests) and full E2E (435 passed) on `54f1050`, and the
auditor's own `npm run verify` exit 0 on `2a75254`. Configured CI is only the
Vercel deployment and preview comments.

## Next action

No Play story remains. The most material follow-up is 7, the dropped
keystrokes after a play-page reset: draft a scoped story for it on `main`,
with proposed acceptance, and wait for human approval before freezing or
implementing.

## Resume prompt

Read docs/epics/11-play/HANDOFF.md and the closeout audit record it links. Draft a scoped story for follow-up 7 (the P4 stale-ID reset keystroke window) with proposed acceptance tests on main; don't commit until I approve and freeze it.
