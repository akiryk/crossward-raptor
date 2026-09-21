# Puzzle Library — Handoff

Current state of the crossword-builder project's eighth epic, for an
agent or collaborator picking it up fresh. Read alongside
`docs/epics/08-puzzle-library-epic.md` and `AGENTS.md`, which remain
authoritative for scope and behavior.

Repo: `crossward-raptor`. Branch `main`, tracking `origin/main`.

---

## Where things stand

**Story M1 (a Modal that can take a second dialog) is complete and
committed.** `Modal` was built in Story H1 for exactly one caller and
hardcoded a confirm/cancel button pair in its own markup; the
new-puzzle dialog this epic's L1 will move into it needs a confirm
button that stays disabled until a title is typed, which would have
meant a new prop, then another, then another.

`Modal`'s `confirmLabel`/`cancelLabel`/`onConfirm`/`onCancel` props are
gone, replaced by a single `footer?: ReactNode` slot and a renamed
`onClose: () => void` that all three dismissal paths (Escape, backdrop,
and a new close control) call — `onClose` names what every dismissal
path does now that the footer is injected, not a specific button. New
`ModalActions` (`src/components/ui/ModalActions.tsx`) is the standard
right-aligned cancel-then-confirm row, moved out of `Modal` intact
rather than becoming compound components (`Modal.Header`/`Body`/`Footer`
is the right answer for a dozen varied dialogs; there are two here, and
AGENTS.md rule 2 is explicit about abstractions for single-use code).
`confirmDisabled` and `confirmVariant` are deliberately not part of
`ModalActions` yet — neither has a consumer until L1's new-puzzle
dialog, and configuration added ahead of its caller can't be tested
through the UI at all.

`Modal` also gained a `data-testid="modal-close"` control in the
shell's top corner, since Escape and backdrop are both invisible
affordances discoverable only by people who already expect them.
`EnterHintsDialog` (the one existing consumer) now passes
`onClose={onCancel}` and a `footer={<ModalActions .../>}`; its own
external props (`open`, `onConfirm`, `onCancel`) and copy are unchanged,
per the story's scope discipline.

**No accessibility work in this story** — focus trap, focus restore,
`aria-modal`, `aria-labelledby`, scroll lock, and a portal are Story M2,
independent and deliberately separate.

