# Visual polish (round 2) — Handoff

Not an epic in the usual sense: no epic doc, no story docs, no per-item
acceptance-test baselines. This is a punchlist worked issue-by-issue on
branch `visual-polish-02` (the second time this kind of pass has happened —
the first landed as epic 05, `docs/epics/05-visual-design-epic.md`). Each
item below was a short prompt from the builder — a color, a layout
complaint, a control to remove — not a written spec. This document exists
so the punchlist's cumulative effect is legible in one place, and so
`npm run test:e2e`'s pass count can be trusted as a real gate rather than
"whatever happened to be checked most recently."

Repo: `crossward-raptor`. Branch `visual-polish-02`, cut from `main` at
`f03daf1` (after the epic-04 doc audit fixes, before any of this work).
Not merged yet.

---

## What changed, in order

### 1. Two color tokens

`--color-selected` → `#fcff5c` (was `#9ee6a8`), `--color-slot` → `#f1f1ea`
(was `#dce3e1`). Pure `@theme` value edits in `src/app/globals.css`, no
logic touched, nothing else affected.

### 2. `--color-grid-line` split into build and play variants

The single hairline token didn't distinguish build-phase from
preview/play rendering. Split into `--color-grid-line-build: #c2c2c2` and
`--color-grid-line-play: #616161`; `PuzzleGrid.tsx`'s container background
class is now conditional on its `mode` prop (`bg-grid-line-build` /
`bg-grid-line-play`) instead of a single static class. `--color-grid-line`
no longer exists anywhere in `src/` or `e2e/` — confirmed by grep, not
assumed.

Touched beyond the token itself: `TokenPane.tsx`'s color list,
`e2e/shell.spec.ts` and `e2e/style-guide.spec.ts`'s token lists, and
`e2e/style-guide.spec.ts`'s one hairline-repaint test, which used to set
`--color-grid-line` and check the build sample's background — split into
two tests, one per token, one per sample (`sg-grid-build`/`sg-grid-preview`).

### 3. Slot cells now distinguish content from empty space

The bug this fixes: selecting a row/column whose slot length isn't decided
yet (no black cells placed there so far) painted every cell in it the same
flat `slot` color — including cells that already held letters, and cells
that were the *only* reason to be looking at that row at all (symmetric-hint
squares needing a word). A builder navigating to such a row lost the
information "the word goes exactly here" that was visible before
navigating there.

`src/lib/cell-appearance.ts`'s `cellAppearance` now returns `'slot-letter'`
(in the active slot, has a letter) or `'slot-required'` (in the active
slot, no letter, but a symmetric hint) instead of collapsing both into
plain `'slot'`. Plain `'slot'` now means specifically "in the slot, empty,
no known purpose yet." Both new states render with one new token,
`--color-slot-content: #ffffe2`, mapped in `PuzzleGrid.tsx`'s
`APPEARANCE_BG`; splitting the two onto different colors later (e.g.
keeping lettered cells white) is a one-line change there, not new logic.

This directly falsified a committed Story D3 acceptance assertion
(`cell-appearance.test.ts`: "slot membership outranks content") and a
Story D8 Playwright test (`style-guide.spec.ts`: "the active slot spans
both lettered and empty cells", which filtered by `data-cell-state="slot"`
and expected to find a letter there — it doesn't anymore, `slot-letter`
does). Both were rewritten to assert the new, real contract rather than
patched around. `docs/stories/05-D3-build-grid.md` and
`05-D8-live-token-editing.md` each got a one-line "superseded by a later,
undocumented change" annotation pointing here, rather than being left to
silently contradict shipped behavior.

### 4. `--color-required` → `#ff251a`

Was `#b23b34`. Pure token value edit, preview-mode symmetric-hint color
only.

### 5. The puzzle title reads as a title, not a form field

Previously `PuzzleTitle` was the shared `TextInput` component — same
always-visible border as every other input in the app, by deliberate
Story D2 decision. The builder wanted the title to look like page
furniture (Space Grotesk, bold, large) until interacted with, not like an
editable field competing with the phase indicator next to it.

`PuzzleTitle.tsx` no longer uses `TextInput`. It's still a real `<input>`
(every existing test doing `.fill()` / `.toHaveValue()` /
`.toBeDisabled()` on `puzzle-title` keeps working unmodified — this was
deliberately a styling change, not a structural one), but styled with no
visible border by default, a subtle `border-rule-strong` outline on
hover, and the normal bordered/ring look only on focus. Font size and
weight are constant across all three states. New token
`--text-title: clamp(34px, 5vw, 46px)` (font family and weight reused
`--font-display` / `--weight-bold`, already existing).

