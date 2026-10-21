# Play — Handoff

## Read first

1. This handoff's Current state and Next action; use AGENTS if not supplied.
2. The [closeout audit record](HISTORY.md#closeout-audit-2026-10-20) for the
   open follow-ups.

**Only if needed:** [EPIC](EPIC.md) and the [P1–P5 stories](stories/) for
settled scope; [CODE-REVIEW](../../CODE-REVIEW.md) for the high-risk paths;
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) before browser work.
[History](HISTORY.md) keeps older evidence; don't load it for routine startup.

## Current state (2026-10-21)

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

**P6 done (2026-10-20):** follow-up 7 is resolved by the
[P6 story](stories/11-P6-reset-settles-before-closing.md): a confirmed
reset now stays pending in its dialog until the returned attempt (including
any completion check) is shown. Runtime change is `PlayPuzzle.tsx` only,
delivered directly to `main`; checks are recorded in the story.

**P7 done (2026-10-21):** follow-up 8 is resolved by the
[P7 story](stories/11-P7-durable-evidence-pointers.md), approved by the human
and frozen in `23352c2`. HISTORY's preamble now maps the temporary hash
manifests to the commits that rebuild them and labels the other `/private/tmp`
artifacts as superseded by the tracked text; the P3 story points to
`dbc3ee8`. Docs-only, delivered directly to `main`; checks are in the story.

**P8 done (2026-10-21):** follow-up 9 is resolved by the
[P8 story](stories/11-P8-learnings-epic-qualified-ids.md), approved by the human
and frozen in `71e562c`. LEARNINGS now cites `Story 02-P3` and `Story 02-P5`
in entry #3, and `Story 08-M2` in entry #8 (approved in addition), each
linked to its story file. Docs-only, delivered directly to `main`; checks are
in the story.

**P9 done (2026-10-21):** follow-ups 11 and 12 are resolved by the
[P9 story](stories/11-P9-engine-dom-lint-and-migration-proof-docs.md),
approved by the human and frozen in `8dd87bd`. The engine's ESLint block now
bans DOM and browser globals (`no-restricted-globals`), and DEVELOPMENT
documents `scripts/check-play-migration.mjs`. Delivered directly to `main`;
checks are in the story.

**Open follow-ups (non-blocking, each needs its own scoped story or task):**
7. Resolved by P6 (above).
8. Resolved by P7 (above).
9. Resolved by P8 (above).
10. No test covers freshness via app navigation or Back after a play-page
    reset.
11. Resolved by P9 (above).
12. Resolved by P9 (above).

Known limit (accepted, owned by the P4 story): saves are keyed by user and
puzzle, so an old open tab can save into a fresh attempt.

## Verification

P6 on `main`: `npm run verify` exit 0 (579 tests) and full
`npm run test:e2e -- --workers=2` exit 0 (438 passed), run by the
implementing agent; exact content identity is in the P6 story. Guarded E2E
reset ran under the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment). Configured CI is only
the Vercel deployment and preview comments.

P7 on `main`: documentation checks 1–5 passed (recorded in the P7 story);
application and browser suites were not run, as STORY allows for docs-only.

P8 on `main`: documentation checks 1–4 passed (recorded in the P8 story);
application and browser suites were not run (docs-only).

P9 on `main`: `npm run verify` exit 0 (579 tests), the lint probe and
`node scripts/check-play-migration.mjs` exit 0; all are recorded in the P9
story. Browser suites were not run, since nothing browser-driven changed.

## Next action

Play's only open follow-up is 10. The human chose next (2026-10-21) to draft a
new **rebus input** epic, which Play's EPIC lists as a non-goal. Builders
and players need multi-character cell entry through the shared
`src/lib/keyboard-intent.ts`. Recheck the reference doc's rebus note
(`docs/NYT-CROSSWORD-REFERENCE.md:190`) against current code rather than
trusting it. Draft the EPIC and its first story, then stop for human approval.
In parallel, the human is manually testing build → hints → publish → play;
findings become their own stories.

## Resume prompt

Read docs/epics/11-play/HANDOFF.md. Draft the rebus input epic and its first story on main; stop for human approval before freezing or implementing.
