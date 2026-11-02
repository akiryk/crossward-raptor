# Story S4 — Filters

One list replaces the Build | Play radio on `/puzzles`. With no filter
checked it shows everything `listPuzzles` returns. Three groups of
checkboxes (Play, Create, Size) narrow it, and the filters live in the
URL. On desktop, Create A Puzzle and the filters move to a left column
beside the list. On smaller screens, a "Filters" button opens them in a
panel above the list. A Reset button clears them.

**Status: approved and frozen** (2026-11-02). Drafted under the
orchestration the human delegated on 2026-11-02 (see the
[handoff](../HANDOFF.md)). An independent specification review approved
it; its should-fix items and nits were applied and re-verified. The
orchestrator froze it on `main` in a specification-only commit under
that delegation.

**Blast radius: high.** The change replaces the library's view model and
layout. It adds a pure filter module, a `Checkbox` and a filters
component, and changes the row, the row menu and Reset's placement. It
adds a style-guide sample. It amends thirteen frozen test files and
retires five browser cases. No
schema, server action, storage or engine change.
**CODE-REVIEW risk classification:** none of the declared Repo paths is a
risk path (`src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts`, `prisma/**`). The filter function goes in
`src/lib/puzzle-filters.ts`, next to `puzzle-groups.ts`, where the
library's other list logic lives. It only imports the `Phase` type from
`src/engine/puzzle`. The acceptance files import
`src/lib/puzzle-storage.ts` but don't change it. So this story is
delivered directly on `main`.

## What the code does today

I inspected `src/app/puzzles/page.tsx`, `PuzzleLibrary.tsx`,
`PuzzleRow.tsx`, `PuzzleRowMenu.tsx`, `LibraryPlayControls.tsx`,
`library-row.ts`, `NewPuzzleButton.tsx`, `src/lib/puzzle-groups.ts`,
`library-play.ts`, `puzzle-status.ts`, `puzzle-size.ts`, `listPuzzles` in
`actions.ts`, `ui/Radio.tsx`, `ui/Title.tsx`, `ui/Menu.tsx`, the
builder's `RebusControl.tsx`, `globals.css` (styles, the focus-ring rule),
the style guide's sample rows and `~/Downloads/puzzles-page-mock.png`. I
also grepped `e2e` and `src` for `library-view`, `showView`, `show(page`,
`puzzle-list-rule`, `puzzle-list-empty`, `puzzle-edit-link`,
`puzzle-play-link`, `radiogroup`, `new-puzzle-button` and the menu's item
lists.

- `PuzzleLibrary` is one 700px column with a 1px `line-muted` hairline on
  its left, 90px under the masthead and centered. It has the "Puzzles"
  h1, a `nav` Radio (`library-view`, Build | Play, kept in `localStorage`
  under `crossward:library-view`), a 1px `line-dark` rule, the size
  groups, then Create A Puzzle 20px below the last row. `data-ready` turns
  true once the stored view is read.
- **Build** lists the caller's puzzles. Each row links to the builder and
  has the three-dot menu. **Play** lists every published puzzle. Each row
  links to play, with `[in-play]`/`[complete]` and, when complete, Reset
  (`ROW_CONTROL`, 12px from the right). Build doesn't sink completed
  puzzles (`play: null`); Play does.
- `PuzzleRow` takes `view`. The style guide shows one Build sample (grid)
  and one Play sample (completed, foreign). The menu (`PuzzleRowMenu`)
  offers Duplicate, then Make public/unlisted on published rows, then
  Delete. Its button is 24px, 12px from the right, at `top-[9px]`. Reset
  is at `top-[11px]`, `right-3`. A row with both would overlap them.
- `listPuzzles` returns the caller's puzzles, every public published
  puzzle, and others' unlisted puzzles the caller has started. So every
  unpublished puzzle listed is the caller's. `play` is null for
  unpublished puzzles. For published ones it is `untouched`,
  `in-progress` or `completed`. `sizeFor` gives the standard size or
  null ("Other sizes").
- The global focus rule already rings
  `label:has(input[type=checkbox]:focus-visible)`. The builder's Rebus
  link is `text-link-muted`, `button-hover` on hover and keyboard focus.
  There is no `Checkbox` component. Breakpoints in use: `min-[748px]`
  (700 plus 24px each side, the builder) and `min-[650px]`.
