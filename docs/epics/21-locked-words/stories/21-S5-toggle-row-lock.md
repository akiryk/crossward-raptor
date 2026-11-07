# Story S5 — Lock Word in the toggle row

When the grid has shrunk below its full width, a "Lock Word" / "Unlock
Word" text button beside Rebus replaces the button beside the word.

**Status: approved and frozen** by the orchestrator under the human's
delegation (2026-11-06). Depends on S2.

**Blast radius: small, expected off the risk paths.**
`src/components/grid/`. Direct delivery to `main`.

## What the code does today

The toggle row (`ToggleRow`, `BuilderSteps.tsx`) holds Preview at the
left and Rebus (`RebusControl`, `text-label`, `link-muted`) at the right
end. The grid is at most 700px wide and shrinks with a narrow window.

## Decisions

From the human (2026-11-06, EPIC "Small screens"):

- **When:** whenever the grid is narrower than its full 700px. At full
  width, S2's button beside the word is used instead, never both.
- **The button:** in the toggle row, left of Rebus with 20px between
  them, in Rebus's text style. It reads **"Lock Word"** or **"Unlock
  Word"** for the word under the cursor.
- **Enabled (blue, like Rebus)** as soon as the cursor is in a lockable
  or locked word, with no 1-second wait. Otherwise it's muted gray,
  disabled, and reads "Lock Word".
- **The outline** still follows S2's rule (1 second for an unlocked
  word, always for a locked one), as do the ticks and gray letters.
- **A tap** toggles the lock and doesn't take focus from the grid (like
  Rebus). There's no tooltip.
- **Preview on:** hidden. **Hints phase:** absent.

### Delegated decisions

Proposed by the drafting agent, for the human's visual check:

