# Story S10 — Rebus

Wherever letters can be typed, Escape opens a rebus entry on the cursor
cell: an enlarged, shadowed cell over the grid where several letters can
be typed. Enter or Escape places them all in the cell, and the cursor
advances. The Rebus control does the same without a keyboard: a text link
in the builder's toggle row and an outlined pill in play. A rebus's text
is as large as fits its cell.

**Status: approved and frozen** (drafted 2026-11-01; approved by the
human 2026-11-02 with both pending questions answered as proposed and one
addition, a rebus's minimum size, recorded in "A placed rebus's size" and
case 17-S10-12). Frozen acceptance must not change to fit the
implementation.

**Blast radius: small to medium.** A new pure helper in `src/lib/`, two
new components (the entry and the control), the editor's and play's key,
click and close handling, `PuzzleGrid` and `LetterCell` (the open entry
and a rebus's size) and one new shadow style in `globals.css`. No schema,
server action, storage or engine change, so no CODE-REVIEW risk path:
direct delivery on `main`.

## What the code does today

I inspected `src/lib/keyboard-intent.ts` and its test, `src/engine/cursor.ts`
(`place`, `deleteAt`), `PuzzleGridEditor.tsx` (keys, clicks, Preview's
`previewKey`, focus), `PlayPuzzle.tsx`, `PuzzleGrid.tsx`, `LetterCell.tsx`,
`CellNumber.tsx`, `BuilderSteps.tsx` (`ToggleRow`), `PreviewToggle.tsx`,
`Button.tsx`, `globals.css`, the frozen source tests
(`play-source.test.ts`, `old-tokens-source.test.ts`, `globals-css.test.ts`)
and every frozen browser test that presses Escape or Enter. I also read the
reference doc's rebus notes and the human's `rebus.png` and
`hint-step-controls.png`.

- **Only input is missing** (the reference doc's Open questions). A cell's
  letter is any string; storage, play's answers (opaque, `play.ts`) and
  rendering take it as it is. `place` puts any string in the cursor cell
  and advances one cell.
- **`keyToIntent`** maps letters, Backspace, Space and arrows. Its frozen
  unit test (P3-1) requires Escape, Enter and `1` to map to `null`.
- **Nothing in the grid is a text input.** Keys go to the focused grid
  region's `onKeyDown`, so a phone's on-screen keyboard never shows. A
  phone can't type in play today.
- **A placed rebus overflows its cell.** `LetterCell` draws every string
  at the letter size, on one line, centered (or low on a Sunday, 17-S7),
  so "HEART" runs into its neighbors and over the number.
- **The toggle row** (S8) is `justify-between`, with only the toggle in it.
  S8 left its right end for this story's link, 16px in (12px below a
  748px window).
- **There is no shadow style.** Frozen source tests forbid `shadow` in
  play's files and `box-shadow` in `PuzzleGrid.tsx` (14-S7).
- **The hints phase blocks Backspace** (Story H4): a lettered cell can
  only be overtyped, never emptied, since its geometry is frozen.
- **One frozen browser test presses Escape on the grid:** play's
  "unsupported keys, modifiers and composition do nothing" (P2) lists it
  as a key that does nothing. The other Escape presses close dialogs, which
  sit outside the grid.

## Decisions

### The human's direction *(EPIC; human, 2026-10-27 and 2026-10-31)*

- **Escape** opens rebus entry for the cursor cell, starting from its
  current letters. Typing builds the entry; **Escape or Enter** closes it
  and places the whole string in the cell.
- **While entering,** the cell enlarges by about a third (36px to 48px in
  `rebus.png`), centered on its cell and above its neighbors, white, with
  the drop shadow x 0, y 4, blur 4, spread 0, rgb(0 0 0 / 0.25). It
  returns to normal when entry closes.
- **Wherever letters can be typed:** the build phase (Preview included),
  the hints phase while letters are editable, and play.
- **The Rebus control** does what Escape does, for devices without a
  keyboard: a "Rebus" text link at the right of the builder's toggle row,
  and an outlined, pill-shaped "Rebus" button in play, at the top of the
  hints column, right of the Prominent Hint.
- **A rebus's letters shrink within the same letter area** (the EPIC's
  numbers decision).

