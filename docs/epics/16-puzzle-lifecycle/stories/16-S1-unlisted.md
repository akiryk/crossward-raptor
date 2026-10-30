# Story S1 — Unlisted

"Private" becomes "Unlisted" and starts working. Other builders' unlisted
puzzles leave the Play view unless you've started them, and the link
still opens them for anyone signed in. The Publish dialog's choice reads
Unlisted and Public.

**Status: approved and frozen** (2026-10-29). The human approved this
specification, its acceptance and the amendments, and chose option 1 of
the [Build marker question](#build-marker-question-settled): a published
Build row keeps `[published]`.

**Implementation (2026-10-29):** on `story/16-S1-unlisted` from the freeze
commit `0563d69`, in a PR awaiting independent review. Changed only the
three declared runtime files. Observed on the implementation tree:
`npm run verify` exit 0 (Vitest 606 of 606) and the full
`npm run test:e2e` exit 0 (780 of 780); frozen acceptance unchanged from
`0563d69`.

**Blast radius: small.** One `where` clause in `listPuzzles`, one radio
label in the Publish dialog and one status label. No schema change, no
migration and no engine change. `src/app/puzzles/actions.ts` is a
CODE-REVIEW risk path, so the work goes on branch
`story/16-S1-unlisted` with a PR and an independent review.

## What the code does today

Inspected `listPuzzles`, `loadPlayPuzzle`, `startPlaySession`,
`resetPlaySession` and `publishPuzzle` in `actions.ts`; `PublishDialog`,
`src/lib/puzzle-status.ts`, `PuzzleRow`, `src/app/puzzles/page.tsx`, the
play page; and every frozen test that names a visibility.

- `listPuzzles` reads `OR: [{ builderId: caller }, { publishedAt: not null }]`
  in one `findMany`, with the caller's own play session nested in it. The
  page splits the result into Build and Play in the browser.
- Play by URL (`loadPlayPuzzle`, `startPlaySession`) checks only
  `publishedAt`, never visibility. A mounted player starts the caller's
  session (`startPlaySession`); reads and prefetches don't.
- `PublishDialog`'s radio reads "Private" / "Public" and starts at
  `'private'`.
- `puzzleStatus`'s label reads "Published · Private" or "Published ·
  Public", but no screen renders the label today; the library uses only
  its `kind`. The Build row carries visibility only in `data-visibility`.

## Decisions

### Who sees an unlisted puzzle listed *(EPIC)*

- `listPuzzles` returns a puzzle when any of these holds:
  - the caller built it (any phase, either visibility), as today;
  - it's published and public;
  - it's published and the caller has a play session for it.
- Everything else, including another builder's published unlisted puzzle
  the caller hasn't started, is excluded **in the one `findMany`**. It is
  never read, never sent and needs no second query *(keeps
  14-S2's "sends only what the library shows" and the single-query
  snapshot)*.
- Only the caller's own session counts. Another player's session, or the
  builder's own session, doesn't list it for anyone else.
- The client split is unchanged: Play shows the published puzzles
  returned, Build the caller's own. So Play shows your own puzzles in
  either visibility, other builders' public ones and other builders'
  unlisted ones you've started; Build is unchanged.
- **Started means a session exists.** Opening the link mounts the player,
  which starts a blank session, so a tester who opens the link finds the
  puzzle listed afterwards, untouched. Resetting replaces the session, so
  a reset puzzle stays listed. This follows from the existing session
  rules; S1 adds no new trigger.
- **Mid-solve visibility change** *(EPIC)*: a player with a session keeps
  the puzzle listed when it becomes unlisted (the change itself is S2).
  S1's rule gives this for free, since it doesn't look at history.

### Link access *(EPIC)*

Unchanged. Anyone signed in can open a published puzzle of either
visibility at `/puzzles/{id}/play`. Sign-in stays required (middleware and
`requireSession`). Existing frozen play-route, entries and completion tests
already cover both visibilities by another builder.

### The name *(EPIC)*

- The Publish dialog's radio reads **Unlisted** then **Public**. Unlisted
  is still the default. The heading "Who can play it?" and the rest of the
  dialog are unchanged.
- `puzzleStatus`'s published label reads "Published · Unlisted" or
  "Published · Public". It's still not rendered anywhere; this keeps the
  word consistent for whoever renders it next.
- **The stored value stays `'private'`** *(EPIC's proposed, settled here)*.
  The `Visibility` type, `publishPuzzle`'s validation, `data-visibility`
  and the database are unchanged, so no migration is needed and every
  existing private puzzle is unlisted the moment this ships. Code and test
  identifiers keep `private`; only user-facing words change (the same line
  L2a drew for "hints").

### The Build view's visibility marker *(human, 2026-10-29)*

The EPIC asks S1 to settle whether the Build view marks visibility.
**Not in S1.** A published Build row keeps `[published]`,
with visibility only in `data-visibility`. S2's row menu then shows it in
use: it offers "Make public" on an unlisted puzzle and "Make unlisted" on a
public one. See [Build marker question](#build-marker-question-settled).

### No other change

No change to Build, the row layout, play, the editor, `publishPuzzle`,
deletion or the schema. `src/engine/**` is untouched.

## Build marker question *(settled)*

**Should a published Build row show its visibility?** The human chose
option 1 (2026-10-29).

1. **No, keep `[published]`** *(recommended)*. Smallest change; S2's menu
   reveals the current visibility through its "Make …" item. A builder
   can't tell at a glance which of their puzzles are public.
2. **Yes: `[unlisted]` or `[public]` replaces `[published]`.** Visible at
   a glance in Build. It supersedes more frozen 14-S2 acceptance (marker
   text and the edit link's accessible name "title [published]" in
   14-S2-3, `puzzle-library`, `library-play` and `publish-status`) and
   needs one more proposed browser case. The acceptance below assumes
   option 1 and would be extended if option 2 is chosen.

## Acceptance

*Frozen* (approved 2026-10-29). Two new files plus the amendments
listed under [Retired and amended acceptance](#retired-and-amended-acceptance).

### e2e/unlisted.spec.ts

Browser cases at the default viewport. The suite shares one database, so
rows are found by unique titles, never by position or count. Another
builder is `seedOtherBuilder()`; a second signed-in player is a fresh
context with `signInSeededUser`.

1. **16-S1-1 who Play lists**, across a reload: the caller's own unlisted
   and public puzzles, another builder's public one, and another
   builder's unlisted one the caller has an in-progress session for
   (`[in-play]`, `data-play-state="in-progress"`) are listed, each linking
   to its play URL. Another builder's unlisted puzzle the caller hasn't
   played, and one only a third player has played, are absent. Build shows
   both own puzzles and none of the foreign ones.
2. **16-S1-2 the link** for another builder's unlisted puzzle: absent
   from Play; opening `/puzzles/{id}/play` loads it with the caller's one
   session; back in the library it's listed in Play as untouched, and
   still absent from Build.
3. **16-S1-3 end to end**: a puzzle published through the dialog with
   Unlisted (the default, checked) is `data-visibility="private"` in Build
   and listed in its builder's Play. A second signed-in player doesn't see
   it in Play, opens its link, and then does.
4. **16-S1-4 the dialog's words**: the radio's labels are exactly
   Unlisted, Public, and the dialog contains no "private" in any case.

### src/app/puzzles/actions.unlisted.test.ts (16-S1-5)

A server action can't be checked over HTTP, so these cover the filter
with an in-memory store that applies Prisma's `where` semantics, including
`playSessions` `some`/`none`/`every`, and throws on anything else.

- One listing: own draft, own unlisted, own public, foreign public and
  foreign unlisted with the caller's session are returned in updated-at
  order; foreign unlisted without one isn't.
- A foreign unlisted puzzle the caller neither built nor played is not in
  the payload (its title sentinel never appears).
- Another player's session, or the builder's own, doesn't list it for the
  caller.
- A listed foreign unlisted puzzle carries `visibility: 'private'` and the
  caller's play state: in-progress for a partial attempt, untouched for a
  blank one *(guard; passes today)*.
- Another builder's unpublished puzzle isn't listed even with a caller
  session *(guard; passes today)*.
- The filter is in the one `findMany`: what the query read doesn't
  contain the hidden puzzle, and no `playSession` query or transaction
  runs.

### Retired and amended acceptance

Each amendment is retired in the specification-only freeze commit.
Every other frozen test is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `src/lib/puzzle-status.test.ts` | PB5-1 "private publishing says private" | label matches `/private/i` | "private publishing says unlisted": matches `/unlisted/i`, not `/private/i` |
| `src/lib/puzzle-status.test.ts` | PB5-1 "published outranks phase and hint completeness" | `'Published · Private'` | `'Published · Unlisted'` |
| `src/app/puzzles/actions.library-play.test.ts` | P5 "keeps every existing field …" | `older-published` is another builder's private puzzle | the caller's own private puzzle (the shape check is unchanged) |
| `e2e/builder-controls.spec.ts` | 14-S4-5 "its content, with no notes …" | radio "Private" checked; labels Private, Public | "Unlisted" checked; labels Unlisted, Public |
| `e2e/publish.spec.ts` | PB3-2 "… offers publishing, private by default" | radio "Private" checked | "… unlisted by default": radio "Unlisted" checked |
| `e2e/library-play.spec.ts` | P5 "every published row offers Play to every player; …" | the foreign row is private, unplayed | "every listed published row …": the foreign row is public |
| `e2e/library-play.spec.ts` | P5 "clicking anywhere on a row …" | the foreign published row is private, unplayed | it's public |
| `e2e/builder-edits.spec.ts` | O3 "the library gives only owners Edit …" | every published fixture is in Play | the foreign private published fixture is absent from Play |

These supersede 14-S2's "Play lists every published puzzle" (its
Decision and the cases above that relied on it) and 14-S4's "Private"
label. `e2e/puzzle-library.spec.ts` needs no change; its foreign
published fixtures are public. Cases that say "private" about the stored
value (publish.spec's "publishing with Private chosen stores it private",
publish-status's "a privately published puzzle …") still hold and are
unchanged.

### Acceptance choices *(drafting)*

- The second player in 16-S1-3 is a fresh `signInSeededUser` context, as
  in play-entries' isolation case.
- Sessions are seeded directly (`seedPlaySession`) for 16-S1-1, and
  started through the real player for 16-S1-2 and 16-S1-3.
- The filter-in-query case pins data minimization, not a query shape: a
  correct filter written with `AND`/`NOT`/`some`/`none`/`every`, `equals`,
  `in`, `notIn` or `not` passes.
- Not covered: changing visibility after publishing (S2) and deletion
  (S3).

### Discrimination (2026-10-29, observed)

- **Throwaway implementation** of the Decisions (the `listPuzzles`
  filter, the radio label and the status label), then reverted; the patch
  is kept outside the repo.
  - Before any test changes, the frozen suites against it: Vitest 3 of 600
    failed and the full `npm run test:e2e` 5 of 776 failed, exactly the
    eight cases in the table above, and nothing else.
  - With the proposed tests: Vitest 606 of 606; the new spec and the four
    amended browser specs 57 of 57.
- **Current `main` runtime with the proposed tests:**
  - Vitest: 6 failed. Four new 16-S1-5 cases (the two guards pass), and
    the two amended label cases.
  - Browser, the same five specs: 7 failed, 50 passed. All four new cases,
    plus the amended 14-S4-5, PB3-2 and O3. The two amended
    `library-play` cases pass on both, as intended: they no longer depend
    on the old listing.
- **Two mutations on the throwaway,** each caught by one case: counting
  any player's session (`some: {}`), and fetching every published puzzle
  then filtering in JavaScript.
- `tsc` and ESLint pass on the proposed tests. `npm run verify` fails until
  implementation, by design.

## Repo paths

Acceptance (immutable after freeze): the two new files above and the
amendments in the table.

Runtime:

- `src/app/puzzles/actions.ts` (risk path): `listPuzzles`'s `where`.
- `src/components/grid/PublishDialog.tsx`: the radio label and the doc
  comment's "Private".
- `src/lib/puzzle-status.ts`: the published label and its doc comment.
- This story, `../EPIC.md` and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S1. Out of scope:

- the row menu and changing visibility (S2);
- deleting published puzzles and the "no longer available" page (S3);
- duplicating (S4);
- renaming the stored value, the `Visibility` type or test identifiers;
- any change to sign-in or play-by-URL access.

## Definition of done

- The human answers the pending question and approves this specification,
  its acceptance and the amendments, recorded here and in the handoff.
  Freeze on `main` in a specification-only commit before any runtime
  change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- A PR from `story/16-S1-unlisted`, independently reviewed per
  CODE-REVIEW, and the handoff updated with observed results.
