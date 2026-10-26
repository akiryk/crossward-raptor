# Epic: Design system

**Status: approved (2026-10-24).** The human approved this epic and its
proposals on 2026-10-24, with the changes recorded below. F1 to F7 are
done (2026-10-24). **Closed (2026-10-24)** after an independent closeout
audit with no blockers ([record](HISTORY.md#closeout-audit-2026-10-24)).

The user has redesigned the app's visual design and UX in Figma. This epic
lays the foundation: the new color palette, a single typeface with named
text styles, and the shared components every redesigned screen is built
from. It deliberately changes as little of the visible app as it can;
applying the new design to each screen is the next epic's work.

---

## The redesign programme

Four epics, in this order. Only this one exists yet.

1. **13 — Design system (this epic).** Tokens, typography, shared components.
2. **14 — Screen redesign** (not yet created). Sign-in, `/puzzles` (Build/Play
   radio choice, Row Heading, Puzzle Row), the new-puzzle modal, the builder
   (numbered buttons, Preview toggle, hint skeleton, Hint Input), play
   (Prominent Hint, Player Hint) and Grid Cell colors per phase and
   selection state. Its last story deletes the old tokens and reports any
   still in use without a replacement. The human's details, given
   2026-10-24 for its drafting:
   - **No stepper.** The human removed it; F3's numbered buttons ("1 Edit
     the Grid / 2 Create Hints") replace it. Epic 14 removes the old
     `sg-stepper` sample, retiring its expectation in
     `e2e/style-guide.spec.ts` through a story's freeze commit.
   - **Hint skeleton** (beside the grid during the build phase, a
     placeholder): an 18×18px dot in `fill-muted`, then a 12px gap, then a
     1px `line-muted` hairline.
   - **Hint Input** (builders, hint phase): the cell's number in `title-4`
     `primary`; an input (the hairline) whose text is `body-normal`
     `primary`; the slot's word in `label` `muted`, right-aligned below
     the line.
   - **Player Hint** (play): the number in `title-4` `primary` and the hint
     in `body-normal` `primary`. While a word (complete or incomplete) is
     selected in the grid, its hint has a `blue-medium` background.
   - **Build grid:** the `build-cell-*` styles for the selected cell, the
     selected word's on cells (lettered or symmetric) and its off cells;
     the border is `build-cell-border` (gray-400).
   - **Hint-phase grid, locked:** on cells white (`play-cell-on`), border
     `play-cell-border` (gray-500).
   - **Hint-phase grid, EDIT GRID:** the same colors as locked; the on
     cells are editable, the selected cell is `build-cell-selected-cell`
     and the selected word's cells `build-cell-selected-row-on`
     (yellow-medium).
   - The style guide's old hint-row and grid samples are replaced by these.
     A play-state grid sample doesn't exist yet and comes later.
   - **To settle in drafting:** F5 describes the hint answer below the line
     as letter-spaced, `muted` turning `primary` on focus; the Hint Input
     detail above says `label` `muted`, with no letter spacing or focus
     change.

   Carried from epic 13 (seen during its stories, not its scope):
   - At 375px a long puzzle title in the editor clips at the right edge,
     and play's "Puzzle options" button runs past the right edge (may be
     epic 15's).
   - The sign-in button sits right against the email line.
   - The builder's delete confirmation buttons touch (no gap); epic 14
     moves delete into a dialog.
   - The modal panel clips content taller than the viewport (no current
     dialog is that tall).
   - The modal close button has no color transition. If it gains one,
     `e2e/modal-design.spec.ts`'s close-button focus read must first wait
     for transitions, as the other style readers do.
   - `Masthead.tsx` sets `home-link` only when its test id is
     `app-header`, a caller-specific branch no story specified.
   - `src/lib/google-font.ts` and its test are unused since F2; the
     old-token cleanup story can remove them.
3. **15 — Responsive layout and spacing** (not yet created). Media and
   container queries: keep the grid at full size while the hints re-flow,
   then move hints below, and only then shrink the grid. Cell letters scale
   with the cell; cell numbers keep a readable minimum. Spacing refinement.
4. **Username at sign-in** (not yet created). Sign-in asks for username and
   email; a user's first username wins and later sign-ins with another
   username don't change it. Touches auth and the database, so it is kept
   out of the visual epics. Needs a grilling session before drafting.

The Figma mockups (desktop) are accurate for layout, colors, sizes, fonts,
shapes and stroke widths, but are not fully filled in and are not canonical.
The user supplies exact values per story.

## Decisions

Confirmed with the user on 2026-10-23 and approved with the epic on
2026-10-24.

**Start fresh; don't map old tokens to new ones.** The new tokens are added
alongside the old. Each redesigned use switches to the new tokens; old tokens
are deleted only at the end of epic 14, which reports any old token still in
use with no replacement.

**Two layers: color variables and color styles.** Variables are the raw
palette; styles are named by use and reference a variable. Components use
styles. Variables are plain CSS custom properties that generate no
Tailwind utilities, so `gray-200` etc. can't collide with Tailwind's built-in
palette or be used directly by components; styles live in `@theme` as
`--color-<style>: var(<variable>)`. Both remain editable live in devtools,
keeping the iteration loop from epic 05.

**No doubled names.** Where a style's prefix would repeat the Tailwind
utility (`text-text-primary`), the prefix is dropped from the token name.
The same color then serves text, background and border utilities.

### Color variables

| Variable | Hex |
| --- | --- |
| white | FFFFFF |
| black | 000000 |
| gray-200 | DDE0E6 |
| gray-400 | BABCBE |
| gray-500 | 8B909A |
| gray-600 | 757575 |
| gray-700 | 14151B |
| interactive-light | 56B3E5 |
| interactive-medium | 2191CD |
| interactive-dark | 005B8C |
| interactive-faint | F5F7FA |
| interactive-faint-hover | EBEFF7 |
| yellow-bright | FCFF4D |
| yellow-medium | FEFFB0 |
| yellow-dull | E6E6D1 |
| cell-warning | CEB55A |
| cell-error | FF251A |
| text-error | E2655F |
| blue-bright | 4BC0FF |
| blue-medium | CFEEFF |

### Color styles

| Figma style | Token name | Variable | Example utility |
| --- | --- | --- | --- |
| build-cell-on | build-cell-on | white | `bg-build-cell-on` |
| build-cell-off | build-cell-off | gray-200 | |
| build-cell-border | build-cell-border | gray-400 | |
| build-cell-selected-cell | build-cell-selected-cell | yellow-bright | |
| build-cell-selected-row-on | build-cell-selected-row-on | yellow-medium | |
| build-cell-selected-row-off | build-cell-selected-row-off | yellow-dull | |
| preview-cell-on | preview-cell-on | white | |
| preview-cell-off | preview-cell-off | gray-700 | |
| preview-cell-warning | preview-cell-warning | cell-warning | |
| preview-cell-error | preview-cell-error | cell-error | |
| play-cell-on | play-cell-on | white | |
| play-cell-off | play-cell-off | gray-700 | |
| play-cell-border | play-cell-border | gray-500 | |
| play-cell-selected-cell | play-cell-selected-cell | yellow-bright | |
| play-cell-selected-row | play-cell-selected-row | blue-medium | |
| hint-cell-selected | hint-cell-selected | blue-medium | |
| text-primary | primary | black | `text-primary` |
| text-muted | muted | gray-500 | `text-muted` |
| text-link-muted | link-muted | interactive-light | `text-link-muted` |
| text-highlight | highlight | blue-bright | `text-highlight` |
| text-error | error | text-error | `text-error`, `border-error` |
| text-gray | subtle | gray-600 | `text-subtle` |
| *(new)* | inverse | white | `text-inverse` |
| line-muted | line-muted | gray-200 | `border-line-muted` |
| line-highlight | line-highlight | blue-bright | `border-line-highlight` |
| *(new)* | line-dark | gray-600 | `border-line-dark` |
| fill-muted | fill-muted | gray-200 | `bg-fill-muted` |
| button-fill | button-fill | interactive-light | `bg-button-fill` |
| button-hover | button-hover | interactive-medium | |
| button-active | button-active | interactive-dark | |
| *(new)* | button-alternate-border | gray-500 | `border-button-alternate-border` |
| *(new)* | button-alternate-hover | gray-500 | `bg-button-alternate-hover` |
| *(new)* | puzzle-row | interactive-faint | `bg-puzzle-row` |
| *(new)* | puzzle-row-hover | interactive-faint-hover | |
| *(new)* | modal-background | white | `bg-modal-background`, `border-modal-background` |
| modal-title-background | modal-title-background | yellow-bright | |
| *(new)* | logo | gray-400 | `stroke-logo`, `fill-logo` |
| *(new)* | logo-cell | white | `fill-logo-cell` |
| *(new)* | masthead | white | `bg-masthead` |
| *(new)* | modal-backdrop | black at 40% opacity | `bg-modal-backdrop` |

Phase vocabulary: **build** is grid construction, **preview** is the build
phase's preview toggle, **hint** is hint-making (a whole selected *word*, never
a single selected cell), **play** is solving.

**One toggle only: Preview.** The existing Preview toggle keeps its
behavior and gets the new colors and type: pill and knob outline are
`button-active` when on and `button-fill` when off; the knob is white; the
label is `link-muted` when off and `button-active` when on (story F6's
correction). There is no two-label toggle. **Build/Play on
`/puzzles` is a radio choice** (adopted in epic 14), which needs a new Radio
component; the new-puzzle size picker uses it too. A selected Build/Play
option's label is `button-active`, an unselected one's `link-muted`.

**No focus rings.** Inputs show keyboard focus through the underline color
change; the grid shows it through the cursor highlight. Buttons, toggles,
puzzle rows and radio options show their hover appearance on keyboard focus
(`:focus-visible`) only, so mouse use is unaffected. *(Superseded in
part by epic 14's [S11](../14-screen-redesign/stories/14-S11-focus-ring.md),
which adds a keyboard focus ring.)*

### Typography

**Inter is the only typeface.** Space Grotesk is removed. Two weights:
regular (400) and semi-bold (600).

Text styles become Tailwind `--text-*` tokens carrying size and weight
and line height, applying the no-doubled-names rule. **Line heights and
letter spacing start as implementer-chosen sensible defaults**; the user
tunes them once the screens come together, and some are settled within
individual stories. The old 12px `--text-label` is **replaced now** by the
14px `label`, so existing labels grow.

| Figma style | Token name | Weight | Size (px) |
| --- | --- | --- | --- |
| label | label | regular | 14 |
| title-1 | title-1 | semi-bold | 44 |
| title-2 | title-2 | semi-bold | 32 |
| title-3 | title-3 | semi-bold | 18 |
| title-4 | title-4 | semi-bold | 14 |
| button-text-large | button-large | semi-bold | 18 |
| button-text-normal | button-normal | semi-bold | 14 |
| body-text-large | body-large | regular | 18 |
| body-text-normal | body-normal | regular | 14 |
| body-text-small | body-small | regular | 12 |
| hint-number | hint-number | semi-bold | 14 |
| cell-letter | cell-letter | regular, uppercase | 16 |
| cell-number | cell-number | regular | 10 |

`cell-letter` and `cell-number` are the desktop sizes; epic 15 makes the
letter scale with the cell and gives the number a readable minimum.

### Components and conventions

Epic 05's conventions still hold: no component hardcodes a color, font,
radius or border width; layout stays untokenized; tests assert structural
properties (states differ, interactive things look interactive) rather than
judging the design. **Rounded corners are 10px; strokes are 1px.** Buttons are the exception:
they have pill ends (story F3). The modal's 2px white border (story F4)
and the Radio's 2px ring (story F6) are the stroke exceptions. Paddings
and other sizes are set per story, defaulting to the mockups. Buttons, the
Preview toggle, Radio and links change color over a 150ms transition
(story F6's correction).

**The style guide becomes a plain catalog.** The live token editor on
`/style-guide` is removed; the page shows the new tokens, text styles and
components. Live tuning still works through devtools on the CSS variables.

**Logo:** the boxed-letters wordmark reads CROSSWORD on purpose.

**Contrast accepted.** White on `button-fill` (about 2.3:1) and `muted` text
on white (about 3.2:1) are below WCAG AA for normal-size text; the user
accepted this on 2026-10-24.

Components that already exist (`Button`, `Modal`, `TextInput`, the Preview
toggle) are redesigned in place, so every use changes together; new
components (Radio, Title, Logo, Masthead) are built here. The new-puzzle
size picker adopted Radio in F6 and the Masthead replaced the header on
every page in F7; the rest are adopted screen by screen in epic 14.

**Retiring superseded acceptance.** Earlier epics' frozen browser
tests pin the old look (for example `e2e/style-guide.spec.ts` and
`e2e/typography.spec.ts` assert old tokens). A redesign
story names each frozen test it supersedes and the replacement behavior.
Approving the story approves that retirement, which lands in the story's
specification-only freeze commit on `main`, never in the implementation
diff. This is a deliberate scope change, not a correction of a defective
test.

## Non-goals

- **No screen redesigns.** Screens adopt the new design in epic 14; here only
  the shared components and the style guide change visibly, plus whatever
  changes with the font swap and in-place component redesigns.
- **No responsive or spacing work** (epic 15).
- **No account or sign-in behavior change** (the username epic).
- **No dark mode.**
- **No focus rings** (see Decisions; superseded in part by epic 14's S11).
- **No two-label toggle**; Build/Play is a radio choice.
- **No deletion of old tokens** (epic 14's last story).

---

## Stories

Order as listed. Each story's specification takes exact values from the
user where given and the mockups otherwise.

### F1 — Color tokens

Add the color variables and styles above alongside the old tokens. No visible
change outside the style guide, which becomes the plain catalog and shows
the new palette; the live token editor and its superseded acceptance are
retired.

### F2 — Typography

Remove Space Grotesk; load Inter at 400 and 600. Add the text-style tokens
with default line heights. Old `--font-display` uses render in Inter until
epic 14 removes them. `label` replaces the old 12px `--text-label`.

### F3 — Button

Normal, numbered, large and alternate, each with normal, hover and selected
states. Hover appearance also on keyboard focus.

### F4 — Modal

Header (`modal-title-background` with the title), content and a footer of
buttons, over the `modal-backdrop`. Keeps the existing modal's accessibility
behavior.

### F5 — Input

Regular and large; with or without placeholder and label; underline changes
color on focus and shows `error` with a message on error.

### F6 — Preview toggle and Radio

Restyle the existing Preview toggle with the new tokens, keeping its
behavior. Build a Radio component for one-of-several choices (Build/Play,
puzzle size), styled from the mockups.

### F7 — Title, Logo and Masthead

Title takes any text color style. Logo is the boxed-letters wordmark.
Masthead holds the logo and, when signed in, sign-out.

---

## Pending questions

None at epic level. Line heights, letter spacing (including the uppercase,
letter-spaced answer under each builder hint) and component paddings are
settled per story.