- **"Muted gray"** is the `subtle` text colour (gray-600, #757575), as
  Reset Grid uses, at full strength: no extra disabled dimming (Rebus's
  `opacity-50` isn't used here).
- **"Shrunk"** is measured from the grid's rendered width (S2's
  `isGridFullWidth`), not a window breakpoint. Below 748px the page has
  8px of padding a side, so the grid is the full 700px from a 716px
  window and 699px at 715px.
- **At 375px the row fits** (measured on `main` with a stand-in "Unlock
  Word" label): Preview, the button and Rebus fit one line of the 40px
  row with about 88px to spare, and nothing overflows.
- **Rebus's style throughout:** same `text-label` type; blue is Rebus's
  `link-muted`; on hover, enabled, Rebus's `button-hover`.
- **Grid focus:** with focus neither in the grid nor on the button, no
  word is selected (the highlight goes), so the button is disabled, gray
  and reads "Lock Word", as with no word. A click or tap doesn't take
  focus, so it stays enabled through its own use.
- **Keyboard** (the orchestrator, for the EPIC's "Mouse, keyboard and
  touch all work"): the button is a Tab stop. Focused, it counts as the
  grid's focus, as S2's button does: the cursor's word stays highlighted
  and its target, and it stays enabled. Enter or Space toggles it, and it
  keeps focus in its new state. The row comes before the grid in the
  page, with Rebus between, so Shift+Tab from the grid reaches Rebus,
  then the button. Passing through Rebus (focus outside both) briefly
  drops the highlight, by the rule above. Keyboard focus shows as an
  underline, since the color stays blue while focused.
- **Saved** as S2's lock is (the same toggle).
- **Hooks:** `data-testid="lock-word-control"`, a `<button>` in the
  toggle row named by its text. Disabled is `aria-disabled="true"` with
  the click ignored, not the native `disabled` attribute (corrected
  2026-11-06, see below): a natively disabled button is no Tab stop, and
  while Shift+Tab passes through Rebus no word is selected, so the
  keyboard path above couldn't reach it. With Preview on it isn't
  visible; in the hints phase it isn't rendered.

## Non-goals

- Changing Preview's or Rebus's look or place.
- A tooltip here.

## Acceptance (frozen)

The tests fix these names and hooks (delegated details): the button is
`data-testid="lock-word-control"`, S2's button is found by its name
("Lock word" / "Unlock word"), the outline and ticks by S2's hooks.
Widths: 1440px (wide), 716px (the grid at exactly 700px), 715px (699px,
just below full) and 375px. "At once" is within 300ms.

### `e2e/lock-word-toggle-row.spec.ts` (new)

TANGENT across row 3 and AT (2 letters) across row 8 of a daily.

1. **21-S5-1 which one:** at 1440px and at 716px (grid 700px), S2's
   button after a second and no toggle-row button. At 715px and 375px
   (grid shrunk), the toggle-row button and never S2's, even after 1.5s.
   At 375px it's in the toggle row, 20px left of Rebus and centered on
   it, in Rebus's type; Rebus and Preview stay 12px in from the row's
   ends. Resizing a locked word's page from 1440px to 715px and back
   swaps them, never both.
2. **21-S5-2 states (375px):** on opening, an empty cell, and a 2-letter
   run (even after 1.5s): disabled, gray-600 at full opacity, "Lock
   Word". In TANGENT: enabled at once, `link-muted` blue, "Lock Word",
   while the outline waits a second (none at 500ms, around the word and
   its end cells by 1.5s). Leaving: disabled at once. A locked word:
   "Unlock Word" at once, its outline always. The grid losing focus:
   disabled. Hovered, enabled: `button-hover`.
3. **21-S5-3 toggling:** a click locks (gray letters, the outline, two
   ticks, saved), the grid keeps focus and still takes arrow keys, S2's
   button never shows, and a 1.5s hover shows no tooltip. Clicking again
   unlocks; once left, no outline or ticks. The same with taps
   (`hasTouch`).
4. **21-S5-4 Preview and hints:** with Preview on, not visible (Rebus
   still is), and back as "Unlock Word" with Preview off. In the hints
   phase, absent.
5. **21-S5-5 no overflow (375px):** with "Unlock Word" showing, Preview,
   the button and Rebus sit in order on one line of the 40px row; the
   button's text, the row and the page don't overflow.
6. **21-S5-6 keyboard (375px):** in TANGENT, Shift+Tab reaches Rebus,
   then the button, which stays enabled with the cursor still in the
   word. Enter locks (gray letters, two ticks), Space unlocks, and the
   button keeps focus throughout.

### Discrimination (2026-11-06, observed on `main` at a976117)

After `npm run pretest:e2e`, `npx playwright test
e2e/lock-word-toggle-row.spec.ts`: 14 failed, 4 passed.

- Fail: every 375px and 715px test (21-S5-1 375px, 715px and resizing;
  all of 21-S5-2, 21-S5-3 click and tap, 21-S5-4 Preview, 21-S5-5,
  21-S5-6): no `lock-word-control` exists. The resizing test passes its
  1440px part first.
- Pass, as guards: 21-S5-1 at 1440px and at 716px (S2's button at the
  full width, no toggle-row button), and 21-S5-4 hints phase (absent).
  Within failing tests, the "S2's button never shows narrow" checks
  already hold on `main` and guard against showing both.
- 21-S5-6's focus order, checked with a throwaway test on `main`:
  Shift+Tab from the grid at 375px focuses Rebus, then Preview's input,
  so the button placed between them is the second stop.

### Correction (2026-11-06)

The implementer found 4 frozen tests contradicting the story's hover
rule. Playwright's `click()` leaves the pointer on the button, which
then shows Rebus's hover color (as 21-S5-2's hover test requires), but
`lockTangentInRow` and 21-S5-3's second click then expected the resting
`link-muted` blue. The correction moves the pointer off
(`page.mouse.move(0, 0)`) after those two clicks; no assertion changed.
It was independently reviewed before its own spec-only commit (STORY §3,
under the delegation). The `aria-disabled` hook above is the same
correction's story-text change (the spec's header comment says the
same); the tests' `toBeDisabled`/`toBeEnabled` already accept it. The
correction also records one new detail: keyboard focus shows as an
underline, since 21-S5-6 expects the blue to stay while focused.
Reviewed independently 2026-11-06: approved, no blockers (the frozen
original failed 4 of 18 on the hover color; the corrected file passed
18 of 18 against the implementation).

## Repo paths

Acceptance: the file above. Runtime:
`src/components/grid/PuzzleGridEditor.tsx`, a new small control (or a
`RebusControl` sibling) in `src/components/grid/`. Docs: this story,
`../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