**A process note, not a spec conflict:** the very first full run of
`e2e/modal.spec.ts` plus the two regression specs
(`enter-hints.spec.ts`, `enter-hints-snapshot.spec.ts`) failed all 20
tests identically, timing out on `waitForEditorReady` — including
`enter-hints-snapshot.spec.ts`'s first test, which never opens a dialog
at all. That ruled out the refactor as the cause before it was ever
suspected: the run had been invoked as a direct `npx playwright test`
call, bypassing `pretest:e2e` (test-database migration/reset, and
clearing the dev-server lock and Playwright's own port) that
`npm run test:e2e` normally runs first. Re-running through
`npm run test:e2e` passed all 20 immediately, and the two regression
specs are confirmed unmodified (`git diff` on both is empty).

**Story L1 (the new-puzzle dialog) is complete and committed.**
`NewPuzzleDialog` predated `Modal` entirely — a bare block with no
backdrop or shell, unlabelled `<button>`s standing in for a size
choice, and a name field with no visible label. It now renders through
`Modal` (the same `fixed inset-0` wrapper-div mechanism
`EnterHintsDialog` established, reused rather than invented twice),
passing `<ModalActions>` as its footer. Its own Escape handler is
gone — `Modal` already owns that, and two handlers for one key was a
bug waiting to happen. `hasSubmittedRef`'s double-submit guard is
untouched, still proven by `new-puzzle-resubmit.spec.ts`.

`PuzzleSize` gained `'midi'` (9×9 — the size the NYT publishes between
Mini and the weekday puzzle, odd-dimensioned so rotational symmetry
still has a true centre cell), ordered smallest to largest everywhere
it's listed. The size controls are now real `<input type="radio">`s
sharing one `name`, with `data-size` kept on the input itself (not a
wrapping label) and `data-selected` kept alongside the native checked
state — a committed hook, cheap to preserve even though `toBeChecked()`
is the more meaningful assertion now. The name field gained a visible
label and a placeholder; its `aria-label` stays the accessible name, so
nothing depends on label association.

**A genuine contract error surfaced before any implementation, and was
corrected before it caused rework.** The story's original markup
contract asked for `NewPuzzleDialog`'s Create/Cancel buttons to carry
both `new-puzzle-create`/`new-puzzle-cancel` *and* `modal-confirm`/
`modal-cancel` as `data-testid` — impossible, since `data-testid` is a
single exact-match attribute and Playwright's `getByTestId` doesn't do
token matching, and it has to be the literal `<button>` for
`new-puzzle-resubmit.spec.ts`'s direct `.click()` calls and
`new-puzzle.spec.ts`'s `toBeDisabled()`/`toBeEnabled()` assertions to
mean anything. Caught before any code was written; the builder
corrected the contract to give `ModalActions` two more optional props,
`confirmTestId`/`cancelTestId` (defaulting to `'modal-confirm'`/
`'modal-cancel'`), so each button carries exactly one testid.
`EnterHintsDialog` passes neither and is unaffected; `NewPuzzleDialog`
passes its own pair.

**Story L2a (say what the puzzle is actually doing) is complete and
committed** — the smaller half of what the epic called L2; the row
redesign (L2b) is next. Pure wording change to `puzzleStatus`'s four
labels: `'Grid'` → `'Building grid'`, `'Hints — incomplete'` →
`'Writing clues'`, `'Hints — complete'` → `'Clues done'`, and
`'Published — private'`/`'Published — public'` → `'Published · Private'`/
`'Published · Public'` (capitalized visibility, joined with a middle
dot instead of an em-dash). `StatusKind`, `puzzleStatus`'s signature,
and every other file are untouched — `page.tsx`'s em-dash-joined row
layout stays exactly as it is until L2b, and the badge L2b adds will
key off `kind`, not off parsing these strings. The word "hints" itself
is unchanged everywhere in code (`hintsComplete`, `HintsPanel`, `phase:
'hints'`, the hint keys) — this story drew the line at the boundary
between internal names and what a builder reads. Confirmed (per the
story's own scope discipline) that `src/app/style-guide/page.tsx` does
contain a static `['Grid', 'Hints', 'Published']` example array
unrelated to `puzzleStatus` — left untouched, as instructed, for L2b.
`publish-status.spec.ts` was checked and doesn't assert on any label
text (only `data-*` attributes), so it needed no changes and stayed
green.

**Story L2b (the library page and its rows) is complete and
committed** — the visual half of L2. `src/app/puzzles/page.tsx`'s
header is now a flex row with the heading left and `NewPuzzleButton`
right, wrapped in `puzzle-list-header`. Each row (`puzzle-list-item`,
still an `<li>`, no longer a `<Link>`) is title-over-metadata: a
truncating, bold, display-face `puzzle-list-title`, then a help-size
secondary-ink metadata line holding a `puzzle-status-badge`
(`data-status-kind` from `StatusKind` — neutral outline for `grid`/
`hints`, `bg-ok-tint`/`text-accent` for `published`, styled off `kind`
never the label) and `puzzle-list-updated`, joined by a middle dot.
Rows are separated by a `border-rule` hairline instead of a background
tint. An explicit `puzzle-edit-link` — a real `<a href="/puzzles/{id}">`,
not a button with a router push, so browser-native behaviors (new tab,
middle-click) keep working — sits on the right, styled to read as a
quiet button. `puzzle-list-item` keeps the `text-body` class directly
(not merely inherited), satisfying the two committed `typography.spec.ts`
assertions that read `font-size` off that element without touching that
file at all. `sg-stepper`'s hardcoded `['Grid', 'Hints', 'Published']`
labels (stale since before this epic — the real stepper has always read
"Build the grid / Write clues / Publish") are corrected to match;
`sg-hint-rows`' own, unrelated staleness is confirmed out of scope here,
per the story's own Decisions.

Per the story's Definition-of-Done item 3, grepped the whole suite for
any spec that clicks a `puzzle-list-item` to navigate before writing
any code — none exists, so no spec broke silently by the row losing its
`<Link>` behavior. `controls.spec.ts`'s D2-2 hover test was the one
committed assertion that did depend on the row being interactive; its
provided, already-corrected version retargets the same two assertions
(pointer cursor, hover changes appearance) onto `puzzle-edit-link`.

**Story L3 (a library grouped by size) is implemented on branch
`story/08-L3-grouped-library`, opened as a PR pending independent
review — not yet merged to `main`.** The final slice of the epic: the
page content is now constrained to `max-w-3xl` and centred, so Edit
sits beside the title it acts on instead of across a wide window; new
pure `groupPuzzles`/`sizeFor` (`src/lib/puzzle-groups.ts`) sort puzzles
into one section per standard size (Mini, Midi, Daily, Sunday, smallest
to largest, empty groups omitted), with anything matching no standard
size collecting into a final "Other sizes" group rather than vanishing
— needed because the app only ever creates the four standard sizes but
nearly every test seeds an off-size grid. Within a group, unpublished
work sorts before published, then most-recently-updated first, so what
needs attention sits at the top. New `GridThumbnail`
(`src/components/puzzle/GridThumbnail.tsx`) draws a small,
`aria-hidden` square from the puzzle's actual black-square pattern —
one element per cell, `data-black="true"/"false"` — derived from the
stored grid at render time, never stored itself. `listPuzzles`
(`src/app/puzzles/actions.ts`) now also returns each row's `cols`,
`rows`, and a `black: boolean[][]` pattern, read from the same
`record.grid` it already deserializes for `summarizePuzzle` — no new
query, no schema change. The row itself reorganised left to right:
thumbnail, then title-over-updated-date, then badge and Edit together
on the right — the badge moved next to the action it relates to, and
the middle dot from L2b's metadata line is gone since nothing is left
for it to separate.

All four specs the story named as must-pass-unmodified
(`puzzle-list.spec.ts`, `puzzle-list-layout.spec.ts`,
`typography.spec.ts`, `controls.spec.ts`) passed on the first run,
confirmed via `git diff` to be untouched — the markup contract
(`puzzle-list-item`'s six data attributes, `puzzle-list-title`,
`puzzle-status-badge`, `puzzle-list-updated`, `puzzle-edit-link`,
`puzzle-list-header`, `page-heading`, and `puzzle-list-item` still
carrying `text-body` directly) held exactly as specified.

## What exists (files touched, cumulative across this document)

```
docs/epics/
  08-puzzle-library-epic.md   the epic this document tracks
docs/stories/
  08-M1-modal-footer-slot.md   Story M1's specification
  08-L1-new-puzzle-dialog.md   Story L1's specification (amended:
                                 confirmTestId/cancelTestId correction)
  08-L2a-status-wording.md     Story L2a's specification
  08-L2b-library-page-and-rows.md   Story L2b's specification
  08-L3-grouped-library.md     Story L3's specification
docs/handoffs/
  08-HANDOFF-puzzle-library.md   this file
e2e/
  modal.spec.ts        Story M1's acceptance test, new — do not edit
  new-puzzle.spec.ts   Story L1 — extended, not new: D6-3's cases
                         unchanged except the default-selection test,
                         plus a Midi case — do not edit
  puzzle-list.spec.ts  Story L2a — extended: M3-2's cases unchanged
                         except the three that assert label text — do
                         not edit
  puzzle-list-layout.spec.ts   Story L2b's acceptance test, new — do
                                 not edit
  controls.spec.ts     Story L2b — extended: D2-1/D2-3/D2-4 unchanged,
                         D2-2's hover test retargeted from the row to
                         puzzle-edit-link — do not edit
  puzzle-groups.spec.ts   Story L3's acceptance test, new — do not edit
src/components/ui/
  Modal.tsx          footer slot replaces confirm/cancel props; onClose
                      replaces onCancel; new modal-close control
  ModalActions.tsx   new — the standard cancel/confirm button row.
                      Story L1 — confirmDisabled, confirmTestId,
                      cancelTestId added
src/components/grid/
  EnterHintsDialog.tsx   passes onClose and a ModalActions footer;
                          own props and copy unchanged
src/components/puzzle/
  NewPuzzleDialog.tsx   Story L1 — renders through Modal/ModalActions;
                         radios instead of buttons; labelled name field;
                         own Escape handler removed
src/lib/
  puzzle-size.ts          Story L1 — midi (9x9) added
  puzzle-size.test.ts     Story L1's Vitest acceptance test, extended —
                           do not edit
  puzzle-status.ts        Story L2a — the four label strings reworded
  puzzle-status.test.ts   Story L2a's Vitest acceptance test, extended
                           — do not edit
src/app/puzzles/
  page.tsx   Story L2b — header row, title/metadata row layout, status
              badge, edit link; row is an li, not a Link. Story L3 —
              max-w-3xl content column, grouped rendering via
              groupPuzzles, thumbnail, row reorganised (thumbnail,
              title/date, badge+edit)
  actions.ts   Story L3 — listPuzzles also returns cols/rows/black,
                read from the same stored grid it already deserializes
src/app/style-guide/
  page.tsx   Story L2b — sg-stepper's stale labels corrected to match
              the real stepper's wording
src/lib/
  puzzle-groups.ts        Story L3 — new: sizeFor, groupPuzzles
  puzzle-groups.test.ts   Story L3's Vitest acceptance test, new — do
                           not edit
src/components/puzzle/
  GridThumbnail.tsx   Story L3 — new: a decorative square drawn from
                       the puzzle's actual black-square pattern
```

## The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, 310 Vitest
tests passing (15 net new, from `puzzle-groups.test.ts`). `npm run
test:e2e`: 263 Playwright tests passing (6 from M1's `modal.spec.ts`, 2
from L1's additions to `new-puzzle.spec.ts`, 9 from L2b's
`puzzle-list-layout.spec.ts`, 7 from L3's `puzzle-groups.spec.ts` —
L2a's, L2b's and L3's changes to already-committed specs reworded
existing assertions rather than adding tests, so contributed no
additional count). The D8-2 flake noted after M1 did not recur on any
subsequent run, including L3's.
