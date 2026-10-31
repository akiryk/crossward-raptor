# Story S2 — Row menu and visibility

Every Build row gets a three-dot button that opens a menu of the puzzle's
actions, in place of the trailing Delete. From it the builder switches a
published puzzle between Unlisted and Public. Nothing else about the
puzzle changes.

**Status: approved and frozen** (2026-10-31) at `a624b16`. The human approved this
specification, its acceptance and the amendments, and accepted the
recommended answer to both [questions](#pending-questions-settled): the
proposed visual values, and `updatedAt` unchanged on a visibility change.

**Blast radius: medium.** One new server action, a new generic menu
component, a Build row wrapper for it, the delete dialog made controlled
and a style-guide sample. No schema change, no migration and no engine
change. `src/app/puzzles/actions.ts` is a CODE-REVIEW risk path, so the
work goes on branch `story/16-S2-row-menu` with a PR and an independent
review.

## What the code does today

Inspected `PuzzleRow`, `PuzzleLibrary`, `LibraryDeleteDialog`,
`LibraryPlayControls`, `library-row.ts`, `actions.ts`, `Modal`, the
style-guide page, the Prisma schema and every frozen test that names the
row's Delete or its right control.

- A Build row's only control is `LibraryDelete`: a text button "Delete"
  (`puzzle-delete-button`, `ROW_CONTROL`: `body-normal` `error`, 12px
  from the right on line 1), shown on unpublished rows only. It opens
  the "Delete puzzle?" Modal, which returns focus to the button on
  dismissal. Confirming focuses the heading once the row is gone.
- No action changes visibility after publishing. `publishPuzzle` sets it
  once, and every edit action requires `publishedAt: null`.
- `Puzzle.updatedAt` is `@updatedAt`, so a plain Prisma write stamps it.
  The library orders rows by it and shows it as the row's date.
- There's no menu component anywhere in the app.
- Frozen tests pin the old Delete in `e2e/puzzle-library.spec.ts`:
  14-S2-2's right control, 14-S2-3's per-row Delete count and every
  14-S2-6 case (opened through `puzzle-delete-button`, focus returning to
  it). `focus-ring.spec`'s row case takes the row's first button, so the
  menu button satisfies it unchanged.

## Decisions

### The menu *(EPIC; behavior settled here)*

- **Every Build row** has a three-dot button where the Delete button was.
  Play rows don't have one and are unchanged.
- **Its items in S2** depend on the row:
  - unpublished (grid or hints phase): **Delete**;
  - published and unlisted: **Make public**;
  - published and public: **Make unlisted**.
  The EPIC's full order is Duplicate, the visibility item, then Delete.
  Duplicate arrives in S4 and Delete on published rows in S3, each in
  that order. So in S2 every menu has exactly one item.
- **The button** is a `<button>` with no visible text: an SVG of three
  dots and the accessible name "Actions for {title}", `aria-haspopup="menu"`
  and `aria-expanded`. It gets the 14-S11 focus ring like any button.
  Clicking it never follows the row's link.
- **The menu** is `role="menu"`, named by its button. Its items are
  `role="menuitem"` buttons. At most one menu is open at a time.
- **Keyboard and pointer** follow the WAI-ARIA menu button pattern:
  - Enter, Space or ArrowDown on the button opens the menu on the first
    item; ArrowUp opens it on the last.
  - ArrowDown/ArrowUp move between items and wrap. Home and End go to the
    first and last item.
  - Escape closes the menu and returns focus to the button. Tab closes it
    and focus moves on as usual.
  - Clicking outside the menu, or the button again, closes it.
  - Choosing an item closes the menu and returns focus to the button,
    except while a change is pending (below).
- **A new generic component** with its own style-guide sample
  (`sg-row-menu`): a closed three-dot button whose menu offers "Make
  public" and "Delete", which do nothing. The Build row wraps the same
  component. The sample has two items, so it carries the multi-item
  keyboard checks that S2's one-item rows can't.

### Delete through the menu *(EPIC)*

Choosing Delete opens the existing "Delete puzzle?" dialog, unchanged:
the same copy, buttons, pending lock, failure alert and retry. Dismissing
it returns focus to the row's menu button, since the Delete item went
with the closed menu. Confirming still deletes in place and focuses the
heading. Published rows get Delete in S3.

### Changing visibility *(EPIC)*

- **The action** is `setPuzzleVisibility(id, visibility)` in
  `actions.ts`. It requires a session, then validates the value
  (`'private'` or `'public'` only) before any database access.
- **It changes only the caller's published puzzle.** It refuses
  everything else: an unpublished puzzle, another builder's, a missing
  one. Each refusal throws and changes nothing. Ownership and
  publication are checked by the write's own condition, as in
  `updateUnlessPublished` and `publishPuzzle`.
- **Only `visibility` changes.** The ID (and so the URL), title, grid,
  hints, phase, `gridBeforeHints`, `publishedAt`, `createdAt` and every
  play session stay as they are. **`updatedAt` doesn't change either**
  *(human, 2026-10-31)*. The row's date means the last change to the puzzle
  itself, and the row keeps its place instead of jumping to the top of
  its group under the open menu. Prisma's `@updatedAt` would stamp it, so
  the action keeps its value explicitly.
- Choosing the current value succeeds and changes nothing. It returns
  `{ visibility }` and revalidates `/puzzles`, so the action's response
  refreshes the row, as Reset does.
- **No confirmation.** Either direction can be undone from the same
  menu. Making a puzzle public is the bigger step, but it's reversible,
  and the Publish dialog already asked who can play it.
- **In the library:** the change happens in place, with no reload or
  navigation. On success the menu closes, focus returns to its button,
  the row's `data-visibility` becomes the stored value, and the menu
  then offers the opposite item. The row keeps `[published]` (16-S1).
- **Pending:** the menu stays open. The item is `aria-disabled` and does
  nothing if chosen again. Escape and clicking outside don't close the
  menu, matching the delete dialog's pending lock.
- **Failure:** the menu stays open with a `role="alert"` message
  (`puzzle-menu-error`), "Could not make the puzzle public. Please try
  again." or "… unlisted …". The item works again, and choosing it
  retries. The message clears on the next success or reopening.

### Visual values *(human, 2026-10-31)*

- **Button:** 24×24, 12px from the row's right edge, centered on the
  title line. Three dots in `muted`, `primary` on hover and keyboard
  focus. Pointer cursor.
- **Menu:** 4px below the button, right edges aligned, at least 160px
  wide. `modal-background`, a 1px `line-muted` border, the `modal`
  radius (10px) and no shadow.
- **Items:** 32px tall, 12px horizontal padding, `body-normal`.
  `primary` text with Delete in `error`, and a `puzzle-row-hover`
  background on hover and keyboard focus.

### Other players *(EPIC, via 16-S1)*

S1's listing rule already gives the EPIC's mid-solve behavior, and S2
adds nothing to it. After a puzzle is made unlisted, a player with a
session keeps it in Play, keeps their progress, and their open page keeps
saving. Everyone else stops seeing it listed, and the link still works.
After a puzzle is made public, everyone sees it listed. 16-S2-8 checks
this end to end.

### No other change

No change to Play's rows, the editor, play, `publishPuzzle`,
`deletePuzzle`, `listPuzzles` or the schema. `src/engine/**` is
untouched.

## Pending questions *(settled)*

The human accepted the recommended answer to both (2026-10-31).

1. **The menu's visual values:** the proposed values, now under
   [Visual values](#visual-values-human-2026-10-31). The acceptance
   already assumed them.
2. **`updatedAt` stays put** on a visibility change *(recommended)*. The
   rejected option let it stamp, so the row's date would read as the
   visibility change and the row would move to the top of its group.

## Acceptance

*Frozen* (approved 2026-10-31). Two new files, plus the amendments under
[Retired and amended acceptance](#retired-and-amended-acceptance).

### e2e/row-menu.spec.ts

Browser cases at 1280×800 as the suite's signed-in builder. Rows are
found by unique titles, never by position or count. A second and third
player are fresh `signInSeededUser` contexts.

1. **16-S2-1 the three-dot button.**
   - Every Build row (grid, hints, published unlisted, published public)
     has exactly one button, `puzzle-menu-button`, named "Actions for
     {title}", `aria-haspopup="menu"`, `aria-expanded="false"`, with no
     `puzzle-delete-button`. Play rows have no menu button.
   - Its design: a `<button>` with no text, an SVG of three circles, a
     pointer cursor, 24×24, a 12px right inset, centered on the title
     line. `muted` at rest, `primary` on hover and keyboard focus, and
     the focus ring.
2. **16-S2-2 the menu.**
   - It's `role="menu"`, named like its button, and the button is
     `aria-expanded="true"`. It sits 4px below the button with right
     edges aligned, at least 160px wide. `modal-background`, 1px solid
     `line-muted` border, 10px radius, no shadow.
   - Its items are `<button>`s, 32px tall with 12px left padding,
     `body-normal`, a pointer cursor, `error` for Delete and `primary`
     otherwise, and `puzzle-row-hover` on hover.
   - It lies over the row below: the pointer at an item's centre hits
     the item.
3. **16-S2-3 what it offers:** exactly Delete (`puzzle-menu-delete`) on
   grid and hints rows, Make public on an unlisted one and Make unlisted
   on a public one (`puzzle-menu-visibility`).
4. **16-S2-4 opening and closing.**
   - Enter, Space and ArrowDown each open the menu on the first item.
     Escape closes it and focuses the button, which reads
     `aria-expanded="false"`.
   - Tab, clicking outside and clicking the button again each close it.
     Opening another row's menu closes the first.
   - Clicking the button doesn't navigate.
5. **16-S2-5 the style-guide sample** `sg-row-menu`. It starts closed,
   and its menu has Make public then Delete.
   - ArrowDown/ArrowUp move and wrap. Home and End work. Escape returns
     focus to the button. ArrowUp opens the menu on the last item, which
     shows the focus ring. Enter on an item closes the menu and focuses
     the button.
6. **16-S2-6 Delete from the menu:** opens the existing dialog naming the
   puzzle, and the menu is gone. Cancel returns focus to the menu button.
   Opening it again by keyboard and confirming deletes the row and
   focuses the heading.
7. **16-S2-7 changing visibility.**
   - Make public, then Make unlisted, on an unlisted puzzle that another
     player has a session for. Each closes the menu, focuses its button
     and updates `data-visibility` without a reload. The database's
     visibility follows, and everything else in the puzzle row (the
     `updatedAt` included) and its sessions are identical. The row keeps
     `[published]`, and the menu then offers the other item. A reload
     shows the last value.
   - **Pending:** with the request held, the item is `aria-disabled`.
     Escape and an outside click leave the menu open, and choosing again
     sends nothing. **Failure:** with the request aborted, the alert
     reads "Could not make the puzzle unlisted. Please try again.", the
     menu stays open, the item is enabled again and nothing changed.
     Choosing it again succeeds and clears the alert.
8. **16-S2-8 other players.** The builder makes a public puzzle unlisted
   and an unlisted one public through the menu.
   - A player with a session and that puzzle's page open types a letter,
     and it saves. Their Play view still lists it in progress and now
     lists the newly public one.
   - A stranger's Play view lists the newly public one and not the newly
     unlisted one, and the stranger can still open the unlisted one's
     link.

### src/app/puzzles/actions.visibility.test.ts (16-S2-9)

An in-memory store applies Prisma's `where` semantics. Like
`@updatedAt`, it stamps `updatedAt` on any write that doesn't set it. It
throws on raw SQL, on any play-session access and on anything it
doesn't model.

- The caller's unlisted puzzle goes public and back. Each call returns
  `{ visibility }`, and every other field, `updatedAt` included, is
  unchanged. `/puzzles` is revalidated.
- Choosing the current value succeeds and changes nothing.
- An own grid or hints puzzle, another builder's unlisted or public
  puzzle, or a missing ID is refused, and nothing changes.
- `'unlisted'`, `'Public'`, `'PRIVATE'`, `''`, `null`, `undefined`, a
  number and an object are refused before any puzzle query.
- A rejected session means no puzzle query and no revalidation.
- No play-session access and no raw SQL.

### Retired and amended acceptance

Each amendment is retired in the specification-only freeze commit. Every
other frozen test is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/puzzle-library.spec.ts` | 14-S2-2 "the right control …" | measures Build's Delete and Play's Reset | measures Play's Reset only; the menu button is 16-S2-1 |
| `e2e/puzzle-library.spec.ts` | 14-S2-3 "lists only the caller's puzzles … Delete on unpublished rows …" | `puzzle-delete-button` on unpublished rows only | "… the row menu …": every row has `puzzle-menu-button` and none has `puzzle-delete-button` |
| `e2e/puzzle-library.spec.ts` | 14-S2-6, every case | opened with `puzzle-delete-button` | opened by choosing `puzzle-menu-delete` from the row's menu |
| `e2e/puzzle-library.spec.ts` | 14-S2-6 "{dismissal} keeps the puzzle and returns focus to Delete" (×4) | focus returns to `puzzle-delete-button` | "… to the row's menu button": focus returns to `puzzle-menu-button` |

The spec's header comment is updated to match. These supersede 14-S2's
row Delete button. 14-S2-4's "no `puzzle-delete-button` in Play" still
holds and is unchanged.

### Acceptance choices *(drafting)*

- **Test IDs** `puzzle-menu-button`, `puzzle-menu`, `puzzle-menu-delete`,
  `puzzle-menu-visibility` and `puzzle-menu-error` are new. The sample
  reuses the first two.
- **The server store** supports `findUnique`, `findFirst`, `update` and
  `updateMany`, and a callback or array `$transaction`. A correct action
  written with any of these passes. Raw SQL doesn't, since it would
  bypass the guard the test checks.
- **`updatedAt` is pinned twice:** by the store's simulated stamp and by
  the real database in 16-S2-7.
- **Not covered:** Duplicate (S4), and Delete on published rows with the
  "no longer available" page (S3).

### Discrimination (2026-10-29, observed)

- **Throwaway implementation** of the Decisions, with the proposed visual
  values, then reverted. The patch and new files are kept outside the
  repo (`/tmp/s2-throwaway/`).
  - With the proposed tests: Vitest 612 of 612. `row-menu`,
    `puzzle-library`, `focus-ring` and `style-guide`: 69 of 69.
  - The full `npm run test:e2e` ran twice under heavy machine load (load
    average about 33). It got 792 of 795, then 787 of 795. The failures
    were different each time and all were timeouts. None was in a spec
    S2 touches. Every failing spec passed when rerun alone: `focus-ring`,
    `grid-rendering` and `grid-size` (30 of 30), and `color-tokens`,
    `controls` and `new-puzzle-dialog` (25 of 25). **A clean full run on
    the implementation is still required.**
- **Current `main` runtime with the proposed tests:**
  - Vitest: all six 16-S2-9 cases fail and 606 pass. `tsc` reports the
    missing `setPuzzleVisibility`, by design.
  - Browser (`row-menu` and `puzzle-library`): 24 failed, 20 passed.
    All 15 new cases fail, as do the amended 14-S2-3 case and all eight
    14-S2-6 cases. The amended 14-S2-2 case passes on both, as intended,
    since it only drops Build's Delete.
- **Two mutations on the throwaway,** each caught:
  - letting `updatedAt` stamp fails two Vitest cases and 16-S2-7 against
    the real database;
  - dropping the `builderId` guard fails the refusal case.
- ESLint passes on the proposed tests. `npm run verify` fails until
  implementation, by design.

## Repo paths

Acceptance (immutable after freeze): the two new files above and the
amendments in the table.

Runtime:

- `src/app/puzzles/actions.ts` (risk path): the new `setPuzzleVisibility`.
- `src/components/ui/Menu.tsx` (new): the three-dot button and its menu.
- `src/components/puzzle/PuzzleRowMenu.tsx` (new): the Build row's menu,
  its items, the visibility change and its alert.
- `src/components/puzzle/PuzzleRow.tsx`: the menu replaces `LibraryDelete`.
- `src/components/puzzle/LibraryDeleteDialog.tsx`: the dialog without its
  button, opened by the menu.
- `src/components/puzzle/library-row.ts`: `ROW_CONTROL`'s comment (Reset
  only).
- `src/components/puzzle/PuzzleLibrary.tsx`: the focus comment, which
  names the row's Delete button.
- `src/app/style-guide/page.tsx`: the `sg-row-menu` sample.
- This story, `../EPIC.md` and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S2. Out of scope:

- Duplicate (S4);
- Delete on published rows, its wording and the "no longer available"
  page (S3);
- a visibility marker on Build rows (16-S1 kept `[published]`);
- changing Play rows, the editor, play or the Publish dialog;
- renaming the stored `'private'`.

## Definition of done

- The human answers the pending questions and approves this
  specification, its acceptance and the amendments, recorded here and in
  the handoff. Freeze on `main` in a specification-only commit before any
  runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- A PR from `story/16-S2-row-menu`, independently reviewed per
  CODE-REVIEW, and the handoff updated with observed results.
