# Epic: Puzzles page

**Approved by the human 2026-11-02**, including every item the draft
proposed (marked *Approved* below). Drafted the same day from the
human's request of that day: two app-wide color changes, status icons
and green play rows on `/puzzles`, and filters. The human chose
*(2026-11-02)*: one epic of four stories; the filters replace the Build |
Play toggle; Play and Create filters combine with OR. Stories are drafted
and approved one at a time.

A softer muted text color, two new greens, status icons, green play rows
and filters on the puzzles page.

---

## The human's details (2026-11-02)

Recorded as given; the Decisions below are drawn from them. Mockups and
icons are in the human's `~/Downloads` (the request said
`~/Documents/puzzles-page-mock.png`; the file is in `~/Downloads`).

- **Muted text:** change `text-muted` to black with opacity, #000 at 0.4,
  so it looks better on different backgrounds. App-wide.
- **Two new colors:** `green-faint` #F0F5E5 and `green-faint-hover`
  #EAF0DB.
- **Status icons** on `/puzzles`, to tell puzzles ready to play from those
  needing hints or a finished grid: `play-icon.svg` for published puzzles,
  public or not (they can be played); `build-icon.svg` for puzzles in the
  build phase; `hint-icon.svg` for puzzles in the hint phase. Clean up the
  exported SVGs if they are funky.
- **Green play rows:** every row with the play icon has a `green-faint`
  background, `green-faint-hover` on hover (`play-row-mock.png`; the
  hover mock, missing when this EPIC was approved, was later added as
  `play-row-hover-mock.png`, per S3).
- **Filters:** as a builder or player, I want to filter puzzles so I can
  easily find the ones I want. Groups in this order: Play (Unplayed,
  Underway, Complete), Create (Build Phase, Hint Phase, Unlisted), Size
  (Mini, Midi, Daily, Sunday). On desktop they sit left of the puzzle
  rows, below the Create A Puzzle button, which also moves left
  (`puzzles-page-mock.png`). "Filters" and the group labels use `title-4`
  and `text-primary`; options use `body-normal` (the human's
  "body-text-normal") and `text-primary`. Checkboxes fit the visual
  design's style and scale; the implementer styles them.
- **Several filters at once:** Build Phase and Hint Phase show puzzles in
  either phase; adding Mini shows only those that are also Mini.
- **Reset:** as soon as one filter is checked, a Reset button appears
  right of the Filters label on desktop, blue like other links and
  buttons, the same text size as the label.
- **Smaller screens:** the implementer's call, prioritizing usability and
  findability. Filters are findable, not the primary element.

## The human's additions after verification (2026-11-02)

During end-of-epic verification the human passed every S1–S4 check, kept
every delegated decision as built, and added this scope, extending the
same delegation (independent specification review, then orchestrator
approval and freeze) to S5–S8:

