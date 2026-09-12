# NYT Crossword: a reference

Descriptive background on how the New York Times crossword is constructed
and solved. Crossward treats it as a canonical model, so this exists to
stop us rediscovering the conventions mid-story — and to catch design
decisions that would be expensive to unmake.

**This document is descriptive, not prescriptive.** It records how the NYT
puzzle works. It does not say what Crossward must do. Where Crossward
deliberately diverges, that belongs in an epic's decisions or non-goals,
with the divergence stated explicitly rather than by omission. Nothing
here should be read as a requirement.

---

## Grid construction

**Symmetry.** The black-square pattern has 180-degree rotational symmetry
— rotate the grid a half-turn and the pattern is unchanged. This is the
most universal convention in American crosswords, followed by essentially
every major outlet.

**Size.** Weekday puzzles are 15×15; Sunday puzzles are 21×21. Other
dimensions (16×15, 14×15) are accepted only when a theme genuinely
requires it, and anything larger than 15×15 is not used on a regular
weekday.

**Black-square density.** Historically capped around 16% of the grid
(roughly 36 squares in a 15×15). There is no longer a hard limit — the cap
was relaxed to allow flexibility in placing theme entries — but large
clumps of black squares are strongly discouraged. "Cheater" squares
(black squares that don't change the word count, added only to make
filling easier) should be kept to a minimum.

**All-over interlock.** The black squares must not cut the grid into
disconnected regions. A solver should be able to work from any part of the
grid to any other without starting over.

**No unchecked squares.** Every white square belongs to both an Across and
a Down answer, so every letter is confirmed by two clues. This is what
makes crossings a reliable solving tool.

**Minimum answer length is three letters.** No two-letter answers.

**Word count.** NYT weekday 15×15 puzzles are capped at 78 words, or 72 if
themeless. Lower word counts mean longer answers and more open white
space — harder to construct and harder to solve.

**Answers must be real.** Every entry needs a reference or must be in
common use. No invented words or phrases.

**No duplicates.** The same word can't be the answer to two clues,
including as a component of a compound or multi-word entry.

## Themes

Most weekday puzzles (especially Monday–Wednesday) have a theme: several
long entries sharing a motif, sometimes with a "revealer" entry that names
the trick. Theme entries are placed symmetrically — an entry three rows
from the top implies a matching one three rows from the bottom. As a
general rule no non-theme entry should be longer than any theme entry.

**Day-of-week difficulty.** Monday is easiest, difficulty ramps through
Saturday, and Sunday is large (21×21) but roughly mid-week in difficulty.
Thursday is traditionally the gimmick day — where rebus squares and other
tricks appear.

## Clues

**Form agreement.** The clue's grammatical form mirrors the answer's: a
plural clue takes a plural answer, a past-tense clue a past-tense answer.

**Signalling conventions**, each of which tells the solver what kind of
answer to expect:

- `?` at the end — wordplay, pun, or misdirection rather than a literal
  definition.
- `abbr.`, `inits.`, `org.`, `dept.` — the answer is an abbreviation or
  initialism. Very common abbreviations (RSVP, NFL) often go unsignalled.
- `for short`, `briefly`, `familiarly` — a shortened or informal form.
- `___` (fill-in-the-blank) — a stock phrase, idiom, or title.
- Quoted clues — the answer is a spoken phrase or interjection.
- `sounds like`, `we hear`, `reportedly` — a homophone.
- `perhaps`, `maybe`, `e.g.`, `for one` — definition by example, or a
  hedge that the clue isn't always true of the answer.
- A foreign language or place in the clue — the answer is in that
  language.
- `var.`, `alt. sp.` — a variant spelling.

**The substitution test.** A clue should be usable in a sentence the same
way its answer is.

**Don't clue an answer with a word that appears elsewhere in the grid**,
especially nearby. Cross-references (`With 22-Across, ...`) are used
instead.

**Multi-word answers** are usually not signalled in harder puzzles; easier
ones may append `(2 wds.)`.

## Numbering

Cells are numbered in reading order (left to right, top to bottom), and a
cell gets a number if it starts an Across answer, a Down answer, or both.
A cell starting both shares one number across the two directions —
`1-Across` and `1-Down` are different answers at the same square. Numbers
are sequential over numbered cells only; unnumbered cells have no number.

## Solving

