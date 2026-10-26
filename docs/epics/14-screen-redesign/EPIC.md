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
palette variables; no doubled names; Inter only; no focus rings; 10px
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
(the username at sign-in, the stepper's removal, delete in a dialog,
Build/Play, the new-puzzle dialog's generated default name) is named in its
story.

**No stepper** *(human)*. F3's numbered buttons ("1 Edit the Grid /
2 Create Hints") replace it. The `Stepper` component, `src/lib/stepper.ts`
and the `sg-stepper` sample are removed, retiring their expectations
(including `e2e/style-guide.spec.ts`'s) through the builder story's freeze
commit.

**Publish is a third numbered button** *(human, 2026-10-25)*. "3 Publish"
sits after "1 Edit the Grid / 2 Create Hints" and reveals the readiness
findings, visibility and publish/unpublish controls, as the stepper's
Publish step does today.

**Build/Play on `/puzzles`** *(human, 2026-10-25)*. Build lists your own
puzzles, in any phase, to edit. Play lists every published puzzle you can
see, your own included, to solve. The choice is remembered per browser in
`localStorage`, with Build as the default when nothing is stored. No schema
change; `listPuzzles` stops returning other builders' unpublished puzzles
and adds each builder's username (S2).

**Delete moves into a dialog** *(carried from epic 13)*. The builder's
inline delete confirmation becomes a Modal, which also ends its touching
buttons.

**Hint skeleton** *(human)*. Beside the grid during the build phase, a
placeholder per hint: an 18×18px dot in `fill-muted`, a 12px gap, then a
1px `line-muted` hairline.

**Hint Input** *(human)*. Builders, hint phase: the cell's number in
`title-4` `primary`; an input (the hairline, built on F5's TextInput)
whose text is `body-normal` `primary`; the slot's word in `label` `muted`,
right-aligned below the line, letter-spaced, turning `primary` while the
input has focus (F5's description, confirmed by the human 2026-10-25).

**Prominent Hint** *(human, 2026-10-25)*. Play: an NYT-style bar directly
above the grid showing the selected word's number and hint. Its exact
style comes from the human when S7 is drafted, the mockups otherwise.

**Player Hint** *(human)*. Play: the number in `title-4` `primary`, the hint
in `body-normal` `primary`. While a word (complete or incomplete) is
selected in the grid, its hint has a `hint-cell-selected` (`blue-medium`)
background.

**Grid colors per phase** *(human)*:

- **Build:** `build-cell-*` for on and off cells, the selected cell, the
  selected word's on cells (lettered or symmetric) and its off cells;
  border `build-cell-border` (gray-400). Preview keeps using the
  `preview-cell-*` styles.
- **Hint phase, locked:** on cells `play-cell-on` (white), off cells
  `play-cell-off`, border `play-cell-border` (gray-500).
- **Hint phase, EDIT GRID:** the locked colors, with the on cells
  editable; the selected cell is `build-cell-selected-cell` and the
  selected word's cells `build-cell-selected-row-on` (yellow-medium).
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

## Carried observations

Seen during epic 13, outside its scope. Each is assigned to the story
whose screen it's on; the story either fixes it or says why not.

- **Sign-in:** the button sits right against the email line. (Sign-in.)
- **Delete confirmation buttons touch.** Resolved by the delete dialog.
  (Builder controls.)
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
  `app-header`**, a caller-specific branch no story specified. (Old-token
  cleanup, or the first story touching the Masthead.)
- **`src/lib/google-font.ts` and its test are unused since F2.** Removed
  by the old-token cleanup.

## Non-goals

- **No responsive or spacing work** (epic 15), including scaling cell
  letters and numbers.
- **No account change beyond the username** (S1). Sign-in stays a magic
  link; no passwords or account pages.
- **No grid-engine change.** `src/engine/**` is untouched.
- **No new puzzle, publishing or play behavior** beyond the named control
  moves (stepper, delete dialog, Build/Play's list filter) and the
  new-puzzle dialog's generated default name (S3).
- **No dark mode, no focus rings, no two-label toggle.**
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

### S4 — Builder controls

Removes the stepper for numbered buttons ("3 Publish" included), places
the Preview toggle, Edit grid and clear letters, moves delete into a
dialog, and restyles the title and the enter-hints dialog.

### S5 — Build grid and hint skeleton

The build-phase grid colors (including selection and preview) and the hint
skeleton beside the grid. Replaces the style guide's build grid sample.

### S6 — Hint phase

Hint Input and the hint-phase grid colors, locked and in EDIT GRID.
Replaces the style guide's hint-row and hint-phase grid samples.

### S7 — Play

Prominent Hint (the bar above the grid), Player Hint
with its selected background, the play grid colors and play's title, save
status, options and completion dialogs. Adds the style guide's play-state
grid sample.

### S8 — Old-token cleanup

Deletes the old tokens and `--font-display`, retires the old radii,
removes `google-font.ts` and its test and the Masthead `home-link` branch
if still present. Reports each old token still in use without a
replacement. Retires frozen tests that only pin old tokens.

---

## Pending questions

None. The first draft's five questions were answered 2026-10-25 and are
recorded in Decisions and Carried observations.

Line heights, letter spacing and paddings are settled per story, as in
epic 13.
