# Story S4 — Duplicate a puzzle

Every Build row's menu offers Duplicate, first. It creates, on the server
from the stored puzzle, a new unpublished puzzle owned by the caller, and
opens it in the editor. The source and its play sessions don't change.

**Status: done** (2026-10-31). The human approved this
specification, its acceptance and the amendments, and accepted the
recommended answers to [question 1](#pending-questions-settled): the
"{title} (copy)" title, appended every time, and the proposed failure
message. Frozen at `0e6658c`. **Implemented** on `story/16-S4-duplicate`
(2026-10-31), touching only `actions.ts` and `PuzzleRowMenu.tsx`:
`npm run verify` exit 0 (Vitest 620 of 620) and the full
`npm run test:e2e` exit 0, 811 of 811. **Done:** independently reviewed
in [PR #31](https://github.com/akiryk/crossward-raptor/pull/31) with no
findings (the reviewer's own run on head `053b6bd`: verify exit 0, E2E
811 of 811) and merged to `main` as `c3bf751`.

**Blast radius: medium.** One new server action, one new menu item and
navigation to the copy. No schema, migration or engine change.
`src/app/puzzles/actions.ts` is a CODE-REVIEW risk path, so the work goes
on `story/16-S4-duplicate`, with a PR and independent review (EPIC: Risk
paths).

## Decisions

### The action

- `duplicatePuzzle(id): Promise<{ id: string }>` in `actions.ts`. It
  requires a session, then reads the source with `{ id, builderId:
  caller }` in its condition. A missing ID or another builder's puzzle
  throws the same error and creates nothing.
- It creates one puzzle:
  - `builderId` is the caller;
  - the title is "{title} (copy)" *(approved)*;
  - `grid`, `hints`, `phase` and `gridBeforeHints` are the stored
    source's (a `null` stays `null`);
  - `publishedAt` is null and `visibility` takes the default;
  - `createdAt` and `updatedAt` are new.

  It copies no play sessions and never writes to the source. It
  revalidates `/puzzles`.
- **Built from the stored source, never from client state** (EPIC).
  Unsaved edits in an open editor aren't copied.

### The menu

- **Duplicate comes first on every Build row**
  (`puzzle-menu-duplicate`, `primary`, with S2's item styles):
  - grid or hints rows: Duplicate, then Delete;
  - published rows: Duplicate, the visibility item, then Delete.
- **Choosing it** follows S2's pending pattern. The menu stays open with
  its items `aria-disabled`. Escape and an outside click don't close it,
  and choosing again sends nothing.
- **On success** the menu closes and the app navigates to the copy's
  editor (`/puzzles/{newId}`).
- **On failure** the menu stays open with `puzzle-menu-error`, "Could not
  duplicate the puzzle. Please try again." *(approved)*.
  The item works again and choosing it retries.
- No confirmation: nothing is lost, and the copy can be deleted. The
  style-guide sample is unchanged.

### The copy

- **It opens in its phase's ordinary editor.**
  - A published or hints-phase source gives a copy in the hints phase:
    the shape is locked, and the title, letters and hints are editable.
  - A grid-phase source gives a copy in grid building.
- **In the library:** the copy is a Build row with its phase's marker.
  It isn't in Play until it's published. The source's row is unchanged.

## Pending questions (settled)

1. **Copy:** the title is "{title} (copy)", appended every time, so a copy
   of a copy is "{title} (copy) (copy)" *(recommended: predictable, no
   lookup)*. The alternative is numbering ("(copy 2)"), which needs a
   query of existing titles. The failure message is "Could not duplicate
   the puzzle. Please try again." The acceptance assumes both.
   **Answer *(human, 2026-10-31)*:** both as recommended.

## Acceptance

*Frozen.* Two new files, plus the amendments under
[Retired and amended acceptance](#retired-and-amended-acceptance).

### e2e/duplicate.spec.ts

Browser cases as the suite's signed-in builder at the suite's default
viewport. Sources are seeded from play-route's 3×3 fixture in each state
and found by unique titles; a copy's row by its exact title.

1. **16-S4-1 what the menu offers.** Exactly "Duplicate, Delete" on grid
   and hints rows, "Duplicate, Make public, Delete" on an unlisted one and
   "Duplicate, Make unlisted, Delete" on a public one. The first item is
   `puzzle-menu-duplicate`, named "Duplicate", in `primary`.
2. **16-S4-2 duplicating a published puzzle.** A public puzzle with the
   builder's and another player's sessions. Duplicate opens a new
   `/puzzles/{id}` editor. The copy is owned by the caller, titled
   "{title} (copy)", with the source's grid, hints, phase and
   `gridBeforeHints`, unpublished and `private`, with new dates and no
   sessions. The source row and both sessions are identical to before.
   The editor shows the copy's title, editable, with no publish state, the
   shape step disabled, letter locking and the source's hints. Editing a
   hint saves to the copy only. In the library the copy is a `[hint]`
   unpublished Build row, the source is still `[published]` and public,
   and Play lists the source but not the copy.
3. **16-S4-3 duplicating an unpublished puzzle.**
   - A grid-phase source, chosen by keyboard (Tab to the button, Enter,
     Enter on the focused Duplicate), gives a grid-phase copy with a null
     `gridBeforeHints`, opened in grid building. A hints-phase source
     gives a copy with its `gridBeforeHints`, the shape step disabled.
     Each source is unchanged.
   - A copy of a copy is "{title} (copy) (copy)", and the first copy is
     unchanged.
4. **16-S4-4 pending and failure.** An aborted request shows
   `puzzle-menu-error`, `role="alert"`, "Could not duplicate the puzzle.
   Please try again.", keeps the menu open and the URL `/puzzles`, and
   creates nothing. Retrying while the request is held: the item is
   `aria-disabled`, Escape and an outside click don't close the menu, and
   choosing again sends nothing. Released, it opens the copy, and exactly
   one copy exists.

### src/app/puzzles/actions.duplicate.test.ts

16-S4-5, an in-memory store like 16-S2-9's that models only puzzle reads
and `create`. Like Prisma, `create` fills the schema defaults, rejects
unknown fields and rejects a plain `null` for the `Json?` field
`gridBeforeHints` (omitting it or `Prisma.DbNull` stores null). Updates,
deletes, raw SQL and play-session access throw.

- Each source state (grid, hints, unlisted, public) is copied as the
  Decisions say. It returns only `{ id }`, of the one created row, which
  is distinct from the source. The source is unchanged, and `/puzzles`
  is revalidated.
- A copy of a copy appends another " (copy)".
- Another builder's puzzle in every state, and a missing ID, are refused,
  with nothing created or revalidated.
- A rejected session makes no puzzle query.
- Duplicating never touches play sessions, never writes the source and
  uses no raw SQL.

### Retired and amended acceptance

Each amendment is retired in the specification-only freeze commit. Every
other frozen test is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/row-menu.spec.ts` | 16-S2-2 "its items are 32px body-normal rows…" | the draft's first item is checked as the `error` item | the draft's `puzzle-menu-delete` is; the published row's first item (now Duplicate) is still `primary` |
| `e2e/row-menu.spec.ts` | 16-S2-3 "Delete on an unpublished row; …" | exact lists `[Delete]`, `[visibility, Delete]`; the first item's name and test ID | each list gains a leading Duplicate; the second item's name and test ID |
| `e2e/row-menu.spec.ts` | 16-S2-6 "opens the existing dialog; …" | Enter, Enter chooses Delete | Enter, End, Enter |
| `e2e/row-menu.spec.ts` | 16-S2-7 "Make public, then Make unlisted: …" | after each change the menu reads `[next, 'Delete']` | `['Duplicate', next, 'Delete']` |
| `e2e/delete-published.spec.ts` | 16-S3-1 "…, and Delete alone on unpublished ones" | exact lists without Duplicate | each list gains a leading Duplicate; the title ends "…, and after Duplicate on unpublished ones" |

Each changed case gains a one-line `16-S4` comment. `puzzle-library.spec`,
the rest of `row-menu` (including 16-S2-4's first-item focus and the
style-guide sample) and the rest of `delete-published` choose items by
test ID or don't depend on the first item's identity, and they hold
unchanged.

### Acceptance choices *(drafting)*

- **Test ID** `puzzle-menu-duplicate` is new; the failure reuses S2's
  `puzzle-menu-error`.
- **The store pins two Prisma shapes:** the owner is written as
  `builderId` (as `createPuzzle` does), and a null `gridBeforeHints` is
  omitted or `Prisma.DbNull`, never `Prisma.JsonNull`, which would store a
  JSON `null` rather than a database null.
- **"New dates"** are checked as later than the source's `updatedAt`,
  which rules out copying the source's stamps.
- **Not covered:** unsaved editor edits not being copied. The action
  takes only an ID, so the server can't receive client state; there's no
  browser case for it.

### Discrimination (2026-10-31, observed)

- **Current `main` runtime with the proposed tests:**
  - Vitest `actions.duplicate.test.ts`: 8 of 8 fail (`duplicatePuzzle`
    doesn't exist). `tsc` reports only that missing export.
  - `duplicate`, `row-menu` and `delete-published`: 8 failed, 24 passed.
    All five 16-S4 cases fail, as do the amended 16-S2-3, 16-S2-7 and
    16-S3-1. The 16-S2-2 and 16-S2-6 amendments pass on both, as
    intended: they only stop depending on the item order.
- **Throwaway implementation** of the Decisions, then reverted. The patch
  is kept outside the repo (`/tmp/s4-throwaway/throwaway.patch`).
  - `npm run verify`: exit 0, Vitest 620 of 620.
  - `duplicate`, `row-menu`, `delete-published` and `puzzle-library`:
    60 of 60.
  - Full `npm run test:e2e`: exit 0, 811 of 811 (the 806 existing plus
    the 5 new).
- **Mutations on the throwaway,** each caught:
  - Vitest: dropping the ownership condition (1 failed); a plain `null`
    `gridBeforeHints` (2); no " (copy)" (5); copying publication and
    visibility (4); omitting `gridBeforeHints` (3); no revalidation (4);
    copying `createdAt` (4).
  - `duplicate.spec`: not navigating to the copy (4 failed: 16-S4-2, both
    16-S4-3 cases, 16-S4-4); Duplicate last (2: 16-S4-1, 16-S4-3's
    keyboard case); a fire-and-forget item with no pending state (1:
    16-S4-4).

## Repo paths

Acceptance (immutable after freeze): `e2e/duplicate.spec.ts`,
`src/app/puzzles/actions.duplicate.test.ts` and the amendments in the
table.

Runtime:

- `src/app/puzzles/actions.ts`: `duplicatePuzzle` (a CODE-REVIEW risk
  path).
- `src/components/puzzle/PuzzleRowMenu.tsx`: the Duplicate item, its
  failure message and navigation to the copy.
- This story, `../EPIC.md` and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S4. Out of scope:

- copying play sessions or progress, or linking a copy to its source;
- numbered or de-duplicated copy titles;
- duplicating another builder's puzzle, or from the Play view or the
  editor;
- a confirmation step, or any change to the Menu component or its
  style-guide sample;
- any change to the listing, the schema or the engine.

## Definition of done

- The human answers the pending question and approves this
  specification, its acceptance and the amendments, recorded here and in
  the handoff. Freeze on `main` in a specification-only commit before any
  runtime change.
- Frozen acceptance is unchanged after freeze.
- Implemented on `story/16-S4-duplicate` from the freeze commit.
  `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- A PR naming this story, the actual changed paths and the verification,
  independently reviewed per [REVIEW](../../../process/REVIEW.md) and
  merged by the reviewer, with the handoff updated with observed results.