`--text-title` is deliberately **not** registered in the style guide's
Fonts-tab `SizeControl` list. That control (`SizeControl.tsx`) hardcodes a
single `rem` value and writes `` `${n}rem` `` on every edit — it can't
represent or drive a three-part `clamp()`. The token exists and works
everywhere it's used; it's just not live-editable via that particular
devtools control. Making it live-editable would need a different kind of
control, not attempted here.

A small layout fix rode along: the title `<input>`'s `px-1` padding read
as an unwanted left indentation once the border was gone. Fixed with
`-ml-1.5` (−6px) on the input itself, keeping the padding (needed for the
hover/focus outline to have room) while pulling the text flush left.

This falsified Story D2's own frozen acceptance test
(`e2e/controls.spec.ts`: "the title input has a visible border ... ") —
rewritten to assert the new contract (no border by default, one on hover)
rather than deleted.

### 6. The duplicate "grid" text is gone

Two separate elements were both printing the raw phase string:
`src/app/puzzles/[id]/page.tsx` had a `<p data-testid="puzzle-phase">`
above the title (leftover, pre-dating the phase badge that later grew
inside `PhaseControls`), and `PhaseControls` itself had a
`<span data-testid="phase-badge">` below the title. Both removed as of
item 7 below, since `PhaseControls` no longer renders a badge at all — the
stepper's own `build` step status (`current` in grid phase, `unavailable`
otherwise) is the one remaining, correct way to read the phase from the
DOM.

Every assertion across the suite that checked `puzzle-phase` or
`phase-badge` text now checks
`[data-testid="step"][data-step-id="build"]`'s `data-step-status`
attribute instead — same fact, read from the element that's actually
still there. Touched: `e2e/persistence.spec.ts`, `e2e/clear-letters.spec.ts`,
`e2e/publish-readiness.spec.ts`, `e2e/phase-controls.spec.ts`,
`e2e/stepper.spec.ts`.

### 7. The "Enter hints phase" button is gone; "Write clues" is a no-op for now