- **The mock** (931×731, 1:1): the left column runs from Create A Puzzle
  (x 23, 155×30) to the hairline (x 222), so it is about 200px. "Filters"
  and the options start about 6px right of the button. Checkboxes are
  about 16px, gray-500 outlined, with labels about 7px after them.
  Gaps between boxes (20px text lines, 16px checkboxes in 20px rows):
  button to "Filters" 20, "Filters" to "Play" 20 (a 39px text pitch),
  legend to first option 14, options 13 apart (a 33px pitch), groups 26
  apart (25 to 28). The button's top is level with the first Row
  Heading. The heading has no rule. "Puzzles" to "Mini" is a 63px glyph
  pitch, which the rendered page matches with a 27px gap.
- **Tests pinning the views:** `puzzle-library.spec.ts` (14-S2: layout,
  the Radio, the rule, the button's place, the empty Build line, the
  choice, Build's editor links, Build's order), `library-play.spec.ts`
  (P5: `playLibrary`/`showView` and Build checks), and `ownership`,
  `builder-edits`, `modal-design`, `delete-published`, `no-play-reset`,
  `duplicate`, `unlisted`, `row-menu`, `status-icons` and `focus-ring`
  (the library Radio's ring). `library-source.test.ts` pins Play's empty
  line. The menu item lists are pinned in `duplicate`,
  `delete-published` and `row-menu`.

## Decisions

### From the EPIC *(human, approved 2026-11-02)*

- **One list.** The filters replace the Build | Play radio. With no
  filter checked, the page lists everything `listPuzzles` returns,
  grouped by size and sorted as `groupPuzzles` does: unpublished, then
  published still to finish, then completed. So a completed own puzzle
  now sinks. A play row links to play and keeps its play controls (Reset
  when complete). The caller's own rows keep their menu. The caller's own
  published puzzle is a play row with both, and its menu gains "Open in
  builder". The radio and its `localStorage` key are removed.
- **Filters.** Play: Unplayed (published, not started by the caller),
  Underway (in progress), Complete (completed). Create: Build Phase (the
  caller's, unpublished, grid phase), Hint Phase (the caller's,
  unpublished, hints phase), Unlisted (the caller's, published,
  unlisted). Size: Mini, Midi, Daily, Sunday (`sizeFor`). Options within
  a group combine with OR. Play and Create combine with OR, as one status
  filter. Size narrows with AND. A group with nothing checked doesn't
  restrict. Size groups with no match are hidden. When nothing matches,
  the list reads "No puzzles match these filters." Puzzles of other sizes
  (anyone's) show only when no Size option is checked. Filters persist in
  the URL's query, not in storage.
- **Reset** shows once any option is checked, right of the "Filters"
  label, `title-4`, in the blue of the app's text links (the builder's
  Rebus link, `link-muted`). It unchecks everything, and focus moves to
  the "Filters" label.
- **Desktop.** A left column, separated from the list by a full-height
  `line-muted` hairline, holds Create A Puzzle, then "Filters" with
  Reset, then the three groups. The right column keeps the "Puzzles"
  heading and the size groups. The rule under the heading goes.
  "Filters" and the group labels are `title-4` `text-primary`. Options
  are `body-normal` `text-primary`. The two columns apply from the width
  where both fit.
- **Checkbox.** A new `src/components/ui/Checkbox.tsx`: a native
  `<input type="checkbox">` drawn as a 16px square with 4px corners, a
  1px `button-alternate-border` outline, filled with the button blue
  with a white check when checked, and the app's focus ring. Each group
  is a `fieldset` with its label as `legend`.
- **Smaller screens.** One column. Below the heading, a row holds Create
  A Puzzle and a "Filters" text button showing the number checked
  ("Filters · 2"). It opens a panel above the list with the three groups
  side by side (wrapping when narrow), and Reset right of its "Filters"
  label. Filters apply as they are checked. The panel closes with the
  button or Escape, and the filters stay applied. The panel starts
  closed.
- **No grid-engine change.** Filtering is a pure function in `src/lib/`
  with unit tests. The page stays a client filter over `listPuzzles`'s
  result.

### Delegated decisions *(orchestrator, 2026-11-02; for the human's end-of-epic review)*

- **Where the logic lives.** `src/lib/puzzle-filters.ts` holds
  `filterPuzzles(puzzles, filters, userId)`, the option lists, and the
  URL form (`parseFilters`, `filtersQuery`), all pure. It sits next to
  `puzzle-groups.ts`. "Unplayed" includes a published puzzle with no
  attempt or an untouched one, the caller's own included. "Underway"
  includes a stale attempt, which `classifyLibraryPlay` already reads as
  in progress.
- **URL form.** `?play=…&create=…&size=…`. Each is a comma-separated list
  in canonical order, with the keys `unplayed`/`underway`/`complete`,
  `build`/`hint`/`unlisted` and `mini`/`midi`/`daily`/`sunday`. Empty
  groups are omitted. With nothing checked, the URL is plain `/puzzles`.
  Unknown values are ignored. Each change replaces the history entry
  (`history.replaceState`, which Next's `useSearchParams` follows), so
  Back leaves the library instead of undoing a check. Refresh, and Back
  from a puzzle, keep the filters. Filtering makes no server request.
  **For the human's review:** `replaceState` means Back leaves the
  library; `pushState` would instead make Back undo each check. Either is
  a one-line change.
- **The empty unfiltered list** reads "No puzzles yet." It replaces
  Build's "You haven't started a puzzle yet." and Play's "No puzzles to
  play yet.", which assumed a view. The shared test database never
  reaches it, so it is checked in source.
- **Desktop values** are measured from the mock (gaps between boxes),
  since the mock is the default:
  - The left column is 200px wide, ending at the list column's hairline.
  - The 700px list column keeps its hairline, its 630px minimum height
    and its place 90px under the masthead. It is shifted 100px right, so
    the pair (900px) is centered.
  - Two columns apply from a **948px** window (200 + 700 + 24px each
    side, like the builder's 748px). Below that, one column.
  - The list starts 27px below the heading (the gap that reproduces the
    mock's heading-to-Row-Heading pitch in the rendered page), and Create
    A Puzzle's top is level with it, beside the first Row Heading.
  - "Filters" is 20px below the button and 6px in. The first legend is
    20px below it. Options are 14px below the legend and 13px apart, in
    20px rows. Groups are 26px apart.
  - The checkbox's label sits 8px after the box, as in `Radio` (the mock
    shows about 7).
- **The "Filters" label** is an `h2` (`Title size={4}`) with
  `tabIndex={-1}`, so Reset can focus it. Reset sits 12px after it, and
  turns `button-hover` on hover and keyboard focus over 150ms, as the
  Rebus link does.
- **Narrow values.** The row (27px below the heading) has Create A Puzzle
  on the left and the "Filters" button on the right edge, title-4
  `link-muted` like Reset. The button has `aria-expanded` and
  `aria-controls`. The panel opens 16px below the row, and the list
  starts 27px below the row or the panel. Groups sit side by side, 40px
  apart, wrapping 26px apart. The labels "Filters" and Reset are repeated
  inside the panel. Escape closes the panel only while focus is in the
  row or the panel, and focus returns to the button. The panel is not a
  dialog: an outside click doesn't close it.
- **One panel, two layouts.** The filters render once, so there are no
  duplicate checkboxes. On desktop the column is positioned left of the
  list column, aligned with the list's top. Narrower, it sits in the flow
  under the heading. Tab order: Create A Puzzle, the Filters button
  (narrow only), Reset, the checkboxes, then the rows.
- **A row with both a menu and the row's play Reset**
  (`LibraryPlayControls`, not the filters' Reset), on the caller's own
  completed puzzle: Reset sits 12px left of the 24px menu button, 48px
  from the right. Reset's right inset moves out of `ROW_CONTROL` into
  `LibraryPlayControls`. At narrow widths Reset may overlap the date,
  which already overflows there (epic 15's open item).
- **"Open in builder"** goes after Duplicate and before the visibility
  item, so 16-S4's "Duplicate first" holds. It is on published own rows
  only, since drafts already link to the builder. Choosing it navigates
  to `/puzzles/<id>`.
- **Checkbox details** the EPIC leaves open: no hover change, a 2px
  white check stroke, and a 150ms color transition. The label carries the
  existing focus-ring rule.
- **For the human's review: the checked outline.** The EPIC says "a 1px
  `button-alternate-border` outline" without saying "unchecked". This
  story reads it as the unchecked look: checked, the outline turns
  `button-fill` with the fill (18-S4-7 pins this). Keeping the gray
  outline when checked is a one-class change.
- **The style guide** catalogs the Checkbox (epic 13's carried-over
  decision that it shows every `ui/` component): an `sg-checkbox` section
  after Radio, with an unchecked and a checked sample.
- **API.** `PuzzleRow`'s `view` prop becomes `own`. The style guide's two
  sample rows keep their looks (`own` grid row; foreign completed row).
  `data-ready` stays and now marks hydration. The filters component is
  `src/components/puzzle/LibraryFilters.tsx` and includes
  `NewPuzzleButton`.

## Acceptance

*Proposed.* Two new files and thirteen amended files.

### src/lib/puzzle-filters.test.ts (Vitest)

The module loads through a variable path, with its types declared in the
test, so the specification-only baseline type-checks (the
`play.test.ts` pattern).

1. **18-S4-1** the filter function:
   - No filter keeps every puzzle, in order.
   - Play options follow the caller's play state of published puzzles,
     own or not. No attempt reads as Unplayed.
   - Create options are only the caller's own unpublished grid,
     unpublished hints and unlisted published puzzles, never another
     builder's.
   - OR within a group, and OR between Play and Create.
   - Size narrows with AND. Other sizes match no Size option.
   - Nothing matching gives an empty list.
   - The input is not changed.
2. **18-S4-2** the URL form: it reads each group, ignores unknown or
   repeated values, writes canonical order omitting empty groups (`''`
   for none), and round-trips.

### e2e/library-filters.spec.ts (Playwright)

Fresh builders. Rows are found by unique titles, and group or emptiness
checks use filters a fresh builder controls.

3. **18-S4-3** one list, in two cases:
   - With no filter, the caller's grid and hints drafts link to the
     builder and the caller's unlisted and completed published puzzles
     link to play. Foreign untouched, in-play and completed puzzles link
     to play. Own rows have the menu, foreign rows don't. Markers and
     Reset show where they belong. Foreign drafts and unplayed foreign
     unlisted puzzles aren't listed. Drafts sort first and completed
     rows last. There is no radio and no `crossward:library-view` key.
   - The caller's completed puzzle has Reset 12px left of the menu button
     on one line, and both work. The menu reads Duplicate, Open in
     builder, Make unlisted, Delete, and Open in builder opens the locked
     editor.
4. **18-S4-4** filtering, in three cases:
   - Three fieldsets in order with their legends and native checkboxes.
     Build Phase shows only own grid drafts (size groups mini and daily
     only). Adding Unplayed adds untouched published puzzles. Adding Mini
     narrows to the mini group. Unchecking restores the list.
     Underway and Complete show only those.
   - Hint Phase plus Sunday matches nothing: "No puzzles match these
     filters.", body-normal muted, 27px below the heading.
   - Checking and unchecking needs no reload and no `/puzzles` or
     server-action request.
5. **18-S4-5** the URL, in three cases:
   - The query is written in canonical order, no history entries are
     added, and unchecking everything returns to `/puzzles`.
   - Reload, and Back from a puzzle, keep the checks and the filtered
     list.
   - A filtered URL checks its options and ignores unknown values.
6. **18-S4-6** Reset: hidden with nothing checked. It then shows title-4
   `link-muted` on the "Filters" h2's baseline, right of it, and turns
   `button-hover` on hover. Clicking it unchecks everything, removes
   itself, focuses the label and returns to `/puzzles`.
7. **18-S4-7** the checkbox, in two cases:
   - 16×16, 4px radius, 1px `button-alternate-border` outline, no blue
     pixels when unchecked. Checked, `button-fill` fill and outline with a white
     check, checked by pixel.
   - The label is body-normal primary, 8px after the box and centered on
     it. Keyboard focus rings the label and a click doesn't. Space
     toggles the checkbox and updates the URL.
8. **18-S4-8** the desktop column, in two cases:
   - At 1280: the list column is 700px with its hairline, 90px under the
     masthead, and the 900px pair is centered. The list is 27px below the
     heading, and its first Row Heading is at its top. Create A Puzzle is
     200px left of the hairline, level with the list top, and opens the
     dialog once ready. "Filters" is title-4 primary, 20px below and 6px in.
     Legends and options have the spacings above, inside the column.
     The hairline runs past the last option. The Filters button is
     hidden.
   - Two columns at 948px; one column at 947px.
9. **18-S4-9** smaller screens, at 375px and 947px: Create A Puzzle and
   the "Filters" button share a row 27px below the heading, and the list
   is 27px below. The button is closed and title-4 `link-muted`. It opens
   the panel 16px below the row, with groups side by side and nothing
   past the window. Checking applies at once ("Filters · 1",
   "Filters · 2"), with Reset right of the label. Escape closes the panel
   and focuses the button, with the filters still applied. The button
   toggles the panel, and after a reload the panel starts closed.
10. **18-S4-10** the style guide's `sg-checkbox` section shows the
    Checkbox unchecked and checked (`button-fill`, 4px radius).

### Amended acceptance

These are amended in the specification-only freeze commit. Every other
frozen test is unchanged. "Retired" cases are removed with a comment
naming their replacement.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/puzzle-library.spec.ts` | header comment; helpers | `VIEW_KEY`, `BUILD_EMPTY`, `viewOption`, `show`; `openLibrary(page)` | adds an 18-S4 note; removes the view helpers and constants; `openLibrary(page, query = '')` |
| `e2e/puzzle-library.spec.ts` | 14-S2-1 "one centered container 90px below the masthead, 700px wide, at least 630px tall, with a 1px line-muted left hairline" | the container centered | renamed "… left hairline, centered with the left column"; the container and the 200px column are centered together |
| `e2e/puzzle-library.spec.ts` | 14-S2-1 "the title-2 h1 sits on the content edge, the nav Radio on its right edge on the heading's baseline, and a 1px line-dark rule 8px below" | the Radio and the rule | renamed "the title-2 h1 sits on the content edge, 10px below the top, with no Radio and no rule"; the heading checks are kept; there is no `library-view`, no radiogroup and no `puzzle-list-rule` |
| `e2e/puzzle-library.spec.ts` | 14-S2-1 "Row Headings and rows: 20px below the rule, …" | the first heading 20px below the rule | renamed "… 27px below the heading, …"; the first Row Heading is 27px below the page heading; opened with `?create=build` |
| `e2e/puzzle-library.spec.ts` | 14-S2-1 "Create A Puzzle is a normal Button on the content edge, 20px below the last row, in both views" | the button under the list | **retired**; replaced by 18-S4-8 (place, text, dialog) |
| `e2e/puzzle-library.spec.ts` | 14-S2-1 "an empty Build view shows its body-normal muted line 20px below the rule, then Create A Puzzle 20px below it" | Build's empty line | **retired**; replaced by 18-S4-4 (the no-match line) and `library-source.test.ts` (the unfiltered line) |
| `e2e/puzzle-library.spec.ts` | 14-S2-2 "the right control: …" | chooses Play first | no view to choose (the loop drops its view element) |
| `e2e/puzzle-library.spec.ts` | 14-S2-3 "lists only the caller's puzzles, every phase, with their status, the row menu and the editor link" | only own rows, each with the editor link; foreign published not listed | renamed "lists the caller's puzzles in every phase, with their status and the row menu; drafts link to the editor, published ones to play"; own published rows link to play; foreign drafts not listed; a foreign published row is listed without a menu |
| `e2e/puzzle-library.spec.ts` | 14-S2-3 "the link opens the editor, a published puzzle included" | the published row's link opens the editor | renamed "the draft's link opens the editor; a published puzzle opens in the editor from its menu"; uses Open in builder |
| `e2e/puzzle-library.spec.ts` | 14-S2-3 "orders unpublished before published, newest first, and a completed own puzzle does not sink" | draft < completed < older | renamed "orders unpublished first, then published still to finish, then completed"; draft < older < completed |
| `e2e/puzzle-library.spec.ts` | 14-S2-4 "lists every published puzzle, …" | chooses Play; own draft and every unpublished row absent | no view; the own draft is listed with its editor link; the foreign draft is absent |
| `e2e/puzzle-library.spec.ts` | 14-S2-4 "completed puzzles sort after unfinished ones, even when newer" | chooses Play | no view to choose |
| `e2e/puzzle-library.spec.ts` | 14-S2-5 "the choice" (3 cases) | the Radio's default, switching, storage and per-view Row Headings | **retired**; replaced by 18-S4-3 (one list, no Radio or key), 18-S4-4 (no reload or server request, groups follow the filtered rows) and 18-S4-5 (URL state) |
| `e2e/library-play.spec.ts` | `showView`, `playLibrary` helpers | `playLibrary` chose Play | `showView` removed; `playLibrary` just opens the library (affects every P5 case that uses it) |
| `e2e/library-play.spec.ts` | P5 "every listed published row offers Play to every player; unpublished rows do not" | Build view: the own published row's editor link; the foreign row absent | the own published row's menu offers Open in builder; the foreign row has no menu; the draft checks are kept, without view switches |
| `e2e/library-play.spec.ts` | P5 "clicking anywhere on a row follows its primary action; secondary controls act alone" | Play and Build loops; the own published row opened the editor through its Build link | one loop (own published and foreign to play, own draft to the editor); the own published row opens the editor through its menu |
| `e2e/library-play.spec.ts` | P5 "completed puzzles sort last within their size group, and leave it when reset" | the draft absent | the draft is listed, first in the group |
| `e2e/ownership.spec.ts` | O1 "explicit fixture builders are retained and the library lists only the caller's drafts" | also checks the Play view | the Play-view block is removed (comment added) |
| `e2e/builder-edits.spec.ts` | O3 "the library gives only owners Edit, and foreign published puzzles only Play, across reloads" (and its header comment) | Build and Play passes; the comment describes the views | one pass: own drafts link to the editor; every listed published row links to play, never the editor; own rows have the menu, foreign rows don't; foreign drafts and unlisted puzzles are absent |
| `e2e/builder-edits.spec.ts` | O3 "an own published puzzle opens locked, with no Unpublish" | clicks the row's editor link | opens it through the menu's Open in builder |
| `e2e/modal-design.spec.ts` | F4-5 "the library reset's footer: confirm then cancel" | chooses Play | no view to choose |
| `e2e/no-play-reset.spec.ts` | 17-S3-1 "the library's Reset still offers a completed puzzle a fresh start" | chooses Play | no view to choose |
| `e2e/delete-published.spec.ts` | `showView` helper | — | removed |
| `e2e/delete-published.spec.ts` | 16-S3-1 "the menu offers Delete after the visibility item …" | published rows `Duplicate, Make public/unlisted, Delete`; inline comment "16-S4: every row offers Duplicate first." | `Duplicate, Open in builder, Make public/unlisted, Delete`; the comment adds "18-S4: published rows add Open in builder." |
| `e2e/delete-published.spec.ts` | 16-S3-4 "deletes the published puzzle and every session for it, in place, and it leaves both views" | chose Play before the final checks | renamed "… and it leaves the list"; no view to choose |
| `e2e/delete-published.spec.ts` | 16-S3-6 "after the builder deletes the puzzle, …" | chose Play before the final check | no view to choose |
| `e2e/duplicate.spec.ts` | `showView` helper | — | removed |
| `e2e/duplicate.spec.ts` | 16-S4-1 "Duplicate first on every Build row, then the visibility item on published rows, then Delete" | published rows `Duplicate, Make …, Delete` | renamed "Duplicate first on every own row, then Open in builder and the visibility item on published rows, then Delete"; published rows `Duplicate, Open in builder, Make …, Delete` |
| `e2e/duplicate.spec.ts` | 16-S4-2 "opens an unpublished copy …" | in Play, the copy absent and the source listed | the copy has no play link; the source has one |
| `e2e/unlisted.spec.ts` | `showView` helper | — | removed |
| `e2e/unlisted.spec.ts` | 16-S1-1 "Play lists own puzzles, others' public ones and others' unlisted ones the player has started, across a reload" | Play then Build; Build excludes foreign rows | renamed "the library lists …"; one list; own rows have the menu, the listed foreign rows don't |
| `e2e/unlisted.spec.ts` | 16-S1-2 "the link opens another builder's unlisted puzzle, and from then on it is listed in Play" | Play view; absent from Build | renamed "… from then on it is listed"; listed in the one list, without a menu |
| `e2e/unlisted.spec.ts` | 16-S1-3 "a puzzle published Unlisted is listed for its builder, …" | chose Play | no view to choose |
| `e2e/row-menu.spec.ts` | header comment; `showView` helper | — | adds an 18-S4 note; helper removed |
| `e2e/row-menu.spec.ts` | 16-S2-1 "every Build row has one in place of Delete; Play rows have none" | published rows had no menu in Play | renamed "every own row has one in place of Delete; others' rows have none"; a foreign published row has none |
| `e2e/row-menu.spec.ts` | 16-S2-3 "Delete on an unpublished row; …" | published `Duplicate, Make …, Delete` | `Duplicate, Open in builder, Make …, Delete` |
| `e2e/row-menu.spec.ts` | 16-S2-7 "Make public, then Make unlisted: …" | `['Duplicate', next, 'Delete']` | `['Duplicate', 'Open in builder', next, 'Delete']` |
| `e2e/row-menu.spec.ts` | 16-S2-8 "made unlisted, a puzzle stays with its player, …" | the player and the stranger chose Play | no view to choose |
| `e2e/status-icons.spec.ts` | header comment; `show` helper | — | adds an 18-S4 note; helper removed |
| `e2e/status-icons.spec.ts` | 18-S3-2 "Build lists Build, Hint and Play icons by phase and publication; Play lists only Play icons" | chose Play for the published rows | renamed "own rows draw Build, Hint and Play icons by phase and publication; every published row draws Play"; no view |
| `e2e/status-icons.spec.ts` | 18-S3-3 "each row names its status …" | re-checked the unlisted row after choosing Play | no view; checked once |
| `e2e/status-icons.spec.ts` | 18-S3-4 "Build rows carry no [grid], [hint] or [published]" | — | renamed "own rows carry no …"; body unchanged |
| `e2e/status-icons.spec.ts` | 18-S3-4 "Play rows keep [in-play] and [complete]: …" | chose Play | no view to choose |
| `e2e/status-icons.spec.ts` | 18-S3-5 "a Play-icon row is puzzle-row-play, …" | three view/row cases | two rows (own published, foreign completed), no view |
| `e2e/focus-ring.spec.ts` | 14-S11-4 "the library: a row and Build/Play ring on Tab, not on click" | the selected Radio option | renamed "the library: a row and a filter checkbox ring on Tab, not on click"; the Underway checkbox's label |
| `src/components/puzzle/library-source.test.ts` | header comment; `LIBRARY_FILES`; "the Play view has its empty line" | Play's "No puzzles to play yet." | adds `LibraryFilters.tsx` and `ui/Checkbox.tsx` to the token checks; renamed "the empty list has its lines": "No puzzles yet." and "No puzzles match these filters." |

### Acceptance choices *(delegated, orchestrator)*

- Most amendments only drop a view switch, since the one list holds both
  views' rows. Where a case pinned behavior the EPIC changes, the
  amendment pins the new behavior: own published rows link to play,
  the menu gains Open in builder, and completed own puzzles sink.
- The 14-S2 layout cases keep the list column's frozen geometry (700px,
  hairline, 90px, heading at +10, rows). The new column's geometry is in
  18-S4-8.
- Several amended cases pass on `main` by design: their change only
  removes a view switch the one list doesn't need (`ownership` O1,
  `delete-published` 16-S3-4 and 16-S3-6, P5 "another player's attempt",
  18-S3-4 "own rows").
- The unchecked box's fill is pinned by pixels (no blue), not by a
  transparent computed background.
- Not covered in the browser: the unfiltered empty line, which the
  shared database never reaches (checked in source). The style guide's
  two sample rows keep their looks and stay covered by their existing
  cases.

### Discrimination (2026-11-02, observed)

Re-run after the specification review's should-fix items (measured
spacing, the style-guide sample, the Reset wording and the renamed
16-S3-4).

- **Current `main` with the proposed and amended tests:**
  - `tsc --noEmit` and ESLint pass (only the existing `request-logger`
    warning). `npx vitest run src/lib/puzzle-filters.test.ts
    src/components/puzzle/library-source.test.ts` gives 2 files failed,
    15 tests failed (`Cannot find module '/src/lib/puzzle-filters'`;
    `library-source` fails to load with ENOENT on `LibraryFilters.tsx`).
  - First draft: `npm run test:e2e --` over `library-filters`,
    `puzzle-library`, `library-play`, `ownership`, `builder-edits`,
    `modal-design`, `delete-published`, `no-play-reset`, `duplicate`,
    `unlisted`, `row-menu`, `status-icons` and `focus-ring` gave 59
    failed and 91 passed. The amended cases fail where `main` still has
    the views: the Radio and rule present, the list centered alone, own
    published rows without Reset or a play link, no Open in builder,
    foreign rows absent in the default Build view, no checkbox to ring.
    The passes are unaffected cases plus the five noted under Acceptance
    choices.
  - After the review fixes, the changed files were re-run on `main`:
    `npm run test:e2e -- e2e/library-filters.spec.ts
    e2e/puzzle-library.spec.ts e2e/delete-published.spec.ts` gave 26
    failed and 24 passed. All 16 new browser cases fail, 18-S4-10 included
    (no `sg-checkbox`), as do the amended `puzzle-library` cases (now
    with 27px) and 16-S3-1. Renamed 16-S3-4 passes on `main` by design.
- **Throwaway implementation**, then reverted. It touches
  `PuzzleLibrary.tsx`, `PuzzleRow.tsx`, `PuzzleRowMenu.tsx`,
  `LibraryPlayControls.tsx`, `library-row.ts` and the style guide's
  `page.tsx` (sample rows' `own`, the `sg-checkbox` section), and adds
  `src/lib/puzzle-filters.ts`, `src/components/ui/Checkbox.tsx` and
  `src/components/puzzle/LibraryFilters.tsx`. The patch is kept outside
  the repo at `/tmp/18-s4-throwaway.patch` and applies cleanly to this
  tree (`git apply --check`).
  - `npm run verify` exit 0 (Vitest 656 of 656).
  - The same three files: 50 passed.
  - Full `npm run test:e2e` exit 0: 937 passed, 0 failed, under the
    guarded harness's standing reset grant. That is S3's 926, minus 5
    retired, plus 16.
- **Mutations on the first throwaway** (each reverted; the code they
  mutate is unchanged by the review fixes):
  - Play and Create combined with AND: Vitest 2 failed (18-S4-1
    "Play and Create combine with OR", "Size narrows …"). The browser run
    had 2 failed (18-S4-4 filtering, 18-S4-5 "opening a filtered URL").
  - `pushState` instead of `replaceState`: 1 failed (18-S4-5, "no history
    entries").
  - Reset not focusing the label: 1 failed (18-S4-6, `toBeFocused`).

## Repo paths

Acceptance (immutable after freeze): `src/lib/puzzle-filters.test.ts`,
`e2e/library-filters.spec.ts`, `e2e/puzzle-library.spec.ts`,
`e2e/library-play.spec.ts`, `e2e/ownership.spec.ts`,
`e2e/builder-edits.spec.ts`, `e2e/modal-design.spec.ts`,
`e2e/no-play-reset.spec.ts`, `e2e/delete-published.spec.ts`,
`e2e/duplicate.spec.ts`, `e2e/unlisted.spec.ts`, `e2e/row-menu.spec.ts`,
`e2e/status-icons.spec.ts`, `e2e/focus-ring.spec.ts` and
`src/components/puzzle/library-source.test.ts`.

Runtime:

- `src/lib/puzzle-filters.ts` (new): the filter function, the options
  and the URL form.
- `src/components/ui/Checkbox.tsx` (new).
- `src/components/puzzle/LibraryFilters.tsx` (new): Create A Puzzle, the
  Filters button, the panel and Reset.
- `src/components/puzzle/PuzzleLibrary.tsx`: one list, the URL state and
  the layout. The Radio and its storage are removed.
- `src/components/puzzle/PuzzleRow.tsx`: `own` replaces `view`, with play
  links and controls on every published row.
- `src/components/puzzle/PuzzleRowMenu.tsx`: Open in builder.
- `src/components/puzzle/LibraryPlayControls.tsx` and
  `src/components/puzzle/library-row.ts`: Reset's right inset.
- `src/app/style-guide/page.tsx`: the sample rows' `own` prop and the
  `sg-checkbox` sample.
- This story and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S4. These stay out of scope:

- searching, sorting options and pagination;
- filter options beyond the human's list;
- any change to `listPuzzles`, `puzzleStatus`, `classifyLibraryPlay` or
  `groupPuzzles`;
- the builder, play and the dialogs;
- other pages' layouts;
- the `Radio` component (its `nav` variant stays in the style guide);
- the narrow rows' date overflow (epic 15's open item).

## Definition of done

- The orchestrator approves this specification, its acceptance and the
  amendments after an independent specification review, under the
  human's delegation. The approval is recorded here and in the handoff.
  Freeze on `main` in a specification-only commit before any runtime
  change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.

## Pending questions

None material. The EPIC settles the one list, the options and their
logic, Reset, the layouts and the checkbox. The values above, the URL
form, the empty unfiltered line, "Open in builder"'s position and the
Reset-beside-menu placement are routine, reversible calls. They are
recorded under Delegated decisions for the reviewer and the human.
