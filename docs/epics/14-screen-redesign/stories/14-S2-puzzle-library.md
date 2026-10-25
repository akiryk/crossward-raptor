# Story S2 — Puzzle library

Redesign `/puzzles` from the human's mockups. A Build/Play choice splits the
library: **Build** lists your own puzzles to work on, **Play** lists every
published puzzle to solve. Rows become simple, hoverable Puzzle Rows under
size headings (Row Heading).

**Status: approved and frozen** (2026-10-25). The human approved the
Decisions as written, *(agent)* choices included, then the Acceptance, the
retired and amended acceptance and the *(drafting)* additions. They
accepted the lost-acknowledgement delete gap (see Acceptance choices).

**Blast radius: medium-high.** The library page and row, a new library
delete, a server filter and a new field in `listPuzzles`, and amendments to
many frozen library tests. `src/app/puzzles/actions.ts` is a CODE-REVIEW
risk path, so the work goes on branch `story/14-S2-puzzle-library` with a
PR and an independent review. No schema change.

## Decisions

Inspected `src/app/puzzles/page.tsx`, `NewPuzzleButton`, `listPuzzles` and
`deletePuzzle` in `actions.ts`, `GridThumbnail`, `LibraryPlayControls`,
`library-row.ts`, `PlayResetDialog`, `DeletePuzzleButton`, `RadioGroup`,
`Title`, `Modal`, `src/lib/puzzle-groups.ts`, `src/lib/puzzle-status.ts`,
S1's `/` container, and every frozen test that reads the library. Also the
human's two mockups of 2026-10-25 (Play and Build), plus their written
instructions, which win where the mockups differ. The mockups are 2×
exports: every measurement below is halved and checked against the text
styles (the heading reads as `title-2`, row titles as `title-4`).

### Build and Play *(human)*

- **The choice:** F6's `nav` Radio, "Build" then "Play", accessible name
  "Show puzzles", test id `library-view`. Build is the default.
- **Remembered per browser** in `localStorage` under `crossward:library-view`
  (`build` or `play`). Anything else stored counts as Build.
- **Build** lists the caller's own puzzles in every phase: grid, hint and
  published.
- **Play** lists every published puzzle, the caller's own included. Who
  built it doesn't change how a row looks or behaves *(human)*.