### Opening

- **Escape** with the grid focused and a cursor cell opens the entry on
  that cell, unless letters can't be typed there: published, Lock Grid
  Letters on, play not ready or completed, or Preview's cursor hidden
  (17-S4). Then Escape does nothing, as today.
- **Escape anywhere else is unchanged:** in a hint input, the Hint Box, a
  dialog (which closes) or the title, it isn't a rebus key.
- The entry **starts from the cell's letters** (empty for an empty cell),
  with the caret at the end.
- **While it's open, the cursor and its word stay highlighted** as before,
  under the entry.

### The entry *(approved 2026-11-02)*

- **It's a real text box** ("Rebus entry"), focused when it opens, so a
  phone or tablet shows its keyboard when the Rebus control is tapped.
  This is what makes the control useful on a touch device. Typing single
  letters on a phone stays out of scope (Non-goals).
- **It keeps letters and digits, uppercase, at most 10** (the EPIC's
  proposal; the reference doc notes NYT rebuses can hold numbers). Other
  characters, Space included, are dropped as they're typed.
- **Inside it, keys edit the entry:** Backspace deletes a character and
  arrows move the caret. The grid's own keys do nothing until it closes.
- **Its text fits the box:** as large as the cell's letter size, smaller
  as it grows, never scrolling.

### Closing

- **Enter or Escape** closes it and places the whole string in the cell.
  The cursor then advances as after a single letter (`place`; in the hints
  phase and play under 17-S6's rule, in Preview over Preview's words as in
  17-S4). The grid has focus again, so typing goes on.
- **Leaving it** (a click on another cell or a Player Hint, Tab, a
  button) also places it *(approved)*, but **doesn't advance**: the click
  or the focus goes where the builder or player meant it to. Losing what
  was typed by clicking elsewhere would be the bigger surprise.
- **An empty entry clears the cell,** and the cursor stays (the EPIC's
  proposal). **In the hints phase it changes nothing** *(approved)*:
  that phase never empties a cell (H4), since the cell would become a hole
  in the published shape.
- **An entry equal to the cell's letters changes nothing** and saves
  nothing; Enter or Escape still advance.
- **Saving is as for a letter:** the builder's grid autosave, play's
  entries autosave and completion check, unchanged.

### The open cell's look *(human, measured from `rebus.png`)*

| | Value |
| --- | --- |
| Size | **4/3 of the cell** each way (36px to 48px in the mockup) |
| Position | centered on its cell, above its neighbors; the grid doesn't move |
| Fill | the grid's white: its mode's "on" style (`build-cell-on`, `preview-cell-on`, `hint-cell-on`, `play-cell-on`) |
| Shadow | **`--shadow-rebus-cell`**, a new shadow style: `0 4px 4px 0` black at 25% (`color-mix` on `--palette-black`, as the modal backdrop) |
| Border | none; the shadow sets it apart *(approved; the mockup shows none besides the shadow)* |
| Text | `cell-letter`, `primary`, centered; the cell's number is covered while open |

At the grid's edge the box overhangs the grid by a sixth of a cell, as
centered. The shadow is used only through its style, in the entry's own
component, so the frozen source tests' bans on `shadow` in play's files
and `box-shadow` in `PuzzleGrid.tsx` stand.

### A placed rebus's size *(EPIC)*

A cell's text is **as large as fits**: the letter size while it fits the
cell's width (a single letter, or "OW" on a 15×15, is unchanged), and
smaller beyond that, on one line, inside the cell and clear of its
number. On a Sunday, a shrunk rebus is centered in the letter area below
the number (from 17-S7's letter top to the cell's bottom). Other sizes
stay centered, as their letters are. The same holds in every mode, since
the grid draws letters one way.

