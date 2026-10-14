# Story L2b — The library page and its rows

Fourth slice of the puzzle-library epic, and the visual half of what the
epic called L2. L2a fixed the words; this fixes everything around them.

Today the page is a heading with a button wedged underneath it, above a
list whose rows read as one run-on sentence — title, date and status
joined by em-dashes — with the entire row tinting grey on hover and
nothing saying it's a link. Nobody would guess a row is clickable
without trying it.

Repo paths:
- `src/app/puzzles/page.tsx` — edited: header row, row layout, status
  badge, Edit control
- `src/app/style-guide/page.tsx` — edited: `sg-stepper`'s stale labels
- `e2e/puzzle-list-layout.spec.ts` — new (**already provided — do not
  edit**)
- `e2e/controls.spec.ts` — extended (**already provided — do not edit**;
  D2-1, D2-3 and D2-4 unchanged, D2-2's hover test retargeted — see
  below)

## Required layout

**The header.** The heading and the primary action share a baseline,
heading left, New Puzzle right. That is the standard shape for a library
page, and it stops the button from looking like it belongs to the list
beneath it.

**The row.** Title on its own line, metadata beneath it, Edit on the
right:

```
Sparky Pluggy                                        [ Edit ]
Writing clues · Updated Sep 18, 2026
```

- The title reads as a title: display face, bold weight, foreground ink,
  truncating rather than wrapping.
- The metadata line is help size in secondary ink: the status badge,
  then the updated date, separated by a middle dot.
- Rows are separated by a hairline (`--color-rule`), not by a background
  block.
- No em-dash chains anywhere.

**The badge.** A small pill carrying the status label. Colour follows
`StatusKind`, not the label text: neutral outline while authoring
(`grid`, `hints`), accent tint once `published`. One badge per row,
never two, so a row never shows competing signals.

**The Edit control.** An explicit control on the right of each row,
navigating to `/puzzles/{id}`. The row itself stops being a link. It is
a real link element, not a button, so it navigates, opens in a new tab,
and is keyboard-reachable like any other link — styled to read as a
quiet button.

## Markup contract

Every existing row attribute is preserved exactly: `data-phase`,
`data-hints-complete`, `data-updated-at`, `data-published`,
`data-visibility`, `data-published-at`. Seven specs depend on them, and
on `puzzle-list` and `puzzle-list-item` continuing to exist and to
contain the puzzle's title as text.

New:
- `data-testid="puzzle-list-header"` on the heading/button row.
- `data-testid="puzzle-list-title"` on the title element.
- `data-testid="puzzle-status-badge"`, carrying
  `data-status-kind="grid" | "hints" | "published"`.
- `data-testid="puzzle-list-updated"` on the date.
- `data-testid="puzzle-edit-link"` on the Edit control.

**`puzzle-list-item` keeps `text-body`.** Two committed tests in
`typography.spec.ts` read `font-size` directly off that element — one
asserting it equals `--text-body`, one changing the token and asserting
the row follows. The title and metadata set their own sizes on their own
elements; the row container keeps the body size as its inherited
default. Neither test needs changing, and neither should.

## Decisions

**The affordance is a control, not a hover tint.** Tinting a whole row
on hover communicates "clickable" only to someone who already suspects
it. An explicit Edit control says so before the pointer arrives, and
leaves the row free to grow a second action — Play, Duplicate — without
re-teaching anyone how the list works.

**A link, not a button.** Edit navigates. Making it a `<button>` with an
`onClick` router push would break middle-click, cmd-click and "open in
new tab" for no benefit.

**The badge styles off `kind`, not the label.** Parsing a user-facing
string to decide a colour would silently break the next time the wording
changes — which it just did, in L2a.

**The title truncates rather than wraps.** A long title wrapping to
three lines would push the metadata down and make rows different
heights, which destroys the scannability the redesign is for.

**`sg-stepper`'s labels are corrected here.** The style guide's stepper
sample hardcodes `['Grid', 'Hints', 'Published']`, which never matched
the real stepper's "Build the grid / Write clues / Publish". It is three
strings, it is user-facing wording, and leaving it documents a control
that doesn't exist. `sg-hint-rows` is also stale — it shows the
pre-H3 clue row — but that is a different component's drift and is
explicitly **not** in scope here.

## One existing spec changes

`controls.spec.ts`'s D2-2 test "list rows are interactive and respond to
hover" asserts that `puzzle-list-item` reports `cursor: pointer` and
that hovering changes its appearance. Both stop being true by design:
the row is no longer interactive, the Edit control is.

The corrected version asserts the same two properties of
`puzzle-edit-link` instead. What D2 was protecting — that the list's
interactive element looks and behaves interactive — is unchanged; only
which element that is has moved.

D2-2's other test, comparing the heading's font size to the row's,
passes unchanged and is a useful check that the header rework didn't
disturb the type scale.

## Scope discipline

- No changes to `puzzleStatus`, `StatusKind`, or any label text — L2a
  settled the words.
- No changes to `listPuzzles` or `actions.ts`. No new fields, no derived
  size, no grouping — grouping is L3.
- No changes to `NewPuzzleButton` or its `data-ready` wrapper, which
  `waitForNewPuzzleReady` gates the whole suite on. It moves inside the
  header element; it does not change.
- No changes to `typography.spec.ts`.
- No changes to `sg-hint-rows`.
- No new tokens — the badge uses `--color-rule-strong`, `--color-ink-2`,
  `--color-accent` and `--color-ok-tint`, all of which exist.
- No mobile or responsive work.

## Acceptance examples

**L2b-1 — the page (Playwright, `e2e/puzzle-list-layout.spec.ts`)**
- The heading and the New Puzzle button sit in one header element, with
  the button to the right of the heading and their centres aligned.
- Each row shows its title in its own element, and a metadata line
  carrying a status badge and an updated date.
- The badge's `data-status-kind` matches the row's state: `grid` for a
  grid-phase puzzle, `hints` for a hints-phase one, `published` once
  published.
- A published row's badge renders differently from an unpublished row's.
- Each row has an Edit link pointing at that puzzle, which reports a
  pointer cursor and changes appearance on hover.
- The row itself is not a link: `puzzle-list-item` is not an `<a>` and
  contains exactly one link.
- Clicking Edit opens that puzzle's editor.
- Row attributes and ordering are unchanged.

**L2b-2 — controls (Playwright, `e2e/controls.spec.ts`)**
- The page heading is still larger than a list row.
- The list's interactive element — now the Edit link — reports a pointer
  cursor and responds to hover.

## Definition of done

1. `e2e/puzzle-list-layout.spec.ts` and `e2e/controls.spec.ts` pass:
   `npm run test:e2e`.
2. `e2e/typography.spec.ts` passes **unmodified** — it is the regression
   check that the row still reads the type scale.
3. Every other spec passes unmodified. **Check this rather than assuming
   it.** Before implementing, grep the suite for any spec that *clicks* a
   list row to navigate (`puzzle-list-item` followed by `.click()`) —
   the row stops being a link, so such a spec would break, and it is not
   in this story's Repo paths. If one exists, stop and report it.
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
