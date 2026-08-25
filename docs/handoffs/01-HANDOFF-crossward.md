# Crossward — Handoff

Current state of the crossword-builder project, for an agent or collaborator
picking it up fresh. Read alongside `01-grid-engine-epic.md` and `AGENTS.md`,
which remain authoritative for scope and behavior. This document covers what has
actually happened and the decisions that live only in conversation.

Repo: `crossward-raptor`. Branch `main`. Nothing pushed to a remote.

---

## Where things stand

**Story A (grid data model + rotational symmetry) is complete and committed.**
`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, 10/10 tests passing.

**Story B (slot extraction) is written but not started.** Its test file does not
exist yet. Stories C through F exist only as the epic's story groups.

### What exists

```
src/engine/
  grid.ts             types + createGrid + at()
  symmetry.ts         symmetricCounterpart, isSymmetric, toggleBlackSymmetric
  symmetry.test.ts    the Story A specification — do not edit
.claude/settings.json permission gates, committed
eslint.config.mjs     includes the engine boundary rule
vitest.config.mts     note the .mts extension
docs/stories/         story files + handoffs, tracked as of Story B
```

### The gate

`npm run verify` → `tsc --noEmit && npm run lint && vitest run`.

It has been proven in both directions: green on a trivial passing test, and red
for the right reason (missing modules) before Story A was implemented. It is a
demonstrated fact, not an assumption. Keep it that way.

---

## Decisions made in conversation, not in the epic

These are binding and are not recorded anywhere else.

### 1. `at()` returns `Cell | { kind: 'outside' }`

The epic left out-of-bounds behavior undefined. It is now defined: `at()` never
throws, and any coordinate outside `[0, cols) × [0, rows)` — including negatives —
returns `{ kind: 'outside' }`.

`Cell` itself stays two-variant (`black` | `active`); only the *lookup result*
widens. Storage and rendering never see a state that cannot reach them.

**Why not a black sentinel:** later stories treat "black or off-grid" identically
for movement and slot boundaries, so a sentinel would have worked. But it makes
"black" mean two different things and relies on every future author remembering
that. The discriminated union makes the compiler remember instead.

**This is already paying off.** In Story B, a slot boundary is the single test
`at(col, row).kind !== 'active'` — no separate bounds check anywhere in the
module.

### 2. `Cell.letter` is `readonly`

Added after Story A shipped. `at()` returns a reference to the stored cell, so
without it a consumer could write through the accessor and mutate the grid —
defeating the purity discipline the whole engine rests on.

Consequence for Story F: `applyLetterEdit` must construct a new `Cell` rather than
assign to one. That is what purity requires anyway.

### 3. `createGrid` does not validate its inputs

Out-of-range coordinates in `black` throw a `TypeError` from array indexing.
`cols`/`rows` below 1 are not checked. This is deliberate under AGENTS.md rule 2
(no error handling for impossible states) — these are caller bugs, not user
states. Do not add validation without being asked.

### 4. Slot ordering (Story B)

`extractSlots` returns **all across slots first, then all down slots**, each group
in reading order by start cell. The epic did not specify this. It is now an engine
rule because the tests assert it.

Chosen over interleaving because it makes Story C's "an across and a down slot
starting at the same cell share a number" much easier to assert.

### 5. `Slot` has no `number` field

The epic's illustrative type carries one. Story B's does not — numbering is Story
C, and a field holding a placeholder is worse than no field. Story C introduces
`NumberedSlot = Slot & { readonly number: number }` and leaves `Slot` alone.

### 6. `docs/stories` and `.claude/skills` are tracked

Both were untracked until the Story B spec commit — `/docs/stories` was in
`.gitignore` and `.claude/skills/` had simply never been added. Story A's file
was force-added, which hid the problem.

Consequences that had gone unnoticed: story amendments left no history, the
`/story` skill could change without appearing in `git status`, and a completed
story would commit tests and implementation while silently omitting the
specification they were written against.

Story B's file is committed post-amendment, so its first tracked version already
has the 0-row bullet removed and the down-slot ordering rule added.

### 7. `Puzzle` lives in the engine, and `phase` lives on it for now

Build and play are two consumers of one engine, so the engine owns what a
puzzle is — otherwise each UI grows its own version and they drift.

Strictly, `phase` is builder-session state: a published puzzle has no phase and
the player never sees one. The clean split is `Puzzle` (the artifact) wrapped in
`Draft = { puzzle, phase }`. That split is deliberately deferred — it is
speculative structure for a mode not yet being built, and the refactor is
mechanical. When play arrives, the move is to split, **not** to bolt solver
entries onto an editing type.

### 8. Grid size is never assumed

Sunday grids are 21×21 and novelty grids may go larger. No engine
implementation may hardcode a dimension; dimensions come from the grid. Story
fixtures may use 15×15 freely, but from Story D onward each story's tests
include at least one acceptance example run at a second size.

---

## Known issues to address before the story that hits them

### `numberGrid(grid) -> Map<Coord, number>` will not work as written

`Coord` is an object type and `Map` keys by reference identity, so
`map.get({ col: 0, row: 0 })` will never find an entry inserted with a
structurally equal but distinct object.

Fix before writing Story C's tests. Options: a string key (`"col,row"`), a nested
array, or a `numberAt(col, row)` accessor. The accessor is most consistent with
`Grid.at()`.

### `toggleBlackSymmetric` discards letters

It rebuilds the grid by collecting black coordinates and calling `createGrid`,
which sets every active cell to `letter: null`.

This is harmless **today** because `createGrid` has no way to accept letters, so
no grid in the system can have a letter to lose. The real finding is that the
engine cannot yet express "a grid with letters," and Stories E and F both need
that.

This is now Story G2, and lands in the same commit as `withLetter` (G1).

---

## How work gets done here

The method matters as much as the code. Full rationale is in the conventions doc
from the sibling project; the operative rules:

### The tests are the specification

Acceptance test files are provided with each story and are **never edited** to
match an implementation. If a test seems wrong, stop and say so — do not adjust
it.

### The human owns the tests; the agent owns the implementation

If one session produces both the specification and the code satisfying it, the
gate closes on nothing. The workable split: an agent may *draft* a test file in
its own session, the human reviews and edits it, and a **fresh** session
implements against the reviewed version.

### Negative definition-of-done items

Where a story's guardrail is a rule that fires on bad input, the DoD requires
demonstrating the failure and **reporting the error text**, not observing a clean
run. "Lint passed" proves nothing when the rule matches zero files.

The engine boundary rule was proven this way during Story A. It fires on a
`react` import in `src/engine/`. No need to re-demonstrate it each story.

### Review order, after any implementation

1. `git diff` on the test files is empty. If the specification moved, nothing else
   matters.
2. Run `verify` yourself rather than reading that it was run.
3. `git status` for files nobody asked for.
4. Read the implementation — looking for invented scope, and for special-case
   branches that handle one named test where the general rule would have covered
   it. Both pass the gate; neither is caught by automation.

### The `/story` skill

`.claude/skills/story/SKILL.md` encodes the loop: read the story, implement,
verify until green, confirm no test file changed, commit without pushing, report.
It refuses to run when the story's test file is untracked or has uncommitted
changes, since `git diff` cannot detect edits to a file git isn't watching —
the human commits the reviewed tests first. It deliberately does not include
the human review step.

---

## Suggested next steps

1. **Story D (hint derivation)** — depends on B + C, both done. Needs no
   letters. Include a second-size acceptance example per decision 8.
2. **Story G (letter writes)** — `withLetter` plus the
   `toggleBlackSymmetric` fix. Blocks E and F.
3. **Stories E and F** — parallel-safe once G lands, not before.

---

## Things worth knowing that cost time to learn

- `vitest.config.ts` gets loaded as CommonJS when `package.json` has no
  `"type": "module"`, warning on every run. Hence `.mts`. Do not set
  `"type": "module"` instead — that changes resolution for the whole Next.js
  project.
- `tsc --noEmit` typechecks the entire project regardless of Vitest's include
  glob. A stray test file anywhere under the repo will fail the gate.
- `src/app/` is Next.js route space. The engine belongs at `src/engine/`, and the
  lint boundary rule targets that exact path — a file in the wrong directory is
  silently unprotected.
- Claude Code writes its own "don't ask again" approvals to
  `.claude/settings.local.json`, which is gitignored. That is expected. The point
  of committing `settings.json` is that a change to the actual policy shows up in
  `git status` rather than taking effect silently.
- Permission rules merge across scopes and a deny rule can never be cancelled by
  an allow rule, which is what makes the deny list meaningful.
