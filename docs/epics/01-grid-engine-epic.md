# Epic: Crossword Grid Engine

The grid engine is the pure, headless logic core of Crossward. It owns **what is true** about a puzzle grid — geometry, words, numbering, required hints, phase rules, and cursor movement — as deterministic functions over data. It has **no DOM, no database, no network, no React**. React and persistence sit on top later and translate user events into calls against this engine.

This is deliberately the first thing we build, because it is the one subsystem where "done" is fully machine-checkable. It is where the agent loop closes on a real verifier.

---

## Conventions

**Coordinates.** `Coord = { col, row }`, **zero-indexed**, origin top-left. `col` increases rightward, `row` increases downward. (Your earlier examples were 1-indexed — everything here is shifted down by one, so your `{1,1}` is `(0,0)`, your `{5,5}` is `(4,4)`, etc.)

**Types (illustrative — refine in code):**

```ts
type Orientation = 'across' | 'down';
type Coord = { col: number; row: number };

type Cell =
  | { kind: 'black' }
  | { kind: 'active'; letter: string | null };   // null = empty active cell

type Grid = {
  cols: number;
  rows: number;
  at(col: number, row: number): Cell;             // accessor; storage is opaque
};

type Slot = {
  number: number;         // shared across/down numbering
  orientation: Orientation;
  start: Coord;
  cells: Coord[];         // in reading order
  length: number;         // >= 2
};

type Phase = 'grid' | 'hints';
type CursorState = { current: Coord; orientation: Orientation };

type Puzzle = {
  readonly grid: Grid;                              // geometry + answer letters
  readonly hints: Readonly<Record<string, string>>; // "3-across" -> hint text
  readonly phase: Phase;
};
```

**Purity rule.** Every function below is `(inputs) -> outputs` with no side effects. Grid edits return a **new** grid; they never mutate. This is what makes the whole engine testable and is the property the verify hook enforces.

**Slots are derived, never stored.** Words, numbers, and required hints are always *computed from the cells*. They are not tracked by the UI or written to the database as source of truth. This is the single most important architectural rule in the epic — it is why grid edits in phase 1 can't desync the words from the letters.

**The `Puzzle` artifact.** `Puzzle` holds only inputs: geometry plus answer
letters (`grid`), authored hint text (`hints`), and the builder's `phase`.
Everything else — slots, numbers, required hints, whether hints are complete,
whether a player's entry is correct — is derived by function call. Hints are
keyed by a string like `"3-across"` rather than by `Coord`, since object keys
fail on structural equality (see Story C).

**Play reuses this.** A play session is `{ puzzle, entries }`, where `entries`
is a `Grid` with the same geometry and the player's letters. Correctness is a
comparison between the two grids, never a stored flag. Because grids are
immutable, many players can share one answer grid safely. This is why the
cursor functions in Group F take `(grid, cursor, ...)` and never a `Puzzle` —
the same functions serve a builder typing answers and a player typing guesses.

---

## Non-goals for this epic (explicitly later)

- Rendering the grid in React; focus rings; the visual "what remains" feedback.
- The keyboard/mouse event layer that *translates* physical events into engine calls (the cursor **rules** are in scope; the DOM plumbing is not).
- Persistence, auth, multiple-in-progress puzzles, publishing, play/solve tracking.
- Clue-writing UI and hint text storage (we derive the *required hint slots*; storing their content is later).
- Dictionary/fill assistance, autofill, word validity against a wordlist.

---

## Definition of done (epic-level)

A story is done when:

1. Its acceptance examples are encoded as unit tests and pass.
2. `tsc --noEmit` is clean (types are a free verifier — lean on them).
3. Lint is clean.

The `verify` hook for this module runs exactly: `tsc --noEmit` → `eslint` → `vitest run`. That hook is the agent's verifier — it self-corrects against it before returning work to you.

---

## Story Group A — Symmetry

Rotational (180°) symmetry is the NYT default. It is enforced as an **assist and a checkable property**, not baked into the `Grid` type as a hard constraint (the app must still support flexible/asymmetric grids for mini/midi and experimentation).

For an `R × C` grid, the counterpart of `(col, row)` is `(C-1-col, R-1-row)`.

### A1 — `symmetricCounterpart(grid, coord) -> Coord`
- `(0,0)` on 15×15 → `(14,14)`
- `(3,0)` on 15×15 → `(11,14)`
- `(7,7)` on 15×15 → `(7,7)` (center is its own counterpart on odd dimensions)
- Even dimension (e.g. 6×6): no cell is its own counterpart; `(2,2)` → `(3,3)`

### A2 — `isSymmetric(grid) -> boolean`
- Black at `(0,0)` and `(14,14)`, all else active → `true`
- Black at `(0,0)` only → `false`
- Fully active grid → `true` (vacuously)

### A3 — `toggleBlackSymmetric(grid, coord) -> Grid`
Sets `coord` black/active **and mirrors the change to its counterpart**, returning a new grid. This is the phase-1 assist that keeps the builder symmetric by default.
- Toggling `(0,0)` black on an all-active 15×15 → new grid with `(0,0)` and `(14,14)` black; original grid unchanged (purity).
- Toggling the center `(7,7)` → only `(7,7)` changes (self-counterpart).