- **Other builders' unpublished puzzles are no longer sent** *(human)*.
  `listPuzzles` returns only the caller's own puzzles and published ones.
  The page splits that list into the two views in the browser. This amends
  the EPIC's "no server or schema change" for Build/Play (see
  [EPIC amendment](#epic-amendment)).
- **Switching views needs no reload.** The server renders Build. Once
  hydrated, the page shows the stored view and marks `data-ready="true"` on
  the `puzzle-library` root *(agent)*. A stored Play choice can briefly show
  Build first. This is accepted, and tests wait for `data-ready`.
- **Only the chosen view is rendered** *(drafting)*. The other view's rows
  aren't in the DOM, so a row's absence means it isn't in that view.

### Page layout *(agent, from the mockups)*

- **S1's container:** the `puzzle-library` root itself *(drafting)*. At
  most 700px wide, centered, 90px below the masthead, at least 630px tall,
  with a 1px `line-muted` hairline down its left edge. Content starts 20px right of the hairline and runs to the
  container's right edge (679px). The mockups read about 23px and 672px.
  S1's values are kept, so both pages share one content edge.
- **Header** (`puzzle-list-header`):
  - "Puzzles" is the page's `h1`, `title-2` `primary` via `Title`, test id
    `page-heading` (kept). It starts 10px inside the content edge and 10px
    below the container's top. `Title` gains an optional `tabIndex` prop
    for the heading's `tabindex="-1"` *(drafting)*.
  - The Radio sits at the right, its right edge 10px inside the content's
    right edge, vertically centered on the heading.
  - A 1px `line-dark` rule spans the full content width, 8px below the
    heading (test id `puzzle-list-rule`, *drafting*).
- **Groups:** inside `puzzle-list` (kept, always rendered, holding the
  current view's groups) *(drafting)*.
  - Each group's Row Heading sits 20px below the rule (first group), or
    40px below the previous group's last row.
  - Rows start 18px below the Row Heading and are 4px apart.
- **Create A Puzzle:** the New Puzzle button now reads "Create A Puzzle". It
  is a normal `Button`, left-aligned on the content edge, 20px below the
  last row, in both views. Its test ids and the dialog it opens are
  unchanged.
- **Empty view** *(agent copy)*. A `body-normal` `muted` line on the
  content edge *(drafting)*, 20px below the rule (test id
  `puzzle-list-empty`), with Create A Puzzle 20px below it:
  - Build: "You haven't started a puzzle yet."
  - Play: "No puzzles to play yet."

### Row Heading *(mockup)*

- The size group's heading (test ids `puzzle-group-heading` and
  `puzzle-group-dimensions`, kept). The label ("Mini") is an `h2` in
  `title-3` `primary`. The dimensions ("5 × 5") follow 4px later in `label`
  `muted`, on the same baseline.
- It starts 10px inside the content edge, aligned with the row contents.
- Grouping and group order are unchanged: Mini, Midi, Daily, Sunday, then
  Other sizes. Empty groups are omitted, per view.

### Puzzle Row *(mockup; human: background and hover)*

- **The shell:**
  - full content width, 66px tall, 10px corners;
  - background `puzzle-row`, turning `puzzle-row-hover` on hover and on
    keyboard focus of its link (`:focus-visible`), over 150ms;
  - still an `li` (`puzzle-list-item`) keeping every `data-*` attribute it
    has today.
- **Icon** *(human: "just one icon for now")*. A fixed crossword icon, the
  same on every row in both views (test id `puzzle-icon`, decorative):
  - 34×34px, with 5px corners, a 1px `primary` outline and 1px `primary`
    lines dividing it into 3×3 cells;
  - `primary` cells at (col 1, row 0), (col 0, row 1) and (col 2, row 2),
    the rest white.
  - It sits 10px inside the row's left edge, vertically centered.
  - 5px corners is a new recorded exception to the 10px rule, as drawn.
  - It replaces the per-puzzle `GridThumbnail`, which is removed.
- **Text block**, 12px right of the icon and vertically centered:
  - Line 1, `title-4` `primary`: the title (`puzzle-list-title`, kept,
    holding only the title), then a space and the row's marker (below).
    Only the title truncates, with an ellipsis, so the marker always shows,
    clear of the date. Both are inside the row's link.
  - Line 2, `title-4` `muted`: the builder's username (`User.displayName`,
    trimmed; test id `puzzle-builder-name`, *drafting*). An account with no
    username leaves the line empty *(agent)*, keeping its 20px height
    *(drafting)*.
  - The two 20px lines are 4px apart.
- **Date:** `body-normal` `muted`, on line 1, starting 280px from the row's
  left edge. It's the puzzle's last update in the long form, "October 21,
  2026" (test id `puzzle-list-updated`, kept), with no "Updated" prefix.
  Both views show the same date *(agent)*.
- **Right control:** `body-normal` `error`, on line 1, its right edge 12px
  inside the row. Underlined on hover and keyboard focus *(agent)*, with
  `cursor: pointer`.
- **Gone from the row:** the status badge's box, "Your puzzle" / "Another
  builder's puzzle", the visible Edit, Manage and Play links, and the
  play-state words.

### The row's link

- As today, one link covers the whole row (the overlay pattern in
  `library-row.ts`), and the right control sits above it. The row itself is
  not focusable and has no role.
- The link wraps line 1, so its accessible name is the title plus marker,
  e.g. "Trial by Fire [in-play]" *(agent)*.
- **Build:** the link opens the editor (`/puzzles/<id>`), published puzzles
  included. Test id `puzzle-edit-link`.
- **Play:** the link opens play (`/puzzles/<id>/play`). Test id
  `puzzle-play-link`.

### Markers *(human)*

The title's suffix, in square brackets.

- **Build**, test id `puzzle-status-badge` with `data-status-kind`, both
  kept so existing selectors still work *(agent)*:
  - `[grid]` while building the grid;
  - `[hint]` in the hint phase, complete or not;
  - `[published]` once published, either visibility.
- **Play**, test id `puzzle-play-state`, kept:
  - none for an untouched attempt;
  - `[in-play]` for one in progress;
  - `[complete]` for a completed one.
- The hint phase's completeness and a published puzzle's visibility are no
  longer shown as text. They stay in the row's `data-hints-complete` and
  `data-visibility`.

