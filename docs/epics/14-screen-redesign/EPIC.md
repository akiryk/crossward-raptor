# Epic: Screen redesign

**Status: approved by the human 2026-10-25** (drafted 2026-10-24; the
pending questions were answered the same day as approval). Stories are
drafted and approved one at a time. **Amended 2026-10-25** *(human)*: the
username moves into S1 (see [Username at sign-in](#username-at-sign-in-human-2026-10-25)),
replacing the separate username epic and the builder-name dialog.

The second of the four redesign epics outlined in the
[Design system EPIC](../13-design-system/EPIC.md#the-redesign-programme).
Epic 13 built the palette, the text styles and the shared components
(Button, Modal, TextInput, Preview toggle, Radio, Title, Logo, Masthead).
This epic applies them to every screen, replaces the stepper with numbered
buttons, gives the grid its per-phase colors, and ends by deleting the old
tokens.

---

## Scope

Screens, in story order:

1. **Sign-in and username** (`/`).
2. **Puzzle library** (`/puzzles`): the Build/Play radio choice, Row
   Heading and Puzzle Row.
3. **New-puzzle dialog.**
4. **Builder controls**: numbered buttons in place of the stepper, the
   Preview toggle, the title, Edit grid, clear letters and delete (moved
   into a dialog), publishing.
5. **Build grid and hint skeleton.**
6. **Hint phase**: Hint Input and the hint-phase grid, locked and in EDIT
   GRID.
7. **Play**: Prominent Hint, Player Hint, the play grid and play's
   controls.
8. **Old-token cleanup.**

The style guide changes alongside each story: a story that redesigns a
screen element replaces that element's old sample in `/style-guide` with
the new one.

## Decisions

The ones marked *(human)* come from epic 13's epic 14
entry (the human's details of 2026-10-24) or from epic 13's approved
Decisions, which still hold.

**Epic 13's Decisions carry over unchanged** *(human)*: start fresh rather
than mapping old tokens to new ones; components use color styles, never
palette variables; no doubled names; Inter only; no focus rings (until
S11, which adds a keyboard focus ring); 10px
corners and 1px strokes, with the recorded exceptions; 150ms color
transitions on buttons, toggles, Radio and links; layout stays
untokenized; tests assert structural properties rather than judging the
design; accepted contrast.

**Exact values come from the human per story** *(human)*. The Figma
mockups (desktop) are accurate for layout, colors, sizes, fonts, shapes and
stroke widths but are not fully filled in and are not canonical. Where a
story's values aren't supplied, it defaults to the mockups and says so.

**Retiring superseded acceptance** *(human, epic 13's rule)*. A story that
replaces frozen behavior names each frozen test it supersedes and the
replacement. Approving the story approves the retirement, which lands in
the story's specification-only freeze commit on `main`, never in the
implementation diff.

**Behavior is kept unless a story says otherwise.** This epic changes how
screens look and where controls sit. Saving, publishing, play persistence,
ownership checks and the grid engine keep their behavior. Each departure
(the username at sign-in, the stepper's removal, the builder controls,
Build/Play, the new-puzzle dialog's generated default name) is named in its
story.

**No stepper** *(human)*. F3's numbered buttons ("1 Edit the Grid /
2 Create Hints") replace it. The `Stepper` component, `src/lib/stepper.ts`
and the `sg-stepper` sample are removed, retiring their expectations
(including `e2e/style-guide.spec.ts`'s) through the builder story's freeze
commit.

**Publish is a third numbered button** *(human, 2026-10-25)*. "3 Publish"
sits after "1 Build the Grid / 2 Create Hints" (in the hints phase 1 is
done: gray (`button-done`), 70px, a check in place of its label, and
disabled (S12)). Before the puzzle can be published it opens a cheeky
too-early dialog; otherwise it opens a Publish dialog with the readiness
notes and the visibility choice. A published puzzle shows "Published" and
a "Play it!" link instead of the buttons. Publishing is final: there is no
Unpublish *(human, 2026-10-26)*. Publishing needs every required hint,
enforced in `publishPuzzle` (S4).

**Build/Play on `/puzzles`** *(human, 2026-10-25)*. Build lists your own
puzzles, in any phase, to edit. Play lists every published puzzle you can
see, your own included, to solve. The choice is remembered per browser in
`localStorage`, with Build as the default when nothing is stored. No schema
change; `listPuzzles` stops returning other builders' unpublished puzzles
and adds each builder's username (S2).

**The builder's Delete and Clear all letters are removed** *(human,
2026-10-25)*. This supersedes epic 13's "Delete moves into a dialog".
Puzzles are deleted from the library's delete dialog (S2).

**Closing dialogs** *(human, 2026-10-25)*. Every dialog closes the same
ways: a click on the backdrop, the ×, Escape, or its dismissing footer
button. A busy dialog, like a pending publish, may disable dismissal.

**One word: "hints"** *(human, 2026-10-25)*. The builder says "hints",
never "clues". Each story changes the copy on its own screens.

**Hint skeleton** *(human)*. Beside the grid during the build phase, a
placeholder per hint: an 18×18px dot in `fill-muted`, a 12px gap, then a
1px `line-muted` hairline. S5 settles its layout.

**Build grid size and letters** *(human, 2026-10-26, S5)*. Every grid
size fits the same 526px at most (a 15×15's 36px cells, lines shared).
Letters use `cell-letter`, scaled with the cell; numbers stay
`cell-number`. The '.' key does nothing and the geometry-locked message is
gone: building has only on and off cells.

**Preview legend** *(human, 2026-10-26, S5)*. In the build phase's
Preview, a legend below the grid names the error and warning cells
present, error first.

**Hint Input** *(human)*. Builders, hint phase: the cell's number in
`title-4` `primary`; an input (the hairline, built on F5's TextInput)
whose text is `body-normal` `primary`; the slot's word in `label` `muted`,
right-aligned below the line, letter-spaced, turning `primary` while the
input has focus (F5's description, confirmed by the human 2026-10-25).
S6 *(human, 2026-10-26)*: the number on the input text's baseline in a
fixed 18px column; no placeholder; the answer letter-spaced 10%, 4px below
the line, right-aligned; no active background; the build skeleton's frame,
so nothing moves at Create Hints, with the labels `primary`.

**Cell letters and numbers** *(human, 2026-10-26, S6)* are `primary` in
every phase: build, Preview, the hints phase and play.

**Prominent Hint** *(human, 2026-10-25)*. Play: an NYT-style bar directly
above the grid showing the selected word's number and hint. S7
*(human, 2026-10-27)*: the grid's width, 16px above it, filled
`play-cell-selected-row`, 10px corners; the number and direction ("14A")
in `title-4`, the hint in `body-large`, `primary`; empty, at its one-line
height, with no word selected.

**Player Hint** *(human)*. Play: the number in `title-4` `primary`, the hint
in `body-normal` `primary`. S7 *(human, 2026-10-27)*: a compact list (rows
32px apart, numbers 72px right of the grid, hints 24px after the number,
columns up to 270px); while a word (complete or incomplete) is selected in
the grid, its hint has a `play-cell-selected-row` (`blue-medium`)
background, replacing `hint-cell-selected`. A click on a hint selects its
word.

**Grid colors per phase** *(human)*:

- **Build:** `build-cell-*` for on and off cells, the selected cell, the
  selected word's on cells (lettered or symmetric) and its off cells;
  border `build-cell-border` (gray-400). Preview keeps using the
  `preview-cell-*` styles, with a new `preview-cell-border` (gray-500) for
  its lines; the palette's `cell-warning` is `#CEB55A` (S5).
- **Hint phase** *(S12, replacing S6's locked and EDIT GRID looks)*: on
  cells `hint-cell-on` (white), off cells `hint-cell-off` (gray-700),
  border `hint-cell-border` (gray-500). With the grid focused, the cursor
  is `hint-cell-cursor` (yellow-bright) and its word
  `hint-cell-cursor-word` (yellow-medium), and that word's hint input is
  filled `hint-cell-cursor`; with a hint input focused, its word is
  `hint-cell-selected` (blue-medium). The grid takes focus and letters,
  the shape stays locked, and nothing fades. With Lock Grid Letters on,
  on cells are `hint-cell-locked-on` (gray-200) and the grid takes no
  focus; a published puzzle's grid takes no focus.
- **Each phase has its own cell styles** *(human, 2026-10-26, S6)*, even
  where they share a palette value, so one phase's colors can change
  without touching another's.
- **Play:** the `play-cell-*` styles, including `play-cell-selected-cell`
  and `play-cell-selected-row`.

The style guide's old hint-row and grid samples are replaced by these. Its
play-state grid sample is added by the play story.

### Username at sign-in *(human, 2026-10-25)*

Sign-in asks for a username and an email every time; neither the app nor
the form can know beforehand whether the email has an account. The first
username an account gets is kept: a later sign-in with a different one is
quietly ignored. Usernames aren't unique and follow today's builder-name
rules (not blank once trimmed, at most 80 characters). The browser
pre-fills the username it last sent successfully. The username replaces
the builder name, so the builder-name dialog before a first puzzle is
removed. This supersedes the "Username at sign-in" epic outlined in the
Design system EPIC, which won't be created.

**Old tokens are deleted last** *(human)*. The final story deletes every
pre-redesign token, `--font-display` and the old radii, and reports any
old token still in use with no replacement rather than inventing one.
`--font-body` (the one typeface) and `--grid-line-width` (the grid's
hairline) stay (S8).

## Carried observations

Seen during epic 13, outside its scope. Each is assigned to the story
whose screen it's on; the story either fixes it or says why not.

- **Sign-in:** the button sits right against the email line. (Sign-in.)
- **Delete confirmation buttons touch.** Resolved by removing the
  builder's Delete (Builder controls).
- **375px clipping:** a long puzzle title in the editor clips at the right
  edge, and play's "Puzzle options" button runs past the right edge.
  Deferred to epic 15 (responsive layout) *(human, 2026-10-25)*; no story
  here is asked to fix it.
- **Modal panel clips content taller than the viewport.** No current
  dialog is that tall. A story whose dialog would be fixes it; otherwise
  it stays open.
- **Modal close button has no color transition.** If a story gives it
  one, `e2e/modal-design.spec.ts`'s close-button focus read must first
  wait for transitions, as the other style readers do.
- **`Masthead.tsx` sets `home-link` only when its test id is
  `app-header`**, a caller-specific branch no story specified. Resolved
  by S8: `Header` passes the test id as a prop.
- **`src/lib/google-font.ts` and its test are unused since F2.** Resolved
  by S8: removed.

## Non-goals

- **No responsive or spacing work** (epic 15), including scaling cell
  letters and numbers.
- **No account change beyond the username** (S1). Sign-in stays a magic
  link; no passwords or account pages.
- **No grid-engine change.** `src/engine/**` is untouched.
- **No new puzzle, publishing or play behavior** beyond the named control
  moves (stepper, Build/Play's list filter), the new-puzzle dialog's
  generated default name (S3), S4's publishing changes (publishing
  needs every hint, and Unpublish, Clear all letters and the builder's
  Delete are removed) and S7's hint click in play, which selects its word.
- **No dark mode, no two-label toggle.** No focus rings, except S11's
  keyboard focus ring.
- **No new shared components** beyond what a screen needs (Row Heading,
  Puzzle Row, Hint Input, Player Hint, Prominent Hint, the hint skeleton).
  Epic 13's components aren't redesigned again here; a needed change to
  one is named in its story.

---

## Stories

Order as listed. Story files are `stories/14-S<n>-<slug>.md`. Each takes
exact values from the human where given and the mockups otherwise, and
lists the frozen tests it supersedes.

### S1 — Sign-in and username

Redesigns sign-in from the human's mockups: the "Build a puzzle. Or play
a puzzle. Log in to start." Title, username and email Inputs with
validation, the large "Send Sign-in Link" Button, and new sent and
failure messages. Adds the username per its Decision and removes the
builder-name dialog. Fixes the button sitting against the email line.
Touches `src/app/puzzles/actions.ts`, so it's a reviewed story on a
branch.

### S2 — Puzzle library

`/puzzles` with the Build/Play Radio, Row Heading (the size group's
heading) and Puzzle Row (`puzzle-row`, `puzzle-row-hover`, hover on
keyboard focus). Adds the library delete, the title markers and a fixed
crossword icon; drops the thumbnail and in-progress Reset from the library.
Build/Play splits the list client-side per its Decision.

### S3 — New-puzzle dialog

The new-puzzle modal (name Input with its label, the size Radio already
adopted in F6), laid out from the mockups, with "Name it!" and "And pick a
size!" `title-4` headings and a generated default name. (The display-name
dialog is removed by S1.)

### S9 — Modal entrance

Every dialog fades and grows slightly into place when it opens (0.97 to 1,
150ms ease-out), in the shared Modal; closing stays instant. Added at S3's
visual check and run after S3, before S4, so it is listed out of numeric
order.

### S4 — Builder controls

Replaces the stepper with numbered buttons ("3 Publish" included, with
its too-early and Publish dialogs), places the Preview toggle, restyles the
title and the enter-hints dialog, and adds the published state. Publishing
needs every hint and is final (no Unpublish). Removes Clear all letters
and the builder's Delete.

### S10 — Enter-hints dialog copy and Preview

The enter-hints dialog becomes "You sure?" with a one-sentence body and
"Yes, create hints" / "Keep building", and opening it turns Preview on,
which stays on unless the builder confirms. Added at S4's visual check and
run after S4, before S5, so it is listed out of numeric order.

### S11 — Keyboard focus ring

Keyboard focus on a button, a link, the Preview toggle or a Radio option
shows `outline: 2px solid #00f0ff`; mouse focus shows none. This
supersedes epic 13's "No focus rings". Added at S10's visual check and run
before S5, so it is listed out of numeric order.

### S5 — Build grid and hint skeleton

The build-phase grid colors (including selection and preview), its 526px
size, letters scaled with the cell, no '.' key, the Preview legend and the
hint skeleton beside the grid. Replaces the style guide's build grid sample.

### S6 — Hint phase

Hint Input and the hint-phase grid colors, locked and in EDIT GRID.
Replaces the style guide's hint-row and hint-phase grid samples.

### S7 — Play

Prominent Hint (the bar above the grid), Player Hint
with its selected background, the play grid colors and play's title, save
status, options and completion dialogs. Adds the style guide's play-state
grid sample.

### S12 — Letters and hints together

The hints phase loses EDIT GRID; letters stay editable beside the hints,
the shape stays locked, 1 is done, and Lock Grid Letters replaces Preview.
Added at S7's review and run after S7, before S8.

### S8 — Old-token cleanup

Deletes the old tokens and `--font-display`, retires the old radii,
removes `google-font.ts` and its test and the Masthead `home-link` branch
if still present. Reports each old token still in use without a
replacement. Retires frozen tests that only pin old tokens. Removes the
uncalled `unpublishPuzzle` (S4), so it's a reviewed story on a branch.
Keeps `--font-body` and `--grid-line-width`.

---

## Pending questions

None. The first draft's five questions were answered 2026-10-25 and are
recorded in Decisions and Carried observations.

Line heights, letter spacing and paddings are settled per story, as in
epic 13.