---

## Story Group B — Slot Extraction

A **slot** is a maximal run of ≥2 contiguous active cells in one direction, bounded by a black cell or the grid edge. Single isolated active cells produce no slot.

> Length policy note: minimum-length rules (e.g. "no 2-letter words") are a **separate, configurable validator**, not part of extraction. Extraction finds runs of ≥2; a policy check can later flag runs below your chosen minimum.

### B1 — `extractSlots(grid) -> Slot[]`
Returns all across and down slots in reading order.

- Row 0 with cols 0–9 active, col 10 black, cols 11–14 active → **two** ACROSS slots on row 0: `start (0,0)` length 10, and `start (11,0)` length 4.
- A lone active cell surrounded by black → produces **no** slot.
- Fully active 15×15 → 15 across slots + 15 down slots, each length 15 (30 total).
- Purity: called twice on the same grid → deep-equal results.

---

## Story Group C — Numbering

A cell is numbered if it **starts** an across slot, a down slot, or both. The same number serves both entries. Numbers are assigned by scanning top-to-bottom, left-to-right, incrementing each time a cell starts ≥1 slot.

Numbered cells are exactly the start cells of the slots returned by
`extractSlots`. Numbering derives from Story B's output rather than
re-deriving run boundaries: collect every slot's `start`, sort in reading
order, dedupe, and assign 1..n. This makes "an across and a down slot starting
at the same cell share a number" structurally true rather than merely tested.

### C1 — `numberGrid(grid) -> readonly { coord: Coord; number: number }[]`

Returned in reading order. `Map<Coord, number>` will not work: `Coord` is an
object type and `Map` keys by reference identity, so a structurally equal but
distinct coord never matches. An ordered list also lets the "strictly increasing,
no gaps" and "count of distinct numbers" criteria below be asserted directly.
A `numberAt(col, row)` accessor over the list is optional convenience.
- Top-left `(0,0)` active with active right and down neighbors → numbered `1`, shared by 1-Across and 1-Down.
- A cell whose left neighbor is active but whose top neighbor is black, with an active cell below → starts a **down-only** slot, still gets its own number.
- Numbers strictly increase in reading order with no gaps.
- Count of distinct numbers == count of cells that start ≥1 slot.

### C2 — `slotsWithNumbers(grid) -> Slot[]`
Convenience combiner: `extractSlots` results annotated with the number from `numberGrid`, so each `Slot.number` matches its start cell's number.
- The ACROSS slot starting at the cell numbered `1` has `Slot.number === 1`.
- An across and a down slot starting at the same cell share the same `number`.

---

## Story Group D — Hint Derivation

Required hints fall directly out of the slots. This is your step-5 auto-generation.

### D1 — `requiredHints(grid) -> { across: HintRef[]; down: HintRef[] }`
Where `HintRef = { number, orientation }`, one per slot, keyed by the slot's start-cell number.

- Grid with 30 across slots + 32 down slots → `across.length === 30`, `down.length === 32`, 62 total.
- The across slot at numbered cell `1` → yields `{ number: 1, orientation: 'across' }`.
- `requiredHints` count always equals `extractSlots` count.

### D2 — `hintsComplete(puzzle) -> boolean`
Returns whether **every** required hint derived from `puzzle.grid` has non-blank
text in `puzzle.hints`, keyed by `hintKey`. Takes the whole `Puzzle` rather than
`(grid, hints)` so the two cannot be mismatched — one puzzle's grid against
another's hints.
- All 62 filled → `true`
- One blank → `false`
- Extra authored text for a hint that no longer corresponds to a slot → ignored (does not make it complete or block completeness).

---

## Story Group G — Letter Writes

The engine cannot currently construct a grid containing a letter: `createGrid`
sets every active cell to `letter: null` and nothing else writes one. E3's
`applyLetterEdit` and F1's `place` both need this, so it is its own story.

### G1 — `withLetter(grid, coord, letter) -> Grid`
Returns a new grid with one cell's letter changed, sharing every unchanged cell
by reference (structural sharing — a 50×50 edit allocates arrays, not 2,500
cells).
- Writing to an active cell → new grid has the letter; original unchanged.
- `letter: null` clears the cell.
- Behavior at a black or off-grid coord is undecided; settle it when the story
  is drafted.

### G2 — `toggleBlackSymmetric` preserves letters
It currently rebuilds via `createGrid`, discarding all letters. This was
harmless only while no grid could hold a letter. G1 ends that, so the fix lands
in the same story.
- A grid with letters, toggle a black square → every letter outside the two
  toggled cells survives.

---

## Story Group E — Phase Lock

Two phases: `'grid'` (phase 1) and `'hints'`. Entering hints **freezes geometry** (the black/active pattern) — which freezes the slot set and numbering — while still allowing letter edits. This is what keeps the hint list from desyncing.