1. **DONE icon** *(human)*: "We need a 4th icon for puzzles that are
   complete to distinguish them from puzzles are in play." The export is
   `~/Downloads/complete-icon.svg` (orange #EF9D05, label "DONE"). It goes
   on published puzzles the signed-in player has completed, whoever built
   them; other published puzzles keep Play. The row stays green. The
   visible `[complete]` marker is removed (hidden status text names it
   instead); `[in-play]` stays.
2. **Narrow right margin** *(human)*: below about 900px, `/puzzles` has no
   right margin, so the rows and the Filters button touch the window's
   edge. It needs a right margin like the left one ("it could be exact or
   it could be similar").
3. **Hint preview alignment** *(human; on the hints page, outside this
   EPIC's original page scope)*: toggling Preview Hints shifts the left
   alignment of the Across and Down labels and the numbers, and the labels
   move vertically. Only the hints' own vertical layout may change; the
   labels' and numbers' left alignment and the labels' vertical position
   must stay identical. Use the preview-on alignment (a little more gap
   between the hints and the grid).
4. **Audit cleanups** *(human: "Why can't we fix both?")*: remove
   `Radio`'s now-unused `nav` variant, and correct the frozen tests'
   stale Build/Play headers and describe titles through STORY's
   correction procedure.
5. **First hint numbers fixed** *(human, during S5–S8 verification,
   approved by the human without delegation)*: toggling Preview Hints
   must not move either column's first hint number: not its left, top,
   size or color.

## What the code does today (2026-11-02)

- **Colors** (`src/app/globals.css`, epic 13): palette variables, then
  color styles referencing them; components use only styles. `muted` is
  `gray-500` (#8B909A), used as `text-muted` across the app (titles'
  dimensions, builder names, dates, empty states, hints, inputs, menus,
  sign-in) and by its style-guide swatch. `modal-backdrop` already mixes
  black with transparency (`color-mix`). `globals-css.test.ts` and
  `e2e/color-tokens.spec.ts` pin every variable and style.
- **The library** (`PuzzleLibrary.tsx`, 14-S2) is one 700px column: a
  "Puzzles" heading with a Build | Play radio (remembered in
  `localStorage`), a rule, size groups (`groupPuzzles`), then Create A
  Puzzle at the bottom. Build lists the caller's puzzles, each linking to
  the builder with a row menu (Duplicate, visibility, Delete) and a text
  marker `[grid]`, `[hint]` or `[published]`. Play lists every published
  puzzle the caller can see, linking to play, with `[in-play]` or
  `[complete]` and, when complete, a Reset button.
- **Rows** (`PuzzleRow.tsx`) are 66px, `puzzle-row` (interactive faint)
  with `puzzle-row-hover`, and start with `CrosswordIcon`, an inline 34px
  SVG drawn with color styles.
- **What the caller sees** (`listPuzzles`): their own puzzles, every
  public published puzzle, and others' unlisted puzzles they have started.
  Play state (`classifyLibraryPlay`) is untouched, in progress or
  completed. `puzzleStatus` gives grid, hints or published; published
  outranks phase.
- **The icons as exported** are 46×34: a 34px grid icon with a 42×12
  label band (BUILD, HINT, PLAY, text as outlines) across it, offset 1.7px,
  with a duplicated cell, hardcoded colors and a fixed clip id. Build uses
  #8B909A (`gray-500`), Hint #14151B (`gray-700`) with a black band, Play
  #84C600, which is in no palette.
- **Narrow library:** epic 15 left it a single column; its dates overflow
  at 320px (15's open item).

## Scope

1. **`muted` is black at 40% opacity**, app-wide.
2. **`green-faint` and `green-faint-hover`** palette variables, with color
   styles for the play rows.
3. **Status icons** replace `CrosswordIcon` on library rows; **play rows
   are green.**
4. **One list with filters,** replacing the Build | Play toggle; the left
   column on desktop and a compact filter control on smaller screens.

## Decisions

**Epics 13 and 14's Decisions carry over:** components use color styles,
never palette variables; exact values come from the human, with the
mockups as the default; a story that replaces frozen behavior names each
superseded test and its replacement, retired in its specification-only
freeze commit; tests assert structural properties.

**Muted text** *(human)*. The `muted` style becomes black at 40% opacity,
everywhere it is used. *Approved (human, 2026-11-02):* like `modal-backdrop`, it mixes the
`black` palette variable with transparency, so no new palette variable;
`gray-500` stays for its other styles. Supersedes `muted`'s value in
`globals-css.test.ts` and `color-tokens.spec.ts`.

**Two greens** *(human)*. New palette variables `green-faint` (#F0F5E5)
and `green-faint-hover` (#EAF0DB), both in the style guide. *Approved (human, 2026-11-02):*
color styles `puzzle-row-play` and `puzzle-row-play-hover` reference
them, mirroring `puzzle-row` and `puzzle-row-hover`; S3 is their first
user.

**Status icons** *(human)*. A row's icon follows `puzzleStatus`: Play for
a published puzzle, public or unlisted, whoever built it; Build for an
unpublished grid-phase puzzle; Hint for an unpublished hints-phase
puzzle. *Approved (human, 2026-11-02):* the SVGs become one inline component like
`CrosswordIcon` (cleaned: no offset, no duplicate cell, a unique clip
id), 46×34 as exported, drawn with color styles. Build and Hint use the
existing gray styles; Play's green (#84C600) needs a new palette
variable, `green`, with a `status-play` style. The icon stays
`aria-hidden`; the row gains visually hidden text naming its status
("Ready to play", "Build phase", "Hint phase"). The `[grid]`, `[hint]`
and `[published]` markers are removed, since the icons replace them;
`[in-play]` and `[complete]` stay on play rows.

**Green play rows** *(human)*. A row with the Play icon is
`puzzle-row-play`, `puzzle-row-play-hover` on hover and while its link
has keyboard focus, as rows do today. Other rows keep `puzzle-row`.

**One list** *(human, 2026-11-02)*. The filters replace the Build | Play
radio. With no filter checked the page lists everything `listPuzzles`
returns: the caller's puzzles in any phase and every puzzle they can
play, grouped by size and sorted as `groupPuzzles` does (unpublished,
then published still to finish, then completed). A play row links to
play and keeps its play controls (Reset when complete). The caller's own
rows keep their menu. *Approved (human, 2026-11-02):* the caller's own published puzzle is a
play row with both; its menu gains "Open in builder" so the builder's
published view stays reachable. The radio and its `localStorage` key
are removed.

**Filters** *(human)*. Three groups in this order, each option a
checkbox:

- **Play:** Unplayed (published, not started by the caller), Underway
  (in progress), Complete (completed).
- **Create:** Build Phase (the caller's, unpublished, grid phase), Hint
  Phase (the caller's, unpublished, hints phase), Unlisted (the caller's,
  published, unlisted).
- **Size:** Mini, Midi, Daily, Sunday (`sizeFor`).

Options within a group combine with OR. **Play and Create combine with OR**
*(human, 2026-11-02)*, as one status filter: Unplayed and Build Phase show
puzzles that are either. **Size narrows** with AND *(human)*. No option
checked in a group means no restriction from it. Size groups with no
matching puzzle are hidden. *Approved (human, 2026-11-02):* when nothing matches, the list
reads "No puzzles match these filters." Others' "Other sizes" puzzles
show only when no Size option is checked. Filters persist in the URL's
query (so refresh and back keep them), not in storage.

**Reset** *(human)*. Shown as soon as any option is checked, right of the
"Filters" label, `title-4`, in the blue of the app's text links (the
builder's Rebus link). It unchecks everything. *Approved (human, 2026-11-02):* focus moves to
the "Filters" label afterward, since the button disappears.

**Desktop layout** *(human, mockup)*. A left column, separated from the
list by a full-height `line-muted` hairline, holds Create A Puzzle, then
"Filters" with Reset, then the three groups. The right column keeps the
"Puzzles" heading and the size groups; the rule under the heading goes,
as in the mockup. Values (column width, gaps, checkbox size) come from
the mockup and are settled in S4. *Approved (human, 2026-11-02):* the two columns apply from
the width where the left column and the 700px list both fit; the story
records the breakpoint.

**Checkboxes** *(human: the implementer's call)*. *Approved (human, 2026-11-02):* a new
`Checkbox` in `src/components/ui/`, a native `<input type="checkbox">`
for keyboard and screen-reader behavior, drawn as a 16px square with
4px corners, a 1px `button-alternate-border` outline, filled with the
button blue and a white check when checked, and the app's focus ring.
Each group is a `fieldset` with its label as `legend`.

**Smaller screens** *(human: the implementer's call)*. *Approved (human, 2026-11-02):* one
column. Below the heading, a row holds Create A Puzzle and a "Filters"
text button showing the number checked ("Filters · 2"). It opens a panel
above the list with the three groups side by side (wrapping when
narrow) and Reset right of its "Filters" label. Filters apply as they
are checked; the panel closes with the button or Escape and the filters
stay applied, so the list stays the main element. The panel starts
closed.

**No grid-engine change.** Filtering is a pure function in `src/lib/`
with unit tests; the page stays a client filter over `listPuzzles`'s
result.

## Non-goals

- Searching by title or builder, sorting options, pagination.
- Changes to `listPuzzles`'s query (which puzzles the caller can see),
  the builder (except S7's and S9's hints-panel alignment), play or the
  dialogs.
- Other pages' layouts. S1 changes the muted color app-wide, nothing else;
  S7 (added by the human) fixes only the hints panel's alignment.
- Filter options beyond the human's list (e.g. Public, Other sizes).

---

## Stories

Order as listed. Story files are `stories/18-S<n>-<slug>.md`. Each lists
the frozen tests it supersedes.

### S1 — Muted text

`muted` as black at 40%, its tests and style-guide swatch.

### S2 — Two greens

The `green-faint` and `green-faint-hover` palette variables, the
`puzzle-row-play` styles and their style-guide samples.

### S3 — Status icons and green play rows

The icon component and its `green` variable, the hidden status text, the
removed markers and the green play rows. Still within today's Build |
Play views, so S4 only changes the list and layout.

### S4 — Filters

One list replacing the radio, the filter function, `Checkbox`, the
desktop left column, the narrow Filters panel, Reset and the URL state.
Supersedes the Build | Play tests (`puzzle-library.spec.ts`,
`library-play.spec.ts` and others using `library-view`), named in the
story.

### S5 — DONE icon

The fourth status icon for completed puzzles, its palette variable and
style, its hidden status text, and the removed `[complete]` marker.

### S6 — Narrow right margin

A right margin on `/puzzles` below the two-column breakpoint.

### S7 — Hint preview alignment

Identical label and number alignment with Preview Hints on or off.

### S8 — Audit cleanups

Remove `Radio`'s `nav` variant; correct the stale frozen-test comments
and describe titles.

### S9 — First hint numbers fixed

Neither column's first hint number moves when Preview Hints toggles.
