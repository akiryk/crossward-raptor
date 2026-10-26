# Story S10 — Enter-hints dialog copy and Preview

The enter-hints dialog gets shorter copy, and opening it shows the grid in
Preview, so the builder sees exactly what will lock before confirming.

**Status: approved and frozen** (2026-10-26). The human asked for both
changes while clicking through S4 and specified them the same day
(recorded in the [handoff](../HANDOFF.md)). On 2026-10-26 they authorized
this story, placed after S4 and before S5, then approved its Decisions and
acceptance ("I'm happy with S10"), including the 14-S4-3 amendment. It is
frozen on `main` in a specification-only commit.

**Blast radius: low.** Two client components (`EnterHintsDialog.tsx`,
`PuzzleGridEditor.tsx`) and one frozen case's amendment. No server, schema
or risk path, so this is direct delivery on `main` under CODE-REVIEW.

## Decisions

Inspected `EnterHintsDialog`, `PuzzleGridEditor` (the `isPreviewing` state,
`handleStep`, the enter-hints handlers and the grid's `mode`), `PuzzleGrid`'s
grid mode, `PreviewToggle`, `Modal`, and every frozen test that opens the
enter-hints dialog (`enter-hints`, `enter-hints-snapshot`, `modal`,
`modal-a11y`, `modal-design`, `builder-controls`) or reads Preview
(`preview`, `locked-grid`, `grid-focus`).

### The copy *(human)*

- **Title:** "You sure?"
- **Body:** "Creating hints will lock the black and white cells as they are
  now." This is the whole body. It replaces all three of today's
  paragraphs, including the advice to preview first, which Preview now
  does for the builder *(agent reading)*.
- **Buttons:** "Yes, create hints" (confirm, `normal`) / "Keep building"
  (cancel, `alternate`). The variants are unchanged from S4.

This supersedes S4's enter-hints copy ("Ready to create hints?", "Create
hints", "Creating hints locks your grid…").

### Preview turns on as the dialog opens *(human)*

- **Clicking 2 Create Hints in the build phase turns Preview on** as the
  dialog opens, if it's off. The grid and the toggle show Preview in the
  same render as the dialog's first appearance, not a moment later
  *(agent)*. If Preview is already on, it stays on.
- **It stays on after the dialog closes without confirming:** "Keep
  building", the ×, Escape or a backdrop click. The toggle still turns it
  off afterwards.
- **Preview is still not persisted** (D4): a reload starts with it off.

### Confirming *(agent)*

- **Confirming turns Preview off as the hints phase begins**, so the
  hints-phase grid is shown (`data-grid-mode` `hints`, then `hints-editing`
  in EDIT GRID), as today. The hints phase has no Preview toggle, so
  Preview left on there couldn't be turned off.
- **This also fixes an existing bug found while drafting:** on `main`,
  confirming with Preview already on leaves the hints-phase grid in
  Preview (`data-grid-mode` `preview`) until a reload. 14-S10-4's second
  case fails on `main` for this reason.
- **If entering the hints phase fails,** the dialog has already closed and
  the puzzle stays in the build phase, as today. Preview is off then too.
  The acceptance doesn't test this path.

### Not changed

- Focus, dismissal and the dialog's look (Modal, S9's entrance).
- The Preview toggle itself (F6) and its place (S4).
- What confirming does to the grid and the database.

## Retired and amended acceptance

Approving this story approves this amendment, which lands in the
specification-only freeze commit on `main`.

- **Amended:** `e2e/builder-controls.spec.ts`, 14-S4-3 "in the build
  phase, 2 opens the enter-hints dialog in the 'hints' wording". It
  checks the new title and confirm label. The body must start with
  "Creating hints will lock the black and white cells" (it started with
  "Creating hints locks your grid."). While the dialog is open the grid is
  in `preview` mode (it was `build`). The rest is unchanged: "Keep
  building", no "clue", and confirming enters the hints phase with the
  `hints` grid, also in the database.
- **Retired:** none.

No other frozen test breaks: the full suite passes with the drafting
throwaway (see [Observed](#observed-drafting-2026-10-26)).

## Acceptance *(frozen)*

One new file, `e2e/enter-hints-preview.spec.ts`, 10 browser cases at
1280×800, as the suite's signed-in builder, on a 3×3 build-phase puzzle
with CAT across the top. The empty centre cell is `empty` in build and
`black` in Preview.

1. **14-S10-1 the copy:** the title is "You sure?", the body is exactly
   "Creating hints will lock the black and white cells as they are now.",
   the buttons are "Yes, create hints" and "Keep building", and the dialog
   has no "clue".
2. **14-S10-2 Preview turns on as the dialog opens (2 cases):**
   - from off: a MutationObserver records the grid mode and the toggle's
     checkbox the moment the dialog enters the page: `preview` and
     checked. While it's open the grid is in Preview, the toggle is
     checked and the centre cell is black;
   - already on: the same at open, and still on after "Keep building".
3. **14-S10-3 Preview stays on after the dialog closes (5 cases):**
   - closed each of the four ways ("Keep building", ×, Escape, backdrop):
     no dialog, still the build phase, Preview on, and the toggle then
     turns it off;
   - reopened after a close, Preview is on at open and after a second
     close; a reload turns it off.
4. **14-S10-4 confirming (2 cases):**
   - from off: the hints phase starts with the `hints` grid and no toggle;
   - with Preview turned on before opening: the same, and 1 Edit the Grid
     shows `hints-editing`.

### Acceptance choices *(drafting)*

- 14-S10-2's observer reads the page in the same task as the dialog's
  insertion, so a Preview that turns on a moment later (an effect or a
  timer) fails it.
- 14-S10-2's "already on" case and 14-S10-4's first case are guards. They
  pass on `main` and catch a toggle that flips Preview instead of turning
  it on, or a confirm that leaves Preview on.

### Observed *(drafting, 2026-10-26)*

- **Against `main`:** 8 of the 10 fail (the copy, Preview at open and
  after each close, and confirming with Preview already on, where the grid
  stays `preview`). The two guards pass.
- **Against a throwaway** (the new copy in `EnterHintsDialog.tsx`;
  in `PuzzleGridEditor.tsx`, `setIsPreviewing(true)` beside opening the
  dialog and `setIsPreviewing(false)` on confirm): all 10 pass. It was
  kept as a patch outside the repo and reverted, so no runtime file is
  changed.
- **A wrong variant,** Preview turned on by an effect and a zero-delay
  timer after the dialog opens, fails 14-S10-2 "from off" only.
- **Full `npm run test:e2e` with the throwaway and the 14-S4-3
  amendment:** exit 0, 559 passed (549 before, plus these 10).
- `npm run verify` exits 0 on the drafting tree with the throwaway (608
  Vitest tests).

## Repo paths

Acceptance (immutable after freeze): `e2e/enter-hints-preview.spec.ts` and
the 14-S4-3 amendment in `e2e/builder-controls.spec.ts`.

Runtime:

- `src/components/grid/EnterHintsDialog.tsx`: the copy.
- `src/components/grid/PuzzleGridEditor.tsx`: Preview on at open, off on
  confirm.
- This story, `../EPIC.md` (the amendment) and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S10. Out of scope:

- the dialog's look, focus or dismissal;
- the Preview toggle's look or place;
- the build-phase and Preview grid colors (S5);
- persisting Preview;
- the failed enter-hints path's handling, beyond Preview being off.

## Definition of done

- The human approves this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit
  before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- The human's visual check of the dialog and Preview.
- Delivered on `main`, with the handoff updated with observed results.