### E1 — Geometry edits gated by phase
- `applyGeometryEdit(puzzle, coord, black)` — allowed only in `'grid'` phase; recomputes slots/numbers. In `'hints'` phase it is **rejected**, returning an error and the unchanged puzzle.

### E2 — `enterHintsPhase(puzzle) -> Puzzle`
- Transitions `phase` to `'hints'` and attaches the required-hint skeleton
  (blank content). It does **not** snapshot the slot set or numbering:
  geometry is frozen in this phase, so `extractSlots(grid)` already returns the
  same result forever. Storing a snapshot would duplicate that guarantee by
  storing derived data, which the "slots are derived, never stored" rule
  forbids.
- Test assertion, not a stored field: after the transition, `extractSlots` of
  the puzzle's grid equals `extractSlots` of the grid at transition time.

### E3 — Letter edits in the hints phase
- `applyLetterEdit(puzzle, coord, letter)` — allowed in **both** phases; changes only the letter in an active cell.
- Hints phase, change letter at `(1,0)` from `I` to `Y` (same slot lengths) → **accepted** (your `LIANS → LIONS` case).
- Hints phase, attempt to blacken `(4,0)`, which would shorten the 5-cell across slot at `(0,0)` to 4 → **rejected**, puzzle unchanged (your `LIONS → LYER` case: it's a geometry edit, not a letter edit).

> The key reframing baked in here: "LYER" isn't a letter edit that fails — it's a *geometry* edit (blackening a cell), and geometry is frozen. Model the two edit kinds separately and the rule enforces itself.

---

## Story Group F — Cursor / Navigation

The **rules** of cursor movement live in the engine as pure functions over `(grid, CursorState, intent) -> (grid?, CursorState)`. The DOM/event layer that fires these is later UI work.

Policy decisions declared here (each is a choice; once chosen it's an engine rule):
- **Advance stops at the edge / end of run** — it does not wrap and does not auto-jump into the next slot. (Auto-jump to next word on completion is a deferred enhancement.)
- **Movement skips black cells' role by stopping**: if the next physical cell in the orientation is black or off-grid, the cursor stays put.
- **Clicks only land on active cells**; clicking a black cell is a no-op.
- **Cursor functions take `(grid, cursor, ...)`, never a `Puzzle`** — this is
  what lets the builder and the player share them unchanged.

### F1 — `place(grid, cursor, letter) -> { grid, cursor }`
Writes `letter` into the current active cell, then advances one active cell in the current orientation.
- `orientation 'across'`, current `(0,0)`, `place('A')` → `'A'` at `(0,0)`, cursor `(1,0)`. *(your `{1,1}` → `{2,1}`)*
- `orientation 'down'`, current `(0,0)`, `place('A')` → `'A'` at `(0,0)`, cursor `(0,1)`.
- Place at the last active cell in the orientation (edge or before a black) → letter written, cursor **stays**.

### F2 — `arrowKey(grid, cursor, direction) -> cursor`
`direction ∈ up|down|left|right`. Sets orientation to the direction's axis (left/right → across, up/down → down), then moves one active cell that way.
- current `(0,0)`, `arrowKey('down')` → orientation `'down'`, cursor `(0,1)`. *(your `{1,1}` down-arrow → `{1,2}`)*
- current `(0,0)`, `arrowKey('right')` → orientation `'across'`, cursor `(1,0)`.
- Move blocked by edge or black cell → orientation still updates, cursor stays.

### F3 — `deleteAt(grid, cursor) -> { grid, cursor }`
Backspace behavior:
- Current cell **has** a letter → clear it, cursor **stays**.
- Current cell is **already empty** → retreat one active cell in the current orientation and clear **that** cell; cursor moves there.

Sequenced example (your `{5,5}` horizontal case):
- current `(4,4)` holds `X`, orientation `'across'`, `deleteAt` → `(4,4)` cleared, cursor stays `(4,4)`.
- `deleteAt` again ( `(4,4)` now empty ) → retreat to `(3,4)`, clear it, cursor `(3,4)`. *(your `{5,5}` → `{4,5}`)*
- At the first cell of a run with nothing to retreat into → cursor stays, nothing cleared.

### F4 — `moveTo(grid, cursor, coord) -> cursor`
Mouse/trackpad click.
- Click an active cell → cursor moves there, orientation unchanged.
- Click a black cell → no-op (cursor unchanged).

---

## Suggested build order

1. **Data model + accessors + Group A (symmetry).** Establishes types and the
   purity discipline. *(done)*
2. **Group B (slot extraction)** — everything downstream reads slots. *(done)*
3. **Group C (numbering)** — depends on B. *(done)*
4. **Group D (hint derivation)** — depends on B + C. Needs no letters.
5. **Group G (letter writes)** — `withLetter`, the missing primitive. Blocks
   both E and F.
6. **Group E (phase lock)** and **Group F (cursor/navigation)** — these two can
   run in parallel, but only after G. An earlier version of this epic said F
   could run in parallel with B–E; that was wrong, because F1 and F3 both
   return new grids with letters in them.

Write each story's acceptance examples as tests *first* — the examples above are
close to test cases already — then let the agent make them pass under the
`verify` hook.
