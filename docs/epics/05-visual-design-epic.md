# Epic: Visual design

The fifth epic, inserted ahead of the rest of publishing. The app currently
works but is hard to look at and harder to evaluate — the grid runs off
screen, buttons don't read as buttons, inputs have no visible edges, and
labels collide. That's not a cosmetic complaint: it interferes with being
able to test the app at all.

**This epic pauses epic 4.** Publishing's PB1a (empty cells become black)
has shipped. PB1b (the grid-phase preview toggle) is **absorbed into this
epic** as story D4 — preview rendering is exactly what the style guide
needs to show, and building it twice would be silly. PB2–PB5 resume after
this epic completes.

Design direction: the bright/playful direction from
`crossward-directions.html`, with the modifications recorded below.

---

## Conventions

**Tokens are the interface for design decisions.** Tailwind v4's `@theme`
block emits real CSS custom properties on `:root`, and generated utility
classes reference them with `var(...)` rather than inlining values. That
means editing a token in browser devtools live-updates every element using
it. This is the intended iteration loop: fiddle in devtools, decide, hand
the agent the token and its new value. Any value that can't be adjusted
that way is in the wrong place.

**No component hardcodes a colour, font, radius, or border width.** If a
value appears in a component file rather than `@theme`, that's a bug in
this epic's terms — it breaks the devtools loop.

**Layout stays untokenized**, per epic 2's convention. Structure is
ordinary utility classes; only the design values are tokens.

**Verification.** Playwright can check that a button has a non-transparent
background, a pointer cursor, and a visible border; it cannot check that
the design is good. Tests here assert *structural* properties — states are
distinguishable from each other, interactive things look interactive,
nothing overflows — and the aesthetic judgment happens by looking at the
style guide. Don't write tests that pin exact colour values; those are
expected to change and would just be friction.

---

## Non-goals

- **Play/solve UI, authentication, publishing controls.** Later epics.
- **Themes or dark mode.** One palette.
- **Animation beyond what's needed for legibility.**
- **Mobile-specific layouts.** Responsive sizing is in scope (D5); a
  distinct phone layout with an on-screen keyboard is not.
- **Pinning exact colour values in tests.** See Verification.

---

## Story Group D1 — Token vocabulary and style guide route

Expand `@theme` from P0's minimal set to a real vocabulary, roughly what
the mock uses: paper/ink at several weights, rule, accent, cell fills for
each state, panel tint, display and UI font families, radii, and a max
content width.

Add a `/style-guide` route rendering every component in every state, so
design decisions are visible and comparable in one place rather than
hunted through the app. It includes a **token panel**: each token name
with a swatch or sample, so the name to edit in devtools is readable off
the page.

Contents: headings and eyebrow labels; body, help, and caption text;
primary / quiet / disabled buttons, and two buttons side by side; inputs
focused and unfocused; links; list rows; hint rows in complete,
incomplete, and active states; a two-step confirmation mid-confirm; an
error message; a tooltip/popover; the stepper in each of its three states;
and a row of cells from each grid phase (D3 and D4 fill these in properly
once those land — D1 can stub them).

## Story Group D2 — Core controls

Apply the tokens to real controls throughout the app. Buttons read as
buttons; interactive elements get `cursor: pointer`; inputs have visible
borders and a distinct focus state; links are distinguishable from text;
headings read as headings.

Specific fixes: `Delete puzzle` and `Duplicate puzzle` currently run
together with no spacing; the puzzles list's "Puzzles" heading doesn't read
as a heading; there's no affordance indicating the puzzle title is
editable.

**Delete moves to an out-of-the-way part of the page**, separate from
renaming. The two are unrelated actions and shouldn't sit together.

## Story Group D3 — Build-phase grid

- **Cells are fixed squares.** Adding a letter never changes a cell's
  width or height.
- **Empty cells are grey; lettered cells are white.**
- **Symmetric counterparts of lettered cells render white too**, with no
  border or outline — a suggestion that this square wants a word.
  Render-only; nothing is stored.
- **Numbers appear only on real slot starts.** This is a logic change, not
  styling: numbering currently derives from the raw grid, so every cell
  looks like a word start. It should derive from the *effective* geometry
  — the grid as if empty cells were already black. `numberGrid(
  convertEmptyCellsToBlack(grid))`, reusing the function PB1a added. So
  SOMEWORDS across the top gets `1`; a WEDDING running down from its W
  gets `2`.
- **Every cell has a visible border**, so adjacent cells are always
  distinguishable regardless of fill.

## Story Group D4 — Preview and published grid (absorbs PB1b)

A toggle in grid phase rendering the grid as it will look once published:
empty cells black, lettered cells white, cell borders still visible
(the mock achieves this with a 1px gap over a dark background). Pure
rendering — no data change, nothing persisted.

**Unfilled symmetric counterparts render red in preview** — a warning that
these squares need words for the grid to be symmetric. Render-only: at the
actual hints transition they blacken like any other empty cell, exactly as
PB1a already does.

## Story Group D5 — Page layout

The grid and the hints must both be visible at once. The grid scales with
viewport but is deliberately constrained so it doesn't crowd out the hint
list — smaller than it could be if sized greedily.

The stepper (build the grid → write clues → publish) sits at the top and
its labels are clickable navigation, with a smaller "Continue to hints"
button kept alongside. Steps not yet available explain what's outstanding
rather than simply refusing — and per the publishing epic's governing
principle, publish is never actually blocked, so the explanation describes
what's unfinished rather than forbidding anything.

**Any explanation shown on hover needs a non-hover path**, since hover
doesn't exist on touch devices.

## Story Group D6 — New-puzzle creation dialog

Clicking "New puzzle" opens a dialog asking for a name and a size before
the puzzle exists. Sizes: mini (5×5), daily (15×15, default), Sunday
(21×21). This removes "Untitled Puzzle" at the source and delivers the
size options deferred as a non-goal in epic 3.

`createBlankPuzzle` currently hardcodes 15×15; it takes dimensions
instead. Nothing in the engine assumes 15, so no engine change is needed.

## Story Group D7 — Remove duplicate

Remove the duplicate-puzzle feature entirely: the Server Action, the
button, `duplicateTitle` and its tests, and `e2e/duplicate.spec.ts`.

It came from a proposal in epic 3 rather than from a real need, and it
isn't wanted. Deleting an unwanted feature is cheaper than carrying it
through every subsequent design and layout story.

---

## Suggested build order

D1 first — everything else styles against its tokens, and without the
style guide there's nowhere to evaluate a decision.

D7 next, because it's a deletion: doing it early means D2 and D5 don't
spend effort styling and laying out a button that's about to disappear.

Then D2, D3, D4, D5, D6. D3 before D4 since preview is a variant of the
same cell rendering. D6 last — it's the most self-contained, and it
benefits from the dialog and input styling that D1 and D2 establish.
