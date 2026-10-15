# Story A4 — Renew sessions during ordinary app activity

The Accounts decision already requires 30-day sessions that renew on activity.
A real-browser reproduction on 2026-10-15 confirmed that a still-valid session
eligible for refresh renews in the database on `/puzzles`, but its browser
cookie keeps the old expiry. The same session, aged again, renews both expiries
through the real auth endpoint. Ordinary app use therefore still signs an
active user out when the original browser cookie expires.

This focused follow-up completes A1's existing policy. It adds no new account
or ownership behavior.

## Decisions

- Keep a 30-day session lifetime and a one-day update age. Renew only a
  currently valid session; never resurrect expired or revoked sessions.
- Normal authenticated entry, client navigation, returning to a tab, and
  visible keyboard/pointer activity in an already-open page must permit
  renewal. A person editing in one tab need not navigate or sign in again.
- Keep database expiry and browser cookie expiry together, approximately
  30 days after the qualifying activity. Browser renewal must run through a
  response that can actually write cookies. A server-component database
  renewal whose response headers are discarded is insufficient.
- Avoid idle polling and throttle activity-driven session reads. Preserve
  authoritative server-side validation and the existing security guards.
- Use the installed Better Auth protocol. Deferred GET/POST refresh is
  permitted; a GET alone is not required to mutate a session.

## Repo paths

- `src/lib/auth.ts` — session refresh configuration as needed.
- `src/lib/auth-client.ts` — browser session configuration if needed.
- `src/components/auth/SessionRenewal.tsx` — browser renewal observer if needed.
- `src/components/layout/Header.tsx` — mount the observer for signed-in users.
- `e2e/session-renewal.spec.ts` — new frozen acceptance specification,
  prepared from the demonstrated failure before implementation.
- `e2e/helpers/session-renewal.ts` — editable protocol/database plumbing;
  modify only fresh test sessions in `localhost:5433/crossward_test`.
- `docs/epics/09-accounts/EPIC.md` — record this follow-up in the story list.
- `docs/epics/09-accounts/HANDOFF.md` — verification and delivery checkpoint.

No schema, engine, puzzle storage, Server Action, or ownership changes belong
to this story. Existing acceptance tests remain frozen.

## Acceptance examples

`e2e/session-renewal.spec.ts` uses fresh real magic-link sessions and ages
their database and signed browser-cookie expiry to 28 days from now. These
sessions are still valid and exceed the one-day refresh threshold.

1. Visiting `/puzzles`, signed-in `/` (which redirects), or `/style-guide`
   renews both expiry values to approximately 30 days from now. The signed
   cookie token stays unchanged and the visitor remains authenticated.
2. A session that becomes eligible after the library is hydrated renews
   during ordinary client navigation through the home link.
3. A session that becomes eligible in an already-open editor renews on real
   pointer/keyboard activity without navigating or changing puzzle content.
4. The real auth endpoint protocol renews both expiry values as a control.
5. A fresh session's expiries do not move before the one-day update age.

Browser Date may advance two minutes in the activity cases to cross a
reasonable local throttle; server and browser-cookie expiry clocks stay real.
Existing `e2e/session-validation.spec.ts` and `e2e/route-protection.spec.ts`
remain the invalid/expired/revoked-session and sign-out guards. Do not weaken
them or revive an expired session to satisfy renewal.

## Reproduction evidence

On the unmodified implementation, `npm run test:e2e -- e2e/renewal-probe.spec.ts
--workers=1` passed its temporary diagnostic (one auth setup and one probe):

- `/puzzles`: database expiry changed from `2026-11-12T19:39:22.288Z` to
  `2026-11-14T19:39:22.383Z`; browser expiry stayed at the former value.
- Direct auth request after re-aging: database expiry became
  `2026-11-14T19:39:22.776Z`, browser expiry `2026-11-14T19:39:22.783Z`.
- The signed cookie value stayed unchanged. The temporary probe was removed
  before the acceptance baseline; no existing acceptance spec was edited.

## Definition of done

1. Commit this story and its coherent acceptance spec before implementation;
   keep the spec frozen afterward and demonstrate its ordinary-activity
   cases fail on the old code.
2. `npm run verify` and ordinary `npm run test:e2e` exit 0, including the new
   regression and unchanged existing guards.
3. Review session-write paths to confirm reads cannot silently advance the
   database while leaving the browser on its original expiry. Confirm no
   idle polling or additional authorization/ownership behavior was added.
4. Update the Accounts handoff with actual checks and delivery state. The
   independent Accounts closeout audit rechecks the renewal finding before
   the epic closes; no author self-audit.