**Cursor and orientation.** The cursor sits in one cell with an active
direction (Across or Down); the whole current answer is highlighted, with
the single cursor cell distinguished within it. Typing advances along the
current direction. Arrow keys move and can switch direction. The spacebar
toggles direction (and in the NYT app also clears the current square and
advances). Clicking an already-selected cell toggles direction.

**Rebus squares.** A single square can hold more than one character —
`HEART` in one cell, for instance. Rebuses are a recurring gimmick,
traditionally on Thursdays. In the NYT app, Escape opens rebus entry (some
other clients use Shift). Rebus entries can also be symbols or numbers,
not only letters.

**Pencil mode.** Renders entries in grey rather than black, marking
uncertain guesses. Purely cosmetic — it doesn't affect correctness or
completion — but it lets a solver find their shaky answers again later.

**Check.** Marks selected squares correct or incorrect without revealing
answers, at three scopes: square, word, or whole puzzle. **Autocheck** is
the continuous version, flagging errors as they're typed.

**Reveal.** Fills in the correct letters, again at square/word/puzzle
scope. In the NYT, using reveal resets an active solving streak.

**Completion.** The puzzle is finished when every square is filled with
the correct letter; the app announces success. A fully filled grid with an
error is not complete.

**Other affordances.** A timer with the option to hide it, dark mode,
configurable cursor behavior (whether it skips already-filled squares,
whether it jumps to the next clue at the end of an answer), and — with
autocheck on — deletion that skips over letters already known to be
correct.

---

## Where Crossward stands against this

Recorded as of the publishing epic being drafted. Not commitments — a
map of what already aligns, what deliberately doesn't, and what's
undecided.

**Already aligned:**

- 180-degree rotational symmetry is what `symmetricCounterpart` and
  `toggleBlackSymmetric` implement (Story A).
- Numbering follows the reading-order, shared-number-across-directions
  convention exactly (Story C).
- Minimum answer length of two is enforced in `extractSlots` — runs of one
  cell yield no slot (Story B). Note this is *two*, not the NYT's three.
- Cursor mechanics match the convention exactly: typing advances along the
  current direction, blocked moves stop rather than wrap, arrow keys do
  exactly one thing per press (move along the current orientation, or
  change orientation without moving when pressed perpendicular to it), and
  clicking the already-selected cell toggles direction (Story F; arrow
  and click behavior revised by Story F2r — Story F originally moved and
  reoriented in a single press, which this reference's own open questions
  flagged as worth revisiting).
- 15×15 default with no hardcoded assumption of it anywhere in the engine,
  so 21×21 and other sizes already work.

**Deliberately divergent, or not yet built:**

- **No word-count, density, interlock, or unchecked-square checks.** All
  four are construction *conventions*; Crossward's stated position is that
  a builder may make an unconventional puzzle. Any of these could become
  advisory helpers rather than gates.
- **Minimum answer length is 2, not 3.** Unexamined — inherited from Story
  B's `>= 2` rule rather than chosen against this convention.
- **No themes, no day-of-week difficulty, no revealer concept.**
- **No check, reveal, autocheck, pencil mode, or timer.** Explicitly
  deferred to a later epic than the first play/solve one.
- **No duplicate-answer detection, no dictionary validation.**
- **Spacebar toggles direction only.** NYT's app also clears the current
  square and advances; Crossward deliberately doesn't, so a builder who
  changes direction constantly during construction doesn't lose letters
  by accident (Story F2r).

**Open questions this document surfaces:**

- **Rebus support — verified, and the answer is narrow.** The data model,
  persistence, and rendering all already handle multi-character entries:
  `Cell.letter` is `string | null`, `withLetter` applies no length check,
  serialization copies the string through unchanged, `LetterCell` renders
  it without truncation, and `place`/`deleteAt`/`moveTo` treat the letter
  as opaque and advance by exactly one cell — which is correct rebus
  behavior. The single blocker is *input*: `keyToIntent` can only ever
  emit a one-character letter, since a `KeyboardEvent.key` for a letter
  key is length 1, and nothing in the editor accumulates keystrokes into a
  staged string. So rebus needs a new intent (NYT uses Escape) plus
  accumulator state in the editor, calling `place` once with the assembled
  string. Real but scoped work, not a redesign. Rendering would also want
  length-aware font sizing, which is cosmetic.
- **Should minimum answer length become 3** to match the convention, or
  stay 2 deliberately?