### Row controls *(human)*

- **Build, grid and hint rows: Delete** (test id `puzzle-delete-button`).
  Published rows have no Delete *(human: "for right now")*. The mockup's
  Delete on a published row is superseded by the instruction.
- **Play, completed rows: Reset** (test id `puzzle-reset-button`, kept).
  In-progress rows have no Reset any more *(human)*. Reset remains on the
  play screen. The mockup's Reset on an `[in-play]` row is superseded by the
  instruction.
- Untouched rows have no control in either view.

### Library delete *(human: "spawns a confirm dialog")*

- Delete opens a `Modal` titled "Delete puzzle?" (test id
  `puzzle-delete-dialog`), naming the puzzle and saying "This cannot be
  undone." *(agent copy)*.
  - Footer: "Delete puzzle" (normal Button, `puzzle-delete-confirm`) and
    "Cancel" (alternate, `puzzle-delete-cancel`).
  - Escape, the close button, Cancel and the backdrop dismiss it without
    deleting.
- **Confirming** calls the existing `deletePuzzle` (owner-scoped, already
  revalidates `/puzzles`). The dialog closes and the row leaves the list in
  place, with no navigation. Focus moves to the page heading (`tabindex="-1"`)
  *(agent)*.
- **While pending,** confirm and every dismissal are disabled, as in the
  library reset.
- **A failure** keeps the dialog open with a `role="alert"` line, "Could not
  delete the puzzle. Please try again." (test id `puzzle-delete-error`), and
  confirm retries.
- The editor's own delete is unchanged here. S4 moves it into a dialog and
  can reuse this one.

### Library reset

The reset behavior from P5 is kept for completed rows: the same
`PlayResetDialog`, attempt replacement, local draft cleanup, pending and
failure handling, and focus on the row's link afterwards.

### Ordering

Kept per view: unpublished rows first, then published ones not completed by
the caller, then completed ones, each newest-updated first. In Build a
completed own puzzle doesn't sink *(agent)*: Build orders by unpublished,
then published.

### Server *(risk path)*

- `listPuzzles` filters with `builderId = caller OR publishedAt is not null`.
  The ownership checks, the single query, the caller-only play attempt and
  the `updatedAt desc` order are unchanged.
- Each row gains `builderName: string | null`, the builder's trimmed
  `displayName`, with null for a blank one.
- `black`, `cols` and `rows` stay in the payload: grouping needs `cols` and
  `rows`, and `black` is pinned by frozen unit tests. Nothing else is
  added.

### Style guide *(agent)*

New samples:

- `sg-row-heading`: "Mini 5 × 5";
- `sg-puzzle-row`: a Build row with Delete, and a Play row with `[complete]`
  and Reset.

There's no old library sample to replace.

### Unchanged

- Grouping and size labels, the new-puzzle dialog (S3).
- Play, reset and delete server behavior, sign-in, and the masthead.
- `LibraryFreshness` (refresh after Back).
- `puzzleStatus`'s kinds and labels. The labels are no longer shown, and
  their unit test is unchanged.

### Retired and amended acceptance

Approving this story approves these changes to frozen tests. They land only
in the specification-only freeze commit on `main`. Opening Play in a test
means clicking the `library-view` "Play" option after `data-ready`.

1. **`e2e/ownership.spec.ts`** O1 "the library remains unfiltered": amended.
   The other builder's draft is in neither view, and an own draft is in
   Build.
2. **`e2e/builder-edits.spec.ts`** O3 "the unfiltered library distinguishes
   builders": amended.
   - Build shows the four own states, each with an editor link.
   - Play shows the foreign published ones with a play link and no editor
     link.
   - Foreign drafts are nowhere.
   - The "Your puzzle" / "Another builder's puzzle" text is dropped.
3. **`e2e/library-play.spec.ts`** (P5), amended:
   - Foreign and published rows are read in Play.
   - The link names "Play", "Manage" and "Edit" become the title plus marker.
   - `expectState` reads the `[in-play]` and `[complete]` markers instead
     of "In progress" and "✓ Completed".
   - Only completed rows offer Reset.
   - The foreign-draft fixture asserts absence.
   - "Clicking anywhere on a row" hits the icon, title and date instead of
     the thumbnail.
   - The partial-attempt variant of "resetting … from the library" is
     retired; the complete variant stays.
   - The reset cases that seed a partial attempt seed a complete one. "A
     stale library row" seeds a completed attempt replaced by an in-progress
     one.
   - "each attempt shows its state, and only started rows offer reset"
     becomes "… only completed rows offer reset". Build rows are read in
     Build.
