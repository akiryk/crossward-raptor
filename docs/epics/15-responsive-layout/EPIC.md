# Epic: Responsive layout

**Approved by the human 2026-10-27.** Drafted the same day from the
human's details and two mockups; every pending question was answered
before approval *(human)* and is recorded in Decisions. Stories are
drafted and approved one at a time. Amended the same day, before any story
was drafted, with the human's wide-layout details (the 1800px main area,
the 32px gap and full-width hint columns); see "The human's details".

The third of the redesign epics outlined in the
[Design system EPIC](../13-design-system/EPIC.md#the-redesign-programme)
(the fourth, the username epic, was folded into
[epic 14's S1](../14-screen-redesign/EPIC.md#username-at-sign-in-human-2026-10-25)).
Epic 14 redesigned every screen at desktop width. This epic makes the
builder and play hold up as the window narrows: the grid keeps its full
size as long as it can, the hints give way first, and below a width the
hints become one hint at a time under the grid.

---

## Scope

1. **A 560px grid.** Every grid size fits 560px at most, up from 526px, so
   a Sunday (21×21) grid's cells are large enough.
2. **Wide layout:** below the full-width masthead, the main area is at
   most 1800px wide and centered. In the builder and play, the hints sit
   32px from the grid and their columns fill the room left. In the
   builder, the grid stays 560px while only the hint columns shrink; below
   about 1290px the Across and Down columns become one.
3. **Builder, narrow** (below about 1000px): the title, buttons and grid
   centered in one column at the grid's width, with a smaller title, the
   toggle beside the buttons and tighter spacing. The hints go below the
   grid as the Hint Box.
4. **Builder Hint Box:** in the narrow layout, one hint at a time in a box
   below the grid, with arrows to the previous and next word.
5. **Play, narrow** (below about 1290px): only the masthead's logo above
   the grid, the grid centered, and one hint at a time in a blue bar below
   it, with arrows.
6. **Small screens** (below about 606px): only now does the grid shrink.
   Cell letters scale with the cell, cell numbers keep a readable minimum,
   and nothing clips at 375px.

The style guide changes alongside each story, as in epic 14: a story that
adds a component (the Hint Box, the play hint bar) adds its sample.

## The human's details (2026-10-27)

Recorded as given; the Decisions below are drawn from them.

- **Narrow Build/Hint/Preview** (mockup 1): the smaller title is
  `title-3`. The toggle moves to the right of the buttons. Space tightens
  up. One hint at a time shows at the bottom, inside a box with a 1px
  gray-700 border. The box has two arrows that move to the next word (left
  to right, then top to bottom; across first, then down). The hint label
  is in the same type style as before, but to the left of an input filled
  blue-medium.
- **Narrow play** (mockup 2): similar, but with no buttons or title at the
  top. One hint at a time shows at the bottom, and the whole hint area is
  blue.
- **Grid width:** 560px by default, so the cells are large enough for
  Sunday puzzles.
- **Build and hint phases, responsive:** the grid stays 560px as long as
  possible. Today, narrowing from over 1500px first shrinks only the two
  hint columns (kept), but from about 1290px the grid shrinks too (not
  wanted: only the hint columns should shrink). Below about 1290px, a
  container or media query turns the two hint columns into one, so the
  hints still show beside the grid down to about 1000px. Below that, the
  grid, the buttons and the title are centered, the grid keeps its width,
  and the hints go below the grid. The grid then needn't shrink until
  about 606px.
- **Play, responsive:** all hints show to the right of the grid when
  there's room. Below about 1290px, as NYT does, one hint shows: the one
  for the word at the cursor in its direction (the cursor in Down mode on
  a cell of 7 Down shows 7 Down's hint). Spare room centers the grid.

### Amendment (2026-10-27)

- **Builder, hints and play:** less gap between the hints and the grid,
  32px. The Across and Down columns have a max width today; remove it, so
  they take all the space available.
- **The main area maxes out at 1800px** and stays centered beyond that, so
  the hints don't get absurdly wide. The masthead still spans the whole
  screen at any size.

## Decisions

The ones marked *(human)* come from the details above or from epics 13
and 14's approved Decisions, which still hold.

**Epics 13 and 14's Decisions carry over** *(human)*: components use color
styles, never palette variables; each phase has its own cell styles; exact
values come from the human per story, with the mockups (now including
the two narrow mockups of 2026-10-27) as the default; a story that replaces
frozen behavior names each superseded test and its replacement, retired in
the story's specification-only freeze commit; tests assert structural
properties rather than judging the design.

**Behavior is kept unless a story says otherwise.** This epic changes
layout and adds one-hint-at-a-time views. Saving, publishing, play
persistence, the grid engine and keyboard entry keep their behavior. New
behavior (the arrows, which word the box shows) is named in its story.

**Grid width 560px** *(human)*. Every grid size fits 560px at most,
superseding 14-S5's 526px in the builder and 14-S7's in play. Letters keep
their ratio to the cell (14-S5), so they grow with it; numbers stay
`cell-number`.

**The grid shrinks last** *(human)*. In the builder, as the window
narrows, the order is: the hint columns shrink; the two columns become
one (about 1290px); the hints move below a centered grid (about 1000px);
only then (about 606px, the grid plus the page's 24px padding on each side)
does the grid shrink. The grid's `max-w-[45%]` cap, which shrinks it from
about 1290px today, goes.

**Below the grid means one hint at a time** *(human, 2026-10-27)*. When
the builder's hints move below the grid (about 1000px and narrower), they
show as the Hint Box, never as the full list.

**The grid doesn't shrink with the window's height** *(human,
2026-10-27)*. The builder's and play's height terms (`100vh` minus 300px
and 370px) go: the grid is 560px whenever the width allows, and the page
scrolls.

**Narrow play shows only the logo above the grid** *(human, 2026-10-27)*.
Below about 1290px, play's title and "Puzzle options" (and with it Reset)
don't show; the masthead's logo, which links to `/puzzles`, is the way
back. Other links or controls may be added later, outside this epic.
*Proposed:* the save, error and warning messages still show when they
occur, and the completion dialog is unchanged.

**The default test viewport is 1440px wide** *(human, 2026-10-27)*. The
Playwright projects' default viewport moves from `Desktop Chrome`'s
1280×720 to 1440×900, so play's 1290px threshold doesn't change what
existing tests see. The change lands in S1's specification-only freeze
commit as approved acceptance infrastructure; new tests name narrow
viewports explicitly. *(Height 900 is proposed; the human approved the
1440px width.)*

**The narrow layout's own title and toggle** *(human, 2026-10-27)*. The
`title-3` title, the toggle to the right of the numbered buttons and the
tighter spacing apply only below about 1000px; wider, the builder keeps
the `title-1` title and the toggle row above the grid.

**Narrow build phase: the legend only** *(human, 2026-10-27)*. Below about
1000px in the build phase, nothing shows below the grid except Preview's
legend (the error and warning cells present) while Preview is on. The Hint
Box is the hints phase's.

**No separate spacing pass** *(human, 2026-10-27)*. Epic 13's programme
listed "spacing refinement" for this epic; spacing changes only where a
story names them, like the narrow layout's tightening and S2's 32px gap.

**A 1800px main area** *(human, amendment 2026-10-27)*. The masthead spans
the window at any width. Everything below it (`app-main`'s content) is at
most 1800px wide and centered. Today nothing caps it.

**32px between the grid and the hints, columns that fill** *(human,
amendment 2026-10-27)*. In the builder's build and hints phases and in
play, the gap between the grid and the hints is 32px, down from 72px in
the builder and 66px in play. The hint columns lose their max widths
(`max-w-[350px]` in `HintsPanel` and `HintSkeleton`, `max-w-[270px]` in
`PlayerHints`) and share the room left beside the grid, which the 1800px
main area bounds. The thresholds above were judged with the old gaps; S2
settles their exact values.

**Thresholds are set by content, not by device** *(proposed)*. The
breakpoints are the widths the human gave, measured on the editor's and
play's own layout container with CSS container queries (Tailwind v4's
`@container`), since they depend on that container's room for a 560px grid
plus hints, not on a device class. The style guide's samples can then
show each layout at a fixed sample width. Each story settles its exact
pixel values with the human.

**Hint Box** *(human)*. Builder, narrow: one hint at a time, below the
grid, in a box with a 1px border (a new color style on gray-700). Inside, a
left arrow, the slot's word in the Hint Input's answer style (`label`,
letter-spaced, `muted`), an input filled blue-medium (a new style) holding
the hint, and a right arrow. The arrows step through the words in reading
order: every Across word by number, then every Down word, and wrap at
the ends (the last Down's right arrow goes to the first Across, and back)
*(human, 2026-10-27)*. *Proposed:* an arrow selects its word in the grid
and focuses the box's input.

**A 4px rule above the box and the bar** *(human, 2026-10-27)*. In both
narrow mockups, a 4px gray-700 line (a new color style) runs along the
grid's bottom edge, the top of the Hint Box and the play hint bar.

**Play hint bar** *(human)*. Play, narrow: one hint at a time in a bar
below the grid, filled blue-medium (a new style) across the grid's width,
with the same arrows and order. It shows the hint of the word at the
cursor in the cursor's direction. The hint text is centered, with no
number or direction ("14A") *(human, 2026-10-27)*.

**Play, wide keeps its arrangement** *(human)*. With room for the hints
beside the grid (about 1290px and up), play keeps 14-S7's layout: the
Prominent Hint above the grid and the Player Hints to its right, with only
the 32px gap and filling columns changed (amendment).

**No new behavior in the engine.** Reading-order navigation, if it needs a
helper, lives in `src/lib/` and takes the numbered slots it already has.

## Carried observations

From [epic 14's Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27):

- **375px clipping:** a long puzzle title in the editor clips at the right
  edge, and play's "Puzzle options" button runs past the right edge.
  The title is S6's; narrow play no longer shows "Puzzle options" (S5).
- **Cell-letter and cell-number scaling** below the full grid size.
  Assigned to S6 (letters already scale with the cell since 14-S5; numbers
  need a readable minimum).
- **Modal panel clips content taller than the viewport.** A small-screen
  issue, but no current dialog is that tall. S6 fixes it if a dialog is
  that tall at 375×667; otherwise it stays open.

Not this epic's: the Modal close button's missing transition,
`applyGeometryEdit` with no app caller, and the builder-page-only "'Edit
the Grid' appears nowhere" check stay open as epic 14 left them.

## Non-goals

- **No grid-engine change.** `src/engine/**` is untouched.
- **No new puzzle, publishing or play behavior** beyond the Hint Box's and
  the play hint bar's word navigation.
- **No change to the library, sign-in or dialogs** beyond fixing what
  clips at 375px (S6).
- **No touch-specific input** (an on-screen keyboard, swipe gestures,
  tap-to-toggle direction beyond today's click behavior).
- **No dark mode, no redesign of epic 13's components.** A needed change
  to one is named in its story.

---

## Stories

Order as listed. Story files are `stories/15-S<n>-<slug>.md`. Each takes
exact values from the human where given and the mockups otherwise, and
lists the frozen tests it supersedes.

### S1 — 560px grid

The builder's and play's grid fit 560px at most at every size. Retires the
526px expectations in `e2e/build-grid-design.spec.ts` and
`e2e/play-design.spec.ts`, and the 526/35px constants in
`PuzzleGridEditor.tsx`, `PlayPuzzle.tsx` and `PuzzleGrid.tsx`. Removes
both grids' height terms. Its freeze commit moves the default test
viewport to 1440px wide.

### S2 — Wide layout

The main area capped at 1800px and centered under the full-width
masthead. In the builder and play, the 32px gap between the grid and the
hints and hint columns without max widths. In the builder, the grid holds
560px and only the hint skeleton's and Hint Inputs' columns shrink; below
about 1290px the Across and Down columns stack into one beside the grid.
Covers the build phase's skeleton, the hints phase, Preview's legend and
wide play.

### S3 — Builder, narrow

Below about 1000px: one centered column at the grid's width, the title in
`title-3`, the toggle to the right of the numbered buttons, tighter
spacing (values from the human), and below the grid only Preview's
legend in the build phase and the Hint Box's place in the hints phase. The
published state's "Published" and "Play it!" fit the same column.

### S4 — Builder Hint Box

The Hint Box below the narrow grid in the hints phase, its 4px top rule,
its wrapping arrows and reading order, and how
it follows the grid's cursor and the hint input's focus. Adds the
`sg-hint-box` style guide sample.

### S5 — Play, narrow

Below about 1290px: only the masthead's logo above the grid (no title,
no "Puzzle options"), the grid centered, the Prominent Hint and Player
Hints replaced by the play hint bar (its 4px top rule, centered hint, no
number, wrapping arrows) below the grid, following the cursor.
Adds
the play hint bar's style guide sample.

### S6 — Small screens

Below about 606px the grid shrinks to fit; letters scale with the cell and
numbers keep a readable minimum. Fixes the 375px clipping (the editor's title;
narrow play no longer shows "Puzzle options") and any dialog taller than a 375×667 viewport.

---

## Pending questions

None. The first draft's ten questions were answered 2026-10-27 *(human)*
and are recorded in Decisions. Two details stay *proposed* for their
stories: an arrow focusing the Hint Box's input (S4), and the test
viewport's 900px height (S1).
