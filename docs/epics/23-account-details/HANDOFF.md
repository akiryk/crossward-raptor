# Account details — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).
3. [HISTORY, Orchestration](HISTORY.md#orchestration): the human's
   delegation for this epic.

## Current state (2026-11-09)

**EPIC approved by the human 2026-11-09.**

**Standing for every session of this epic:** the session is the
orchestrator (the human's words in HISTORY). Sub-agents draft, review,
implement and test; the orchestrator approves and freezes each story
after an independent review of the draft, decides open questions
itself (listed below), and asks the human nothing until every story is
delivered, then asks for the visual checks before closeout. Ask
earlier only if truly blocked.

- **S2 done** (frozen e90a745, implemented 37913ad direct to `main`,
  independently reviewed: no blockers).
- **S1 done** (frozen 826079d, implemented 6804021 direct to `main`,
  independently reviewed: no blockers, two nits left as is).
- **S3 done** (frozen 2dcb6cb, implemented 62a200a on
  `story/23-S3-email-only-sign-in`, PR #35 independently reviewed: no
  blockers; merged 61c17d0).
- **S4 done** (frozen 40ce315, implemented 2fc118b on
  `story/23-S4-account-in-masthead`, PR #36 independently reviewed: no
  findings; merged f556774).
- **S5 done** (frozen e8b5f6b, implemented afcb670 on
  `story/23-S5-changing-the-email`, PR #37 independently reviewed: no
  blockers; merged 47342b6). S4's `TextInput` `readOnly` prop is now
  unused (left in place).
- **The human's visual and manual checks (2026-11-09):** 1 sign-in and
  the step, 3 Account details, 4 the email change (Mailpit), 5 the 12px
  label: passed, no overrules. Two bugs found, both from the root
  layout's masthead outliving an in-app navigation:
  (a) after the step's Get Started, `/puzzles` showed no Account until a
  reload; (b) after Sign out, the sign-in form still showed
  "Account | Sign out", and Account still opened Account details (its
  save refused). (b) predates the epic (09-A3's `router.push('/')`).
- **Closeout fix 23-C1** on `story/23-closeout-masthead-session`:
  `saveUsername` revalidates the root layout before its redirect; Sign out
  does a full load of `/` (`window.location.assign`), which also drops the
  router's cached signed-in pages. New regression tests
  `e2e/masthead-session-state.spec.ts` (3 tests) fail on the unfixed code
  and pass with the fix; no frozen acceptance changed. The orchestrator
  wrote the fix itself (two lines); the PR gets an independent review.
- Browser runs share the e2e database: every agent takes the lock
  `mkdir /tmp/crossward-e2e.lock` before a Playwright run and removes it
  after.

## Decisions for the visual check

1. **S2, "separate lists":** the username lists are their own but may
   share words with the puzzle-name lists, so the human's "Lil Orange
   Fox" can be generated. Shared: Cozy, Gentle, Happy, Jolly, Merry,
   Orange. "Happy Burly Harley" can't ("Harley" isn't a creature; nouns
   are creatures).
2. **S2, list shape:** slot 1 mood words (63), slot 2 look words:
   colours, patterns, textures (60), creature nouns (82); skin-tone
   colours and political/insult readings left out (story lists them).
3. **S1, hint rows:** stay 58px apart (the gap between rows grows from
   5px to 9px), so nothing moves at Create Hints; each hint answer sits
   closer to its line (capitals 7.77px under it, were 9.31px).
4. **S1, Hint Box word:** padding 8px top, 6px bottom, keeping its 30px
   box on the hint's baseline.
5. **S1, red Preview tooltip:** fits on one line at 12px (2.8px spare);
   the test allows one or two lines.
6. **S1, the caption:** `TextInput`'s caption names the field for
   screen readers (the caption itself hidden from them), so it isn't
   announced twice; it stays muted in every state.
7. **S3, Better Auth's routes:** a session without a username can still
   use Better Auth's own endpoints (read its session, sign out, list and
   revoke sessions, `update-user` for Better Auth's unread `name`/`image`);
   none touches a puzzle or sets the username. The app's own pages and
   actions are all gated. This narrows the EPIC's "every route".
8. **S3, two tabs on the step:** the later save wins.
9. **S4, mockup departures:** the modal keeps its ✕; Cancel at rest is
   the alternate look (the mock's darker gray is its hover); disabled
   Update keeps the app-wide disabled look (primary at half opacity),
   not the mock's light gray. No test pins the disabled look.
10. **S4, `changeUsername`:** a second action that saves without
    navigating (S3's save always goes to `/puzzles`); the page
    refreshes in place. Two tabs: the later save wins.
11. **S5, accepted risks** (listed in the story's "Accepted decisions
    for the human's check"): no rate limit on sending the confirmation;
    "already in use" reveals an account has that email; an expired or
    bad link lands silently on the library; the link signs in a
    signed-out browser; only the new address confirms, so a stolen
    session can move the account (notifying the old address is a
    possible follow-up); a stale second link can move a new account
    made at the old address within 15 minutes.

## Verification

- S2 at 37913ad: `npm run verify` exit 0 (780 tests; 2 lint warnings
  outside the epic), run by the independent reviewer. No browser suite
  required.
- S1 at 6804021: `npm run verify` exit 0 (780 tests; 2 lint warnings
  outside the epic), run by the independent reviewer. Full
  `npm run test:e2e` by the implementer from a `git archive` copy of
  the same source tree (Turbopack can't build in a worktree nested in
  the checkout): 1288 passed, 1 failed, 18-S5-5 (`done-icon`, a corner
  pixel 3 off, recorded in the story as unrelated); its file reran
  8 of 8 passed.

- S3 at 62a200a: `npm run verify` exit 0 (886 tests), run by the
  independent reviewer. Full `npm run test:e2e`: 1302 passed, 4 failed,
  none in S3's paths (3 `ECONNRESET` in the sign-in helper:
  `play-entries.spec.ts:600`, `puzzle-library.spec.ts:750`, `:770`; one
  500ms timing timeout, `lock-tick-button.spec.ts:565`, 21-S13-6); the
  three files reran 60 of 60 passed. **A clean full e2e run is still owed
  before closeout.**

- S4 at 2fc118b: `npm run verify` exit 0 (912 tests), full
  `npm run test:e2e` 1322 passed, 1 failed (`play-entries.spec.ts:600`,
  `ECONNRESET` in a helper; file reran 27 of 27), both by the independent
  reviewer; the implementer's run likewise (1 unrelated `ECONNRESET`).

- S5 at afcb670: `npm run verify` exit 0 (961 tests), by the independent
  reviewer and the implementer. Reviewer's full `npm run test:e2e`: run 1
  1338 passed, 3 failed (`duplicate.spec.ts`, unrelated; file reran 6 of
  6); **run 2: 1341 passed, exit 0 — the clean full run owed above.**

- 23-C1 (fix tree on `story/23-closeout-masthead-session`), by the
  orchestrator: `npm run verify` exit 0 (961 tests). Full
  `npm run test:e2e`: 1341 passed, 3 failed outside the changed paths
  (22-S3-8 animation timing; `library-play.spec.ts:191` timeout, `:419`
  `ECONNRESET`). After a fresh `pretest:e2e` reset, those two files reran
  26 of 26 passed. (Reruns without a reset fail `library-play` on
  unfixed code too: it depends on a freshly reset database.)

## Next action

The human's visual and manual checks (the decisions above, and S5's
email arriving in Mailpit in development); act on any overrules, then
close out the epic per [AUDIT](../../process/AUDIT.md).

## Resume prompt

Read docs/epics/23-account-details/HANDOFF.md. All stories are delivered; take the human's visual-check results, act on any overrules, then close out the epic.
