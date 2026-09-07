# Epic: Publishing

The fourth epic, and the first of three that together make puzzles
playable. A puzzle currently has no notion of being *finished* — a grid
with three letters and no hints is exactly as loadable as a complete one.
This epic settles what a finished puzzle looks like structurally, and adds
the published state that a solver will eventually browse.

It is deliberately builder-side only. Nothing here lets anyone solve
anything; it establishes the state the play epic will read.

**Sequencing.** Publishing, then authentication, then play/solve.
Publishing depends on nothing new and continues the builder-side work of
epics 2 and 3. Authentication is the larger disruption and is required
before play (each solver needs their own saved progress). Play needs both.

---

## The governing principle: helpers, not gates

The builder decides when a puzzle is done. This epic adds no rule that
prevents publishing — not symmetry, not completeness, not word count, not
any construction convention. A builder who wants to publish a grid that's
entirely black except for six cells spelling PUZZLE can do exactly that.

What the epic does add is *information*: telling a builder what's still
unfilled or unauthored, so they can decide knowingly rather than by
accident. Every readiness check here is advisory. If a check would ever
block the publish button, it's the wrong design for this app.

See `docs/NYT-CROSSWORD-REFERENCE.md` for the conventions being
deliberately not enforced, and why each is a convention rather than a
requirement.

---

## Conventions

Inherits epics 2 and 3 unchanged — Tailwind v4 `@theme` tokens, small
focused components, Server Actions for persistence, silent debounced
autosave, no new global state library. Destructive or irreversible actions
get honest confirmation copy; reversible ones don't.

**Verification.** At least one Playwright test per story exercising the
real flow, plus Vitest for extractable pure logic. PB1's conversion and
PB2's readiness check are both genuinely pure and get real unit coverage.

---

## Non-goals (considered and deferred)

- **Anything a solver does.** No play route, no solve records, no
  answer-hiding. That's the play epic, and it needs auth first.
- **Authentication or ownership.** `publishedAt` records *when*, not
  *who* — there is still only one builder.
- **A solver-facing list of published puzzles.** The builder's own list
  gains a published indicator (PB5); the browse view belongs with play,
  where it can lead somewhere.
- **Enforcing any construction convention.** Symmetry, all-over
  interlock, no unchecked squares, minimum answer length of three, word
  count caps, black-square density — all real NYT conventions, all
  deliberately unenforced. Builders get creative license; some of these
  may later become advisory helpers, none become gates.
- **Word validity or dictionary checks.**
- **Themes, difficulty ratings, or metadata beyond title, size, and
  publish date.**
- **A reverse hints→grid transition.** Doesn't exist today and isn't added
  here, though PB1 makes its absence more consequential — see PB1's own
  note.

---

## Definition of done (epic-level)

1. The story's flow is covered by at least one passing Playwright test.
2. `tsc --noEmit` is clean across the repo.
3. Lint is clean.
4. `npm run verify` exits 0.

---

## Story Group PB1 — Empty cells become black at the hints transition

**The structural decision this epic exists to settle.** From the builder's
standpoint an unfilled cell *is* a black cell — a grid with PUZZLE in six
cells and nothing else is a puzzle with six white squares, not a 15×15 of
mostly-empty white space. Entering hints phase is where that becomes real:
`enterHintsPhase` converts every active cell with no letter into a black
cell.

**Why this moment and no other.** Slots, numbering, and required hints are
all derived from geometry. If empty cells stay active while hints are
authored, `extractSlots` sees a 15-cell across run where the finished
puzzle has a 6-cell one — so the numbering is wrong, the required-hint set
is wrong, and the builder authors clues against a puzzle nobody will ever
see. Converting at publish time is too late for the same reason. The
hints transition is already where geometry freezes, so it's where the
final geometry must be decided.

**A grid-phase preview toggle** renders empty cells as black without
changing any data, so a builder can see what the conversion will do before
committing. Pure rendering — no engine involvement, no persistence.

**This modifies Story E's shipped behavior**, which specified that
`enterHintsPhase` sets phase and fills blank hint entries and does not
touch the grid. That's a deliberate change, not an oversight, and Story E's
doc should be annotated to point here rather than silently contradicted.

**Consequences to handle explicitly:**

- The conversion may break symmetry, since a builder's filled cells needn't
  be symmetric. That's acceptable per the governing principle above.
- There's no reverse transition, so this is effectively one-way. A builder
  who enters hints phase with cells they meant to fill has lost them as
  white squares. The preview toggle is the mitigation; whether that's
  enough is worth watching once it's in use.
- Symmetric counterparts are *not* auto-blackened to match. The conversion
  blackens exactly the empty cells, nothing more.

## Story Group PB2 — Publish readiness (advisory)

A pure function reporting what a builder might want to know before
publishing, returning specific findings rather than a verdict:

- Cells that are active but hold no letter (possible after PB1 only if the
  builder deleted letters in hints phase, since the transition blackens
  the rest).
- Required hints not yet authored (`hintsComplete` already encodes this).
- Whether the grid is symmetric (`isSymmetric` already exists, unused by
  any UI so far).

Every finding is informational. None blocks anything. The UI shows them
near the publish control so a builder sees what they're publishing.

**Open decision:** whether to include convention checks the reference doc
describes but nothing currently computes — all-over interlock, minimum
answer length, unchecked squares. Proposal: not in this story. They're
each real work, none is needed for the play epic, and adding them now
would expand an advisory panel into a construction-analysis feature.

## Story Group PB3 — Publish and unpublish

A `publishedAt` timestamp on the puzzle (null = unpublished), a publish
action, and an unpublish action.

**Publishing is never blocked.** PB2's findings are displayed, not
enforced. If a builder publishes a puzzle with four unauthored hints,
that's their call.

Neither action needs a confirmation — publishing destroys nothing and
unpublish is right there. This follows M4's reasoning: confirmations
belong on irreversible actions, and adding them elsewhere trains people to
click through the ones that matter.

## Story Group PB4 — Editing a published puzzle

While `publishedAt` is set, letters, geometry, hints, and title can't be
edited. To change anything, unpublish first.

**Why, since this is the epic's most consequential decision after PB1.**
Once solvers exist, editing a published puzzle changes the answers out
from under someone mid-solve — their correct letters silently become
wrong. Solving that properly (versioning, invalidating solves, notifying
someone) is real work for a problem that doesn't exist yet. Freezing on
publish sidesteps it, costs the builder one extra click, and hands the
play epic a guarantee rather than a problem.

Note this is a *lock on a state the builder chose*, not a gate on
publishing — consistent with the governing principle. It's also a natural
extension of the phase-lock mechanism Story E established, with P4's
rejection message as UI precedent.

## Story Group PB5 — Published status in the builder's list

Extends M3's list metadata: each row shows whether it's published and,
when it is, the publish date. Sorting stays most-recently-updated first.

Last because it depends on PB3's `publishedAt` existing.

---

## Suggested build order

PB1, PB2, PB3, PB4, PB5 — a real dependency chain, unlike epic 3's mostly
independent stories. PB2's readiness check only makes sense once PB1 has
settled what a finished grid is; PB3 displays PB2; PB4 and PB5 both need
PB3's `publishedAt`.

PB1 is the one to think hardest about before building. It changes a shipped
engine behavior, it's effectively one-way for the builder, and every later
story in this epic and the next two assumes the geometry it produces.
