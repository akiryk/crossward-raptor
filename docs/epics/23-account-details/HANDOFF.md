# Account details — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** [HISTORY](HISTORY.md) (the human's orchestration
delegation; the handoff as of ce21990: each story's delivery, review and
verification, and Decisions 1–11 as reported to the human).

## Current state (2026-11-09)

**Closed 2026-11-09.** S1–S5 are done and on `main` (S1, S2 direct;
S3–S5 via PRs #35–#37). The human's visual checks 1, 3, 4 and 5 passed,
and Decisions 1–11 were accepted with no overrules. Check 2 (the
masthead) found two bugs where the root layout's masthead stayed stale
after an in-app navigation: no Account after the username step's save,
and "Account | Sign out" still shown after Sign out. Closeout fix
**23-C1** (PR #38, independently reviewed with no blockers, merged
ce21990) fixes both, with regression tests in
`e2e/masthead-session-state.spec.ts` (LEARNINGS 9). The human
rechecked the masthead after the fix (2026-11-09): passed.

Scope note kept from Decision 7: a session without a username can still
use Better Auth's own endpoints (read the session, sign out, list or
revoke sessions, `update-user` for Better Auth's unread `name`/`image`).
None of them touches a puzzle or sets the username; the app's own pages
and actions are all gated.

Accepted risks (Decision 11, S5 "Accepted decisions for the human's
check"): no rate limit on sending the email-change confirmation;
"already in use" reveals that an account has that email; an expired or
bad link lands silently on the library; the link signs in a signed-out
browser; only the new address confirms, so a stolen session can move the
account; a stale second link can move a new account made at the old
address within 15 minutes.

## Verification (observed 2026-11-09)

- 23-C1 at 241a404: reviewer `npm run verify` exit 0 (961), focused
  e2e 74 of 74 across 7 specs; Vercel CI passed. Orchestrator's full
  `npm run test:e2e`: 1341 passed, 3 failed outside the changed paths;
  those files reran 26 of 26 after a reset.
- Closeout tree (this commit), by the orchestrator: `npm run verify`
  exit 0 (961 tests; 2 lint warnings outside the epic). Full
  `npm run test:e2e`: 1343 passed, 1 failed (`delete-published.spec.ts:318`,
  `ECONNRESET`, open item 2); after a reset the file reran 12 of 12 passed.

## Closeout audit (2026-11-09)

One independent, report-only audit on ce21990, by an agent that wrote
none of the work. No blockers. Dispositions, by the orchestrating
session under the human's delegation (HISTORY, Orchestration):

1. S4, S5 "Acceptance (proposed)" headings. *Fixed* (label only).
2. S3, S4 credited S1 to a7155dd (the handoff commit). *Fixed*: 6804021.
3. `auth.ts` comment: the step's save is the "only writer" of the
   username. *Fixed* (S4's change writes it too).
4. Handoff stale after 23-C1; check 2 unreported. *Fixed* (this rewrite).
5. Story status lines S1, S3–S5 behind. *Fixed.* Epic index. *Fixed.*
6. `TextInput`'s unused `readOnly` prop. *Removed.*
7. DEVELOPMENT's local sign-in steps predate the username step. *Fixed.*
8. `username.ts` comment omits Account details. *Fixed.*
9. Leftover S5 worktree and merged epic-23 branches. *Deleted.*
10. The same stale-masthead pattern on other redirects. *Accepted*:
    open item 1.
11. No full e2e run exits 0 on the final head; recurring flakes.
    *Accepted* as in epic 22: the failures are known harness flakiness in
    specs this epic doesn't change. See open item 2.
12. Cookie-cache constraint untested. *Accepted*: open item 3.
13. The caption's disabled state untested (the caption is fixed
    `text-muted`). *Accepted.*
14. The epic's extra risk paths (`auth.ts`, `require-session.ts`,
    `account-actions.ts`) aren't in CODE-REVIEW. *Accepted*: open item 4.
15. The e2e lock lived only in this handoff. *Fixed*: moved to
    DEVELOPMENT (E2E environment), with the reset-before-rerun note.
16. S1's 9.4px tolerance against today's 9.31px. *Accepted* (0.09px).
17. LEARNINGS entry for the masthead. *Added* (9).

Prunable decisions 1–6, 8–10: *pruned* (each pinned by the tests the
audit named, or recorded in its story; full text in HISTORY). 7 and 11
were trimmed into the notes above.

## Open items after closeout

1. **Stale masthead on other redirects** (LEARNINGS 9): a server
   action's `requireSession()` redirect to `/` (a username removed
   mid-page; a session ended in another tab), and middleware redirects
   during client navigation, likely leave "Account | Sign out" over the
   step or the sign-in form until a reload. Not observed in a browser.
2. **Browser-suite flakiness** (as epic 22's open item 1):
   `get-session` ECONNRESETs, animation-timing reads (22-S3-8, 18-S5-5)
   and `library-play` timeouts fail 1–4 tests per full run.
3. Enabling Better Auth's cookie cache would break the username guard
   (`src/lib/require-session.ts:13-14`); no test pins it off.
4. CODE-REVIEW's risk paths could add `src/lib/auth.ts`,
   `src/lib/require-session.ts` and `src/app/account-actions.ts`. That's
   a policy change for the human.

## Next action

None in this epic. No later epic is started.

## Resume prompt

Epic 23 (account details) is closed per docs/epics/23-account-details/HANDOFF.md; no next epic is defined. Ask the human what to work on next.