4. **`e2e/puzzle-list-layout.spec.ts`** (L2b):
   - "the heading and the new-puzzle button share a header row" is
     retired; S2-1 measures the new layout.
   - "a published puzzle … looks different" now compares the markers'
     text, not a badge background.
   - The other cases stay.
5. **`e2e/puzzle-list.spec.ts`** (M3-2): "Building grid", "Clues done" and
   "Writing clues" become `[grid]`, `[hint]` and `[hint]`.
6. **`e2e/publish-status.spec.ts`** (PB5-2): the /private/ and /public/ text
   assertions become `[published]` plus the existing `data-visibility`.
7. **`e2e/puzzle-groups.spec.ts`** (L3-2): "the thumbnail draws the
   puzzle's actual black squares" is retired; S2-3 checks the fixed icon.
8. **`e2e/typography.spec.ts`** (D9-3): "the page heading uses the headline
   size", "a list row uses the body size" and "the app reads the token
   rather than a copied value" are retired. They pin old tokens on the
   library. The old-token pins elsewhere stay for S8.
9. **`e2e/controls.spec.ts`** (D2-2): "the list's edit control is
   interactive and responds to hover" reads the hover change on the row
   that contains the link, not on the link itself.
10. **`src/app/puzzles/actions.library-play.test.ts`**: "keeps every existing
    field" adds `builderName` and makes its draft the caller's own. "gives
    unpublished puzzles no play state" makes its draft the caller's own
    *(drafting: missed in the outline)*. The mock learns `OR`/`AND`/`NOT` and
    the `builder` relation.
11. **`src/app/puzzles/actions.ownership.test.ts`**: "returns builderId for
    both builders" makes the other builder's row published. A new case
    checks that their draft isn't returned.

Not affected, checked by running them against a throwaway implementation:
`persistence`, `rename`, `new-puzzle`, `new-puzzle-resubmit`, `delete` (these
read `puzzle-list`, kept), `session-validation`, `modal-a11y`, `buttons`
(F3-9: Create A Puzzle stays a normal button), `text-styles`, `sign-in`,
`puzzle-groups`' other cases, `controls`' other cases and the play specs,
which only visit `/puzzles`.

## Acceptance

*Approved and frozen* (2026-10-25). Three new files, plus the amendments above:

- `e2e/puzzle-library.spec.ts`: 28 browser cases at 1280×800. Each signs
  in as a brand-new builder (`signInSeededUser`), so Build's contents are
  exact; Play is read by title, since other tests publish into the shared
  database.
- `src/components/puzzle/library-source.test.ts`: 4 source cases.
- New cases in `actions.library-play.test.ts` (3) and
  `actions.ownership.test.ts` (1).

### e2e/puzzle-library.spec.ts

1. **14-S2-1 layout**
   - The container, as S1: 90px below `app-header`, 700px, centered, at
     least 630px, only a 1px solid `line-muted` left border.
   - One `h1` in the library, "Puzzles", `title-2` `primary`, at content
     edge + 10px and container top + 10px.
   - `library-view` is the radiogroup named "Show puzzles", `nav` variant,
     options Build then Play. Its right edge is the content's right edge −
     10px, its center on the heading's.
   - `puzzle-list-rule`: 8px below the heading, the content's full width,
     1px, `line-dark` (a background or a top border).
   - With two Mini rows and one Other-size row: 20px rule to first Row
     Heading, which starts at content edge + 10px; 18px heading to row; 4px
     between rows; 40px last row to the next heading. Rows are on the
     content edge, full width, 66px, 10px corners.
   - Create A Puzzle on the content edge, 20px below the last row in Build
     and in Play, and it opens the new-puzzle dialog.
   - An empty Build: the exact line, `body-normal` `muted`, on the content
     edge, 20px below the rule, no groups, the button 20px below it. Play
     then has no empty line.
