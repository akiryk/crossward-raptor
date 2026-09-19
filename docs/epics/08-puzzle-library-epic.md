# Epic: The puzzle library

`/puzzles` is the first page anyone sees and the least designed thing in
the app: an unstyled heading, a button wedged under it, and a flat list
of rows that read as one run-on sentence — title, date and status joined
by em-dashes, the whole row tinting grey on hover with nothing to say
it's a link. The new-puzzle form is an unstyled block that drops into
the page mid-list.

This epic makes the library legible: a page that looks composed, rows
that read as puzzles rather than sentences, an honest status, and a
new-puzzle dialog that behaves like a dialog. Along the way it finishes
the `Modal` component H1 started, which both dialogs now depend on.

---

## Design direction

The house style already exists in the tokens and the editor: a hairline
grammar (`--color-rule`), a restrained accent (`--color-accent`), one
display face for headings and a body face for everything else, generous
whitespace, and no decoration that isn't carrying information. The
library should look like it belongs to the editor, not like a different
app.

Three principles for the rows:

**A row is a record, not a sentence.** The title is the thing being
identified and should read as a title: display face, foreground weight,
on its own line. Everything else is metadata and belongs underneath in
the help size and secondary ink. No em-dash chains.

**Status is a badge, not prose.** A short, upright label in a pill —
"Building grid", "Writing clues", "Published" — placed with the
metadata. Colour carries the state: neutral outline while authoring,
accent tint once published. One badge, never two, so a row never has
competing signals.

**The affordance is a button.** Hover-tinting a whole row says "clickable"
only to someone who already knows. Each row gets an explicit **Edit**
button on the right, and the row itself stops being a link. That also
leaves the row free to grow a second action later — Play, Duplicate —
without re-teaching anyone how the list works.

And for the page: the heading and the primary action share a baseline,
heading left, **New Puzzle** right. That's the standard shape for a
library page and it stops the button from looking like it belongs to the
list beneath it.

## The status wording

`puzzleStatus` already models three kinds correctly — the model is fine,
the words are wrong. "Hints" names an internal phase; "Hints —
incomplete" reads as jargon. The kinds keep their names; the labels
become what a builder would say out loud:

| kind | today | becomes |
|---|---|---|
| `grid` | "Grid" | "Building grid" |
| `hints`, incomplete | "Hints — incomplete" | "Writing clues" |
| `hints`, complete | "Hints — complete" | "Clues done" |
| `published` | "Published — private" | "Published · Private" |

Completeness stays binary for now — no "12 of 35" count.

## Size is derived, not stored

Every row should say what size puzzle it is, and the list should group
by it. But size is already fully determined by the grid's dimensions, so
storing it would duplicate derived data — the same mistake the grid
engine's "slots are derived, never stored" rule exists to prevent.
`listPuzzles` already deserializes each grid; naming its size is a
lookup from `cols`/`rows`, not a new column.

Real metadata — a description, an author, a publication date — is not
derivable and will need schema when it arrives. That is a later epic.
This one adds no columns.

## Non-goals

- **Authentication, permissions, ownership.** No user model, no "my
  puzzles" versus "other people's".
- **Play mode.** A published puzzle's row still offers Edit, opening the
  editor, which PB4 already locks read-only. Play is its own epic; the
  row is designed so a second action slots in beside Edit without
  rework.
- **Completion, archiving, "play again".** All downstream of play mode.
- **Stored metadata.** No description, author, or publication-date
  columns.
- **Sorting or filtering controls.** Grouping is by size, and within a
  group by most-recently-updated, as today.
- **Mobile layout.** Desktop-first, as the rest of the app.

---

## Stories

### M1 — A Modal that can take a second dialog

`Modal` was built for exactly one caller and hardcodes a
confirm/cancel pair. The new-puzzle dialog needs a disabled-until-valid
confirm, which today would mean a new prop — and then another, and
another.

Rather than grow props or fragment into compound components
(`Modal.Header`/`Body`/`Footer` is the right answer for a dozen varied
dialogs; there are two here, and AGENTS.md rule 2 is explicit about
abstractions for single-use code), the footer becomes one injectable
slot and the standard button row moves into a small companion:

```tsx
Modal({ open, title, onClose, footer?, children })
ModalActions({ confirmLabel, cancelLabel, onConfirm, onCancel,
               confirmDisabled?, confirmVariant? })
```

`Modal` keeps owning everything uniform: backdrop, Escape, click-outside,
centring, the titled shell — plus a close control in the corner, since
Escape and backdrop are both invisible affordances. A dialog needing
three buttons or none passes its own footer and `Modal` doesn't change.

### M2 — Modal accessibility

Independent of M1 and more valuable than it. The current `Modal` has no
focus trap, so Tab walks out into the page behind the backdrop; no focus
restore, so dismissing drops focus to `<body>`; no `aria-modal` or
`aria-labelledby`, so it isn't announced as a named dialog; no body
scroll lock; and no portal, so `fixed inset-0` can be clipped by any
ancestor that establishes a containing block.

### L1 — The new-puzzle dialog

Move `NewPuzzleDialog` into `Modal`, and give it a form worth looking
at: a labelled title field with a placeholder, and the sizes as real
radio buttons rather than the unlabelled toggle row they are today.

Adds **Midi (9×9)** to `PuzzleSize` — the size the NYT actually
publishes between the Mini and the weekday puzzle. Odd-dimensioned, so
rotational symmetry still has a true centre cell. Default stays Daily.

The dialog's own Escape handler is deleted; `Modal` already owns that,
and two handlers for one key is a bug waiting to happen. Its
`hasSubmittedRef` double-submit guard stays exactly where it is.

### L2 — The page and its rows

The heading and New Puzzle share a baseline, heading left, button right.
Each row becomes title-over-metadata with a status badge and an Edit
button, separated by hairlines. The row stops being a `<Link>`.

Rewords `puzzleStatus`'s labels per the table above. `StatusKind` and
the function's shape are unchanged, so the badge can style off `kind`
rather than parsing text.

### L3 — Grouping by size

Rows group under size headings — Mini, Midi, Daily, Sunday — each
labelled with its dimensions, ordered smallest to largest, empty groups
omitted. Within a group, most-recently-updated first, as today. Size is
derived in `listPuzzles` from the grid's dimensions.

---

## Suggested order

M1, then L1 (which needs M1's footer slot), then L2, then L3. M2 is
independent and can land any time.

## A note on existing specs

Four stories here touch markup and labels that committed specs assert
on — `puzzle-list.spec.ts`, `typography.spec.ts`, `controls.spec.ts`,
and whatever covers `puzzle-status`. Three stories in the last epic
stopped mid-implementation on exactly this. **Before each story is
written**, grep the suite for the testids, labels and roles that story
changes, and hand the results over with the request. The corrected spec
files then ship with the story rather than surfacing as failures.

## Definition of done (epic-level)

Per story: acceptance examples encoded as tests and passing,
`npm run verify` exits 0, and `npm run test:e2e` exits 0.
