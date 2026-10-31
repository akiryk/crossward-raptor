# Story S3 — Delete published puzzles

The Build row's menu offers Delete on published puzzles too. For a
published puzzle the confirmation also says that other players lose
their progress. A link to a puzzle that isn't there shows a "no longer
available" page with a way back to `/puzzles`. A player whose save fails
because the puzzle was deleted is told so, not shown the generic save
error.

**Status: done** (2026-10-31). The human approved this
specification, its acceptance and the amendments, and accepted the
recommended answer to all three
[questions](#pending-questions-settled): the proposed copy, the proposed
visual values, and direct delivery to `main`. Frozen at `602c0c5`.
**Implemented and delivered** directly to `main` (2026-10-31):
`npm run verify` exit 0 and the full `npm run test:e2e` exit 0, 806 of
806.

**Blast radius: small.** One more menu item, one more sentence in the
existing dialog, a rewritten `not-found` page and one new state in the
player. There is no server, schema or engine change. No CODE-REVIEW risk
path is touched (`actions.ts` stays as it is; see
[No server change](#no-server-change)), so it's delivered directly to
`main` ([question 3](#pending-questions-settled)).

## What the code does today

Inspected `PuzzleRowMenu`, `LibraryDeleteDialog`, `PuzzleLibrary`,
`actions.ts` (`deletePuzzle`, `loadPuzzle`, `loadPlayPuzzle`,
`savePlayEntries`, `inspectPlayCompletion`), both `[id]` pages and
`not-found.tsx`, `PlayPuzzle`, `play-autosave.ts`, and every frozen test
that names the row menu's items, the not-found page or a failed play
save.

- **Server:** `deletePuzzle` already deletes any puzzle the caller built,
  published or not, and `PlaySession` cascades. 14-S8's
  `actions.builder-edits.test.ts` pins both owner deletion "with
  publishedAt" set and the refusal of another builder's puzzle.
  `play-route.spec` pins the cascade.
- **Menu (16-S2):** published rows offer only the visibility item, and
  unpublished rows offer only Delete. 16-S2-3 and 16-S2-7 pin a
  published menu to exactly that one item.
- **Dialog:** "Delete puzzle?" with "This deletes {title}. This cannot be
  undone.", whatever the puzzle's state.
- **Missing puzzle:** both `/puzzles/{id}` (`loadPuzzle`, owner only) and
  `/puzzles/{id}/play` (`loadPlayPuzzle`, published only) call
  `notFound()`. That renders the shared `[id]/not-found.tsx`, a bare
  "Puzzle not found" (`puzzle-not-found`) with a 404. Frozen tests use
  that page for an unknown ID, another builder's editor URL, and a draft
  or unknown ID in play. They check the test ID, the 404 and, for a
  foreign editor URL, that nothing of the puzzle shows. None checks the
  text.
- **Deleted mid-solve:** `savePlayEntries` and `inspectPlayCompletion`
  throw "This puzzle is not available to play." The production build
  hides server error messages, so the player can't tell this from any
  other failure. It shows "We couldn't save your entries." (or "…verify…")
  with Retry, and Retry fails the same way forever.
- **Frozen request counts:** several play tests count the exact number of
  server-action POSTs after a failed save (`play-entries.spec` "a failed
  save…", `play-completion.spec` "Retry reconciles…" and "a failed
  completion inspection…", `play-reset.spec` "reset waits out…"). The
  frozen unit tests require both play actions to *throw* for a missing
  puzzle.

## Decisions

### Delete on published rows *(EPIC)*

- The menu offers **Delete on every Build row.** On a published row it
  comes after the visibility item: "Make public" or "Make unlisted", then
  "Delete". Unpublished rows still offer Delete alone. Duplicate arrives
  first in S4.
- Choosing it opens the existing "Delete puzzle?" dialog, with the same
  title, buttons, pending lock, failure alert and retry, and the same
  focus rules as 16-S2. Dismissing it returns focus to the row's menu
  button. Confirming deletes in place, with no reload, and focuses the
  heading.
- **Declining deletes nothing:** Cancel, Escape, the backdrop and Close
  leave the puzzle and every play session as they were.
- **Confirming** deletes the puzzle and, by the existing cascade, every
  play session for it, the builder's own included. The row leaves Build
  and, through the same revalidated list, the builder's Play view. Other
  players' Play views stop listing it on their next load (16-S1's listing
  needs the puzzle to exist).

### The confirmation's wording *(EPIC; copy approved)*

- **Published:** "This deletes {title}. Everyone who has played it,
  including other players, loses their progress. This cannot be undone."
- **Unpublished:** unchanged, "This deletes {title}. This cannot be
  undone." Nobody else can have played it.
- The sentence is shown for every published puzzle, whether or not
  anyone has a session. The dialog doesn't count sessions, so it needs no
  new query and can't go stale while it's open.

### The "no longer available" page *(EPIC)*

- **One page for every puzzle link that finds nothing.** Deletion leaves
  no trace (EPIC: no tombstone), so the app can't tell a deleted puzzle
  from an unknown ID, another builder's editor URL or a draft opened in
  play. `[id]/not-found.tsx` covers all of them, in play and the editor,
  so it becomes this page. It still returns 404, keeps the URL, keeps
  `puzzle-not-found` on its container and shows nothing of any puzzle.
- **Copy *(approved)*:** heading (`<h1>`) "This puzzle is no longer
  available.", then "It may have been deleted, or the link may be
  wrong.", then a link "Back to puzzles" to `/puzzles`. The second line
  covers the cases that were never deleted without naming them, so a
  foreign or draft link discloses nothing.
- **Visual values *(approved)*:** inside the existing 24px page padding:
  - heading: `title-2`, `primary`, like the library's "Puzzles";
  - second line: 8px below, `body-normal`, `muted`;
  - link: 16px below the second line, `body-normal`, `button-fill`,
    underlined, `button-hover` on hover, and the 14-S11 focus ring.

### A player mid-solve *(EPIC)*

- **When a save or completion check fails,** the player asks whether the
  puzzle is still there: a plain `GET` of its own play URL, where 404
  means it's gone. **Not a server action.** The frozen tests count the
  play page's server actions after a failure, and an extra action breaks
  three of them (observed; see [Discrimination](#discrimination-2026-10-31-observed)).
  The `GET` reuses the play page's exact access rule, and
  `loadPlayPuzzle` is passive, so it creates nothing. No server code
  changes.
- **If it's gone,** the player shows, in place of the save status,
  "This puzzle is no longer available." and a "Back to puzzles" link to
  `/puzzles` (`play-unavailable`, `role="alert"`). That's the save
  error's style: `body-small`, `error`, with the link styled like Retry
  (`button-fill`, underlined). There's no Retry, and the generic save or
  completion error doesn't show. Editing stops: the letters shown stay
  visible, typing changes nothing and nothing more is sent.
- **Otherwise,** whether the puzzle answered 200, the check failed, or the
  session expired and the request was redirected, the existing generic
  error and Retry show unchanged. Only a 404 proves the puzzle is gone.
- **After that,** a reload or the link shows the "no longer available"
  page, and the puzzle has left the player's Play view.
- Out of scope: a start or reset that fails because the puzzle was
  deleted keeps its existing generic error. These are narrow races, and
  epic 17 removes Reset from play. So does an open editor whose puzzle
  its builder deleted in another tab. The orphaned local draft, keyed by
  the deleted session's ID, stays in `localStorage`; nothing reads it
  again.

### No server change

`deletePuzzle` already does what S3 needs, and the existing tests pin
it. S3 changes no action, schema or `src/engine/**` file. If
implementation finds it needs `actions.ts` after all, that path becomes a
risk-path escalation: declare it, then use a story branch, a PR and
independent review.

## Pending questions (settled)

The human accepted each recommended answer *(2026-10-31)*.

1. **Copy:** the confirmation sentence, the page's heading and second
   line, and the in-player message, as proposed above *(accepted)*.
   The acceptance assumes them.
2. **The page's visual values,** as proposed above *(accepted)*. The
   acceptance assumes them.
3. **Delivery:** S3 touches no CODE-REVIEW risk path, so the policy is
   direct delivery to `main` after `npm run verify` and the full
   `npm run test:e2e` *(accepted)*. The alternative is a story branch,
   PR and independent review anyway, because the story exposes deleting
   other players' progress in the UI. The server rule it relies on is
   unchanged and already reviewed.

## Acceptance

*Frozen.* One new file, plus the amendments under
[Retired and amended acceptance](#retired-and-amended-acceptance).

### e2e/delete-published.spec.ts

Browser cases as the suite's signed-in builder at the suite's default
viewport. Rows are found by unique titles. A second player is a fresh
`signInSeededUser` context.

1. **16-S3-1 Delete on published rows.** The menu reads exactly Delete on
   grid and hints rows, "Make public, Delete" on an unlisted one and
   "Make unlisted, Delete" on a public one. The last item is
   `puzzle-menu-delete`, named "Delete", in `error`.
2. **16-S3-2 the confirmation.** For an unlisted and a public puzzle the
   dialog is "Delete puzzle?". It contains "This deletes {title}.", the
   published sentence and "This cannot be undone.", and its buttons are
   unchanged. For grid and hints puzzles it reads "This deletes {title}.
   This cannot be undone." and doesn't mention other players or progress.
3. **16-S3-3 declining** (×4: Cancel, Escape, backdrop, Close). The
   published puzzle has another player's session. Afterwards the row is
   still there and its menu button has focus. The puzzle's database row
   and every session are identical to before.
4. **16-S3-4 confirming.** A public puzzle with the builder's and another
   player's sessions, plus a kept puzzle with a session. Confirming closes
   the dialog, removes the row in place and focuses the heading. The
   puzzle and both its sessions are gone, and the kept puzzle and its
   session are identical. Play lists the kept puzzle and not the deleted
   one, with no reload.
5. **16-S3-5 the "no longer available" page.**
   - A deleted puzzle's play and editor URLs, and an unknown ID's
     editor and play URLs, each return 404 at the same path.
     `puzzle-not-found` holds the `<h1>`, the second line and a "Back to
     puzzles" link to `/puzzles`. There's no "Puzzle not found" and no
     player, editor or grid cell. The link leads to the library.
   - **Design:** the heading is `title-2` `primary`, and the second line
     `body-normal` `muted`, 8px below it. The link is `body-normal`
     `button-fill` and underlined, its line 16px below the second line
     (within 1px). It's `button-hover` on hover and shows the focus ring
     on keyboard focus.
6. **16-S3-6 a player mid-solve.**
   - The player has the puzzle open with a session, and the builder
     deletes it through the menu. The player types a letter.
     `play-unavailable` appears with `role="alert"`, the message and a
     "Back to puzzles" link to `/puzzles`, in `body-small` `error` with
     the link `button-fill`. Neither generic message nor Retry shows.
     Exactly one server action was sent after the deletion: the failed
     save. Another letter typed elsewhere doesn't appear, and nothing
     more is sent. A reload shows the page, and the player's Play view
     doesn't list the puzzle.
   - **The generic error stays where nothing proves the puzzle is gone.**
     A save aborted while the puzzle exists shows "We couldn't save your
     entries." with no `play-unavailable`, and Retry saves. With the
     puzzle deleted but the check's `GET` aborted, the generic error
     shows again, with no `play-unavailable`.

### Retired and amended acceptance

Each amendment is retired in the specification-only freeze commit. Every
other frozen test is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/row-menu.spec.ts` | 16-S2-3 "Delete on an unpublished row; Make public on an unlisted one; Make unlisted on a public one; nothing else yet" | published menus are exactly the visibility item | "…; Make public then Delete on an unlisted one; Make unlisted then Delete on a public one": published menus are the visibility item, then Delete |
| `e2e/row-menu.spec.ts` | 16-S2-7 "Make public, then Make unlisted: …" | after each change the menu reads exactly `[next]` | it reads `[next, 'Delete']` |

The spec's header comment gains one line for S3. These supersede the
EPIC's "published rows having no Delete". After 16-S2's amendments, no
14-S2 case still pins that, so none changes. `persistence.spec`,
`builder-edits.spec` and `play-route.spec` check `puzzle-not-found` by
test ID and status only, and they hold unchanged.

### Acceptance choices *(drafting)*

- **Test ID** `play-unavailable` is new. `puzzle-not-found` moves from
  the old `<p>` to the page's container. The frozen tests only check that
  it's visible.
- **The check's mechanism is pinned on purpose** (a `GET`, not a server
  action). 16-S3-6 counts server actions, and its second case aborts the
  `GET`. This is the one place the acceptance names a mechanism: the
  frozen request counts already force it.
- **No new Vitest file.** No server code changes. The existing unit tests
  already pin owner deletion of a published puzzle and refusal for
  others.
- **Not covered:** Duplicate (S4); a start, reset or editor save against a
  deleted puzzle; the dialog's failure and pending states, which 14-S2-6
  already covers and S3 doesn't change.

### Discrimination (2026-10-31, observed)

- **Current `main` runtime with the proposed tests**
  (`delete-published`, `row-menu`): 12 failed, 15 passed. Every new case
  fails except 16-S3-6's generic-error case, a guard that passes on both,
  as intended. Both amended 16-S2 cases fail.
- **Throwaway implementation** of the Decisions with the proposed values,
  then reverted. The patch is kept outside the repo
  (`/tmp/s3-throwaway/runtime.patch`).
  - `tsc`, ESLint and Vitest (612 of 612) pass.
  - `delete-published`, `row-menu`, `puzzle-library`, `persistence`,
    `builder-edits`, `play-route`, `play-entries`, `play-completion`,
    `play-reset`, `narrow-play` and `play-design`: 199 of 199, once
    16-S3-5's layout check measured the inline link's line box (a
    drafting fix to the proposed test).
  - Full `npm run test:e2e`: exit 0, 806 of 806 (the 795 existing plus
    the 11 new).
- **Two mutations on the throwaway,** each caught:
  - showing "no longer available" on any failed save, without checking,
    fails 16-S3-6's generic case;
  - checking through the `loadPlayPuzzle` server action instead of a
    `GET` fails both 16-S3-6 cases, plus three frozen play tests that
    count actions (`play-entries` "a failed save…", `play-completion`
    "Retry reconciles…" and "a failed completion inspection…").

## Repo paths

Acceptance (immutable after freeze): `e2e/delete-published.spec.ts` and
the amendments in the table.

Runtime:

- `src/components/puzzle/PuzzleRowMenu.tsx`: Delete on published rows,
  after the visibility item.
- `src/components/puzzle/LibraryDeleteDialog.tsx`: the published
  sentence.
- `src/app/puzzles/[id]/not-found.tsx`: the "no longer available" page.
- `src/components/play/PlayPuzzle.tsx`: the availability check and the
  unavailable state.
- This story, `../EPIC.md` and `../HANDOFF.md`.

Declare any other path before editing it. `src/app/puzzles/actions.ts`
would be a risk-path escalation.

## Scope discipline

Only S3. Out of scope:

- Duplicate (S4);
- soft delete, recovery, tombstones or telling "deleted" from "never
  existed";
- counting or naming affected players in the dialog;
- the start, reset and editor paths against a deleted puzzle;
- cleaning orphaned local drafts;
- any change to `deletePuzzle`, the listing, the schema or the engine.

## Definition of done

- The human answers the pending questions and approves this
  specification, its acceptance and the amendments, recorded here and in
  the handoff. Freeze on `main` in a specification-only commit before any
  runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered per the answer to question 3, with the handoff updated with
  observed results.