2. **14-S2-2 row anatomy and styles**
   - Row Heading: an `h2` "Mini" in `title-3` `primary`; "5 × 5" in
     `label` `muted`, 4px after it on the same baseline.
   - Icon: aria-hidden, 34×34, 10px in, vertically centered. Its pixels,
     decoded from a screenshot: dark cells at (1,0), (0,1) and (2,2), the
     rest white, dark 1px lines and outline, rounded corners. The same on
     two rows; no `puzzle-thumbnail`.
   - Text block: title (exact), `[grid]` and the trimmed username, styled as
     decided; title 12px after the icon, both lines 20px, 4px apart,
     centered on the row; the marker on the title's line.
   - Date: exactly "October 21, 2031" for a puzzle last updated then,
     `body-normal` `muted`, 280px in, on line 1.
   - Delete (Build) and Reset (Play): buttons, `body-normal` `error`,
     pointer, 12px from the right, on line 1, underlined on hover and on
     keyboard focus and not at rest.
   - Row: `puzzle-row` at rest, a 0.15s background transition,
     `puzzle-row-hover` on pointer hover and on keyboard focus of its link,
     but not when the link is focused by a mouse press.
   - A long title overflows with an ellipsis on one line; `[hint]` stays
     whole and clear of the date.
3. **14-S2-3 Build**
   - Across a reload: the four own states with `[grid]`, `[hint]`,
     `[published]` ×2 and their `data-status-kind`, the username, an editor
     link named "title [marker]", Delete only on grid and hint rows, no play
     link, play marker or Reset. Three foreign puzzles (grid, hints,
     published) are absent.
   - The link opens the editor for a draft, and a pointer press on a
     published row's date opens its locked editor.
   - Draft before published; a newer completed own puzzle sorts before an
     older untouched one.
4. **14-S2-4 Play**
   - Own and foreign published rows: no marker, `[in-play]`, `[complete]`;
     the username or an empty 20px line; the play link named "title" or
     "title [marker]"; Reset only when completed; no editor link, status
     marker or Delete. Own and foreign drafts are absent, and no
     unpublished row is listed. A pointer press on a row's date opens play.
   - In-progress before untouched before a newer completed puzzle.
5. **14-S2-5 the choice**
   - Nothing stored means Build. Switching to Play and back shows each
     view's rows with no navigation, no request to `/puzzles` and no server
     action.
   - Play stores `play` and a revisit restores it; Build stores `build`; an
     unknown stored value ("Play") shows Build.
   - A builder with only a Mini draft sees only the Mini group in Build;
     Play shows the foreign 3×3 puzzle under Other sizes and not the draft.
6. **14-S2-6 library delete**
   - The dialog: role, `aria-modal`, named "Delete puzzle?", the title and
     "This cannot be undone.", the two buttons' names, focus inside, URL
     unchanged.
   - Cancel, Escape, the backdrop and Close each keep the row and the
     database row, and return focus to Delete.
   - Confirm removes the row and the database row, keeps another row, keeps
     the URL without reloading, and focuses the heading (`tabindex="-1"`).
     A revisit doesn't show it.
   - While the action is held, confirm, Cancel and Close are disabled, and
     Escape and the backdrop don't dismiss; on release the puzzle is
     deleted, with one request.
   - A failed first request shows the exact `role="alert"` line, keeps the
     dialog and the puzzle with both buttons enabled; confirming again
     deletes it.

### src/components/puzzle/library-source.test.ts

- `page.tsx`, `PuzzleLibrary`, `PuzzleRow`, `RowHeading`, `CrosswordIcon`,
  `LibraryDeleteDialog` and `LibraryPlayControls` use only the redesign
  tokens: S1's checks, except that radii are free apart from the old
  `rounded-btn/sm/md/lg/grid` tokens (rows use 10px, the icon 5px).
- Exactly one `<Title size={2}>` among them.
- `GridThumbnail.tsx` is gone and no source names it.
- Play's empty line, "No puzzles to play yet.", is in their source. The
  browser can't reach an empty Play view in the shared test database.

### Unit tests (14-S2-7)

A server action can't be checked over HTTP, so these cover the server:

- `listPuzzles` returns the caller's draft, both published puzzles and not
  another builder's draft, whose title never appears in the payload.