**It never shrinks below a third of the letter size** *(human,
2026-11-02, after the NYT's "SHH" and "EGO/ID")*. A rebus too long to fit
at that size (10 characters on a 21×21) stays at it, on one line, centered
on the cell, and is cut off at the cell's edges, both ends alike, rather
than shrinking until it can't be read. Vertically it sits as a shrunk
rebus does, clear of the number.

### The builder's Rebus link *(human; values from S8's measurements)*

- **At the right end of the toggle row** (the grid's panel), in the build
  and hints phases: **16px** in from the panel's right edge, **12px**
  below a 748px window (S8's insets), centered on the row's line.
- **A text button**, "Rebus", in `text-label` (the toggle label's size),
  `link-muted` (the mockup's blue). Hover and keyboard focus show
  `button-hover`, as "Play it!" does. While an entry is open it shows
  `button-active` (as an on toggle's label) and is pressed
  (`aria-pressed`).
- **Click:** opens the entry on the cursor cell, as Escape. With an entry
  open, it closes it as Enter does. It doesn't take focus from the grid
  or the entry when clicked.
- **Inactive while Lock Grid Letters is on** *(approved, as the EPIC)*:
  disabled, at 50% opacity with a not-allowed cursor, as the Hint Box's
  disabled input and the hint arrows. Preview Hints doesn't affect it
  (S9's correction). **None when published:** the toggle row is empty
  then (S8).
- In Preview with no cell selected (17-S4's hidden cursor), a click does
  nothing.

### Play's Rebus pill *(human; approved 2026-11-02)*

- **Wide** (a 1430px window and up): in the hints column's top row, beside
  the Prominent Hint, at the column's left edge (where "Across" starts),
  centered on the Prominent Hint's height.
- **Narrow:** under the hint bar, at the grid's right edge, **12px** below
  it. Narrow play has no hints column, and the hint bar is where the
  player's attention is.
- **The pill:** 32px tall (Button's height), `rounded-pill`, a 1px
  `button-fill` border and `button-fill` text in `button-normal`, 20px
  side padding, no fill. Hover and keyboard focus show `button-hover`; an
  open entry fills it `button-active` with `inverse` text and presses it
  (`aria-pressed`).
- **Click:** as the builder's link. **Inactive** whenever play can't be
  typed in: starting, failed, checking, unavailable or completed (the
  same 50% opacity and not-allowed cursor).

### Not changed

`keyToIntent` and its frozen test (P3-1): Escape and Enter still map to
`null` there. Rebus keys have their own pure helper, `rebusIntent` in
`src/lib/rebus-entry.ts`, which the EPIC's "new keyboard intent in
`src/lib/`" describes. Also unchanged: the engine (`place` already takes
any string), play's answer matching, storage, the toggles, dialogs'
Escape, and the style guide (no sample; the EPIC's S10 line asks for
none).

## Non-goals

- Typing ordinary letters on a phone's keyboard (no text input outside
  the rebus entry). It's a separate change to play's input.
- Symbols beyond letters and digits, and rebus-specific answer matching
  (EPIC Non-goals).
- Widening the entry as the text grows, as some apps do; the box is a
  fixed 4/3 of the cell and its text shrinks.

## Acceptance

*Frozen 2026-11-02.* One new browser file, one new unit file and one amendment to
a frozen browser test. The new browser file runs at 1440×1000 unless a
case says otherwise.

### e2e/rebus.spec.ts (new)

1. **17-S10-1 build phase, Escape and Enter:** Escape opens a focused,
   empty entry on the cursor cell, which stays selected; typing "heart"
   shows "HEART" in the entry and nothing yet in the cell. Enter closes
   it: the cell shows "HEART", the next cell is untouched and selected,
   the grid has focus and the next letter types there. Saved and shown
   after a reload.
2. **17-S10-2 the entry's rules:** it starts from the cell's "A"; "b2-. x"
   gives "AB2X"; Backspace deletes; arrows don't move the grid's cursor;
   it stops at 10 characters. Escape closes and advances. Reopened and
   emptied, Enter clears the cell, the cursor stays, and the clear is
   saved.
3. **17-S10-3 leaving it:** a click on another cell places the entry
   without advancing (the next cell untouched) and selects the clicked
   cell. Tab places it too, and the grid loses focus.
4. **17-S10-4 the open cell's look** (15×15): 4/3 of the cell each way,
   centered on it, above the next cell, with the cell, its neighbor and
   the grid unmoved. White (`build-cell-on`), with `--shadow-rebus-cell`'s
   shadow, `0px 4px 4px 0px` black at 0.25 (paintless layers ignored).
   Ten characters fit without scrolling.
5. **17-S10-5 the builder's link:** a "Rebus" button, not pressed, in the
   toggle row, 16px from its right edge and centered on it, `link-muted`,
   the toggle label's size. A click opens the entry on the cursor cell,
   pressed; a second click closes it as Enter (placed, the next cell
   untouched and selected). At 375px: 12px in, centered, no horizontal
   overflow.
6. **17-S10-6 hints phase:** an entry starting "R" overtypes to "RUB" and
   advances; an emptied entry leaves "E" and the cursor in place; both
   saved as shown. Escape in a hint input opens nothing. Lock Grid
   Letters makes the link disabled, 50% opacity, not-allowed; off, it's
   enabled again. A published puzzle has no link.
7. **17-S10-7 Preview:** with Preview on, a rebus typed on a lettered cell
   ("C" to "CH") is placed and saved, the next cell untouched, and the
   cursor advances within Preview's word.
8. **17-S10-8 play, keyboard:** play opens on (0,0); Escape, "heart",
   Enter places "HEART", the cursor advances, the grid has focus and the
   entry is saved. An empty entry on an empty cell, closed with Enter,
   sends no save.
9. **17-S10-9 play's pill:** a "Rebus" button, not pressed, at the hints
   column's left edge, centered on the Prominent Hint, 32px tall, pill
   corners, a 1px solid `button-fill` border and text, no fill. A click
   opens the entry, pressed; a second click places "OW", advances, and
   saves only that cell. At 375px: one pill, at the grid's right edge,
   12px under the hint bar, no horizontal overflow, and it opens the
   entry.
10. **17-S10-10 a completed puzzle:** the pill is disabled, at 50% opacity
    and not-allowed, and Escape opens nothing.
11. **17-S10-11 a placed rebus's size** (15×15 and 21×21): "HEART" in a
    numbered cell is on one line, smaller than a single letter, inside
    the cell and clear of its number. On the 15×15, "OW" keeps the letter
    size.
12. **17-S10-12 a rebus too long to fit** (15×15 and 21×21): ten W's
    in a numbered cell are on one line at a third of a single
    letter's size (±0.5px), wider than the cell, centered on it (±1px),
    cut off by an element inside the cell (overflow hidden or clip), inside
    the cell vertically and below its number.

### src/lib/rebus-entry.test.ts (new)

- **17-S10-U1 `rebusIntent(key, isOpen)`:** closed, Escape is `open`;
  open, Enter and Escape are `close`; every other key, and Enter while
  closed, is `null`.
- **17-S10-U2 `rebusText`:** uppercase, letters and digits only, at most
  `REBUS_MAX_LENGTH` (10).
- **17-S10-U3 `closeRebus(grid, cursor, text, { advance, canClear })`:**
  places the string and advances as `place`, or without advancing; an
  empty entry clears where `canClear`, otherwise and on an empty cell
  returns the same grid; an entry equal to the cell's letters returns the
  same grid and still advances when asked; its input is unchanged.

### Amended frozen test

| File (story) | Case | Frozen | Amended |
| --- | --- | --- | --- |
| `e2e/play-entries.spec.ts` (P2) | "unsupported keys, modifiers and composition do nothing; real focus scopes typing and selection" | presses Delete, `.`, `1`, `,`, `/`, Enter and **Escape** and expects nothing to change | Escape removed from the list, with a comment pointing to 17-S10; the rest unchanged |

Escape opens an entry now, so it is no longer an unsupported key. With
it, the case's later `insertText('REBUS')` would type into the entry, and
Tab would then place it and send a save.

### Acceptance choices *(drafting)*

- The entry's box is `rebus-entry`; its text box is found by its name,
  "Rebus entry", so the box can be the input itself or wrap it.
- Each builder and play view renders one visible `rebus-control`. Play
  may render one per arrangement, and the tests read the visible one.
- A rebus's size is checked on its text (one line box, its rectangle
  against the cell's and the number's) and against a single letter's
  font size, not against fixed pixel values.
- The shadow is compared with what `var(--shadow-rebus-cell)` resolves
  to, and with the human's values. Layers that paint nothing (Tailwind's
  unused ring layers) are ignored.
- Not covered by the browser: a phone's on-screen keyboard appearing
  (Playwright can't show it; the human's visual check on a phone or
  tablet covers it), and hover looks.

### Discrimination (2026-11-01, observed)

- **Current `main` with the proposed tests:** all 11 browser cases fail
  (both sizes of 17-S10-11 included, 12 runs). The unit file fails to
  load without `rebus-entry.ts`. The amended P2 case passes on `main`, as
  Escape does nothing there.
- **Throwaway implementation** of these Decisions (reverted; patch outside
  the repo at `/tmp/s10/throwaway.patch`): the new file's 12 runs and
  the unit file's 14 cases pass.
  Its first run failed three cases. Two were test bugs, now fixed: the
  Preview case clicked the cursor cell (which turns it Down), and the
  shadow check counted Tailwind's paintless ring layers. One was a
  throwaway bug: closing by the control also fired the entry's blur,
  which placed the rebus again on the next cell. No case checked the
  next cell, so 17-S10-1, -3, -5, -7 and -9 now do.
- **Full suites with the throwaway** (after the fixes above):
  `npm run verify` exit 0 (Vitest 640/640) and the full
  `npm run test:e2e` exit 0 (909 passed), the amended P2 case included.
  No other frozen test needed amending.

### Correction (2026-11-02, approved by the human)

17-S10-12 first used "ABCDEFGHIJ", which at the minimum size (44.9px)
just fits the 15×15's 45.6px cell, so it couldn't show the cut-off there
and failed against a correct implementation. It now uses ten W's, wide
enough to overflow both grids; every assertion is unchanged. Corrected in
its own specification-only commit before implementation continued.

## Repo paths

Acceptance (immutable after freeze): `e2e/rebus.spec.ts` (new),
`src/lib/rebus-entry.test.ts` (new) and the amended
`e2e/play-entries.spec.ts`.

Runtime:

- `src/lib/rebus-entry.ts` (new): `rebusIntent`, `rebusText`,
  `REBUS_MAX_LENGTH`, `closeRebus`.
- `src/components/grid/RebusEntry.tsx` (new): the open entry and its
  shadow.
- `src/components/grid/RebusControl.tsx` (new): the link and the pill.
- `src/components/grid/PuzzleGrid.tsx`: the entry in the cursor's cell.
- `src/components/grid/LetterCell.tsx`: a rebus as large as fits.
- `src/components/grid/PuzzleGridEditor.tsx`: opening, closing and the
  link in the toggle row.
- `src/components/play/PlayPuzzle.tsx`: opening, closing and the pill.
- `src/app/globals.css`: `--shadow-rebus-cell`.
- This story, `../EPIC.md` (the S10 line and Decisions marked settled, at
  freeze) and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S10. Out of scope: typing on a phone outside the rebus entry,
`keyToIntent`, the engine, the toggles, play's layout beyond the pill,
and the style guide.

## Definition of done

- The human approves this specification, its acceptance, the amendment
  and the pending questions, recorded here and in the handoff. Freeze on
  `main` in a specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.
- The human's visual check at desktop sizes and on a phone or tablet
  (the pill opening the on-screen keyboard).

## Pending questions

None. Answered by the human, 2026-11-02:

1. **Play's pill:** as proposed. Wide, at the hints column's left edge,
   centered on the Prominent Hint; narrow, under the hint bar at the
   grid's right edge, 12px down; 32px tall, a 1px `button-fill` border and
   text, no fill.
2. **Leaving an open entry:** as proposed. A click elsewhere or Tab places
   what was typed, without advancing.

Added at approval *(human)*: a placed rebus shrinks no further than a
third of the letter size, then is centered and cut off at the cell's
edges, as the NYT's long rebuses look (17-S10-12). The `rebus.png`
mockup covers the open cell, and `hint-step-controls.png` the builder's
link. The human's own "CHEESE", typed while the drafting throwaway was
applied, showed the unshrunk overflow this story fixes.