The builder's call: there shouldn't be two controls for the same
transition (a dedicated button *and* the stepper's "Write clues" label).
The stepper stays as the one place to trigger it, but clicking "Write
clues" doesn't do anything yet — it needs a confirmation popup first
(this transition is irreversible, per PB1a), and that popup doesn't exist.
**Deliberately broken for now**, by explicit instruction.

`PhaseControls.tsx` lost its `confirming` state, the
`enter-hints-button`/`enter-hints-confirmation`/`enter-hints-confirm-button`/
`enter-hints-cancel-button` markup, and the `emptyCellCount` prop that fed
the confirmation's copy. It's now a thin wrapper that renders `Stepper`
with `onStepClick={() => {}}` — a real no-op, not a stub with dead
branches. `PuzzleGridEditor.tsx` lost `handleEnterHints`, its `enterHints`
Server Action import, and `countEmptyActiveCells` (all now unused —
removed rather than left dead per `AGENTS.md` rule 3).

**What this does not touch:** `enterHintsPhase` (`src/engine/phase.ts`)
and the `enterHints` Server Action (`src/app/puzzles/actions.ts`) are
untouched and still fully covered by `phase.test.ts`'s Vitest suite. Only
the UI's *call site* was removed. Re-wiring "Write clues" to them, behind
a real confirmation, is follow-up work — see Open items.

**Test fallout, by kind:**
- `e2e/hints-transition.spec.ts` (PB1a's dedicated acceptance file, 148
  lines) is **deleted**. Every test in it clicked the now-gone button as
  its only way to exercise the transition; there was nothing left to
  adapt. The pure logic keeps its Vitest coverage in `phase.test.ts`; only
  the UI-integration layer lost its test.
- `e2e/phase-controls.spec.ts` (Story P4's frozen file, previously
  rewritten once already by PB1a) — two tests that were purely about the
  button/badge (the "shows the grid phase badge and an enter-hints
  button" test, and the "entering hints phase updates the badge and
  removes the button" test, plus the reload-persistence-of-the-transition
  test) are **deleted**; their subject no longer exists. The remaining
  tests (geometry toggling in grid phase, geometry rejection and letter
  editing in hints phase) still test real, present behavior — they now
  seed a fully-lettered grid directly in `'hints'` phase via `seedPuzzle`
  rather than clicking through to get there, the same pattern every PB2–PB5
  test already used.
- `e2e/stepper.spec.ts` — the test that clicked "clues" and expected the
  confirmation to appear is **replaced** with one asserting the new,
  intentional no-op (click does nothing: no `step-reason` appears, no
  status changes). The test that only existed to prove the removed button
  worked is **deleted**. The test that only checked `phase-badge` text for
  both phases is **deleted** as redundant — the same two facts are already
  covered by the `build`/`current` and `build`/`unavailable` checks in the
  other two tests in this file.
- `e2e/controls.spec.ts`, `e2e/clear-letters.spec.ts`,
  `e2e/publish-readiness.spec.ts`, `e2e/persistence.spec.ts` — no logic
  lost, just setup/assertion swaps (seed hints phase directly instead of
  clicking through; check the stepper instead of the removed badge).

### 8. The stepper is no longer squeezed into the same row as the action buttons

The stepper (Build/Write clues/Publish) and the ordinary action buttons
(Clear all letters, Preview) were both flex children of one
`editor-actions` row, so the stepper only got as much width as a flex item
sizes to by default — it read as one control among several, not as page
navigation. `PhaseControls` (now just the stepper) moved out of
`editor-actions` to sit on its own line directly under the title, taking
the full row width, matching the reference mock. `editor-actions` now
holds only `ClearLettersButton` and `PreviewToggle`; its own markup
contract (`e2e/controls.spec.ts`'s D2-4 tests: contains
`clear-letters-button`, excludes `delete-puzzle-button`, has a non-zero
gap) is unaffected, since none of that asserted the stepper had to be
inside it.

---

## Open items (not done here, on purpose)

- **"Write clues" does nothing.** It needs the confirmation popup the
  builder described, then re-wiring to `enterHints` — the exact call
  `handleEnterHints` used to make, now removed. `phase.test.ts` and
  `docs/stories/04-PB1a-empty-cells-black.md` still describe the
  underlying transition accurately; only its UI trigger is missing.
- **Idea 2 from the slot-content discussion** (a border drawn around the
  active word, as an alternative/complement to the color-only treatment)
  was discussed but not built — the builder chose to try idea 1
  (`--color-slot-content`) alone first.
- **`--text-title` isn't live-editable in the style guide.** Would need a
  size control that understands `clamp()`, not the existing rem-only
  `SizeControl`.
- **One pre-existing, unrelated flaky test**: `e2e/style-guide.spec.ts`'s
  "reloading restores committed values" (D8-2) failed once in a full-suite
  run and passed 3/3 in isolation immediately after. Not touched by
  anything in this document — none of this work's changes touch
  `--color-grid-empty`, which is what that test exercises. Recorded per
  `LEARNINGS.md` entry 2 rather than silently ignored.

---

## The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, **248 Vitest
tests passing across 20 files** (2 net new, from the slot-content split —
see item 3). `npm run test:e2e`: **182 Playwright tests passing**, full
suite, after the `hints-transition.spec.ts` deletion and the adaptations
above.

## What exists (files touched, cumulative across this document)

```
docs/handoffs/
  06-HANDOFF-visual-polish.md   this file
docs/stories/
  05-D3-build-grid.md          annotated: slot/slot-letter split supersedes
                                 one acceptance example (item 3)
  05-D8-live-token-editing.md  annotated: same, for its own fixture (item 3)
src/app/
  globals.css   --color-selected, --color-slot, --color-required edited;
                 --color-grid-line replaced by -build/-play;
                 --color-slot-content and --text-title added
  puzzles/[id]/page.tsx   the orphaned puzzle-phase <p> removed (item 6)
src/lib/
  cell-appearance.ts        slot-letter/slot-required split (item 3)
  cell-appearance.test.ts   D3's frozen test, rewritten for the split
src/components/grid/
  PuzzleGrid.tsx          bg-grid-line-build/-play conditional on mode;
                           slot-letter/slot-required added to APPEARANCE_BG
  PhaseControls.tsx       badge and enter-hints button/confirmation
                           removed; now a thin Stepper wrapper (items 6, 7)
  PuzzleGridEditor.tsx    handleEnterHints/countEmptyActiveCells removed;
                           PhaseControls moved out of editor-actions onto
                           its own row (items 7, 8)
src/components/puzzle/
  PuzzleTitle.tsx   no longer uses TextInput; own hover/focus-only border
                     styling, -ml-1.5, --text-title (item 5)
src/components/style-guide/
  TokenPane.tsx   color list updated for the grid-line split and
                   --color-slot-content (items 2, 3)
e2e/
  hints-transition.spec.ts   deleted (item 7)
  phase-controls.spec.ts     button/badge tests removed; remaining tests
                              seed hints phase directly (items 6, 7)
  stepper.spec.ts            clues-click test replaced; badge/button tests
                              removed (items 6, 7)
  controls.spec.ts           enter-hints-button dropped from the button
                              sweep; title-border test rewritten (items 5, 7)
  clear-letters.spec.ts, publish-readiness.spec.ts, persistence.spec.ts
                              phase-badge assertions swapped for the
                              stepper's build-step status (item 6)
  shell.spec.ts, style-guide.spec.ts
                              grid-line token lists and hairline test split
                              (item 2); slot-content token/state added
                              (item 3)
```