- `builderName` is the trimmed username, and null when blank or missing.
  It comes from the one `findMany`, with no session query or transaction.
- The row's keys are exactly the existing ones plus `builderName`.
- In `actions.ownership.test.ts`, another builder's draft isn't returned.

### Acceptance choices *(drafting)*

- New test ids: `puzzle-list-rule` and `puzzle-builder-name`.
- "On line 1" is measured as equal text tops, since `title-4` and
  `body-normal` share size and line height. The Row Heading's shared
  baseline uses an inline probe.
- Gaps are measured from the `puzzle-group-heading` `h2`'s box.
- Keyboard focus is given by focusing the preceding control and pressing
  Tab, since Play's long list makes tabbing from the top impractical.
- Not covered: a delete whose acknowledgement is lost after the server
  deleted the puzzle. Confirming again would fail, because `deletePuzzle`
  throws when the puzzle is already gone. The human accepted this for now
  (2026-10-25); `deletePuzzle` is unchanged.

### Discrimination (2026-10-25, observed)

- **Current `main`, uncommitted tests:**
  - Vitest: the source test fails, since its files are missing. The 6 new or
    amended action cases fail; the other 14 in those files pass.
  - Browser, the new spec and the 9 amended specs: all 28 S2 cases and all
    26 amended cases fail. The other 38 cases in those files pass.
- **A throwaway implementation** of the Decisions (the components above,
  the `listPuzzles` filter and `builderName`, `Title`'s `tabIndex`).
  `GridThumbnail` was removed. It was then reverted, and a copy is kept
  outside the repo.
  - `tsc` and ESLint passed; Vitest passed 602 of 602.
  - `npm run test:e2e -- e2e/puzzle-library.spec.ts`: 28 of 28.
  - The full `npm run test:e2e`: exit 0, 539 passed.
- **Four mutations on top of it,** each caught:
  - The server filter removed: 3 action cases failed.
  - Reset on in-progress rows: 4 P5 cases and 14-S2-4 failed.
  - Build sinking completed puzzles: the 14-S2-3 order case failed.
  - No row hover on keyboard focus: the 14-S2-2 row case failed.
- The worktree matches its starting state plus the proposed tests. `tsc`
  and ESLint pass on them. `npm run verify` fails until implementation, by
  design.

## EPIC amendment

The Build/Play Decision's "No server or schema change" becomes "No schema
change; `listPuzzles` stops returning other builders' unpublished puzzles
and adds each builder's username (S2)." The S2 entry's "keeps its
thumbnail, title, dates, status and play controls, restyled" is replaced:
it adds the library delete, the markers and the fixed icon, and drops the
thumbnail and in-progress Reset from the library. It lands with the freeze
commit.

## Repo paths

Acceptance (immutable after freeze): the new files above and the
amendments listed under
[Retired and amended acceptance](#retired-and-amended-acceptance).

Runtime:

- `src/app/puzzles/page.tsx`: the redesign.
- `src/app/puzzles/NewPuzzleButton.tsx`: the label.
- `src/app/puzzles/actions.ts` (risk path): `listPuzzles`'s filter and
  `builderName`.
- New components in `src/components/puzzle/`: `PuzzleLibrary` (the client
  view switch), `PuzzleRow`, `RowHeading`, `CrosswordIcon` and
  `LibraryDeleteDialog`.
- `src/components/puzzle/LibraryPlayControls.tsx`: Reset only, on completed
  rows.
- `src/components/puzzle/library-row.ts`: the overlay link.
- `src/components/puzzle/GridThumbnail.tsx`: removed.
- `src/components/ui/Title.tsx`: the optional `tabIndex` prop.
- `src/app/style-guide/page.tsx`: the new samples.
- This story, `../EPIC.md` and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S2. Out of scope:

- the new-puzzle dialog (S3);
- the editor's delete or controls (S4);
- deleting published puzzles;
- status-specific icons (deferred by the human);
- showing usernames anywhere else;
- responsive work (epic 15);
- old-token deletion (S8).

## Definition of done

- The human approves this specification, its acceptance and the
  retirements, recorded here and in the handoff. Freeze on `main` in a
  specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Visual check at desktop width against the two mockups.
- A PR from `story/14-S2-puzzle-library`, independently reviewed per
  CODE-REVIEW, and the handoff updated with observed results.
